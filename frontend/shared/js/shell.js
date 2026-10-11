/**
 * SIYAYASAN Portal Shell
 * Template sidebar + drawer mobile + header desktop yang dipakai ulang oleh 23 halaman portal.
 *
 * Pakai:
 *   <div id="app-shell"></div>
 *   <main id="main-slot"></main>
 *   <script>
 *     Shell.init({
 *       menu: [{href:'dashboard.html', label:'Dashboard'}, ...],
 *       active: 'dashboard.html',
 *       role: 'admin_tu',
 *       title: 'Dashboard',
 *       subtitle: 'Selamat datang kembali',
 *       showRefresh: true,
 *       onRefresh: () => load()
 *     });
 *   </script>
 */
(function () {
  'use strict';

  const STYLES = `
    .skeleton { background: linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%); background-size: 200% 100%; animation: shimmer 1.4s ease-in-out infinite; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    #siy-mobile-nav { transition: transform 0.25s ease; }
    #siy-mobile-nav[aria-hidden="true"] { transform: translateX(-100%); }
    .siy-nav-item { display:flex; align-items:center; gap:0.75rem; padding:0.625rem 0.875rem; font-size:0.875rem; font-weight:500; border-radius:0.5rem; color:#4B5563; transition: all 0.15s ease; }
    .siy-nav-item:hover { background-color:#F3F4F6; color:#111827; }
    .siy-nav-active { background-color:#EFF6FF; color:#1D4ED8; font-weight:600; }
    .siy-nav-active svg { color:#2563EB; }
  `;

  const ADMIN_MENU = [
    {
      href: 'dashboard.html',
      label: 'Dashboard',
      icon: `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>`
    },
    {
      href: 'students.html',
      label: 'Data Siswa & Rombel',
      icon: `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5"/></svg>`
    },
    {
      href: 'teachers.html',
      label: 'Data Guru & Pendidik',
      icon: `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>`
    },
    {
      href: 'classes.html',
      label: 'Rombel & Kelas',
      icon: `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>`
    },
    {
      href: 'ppdb.html',
      label: 'PPDB & Validasi',
      icon: `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>`
    },
    {
      href: 'payments.html',
      label: 'Pembayaran & SPP',
      icon: `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>`
    },
    {
      href: 'content.html',
      label: 'Berita & Pengumuman',
      icon: `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>`
    },
    {
      href: 'cms_setting.html',
      label: 'CMS Banner & Web',
      icon: `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>`
    },
    {
      href: 'users.html',
      label: 'Kelola Pengguna',
      icon: `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>`
    },
    {
      href: 'reports.html',
      label: 'Laporan & Rekap',
      icon: `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`
    },
    {
      href: 'logs.html',
      label: 'Activity Log',
      icon: `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
    },
    {
      href: 'backup.html',
      label: 'Backup & Restore',
      icon: `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/></svg>`
    }
  ];

  const DEFAULT_ICON = `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 6h16M4 12h16M4 18h16"/></svg>`;

  function getMenuIcon(m) {
    if (m.icon) return m.icon;
    const found = ADMIN_MENU.find(item => item.href === m.href);
    return (found && found.icon) || DEFAULT_ICON;
  }

  function renderDesktopNav(menu, active) {
    return menu.map(m => {
      const isActive = m.href === active || (active && active.endsWith(m.href));
      const cls = isActive ? 'siy-nav-item siy-nav-active' : 'siy-nav-item';
      const icon = getMenuIcon(m);
      return `<a href="${m.href}" class="${cls}">${icon}<span>${m.label}</span></a>`;
    }).join('');
  }

  function renderMobileNav(menu, active) {
    return menu.map(m => {
      const isActive = m.href === active || (active && active.endsWith(m.href));
      const cls = isActive ? 'siy-nav-item siy-nav-active' : 'siy-nav-item';
      const icon = getMenuIcon(m);
      return `<a href="${m.href}" class="${cls}" onclick="Shell.closeNav()">${icon}<span>${m.label}</span></a>`;
    }).join('');
  }

  function buildShell(opts) {
    const isAdminPortal = (opts.portalLabel === 'Portal Admin') ||
      (typeof window !== 'undefined' && window.location.pathname.includes('/admin/'));

    let menu = opts.menu || [];
    if (isAdminPortal && (!menu || menu.length < 12)) {
      menu = ADMIN_MENU;
    }

    const active = opts.active || (menu[0] && menu[0].href) || '';
    const homeLink = opts.homeLink || (menu[0] && menu[0].href) || 'dashboard.html';
    const title = opts.title || 'Yayasan Samarinda';
    const subtitle = opts.subtitle || '';
    const user = (typeof window.getCurrentUser === 'function') ? window.getCurrentUser() : null;
    const userName = (user && user.full_name) || (opts.roleLabel || 'Pengguna');
    const userInitial = (user && user.full_name && user.full_name.charAt(0).toUpperCase()) || (userName.charAt(0).toUpperCase());

    const userAvatar = user && (user.avatar_url || user.photo_url || user.avatar);
    const userRoleLabel = (user && user.role && typeof user.role === 'object')
      ? (user.role.name || user.role.code || opts.portalLabel || 'Pengguna')
      : (user && user.role)
        ? String(user.role).replace('_', ' ')
        : (opts.portalLabel || 'Pengguna');
    const userAvatarHtml = userAvatar
      ? `<img src="${userAvatar}" class="w-8 h-8 rounded-full object-cover border border-primary-200 shrink-0" alt="Avatar">`
      : `<div class="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0">${userInitial}</div>`;

    return `
      <style>${STYLES}</style>

      <header class="md:hidden bg-white border-b border-gray-200 sticky top-0 z-30">
        <div class="px-4 py-3 flex items-center justify-between gap-2">
          <button type="button" onclick="Shell.openNav()" aria-label="Buka menu" class="p-2 -ml-2 rounded-md hover:bg-gray-100">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <a href="${homeLink}" class="flex items-center gap-2 min-w-0">
            <img src="/images/logo.png" onerror="this.src='../../images/logo.png'" alt="Logo" class="w-8 h-8 object-contain shrink-0">
            <span class="text-sm font-bold text-gray-900 truncate">Yayasan Samarinda</span>
          </a>
          <div class="flex items-center gap-2">
            ${opts.showRefresh ? `
            <button onclick="Shell.refresh()" aria-label="Refresh" class="p-2 rounded-md hover:bg-gray-100">
              <svg id="siy-refresh-icon" class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582M19.418 15A8.003 8.003 0 014 12m0 0V7m0 5h5m11 4v-5h-.581M4.582 9A8.003 8.003 0 0120 12m0 0v5m0-5h-5"/></svg>
            </button>` : ''}
            ${userAvatarHtml}
          </div>
        </div>
      </header>

      <div id="siy-mobile-nav" aria-hidden="true" class="md:hidden fixed inset-0 z-40 pointer-events-none">
        <div id="siy-nav-backdrop" onclick="Shell.closeNav()" class="absolute inset-0 bg-gray-900/40 opacity-0 transition-opacity"></div>
        <aside class="absolute inset-y-0 left-0 w-64 bg-white shadow-xl flex flex-col pointer-events-auto">
          <div class="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
            <a href="${homeLink}" class="flex items-center gap-2.5 min-w-0">
              <img src="/images/logo.png" onerror="this.src='../../images/logo.png'" alt="Logo" class="w-9 h-9 object-contain shrink-0">
              <div class="min-w-0">
                <div class="text-sm font-bold text-gray-900 leading-tight truncate">Yayasan Samarinda</div>
                <div class="text-xs text-gray-500 leading-tight truncate">${opts.portalLabel || 'Portal'}</div>
              </div>
            </a>
            <button type="button" onclick="Shell.closeNav()" aria-label="Tutup menu" class="p-2 -mr-2 rounded-md hover:bg-gray-100 shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">${renderMobileNav(menu, active)}</nav>
          <div class="px-3 py-3 border-t border-gray-200">
            <div class="flex items-center gap-2.5 px-2 py-2 mb-2 rounded-md bg-gray-50">
              ${userAvatarHtml}
              <div class="min-w-0 flex-1">
                <div class="text-xs font-bold text-gray-900 truncate">${userName}</div>
                <div class="text-[10px] text-gray-500 capitalize truncate">${userRoleLabel}</div>
              </div>
            </div>
            <button onclick="logout()" class="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 rounded-md">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
              Logout
            </button>
          </div>
        </aside>
      </div>

      <aside class="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-10">
        <div class="px-6 py-5 border-b border-gray-200">
          <a href="${homeLink}" class="flex items-center gap-2.5">
            <img src="/images/logo.png" onerror="this.src='../../images/logo.png'" alt="Logo" class="w-9 h-9 object-contain shrink-0">
            <div class="min-w-0">
              <div class="text-sm font-bold text-gray-900 leading-tight truncate">Yayasan Samarinda</div>
              <div class="text-xs text-gray-500 leading-tight truncate">${opts.portalLabel || 'Portal'}</div>
            </div>
          </a>
        </div>
        <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">${renderDesktopNav(menu, active)}</nav>
        <div class="px-3 py-3 border-t border-gray-200">
          <div class="flex items-center gap-2.5 px-2 py-2 mb-2 rounded-md bg-gray-50">
            ${userAvatarHtml}
            <div class="min-w-0 flex-1">
              <div class="text-xs font-bold text-gray-900 truncate">${userName}</div>
              <div class="text-[10px] text-gray-500 capitalize truncate">${userRoleLabel}</div>
            </div>
          </div>
          <button onclick="logout()" class="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 rounded-md">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            Logout
          </button>
        </div>
      </aside>

      <div class="flex-1 md:ml-64 min-w-0">
        <header class="hidden md:block bg-white border-b border-gray-200 sticky top-0 z-20">
          <div class="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center gap-4">
            <div class="min-w-0">
              <h1 class="text-xl font-bold text-gray-900 truncate">${title}</h1>
              ${subtitle ? `<p class="text-sm text-gray-500 truncate">${subtitle}</p>` : ''}
            </div>
            <div class="flex items-center gap-3 shrink-0">
              ${opts.showRefresh ? `
              <button onclick="Shell.refresh()" class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50">
                <svg id="siy-refresh-icon-desktop" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582M19.418 15A8.003 8.003 0 014 12m0 0V7m0 5h5m11 4v-5h-.581M4.582 9A8.003 8.003 0 0120 12m0 0v5m0-5h-5"/></svg>
                Refresh
              </button>` : ''}
              <div class="flex items-center gap-2">
                ${userAvatarHtml}
                <span class="text-sm font-medium text-gray-700 hidden lg:inline truncate">${userName}</span>
              </div>
            </div>
          </div>
        </header>
        <div id="siy-error-banner" role="alert" class="hidden mx-4 sm:mx-6 lg:mx-8 mt-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="text-sm font-medium text-red-800">Gagal memuat data</div>
            <div id="siy-error-message" class="text-xs text-red-700 mt-1 break-words"></div>
          </div>
          <button onclick="Shell.refresh()" class="shrink-0 text-sm font-medium text-red-700 hover:text-red-900 underline">Coba lagi</button>
        </div>
      </div>
    `;
  }

  const state = { onRefresh: null };

  function ensurePageTransitions() {
    if (window.__SIY_PAGE_TRANSITIONS_LOADED__) return;
    const script = document.createElement('script');
    script.src = '/shared/js/page-transitions.js';
    script.onerror = function () {
      const script2 = document.createElement('script');
      script2.src = '../../shared/js/page-transitions.js';
      document.body.appendChild(script2);
    };
    document.body.appendChild(script);
  }

  function init(opts) {
    ensurePageTransitions();
    state.onRefresh = opts && opts.onRefresh ? opts.onRefresh : null;
    const shell = buildShell(opts || {});
    const slot = document.getElementById('app-shell');
    if (!slot) {
      // Fallback: prepend ke body
      const wrap = document.createElement('div');
      wrap.innerHTML = shell;
      document.body.insertBefore(wrap.firstElementChild, document.body.firstChild);
    } else {
      slot.innerHTML = shell;
    }
    const main = document.querySelector('main') || document.getElementById('main-slot');
    if (main && !main.classList.contains('md:ml-64')) {
      main.classList.add('md:ml-64', 'min-w-0');
    }
  }

  function openNav() {
    const drawer = document.getElementById('siy-mobile-nav');
    const backdrop = document.getElementById('siy-nav-backdrop');
    if (!drawer || !backdrop) return;
    drawer.classList.remove('pointer-events-none');
    drawer.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => backdrop.classList.replace('opacity-0', 'opacity-100'));
    document.body.style.overflow = 'hidden';
  }
  function closeNav() {
    const drawer = document.getElementById('siy-mobile-nav');
    const backdrop = document.getElementById('siy-nav-backdrop');
    if (!drawer || !backdrop) return;
    backdrop.classList.replace('opacity-100', 'opacity-0');
    drawer.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      drawer.classList.add('pointer-events-none');
      document.body.style.overflow = '';
    }, 250);
  }

  function showError(msg) {
    const banner = document.getElementById('siy-error-banner');
    const msgEl = document.getElementById('siy-error-message');
    if (banner && msgEl) {
      banner.classList.remove('hidden');
      msgEl.textContent = msg || 'Tidak dapat terhubung ke server.';
    }
  }
  function hideError() {
    const banner = document.getElementById('siy-error-banner');
    if (banner) banner.classList.add('hidden');
  }
  function startRefresh() {
    const icons = [document.getElementById('siy-refresh-icon'), document.getElementById('siy-refresh-icon-desktop')].filter(Boolean);
    icons.forEach(i => i.classList.add('animate-spin'));
    return () => icons.forEach(i => i.classList.remove('animate-spin'));
  }
  function refresh() {
    if (typeof state.onRefresh === 'function') {
      hideError();
      state.onRefresh();
    }
  }

  // Skeleton helper: replace isi node dengan shimmer placeholder.
  function skeleton(node, h = 'h-7', w = 'w-16') {
    if (!node) return;
    node.innerHTML = `<div class="skeleton ${h} ${w} rounded inline-block"></div>`;
  }

  // Skeleton rows helper for tables
  function skeletonRows(cols = 5, rows = 3) {
    let html = '';
    for (let i = 0; i < rows; i++) {
      html += '<tr>';
      for (let j = 0; j < cols; j++) {
        html += '<td class="px-4 py-3"><div class="skeleton h-4 w-full rounded"></div></td>';
      }
      html += '</tr>';
    }
    return html;
  }

  // Set text helper: kalau null/undefined/empty tampil "-".
  function setText(id, val) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = (val === null || val === undefined || val === '') ? '-' : val;
  }

  window.Shell = { init, openNav, closeNav, refresh, showError, hideError, startRefresh, skeleton, skeletonRows, setText, ADMIN_MENU };
})();