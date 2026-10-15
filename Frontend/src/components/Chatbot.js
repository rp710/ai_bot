import { state } from '../services/state.js';
import { sendChatMessage } from '../services/api_v2.js';
import { navigate } from '../router.js';

const QUICK_PROMPTS = [
  "👔 Men's Shirts",
  "👗 Summer Dresses",
  "⚡ Under ₹1000",
  "👶 Kids Wear",
  "🔥 Trending Now"
];

let isInitialized = false;

/**
 * Initializes the Chatbot in #chatbot-root.
 * Keeps the chat state persistent across page navigation.
 */
export function initChatbot() {
  const root = document.getElementById('chatbot-root');
  if (!root) return;
  
  renderChatbotUI();
  
  if (!isInitialized) {
    isInitialized = true;
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.chatOpen) {
        state.chatOpen = false;
        renderChatbotUI();
      }
    });
  }
}

/**
 * Re-renders only the Chatbot DOM without touching the main #app page.
 */
export function renderChatbotUI() {
  const root = document.getElementById('chatbot-root');
  if (!root) return;

  const { chatOpen, chatLoading, chatMessages, chatInput } = state;

  root.innerHTML = `
    <div class="chatbot-wrapper ${chatOpen ? 'is-open' : ''}">
      ${chatOpen ? `<div class="chatbot-backdrop" id="chatBackdrop"></div>` : ''}

      <!-- Floating Trigger Button -->
      <button id="chatToggleBtn" class="chatbot-fab" aria-label="Open AI Shopping Assistant">
        <span class="chatbot-fab-icon">${chatOpen ? '✕' : '💬'}</span>
        <span class="chatbot-fab-text">${chatOpen ? 'Close' : 'Ask AI'}</span>
        <span class="chatbot-fab-pulse"></span>
      </button>

      <!-- Chat Window / Bottom Sheet on Mobile -->
      ${chatOpen ? `
      <div class="chatbot-sheet" id="chatbotSheet" role="dialog" aria-modal="true" aria-label="AI Shopping Assistant">
        <!-- Header -->
        <div class="chatbot-sheet-header">
          <div class="chatbot-header-left">
            <div class="chatbot-avatar">🤖</div>
            <div class="chatbot-header-info">
              <span class="chatbot-header-title">LUXE AI Assistant</span>
              <span class="chatbot-header-status">
                <span class="status-dot"></span> Online • GenAI Shopping
              </span>
            </div>
          </div>
          <button id="chatCloseBtn" class="chatbot-close-btn" aria-label="Close Chat">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Messages Area -->
        <div class="chatbot-messages" id="chatMessagesContainer">
          ${chatMessages.length === 0 ? `
            <div class="chat-welcome">
              <div class="welcome-icon">✨</div>
              <h4>Welcome to LUXE Assistant!</h4>
              <p>Ask me anything about our clothing catalog, styles, or sizing. Or tap a quick prompt below:</p>
            </div>
          ` : ''}

          ${chatMessages.map(msg => {
            if (msg.sender === 'user') {
              return `
                <div class="message message-user">
                  <div class="message-bubble">${escapeHtml(msg.text)}</div>
                </div>
              `;
            } else if (msg.type === 'text') {
              return `
                <div class="message message-bot">
                  <div class="message-bot-avatar">🤖</div>
                  <div class="message-bubble">${escapeHtml(msg.message)}</div>
                </div>
              `;
            } else if (msg.type === 'products') {
              return `
                <div class="message message-bot">
                  <div class="message-bot-avatar">🤖</div>
                  <div class="message-bubble">
                    ${msg.message ? `<p class="message-caption">${escapeHtml(msg.message)}</p>` : ''}
                    ${msg.data && msg.data.length === 0 ? `<p class="no-products">No matching products found 😢</p>` : ''}
                    ${msg.data && msg.data.length > 0 ? `
                      <div class="message-products-grid">
                        ${msg.data.map(p => `
                          <div class="chat-product-card" data-id="${p.id}">
                            <img src="${p.image}" alt="${escapeHtml(p.name)}" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80';" />
                            <div class="chat-product-info">
                              <p class="chat-product-name">${escapeHtml(p.name)}</p>
                              <p class="chat-product-price">₹${p.price}</p>
                            </div>
                            <span class="chat-product-view-btn">View →</span>
                          </div>
                        `).join('')}
                      </div>
                    ` : ''}
                  </div>
                </div>
              `;
            }
            return '';
          }).join('')}

          ${chatLoading ? `
            <div class="message message-bot">
              <div class="message-bot-avatar">🤖</div>
              <div class="message-bubble typing-bubble">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Quick Suggestions Horizontal Scroll -->
        <div class="chat-quick-suggestions">
          ${QUICK_PROMPTS.map(p => `
            <button class="quick-prompt-chip" data-prompt="${p}">${p}</button>
          `).join('')}
        </div>

        <!-- Input Bar -->
        <form class="chatbot-input-bar" id="chatForm">
          <input 
            type="text" 
            id="chatInputField" 
            value="${escapeHtml(chatInput)}" 
            placeholder="Ask AI (e.g. Blue summer shirts)..." 
            autocomplete="off"
          />
          <button type="submit" id="chatSubmitBtn" class="chat-send-btn" ${chatLoading ? 'disabled' : ''} aria-label="Send Message">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
      ` : ''}
    </div>
  `;

  attachChatEvents();

  // Auto-scroll to bottom of messages
  if (chatOpen) {
    const container = document.getElementById('chatMessagesContainer');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }
}

function attachChatEvents() {
  // Toggle button
  document.getElementById('chatToggleBtn')?.addEventListener('click', () => {
    state.chatOpen = !state.chatOpen;
    renderChatbotUI();
    if (state.chatOpen) {
      setTimeout(() => {
        document.getElementById('chatInputField')?.focus();
      }, 100);
    }
  });

  // Close button
  document.getElementById('chatCloseBtn')?.addEventListener('click', () => {
    state.chatOpen = false;
    renderChatbotUI();
  });

  // Backdrop click closes on mobile
  document.getElementById('chatBackdrop')?.addEventListener('click', () => {
    state.chatOpen = false;
    renderChatbotUI();
  });

  // Form submit
  document.getElementById('chatForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    executeSendMessage();
  });

  // Input sync
  const inputEl = document.getElementById('chatInputField');
  if (inputEl) {
    inputEl.addEventListener('input', (e) => {
      state.chatInput = e.target.value;
    });
  }

  // Quick prompt chips
  document.querySelectorAll('.quick-prompt-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      const promptText = chip.dataset.prompt.replace(/^[^\w\s]+/, '').trim();
      executeSendMessage(promptText);
    });
  });

  // Product card recommendations click
  document.querySelectorAll('.chat-product-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      if (id) {
        // If on small mobile, close chat so product is visible
        if (window.innerWidth < 640) {
          state.chatOpen = false;
          renderChatbotUI();
        }
        navigate(`#/product/${id}`);
      }
    });
  });
}

async function executeSendMessage(overrideText = null) {
  const textToSend = (overrideText !== null ? overrideText : state.chatInput).trim();
  if (!textToSend || state.chatLoading) return;

  // Add user message
  state.chatMessages = [...state.chatMessages, { sender: 'user', text: textToSend }];
  state.chatInput = '';
  state.chatLoading = true;
  renderChatbotUI();

  try {
    const data = await sendChatMessage(textToSend);
    state.chatMessages = [...state.chatMessages, {
      sender: 'bot',
      type: data.type || 'text',
      data: data.data || [],
      message: data.message || ''
    }];
  } catch (err) {
    console.error('Chat error:', err);
    state.chatMessages = [...state.chatMessages, {
      sender: 'bot',
      type: 'text',
      message: 'Sorry, I had trouble connecting to the assistant. Please make sure the server is running!'
    }];
  } finally {
    state.chatLoading = false;
    renderChatbotUI();
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
