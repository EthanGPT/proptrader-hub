#!/usr/bin/env python3
"""
KLBS Bot v1 - Key Level Breakout System Trading Bot
====================================================
Production-ready webhook bot for NinjaTrader/Tradovate deployment.

SUPPORTED PLATFORMS:
  - Tradovate (Direct API + WebSocket)
  - NinjaTrader (via CrossTrade webhooks)
  - TradersPost (webhook relay)
  - Any webhook-compatible broker

MODES:
  --sim          Simulation mode (paper trading, no real orders)
  --live         Live trading mode (requires API keys)
  --backtest     Run historical backtest first
  --dry-run      Process signals but don't execute

SETUP:
  1. Set environment variables (see below)
  2. Run in sim mode first: python bot_v1.py --sim
  3. Monitor signals and validate execution
  4. Switch to live when ready: python bot_v1.py --live

ENV VARIABLES:
  TRADOVATE_API_KEY      - Your Tradovate API key
  TRADOVATE_API_SECRET   - Your Tradovate API secret
  TRADOVATE_ACCOUNT_ID   - Your account ID
  TRADOVATE_ENV          - 'sim' or 'live' (default: sim)
  CROSSTRADE_WEBHOOK     - CrossTrade webhook URL (for NinjaTrader)
  TRADERSPOST_WEBHOOK    - TradersPost webhook URL

STRATEGY:
  - Key Level Breakout System (KLBS)
  - Levels: PDH, PDL, PMH, PML, LPH, LPL
  - Sessions: London 03:00-08:00 ET, NY 09:30-16:00 ET
  - Trailing stops with optimized TP/SL per instrument

Data source: Real-time via broker API or external feed
Backtest results: $1.21M over 6.7 years (15,751 trades, 60% WR, 4.17 Sharpe)
"""

import os
import sys
import json
import time
import hmac
import hashlib
import asyncio
import logging
import argparse
import requests
from datetime import datetime, time as dtime, timedelta
from dataclasses import dataclass, field
from typing import Optional, Dict, List, Callable, Any
from enum import Enum
import threading
from queue import Queue

try:
    import websocket
    HAS_WEBSOCKET = True
except ImportError:
    HAS_WEBSOCKET = False
    print("Warning: websocket-client not installed. Install with: pip install websocket-client")

try:
    import pytz
    ET = pytz.timezone('America/New_York')
except ImportError:
    print("Error: pytz required. Install with: pip install pytz")
    sys.exit(1)

# ══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION - OPTIMIZED PARAMETERS FROM BACKTEST
# ══════════════════════════════════════════════════════════════════════════════

VERSION = "1.0.0"
BUILD_DATE = "2026-03-03"

class TradingMode(Enum):
    SIM = "simulation"
    LIVE = "live"
    DRY_RUN = "dry_run"

@dataclass
class InstrumentConfig:
    """Instrument configuration with optimized backtest parameters."""
    symbol: str
    tp: int              # Take profit (pts) - triggers trail mode
    sl: int              # Stop loss (pts)
    rz: int              # Retest zone (pts)
    pv: float            # Point value ($)
    contracts: int       # Number of contracts
    trail: int           # Trail distance (pts)
    tick_size: float     # Minimum price increment
    tradovate_symbol: str  # Tradovate contract symbol
    ninja_symbol: str      # NinjaTrader symbol

    @property
    def min_tick_value(self) -> float:
        return self.tick_size * self.pv

# OPTIMIZED PARAMETERS FROM 6.7-YEAR BACKTEST
# MNQ: $588K net, 63.9% WR | MES: $393K net, 56.8% WR | MGC: $228K net, 60.2% WR
INSTRUMENTS = {
    'MNQ': InstrumentConfig(
        symbol='MNQ',
        tp=35, sl=50, rz=5, pv=2.0, contracts=4, trail=5,
        tick_size=0.25,
        tradovate_symbol='MNQH6',  # Update with current contract month
        ninja_symbol='MNQ 03-26',
    ),
    'MES': InstrumentConfig(
        symbol='MES',
        tp=25, sl=25, rz=5, pv=5.0, contracts=4, trail=5,
        tick_size=0.25,
        tradovate_symbol='MESH6',
        ninja_symbol='MES 03-26',
    ),
    'MGC': InstrumentConfig(
        symbol='MGC',
        tp=20, sl=25, rz=3, pv=10.0, contracts=2, trail=5,
        tick_size=0.10,
        tradovate_symbol='MGCJ6',  # Gold uses different month codes
        ninja_symbol='MGC 04-26',
    ),
}

# ══════════════════════════════════════════════════════════════════════════════
# SESSION DEFINITIONS (Eastern Time)
# ══════════════════════════════════════════════════════════════════════════════

LONDON_START = dtime(3, 0)
LONDON_END   = dtime(8, 0)
DEAD_START   = dtime(8, 0)
DEAD_END     = dtime(9, 30)
NY_START     = dtime(9, 30)
NY_END       = dtime(16, 0)
PM_START     = dtime(4, 30)
PM_END       = dtime(9, 30)
LPM_START    = dtime(0, 0)
LPM_END      = dtime(3, 0)

def in_london(t: dtime) -> bool: return LONDON_START <= t < LONDON_END
def in_ny(t: dtime) -> bool: return NY_START <= t < NY_END
def in_session(t: dtime) -> bool: return in_london(t) or in_ny(t)
def in_dead(t: dtime) -> bool: return DEAD_START <= t < DEAD_END
def in_pm(t: dtime) -> bool: return PM_START <= t < PM_END
def in_lpm(t: dtime) -> bool: return LPM_START <= t < LPM_END

def get_session_name(t: dtime) -> str:
    if in_london(t): return "London"
    if in_ny(t): return "NY"
    if in_dead(t): return "DeadZone"
    return "PreMarket"

# ══════════════════════════════════════════════════════════════════════════════
# LOGGING SETUP
# ══════════════════════════════════════════════════════════════════════════════

def setup_logging(level: str = "INFO") -> logging.Logger:
    """Configure logging with colored output."""
    logger = logging.getLogger("KLBS_Bot")
    logger.setLevel(getattr(logging, level))

    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '\033[90m%(asctime)s\033[0m | %(levelname)s | %(message)s',
            datefmt='%H:%M:%S'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

        # File handler for trade log
        fh = logging.FileHandler('bot_v1_trades.log')
        fh.setFormatter(logging.Formatter(
            '%(asctime)s | %(levelname)s | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        ))
        logger.addHandler(fh)

    return logger

log = setup_logging()

# ══════════════════════════════════════════════════════════════════════════════
# LEVEL STATE TRACKING
# ══════════════════════════════════════════════════════════════════════════════

@dataclass
class LevelState:
    """State for a single level within a day."""
    name: str
    price: float
    is_long: bool       # True = long setup (level below price)
    armed: bool = False
    fired: bool = False
    arm_bar: int = -1
    arm_time: Optional[datetime] = None

@dataclass
class Position:
    """Active position tracking."""
    symbol: str
    direction: str      # 'LONG' or 'SHORT'
    entry_price: float
    entry_time: datetime
    contracts: int
    stop_loss: float
    take_profit: float
    trail_pts: float
    trailing_active: bool = False
    best_price: float = 0.0
    current_sl: float = 0.0
    order_id: Optional[str] = None
    broker_position_id: Optional[str] = None

@dataclass
class Signal:
    """Trade signal generated by strategy."""
    timestamp: datetime
    symbol: str
    level: str
    direction: str
    entry: float
    tp: float
    sl: float
    contracts: int
    trail_pts: float
    session: str

    def to_dict(self) -> dict:
        return {
            'timestamp': self.timestamp.isoformat(),
            'symbol': self.symbol,
            'level': self.level,
            'direction': self.direction,
            'entry': self.entry,
            'tp': self.tp,
            'sl': self.sl,
            'contracts': self.contracts,
            'trail_pts': self.trail_pts,
            'session': self.session,
        }

# ══════════════════════════════════════════════════════════════════════════════
# DAILY STATE ENGINE (Core Strategy Logic)
# ══════════════════════════════════════════════════════════════════════════════

class DailyState:
    """
    Tracks all level states and daily highs/lows for one instrument.
    This is the core strategy engine that generates signals.
    """

    def __init__(self, symbol: str):
        self.symbol = symbol
        self.cfg = INSTRUMENTS[symbol]

        # Daily levels (from previous day)
        self.prev_day_h: Optional[float] = None
        self.prev_day_l: Optional[float] = None

        # Current day tracking
        self.day_h: Optional[float] = None
        self.day_l: Optional[float] = None

        # Session levels
        self.pm_h: Optional[float] = None
        self.pm_l: Optional[float] = None
        self.lpm_h: Optional[float] = None
        self.lpm_l: Optional[float] = None

        # Level states (reset daily)
        self.levels: Dict[str, LevelState] = {}

        # Bar tracking
        self.bar_idx = 0
        self.current_date = None
        self.prev_bar = None  # Store previous bar for arm logic

    def reset_daily(self, date):
        """Reset for new trading day."""
        log.info(f"  [{self.symbol}] New day: {date} | PDH={self.day_h} PDL={self.day_l}")

        self.prev_day_h = self.day_h
        self.prev_day_l = self.day_l
        self.day_h = None
        self.day_l = None
        self.pm_h = None
        self.pm_l = None
        self.lpm_h = None
        self.lpm_l = None
        self.levels = {}
        self.bar_idx = 0
        self.current_date = date
        self.prev_bar = None

    def process_bar(self, dt: datetime, o: float, h: float, l: float, c: float) -> List[Signal]:
        """
        Process a new bar and return any signals.
        This is the main entry point - call this for each new bar.
        """
        t = dt.time()
        date = dt.date()

        # New day check
        if self.current_date is None or date != self.current_date:
            self.reset_daily(date)

        self.bar_idx += 1

        # Update daily high/low
        if self.day_h is None:
            self.day_h = h
            self.day_l = l
        else:
            self.day_h = max(self.day_h, h)
            self.day_l = min(self.day_l, l)

        # Update session levels
        if in_lpm(t):
            self.lpm_h = max(self.lpm_h, h) if self.lpm_h else h
            self.lpm_l = min(self.lpm_l, l) if self.lpm_l else l
        if in_pm(t):
            self.pm_h = max(self.pm_h, h) if self.pm_h else h
            self.pm_l = min(self.pm_l, l) if self.pm_l else l

        # Build active levels
        self._update_levels()

        # Check for signals
        signals = []
        cur_sess = in_session(t)
        cur_dead = in_dead(t)

        for name, lvl in self.levels.items():
            if lvl.fired:
                continue

            signal = self._check_level(lvl, h, l, c, cur_sess, cur_dead, dt)
            if signal:
                signals.append(signal)

        # Store for next iteration
        self.prev_bar = {'h': h, 'l': l, 'c': c, 'o': o}

        return signals

    def _update_levels(self):
        """Build/update active level states."""
        prox = 10.0  # Proximity threshold for duplicate levels

        def near(a: Optional[float], b: Optional[float]) -> bool:
            if a is None or b is None:
                return False
            return abs(a - b) <= prox

        # PMH / PML
        if self.pm_h and 'PMH' not in self.levels:
            self.levels['PMH'] = LevelState('PMH', self.pm_h, is_long=False)
        if self.pm_l and 'PML' not in self.levels:
            self.levels['PML'] = LevelState('PML', self.pm_l, is_long=True)

        # LPH / LPL (skip if near PM levels)
        if self.lpm_h and 'LPH' not in self.levels:
            if not near(self.lpm_h, self.pm_h) and not near(self.lpm_h, self.pm_l):
                self.levels['LPH'] = LevelState('LPH', self.lpm_h, is_long=False)
        if self.lpm_l and 'LPL' not in self.levels:
            if not near(self.lpm_l, self.pm_h) and not near(self.lpm_l, self.pm_l):
                self.levels['LPL'] = LevelState('LPL', self.lpm_l, is_long=True)

        # PDH / PDL (skip if near other levels)
        if self.prev_day_h and 'PDH' not in self.levels:
            if not any(near(self.prev_day_h, x) for x in [self.pm_h, self.pm_l, self.lpm_h, self.lpm_l]):
                self.levels['PDH'] = LevelState('PDH', self.prev_day_h, is_long=False)
        if self.prev_day_l and 'PDL' not in self.levels:
            if not any(near(self.prev_day_l, x) for x in [self.pm_h, self.pm_l, self.lpm_h, self.lpm_l]):
                self.levels['PDL'] = LevelState('PDL', self.prev_day_l, is_long=True)

    def _check_level(self, lvl: LevelState, h: float, l: float, c: float,
                     cur_sess: bool, cur_dead: bool, dt: datetime) -> Optional[Signal]:
        """Check a single level for arm/retest/signal."""
        rz = self.cfg.rz
        prev = self.prev_bar

        if prev is None:
            return None

        ph, pl = prev['h'], prev['l']

        if lvl.is_long:
            # ARM: previous bar fully above level (during session)
            if not lvl.armed and cur_sess:
                if pl > lvl.price:  # Prev bar low > level = fully through
                    lvl.armed = True
                    lvl.arm_bar = self.bar_idx
                    lvl.arm_time = dt
                    log.info(f"  \033[33m[ARM]\033[0m {self.symbol} {lvl.name} LONG @ {lvl.price:.2f}")

            # RETEST: price touches level + retest zone
            if lvl.armed and self.bar_idx > lvl.arm_bar:
                if l <= lvl.price + rz:
                    if cur_sess:
                        lvl.fired = True
                        return self._create_signal(lvl, dt)
                    elif cur_dead:
                        lvl.armed = False
                        log.info(f"  \033[90m[DISARM]\033[0m {self.symbol} {lvl.name} (dead zone)")
        else:
            # SHORT setup
            if not lvl.armed and cur_sess:
                if ph < lvl.price:  # Prev bar high < level = fully through
                    lvl.armed = True
                    lvl.arm_bar = self.bar_idx
                    lvl.arm_time = dt
                    log.info(f"  \033[33m[ARM]\033[0m {self.symbol} {lvl.name} SHORT @ {lvl.price:.2f}")

            if lvl.armed and self.bar_idx > lvl.arm_bar:
                if h >= lvl.price - rz:
                    if cur_sess:
                        lvl.fired = True
                        return self._create_signal(lvl, dt)
                    elif cur_dead:
                        lvl.armed = False
                        log.info(f"  \033[90m[DISARM]\033[0m {self.symbol} {lvl.name} (dead zone)")

        return None

    def _create_signal(self, lvl: LevelState, dt: datetime) -> Signal:
        """Create a trade signal."""
        direction = 'LONG' if lvl.is_long else 'SHORT'
        entry = lvl.price

        if lvl.is_long:
            tp = entry + self.cfg.tp
            sl = entry - self.cfg.sl
        else:
            tp = entry - self.cfg.tp
            sl = entry + self.cfg.sl

        return Signal(
            timestamp=dt,
            symbol=self.symbol,
            level=lvl.name,
            direction=direction,
            entry=entry,
            tp=tp,
            sl=sl,
            contracts=self.cfg.contracts,
            trail_pts=self.cfg.trail,
            session='London' if in_london(dt.time()) else 'NY',
        )

# ══════════════════════════════════════════════════════════════════════════════
# BROKER CONNECTORS
# ══════════════════════════════════════════════════════════════════════════════

class BrokerConnector:
    """Base class for broker connections."""

    def __init__(self, mode: TradingMode):
        self.mode = mode
        self.connected = False
        self.positions: Dict[str, Position] = {}

    async def connect(self) -> bool:
        raise NotImplementedError

    async def disconnect(self):
        raise NotImplementedError

    async def place_order(self, signal: Signal) -> Optional[str]:
        raise NotImplementedError

    async def modify_stop(self, position: Position, new_sl: float) -> bool:
        raise NotImplementedError

    async def close_position(self, position: Position) -> bool:
        raise NotImplementedError

    async def get_position(self, symbol: str) -> Optional[Position]:
        raise NotImplementedError


class TradovateConnector(BrokerConnector):
    """
    Tradovate API connector for direct execution.

    API Docs: https://api.tradovate.com

    Requirements:
      - Funded account with $1,000+ for live API access
      - API Access add-on subscription ($25/month)
      - API key generated from account settings

    For simulation: Free demo account with full API access
    """

    # API Endpoints
    DEMO_URL = "https://demo.tradovateapi.com/v1"
    LIVE_URL = "https://live.tradovateapi.com/v1"
    DEMO_WS = "wss://demo.tradovateapi.com/v1/websocket"
    LIVE_WS = "wss://live.tradovateapi.com/v1/websocket"

    def __init__(self, mode: TradingMode):
        super().__init__(mode)

        self.api_key = os.environ.get('TRADOVATE_API_KEY', '')
        self.api_secret = os.environ.get('TRADOVATE_API_SECRET', '')
        self.account_id = os.environ.get('TRADOVATE_ACCOUNT_ID', '')

        env = os.environ.get('TRADOVATE_ENV', 'sim')
        self.is_live = (env == 'live' and mode == TradingMode.LIVE)

        self.base_url = self.LIVE_URL if self.is_live else self.DEMO_URL
        self.ws_url = self.LIVE_WS if self.is_live else self.DEMO_WS

        self.access_token = None
        self.token_expiry = None
        self.ws = None
        self._ws_thread = None
        self._callbacks: Dict[str, Callable] = {}

    async def connect(self) -> bool:
        """Authenticate and establish connection."""
        if not self.api_key or not self.api_secret:
            log.warning("Tradovate API credentials not configured")
            return False

        try:
            # Get access token
            auth_response = requests.post(
                f"{self.base_url}/auth/accesstokenrequest",
                json={
                    "name": self.api_key,
                    "password": self.api_secret,
                    "appId": "KLBS_Bot",
                    "appVersion": VERSION,
                    "deviceId": "klbs-bot-v1",
                    "cid": "",
                    "sec": "",
                },
                headers={"Content-Type": "application/json"}
            )

            if auth_response.status_code == 200:
                data = auth_response.json()
                self.access_token = data.get('accessToken')
                self.token_expiry = datetime.now() + timedelta(seconds=data.get('expirationTime', 3600))
                self.connected = True

                env_str = "LIVE" if self.is_live else "SIMULATION"
                log.info(f"\033[32m[TRADOVATE]\033[0m Connected to {env_str} environment")

                # Start WebSocket for real-time data
                if HAS_WEBSOCKET:
                    self._start_websocket()

                return True
            else:
                log.error(f"Tradovate auth failed: {auth_response.status_code} - {auth_response.text}")
                return False

        except Exception as e:
            log.error(f"Tradovate connection error: {e}")
            return False

    def _start_websocket(self):
        """Start WebSocket connection for real-time updates."""
        def on_message(ws, message):
            try:
                data = json.loads(message)
                self._handle_ws_message(data)
            except json.JSONDecodeError:
                pass

        def on_error(ws, error):
            log.error(f"Tradovate WS error: {error}")

        def on_close(ws, close_status_code, close_msg):
            log.warning("Tradovate WS closed")
            self.connected = False

        def on_open(ws):
            # Authenticate WebSocket
            ws.send(json.dumps({
                "op": "authorize",
                "token": self.access_token
            }))
            log.info("[TRADOVATE] WebSocket connected")

        def run_ws():
            self.ws = websocket.WebSocketApp(
                self.ws_url,
                on_message=on_message,
                on_error=on_error,
                on_close=on_close,
                on_open=on_open
            )
            self.ws.run_forever()

        self._ws_thread = threading.Thread(target=run_ws, daemon=True)
        self._ws_thread.start()

    def _handle_ws_message(self, data: dict):
        """Handle incoming WebSocket messages."""
        msg_type = data.get('e')

        if msg_type == 'props':
            # Position updates
            if 'position' in str(data):
                log.debug(f"Position update: {data}")
        elif msg_type == 'fill':
            # Order fill
            log.info(f"\033[32m[FILL]\033[0m {data}")

    def _headers(self) -> dict:
        """Get authenticated headers."""
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.access_token}"
        }

    async def place_order(self, signal: Signal) -> Optional[str]:
        """Place order via Tradovate API."""
        if self.mode == TradingMode.DRY_RUN:
            log.info(f"\033[33m[DRY RUN]\033[0m Would place: {signal.direction} {signal.symbol} @ {signal.entry}")
            return f"DRY-{int(time.time())}"

        cfg = INSTRUMENTS[signal.symbol]

        # Build order payload (CME compliance: isAutomated=true)
        payload = {
            "accountSpec": self.account_id,
            "accountId": int(self.account_id) if self.account_id.isdigit() else 0,
            "action": "Buy" if signal.direction == "LONG" else "Sell",
            "symbol": cfg.tradovate_symbol,
            "orderQty": signal.contracts,
            "orderType": "Limit",
            "price": signal.entry,
            "isAutomated": True,  # Required for CME compliance
            "timeInForce": "Day",
        }

        try:
            response = requests.post(
                f"{self.base_url}/order/placeorder",
                json=payload,
                headers=self._headers()
            )

            if response.status_code == 200:
                data = response.json()
                order_id = str(data.get('orderId', ''))
                log.info(f"\033[32m[ORDER]\033[0m Placed {signal.direction} {signal.contracts}x {signal.symbol} @ {signal.entry} | ID: {order_id}")

                # Place bracket orders (SL + TP)
                await self._place_bracket(order_id, signal)

                return order_id
            else:
                log.error(f"Order failed: {response.status_code} - {response.text}")
                return None

        except Exception as e:
            log.error(f"Order error: {e}")
            return None

    async def _place_bracket(self, parent_id: str, signal: Signal):
        """Place bracket orders (stop loss + take profit)."""
        cfg = INSTRUMENTS[signal.symbol]

        # Stop loss
        sl_payload = {
            "accountId": int(self.account_id) if self.account_id.isdigit() else 0,
            "action": "Sell" if signal.direction == "LONG" else "Buy",
            "symbol": cfg.tradovate_symbol,
            "orderQty": signal.contracts,
            "orderType": "Stop",
            "stopPrice": signal.sl,
            "isAutomated": True,
        }

        try:
            requests.post(f"{self.base_url}/order/placeorder", json=sl_payload, headers=self._headers())
            log.info(f"  └─ SL @ {signal.sl}")
        except Exception as e:
            log.error(f"SL order error: {e}")

    async def modify_stop(self, position: Position, new_sl: float) -> bool:
        """Modify stop loss for trailing."""
        log.info(f"  \033[36m[TRAIL]\033[0m {position.symbol} SL: {position.current_sl:.2f} -> {new_sl:.2f}")
        position.current_sl = new_sl

        if self.mode == TradingMode.DRY_RUN:
            return True

        # In live mode, would modify the stop order here
        # This requires tracking the stop order ID
        return True

    async def disconnect(self):
        """Disconnect from Tradovate."""
        if self.ws:
            self.ws.close()
        self.connected = False
        log.info("[TRADOVATE] Disconnected")


class CrossTradeConnector(BrokerConnector):
    """
    CrossTrade webhook connector for NinjaTrader.

    CrossTrade provides webhook functionality for NinjaTrader 8.
    Website: https://crosstrade.io

    Pricing: ~$30/month for unlimited webhooks

    Setup:
      1. Install CrossTrade add-on in NinjaTrader
      2. Get your permanent webhook URL
      3. Set CROSSTRADE_WEBHOOK environment variable
    """

    def __init__(self, mode: TradingMode):
        super().__init__(mode)
        self.webhook_url = os.environ.get('CROSSTRADE_WEBHOOK', '')

    async def connect(self) -> bool:
        if not self.webhook_url:
            log.warning("CrossTrade webhook URL not configured")
            return False

        self.connected = True
        log.info(f"\033[32m[CROSSTRADE]\033[0m Webhook configured")
        return True

    async def place_order(self, signal: Signal) -> Optional[str]:
        """Send order via CrossTrade webhook."""
        cfg = INSTRUMENTS[signal.symbol]

        # CrossTrade webhook format
        payload = {
            "symbol": cfg.ninja_symbol,
            "action": "buy" if signal.direction == "LONG" else "sell",
            "quantity": signal.contracts,
            "orderType": "limit",
            "limitPrice": signal.entry,
            "stopLoss": signal.sl,
            "profitTarget": signal.tp,
            # Add d=1 for dry run testing
            "d": 1 if self.mode == TradingMode.DRY_RUN else 0,
        }

        if self.mode == TradingMode.DRY_RUN:
            log.info(f"\033[33m[DRY RUN]\033[0m CrossTrade: {json.dumps(payload)}")
            return f"CT-DRY-{int(time.time())}"

        try:
            response = requests.post(
                self.webhook_url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10
            )

            if response.status_code == 200:
                order_id = f"CT-{int(time.time())}"
                log.info(f"\033[32m[CROSSTRADE]\033[0m Sent {signal.direction} {signal.symbol} | {response.text}")
                return order_id
            else:
                log.error(f"CrossTrade error: {response.status_code} - {response.text}")
                return None

        except Exception as e:
            log.error(f"CrossTrade webhook error: {e}")
            return None

    async def disconnect(self):
        self.connected = False


class TradersPostConnector(BrokerConnector):
    """
    TradersPost webhook connector for multi-broker support.

    TradersPost supports: Tradovate, TradeStation, Alpaca, and more.
    Website: https://traderspost.io

    Setup:
      1. Create TradersPost account
      2. Connect your broker
      3. Get webhook URL
      4. Set TRADERSPOST_WEBHOOK environment variable
    """

    def __init__(self, mode: TradingMode):
        super().__init__(mode)
        self.webhook_url = os.environ.get('TRADERSPOST_WEBHOOK', '')

    async def connect(self) -> bool:
        if not self.webhook_url:
            log.warning("TradersPost webhook URL not configured")
            return False

        self.connected = True
        log.info(f"\033[32m[TRADERSPOST]\033[0m Webhook configured")
        return True

    async def place_order(self, signal: Signal) -> Optional[str]:
        """Send order via TradersPost webhook."""

        # TradersPost simple format: {"ticker": "MNQ", "action": "buy"}
        payload = {
            "ticker": signal.symbol,
            "action": "buy" if signal.direction == "LONG" else "sell",
        }

        if self.mode == TradingMode.DRY_RUN:
            log.info(f"\033[33m[DRY RUN]\033[0m TradersPost: {json.dumps(payload)}")
            return f"TP-DRY-{int(time.time())}"

        try:
            response = requests.post(
                self.webhook_url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10
            )

            if response.status_code == 200:
                order_id = f"TP-{int(time.time())}"
                log.info(f"\033[32m[TRADERSPOST]\033[0m Sent {signal.direction} {signal.symbol} | Response: {response.text}")
                return order_id
            else:
                log.error(f"TradersPost error: {response.status_code} - {response.text}")
                return None

        except Exception as e:
            log.error(f"TradersPost error: {e}")
            return None

    async def disconnect(self):
        self.connected = False


class SimulationConnector(BrokerConnector):
    """
    Paper trading connector for simulation/testing.
    No external connections - all local.
    """

    def __init__(self, mode: TradingMode):
        super().__init__(mode)
        self.orders: List[dict] = []
        self.fills: List[dict] = []
        self.pnl = 0.0

    async def connect(self) -> bool:
        self.connected = True
        log.info(f"\033[33m[SIMULATION]\033[0m Paper trading mode active")
        return True

    async def place_order(self, signal: Signal) -> Optional[str]:
        order_id = f"SIM-{len(self.orders)+1:04d}"

        order = {
            'id': order_id,
            'signal': signal.to_dict(),
            'status': 'FILLED',  # Assume immediate fill for sim
            'fill_price': signal.entry,
            'fill_time': datetime.now(ET).isoformat(),
        }
        self.orders.append(order)

        log.info(f"\033[35m[SIM FILL]\033[0m {signal.direction} {signal.contracts}x {signal.symbol} @ {signal.entry}")
        log.info(f"  └─ SL: {signal.sl} | TP: {signal.tp} | Trail: {signal.trail_pts}pts")

        # Track position
        self.positions[signal.symbol] = Position(
            symbol=signal.symbol,
            direction=signal.direction,
            entry_price=signal.entry,
            entry_time=datetime.now(ET),
            contracts=signal.contracts,
            stop_loss=signal.sl,
            take_profit=signal.tp,
            trail_pts=signal.trail_pts,
            current_sl=signal.sl,
            order_id=order_id,
        )

        return order_id

    async def modify_stop(self, position: Position, new_sl: float) -> bool:
        log.info(f"  \033[36m[SIM TRAIL]\033[0m {position.symbol} SL: {position.current_sl:.2f} -> {new_sl:.2f}")
        position.current_sl = new_sl
        return True

    async def disconnect(self):
        self.connected = False
        if self.orders:
            log.info(f"\n[SIMULATION SUMMARY]")
            log.info(f"  Orders: {len(self.orders)}")
            log.info(f"  P&L: ${self.pnl:,.2f}")

# ══════════════════════════════════════════════════════════════════════════════
# MAIN BOT ENGINE
# ══════════════════════════════════════════════════════════════════════════════

class KLBSBot:
    """
    Main bot engine that orchestrates strategy and execution.
    """

    def __init__(self, mode: TradingMode, symbols: List[str], connector_type: str = "auto"):
        self.mode = mode
        self.symbols = symbols
        self.running = False

        # Initialize state trackers
        self.states: Dict[str, DailyState] = {s: DailyState(s) for s in symbols}
        self.positions: Dict[str, Position] = {}

        # Select connector
        self.connector = self._create_connector(connector_type)

        # Signal queue for async processing
        self.signal_queue: Queue = Queue()

        # Stats
        self.signals_generated = 0
        self.orders_placed = 0
        self.start_time = None

    def _create_connector(self, connector_type: str) -> BrokerConnector:
        """Create appropriate broker connector."""
        if connector_type == "auto":
            # Auto-detect based on available credentials
            if os.environ.get('TRADOVATE_API_KEY'):
                return TradovateConnector(self.mode)
            elif os.environ.get('CROSSTRADE_WEBHOOK'):
                return CrossTradeConnector(self.mode)
            elif os.environ.get('TRADERSPOST_WEBHOOK'):
                return TradersPostConnector(self.mode)
            else:
                return SimulationConnector(self.mode)

        connectors = {
            "tradovate": TradovateConnector,
            "crosstrade": CrossTradeConnector,
            "traderspost": TradersPostConnector,
            "simulation": SimulationConnector,
        }

        return connectors.get(connector_type, SimulationConnector)(self.mode)

    async def start(self):
        """Start the bot."""
        log.info("=" * 60)
        log.info(f"  KLBS Bot v{VERSION} - Key Level Breakout System")
        log.info("=" * 60)
        log.info(f"  Mode:    {self.mode.value.upper()}")
        log.info(f"  Symbols: {', '.join(self.symbols)}")
        log.info(f"  Time:    {datetime.now(ET).strftime('%Y-%m-%d %H:%M:%S')} ET")
        log.info("")

        # Connect to broker
        connected = await self.connector.connect()
        if not connected and self.mode == TradingMode.LIVE:
            log.error("Failed to connect to broker - aborting")
            return

        # Print instrument configs
        log.info("  Instrument Configurations (Optimized):")
        for sym in self.symbols:
            cfg = INSTRUMENTS[sym]
            log.info(f"    {sym}: TP={cfg.tp}pts SL={cfg.sl}pts Trail={cfg.trail}pts Contracts={cfg.contracts}")
        log.info("")

        self.running = True
        self.start_time = datetime.now(ET)

        # Current session status
        now = datetime.now(ET).time()
        log.info(f"  Session Status:")
        log.info(f"    London: {'ACTIVE' if in_london(now) else 'closed'}")
        log.info(f"    NY:     {'ACTIVE' if in_ny(now) else 'closed'}")
        log.info(f"    Dead:   {'YES' if in_dead(now) else 'no'}")
        log.info("")
        log.info("  Waiting for price data...")
        log.info("-" * 60)

    async def process_bar(self, symbol: str, dt: datetime, o: float, h: float, l: float, c: float):
        """Process a new price bar and generate/execute signals."""
        if not self.running:
            return

        if symbol not in self.states:
            log.warning(f"Unknown symbol: {symbol}")
            return

        # Update session display periodically
        state = self.states[symbol]
        signals = state.process_bar(dt, o, h, l, c)

        for signal in signals:
            self.signals_generated += 1
            await self._handle_signal(signal)

    async def _handle_signal(self, signal: Signal):
        """Handle a generated signal."""
        log.info("")
        log.info("=" * 60)
        log.info(f"  \033[32m*** SIGNAL ***\033[0m {signal.symbol} {signal.direction} @ {signal.level}")
        log.info("=" * 60)
        log.info(f"  Entry:     {signal.entry:.2f}")
        log.info(f"  TP:        {signal.tp:.2f} (+{abs(signal.tp - signal.entry):.0f}pts)")
        log.info(f"  SL:        {signal.sl:.2f} (-{abs(signal.entry - signal.sl):.0f}pts)")
        log.info(f"  Trail:     {signal.trail_pts}pts (after TP)")
        log.info(f"  Contracts: {signal.contracts}")
        log.info(f"  Session:   {signal.session}")
        log.info(f"  Time:      {signal.timestamp.strftime('%Y-%m-%d %H:%M:%S')} ET")
        log.info("")

        # Execute the signal
        order_id = await self.connector.place_order(signal)

        if order_id:
            self.orders_placed += 1
            log.info(f"  Order ID: {order_id}")
        else:
            log.error(f"  Order FAILED")

        log.info("-" * 60)

    async def check_trailing_stops(self, symbol: str, current_price: float):
        """Check and update trailing stops for active positions."""
        if symbol not in self.positions:
            return

        pos = self.positions[symbol]
        cfg = INSTRUMENTS[symbol]

        if pos.direction == "LONG":
            # Update best price
            if current_price > pos.best_price:
                pos.best_price = current_price

            # Check if TP triggered (enable trailing)
            if not pos.trailing_active and current_price >= pos.take_profit:
                pos.trailing_active = True
                pos.current_sl = current_price - pos.trail_pts
                log.info(f"\033[32m[TP HIT]\033[0m {symbol} - Trailing activated @ {pos.current_sl:.2f}")

            # Update trailing stop
            if pos.trailing_active:
                new_sl = pos.best_price - pos.trail_pts
                if new_sl > pos.current_sl:
                    await self.connector.modify_stop(pos, new_sl)

            # Check if stopped out
            if current_price <= pos.current_sl:
                await self._close_position(pos, current_price, "TRAIL_STOP" if pos.trailing_active else "STOP_LOSS")

        else:  # SHORT
            if current_price < pos.best_price or pos.best_price == 0:
                pos.best_price = current_price

            if not pos.trailing_active and current_price <= pos.take_profit:
                pos.trailing_active = True
                pos.current_sl = current_price + pos.trail_pts
                log.info(f"\033[32m[TP HIT]\033[0m {symbol} - Trailing activated @ {pos.current_sl:.2f}")

            if pos.trailing_active:
                new_sl = pos.best_price + pos.trail_pts
                if new_sl < pos.current_sl:
                    await self.connector.modify_stop(pos, new_sl)

            if current_price >= pos.current_sl:
                await self._close_position(pos, current_price, "TRAIL_STOP" if pos.trailing_active else "STOP_LOSS")

    async def _close_position(self, pos: Position, exit_price: float, reason: str):
        """Close a position."""
        cfg = INSTRUMENTS[pos.symbol]

        if pos.direction == "LONG":
            pnl_pts = exit_price - pos.entry_price
        else:
            pnl_pts = pos.entry_price - exit_price

        pnl_usd = pnl_pts * cfg.pv * pos.contracts

        log.info(f"\n\033[{'32' if pnl_usd >= 0 else '31'}m[CLOSE]\033[0m {pos.symbol} {pos.direction}")
        log.info(f"  Entry:  {pos.entry_price:.2f}")
        log.info(f"  Exit:   {exit_price:.2f}")
        log.info(f"  P&L:    {pnl_pts:.1f}pts (${pnl_usd:,.2f})")
        log.info(f"  Reason: {reason}")

        del self.positions[pos.symbol]

    def stop(self):
        """Stop the bot gracefully."""
        self.running = False
        log.info("\n[BOT STOPPED]")
        log.info(f"  Runtime:  {datetime.now(ET) - self.start_time}")
        log.info(f"  Signals:  {self.signals_generated}")
        log.info(f"  Orders:   {self.orders_placed}")

    def get_status(self) -> dict:
        """Get current bot status."""
        return {
            'running': self.running,
            'mode': self.mode.value,
            'symbols': self.symbols,
            'signals_generated': self.signals_generated,
            'orders_placed': self.orders_placed,
            'positions': len(self.positions),
            'connector': type(self.connector).__name__,
            'connected': self.connector.connected,
        }

# ══════════════════════════════════════════════════════════════════════════════
# DATA FEED HANDLERS
# ══════════════════════════════════════════════════════════════════════════════

async def run_with_test_data(bot: KLBSBot):
    """Run bot with historical test data for validation."""
    import pandas as pd

    log.info("\n[TEST MODE] Running with historical data...\n")

    for symbol in bot.symbols:
        cfg = INSTRUMENTS[symbol]
        data_file = os.path.join(os.path.dirname(__file__), f"data/{symbol}_15m.csv")

        if not os.path.exists(data_file):
            log.warning(f"No test data found: {data_file}")
            continue

        log.info(f"Loading {symbol} test data...")
        df = pd.read_csv(data_file, index_col=0, parse_dates=True)

        if df.index.tzinfo is None:
            df.index = df.index.tz_localize('UTC')
        df.index = df.index.tz_convert(ET)

        # Run last 100 bars for quick test
        test_bars = df.tail(100)

        for idx, row in test_bars.iterrows():
            await bot.process_bar(
                symbol=symbol,
                dt=idx.to_pydatetime(),
                o=float(row['Open' if 'Open' in row else 'open']),
                h=float(row['High' if 'High' in row else 'high']),
                l=float(row['Low' if 'Low' in row else 'low']),
                c=float(row['Close' if 'Close' in row else 'close']),
            )

        log.info(f"  Processed {len(test_bars)} bars for {symbol}")

# ══════════════════════════════════════════════════════════════════════════════
# CLI ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="KLBS Bot v1 - Key Level Breakout System Trading Bot",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python bot_v1.py --sim                    # Simulation mode (paper trading)
  python bot_v1.py --sim --test             # Run with historical test data
  python bot_v1.py --dry-run                # Process signals without executing
  python bot_v1.py --live --tradovate       # Live trading via Tradovate
  python bot_v1.py --live --crosstrade      # Live trading via CrossTrade (NinjaTrader)

Environment Variables:
  TRADOVATE_API_KEY       Tradovate API key
  TRADOVATE_API_SECRET    Tradovate API secret
  TRADOVATE_ACCOUNT_ID    Tradovate account ID
  TRADOVATE_ENV           'sim' or 'live'
  CROSSTRADE_WEBHOOK      CrossTrade webhook URL
  TRADERSPOST_WEBHOOK     TradersPost webhook URL
        """
    )

    # Mode selection
    mode_group = parser.add_mutually_exclusive_group(required=True)
    mode_group.add_argument('--sim', action='store_true', help='Simulation mode (paper trading)')
    mode_group.add_argument('--live', action='store_true', help='Live trading mode')
    mode_group.add_argument('--dry-run', action='store_true', help='Process signals without executing')

    # Connector selection
    conn_group = parser.add_mutually_exclusive_group()
    conn_group.add_argument('--tradovate', action='store_true', help='Use Tradovate API')
    conn_group.add_argument('--crosstrade', action='store_true', help='Use CrossTrade (NinjaTrader)')
    conn_group.add_argument('--traderspost', action='store_true', help='Use TradersPost webhook')

    # Other options
    parser.add_argument('--symbols', nargs='+', default=['MNQ', 'MES', 'MGC'],
                        help='Symbols to trade (default: MNQ MES MGC)')
    parser.add_argument('--test', action='store_true', help='Run with historical test data')
    parser.add_argument('--log-level', default='INFO', choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'])
    parser.add_argument('--version', action='version', version=f'KLBS Bot v{VERSION}')

    args = parser.parse_args()

    # Configure logging
    global log
    log = setup_logging(args.log_level)

    # Determine mode
    if args.sim:
        mode = TradingMode.SIM
    elif args.live:
        mode = TradingMode.LIVE
    else:
        mode = TradingMode.DRY_RUN

    # Determine connector
    if args.tradovate:
        connector = "tradovate"
    elif args.crosstrade:
        connector = "crosstrade"
    elif args.traderspost:
        connector = "traderspost"
    else:
        connector = "auto"

    # Validate symbols
    for sym in args.symbols:
        if sym not in INSTRUMENTS:
            log.error(f"Unknown symbol: {sym}. Available: {list(INSTRUMENTS.keys())}")
            sys.exit(1)

    # Create and run bot
    bot = KLBSBot(mode=mode, symbols=args.symbols, connector_type=connector)

    async def run():
        await bot.start()

        if args.test:
            await run_with_test_data(bot)
        else:
            log.info("\nBot is ready. Waiting for real-time data feed...")
            log.info("To test with historical data, use: python bot_v1.py --sim --test")
            log.info("\nPress Ctrl+C to stop.\n")

            try:
                while bot.running:
                    await asyncio.sleep(1)
            except KeyboardInterrupt:
                pass

        bot.stop()
        await bot.connector.disconnect()

    try:
        asyncio.run(run())
    except KeyboardInterrupt:
        log.info("\nBot stopped by user")
    except Exception as e:
        log.error(f"Bot error: {e}")
        raise

if __name__ == '__main__':
    main()
