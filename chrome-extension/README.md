# Big Mitch - Chrome Extension

Chat with your ML trading algorithm while watching TradingView charts.

## What Is This?

Big Mitch is the personification of your KLBS ML Signal Filter. He knows:
- Your strategy rules (levels, sessions, TP/SL)
- Historical win rates by level, session, time of day
- Current open positions and their parameters
- Why he approved or rejected signals
- Position sizing logic

When you're in a trade and see something on the chart, you can describe it to Mitch and get his read based on actual data.

## Installation

### 1. Get Free Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up (free)
3. Create an API key
4. That's it - no credit card, no limits that matter for this use case

### 2. Deploy the Updated ML API

```bash
cd klbs-backtest/ml-api-deploy
git add .
git commit -m "Add Big Mitch chat endpoint"
git push
```

**Add to Railway Environment Variables:**
```
GROQ_API_KEY=gsk_...
```

### 2. Load the Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `chrome-extension` folder
5. Pin the extension to your toolbar for easy access

### 3. Replace Icons (Optional)

The extension comes with solid cyan placeholder icons. Replace with custom icons:
- `icons/icon16.png` - 16x16 pixels
- `icons/icon48.png` - 48x48 pixels
- `icons/icon128.png` - 128x128 pixels

## Usage

### While Trading

1. Click the Big Mitch icon in your Chrome toolbar
2. See your current open positions at the top
3. Type what you're seeing on the chart
4. Get Mitch's analysis based on your actual trade data

### Example Conversations

**You:** "We're up 40 points on MNQ, seeing rejection candles and MACD is crossing down"

**Mitch:** "40 points up on MNQ = 80% to your 50pt target. Looking at your PMH SHORT entry at 68% confidence - that's a 2x position running at historically 80% win rate for that confidence tier..."

---

**You:** "CPI coming up in 30 minutes, should I close this?"

**Mitch:** "My historical data shows first-hour win rates drop during major news. ATR typically spikes above my 1.5% threshold. If you're already at 80% of target, locking in makes sense..."

---

**You:** "This PDL long looks weak, what do you think?"

**Mitch:** "PDL LONGs run at 52.6% historically - my weakest level. If this was London session, I'd be extra cautious (47.6% WR for PDL LONG London). What was my confidence on this one?"

### Quick Actions

- **Position Status** - Get a summary of your current trade
- **Trail Stop?** - Ask if you should move your stop
- **Setup Quality** - Get Mitch's read on the overall setup

## Technical Details

### API Endpoints Used

- `GET /chat/context` - Fetches current positions and performance
- `POST /chat` - Sends message to Big Mitch

### What Context Mitch Receives

Every message includes:
- All open positions (ticker, entry, TP, SL, confidence, level, session, RSI)
- Recent performance (last 20 trades win rate, P&L)
- Current state (consecutive losses, trades today)

### Conversation History

The extension stores the last 20 messages locally and sends the last 8 for context continuity.

## Troubleshooting

### "Offline" Status
- Check that the ML API is running: https://ml-api-phantom-production.up.railway.app/status
- Verify CORS is enabled (it is by default in the API)

### "GROQ_API_KEY not configured"
- Get free key at [console.groq.com](https://console.groq.com)
- Add `GROQ_API_KEY` to your Railway environment variables
- Redeploy the API after adding the key

### Chat Not Responding
- Check browser console for errors (right-click extension popup → Inspect)
- Verify the API `/chat` endpoint: `curl -X POST https://ml-api-phantom-production.up.railway.app/chat -H "Content-Type: application/json" -d '{"message":"test"}'`

## Files

```
chrome-extension/
├── manifest.json      # Extension configuration
├── popup.html         # Main UI
├── popup.js           # Chat logic
├── styles.css         # Styling
├── icons/
│   ├── icon16.png     # Toolbar icon
│   ├── icon48.png     # Extension page icon
│   └── icon128.png    # Chrome Web Store icon
└── README.md          # This file
```
