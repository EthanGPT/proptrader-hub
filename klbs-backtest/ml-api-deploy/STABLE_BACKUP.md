# STABLE ML MODEL BACKUP

**Last Known Working Version: March 16, 2026**

## Quick Restore

```bash
git checkout v1.0-ml-stable
```

## Live Deployment

- **URL:** https://ml-api-phantom-production.up.railway.app
- **Platform:** Railway
- **Commit:** `1408a7a` (Add anti-hedging protection for MES/MNQ)

## What This Version Has

- ML Filter API with 50% threshold
- Position sizing: 1x/2x/3x at 50%/65%/70% confidence
- Anti-hedging protection for MES/MNQ (can't trade opposite directions)
- RSI filters: 65 overbought / 35 oversold
- 5-minute cooldown between trades on same asset
- Sentiment integration (live RSS feeds)
- 3 TradersPost accounts (Test v1, Apex, Lucid)

## If Something Breaks

1. Check the tag still exists: `git tag -l v1.0-ml-stable`
2. Restore: `git checkout v1.0-ml-stable`
3. Full backup also on Desktop: `~/Desktop/klbs-ml-backup-march2026/`
4. Documentation: `~/Desktop/ML_MODEL_BACKUP_March2026.txt`

## Key Files

| File | Purpose |
|------|---------|
| `main.py` | FastAPI ML Filter (1,420 lines) |
| `model.pkl` | Trained XGBoost model (1.6MB) |
| `KLBS_TradersPost.pine` | TradingView indicator |
| `live_rss_feed.py` | Sentiment module |

## API Endpoints

- `POST /webhook` - TradingView signals
- `GET /status` - Current state
- `POST /force-flat` - Emergency position reset
- `GET /learning-insights` - ML performance

---
*Created March 16, 2026 before dev fork*
