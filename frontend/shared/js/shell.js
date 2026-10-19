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

  const STUDENT_ICONS = {
    'dashboard.html': `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>`,
    'biodata.html': `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`,
    'spp.html': `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>`,
    'dokumen.html': `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`
  };

  const DEFAULT_ICON = `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 6h16M4 12h16M4 18h16"/></svg>`;

  function cleanMenuLabel(label) {
    if (!label) return '';
    return label.replace(/^[\p{Emoji}\p{Extended_Pictographic}\u200d\uFE0F\s]+/u, '').trim();
  }

  function getMenuIcon(m) {
    if (m.icon) return m.icon;
    const found = ADMIN_MENU.find(item => item.href === m.href);
    if (found && found.icon) return found.icon;
    if (m.href && STUDENT_ICONS[m.href]) return STUDENT_ICONS[m.href];
    return DEFAULT_ICON;
  }

  function renderDesktopNav(menu, active) {
    return menu.map(m => {
      const isActive = m.href === active || (active && active.endsWith(m.href));
      const cls = isActive ? 'siy-nav-item siy-nav-active' : 'siy-nav-item';
      const icon = getMenuIcon(m);
      return `<a href="${m.href}" class="${cls}">${icon}<span>${cleanMenuLabel(m.label)}</span></a>`;
    }).join('');
  }

  function renderMobileNav(menu, active) {
    return menu.map(m => {
      const isActive = m.href === active || (active && active.endsWith(m.href));
      const cls = isActive ? 'siy-nav-item siy-nav-active' : 'siy-nav-item';
      const icon = getMenuIcon(m);
      return `<a href="${m.href}" class="${cls}" onclick="Shell.closeNav()">${icon}<span>${cleanMenuLabel(m.label)}</span></a>`;
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
    const title = opts.title || 'Yayasan At Tarbiyyah Wijaya Kusuma';
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
          <a href="${homeLink}" class="flex items-center gap-2 min-w-0" title="YAYASAN AT TARBIYYAH WIJAYA KUSUMA SAMARINDA">
            <img src="/images/logo.png" onerror="this.onerror=null; this.src='/public/images/logo.png'" alt="Logo" class="w-8 h-8 object-contain shrink-0">
            <span class="text-sm font-bold text-gray-900 truncate">Yayasan At Tarbiyyah Wijaya Kusuma</span>
          </a>
          <div class="flex items-center gap-2">
            ${opts.showRefresh ? `
            <button onclick="Shell.refresh()" aria-label="Refresh Halaman" class="p-2 rounded-lg text-slate-700 hover:text-primary-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition active:scale-95">
              <svg id="siy-refresh-icon" class="w-4 h-4 text-slate-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582M19.418 15A8.003 8.003 0 014 12m0 0V7m0 5h5m11 4v-5h-.581M4.582 9A8.003 8.003 0 0120 12m0 0v5m0-5h-5"/></svg>
            </button>` : ''}
            <button type="button" onclick="Shell.openProfileModal()" class="flex items-center gap-1.5 p-1 rounded-lg hover:bg-slate-100 transition active:scale-95 text-left focus:outline-none" title="Ubah Nama & Foto Profil">
              ${userAvatarHtml}
            </button>
          </div>
        </div>
      </header>

      <div id="siy-mobile-nav" aria-hidden="true" class="md:hidden fixed inset-0 z-40 pointer-events-none">
        <div id="siy-nav-backdrop" onclick="Shell.closeNav()" class="absolute inset-0 bg-gray-900/40 opacity-0 transition-opacity"></div>
        <aside class="absolute inset-y-0 left-0 w-64 bg-white shadow-xl flex flex-col pointer-events-auto">
          <div class="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
            <a href="${homeLink}" class="flex items-center gap-2.5 min-w-0">
              <img src="/images/logo.png" onerror="this.onerror=null; this.src='/public/images/logo.png'" alt="Logo" class="w-9 h-9 object-contain shrink-0">
              <div class="min-w-0">
                <div class="text-sm font-bold text-gray-900 leading-tight truncate">Yayasan At Tarbiyyah</div>
                <div class="text-xs text-gray-500 leading-tight truncate">${opts.portalLabel || 'Portal'}</div>
              </div>
            </a>
            <button type="button" onclick="Shell.closeNav()" aria-label="Tutup menu" class="p-2 -mr-2 rounded-md hover:bg-gray-100 shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">${renderMobileNav(menu, active)}</nav>
          <div class="px-3 py-3 border-t border-gray-200">
            <div onclick="Shell.openProfileModal()" class="flex items-center gap-2.5 px-2.5 py-2 mb-2 rounded-xl bg-gray-50 hover:bg-sky-50 border border-gray-100 hover:border-sky-200 transition cursor-pointer active:scale-95 group" title="Ubah Nama & Foto Profil">
              ${userAvatarHtml}
              <div class="min-w-0 flex-1">
                <div class="text-xs font-bold text-gray-900 group-hover:text-primary-700 truncate">${userName}</div>
                <div class="text-[10px] text-gray-500 capitalize truncate">${userRoleLabel} • Edit Profil</div>
              </div>
              <svg class="w-3.5 h-3.5 text-gray-400 group-hover:text-primary-600 transition shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
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
          <a href="${homeLink}" class="flex items-center gap-2.5" title="YAYASAN AT TARBIYYAH WIJAYA KUSUMA SAMARINDA">
            <img src="/images/logo.png" onerror="this.onerror=null; this.src='/public/images/logo.png'" alt="Logo" class="w-9 h-9 object-contain shrink-0">
            <div class="min-w-0">
              <div class="text-sm font-extrabold text-gray-900 leading-tight truncate uppercase">Yayasan At Tarbiyyah</div>
              <div class="text-[11px] font-bold text-primary-700 leading-tight truncate uppercase">Wijaya Kusuma Samarinda</div>
              <div class="text-[10px] text-gray-500 leading-tight truncate mt-0.5">${opts.portalLabel || 'Portal'}</div>
            </div>
          </a>
        </div>
        <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">${renderDesktopNav(menu, active)}</nav>
        <div class="px-3 py-3 border-t border-gray-200">
          <div onclick="Shell.openProfileModal()" class="flex items-center gap-2.5 px-2.5 py-2 mb-2 rounded-xl bg-gray-50 hover:bg-sky-50 border border-gray-100 hover:border-sky-200 transition cursor-pointer active:scale-95 group" title="Ubah Nama & Foto Profil">
            ${userAvatarHtml}
            <div class="min-w-0 flex-1">
              <div class="text-xs font-bold text-gray-900 group-hover:text-primary-700 truncate">${userName}</div>
              <div class="text-[10px] text-gray-500 capitalize truncate">${userRoleLabel} • Edit Profil</div>
            </div>
            <svg class="w-3.5 h-3.5 text-gray-400 group-hover:text-primary-600 transition shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
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
              <button onclick="Shell.refresh()" aria-label="Refresh Halaman" class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-primary-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition active:scale-95">
                <svg id="siy-refresh-icon-desktop" class="w-4 h-4 text-slate-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582M19.418 15A8.003 8.003 0 014 12m0 0V7m0 5h5m11 4v-5h-.581M4.582 9A8.003 8.003 0 0120 12m0 0v5m0-5h-5"/></svg>
                <span>Refresh</span>
              </button>` : ''}
              <button type="button" onclick="Shell.openProfileModal()" class="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition active:scale-95 text-left focus:outline-none" title="Ubah Nama & Foto Profil">
                ${userAvatarHtml}
                <span class="text-xs font-bold text-slate-800 hover:text-primary-700 hidden lg:inline truncate">${userName}</span>
              </button>
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
    const stopSpin = startRefresh();
    hideError();
    if (typeof state.onRefresh === 'function') {
      try {
        const res = state.onRefresh();
        if (res && typeof res.then === 'function') {
          res.finally(() => stopSpin());
          return;
        }
      } catch (e) {
        console.error(e);
      }
      setTimeout(stopSpin, 500);
    } else {
      setTimeout(() => {
        window.location.reload();
      }, 200);
    }
  }

  let selectedAvatarDataUrl = '';

  function openProfileModal() {
    let modal = document.getElementById('siy-profile-modal');
    const user = (typeof window.getCurrentUser === 'function') ? window.getCurrentUser() : null;
    const currentName = (user && (user.full_name || user.name)) || '';
    const currentAvatar = user && (user.avatar_url || user.photo_url || user.avatar);
    selectedAvatarDataUrl = '';

    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'siy-profile-modal';
      modal.className = 'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h3 class="text-base font-bold text-slate-900">Ubah Profil &amp; Foto</h3>
          <button type="button" onclick="Shell.closeProfileModal()" class="text-slate-400 hover:text-slate-600 text-xl font-bold leading-none">&times;</button>
        </div>
        <div class="flex flex-col items-center mb-4">
          <div class="relative w-20 h-20 rounded-full overflow-hidden border-2 border-primary-500 shadow-sm bg-slate-100 mb-2">
            <img id="sp-preview" src="${currentAvatar || ('https://ui-avatars.com/api/?name=' + encodeURIComponent(currentName || 'User') + '&background=0284c7&color=fff')}" class="w-full h-full object-cover" alt="Preview Foto">
          </div>
          <label class="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-primary-700 text-xs font-semibold rounded-lg cursor-pointer transition border border-sky-200 flex items-center gap-1.5 active:scale-95">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <span>Ganti Foto Profil</span>
            <input type="file" id="sp-file" accept="image/*" class="hidden" onchange="Shell.handleAvatarFileChange(this)">
          </label>
        </div>
        <div class="space-y-3 mb-5">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap *</label>
            <input type="text" id="sp-name" value="${currentName.replace(/"/g, '&quot;')}" class="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-medium">
          </div>
        </div>
        <div class="flex gap-2">
          <button type="button" onclick="Shell.closeProfileModal()" class="flex-1 py-2 text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-lg transition">Batal</button>
          <button type="button" id="sp-btn-save" onclick="Shell.saveProfile()" class="flex-1 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition active:scale-95">Simpan Profil</button>
        </div>
      </div>
    `;
    modal.classList.remove('hidden');
  }

  function closeProfileModal() {
    const modal = document.getElementById('siy-profile-modal');
    if (modal) modal.classList.add('hidden');
  }

  function handleAvatarFileChange(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = e => {
      selectedAvatarDataUrl = e.target.result;
      const preview = document.getElementById('sp-preview');
      if (preview) preview.src = selectedAvatarDataUrl;
    };
    reader.readAsDataURL(file);
  }

  async function saveProfile() {
    const nameInput = document.getElementById('sp-name');
    const newName = nameInput ? nameInput.value.trim() : '';
    if (!newName) {
      if (typeof window.showToast === 'function') window.showToast('Nama tidak boleh kosong', 'warning');
      return;
    }
    const btn = document.getElementById('sp-btn-save');
    if (btn) { btn.disabled = true; btn.textContent = 'Menyimpan...'; }

    try {
      let curUser = (typeof window.getCurrentUser === 'function') ? window.getCurrentUser() : null;
      if (!curUser) {
        try { curUser = JSON.parse(localStorage.getItem('siy_user') || '{}'); } catch (_) { curUser = {}; }
      }
      curUser.full_name = newName;
      curUser.name = newName;
      if (selectedAvatarDataUrl) {
        curUser.avatar_url = selectedAvatarDataUrl;
        curUser.photo_url = selectedAvatarDataUrl;
      }
      localStorage.setItem('siy_user', JSON.stringify(curUser));

      if (typeof window.apiCall === 'function') {
        await window.apiCall('auth', 'update_profile', {
          user_id: curUser.id,
          full_name: newName,
          avatar_url: selectedAvatarDataUrl || curUser.avatar_url
        }).catch(() => {});
      }

      closeProfileModal();
      if (typeof window.showToast === 'function') window.showToast('Profil berhasil diperbarui!', 'success');
      setTimeout(() => window.location.reload(), 300);
    } catch (err) {
      if (typeof window.showToast === 'function') window.showToast('Gagal memperbarui profil: ' + err.message, 'error');
      if (btn) { btn.disabled = false; btn.textContent = 'Simpan Profil'; }
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

  window.Shell = { 
    init, openNav, closeNav, refresh, showError, hideError, startRefresh, 
    skeleton, skeletonRows, setText, ADMIN_MENU,
    openProfileModal, closeProfileModal, handleAvatarFileChange, saveProfile 
  };
})();