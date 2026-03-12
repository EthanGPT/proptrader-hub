// Big Mitch Chrome Extension

const API_BASE = 'https://ml-api-phantom-production.up.railway.app';

// State
let conversationHistory = [];
let isLoading = false;

// DOM Elements
const statusIndicator = document.getElementById('statusIndicator');
const statusText = statusIndicator.querySelector('.status-text');
const positionsPanel = document.getElementById('positionsPanel');
const positionsList = document.getElementById('positionsList');
const positionCount = document.getElementById('positionCount');
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const winRateEl = document.getElementById('winRate');
const tradesTodayEl = document.getElementById('tradesToday');
const streakEl = document.getElementById('streak');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadContext();
  loadConversationHistory();

  // Enter key to send
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
});

// Load trading context from API
async function loadContext() {
  try {
    const response = await fetch(`${API_BASE}/chat/context`);

    if (!response.ok) throw new Error('API error');

    const data = await response.json();

    // Update status
    statusIndicator.classList.add('connected');
    statusText.textContent = 'Connected';

    // Update positions
    updatePositions(data.open_positions || []);

    // Update stats
    updateStats(data);

  } catch (error) {
    console.error('Failed to load context:', error);
    statusIndicator.classList.add('error');
    statusText.textContent = 'Offline';
  }
}

// Update positions display
function updatePositions(positions) {
  positionCount.textContent = positions.length;

  if (positions.length === 0) {
    positionsList.innerHTML = '<div class="no-positions">No open positions</div>';
    return;
  }

  positionsList.innerHTML = positions.map(pos => {
    const isLong = pos.action === 'buy';
    const confidence = (pos.confidence * 100).toFixed(0);
    const confidenceClass = confidence >= 70 ? 'high' : confidence >= 65 ? 'medium' : '';
    const contracts = confidence >= 70 ? '3x' : confidence >= 65 ? '2x' : '1x';

    return `
      <div class="position-card">
        <div class="position-header">
          <span class="position-ticker ${isLong ? 'long' : 'short'}">
            ${pos.ticker} ${isLong ? '▲ LONG' : '▼ SHORT'}
          </span>
          <span class="position-badge ${confidenceClass}">${confidence}% ${contracts}</span>
        </div>
        <div class="position-details">
          <div class="position-detail">
            <span class="position-detail-label">Entry</span>
            <span class="position-detail-value">${pos.price?.toFixed(2) || '--'}</span>
          </div>
          <div class="position-detail">
            <span class="position-detail-label">TP</span>
            <span class="position-detail-value">${pos.tp_price?.toFixed(2) || '--'}</span>
          </div>
          <div class="position-detail">
            <span class="position-detail-label">SL</span>
            <span class="position-detail-value">${pos.sl_price?.toFixed(2) || '--'}</span>
          </div>
        </div>
        <div class="position-details" style="margin-top: 6px;">
          <div class="position-detail">
            <span class="position-detail-label">Level</span>
            <span class="position-detail-value">${pos.level || '--'}</span>
          </div>
          <div class="position-detail">
            <span class="position-detail-label">Session</span>
            <span class="position-detail-value">${pos.session || '--'}</span>
          </div>
          <div class="position-detail">
            <span class="position-detail-label">RSI</span>
            <span class="position-detail-value">${pos.rsi?.toFixed(1) || '--'}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Update stats display
function updateStats(data) {
  const state = data.state || {};
  const performance = data.performance || {};
  const last20 = performance.last_20_trades || {};

  // Win rate
  if (last20.win_rate) {
    winRateEl.textContent = last20.win_rate;
    const wr = parseFloat(last20.win_rate);
    winRateEl.classList.toggle('positive', wr >= 55);
    winRateEl.classList.toggle('negative', wr < 50);
  }

  // Trades today
  tradesTodayEl.textContent = state.trades_today || 0;

  // Streak (consecutive losses shown as negative)
  const losses = state.consecutive_losses || 0;
  if (losses > 0) {
    streakEl.textContent = `-${losses}`;
    streakEl.classList.add('negative');
    streakEl.classList.remove('positive');
  } else {
    // Show recent wins
    const recentOutcomes = performance.recent_outcomes || [];
    let winStreak = 0;
    for (const outcome of recentOutcomes) {
      if (outcome === 'WIN') winStreak++;
      else break;
    }
    streakEl.textContent = winStreak > 0 ? `+${winStreak}` : '0';
    streakEl.classList.toggle('positive', winStreak > 0);
    streakEl.classList.remove('negative');
  }
}

// Toggle positions panel
function togglePositions() {
  positionsPanel.classList.toggle('collapsed');
}

// Send message to Big Mitch
async function sendMessage() {
  const message = messageInput.value.trim();
  if (!message || isLoading) return;

  isLoading = true;
  sendButton.disabled = true;
  messageInput.value = '';

  // Add user message to UI
  addMessage(message, 'user');

  // Add to history
  conversationHistory.push({ role: 'user', content: message });

  // Show loading
  const loadingEl = addLoadingMessage();

  try {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message,
        history: conversationHistory.slice(-8) // Last 8 messages for context
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Chat failed');
    }

    const data = await response.json();

    // Remove loading
    loadingEl.remove();

    // Add Mitch's response
    addMessage(data.response, 'mitch');

    // Add to history
    conversationHistory.push({ role: 'assistant', content: data.response });

    // Save conversation
    saveConversationHistory();

    // Refresh context (positions may have changed)
    await loadContext();

  } catch (error) {
    console.error('Chat error:', error);
    loadingEl.remove();
    addMessage(`Error: ${error.message}. Make sure the API is running and ANTHROPIC_API_KEY is set.`, 'mitch');
  } finally {
    isLoading = false;
    sendButton.disabled = false;
    messageInput.focus();
  }
}

// Add message to chat
function addMessage(content, type) {
  const messageEl = document.createElement('div');
  messageEl.className = `message ${type}`;

  const avatar = type === 'mitch' ? 'M' : 'Y';

  // Parse markdown-like formatting
  const formattedContent = formatMessage(content);

  messageEl.innerHTML = `
    <div class="message-avatar">${avatar}</div>
    <div class="message-content">${formattedContent}</div>
  `;

  messagesContainer.appendChild(messageEl);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  return messageEl;
}

// Add loading indicator
function addLoadingMessage() {
  const messageEl = document.createElement('div');
  messageEl.className = 'message mitch loading';
  messageEl.innerHTML = `
    <div class="message-avatar">M</div>
    <div class="message-content">
      <div class="loading-dot"></div>
      <div class="loading-dot"></div>
      <div class="loading-dot"></div>
    </div>
  `;
  messagesContainer.appendChild(messageEl);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  return messageEl;
}

// Format message with basic markdown
function formatMessage(text) {
  return text
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Code
    .replace(/`(.*?)`/g, '<code>$1</code>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    // Wrap in paragraph
    .replace(/^(.*)$/, '<p>$1</p>');
}

// Quick message buttons
function quickMessage(text) {
  messageInput.value = text;
  sendMessage();
}

// Save conversation to local storage
function saveConversationHistory() {
  try {
    // Keep last 20 messages
    const toSave = conversationHistory.slice(-20);
    localStorage.setItem('bigmitch_history', JSON.stringify(toSave));
  } catch (e) {
    console.warn('Could not save history:', e);
  }
}

// Load conversation from local storage
function loadConversationHistory() {
  try {
    const saved = localStorage.getItem('bigmitch_history');
    if (saved) {
      conversationHistory = JSON.parse(saved);

      // Restore messages to UI (last 5 only to keep it clean)
      const recent = conversationHistory.slice(-5);
      recent.forEach(msg => {
        const type = msg.role === 'assistant' ? 'mitch' : 'user';
        // Don't add the default greeting again
        if (msg.role === 'assistant' && msg.content.includes("What's happening on the chart")) return;
        addMessage(msg.content, type);
      });
    }
  } catch (e) {
    console.warn('Could not load history:', e);
    conversationHistory = [];
  }
}

// Clear chat history
function clearHistory() {
  conversationHistory = [];
  localStorage.removeItem('bigmitch_history');
  messagesContainer.innerHTML = `
    <div class="message mitch">
      <div class="message-avatar">M</div>
      <div class="message-content">
        <p>What's happening on the chart? Tell me what you're seeing and I'll give you my read.</p>
      </div>
    </div>
  `;
}
