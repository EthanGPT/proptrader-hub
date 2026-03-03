# KLBS Bot v1 Setup Guide

## Quick Start (Simulation Mode)

```bash
cd klbs-backtest
pip install pytz websocket-client requests pandas

# Run in simulation mode with test data
python bot_v1.py --sim --test

# Run in simulation mode (waiting for live data)
python bot_v1.py --sim
```

---

## Platform Options

### Option 1: Tradovate (Recommended for Sim Testing)

**Free sim account with full API access**

1. **Create Account**
   - Go to [Tradovate](https://www.tradovate.com)
   - Click "Open Account" > "Simulation Account"
   - Complete registration (no funding required for sim)

2. **Enable API Access**
   - Log into Tradovate
   - Go to Settings > Add-Ons
   - Activate "API Access" (free for sim accounts)
   - Go to Settings > API Access > Generate API Key

3. **Configure Environment**
   ```bash
   export TRADOVATE_API_KEY="your_api_key"
   export TRADOVATE_API_SECRET="your_api_secret"
   export TRADOVATE_ACCOUNT_ID="your_account_id"
   export TRADOVATE_ENV="sim"  # Use 'live' for live trading
   ```

4. **Run**
   ```bash
   python bot_v1.py --sim --tradovate --test
   ```

### Option 2: NinjaTrader via CrossTrade

**For existing NinjaTrader users**

1. **Install CrossTrade**
   - Go to [CrossTrade.io](https://crosstrade.io)
   - Subscribe (~$30/month)
   - Install the NinjaTrader 8 add-on

2. **Get Webhook URL**
   - In NinjaTrader, open CrossTrade settings
   - Copy your permanent webhook URL

3. **Configure Environment**
   ```bash
   export CROSSTRADE_WEBHOOK="https://crosstrade.io/webhook/YOUR_ID"
   ```

4. **Run**
   ```bash
   python bot_v1.py --sim --crosstrade
   ```

### Option 3: TradersPost (Multi-Broker)

**Supports Tradovate, TradeStation, Alpaca, etc.**

1. **Create Account**
   - Go to [TradersPost.io](https://traderspost.io)
   - Connect your broker

2. **Get Webhook URL**
   - Create a new strategy webhook
   - Copy the webhook URL

3. **Configure Environment**
   ```bash
   export TRADERSPOST_WEBHOOK="https://traderspost.io/trading/webhook/YOUR_ID"
   ```

4. **Run**
   ```bash
   python bot_v1.py --sim --traderspost
   ```

---

## Strategy Parameters (Optimized)

These parameters were optimized over 6.7 years of backtest data:

| Instrument | TP (pts) | SL (pts) | Trail | Contracts | Backtest P&L |
|------------|----------|----------|-------|-----------|--------------|
| MNQ        | 35       | 50       | 5     | 4         | $588,388     |
| MES        | 25       | 25       | 5     | 4         | $393,186     |
| MGC        | 20       | 25       | 5     | 2         | $228,337     |

**Combined: $1.21M over 6.7 years (15,751 trades, 60% WR, 4.17 Sharpe)**

---

## CLI Commands

```bash
# Simulation mode (paper trading)
python bot_v1.py --sim

# Simulation with historical test data
python bot_v1.py --sim --test

# Dry run (process signals but don't execute)
python bot_v1.py --dry-run --test

# Live trading (requires funded account)
python bot_v1.py --live --tradovate

# Select specific symbols
python bot_v1.py --sim --symbols MNQ MES

# Debug logging
python bot_v1.py --sim --test --log-level DEBUG
```

---

## Signal Flow

```
1. Price Bar Received
         ↓
2. Level Check (PDH/PDL/PMH/PML/LPH/LPL)
         ↓
3. ARM Condition (prev bar fully through level during session)
         ↓
4. RETEST Condition (price touches retest zone)
         ↓
5. Signal Generated
         ↓
6. Webhook/API Order Sent
         ↓
7. Position Tracked
         ↓
8. Trail Stop Management (after TP hit)
```

---

## Session Times (Eastern Time)

| Session      | Start  | End    | Behavior                           |
|--------------|--------|--------|------------------------------------|
| London Pre   | 00:00  | 03:00  | LPH/LPL levels form               |
| London       | 03:00  | 08:00  | Active trading session            |
| Dead Zone    | 08:00  | 09:30  | No signals, retests disarm levels |
| Pre-Market   | 04:30  | 09:30  | PMH/PML levels form               |
| NY           | 09:30  | 16:00  | Active trading session            |

---

## Testing Workflow

### Phase 1: Validate Logic
```bash
python bot_v1.py --sim --test
```
- Runs against historical data
- Validates signal generation
- No real orders placed

### Phase 2: Paper Trade
```bash
python bot_v1.py --sim --tradovate
```
- Connect to Tradovate sim
- Execute paper trades
- Monitor for 1-2 weeks

### Phase 3: Small Live
```bash
export TRADOVATE_ENV="live"
python bot_v1.py --live --tradovate --symbols MNQ
```
- Start with 1 symbol, 1 contract
- Monitor closely
- Scale up gradually

---

## Troubleshooting

### "API credentials not configured"
Set environment variables:
```bash
export TRADOVATE_API_KEY="..."
export TRADOVATE_API_SECRET="..."
```

### "websocket-client not installed"
```bash
pip install websocket-client
```

### "No test data found"
Ensure data files exist in `klbs-backtest/data/`:
- MNQ_15m.csv
- MES_15m.csv
- MGC_15m.csv

### "Order failed: 401"
- Check API credentials
- Verify API Access is enabled
- Check if token expired

---

## File Structure

```
klbs-backtest/
├── bot_v1.py              # Main trading bot
├── klbs_backtest.py       # Backtest engine
├── klbs_webhook.py        # Legacy webhook generator
├── BOT_SETUP.md           # This file
├── bot_v1_trades.log      # Trade log (auto-created)
└── data/
    ├── MNQ_15m.csv
    ├── MES_15m.csv
    └── MGC_15m.csv
```

---

## CME Compliance Note

All automated orders must include `isAutomated: true` flag per CME Group regulations. The bot handles this automatically.

---

## Risk Disclaimer

**IMPORTANT**: This bot is for educational purposes. Trading futures involves substantial risk of loss. Past performance (backtest) does not guarantee future results. Always:
- Start with simulation
- Use proper position sizing
- Never risk more than you can afford to lose
- Monitor the bot continuously when live

---

## Support Links

- [Tradovate API Docs](https://api.tradovate.com)
- [CrossTrade.io](https://crosstrade.io)
- [TradersPost.io](https://traderspost.io)
- [NinjaTrader Forum](https://forum.ninjatrader.com)
