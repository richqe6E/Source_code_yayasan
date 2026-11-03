/**
 * SIYAYASAN Smart Q/A Assistant — Interactive UI Controller
 * Manages Chat Modal, Message History, Suggested Chips, 11-Step PPDB Stepper, and Accessibility.
 */

(function () {
  'use strict';

  if (window.__SIY_QA_ASSISTANT_LOADED__) return;
  window.__SIY_QA_ASSISTANT_LOADED__ = true;

  const STORAGE_KEY = 'siy_qa_chat_history_v1';
  let isTyping = false;
  let activeGuideStep = 1;

  // Escape HTML untuk mencegah XSS
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Format markdown sederhana (*teks* -> <strong>teks</strong>, \n -> <br>)
  function formatMarkdown(text) {
    if (!text) return '';
    let formatted = escapeHtml(text);

    // Bold text: *teks*
    formatted = formatted.replace(/\*([^*]+)\*/g, '<strong class="font-bold text-slate-900">$1</strong>');

    // Bullet lists: • teks
    formatted = formatted.replace(/•\s+([^\n]+)/g, '<div class="flex items-start gap-1.5 my-0.5"><span class="text-primary-600 font-bold shrink-0">•</span><span>$1</span></div>');

    // Numbered lists: 1. teks
    formatted = formatted.replace(/(\d+)\.\s+([^\n]+)/g, '<div class="flex items-start gap-1.5 my-0.5"><span class="font-bold text-slate-800 shrink-0">$1.</span><span>$2</span></div>');

    // Newlines
    formatted = formatted.replace(/\n\n/g, '<div class="h-2"></div>');
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
  }

  // Bangun Template Komponen Widget Chat
  function buildWidgetMarkup(basePath) {
    const base = basePath || './';

    return `
      <!-- Tombol Trigger Melayang Asisten Informasi (Tepat di Atas WhatsApp) -->
      <div class="site-floating-item group" id="site-floating-qa-wrapper">
        <span class="site-floating-tooltip">
          Tanya Asisten Informasi SIYAYASAN
        </span>
        <button id="site-floating-qa" 
                type="button"
                aria-label="Buka Asisten Informasi SIYAYASAN" 
                aria-expanded="false"
                aria-controls="siy-qa-modal">
          <i class="fi fi-rr-comment-alt-dots text-2xl sm:text-[1.625rem]"></i>
          <span class="qa-notification-badge" title="Asisten Siap Membantu"></span>
        </button>
      </div>

      <!-- Modal Dialog Percakapan Interaktif -->
      <div id="siy-qa-modal" role="dialog" aria-modal="true" aria-labelledby="qa-modal-title">
        <!-- Header -->
        <div class="qa-modal-header">
          <div class="qa-header-info">
            <div class="qa-header-avatar">
              <i class="fi fi-rr-robot text-lg text-white"></i>
            </div>
            <div class="min-w-0">
              <h3 class="qa-header-title" id="qa-modal-title">Asisten Informasi</h3>
              <div class="qa-header-status">
                <span class="qa-status-dot"></span>
                <span>Yayasan At Tarbiyyah &bull; Siap Membantu</span>
              </div>
            </div>
          </div>
          <div class="qa-header-actions">
            <button type="button" class="qa-header-btn" id="qa-btn-clear" title="Bersihkan Percakapan" aria-label="Bersihkan Percakapan">
              <i class="fi fi-rr-refresh text-xs"></i>
            </button>
            <button type="button" class="qa-header-btn" id="qa-btn-close" title="Tutup Percakapan" aria-label="Tutup Percakapan">
              <i class="fi fi-rr-cross text-xs"></i>
            </button>
          </div>
        </div>

        <!-- Chat Body (Percakapan) -->
        <div class="qa-modal-body" id="qa-chat-messages" role="log" aria-live="polite">
          <!-- Pesan-pesan akan dirender di sini via JS -->
        </div>

        <!-- Quick Chips (Rekomendasi Pertanyaan Cepat) -->
        <div class="qa-suggestions-wrapper" id="qa-suggestions-area">
          <div class="qa-suggestions-title">
            <i class="fi fi-rr-bulb text-[10px] text-amber-500"></i>
            <span>Rekomendasi Pertanyaan</span>
          </div>
          <div class="qa-chips-container" id="qa-chips-list">
            <!-- Chips dirender dinamis -->
          </div>
        </div>

        <!-- Footer / Input Form -->
        <div class="qa-modal-footer">
          <form class="qa-input-form" id="qa-chat-form" onsubmit="return false;">
            <input type="text" 
                   class="qa-input-field" 
                   id="qa-input-text" 
                   placeholder="Ketik pertanyaan Anda seputar PPDB / yayasan..." 
                   autocomplete="off" 
                   maxlength="250"
                   aria-label="Ketik pertanyaan">
            <button type="submit" class="qa-send-btn" id="qa-btn-send" title="Kirim Pertanyaan" aria-label="Kirim">
              <i class="fi fi-rr-paper-plane text-xs"></i>
            </button>
          </form>
        </div>
      </div>
    `;
  }

  // Simpan & Ambil Riwayat Percakapan
  function loadHistory() {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return null;
  }

  function saveHistory(messages) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (_) {}
  }

  // Format & Render Pesan ke dalam DOM
  function renderMessageItem(msg) {
    const isUser = msg.sender === 'user';
    const row = document.createElement('div');
    row.className = `qa-message-row ${isUser ? 'user' : 'assistant'}`;

    if (isUser) {
      row.innerHTML = `<div class="qa-bubble">${escapeHtml(msg.text)}</div>`;
    } else {
      let actionsHtml = '';
      if (msg.actions && msg.actions.length > 0) {
        actionsHtml = `
          <div class="qa-bubble-actions">
            ${msg.actions.map(act => {
              if (act.action === 'open_ppdb_guide') {
                return `
                  <button type="button" class="qa-action-btn qa-trigger-guide" data-action="open_ppdb_guide">
                    <i class="${act.icon || 'fi fi-rr-workflow'}"></i>
                    <span>${escapeHtml(act.label)}</span>
                  </button>
                `;
              }
              const target = act.isExternal ? 'target="_blank" rel="noopener noreferrer"' : '';
              return `
                <a href="${escapeHtml(act.url)}" class="qa-action-btn" ${target}>
                  <i class="${act.icon || 'fi fi-rr-arrow-small-right'}"></i>
                  <span>${escapeHtml(act.label)}</span>
                </a>
              `;
            }).join('')}
          </div>
        `;
      }

      // Render modul interaktif stepper jika intent adalah ppdb_11_steps
      let guideCardHtml = '';
      if (msg.isGuideCard && window.SiyQaEngine) {
        const steps = window.SiyQaEngine.getPpdbGuideSteps();
        const current = steps[activeGuideStep - 1] || steps[0];
        guideCardHtml = `
          <div class="qa-guide-card mt-2">
            <div class="qa-guide-header">
              <span class="qa-guide-step-badge">Tahap ${current.step} dari ${steps.length}</span>
              <span class="text-[10px] text-slate-400 font-semibold">PPDB TA 2026/2027</span>
            </div>
            <h4 class="qa-guide-title">${escapeHtml(current.title)}</h4>
            <p class="qa-guide-desc">${escapeHtml(current.detail)}</p>
            ${current.actionUrl ? `
              <a href="${escapeHtml(current.actionUrl)}" class="qa-action-btn w-full justify-center mb-2">
                <i class="fi fi-rr-arrow-up-right-from-square"></i>
                <span>${escapeHtml(current.actionLabel || 'Buka Halaman Terkait')}</span>
              </a>
            ` : ''}
            <div class="qa-guide-nav">
              <button type="button" class="qa-guide-nav-btn qa-guide-prev" ${activeGuideStep <= 1 ? 'disabled' : ''}>
                &larr; Sebelumnya
              </button>
              <span class="text-[11px] font-bold text-slate-600">${activeGuideStep} / ${steps.length}</span>
              <button type="button" class="qa-guide-nav-btn qa-guide-next" ${activeGuideStep >= steps.length ? 'disabled' : ''}>
                Berikutnya &rarr;
              </button>
            </div>
          </div>
        `;
      }

      row.innerHTML = `
        <div class="qa-avatar-mini">
          <i class="fi fi-rr-robot"></i>
        </div>
        <div class="qa-bubble">
          <div>${formatMarkdown(msg.text)}</div>
          ${guideCardHtml}
          ${actionsHtml}
        </div>
      `;
    }

    return row;
  }

  // Tampilkan Indikator Mengetik
  function showTypingIndicator(container) {
    const row = document.createElement('div');
    row.id = 'qa-active-typing';
    row.className = 'qa-message-row assistant';
    row.innerHTML = `
      <div class="qa-avatar-mini">
        <i class="fi fi-rr-robot"></i>
      </div>
      <div class="qa-typing-indicator">
        <span class="qa-typing-dot"></span>
        <span class="qa-typing-dot"></span>
        <span class="qa-typing-dot"></span>
      </div>
    `;
    container.appendChild(row);
    container.scrollTop = container.scrollHeight;
  }

  function hideTypingIndicator() {
    const el = document.getElementById('qa-active-typing');
    if (el) el.remove();
  }

  // Inisialisasi Utama Asisten
  function initAssistant(basePath) {
    // 1. Dapatkan atau buat kontainer floating stack
    let stackContainer = document.getElementById('site-floating-actions-container');
    if (!stackContainer) {
      stackContainer = document.createElement('div');
      stackContainer.id = 'site-floating-actions-container';
      document.body.appendChild(stackContainer);
    }

    // 2. Cek apakah tombol WA lama sudah ada di body, jika ada pindahkan ke stackContainer
    const oldWa = document.getElementById('site-floating-wa-wrapper');
    if (oldWa && oldWa.parentNode !== stackContainer) {
      oldWa.parentNode.removeChild(oldWa);
      // Buat ulang sebagai child di stackContainer
    }

    // 3. Masukkan Widget Markup ke dalam stackContainer jika belum ada
    if (!document.getElementById('site-floating-qa')) {
      const widgetWrap = document.createElement('div');
      widgetWrap.innerHTML = buildWidgetMarkup(basePath);
      while (widgetWrap.firstChild) {
        stackContainer.insertBefore(widgetWrap.firstChild, stackContainer.firstChild);
      }
    }

    // 4. Hubungkan Event Listeners
    const btnTrigger = document.getElementById('site-floating-qa');
    const modal = document.getElementById('siy-qa-modal');
    const btnClose = document.getElementById('qa-btn-close');
    const btnClear = document.getElementById('qa-btn-clear');
    const chatBody = document.getElementById('qa-chat-messages');
    const chipsList = document.getElementById('qa-chips-list');
    const inputForm = document.getElementById('qa-chat-form');
    const inputText = document.getElementById('qa-input-text');
    const btnSend = document.getElementById('qa-btn-send');

    if (!btnTrigger || !modal) return;

    let messages = loadHistory();

    // Salam Pembuka Default
    function resetToDefaultGreeting() {
      const ctx = window.SiyQaEngine ? window.SiyQaEngine.getDynamicContext() : { schoolName: 'Yayasan At Tarbiyyah' };
      messages = [
        {
          sender: 'assistant',
          text: `Halo! Selamat datang di *Asisten Informasi SIYAYASAN*.\n\nSaya siap membantu menjawab pertanyaan Anda seputar PPDB, persyaratan pendaftaran, program pendidikan, lokasi sekolah, dan informasi resmi lainnya.\n\nSilakan pilih pertanyaan rekomendasi di bawah atau ketik pertanyaan Anda!`,
          actions: [
            { label: 'Buka Halaman PPDB', url: 'ppdb.html', icon: 'fi fi-rr-document-signed' },
            { label: 'Panduan Alur 11 Langkah', action: 'open_ppdb_guide', icon: 'fi fi-rr-workflow' }
          ]
        }
      ];
      saveHistory(messages);
      renderAllMessages();
    }

    function renderAllMessages() {
      if (!chatBody) return;
      chatBody.innerHTML = '';
      messages.forEach(msg => {
        chatBody.appendChild(renderMessageItem(msg));
      });
      chatBody.scrollTop = chatBody.scrollHeight;
    }

    // Render Quick Chips
    function renderQuickChips() {
      if (!chipsList) return;
      if (!window.SiyQaEngine) {
        setTimeout(renderQuickChips, 200);
        return;
      }
      chipsList.innerHTML = '';
      const chips = window.SiyQaEngine.getSuggestedQuestions();
      chips.forEach(q => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'qa-chip';
        chip.textContent = q;
        chip.onclick = function () {
          handleUserSubmit(q);
        };
        chipsList.appendChild(chip);
      });
    }

    // Buka / Tutup Modal Chat
    function toggleChatModal(forceOpen) {
      const isOpen = typeof forceOpen === 'boolean' ? forceOpen : !modal.classList.contains('is-open');
      if (isOpen) {
        modal.classList.add('is-open');
        btnTrigger.setAttribute('aria-expanded', 'true');
        if (chipsList && chipsList.children.length === 0) {
          renderQuickChips();
        }
        setTimeout(() => {
          if (inputText) inputText.focus();
        }, 150);
      } else {
        modal.classList.remove('is-open');
        btnTrigger.setAttribute('aria-expanded', 'false');
      }
    }

    btnTrigger.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      toggleChatModal();
    };

    if (btnClose) {
      btnClose.onclick = function () {
        toggleChatModal(false);
      };
    }

    if (btnClear) {
      btnClear.onclick = function () {
        resetToDefaultGreeting();
      };
    }

    // Tutup dengan Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        toggleChatModal(false);
      }
    });

    // Tangani Pengiriman Pertanyaan Pengguna
    function handleUserSubmit(query) {
      const q = (query || (inputText ? inputText.value : '')).trim();
      if (!q || isTyping) return;

      if (inputText) inputText.value = '';

      // 1. Masukkan pesan pengguna
      messages.push({ sender: 'user', text: q });
      saveHistory(messages);
      renderAllMessages();

      // 2. Tampilkan typing indicator
      isTyping = true;
      if (btnSend) btnSend.disabled = true;
      showTypingIndicator(chatBody);

      // 3. Proses jawaban via NLP Engine
      setTimeout(() => {
        hideTypingIndicator();
        isTyping = false;
        if (btnSend) btnSend.disabled = false;

        if (!window.SiyQaEngine) {
          messages.push({
            sender: 'assistant',
            text: 'Maaf, sistem sedang memuat basis pengetahuan. Silakan coba kembali sesaat lagi.',
            actions: []
          });
        } else {
          const res = window.SiyQaEngine.findAnswer(q);
          messages.push({
            sender: 'assistant',
            text: res.answer,
            actions: res.actions || [],
            isGuideCard: res.intent === 'ppdb_11_steps'
          });
        }

        saveHistory(messages);
        renderAllMessages();
      }, 350);
    }

    if (inputForm) {
      inputForm.onsubmit = function (e) {
        e.preventDefault();
        handleUserSubmit();
      };
    }

    // Delegasi Event untuk Tombol di Dalam Chat (Modul Panduan & Stepper)
    if (chatBody) {
      chatBody.addEventListener('click', function (e) {
        // Tombol Buka Panduan
        const guideTrigger = e.target.closest('.qa-trigger-guide');
        if (guideTrigger) {
          activeGuideStep = 1;
          handleUserSubmit('Panduan alur pendaftaran PPDB');
          return;
        }

        // Stepper Navigation: Next
        const nextBtn = e.target.closest('.qa-guide-next');
        if (nextBtn && window.SiyQaEngine) {
          const steps = window.SiyQaEngine.getPpdbGuideSteps();
          if (activeGuideStep < steps.length) {
            activeGuideStep++;
            renderAllMessages();
          }
          return;
        }

        // Stepper Navigation: Prev
        const prevBtn = e.target.closest('.qa-guide-prev');
        if (prevBtn) {
          if (activeGuideStep > 1) {
            activeGuideStep--;
            renderAllMessages();
          }
          return;
        }
      });
    }

    // Inisialisasi Percakapan Awal
    if (!messages || messages.length === 0) {
      resetToDefaultGreeting();
    } else {
      renderAllMessages();
    }

    renderQuickChips();
  }

  // Ekspor Global
  window.initSiyQaAssistant = initAssistant;
})();
