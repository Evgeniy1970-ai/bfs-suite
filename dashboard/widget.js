(function() {
  'use strict';

  // BFS Widget — embeddable chat for public sites
  // Usage: <script src="widget.js" data-webhook="YOUR_WEBHOOK_URL" data-api-key="YOUR_PUBLIC_KEY"></script>

  const script = document.currentScript;
  const WEBHOOK_URL = script?.getAttribute('data-webhook') || '';
  const API_KEY = script?.getAttribute('data-api-key') || '';
  const ACCENT = script?.getAttribute('data-accent') || '#2d6a4f';
  const COMPANY = script?.getAttribute('data-company') || 'Assistant';

  // Generate session ID
  const SESSION_ID = 'widget_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');

    #bfs-widget-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: ${ACCENT};
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,0.18);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99998;
      transition: transform 0.2s, box-shadow 0.2s;
      outline: none;
    }
    #bfs-widget-btn:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 28px rgba(0,0,0,0.22);
    }
    #bfs-widget-btn svg { transition: transform 0.3s; }
    #bfs-widget-btn.open svg { transform: rotate(45deg); }

    #bfs-widget-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 14px;
      height: 14px;
      background: #ef4444;
      border-radius: 50%;
      border: 2px solid #fff;
      display: none;
    }
    #bfs-widget-badge.show { display: block; }

    #bfs-widget-panel {
      position: fixed;
      bottom: 92px;
      right: 24px;
      width: 360px;
      height: 520px;
      background: #fdfaf4;
      border-radius: 20px;
      box-shadow: 0 12px 48px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08);
      z-index: 99997;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: 'DM Sans', sans-serif;
      transform: scale(0.92) translateY(16px);
      opacity: 0;
      pointer-events: none;
      transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s;
      border: 1px solid rgba(100,80,40,0.1);
    }
    #bfs-widget-panel.open {
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events: all;
    }

    .bfs-header {
      background: ${ACCENT};
      padding: 16px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }
    .bfs-header-avatar {
      width: 36px;
      height: 36px;
      background: rgba(255,255,255,0.2);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      flex-shrink: 0;
    }
    .bfs-header-info { flex: 1; }
    .bfs-header-name {
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      line-height: 1.2;
    }
    .bfs-header-status {
      font-size: 11px;
      color: rgba(255,255,255,0.75);
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 2px;
    }
    .bfs-status-dot {
      width: 6px;
      height: 6px;
      background: #86efac;
      border-radius: 50%;
      animation: bfsPulse 2s infinite;
    }
    @keyframes bfsPulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

    .bfs-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .bfs-messages::-webkit-scrollbar { width: 3px; }
    .bfs-messages::-webkit-scrollbar-thumb { background: #d4c9b0; border-radius: 3px; }

    .bfs-msg { display: flex; gap: 8px; align-items: flex-end; }
    .bfs-msg.user { flex-direction: row-reverse; }

    .bfs-msg-avatar {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 600;
      flex-shrink: 0;
      margin-bottom: 2px;
    }
    .bfs-msg-avatar.bot {
      background: ${ACCENT}22;
      color: ${ACCENT};
      border: 1px solid ${ACCENT}33;
    }
    .bfs-msg-avatar.user {
      background: #ede8de;
      color: #6b5c3e;
    }

    .bfs-msg-content { max-width: 80%; }

    .bfs-agent-tag {
      font-size: 9px;
      font-family: 'DM Mono', monospace;
      color: #a0906e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
      padding-left: 2px;
    }

    .bfs-bubble {
      padding: 10px 13px;
      border-radius: 14px;
      font-size: 13px;
      line-height: 1.55;
      word-break: break-word;
    }
    .bfs-msg.bot .bfs-bubble {
      background: #fff;
      color: #2c2416;
      border: 1px solid #ede8de;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .bfs-msg.user .bfs-bubble {
      background: ${ACCENT};
      color: #fff;
      border-bottom-right-radius: 4px;
    }

    .bfs-typing {
      display: flex;
      gap: 4px;
      align-items: center;
      padding: 12px 14px;
      background: #fff;
      border: 1px solid #ede8de;
      border-radius: 14px;
      border-bottom-left-radius: 4px;
      width: fit-content;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .bfs-typing-dot {
      width: 6px; height: 6px;
      background: #a0906e;
      border-radius: 50%;
      animation: bfsTyping 1.2s infinite;
    }
    .bfs-typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .bfs-typing-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bfsTyping { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }

    .bfs-input-area {
      padding: 12px;
      border-top: 1px solid #ede8de;
      background: #fdfaf4;
      flex-shrink: 0;
    }
    .bfs-input-row {
      display: flex;
      gap: 8px;
      align-items: flex-end;
      background: #fff;
      border: 1px solid #d4c9b0;
      border-radius: 14px;
      padding: 8px 8px 8px 14px;
      transition: border-color 0.15s;
    }
    .bfs-input-row:focus-within { border-color: ${ACCENT}; }

    .bfs-input {
      flex: 1;
      border: none;
      background: transparent;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      color: #2c2416;
      resize: none;
      outline: none;
      line-height: 1.5;
      min-height: 20px;
      max-height: 80px;
    }
    .bfs-input::placeholder { color: #a0906e; }

    .bfs-send {
      width: 32px;
      height: 32px;
      background: ${ACCENT};
      border: none;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.15s, transform 0.1s;
      color: #fff;
    }
    .bfs-send:hover { filter: brightness(1.1); }
    .bfs-send:active { transform: scale(0.95); }
    .bfs-send:disabled { opacity: 0.4; cursor: not-allowed; }

    .bfs-footer {
      text-align: center;
      font-size: 10px;
      color: #a0906e;
      font-family: 'DM Mono', monospace;
      padding: 6px 0 10px;
    }

    .bfs-error {
      font-size: 12px;
      color: #b91c1c;
      background: #fee2e2;
      border: 1px solid #fecaca;
      border-radius: 10px;
      padding: 8px 12px;
    }

    @media (max-width: 420px) {
      #bfs-widget-panel {
        width: calc(100vw - 16px);
        right: 8px;
        bottom: 80px;
        height: 70vh;
      }
      #bfs-widget-btn { right: 16px; bottom: 16px; }
    }
  `;
  document.head.appendChild(style);

  // Create widget HTML
  const container = document.createElement('div');
  container.id = 'bfs-widget-root';
  container.innerHTML = `
    <button id="bfs-widget-btn" aria-label="Open chat">
      <div id="bfs-widget-badge"></div>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </button>

    <div id="bfs-widget-panel" role="dialog" aria-label="Chat">
      <div class="bfs-header">
        <div class="bfs-header-avatar">🤖</div>
        <div class="bfs-header-info">
          <div class="bfs-header-name">${COMPANY} Assistant</div>
          <div class="bfs-header-status">
            <div class="bfs-status-dot"></div>
            <span>Online · Powered by BFS</span>
          </div>
        </div>
      </div>

      <div class="bfs-messages" id="bfs-messages">
        <div class="bfs-msg bot">
          <div class="bfs-msg-avatar bot">B</div>
          <div class="bfs-msg-content">
            <div class="bfs-bubble">👋 Hi! I can help with questions about ${COMPANY}. What would you like to know?</div>
          </div>
        </div>
      </div>

      <div class="bfs-input-area">
        <div class="bfs-input-row">
          <textarea class="bfs-input" id="bfs-input" placeholder="Ask a question…" rows="1"
            onkeydown="bfsHandleKey(event)" oninput="bfsResize(this)"></textarea>
          <button class="bfs-send" id="bfs-send" onclick="bfsSend()" aria-label="Send">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <div class="bfs-footer">Secured · Public access only</div>
      </div>
    </div>
  `;
  document.body.appendChild(container);

  // State
  let isOpen = false;
  let isLoading = false;

  // Toggle
  const btn = document.getElementById('bfs-widget-btn');
  const panel = document.getElementById('bfs-widget-panel');
  const badge = document.getElementById('bfs-widget-badge');

  btn.addEventListener('click', () => {
    isOpen = !isOpen;
    btn.classList.toggle('open', isOpen);
    panel.classList.toggle('open', isOpen);
    badge.classList.remove('show');
    if (isOpen) {
      setTimeout(() => document.getElementById('bfs-input')?.focus(), 300);
    }
  });

  // Global functions
  window.bfsHandleKey = function(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); bfsSend(); }
  };

  window.bfsResize = function(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 80) + 'px';
  };

  window.bfsSend = async function() {
    const input = document.getElementById('bfs-input');
    const sendBtn = document.getElementById('bfs-send');
    const msg = input.value.trim();
    if (!msg || isLoading) return;

    if (!WEBHOOK_URL) {
      appendMsg('bot', '⚠ Widget not configured. Please set data-webhook attribute.');
      return;
    }

    input.value = '';
    input.style.height = 'auto';
    isLoading = true;
    sendBtn.disabled = true;

    appendMsg('user', msg);
    const typingEl = appendTyping();

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({
          message: msg,
          session_id: SESSION_ID,
          channel: 'web_widget',
        }),
      });

      typingEl.remove();

      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();

      let responseText = data.response || data.output || data.message || 'Sorry, I could not process your request.';
      if (typeof responseText === 'string') {
        try { responseText = JSON.parse(responseText); } catch(e) {}
      }

      const agentUsed = data.agent_type || data.agent || 'assistant';
      appendMsg('bot', responseText, agentUsed);

      // Show badge if panel closed
      if (!isOpen) badge.classList.add('show');

    } catch(err) {
      typingEl.remove();
      appendMsg('bot', '⚠ Connection error. Please try again later.', null, true);
    }

    isLoading = false;
    sendBtn.disabled = false;
    input.focus();
  };

  function appendMsg(role, text, agent, isError) {
    const messages = document.getElementById('bfs-messages');
    const isUser = role === 'user';
    const div = document.createElement('div');
    div.className = 'bfs-msg ' + (isUser ? 'user' : 'bot');

    const agentTag = agent && !isUser ? `<div class="bfs-agent-tag">● ${agent}</div>` : '';
    const bubbleClass = isError ? 'bfs-error' : 'bfs-bubble';

    div.innerHTML = `
      <div class="bfs-msg-avatar ${isUser ? 'user' : 'bot'}">${isUser ? '👤' : 'B'}</div>
      <div class="bfs-msg-content">
        ${agentTag}
        <div class="${bubbleClass}">${escapeHtml(String(text))}</div>
      </div>`;

    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
  }

  function appendTyping() {
    const messages = document.getElementById('bfs-messages');
    const div = document.createElement('div');
    div.className = 'bfs-msg bot';
    div.innerHTML = `
      <div class="bfs-msg-avatar bot">B</div>
      <div class="bfs-msg-content">
        <div class="bfs-typing">
          <div class="bfs-typing-dot"></div>
          <div class="bfs-typing-dot"></div>
          <div class="bfs-typing-dot"></div>
        </div>
      </div>`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
  }

  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
  }

})();
