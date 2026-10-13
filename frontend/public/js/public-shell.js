// Shared public site header & footer injector.
// Pages opt in by including <div id="site-header"></div> and <div id="site-footer"></div>
// in their markup, then call injectSiteChrome({ activeKey, basePath }).

(function () {
  // Navigasi Asli Website Yayasan At Tarbiyyah (Dikelompokkan rapi dengan gaya floating dropdown)
  const NAV_ITEMS = [
    { key: 'home',    href: 'index.html',  label: 'Beranda' },
    { key: 'profile', href: 'profil.html', label: 'Profil' },
    { 
      key: 'information',
      label: 'Informasi',
      isDropdown: true,
      items: [
        { label: 'Berita Terkini', href: 'berita.html', icon: 'fi fi-rr-newspaper' },
        { label: 'Pengumuman Resmi', href: 'pengumuman.html', icon: 'fi fi-rr-megaphone' },
        { label: 'Agenda Kegiatan', href: 'agenda.html', icon: 'fi fi-rr-calendar' },
        { label: 'Galeri Dokumentasi', href: 'galeri.html', icon: 'fi fi-rr-picture' }
      ]
    },
    { 
      key: 'ppdb',
      href: 'ppdb.html',
      label: 'PPDB',
      isDropdown: true,
      items: [
        { label: 'Informasi & Alur PPDB', href: 'ppdb.html', icon: 'fi fi-rr-info' },
        { label: 'Formulir Pendaftaran Online', href: 'ppdb.html#formulir-pendaftaran', icon: 'fi fi-rr-edit' },
        { label: 'Cek Status PPDB Online', href: 'ppdb/status.html', icon: 'fi fi-rr-search' }
      ]
    },
    { key: 'contact', href: 'kontak.html', label: 'Kontak' }
  ];

  function isItemActive(it, activeKey) {
    if (it.key === activeKey) return true;
    if (it.key === 'information' && (activeKey === 'news' || activeKey === 'announcements' || activeKey === 'events' || activeKey === 'gallery')) return true;
    return false;
  }

  function ensureUiconsLoaded() {
    if (document.getElementById('flaticon-uicons-cdn')) return;
    const linkRegular = document.createElement('link');
    linkRegular.id = 'flaticon-uicons-cdn';
    linkRegular.rel = 'stylesheet';
    linkRegular.href = 'https://cdn-uicons.flaticon.com/2.6.0/uicons-regular-rounded/css/uicons-regular-rounded.css';
    document.head.appendChild(linkRegular);

    const linkSolid = document.createElement('link');
    linkSolid.rel = 'stylesheet';
    linkSolid.href = 'https://cdn-uicons.flaticon.com/2.6.0/uicons-solid-rounded/css/uicons-solid-rounded.css';
    document.head.appendChild(linkSolid);

    const linkBrands = document.createElement('link');
    linkBrands.rel = 'stylesheet';
    linkBrands.href = 'https://cdn-uicons.flaticon.com/2.6.0/uicons-brands/css/uicons-brands.css';
    document.head.appendChild(linkBrands);
  }

  function buildTopbar(base) {
    return '';
  }

  function buildNavbar(activeKey, base) {
    ensureUiconsLoaded();

    const desktopNavHtml = NAV_ITEMS.map(function (it) {
      const isActive = isItemActive(it, activeKey);
      if (!it.isDropdown) {
        const cls = isActive
          ? 'px-3 py-2 text-sm font-semibold text-primary-700 rounded-md bg-primary-50 transition'
          : 'px-3 py-2 text-sm font-medium text-slate-700 hover:text-primary-700 hover:bg-slate-50 rounded-md transition';
        return `<a href="${base}${it.href}" class="${cls}">${it.label}</a>`;
      }

      // Dropdown menu trigger & floating white card (Gaya desain referensi dengan konsistensi warna asli)
      const btnCls = isActive
        ? 'siy-dropdown-btn flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-primary-700 bg-primary-50 rounded-md transition focus:outline-none'
        : 'siy-dropdown-btn flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 hover:text-primary-700 hover:bg-slate-50 rounded-md transition focus:outline-none';
      const chevronCls = isActive ? 'text-primary-700' : 'text-slate-400 group-hover:text-primary-700';

      const itemsHtml = it.items.map(function (sub) {
        return `
          <a href="${base}${sub.href}" class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-primary-700 hover:bg-primary-50/70 transition group/item">
            <i class="${sub.icon} text-base text-primary-600 group-hover/item:scale-110 transition-transform flex-shrink-0"></i>
            <span class="group-hover/item:translate-x-0.5 transition-transform">${sub.label}</span>
          </a>
        `;
      }).join('');

      return `
        <div class="siy-nav-dropdown group ${isActive ? 'is-active-nav' : ''}">
          <button type="button" class="${btnCls}" aria-expanded="false" aria-haspopup="true">
            <span>${it.label}</span>
            <i class="fi fi-rr-angle-small-down text-xs ${chevronCls} siy-nav-chevron"></i>
          </button>
          <div class="siy-dropdown-menu absolute top-full left-0 pt-2 z-50">
            <div class="bg-white rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.12)] border border-slate-100 p-2 min-w-[260px] flex flex-col gap-0.5">
              ${itemsHtml}
            </div>
          </div>
        </div>
      `;
    }).join('');

    const mobileNavHtml = NAV_ITEMS.map(function (it, idx) {
      const isActive = isItemActive(it, activeKey);
      if (!it.isDropdown) {
        const cls = isActive
          ? 'px-3.5 py-2.5 text-sm font-semibold text-primary-700 bg-primary-50 rounded-lg flex items-center justify-between'
          : 'px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:text-primary-700 hover:bg-slate-50 rounded-lg transition flex items-center justify-between';
        return `<a href="${base}${it.href}" class="${cls}"><span>${it.label}</span><i class="fi fi-rr-angle-small-right text-slate-400"></i></a>`;
      }

      const accId = `site-mob-acc-${idx}`;
      const subItemsHtml = it.items.map(function (sub) {
        return `
          <a href="${base}${sub.href}" class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-primary-700 hover:bg-white transition">
            <i class="${sub.icon} text-sm text-primary-600 flex-shrink-0"></i>
            <span>${sub.label}</span>
          </a>
        `;
      }).join('');

      return `
        <div class="border-b border-slate-100 last:border-0 pb-1">
          <button type="button" class="site-mobile-accordion-btn w-full px-3.5 py-2.5 text-sm ${isActive ? 'font-semibold text-primary-700 bg-primary-50' : 'font-medium text-slate-700 hover:bg-slate-50'} flex items-center justify-between rounded-lg transition" data-target="${accId}">
            <span>${it.label}</span>
            <i class="fi fi-rr-angle-small-down text-slate-400 site-acc-chevron transition-transform duration-200"></i>
          </button>
          <div id="${accId}" class="hidden pl-3 pr-1 py-1 flex flex-col gap-1 bg-slate-50/80 rounded-lg my-1">
            ${subItemsHtml}
          </div>
        </div>
      `;
    }).join('');

    return `
      <!-- Main Navbar: Putih bersih, modern, sticky, palet warna asli Yayasan At Tarbiyyah -->
      <nav class="bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all duration-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16 sm:h-20">
            <!-- Brand Logo & Nama -->
            <a href="${base}index.html" class="flex items-center gap-2.5 sm:gap-3 group min-w-0" title="YAYASAN AT TARBIYYAH WIJAYA KUSUMA SAMARINDA">
              <img src="${base}images/logo.png" onerror="this.onerror=null; this.src='${base}public/images/logo.png'" alt="Logo Yayasan At Tarbiyyah Wijaya Kusuma" class="w-9 h-9 sm:w-11 sm:h-11 object-contain drop-shadow-sm group-hover:scale-105 transition-transform flex-shrink-0" id="site-header-logo-img">
              <div class="min-w-0">
                <div class="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight tracking-tight uppercase" id="site-header-school-name-top">YAYASAN AT TARBIYYAH</div>
                <div class="text-[10px] sm:text-[11px] font-bold text-primary-700 leading-tight tracking-normal uppercase" id="site-header-school-name-sub">WIJAYA KUSUMA SAMARINDA</div>
              </div>
            </a>

            <!-- Desktop Nav Links -->
            <div class="hidden lg:flex items-center gap-1">${desktopNavHtml}</div>

            <!-- Desktop Action Buttons -->
            <div class="hidden lg:flex items-center gap-2.5">
              <a href="${base}login.html" class="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-primary-700 hover:bg-slate-100 border border-slate-200 rounded-lg transition flex items-center gap-1.5 active:scale-[0.98]">
                <i class="fi fi-rr-graduation-cap text-xs text-slate-500"></i>
                <span>SIAKAD</span>
              </a>
              <a href="${base}ppdb.html#formulir-pendaftaran" class="px-4 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition flex items-center gap-1.5 active:scale-[0.98]">
                <i class="fi fi-rr-paper-plane text-xs"></i>
                <span>Daftar PPDB</span>
              </a>
            </div>

            <!-- Mobile Quick Actions & Hamburger -->
            <div class="flex lg:hidden items-center gap-2">
              <a href="${base}login.html" class="px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:text-primary-700 bg-slate-100 hover:bg-slate-200/70 rounded-lg border border-slate-200 transition flex items-center gap-1 active:scale-95" title="SIAKAD">
                <i class="fi fi-rr-graduation-cap text-[11px] text-slate-600"></i>
                <span>SIAKAD</span>
              </a>
              <button id="site-mobile-menu-btn" class="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:text-primary-700 transition active:scale-95 shadow-sm" aria-label="Buka menu navigasi">
                <i class="fi fi-rr-menu-burger text-base"></i>
              </button>
            </div>
          </div>

          <!-- Mobile Dropdown Menu Drawer -->
          <div id="site-mobile-menu" class="hidden lg:hidden pb-5 pt-2 border-t border-slate-100">
            <!-- Navigation Links & Accordion -->
            <div class="flex flex-col gap-1 py-1">
              ${mobileNavHtml}
            </div>

            <!-- Mobile CTAs -->
            <div class="pt-3 mt-2 border-t border-slate-200/70 flex flex-col gap-2">
              <a href="${base}login.html" class="px-3.5 py-2.5 text-xs font-semibold text-center text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center gap-2 active:scale-[0.98] transition">
                <i class="fi fi-rr-graduation-cap text-xs text-slate-500"></i>
                <span>Login SIAKAD</span>
              </a>
              <a href="${base}ppdb.html#formulir-pendaftaran" class="px-3.5 py-2.5 text-xs font-semibold text-center text-white bg-primary-600 hover:bg-primary-700 rounded-lg flex items-center justify-center gap-2 active:scale-[0.98] transition">
                <i class="fi fi-rr-paper-plane text-xs"></i>
                <span>Daftar PPDB Online</span>
              </a>
            </div>

            <!-- Mobile Quick Contacts & Social Media Strip -->
            <div class="pt-4 mt-3 border-t border-slate-100 bg-slate-50/70 rounded-xl p-3 flex flex-col gap-2.5">
              <div class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Kontak Resmi Yayasan
              </div>
              <div class="flex items-center justify-between text-xs text-slate-600">
                <a id="site-mobile-phone" href="tel:081347142829" class="flex items-center gap-1.5 font-medium hover:text-primary-700 transition">
                  <i class="fi fi-rr-phone-call text-primary-600"></i>
                  <span>0813-4714-2829</span>
                </a>
                <a id="site-mobile-email" href="mailto:info@attarbiyyah-samarinda.sch.id" class="flex items-center gap-1.5 font-medium hover:text-primary-700 transition">
                  <i class="fi fi-rr-envelope text-primary-600"></i>
                  <span>Email Kami</span>
                </a>
              </div>
              <div class="flex items-center justify-between pt-1 border-t border-slate-200/60 text-slate-500 text-xs">
                <span class="text-[11px]">Media Sosial Resmi:</span>
                <div class="flex items-center gap-2">
                  <a id="site-mobile-fb" href="https://facebook.com/yayasansamarinda" target="_blank" rel="noopener noreferrer" class="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 inline-flex items-center justify-center text-slate-600 hover:text-white hover:bg-[#1877F2] transition" aria-label="Facebook">
                    <svg class="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                  <a id="site-mobile-ig" href="https://instagram.com/yayasansamarinda" target="_blank" rel="noopener noreferrer" class="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 inline-flex items-center justify-center text-slate-600 hover:text-white hover:bg-[#E4405F] transition" aria-label="Instagram">
                    <svg class="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </a>
                  <a id="site-mobile-yt" href="https://youtube.com/@yayasansamarinda" target="_blank" rel="noopener noreferrer" class="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 inline-flex items-center justify-center text-slate-600 hover:text-white hover:bg-[#FF0000] transition" aria-label="YouTube">
                    <svg class="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>`;
  }

  function buildHeader(activeKey, base) {
    return buildNavbar(activeKey, base);
  }

  function buildFooter(base) {
    return `
      <footer id="site-footer-root" class="relative bg-slate-950 text-slate-300 border-t border-slate-800/90 overflow-hidden">
        <!-- 1. Background Foto Sekolah (Dapat diubah via CMS Admin) -->
        <div id="site-footer-bg-image" class="absolute inset-0 bg-cover bg-center transition-all duration-700 pointer-events-none scale-105" style="background-image: url('${base}images/school-campus.jpg');"></div>
        
        <!-- 2. Overlay Gradasi 50% Semi-Transparan Gelap (Anti-Slop: Teks Sangat Kontras & Berisi) -->
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-900/60 pointer-events-none"></div>

        <!-- 3. Konten Footer -->
        <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div class="flex items-center gap-3 mb-4">
                <img src="${base}images/logo.png" onerror="this.onerror=null; this.src='${base}public/images/logo.png'" alt="Logo Yayasan At Tarbiyyah" class="w-10 h-10 object-contain drop-shadow-sm" id="site-footer-logo-img">
                <div>
                  <div class="text-white font-extrabold text-sm sm:text-base leading-tight uppercase" id="site-footer-school-name">YAYASAN AT TARBIYYAH</div>
                  <div class="text-[11px] text-sky-400 font-bold uppercase">WIJAYA KUSUMA SAMARINDA</div>
                </div>
              </div>
              <p class="text-xs text-slate-300 leading-relaxed mb-4 text-pretty" id="site-footer-desc">Membina generasi Qur'ani, berakhlak mulia, cerdas, dan mandiri sejak usia dini di Kota Samarinda.</p>
              <div class="flex items-center gap-2.5">
                <a id="site-footer-fb" href="https://facebook.com/yayasansamarinda" target="_blank" rel="noopener noreferrer" class="w-9 h-9 rounded-xl bg-slate-900/90 hover:bg-[#1877F2] hover:text-white border border-slate-700/70 text-slate-300 inline-flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-sm" aria-label="Facebook">
                  <svg class="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a id="site-footer-ig" href="https://instagram.com/yayasansamarinda" target="_blank" rel="noopener noreferrer" class="w-9 h-9 rounded-xl bg-slate-900/90 hover:bg-[#E4405F] hover:text-white border border-slate-700/70 text-slate-300 inline-flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-sm" aria-label="Instagram">
                  <svg class="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a id="site-footer-yt" href="https://youtube.com/@yayasansamarinda" target="_blank" rel="noopener noreferrer" class="w-9 h-9 rounded-xl bg-slate-900/90 hover:bg-[#FF0000] hover:text-white border border-slate-700/70 text-slate-300 inline-flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-sm" aria-label="YouTube">
                  <svg class="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              </div>
            </div>
            <div>
              <h3 class="text-xs font-bold text-white uppercase tracking-wider mb-3">Tautan Cepat</h3>
              <ul class="space-y-2 text-xs">
                <li><a href="${base}profil.html" class="hover:text-sky-300 transition">Profil Yayasan</a></li>
                <li><a href="${base}berita.html" class="hover:text-sky-300 transition">Berita &amp; Kegiatan</a></li>
                <li><a href="${base}pengumuman.html" class="hover:text-sky-300 transition">Pengumuman Resmi</a></li>
                <li><a href="${base}ppdb.html#formulir-pendaftaran" class="hover:text-sky-300 transition">Formulir PPDB Online</a></li>
                <li><a href="${base}kontak.html" class="hover:text-sky-300 transition">Hubungi Kami</a></li>
              </ul>
            </div>
            <div>
              <h3 class="text-xs font-bold text-white uppercase tracking-wider mb-3">Layanan SIAKAD</h3>
              <ul class="space-y-2 text-xs">
                <li><a href="${base}login.html" class="hover:text-sky-300 transition flex items-center gap-1.5"><i class="fi fi-rr-graduation-cap text-[10px]"></i><span>Login SIAKAD</span></a></li>
                <li><a href="${base}ppdb/status.html" class="hover:text-sky-300 transition flex items-center gap-1.5"><i class="fi fi-rr-search text-[10px]"></i><span>Cek Status PPDB Online</span></a></li>
                <li><a href="${base}ppdb.html#jadwal" class="hover:text-sky-300 transition flex items-center gap-1.5"><i class="fi fi-rr-calendar text-[10px]"></i><span>Jadwal PPDB 2026</span></a></li>
                <li><a id="site-footer-wa-link" href="#" target="_blank" rel="noopener noreferrer" class="hover:text-sky-300 transition flex items-center gap-1.5"><i class="fi fi-brands-whatsapp text-sky-400 text-xs"></i><span>WhatsApp Tata Usaha</span></a></li>
              </ul>
            </div>
            <div>
              <h3 class="text-xs font-bold text-white uppercase tracking-wider mb-3">Kontak &amp; Alamat</h3>
              <ul class="space-y-2.5 text-xs text-slate-300">
                <li class="flex items-start gap-2">
                  <i class="fi fi-rr-marker text-sky-400 shrink-0 mt-0.5"></i>
                  <div>
                    <a id="site-footer-maps-link" href="https://maps.google.com/?q=Jl.+Wijaya+Kusuma+V-A+No.+38,+Air+Putih,+Samarinda+Ulu,+Kota+Samarinda,+Kalimantan+Timur+75124" target="_blank" rel="noopener noreferrer" class="hover:text-sky-300 transition group flex items-start gap-1.5" title="Buka lokasi kampus di Google Maps">
                      <span id="site-footer-address">Jl. Wijaya Kusuma V-A No. 38, Kel. Air Putih, Kec. Samarinda Ulu, Samarinda 75124</span>
                      <i class="fi fi-rr-arrow-up-right text-[10px] text-sky-400 opacity-70 group-hover:opacity-100 transition mt-0.5"></i>
                    </a>
                  </div>
                </li>
                <li class="flex items-center gap-2">
                  <i class="fi fi-rr-phone-call text-sky-400 shrink-0"></i>
                  <span id="site-footer-phone">0813-4714-2829</span>
                </li>
                <li class="flex items-center gap-2">
                  <i class="fi fi-rr-envelope text-sky-400 shrink-0"></i>
                  <span id="site-footer-email">info@attarbiyyah-samarinda.sch.id</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- 4. Baris Hak Cipta Bawah -->
          <div class="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>&copy; 2026 <span id="site-footer-copy-name" class="font-bold text-slate-200">YAYASAN AT TARBIYYAH WIJAYA KUSUMA SAMARINDA</span>. Hak Cipta Dilindungi.</p>
            <p class="text-[11px] text-slate-400">PAUD &bull; TK Terpadu &bull; TPQ Ulinnuha</p>
          </div>
        </div>
      </footer>`;
  }

  function applySchoolData(school) {
    if (!school) return;
    let name = (school.name || school.school_name || '').trim();
    if (!name || name === 'Yayasan Samarinda' || !/AT\s*TARBIYYAH/i.test(name)) {
      name = 'YAYASAN AT TARBIYYAH WIJAYA KUSUMA SAMARINDA';
    }
    const phone = school.phone || '081347142829';
    const email = school.email || 'info@attarbiyyah-samarinda.sch.id';
    const address = school.address || 'Jl. Wijaya Kusuma V-A No. 38, Kel. Air Putih, Kec. Samarinda Ulu Kota Samarinda, Kalimantan Timur, Kode Pos: 75124';
    const wa = school.whatsapp_number ? `https://wa.me/${school.whatsapp_number.replace(/\D/g, '')}` : 'https://wa.me/6281347142829';
    const ig = school.instagram_url || 'https://instagram.com/yayasansamarinda';
    const yt = school.youtube_url || 'https://youtube.com/@yayasansamarinda';
    const fb = school.facebook_url || 'https://facebook.com/yayasansamarinda';

    // Footer background image update (from CMS admin)
    if (school.footer_bg_url) {
      const fBg = document.getElementById('site-footer-bg-image');
      if (fBg) fBg.style.backgroundImage = `url("${school.footer_bg_url}")`;
    }

    // Header updates: YAYASAN AT TARBIYYAH WIJAYA KUSUMA SAMARINDA
    const hTop = document.getElementById('site-header-school-name-top');
    const hSub = document.getElementById('site-header-school-name-sub');
    const hOld = document.getElementById('site-header-school-name');

    if (hTop && hSub) {
      hTop.textContent = 'YAYASAN AT TARBIYYAH';
      hSub.textContent = 'WIJAYA KUSUMA SAMARINDA';
    } else if (hOld) {
      hOld.textContent = 'YAYASAN AT TARBIYYAH';
    }

    const hLogoImg = document.getElementById('site-header-logo-img');
    if (hLogoImg && school.logo_url && typeof school.logo_url === 'string' && school.logo_url.trim()) {
      hLogoImg.src = school.logo_url;
      hLogoImg.onerror = function() { this.src = `${base}images/logo.png`; };
    }
    const fLogoImg = document.getElementById('site-footer-logo-img');
    if (fLogoImg && school.logo_url && typeof school.logo_url === 'string' && school.logo_url.trim()) {
      fLogoImg.src = school.logo_url;
      fLogoImg.onerror = function() { this.src = `${base}images/logo.png`; };
    }

    // Topbar telah dinonaktifkan: Pembaruan kontak dipusatkan pada Drawer Mobile dan Footer

    // Mobile drawer contact updates
    const mobPhone = document.getElementById('site-mobile-phone');
    if (mobPhone) {
      mobPhone.href = `tel:${phone.replace(/[^\d+]/g, '')}`;
      const span = mobPhone.querySelector('span');
      if (span) span.textContent = phone;
    }
    const mobEmail = document.getElementById('site-mobile-email');
    if (mobEmail) mobEmail.href = `mailto:${email}`;

    const mobFb = document.getElementById('site-mobile-fb');
    if (mobFb) { mobFb.href = fb; mobFb.style.display = fb === '#' ? 'none' : 'inline-flex'; }
    const mobIg = document.getElementById('site-mobile-ig');
    if (mobIg) { mobIg.href = ig; mobIg.style.display = ig === '#' ? 'none' : 'inline-flex'; }
    const mobYt = document.getElementById('site-mobile-yt');
    if (mobYt) { mobYt.href = yt; mobYt.style.display = yt === '#' ? 'none' : 'inline-flex'; }

    // Footer updates
    const fName = document.getElementById('site-footer-school-name');
    if (fName) fName.textContent = 'YAYASAN AT TARBIYYAH';
    const fCopy = document.getElementById('site-footer-copy-name');
    if (fCopy) fCopy.textContent = 'YAYASAN AT TARBIYYAH WIJAYA KUSUMA SAMARINDA';
    const fAddr = document.getElementById('site-footer-address');
    if (fAddr) fAddr.textContent = address;
    const fPhone = document.getElementById('site-footer-phone');
    if (fPhone) fPhone.textContent = phone;
    const fEmail = document.getElementById('site-footer-email');
    if (fEmail) fEmail.textContent = email;

    const fMapsLink = document.getElementById('site-footer-maps-link');
    if (fMapsLink && (school.maps_url || school.maps)) {
      fMapsLink.href = school.maps_url || school.maps;
    }

    const fFb = document.getElementById('site-footer-fb');
    if (fFb) { fFb.href = fb; fFb.style.display = fb === '#' ? 'none' : 'inline-flex'; }
    const fIg = document.getElementById('site-footer-ig');
    if (fIg) { fIg.href = ig; fIg.style.display = ig === '#' ? 'none' : 'inline-flex'; }
    const fYt = document.getElementById('site-footer-yt');
    if (fYt) { fYt.href = yt; fYt.style.display = yt === '#' ? 'none' : 'inline-flex'; }
    const fWa = document.getElementById('site-footer-wa-link');
    if (fWa) { fWa.href = wa; fWa.style.display = wa === '#' ? 'none' : 'inline-flex'; }
  }

  async function fetchAndHydrateSchool() {
    // Check cached
    try {
      const cached = sessionStorage.getItem('siyayasan_school_profile');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && (parsed.name === 'Yayasan Samarinda' || parsed.school_name === 'Yayasan Samarinda' || !/AT\s*TARBIYYAH/i.test(parsed.name || parsed.school_name || ''))) {
          sessionStorage.removeItem('siyayasan_school_profile');
        } else {
          applySchoolData(parsed);
        }
      }
    } catch (_) {}

    // Live fetch via apiCall if available, or direct Supabase REST
    try {
      let school = null;
      if (typeof window.apiCall === 'function') {
        try {
          const setRes = await window.apiCall('web_settings', 'get');
          if (setRes && setRes.success && setRes.data && setRes.data.school_name) {
            const s = setRes.data;
            school = {
              name: s.school_name,
              phone: s.phone,
              email: s.email,
              address: s.address,
              campus_note: s.campus_note,
              maps_url: s.maps_url,
              maps_embed_url: s.maps_embed_url,
              whatsapp_number: s.whatsapp || s.whatsapp_number,
              instagram_url: s.instagram_url,
              youtube_url: s.youtube_url,
              facebook_url: s.facebook_url,
              footer_bg_url: s.footer_bg_url
            };
          }
        } catch (_) {}

        if (!school) {
          const res = await window.apiCall('schools', 'get');
          if (res && res.success && res.data) school = res.data;
        }
      }
      if (!school) {
        const supUrl = (window.SIYAYASAN_SUPABASE && window.SIYAYASAN_SUPABASE.url) || 'https://hzrjtvmveqygparjjnom.supabase.co';
        const supKey = (window.SIYAYASAN_SUPABASE && window.SIYAYASAN_SUPABASE.anonKey) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6cmp0dm12ZXF5Z3Bhcmpqbm9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzNzkyNTUsImV4cCI6MjEwNDk1NTI1NX0.-aVm6RoQy2_wnmlVV7v_zcL0SXvTenVBsSRYiVj_gQE';
        try {
          const resp = await fetch(`${supUrl}/rest/v1/schools?select=*&limit=1`, {
            headers: { 'apikey': supKey, 'Authorization': `Bearer ${supKey}` }
          });
          if (resp.ok) {
            const list = await resp.json();
            if (Array.isArray(list) && list.length > 0) school = list[0];
          }
        } catch (_) {}
      }

      if (school) {
        if (!school.name || school.name === 'Yayasan Samarinda' || !/AT\s*TARBIYYAH/i.test(school.name)) {
          school.name = 'YAYASAN AT TARBIYYAH WIJAYA KUSUMA SAMARINDA';
        }
        if (!school.school_name || school.school_name === 'Yayasan Samarinda' || !/AT\s*TARBIYYAH/i.test(school.school_name)) {
          school.school_name = 'YAYASAN AT TARBIYYAH WIJAYA KUSUMA SAMARINDA';
        }
        sessionStorage.setItem('siyayasan_school_profile', JSON.stringify(school));
        applySchoolData(school);
      }
    } catch (e) {
      console.warn('Could not fetch school profile:', e);
    }
  }

  function ensurePageTransitions(base) {
    if (window.__SIY_PAGE_TRANSITIONS_LOADED__) return;
    const script = document.createElement('script');
    script.src = base + '../shared/js/page-transitions.js';
    script.onerror = function () {
      const script2 = document.createElement('script');
      script2.src = '/shared/js/page-transitions.js';
      document.body.appendChild(script2);
    };
    document.body.appendChild(script);
  }

  window.injectSiteChrome = function (opts) {
    opts = opts || {};
    const active = opts.activeKey || '';
    const base = opts.basePath || './';

    const headerEl = document.getElementById('site-header');
    if (headerEl) {
      // Pastikan elemen wrapper topbar lama dibersihkan jika ada
      const existingTopbar = document.getElementById('site-topbar-wrapper');
      if (existingTopbar && existingTopbar.parentNode) {
        existingTopbar.parentNode.removeChild(existingTopbar);
      }

      // Injeksi navbar utama ke dalam #site-header yang sticky top-0
      headerEl.innerHTML = buildNavbar(active, base);
      headerEl.className = 'sticky top-0 z-50';
    }

    const footerEl = document.getElementById('site-footer');
    if (footerEl) footerEl.innerHTML = buildFooter(base);

    const btn = document.getElementById('site-mobile-menu-btn');
    const menu = document.getElementById('site-mobile-menu');
    if (btn && menu && !btn.__hasListener) {
      btn.__hasListener = true;
      btn.addEventListener('click', function () {
        const isHidden = menu.classList.toggle('hidden');
        const icon = btn.querySelector('i');
        if (icon) {
          icon.className = isHidden ? 'fi fi-rr-menu-burger text-base' : 'fi fi-rr-cross text-base';
        }
      });
    }

    // Desktop dropdown click/tap support for touchscreens
    const dropdownWrappers = document.querySelectorAll('.siy-nav-dropdown');
    dropdownWrappers.forEach(function (dd) {
      const ddBtn = dd.querySelector('.siy-dropdown-btn');
      if (ddBtn && !ddBtn.__hasClick) {
        ddBtn.__hasClick = true;
        ddBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          const wasOpen = dd.classList.contains('is-open');
          dropdownWrappers.forEach(function (other) { other.classList.remove('is-open'); });
          if (!wasOpen) dd.classList.add('is-open');
        });
      }
    });
    if (!window.__siyDropdownGlobalCloseAttached) {
      window.__siyDropdownGlobalCloseAttached = true;
      document.addEventListener('click', function () {
        document.querySelectorAll('.siy-nav-dropdown.is-open').forEach(function (dd) { dd.classList.remove('is-open'); });
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          document.querySelectorAll('.siy-nav-dropdown.is-open').forEach(function (dd) { dd.classList.remove('is-open'); });
        }
      });
    }

    // Mobile accordion menu handler
    const mobAccordionBtns = document.querySelectorAll('.site-mobile-accordion-btn');
    mobAccordionBtns.forEach(function (accBtn) {
      if (!accBtn.__hasClick) {
        accBtn.__hasClick = true;
        accBtn.addEventListener('click', function () {
          const targetId = accBtn.getAttribute('data-target');
          const panel = document.getElementById(targetId);
          const icon = accBtn.querySelector('.site-acc-chevron');
          if (panel) {
            const isHidden = panel.classList.toggle('hidden');
            if (icon) {
              icon.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
            }
          }
        });
      }
    });

    // Smooth page transitions activator
    ensurePageTransitions(base);

    // Hydrate dynamic school profile
    fetchAndHydrateSchool();
  };
  window.hydrateSchoolData = fetchAndHydrateSchool;
})();
