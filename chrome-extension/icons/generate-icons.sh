#!/bin/bash
# Generate placeholder icons for Big Mitch extension
# Replace these with actual icons later

# Create 16x16 icon (cyan brain symbol)
echo 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA2klEQVR42mNgGAWDAfj//z8DMpifn/8/IyPjfxQJ5v///wPZ/xHY6Jr+M8AFwBrQNYAk/qNoAivAphkkQagmkCYGdDcQqwldAwO6JLomBnRF2DRhswakCacX0TXh8iJWTbhchFUTLi/i1ITLiyg2YUqga8JpM7omXF7Eqgmnl3BqwuVFnJpweRGnJlwuwqkJl5dwasLlJZyacHkRp6b/pLgIJHHUi//BkqgSIK8RFCdEBxIpBrBtIrNLGDYBJf4j0f9/kCbR/JwJHRQ0xPsfmRvJdsFgAACgamb0CgAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAxOS0wMS0wMVQwMDowMDowMCswMDowMKFM6bYAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMTktMDEtMDFUMDA6MDA6MDArMDA6MDDQEVEQAAAAAD0=' | base64 -d > icon16.png 2>/dev/null || echo "Placeholder created"

# For now, copy the same for all sizes (replace with proper icons)
cp icon16.png icon48.png 2>/dev/null || true
cp icon16.png icon128.png 2>/dev/null || true

echo "Icons created (placeholders - replace with real 16x16, 48x48, 128x128 PNGs)"
