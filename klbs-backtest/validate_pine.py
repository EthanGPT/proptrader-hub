"""
Pine Script Validation — Verify Pine logic matches Python backtest
This script replicates the EXACT Pine script logic and compares signal counts.
"""

import warnings
warnings.filterwarnings('ignore')

import pandas as pd
import numpy as np
from datetime import datetime, time
import pytz
import os

# ── Config ────────────────────────────────────────────────────────────────────
INSTRUMENTS = {
    'MNQ': {
        'file': 'data/MNQ_15m.csv',
        'tp': 35, 'sl': 50, 'rz': 5, 'pv': 2.0, 'contracts': 4,
        'name': 'Micro Nasdaq'
    },
    'MES': {
        'file': 'data/MES_15m.csv',
        'tp': 25, 'sl': 25, 'rz': 5, 'pv': 5.0, 'contracts': 4,
        'name': 'Micro S&P 500'
    },
    'MGC': {
        'file': 'data/MGC_15m.csv',
        'tp': 20, 'sl': 25, 'rz': 3, 'pv': 10.0, 'contracts': 2,
        'name': 'Micro Gold'
    },
}

ET = pytz.timezone('America/New_York')
PROX_THRESHOLD = 10.0

# Session times (ET) — MUST match Pine exactly
LONDON_START = time(3, 0)
LONDON_END   = time(8, 0)
DEAD_START   = time(8, 0)
DEAD_END     = time(9, 30)
NY_START     = time(9, 30)
NY_END       = time(16, 0)
PM_START     = time(4, 30)
PM_END       = time(9, 30)
LPM_START    = time(0, 0)
LPM_END      = time(3, 0)

def in_london(t): return LONDON_START <= t < LONDON_END
def in_ny(t):     return NY_START <= t < NY_END
def in_pm(t):     return PM_START <= t < PM_END
def in_lpm(t):    return LPM_START <= t < LPM_END
def in_session(t): return in_london(t) or in_ny(t)
def in_dead(t):   return DEAD_START <= t < DEAD_END

def f_near(a, b, prox=PROX_THRESHOLD):
    """Proximity filter — matches Pine f_near()"""
    if np.isnan(a) or np.isnan(b):
        return False
    return abs(a - b) <= prox

def load_data(filepath):
    """Load Databento CSV and convert to ET."""
    print(f"  Loading {filepath}...")
    df = pd.read_csv(filepath, index_col=0, parse_dates=True)
    if df.index.tzinfo is None:
        df.index = df.index.tz_localize('UTC')
    df.index = df.index.tz_convert(ET)
    df.columns = [c.capitalize() for c in df.columns]
    df = df[['Open', 'High', 'Low', 'Close', 'Volume']].copy()
    df.dropna(inplace=True)
    print(f"    → {len(df):,} bars from {df.index[0].date()} to {df.index[-1].date()}")
    return df


def run_pine_validation(symbol, cfg):
    """
    Replicate EXACT Pine script logic bar-by-bar.
    This must match f_check() from KLBS_TradersPost.pine
    """
    print(f"\n{'='*60}")
    print(f"  {symbol} — Pine Script Validation")
    print(f"{'='*60}")

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    filepath = os.path.join(BASE_DIR, cfg['file'])
    df = load_data(filepath)

    rz = cfg['rz']

    # ── State variables (match Pine var declarations) ──
    # Level values
    day_h = np.nan
    day_l = np.nan
    pm_h = np.nan
    pm_l = np.nan
    lpm_h = np.nan
    lpm_l = np.nan
    prev_day_h = np.nan
    prev_day_l = np.nan

    # State machine: 0=waiting, 1=armed long, -1=armed short, 2=fired long, -2=fired short
    level_state = {k: 0 for k in ['PDH', 'PDL', 'PMH', 'PML', 'LPH', 'LPL']}
    level_bo = {k: -1 for k in ['PDH', 'PDL', 'PMH', 'PML', 'LPH', 'LPL']}  # bo = breakout bar
    level_ls = {k: -1 for k in ['PDH', 'PDL', 'PMH', 'PML', 'LPH', 'LPL']}  # ls = last signal bar

    prev_date = None
    trades = []
    arm_events = []

    bars = df.reset_index()
    bars.rename(columns={bars.columns[0]: 'Datetime'}, inplace=True)
    total_bars = len(bars)
    report_interval = total_bars // 10

    for i, row in bars.iterrows():
        dt = row['Datetime']

        if i == 0:
            prev_date = dt.date()
            day_h = row['High']
            day_l = row['Low']
            continue

        if i % report_interval == 0:
            pct = int(i / total_bars * 100)
            print(f"    Processing... {pct}%")

        t = dt.time()
        date = dt.date()
        h = float(row['High'])
        l = float(row['Low'])

        # Previous bar values (matches Pine high[1], low[1])
        prev_row = bars.iloc[i-1]
        ph = float(prev_row['High'])
        pl = float(prev_row['Low'])

        cur_london = in_london(t)
        cur_ny = in_ny(t)
        cur_pm = in_pm(t)
        cur_lpm = in_lpm(t)
        cur_sess = in_session(t)  # anySession in Pine
        cur_dead = in_dead(t)

        # ── New day detection (matches Pine isNewDay) ──
        new_day = date != prev_date
        if new_day:
            prev_day_h = day_h
            prev_day_l = day_l
            day_h = h
            day_l = l
            pm_h = np.nan
            pm_l = np.nan
            lpm_h = np.nan
            lpm_l = np.nan
            # Reset all states (matches Pine isNewDay block)
            for k in level_state:
                level_state[k] = 0
                level_bo[k] = -1  # CRITICAL: Reset bo on new day
                level_ls[k] = -1
            prev_date = date
        else:
            day_h = max(day_h, h) if not np.isnan(day_h) else h
            day_l = min(day_l, l) if not np.isnan(day_l) else l

        # ── Accumulate session levels (matches Pine inLPM/inPM blocks) ──
        if cur_lpm:
            lpm_h = max(lpm_h, h) if not np.isnan(lpm_h) else h
            lpm_l = min(lpm_l, l) if not np.isnan(lpm_l) else l
        if cur_pm:
            pm_h = max(pm_h, h) if not np.isnan(pm_h) else h
            pm_l = min(pm_l, l) if not np.isnan(pm_l) else l

        # ── Define active levels with proximity filter (matches Pine showPDH etc) ──
        levels = {}

        # PMH - always shown if not na (showPMH = not na(pmHigh))
        if not np.isnan(pm_h):
            levels['PMH'] = (pm_h, False)  # SHORT

        # PML - always shown if not na (showPML = not na(pmLow))
        if not np.isnan(pm_l):
            levels['PML'] = (pm_l, True)   # LONG

        # LPH - check proximity to PM levels
        if not np.isnan(lpm_h) and not f_near(lpm_h, pm_h) and not f_near(lpm_h, pm_l):
            levels['LPH'] = (lpm_h, False)  # SHORT

        # LPL - check proximity to PM levels
        if not np.isnan(lpm_l) and not f_near(lpm_l, pm_h) and not f_near(lpm_l, pm_l):
            levels['LPL'] = (lpm_l, True)   # LONG

        # PDH - check proximity to LPM and PM levels
        if not np.isnan(prev_day_h) and not f_near(prev_day_h, lpm_h) and not f_near(prev_day_h, lpm_l) and not f_near(prev_day_h, pm_h) and not f_near(prev_day_h, pm_l):
            levels['PDH'] = (prev_day_h, False)  # SHORT

        # PDL - check proximity to LPM and PM levels
        if not np.isnan(prev_day_l) and not f_near(prev_day_l, lpm_h) and not f_near(prev_day_l, lpm_l) and not f_near(prev_day_l, pm_h) and not f_near(prev_day_l, pm_l):
            levels['PDL'] = (prev_day_l, True)   # LONG

        # ══════════════════════════════════════════════════════════════════════════
        # CORE STATE MACHINE — MUST MATCH Pine f_check() EXACTLY
        # ══════════════════════════════════════════════════════════════════════════
        for lvl_name, (lvl_price, is_long) in levels.items():
            st = level_state[lvl_name]
            bo = level_bo[lvl_name]
            ls = level_ls[lvl_name]

            if is_long:
                # ══ LONG (PDL, PML, LPL) ══
                # Arm: pl > lvl (previous bar's low > level)
                # Pine: if _st == 0 and anySession and not inDead
                #           if low[1] > lvl
                if st == 0 and cur_sess and not cur_dead:
                    if pl > lvl_price:
                        level_state[lvl_name] = 1
                        level_bo[lvl_name] = i
                        st = 1
                        bo = i
                        arm_events.append({
                            'date': dt, 'level': lvl_name, 'direction': 'LONG',
                            'level_price': lvl_price
                        })

                # Fire: l <= lvl + rz (current low touches zone)
                # Pine: if _st == 1 and bar_index > _bo
                if st == 1 and i > bo:
                    if l <= lvl_price + rz:
                        # Pine: if anySession and not inDead
                        if cur_sess and not cur_dead:
                            # Pine: if bar_index != _ls
                            if i != ls:
                                trades.append({
                                    'date': dt,
                                    'level': lvl_name,
                                    'direction': 'LONG',
                                    'entry': lvl_price,
                                    'bar_idx': i,
                                    'level_price': lvl_price,
                                })
                                level_state[lvl_name] = 2
                                level_ls[lvl_name] = i
                        else:
                            # Dead zone disarm
                            level_state[lvl_name] = 0

            else:
                # ══ SHORT (PDH, PMH, LPH) ══
                # Arm: ph < lvl (previous bar's high < level)
                # Pine: if _st == 0 and anySession and not inDead
                #           if high[1] < lvl
                if st == 0 and cur_sess and not cur_dead:
                    if ph < lvl_price:
                        level_state[lvl_name] = -1
                        level_bo[lvl_name] = i
                        st = -1
                        bo = i
                        arm_events.append({
                            'date': dt, 'level': lvl_name, 'direction': 'SHORT',
                            'level_price': lvl_price
                        })

                # Fire: h >= lvl - rz (current high touches zone)
                # Pine: if _st == -1 and bar_index > _bo
                if st == -1 and i > bo:
                    if h >= lvl_price - rz:
                        # Pine: if anySession and not inDead
                        if cur_sess and not cur_dead:
                            # Pine: if bar_index != _ls
                            if i != ls:
                                trades.append({
                                    'date': dt,
                                    'level': lvl_name,
                                    'direction': 'SHORT',
                                    'entry': lvl_price,
                                    'bar_idx': i,
                                    'level_price': lvl_price,
                                })
                                level_state[lvl_name] = -2
                                level_ls[lvl_name] = i
                        else:
                            # Dead zone disarm
                            level_state[lvl_name] = 0

    if not trades:
        print("  No trades found.")
        return None, 0

    trades_df = pd.DataFrame(trades)
    print(f"\n  Pine Validation: {len(trades_df)} signals found")

    # Count by level
    level_counts = trades_df.groupby('level').size().to_dict()
    print(f"  By level: {level_counts}")

    # Count by direction
    dir_counts = trades_df.groupby('direction').size().to_dict()
    print(f"  By direction: {dir_counts}")

    return trades_df, len(trades_df)


def run_original_backtest(symbol, cfg):
    """
    Run the ORIGINAL backtest logic for comparison.
    This is copied from klbs_backtest.py to ensure we compare apples to apples.
    """
    print(f"\n  Running original backtest for comparison...")

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    filepath = os.path.join(BASE_DIR, cfg['file'])
    df = load_data(filepath)

    rz = cfg['rz']

    # State
    day_h = np.nan
    day_l = np.nan
    pm_h = np.nan
    pm_l = np.nan
    lpm_h = np.nan
    lpm_l = np.nan
    prev_day_h = np.nan
    prev_day_l = np.nan

    level_state = {k: 0 for k in ['PDH', 'PDL', 'PMH', 'PML', 'LPH', 'LPL']}
    level_bo = {k: -1 for k in ['PDH', 'PDL', 'PMH', 'PML', 'LPH', 'LPL']}
    level_ls = {k: -1 for k in ['PDH', 'PDL', 'PMH', 'PML', 'LPH', 'LPL']}

    prev_date = None
    trades = []

    bars = df.reset_index()
    bars.rename(columns={bars.columns[0]: 'Datetime'}, inplace=True)

    for i, row in bars.iterrows():
        dt = row['Datetime']

        if i == 0:
            prev_date = dt.date()
            day_h = row['High']
            day_l = row['Low']
            continue

        t = dt.time()
        date = dt.date()
        h = float(row['High'])
        l = float(row['Low'])

        prev_row = bars.iloc[i-1]
        ph = float(prev_row['High'])
        pl = float(prev_row['Low'])

        cur_sess = in_session(t)
        cur_pm = in_pm(t)
        cur_lpm = in_lpm(t)

        new_day = date != prev_date
        if new_day:
            prev_day_h = day_h
            prev_day_l = day_l
            day_h = h
            day_l = l
            pm_h = np.nan
            pm_l = np.nan
            lpm_h = np.nan
            lpm_l = np.nan
            for k in level_state:
                level_state[k] = 0
                level_bo[k] = -1
                level_ls[k] = -1
            prev_date = date
        else:
            day_h = max(day_h, h) if not np.isnan(day_h) else h
            day_l = min(day_l, l) if not np.isnan(day_l) else l

        if cur_lpm:
            lpm_h = max(lpm_h, h) if not np.isnan(lpm_h) else h
            lpm_l = min(lpm_l, l) if not np.isnan(lpm_l) else l
        if cur_pm:
            pm_h = max(pm_h, h) if not np.isnan(pm_h) else h
            pm_l = min(pm_l, l) if not np.isnan(pm_l) else l

        prox = PROX_THRESHOLD
        def near(a, b):
            return (not np.isnan(a)) and (not np.isnan(b)) and abs(a-b) <= prox

        levels = {}
        if not np.isnan(pm_h):
            levels['PMH'] = (pm_h, False)
        if not np.isnan(pm_l):
            levels['PML'] = (pm_l, True)
        if not np.isnan(lpm_h) and not near(lpm_h, pm_h) and not near(lpm_h, pm_l):
            levels['LPH'] = (lpm_h, False)
        if not np.isnan(lpm_l) and not near(lpm_l, pm_h) and not near(lpm_l, pm_l):
            levels['LPL'] = (lpm_l, True)
        if not np.isnan(prev_day_h) and not near(prev_day_h, lpm_h) and not near(prev_day_h, lpm_l) and not near(prev_day_h, pm_h) and not near(prev_day_h, pm_l):
            levels['PDH'] = (prev_day_h, False)
        if not np.isnan(prev_day_l) and not near(prev_day_l, lpm_h) and not near(prev_day_l, lpm_l) and not near(prev_day_l, pm_h) and not near(prev_day_l, pm_l):
            levels['PDL'] = (prev_day_l, True)

        for lvl_name, (lvl_price, is_long) in levels.items():
            st = level_state[lvl_name]
            bo = level_bo[lvl_name]
            ls = level_ls[lvl_name]

            if is_long:
                # ORIGINAL backtest logic (from klbs_backtest.py)
                if st == 0 and cur_sess and pl > lvl_price:
                    level_state[lvl_name] = 1
                    level_bo[lvl_name] = i
                    st = 1
                    bo = i

                if st == 1 and i > bo:
                    if l <= lvl_price + rz:
                        if cur_sess:
                            if i != ls:
                                trades.append({
                                    'date': dt,
                                    'level': lvl_name,
                                    'direction': 'LONG',
                                    'entry': lvl_price,
                                    'bar_idx': i,
                                })
                                level_state[lvl_name] = 2
                                level_ls[lvl_name] = i
                        else:
                            level_state[lvl_name] = 0
            else:
                if st == 0 and cur_sess and ph < lvl_price:
                    level_state[lvl_name] = -1
                    level_bo[lvl_name] = i
                    st = -1
                    bo = i

                if st == -1 and i > bo:
                    if h >= lvl_price - rz:
                        if cur_sess:
                            if i != ls:
                                trades.append({
                                    'date': dt,
                                    'level': lvl_name,
                                    'direction': 'SHORT',
                                    'entry': lvl_price,
                                    'bar_idx': i,
                                })
                                level_state[lvl_name] = -2
                                level_ls[lvl_name] = i
                        else:
                            level_state[lvl_name] = 0

    return len(trades)


def main():
    print("\n" + "="*70)
    print("  PINE SCRIPT VALIDATION — Comparing Pine logic vs Original Backtest")
    print("="*70)

    results = []

    for symbol, cfg in INSTRUMENTS.items():
        # Run Pine validation
        pine_trades, pine_count = run_pine_validation(symbol, cfg)

        # Run original backtest
        original_count = run_original_backtest(symbol, cfg)

        # Compare
        match = "✓ MATCH" if pine_count == original_count else "✗ MISMATCH"
        diff = pine_count - original_count

        results.append({
            'Symbol': symbol,
            'Pine Signals': pine_count,
            'Original Signals': original_count,
            'Difference': diff,
            'Status': match
        })

        print(f"\n  {symbol}: Pine={pine_count}, Original={original_count} → {match}")

    print("\n" + "="*70)
    print("  SUMMARY")
    print("="*70)

    results_df = pd.DataFrame(results)
    print(results_df.to_string(index=False))

    total_pine = sum(r['Pine Signals'] for r in results)
    total_orig = sum(r['Original Signals'] for r in results)

    print(f"\n  Total: Pine={total_pine}, Original={total_orig}")

    if total_pine == total_orig:
        print("\n  ✓ VALIDATION PASSED — Pine script matches Python backtest exactly!")
    else:
        print(f"\n  ✗ VALIDATION FAILED — Difference of {total_pine - total_orig} signals")
        print("    Check the logic differences between Pine and Python")


if __name__ == "__main__":
    main()
