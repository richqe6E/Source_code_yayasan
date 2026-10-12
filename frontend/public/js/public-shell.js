// Shared public site header & footer injector.
// Pages opt in by including <div id="site-header"></div> and <div id="site-footer"></div>
// in their markup, then call injectSiteChrome({ activeKey, basePath }).

(function () {
  const NAV_ITEMS = [
    { key: 'home',          href: 'index.html',        label: 'Beranda' },
    { key: 'profile',       href: 'profil.html',       label: 'Profil' },
    { key: 'news',          href: 'berita.html',       label: 'Berita' },
    { key: 'announcements', href: 'pengumuman.html',   label: 'Pengumuman' },
    { key: 'events',        href: 'agenda.html',       label: 'Agenda' },
    { key: 'gallery',       href: 'galeri.html',       label: 'Galeri' },
    { key: 'ppdb',          href: 'ppdb.html',         label: 'PPDB' },
    { key: 'contact',       href: 'kontak.html',       label: 'Kontak' }
  ];

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
    return `
      <!-- Top bar resmi: Tampak jelas dan elegan di semua perangkat -->
      <div id="site-topbar" class="block bg-slate-900 text-white text-xs border-b border-slate-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-col sm:flex-row justify-between items-center gap-2 text-[11px] sm:text-xs">
          <div class="flex items-center gap-3 sm:gap-4">
            <a id="site-top-phone" href="tel:+62541234567" class="flex items-center gap-1.5 text-slate-300 hover:text-primary-300 transition">
              <i class="fi fi-rr-phone-call text-xs"></i>
              <span>(0541) 234-5678</span>
            </a>
            <span class="w-px h-3 bg-slate-700/80 inline-block"></span>
            <a id="site-top-email" href="mailto:info@yayasan.sch.id" class="flex items-center gap-1.5 text-slate-300 hover:text-primary-300 transition">
              <i class="fi fi-rr-envelope text-xs"></i>
              <span>info@yayasan.sch.id</span>
            </a>
          </div>
          <div class="flex items-center gap-2.5">
            <span class="text-slate-400 text-[11px]">Media Sosial Resmi:</span>
            <div class="flex items-center gap-2">
              <a id="site-top-fb" href="https://facebook.com/yayasansamarinda" target="_blank" rel="noopener noreferrer" class="w-6 h-6 inline-flex items-center justify-center text-slate-300 hover:text-sky-400 transition" aria-label="Facebook">
                <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a id="site-top-ig" href="https://instagram.com/yayasansamarinda" target="_blank" rel="noopener noreferrer" class="w-6 h-6 inline-flex items-center justify-center text-slate-300 hover:text-pink-400 transition" aria-label="Instagram">
                <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a id="site-top-yt" href="https://youtube.com/@yayasansamarinda" target="_blank" rel="noopener noreferrer" class="w-6 h-6 inline-flex items-center justify-center text-slate-300 hover:text-red-400 transition" aria-label="YouTube">
                <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </div>`;
  }

  function buildNavbar(activeKey, base) {
    ensureUiconsLoaded();

    const links = NAV_ITEMS.map(function (it) {
      const cls = it.key === activeKey
        ? 'px-3 py-2 text-sm font-semibold text-primary-700 rounded-md bg-primary-50'
        : 'px-3 py-2 text-sm font-medium text-slate-700 hover:text-primary-700 hover:bg-slate-50 rounded-md transition';
      return `<a href="${base}${it.href}" class="${cls}">${it.label}</a>`;
    }).join('');

    const mobileLinks = NAV_ITEMS.map(function (it) {
      const cls = it.key === activeKey
        ? 'px-3.5 py-2.5 text-sm font-semibold text-primary-700 bg-primary-50 rounded-lg flex items-center justify-between'
        : 'px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:text-primary-700 hover:bg-slate-50 rounded-lg transition flex items-center justify-between';
      return `<a href="${base}${it.href}" class="${cls}"><span>${it.label}</span><i class="fi fi-rr-angle-small-right text-slate-400"></i></a>`;
    }).join('');

    return `
      <!-- Main Navbar: Putih bersih, modern, sticky, dan teroptimasi untuk HP & Laptop -->
      <nav class="bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all duration-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16 sm:h-20">
            <!-- Brand Logo & Nama -->
            <a href="${base}index.html" class="flex items-center gap-2.5 sm:gap-3 group min-w-0">
              <img src="${base}images/logo.png" alt="Logo Yayasan" class="w-9 h-9 sm:w-11 sm:h-11 object-contain drop-shadow-sm group-hover:scale-105 transition-transform flex-shrink-0" id="site-header-logo-img">
              <div class="min-w-0">
                <div class="text-sm sm:text-base font-extrabold text-slate-900 leading-tight tracking-tight truncate" id="site-header-school-name">Yayasan Samarinda</div>
                <div class="text-[10px] sm:text-[11px] font-semibold text-primary-700 leading-tight tracking-normal">PAUD &amp; TK Terpadu</div>
              </div>
            </a>

            <!-- Desktop Nav Links -->
            <div class="hidden md:flex items-center gap-1">${links}</div>

            <!-- Desktop Action Buttons -->
            <div class="hidden md:flex items-center gap-2.5">
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
            <div class="flex md:hidden items-center gap-2">
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
          <div id="site-mobile-menu" class="hidden md:hidden pb-5 pt-2 border-t border-slate-100">
            <!-- Navigation Links -->
            <div class="flex flex-col gap-1 py-1">
              ${mobileLinks}
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
                <a id="site-mobile-phone" href="tel:+62541234567" class="flex items-center gap-1.5 font-medium hover:text-primary-700 transition">
                  <i class="fi fi-rr-phone-call text-primary-600"></i>
                  <span>(0541) 234-5678</span>
                </a>
                <a id="site-mobile-email" href="mailto:info@yayasan-samarinda.sch.id" class="flex items-center gap-1.5 font-medium hover:text-primary-700 transition">
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
    return buildTopbar(base) + buildNavbar(activeKey, base);
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
                <img src="${base}images/logo.png" alt="Logo Yayasan" class="w-10 h-10 object-contain drop-shadow-sm" id="site-footer-logo-img">
                <div>
                  <div class="text-white font-extrabold text-base leading-tight" id="site-footer-school-name">Yayasan Samarinda</div>
                  <div class="text-[11px] text-sky-400 font-semibold">Pendidikan Berkualitas</div>
                </div>
              </div>
              <p class="text-xs text-slate-300 leading-relaxed mb-4 text-pretty" id="site-footer-desc">Membangun generasi cerdas, berkarakter, dan berakhlak mulia di Kota Samarinda.</p>
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
                    <a id="site-footer-maps-link" href="https://maps.app.goo.gl/WtHnPhhLqqKVqEV66" target="_blank" rel="noopener noreferrer" class="hover:text-sky-300 transition group flex items-start gap-1.5" title="Buka lokasi kampus di Google Maps">
                      <span id="site-footer-address">Jl. Samratulangi, Sungai Keledang, Samarinda</span>
                      <i class="fi fi-rr-arrow-up-right text-[10px] text-sky-400 opacity-70 group-hover:opacity-100 transition mt-0.5"></i>
                    </a>
                  </div>
                </li>
                <li class="flex items-center gap-2">
                  <i class="fi fi-rr-phone-call text-sky-400 shrink-0"></i>
                  <span id="site-footer-phone">(0541) 234-5678</span>
                </li>
                <li class="flex items-center gap-2">
                  <i class="fi fi-rr-envelope text-sky-400 shrink-0"></i>
                  <span id="site-footer-email">info@yayasan-samarinda.sch.id</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>`;
  }

  function applySchoolData(school) {
    if (!school) return;
    const name = school.name || 'Yayasan Samarinda';
    const phone = school.phone || '(0541) 234-5678';
    const email = school.email || 'info@yayasan-samarinda.sch.id';
    const address = school.address || 'Jl. Samratulangi, Sungai Keledang, Samarinda';
    const wa = school.whatsapp_number ? `https://wa.me/${school.whatsapp_number.replace(/\D/g, '')}` : 'https://wa.me/6281234567890';
    const ig = school.instagram_url || 'https://instagram.com/yayasansamarinda';
    const yt = school.youtube_url || 'https://youtube.com/@yayasansamarinda';
    const fb = school.facebook_url || 'https://facebook.com/yayasansamarinda';

    // Footer background image update (from CMS admin)
    if (school.footer_bg_url) {
      const fBg = document.getElementById('site-footer-bg-image');
      if (fBg) fBg.style.backgroundImage = `url("${school.footer_bg_url}")`;
    }

    // Header updates
    const hName = document.getElementById('site-header-school-name');
    if (hName) hName.textContent = name;
    const hLogoImg = document.getElementById('site-header-logo-img');
    if (hLogoImg && school.logo_url) hLogoImg.src = school.logo_url;
    const fLogoImg = document.getElementById('site-footer-logo-img');
    if (fLogoImg && school.logo_url) fLogoImg.src = school.logo_url;

    const topPhone = document.getElementById('site-top-phone');
    if (topPhone) {
      topPhone.href = `tel:${phone.replace(/[^\d+]/g, '')}`;
      const span = topPhone.querySelector('span');
      if (span) span.textContent = phone;
    }
    const topEmail = document.getElementById('site-top-email');
    if (topEmail) {
      topEmail.href = `mailto:${email}`;
      const span = topEmail.querySelector('span');
      if (span) span.textContent = email;
    }

    const topFb = document.getElementById('site-top-fb');
    if (topFb) { topFb.href = fb; topFb.style.display = fb === '#' ? 'none' : 'inline-flex'; }
    const topIg = document.getElementById('site-top-ig');
    if (topIg) { topIg.href = ig; topIg.style.display = ig === '#' ? 'none' : 'inline-flex'; }
    const topYt = document.getElementById('site-top-yt');
    if (topYt) { topYt.href = yt; topYt.style.display = yt === '#' ? 'none' : 'inline-flex'; }

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
    if (fName) fName.textContent = name;
    const fCopy = document.getElementById('site-footer-copy-name');
    if (fCopy) fCopy.textContent = name;
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
      if (cached) applySchoolData(JSON.parse(cached));
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
        const resp = await fetch(`${supUrl}/rest/v1/schools?select=*&limit=1`, {
          headers: { 'apikey': supKey, 'Authorization': `Bearer ${supKey}` }
        });
        if (resp.ok) {
          const list = await resp.json();
          if (Array.isArray(list) && list.length > 0) school = list[0];
        }
      }

      if (school) {
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
      // Injeksi topbar sebelum navbar jika belum ada (hanya di desktop, tidak sticky)
      let topbarEl = document.getElementById('site-topbar-wrapper');
      if (!topbarEl && headerEl.parentNode) {
        topbarEl = document.createElement('div');
        topbarEl.id = 'site-topbar-wrapper';
        headerEl.parentNode.insertBefore(topbarEl, headerEl);
      }
      if (topbarEl) topbarEl.innerHTML = buildTopbar(base);

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

    // Smooth page transitions activator
    ensurePageTransitions(base);

    // Hydrate dynamic school profile
    fetchAndHydrateSchool();
  };
  window.hydrateSchoolData = fetchAndHydrateSchool;
})();
