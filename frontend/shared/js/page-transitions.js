/**
 * SIYAYASAN V2 - Institutional Clean Page Transitions
 * Standar transisi institusional kelas dunia:
 * 1. Zero Layout Shift (Header dipin tanpa bergeser 1 pixel pun).
 * 2. Header Pinning via view-transition-name: site-header.
 * 3. Silky smooth cross-fade (tanpa lonjakan translateY yang membuat pusing).
 * 4. Micro Loading Bar di bagian atas (seperti GitHub/YouTube) untuk feedback instan.
 * 5. Kompatibel 100% dengan Tailwind Play CDN.
 */
(function () {
  'use strict';

  if (window.__SIY_TRANSITIONS_V4__) return;
  window.__SIY_TRANSITIONS_V4__ = true;

  // 1. Inject Styles for Zero-Shift Header, Silky Cross-Fade & Top Progress Bar
  const STYLE_ID = 'siy-institutional-transitions-css';
  let styleEl = document.getElementById(STYLE_ID);
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = `
    /* 1. Zero Layout Shift: Reservasi ruang header presisi sesuai tinggi navbar asli (64px mobile, 80px desktop) */
    #site-header {
      display: block;
      width: 100%;
      min-height: 64px;
      margin: 0;
      padding: 0;
    }
    @media (min-width: 640px) {
      #site-header {
        min-height: 80px;
      }
    }

    /* 2. Native View Transitions (Chrome 111+, Edge, Safari 18+) */
    @view-transition {
      navigation: auto;
    }

    /* Pin header dan nav agar TIDAK pernah ikut ter-reload atau berkedip */
    #site-header, nav.sticky {
      view-transition-name: site-header;
    }

    /* Silky Cross-Fade: Lembut, tenang, tanpa lonjakan posisi */
    ::view-transition-old(root) {
      animation: 140ms cubic-bezier(0.2, 0, 0, 1) both siyFadeOut;
    }
    ::view-transition-new(root) {
      animation: 200ms cubic-bezier(0.2, 0, 0, 1) both siyFadeIn;
    }
    @keyframes siyFadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    @keyframes siyFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* 3. Sleek Top Progress Bar (Feedback visual instan saat tautan diklik) */
    #siy-page-progress {
      position: fixed;
      top: 0;
      left: 0;
      height: 3px;
      width: 0%;
      background: linear-gradient(90deg, #38BDF8, #0284C7, #0369A1);
      z-index: 999999;
      pointer-events: none;
      opacity: 0;
      transition: width 350ms cubic-bezier(0.1, 0.8, 0.2, 1), opacity 150ms ease-out;
      box-shadow: 0 0 10px rgba(14, 165, 233, 0.6);
    }
    #siy-page-progress.active {
      opacity: 1;
      width: 70%;
    }
    #siy-page-progress.done {
      width: 100%;
      opacity: 0;
      transition: width 150ms ease-out, opacity 250ms ease-out 100ms;
    }

    /* 4. Reduced Motion Preference */
    @media (prefers-reduced-motion: reduce) {
      ::view-transition-old(root), ::view-transition-new(root) {
        animation: none !important;
      }
      #siy-page-progress {
        display: none !important;
      }
    }
  `;

  // 2. Buat Elemen Progress Bar jika belum ada
  let progressBar = document.getElementById('siy-page-progress');
  if (!progressBar) {
    progressBar = document.createElement('div');
    progressBar.id = 'siy-page-progress';
    document.body.appendChild(progressBar);
  }

  // 3. Inject Speculation Rules API untuk Prerendering Instan di Browser Modern
  if (HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) {
    if (!document.getElementById('siy-speculation-rules')) {
      const specScript = document.createElement('script');
      specScript.id = 'siy-speculation-rules';
      specScript.type = 'speculationrules';
      specScript.textContent = JSON.stringify({
        prerender: [
          {
            source: 'list',
            urls: [
              'index.html',
              'profil.html',
              'berita.html',
              'pengumuman.html',
              'agenda.html',
              'galeri.html',
              'ppdb.html',
              'kontak.html',
              'login.html'
            ]
          }
        ]
      });
      document.head.appendChild(specScript);
    }
  }

  // 4. Tangani Klik Tautan Internal dengan Top Progress Bar
  document.addEventListener('click', function (e) {
    const a = e.target.closest('a');
    if (!a) return;

    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target && a.target !== '_self') return;
    if (a.hasAttribute('download')) return;

    const href = a.getAttribute('href');
    if (!href || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

    // Smooth Scroll untuk Anchor Hash dalam Halaman yang Sama
    if (href.startsWith('#')) {
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.pushState(null, '', href);
      }
      return;
    }

    // Aktifkan loading progress bar di atas
    if (progressBar) {
      progressBar.classList.remove('done');
      progressBar.classList.add('active');
    }
  });

  // 5. Bersihkan Progress Bar saat Halaman Selesai Dimuat atau Kembali dari Cache
  window.addEventListener('pageshow', function () {
    if (progressBar) {
      progressBar.classList.add('done');
      setTimeout(function () {
        progressBar.classList.remove('active', 'done');
      }, 350);
    }
  });
})();
