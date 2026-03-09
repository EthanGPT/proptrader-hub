#!/usr/bin/env python3
"""
Analyze ALL ML features with the extended 25k dataset.
This validates/updates weightings for RSI, MACD, DI, ATR, etc.
"""

import pandas as pd
import numpy as np
from pathlib import Path

# Load data
print("Loading extended dataset...")
signals = []
for inst in ["MES", "MNQ", "MGC"]:
    path = Path(f"outputs/klbs_{inst}_trades.csv")
    if path.exists():
        df = pd.read_csv(path)
        df["instrument"] = inst
        signals.append(df)

df = pd.concat(signals, ignore_index=True)
df["date"] = pd.to_datetime(df["date"])
df["win"] = df["pnl_usd"] > 0

# Load OHLC with indicators
ohlc = {}
for inst in ["MES", "MNQ", "MGC"]:
    path = Path(f"data/{inst}_combined_15m.csv")
    if path.exists():
        ohlc_df = pd.read_csv(path, parse_dates=["ts_event"])
        ohlc_df = ohlc_df.set_index("ts_event").sort_index()

        # Calculate RSI
        delta = ohlc_df["close"].diff()
        gain = delta.where(delta > 0, 0).rolling(14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
        rs = gain / loss
        ohlc_df["rsi"] = 100 - (100 / (1 + rs))
        ohlc_df["rsi_roc"] = ohlc_df["rsi"].diff(3)

        # MACD
        exp1 = ohlc_df["close"].ewm(span=12).mean()
        exp2 = ohlc_df["close"].ewm(span=26).mean()
        ohlc_df["macd"] = exp1 - exp2
        ohlc_df["macd_signal"] = ohlc_df["macd"].ewm(span=9).mean()
        ohlc_df["macd_hist"] = ohlc_df["macd"] - ohlc_df["macd_signal"]

        # ADX/DI
        high, low, close = ohlc_df["high"], ohlc_df["low"], ohlc_df["close"]
        tr = pd.concat([high - low, (high - close.shift()).abs(), (low - close.shift()).abs()], axis=1).max(axis=1)
        atr = tr.rolling(14).mean()

        up_move = high - high.shift()
        down_move = low.shift() - low
        plus_dm = up_move.where((up_move > down_move) & (up_move > 0), 0)
        minus_dm = down_move.where((down_move > up_move) & (down_move > 0), 0)

        ohlc_df["plus_di"] = 100 * (plus_dm.rolling(14).mean() / atr)
        ohlc_df["minus_di"] = 100 * (minus_dm.rolling(14).mean() / atr)
        ohlc_df["atr_pct"] = (atr / ohlc_df["close"]) * 100

        ohlc[inst] = ohlc_df

# Join indicators to signals
def get_indicators(row):
    inst = row["instrument"]
    ts = row["date"]
    if inst not in ohlc:
        return pd.Series([50, 0, 0, 0, 25, 25, 0.5])

    df = ohlc[inst]
    if ts.tzinfo is None:
        ts = ts.tz_localize("UTC")

    idx = df.index.get_indexer([ts], method="ffill")[0]
    if idx < 0 or idx >= len(df):
        return pd.Series([50, 0, 0, 0, 25, 25, 0.5])

    bar = df.iloc[idx]
    return pd.Series([
        bar.get("rsi", 50),
        bar.get("rsi_roc", 0),
        bar.get("macd", 0),
        bar.get("macd_hist", 0),
        bar.get("plus_di", 25),
        bar.get("minus_di", 25),
        bar.get("atr_pct", 0.5)
    ])

print("Joining indicators to signals...")
df[["rsi", "rsi_roc", "macd", "macd_hist", "plus_di", "minus_di", "atr_pct"]] = df.apply(get_indicators, axis=1)

print(f"\nTotal signals: {len(df):,}")
print(f"Baseline WR: {df['win'].mean():.1%}")

# ============================================================================
# RSI ANALYSIS BY DIRECTION
# ============================================================================
print("\n" + "="*70)
print("RSI ANALYSIS BY DIRECTION")
print("="*70)

for direction in ["LONG", "SHORT"]:
    print(f"\n{direction}:")
    sub = df[df["direction"] == direction]

    bins = [0, 30, 35, 40, 45, 50, 55, 60, 65, 70, 100]
    sub["rsi_bin"] = pd.cut(sub["rsi"], bins=bins)

    for bin_label in sub["rsi_bin"].cat.categories:
        mask = sub["rsi_bin"] == bin_label
        n = mask.sum()
        if n >= 50:
            wr = sub.loc[mask, "win"].mean()
            bar = "█" * int(wr * 50)
            print(f"  RSI {bin_label}: n={n:5,} | WR={wr:.1%} {bar}")

# ============================================================================
# RSI MOMENTUM (ROC) BY DIRECTION
# ============================================================================
print("\n" + "="*70)
print("RSI MOMENTUM (ROC) BY DIRECTION")
print("="*70)

for direction in ["LONG", "SHORT"]:
    print(f"\n{direction}:")
    sub = df[df["direction"] == direction]

    # Rising vs Falling RSI
    rising = sub["rsi_roc"] > 0
    falling = sub["rsi_roc"] <= 0

    n_rise, wr_rise = rising.sum(), sub.loc[rising, "win"].mean()
    n_fall, wr_fall = falling.sum(), sub.loc[falling, "win"].mean()

    print(f"  RSI Rising:  n={n_rise:5,} | WR={wr_rise:.1%}")
    print(f"  RSI Falling: n={n_fall:5,} | WR={wr_fall:.1%}")
    print(f"  Edge: {abs(wr_rise - wr_fall):.1%}")

# ============================================================================
# MACD ANALYSIS BY DIRECTION
# ============================================================================
print("\n" + "="*70)
print("MACD ANALYSIS BY DIRECTION")
print("="*70)

for direction in ["LONG", "SHORT"]:
    print(f"\n{direction}:")
    sub = df[df["direction"] == direction]

    # MACD > 0 vs < 0
    bullish = sub["macd"] > 0
    bearish = sub["macd"] <= 0

    n_bull, wr_bull = bullish.sum(), sub.loc[bullish, "win"].mean()
    n_bear, wr_bear = bearish.sum(), sub.loc[bearish, "win"].mean()

    print(f"  MACD Bullish (>0): n={n_bull:5,} | WR={wr_bull:.1%}")
    print(f"  MACD Bearish (≤0): n={n_bear:5,} | WR={wr_bear:.1%}")

# ============================================================================
# MACD HISTOGRAM BY DIRECTION
# ============================================================================
print("\n" + "="*70)
print("MACD HISTOGRAM BY DIRECTION")
print("="*70)

for direction in ["LONG", "SHORT"]:
    print(f"\n{direction}:")
    sub = df[df["direction"] == direction]

    rising = sub["macd_hist"] > 0
    falling = sub["macd_hist"] <= 0

    n_rise, wr_rise = rising.sum(), sub.loc[rising, "win"].mean()
    n_fall, wr_fall = falling.sum(), sub.loc[falling, "win"].mean()

    print(f"  Histogram Positive: n={n_rise:5,} | WR={wr_rise:.1%}")
    print(f"  Histogram Negative: n={n_fall:5,} | WR={wr_fall:.1%}")

# ============================================================================
# DI ALIGNMENT BY DIRECTION
# ============================================================================
print("\n" + "="*70)
print("DI ALIGNMENT BY DIRECTION (+DI vs -DI)")
print("="*70)

for direction in ["LONG", "SHORT"]:
    print(f"\n{direction}:")
    sub = df[df["direction"] == direction]

    if direction == "LONG":
        aligned = sub["plus_di"] > sub["minus_di"]
    else:
        aligned = sub["minus_di"] > sub["plus_di"]

    not_aligned = ~aligned

    n_align, wr_align = aligned.sum(), sub.loc[aligned, "win"].mean()
    n_not, wr_not = not_aligned.sum(), sub.loc[not_aligned, "win"].mean()

    print(f"  DI Aligned:     n={n_align:5,} | WR={wr_align:.1%}")
    print(f"  DI Not Aligned: n={n_not:5,} | WR={wr_not:.1%}")
    print(f"  Edge: {wr_align - wr_not:.1%}")

# ============================================================================
# ATR% BY DIRECTION
# ============================================================================
print("\n" + "="*70)
print("ATR% BY DIRECTION")
print("="*70)

for direction in ["LONG", "SHORT"]:
    print(f"\n{direction}:")
    sub = df[df["direction"] == direction]

    low = sub["atr_pct"] < 0.25
    med = (sub["atr_pct"] >= 0.25) & (sub["atr_pct"] < 0.5)
    high = sub["atr_pct"] >= 0.5

    for name, mask in [("Low (<0.25)", low), ("Med (0.25-0.5)", med), ("High (≥0.5)", high)]:
        n = mask.sum()
        if n > 0:
            wr = sub.loc[mask, "win"].mean()
            print(f"  ATR% {name}: n={n:5,} | WR={wr:.1%}")

# ============================================================================
# SUMMARY - RECOMMENDED WEIGHTS
# ============================================================================
print("\n" + "="*70)
print("RECOMMENDED FEATURE WEIGHTS (based on 25k signals)")
print("="*70)

print("""
Based on the analysis above, here are the data-driven weights:

RSI_SCORE (direction-aware):
  LONG:
    - RSI < 35:  ? (check output above)
    - RSI 35-45: ?
    - RSI 45-65: ?
    - RSI > 65:  ?
  SHORT:
    - RSI > 65:  ?
    - RSI 55-65: ?
    - RSI 35-55: ?
    - RSI < 35:  ?

RSI_MOMENTUM:
  LONG + Rising RSI:  ? vs Falling: ?
  SHORT + Falling RSI: ? vs Rising: ?

MACD_SCORE:
  LONG + Bullish:  ? vs Bearish: ?
  SHORT + Bearish: ? vs Bullish: ?

MACD_HIST:
  LONG + Positive:  ? vs Negative: ?
  SHORT + Negative: ? vs Positive: ?

DI_ALIGN:
  LONG + Aligned:  ? vs Not: ? (edge: ?)
  SHORT + Aligned: ? vs Not: ? (edge: ?)

ATR_SCORE:
  LONG + Low:  ? | Med: ? | High: ?
  SHORT + Low: ? | Med: ? | High: ?
""")
