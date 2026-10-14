================================================================================
DOKUMEN AUDIT UI/UX & DIRECTIVE PENGEMBANGAN (UNTUK ANTIGRAVITY IDE)
Proyek      : Portal Publik & SIAKAD Yayasan At Tarbiyyah Wijaya Kusuma
Target URL  : https://siyayasan-portal.vercel.app/ (index.html)
Fokus Audit : Navigation Bar, Hero Section, dan Alur Informasi Beranda
Auditor     : Argon (SIYAYASAN UI/UX & Brand Auditor)
================================================================================

PANDUAN UNTUK ANTIGRAVITY IDE:
Dokumen ini berisi hasil evaluasi menyeluruh terhadap halaman Beranda publik 
(index.html) beserta spesifikasi kode dan instruksi perbaikan. Gunakan dokumen 
ini sebagai bahan diskusi dan acuan eksekusi refactoring kode.

--------------------------------------------------------------------------------
BAGIAN 1: TEMUAN AUDIT SISTEM & ALUR KERJA (WORKFLOW & BRAND AUDIT)
--------------------------------------------------------------------------------

[1.1] KRITIS / HIGH FRICTION (WAJIB SEGERA DIPERBAIKI)

1. Pelanggaran Aturan "Anti-AI Slop" (Seksi Statistik Palsu di Bawah Hero):
   - Kondisi Saat Ini: Tepat di bawah Hero Section masih terdapat 4 kartu metrik 
     angka yang belum resmi ("250+ Siswa Aktif", "24 Tenaga Pendidik", 
     "12 Rombongan Belajar", dan "15 Tahun Mengabdi").
   - Masalah: Melanggar pedoman desain yayasan (dilarang menggunakan kartu 
     metrik/indikator dummy yang belum terverifikasi).
   - Solusi: Hapus total seksi statistik tersebut dan gantikan dengan "3 Pilar 
     Layanan Cepat Institusi" (3 Jenjang Pendidikan Terpadu, Pendaftaran Online 
     5-Tahap, serta SIAKAD & Administrasi SPP).

2. Inkonsistensi Alur CTA Hero (#program-pendidikan) vs Isi Program Pendidikan:
   - Kondisi Saat Ini: Paragraf di Hero menyebutkan yayasan menaungi "PAUD, TK, 
     dan TPQ". Namun saat tombol CTA sekunder "Jelajahi Program Belajar" 
     (#program-pendidikan) diklik, seksi tujuan hanya menampilkan teks "Kami 
     menyediakan dua jenjang pendidikan..." dan hanya menampilkan kartu PAUD 
     serta TK (jenjang TPQ hilang).
   - Solusi: Gunakan nomenklatur resmi "PAUD Terpadu, TK, dan TPQ" di Hero, lalu 
     tambahkan kartu ke-3 untuk jenjang TPQ pada seksi #program-pendidikan 
     dengan layout grid 3 kolom (grid-cols-1 lg:grid-cols-3).

3. Navbar Injeksi Dinamis Tanpa Reservasi Tinggi (Isu CLS & Aksesibilitas):
   - Kondisi Saat Ini: Kontainer navigasi di atas Hero dirender sebagai <div> 
     kosong di HTML awal yang baru diisi lewat JavaScript.
   - Masalah: Menyebabkan Cumulative Layout Shift (lompatan layout saat halaman 
     dimuat) dan berisiko terlambat tampil pada jaringan seluler.
   - Solusi: Berikan reservasi tinggi minimum (min-h-[76px]) pada elemen 
     pembungkus navbar di index.html atau render struktur utama secara statis.

4. Pemisahan Alur Calon Wali Santri (Cek Status PPDB vs Login SIAKAD Siswa):
   - Kondisi Saat Ini: Kartu "SIAKAD Siswa" mencantumkan keterangan "pantau 
     status pendaftaran PPDB online" yang mengarah ke login.html, sedangkan di 
     bagian bawah terdapat tombol "Tracking Status PPDB" ke ppdb/status.html.
   - Solusi: Perjelas pemisahan fungsi:
     a) Cek Status PPDB (ppdb/status.html) -> Akses publik tanpa login.
     b) Portal SIAKAD Siswa (login.html) -> Khusus santri/wali santri terdaftar 
        untuk kelola biodata, unggah berkas, cek tagihan SPP, unggah bukti 
        bayar, dan cetak kuitansi resmi.

[1.2] UI/UX POLISH (VISUAL, TIPOGRAFI & HIERARKI)

1. Zero-Green Enforcement & Standarisasi Kicker Badge:
   - Pastikan badge pengumuman "Penerimaan Siswa Baru TA 2026/2027" di Hero dan 
     label seksi lainnya TIDAK menggunakan rounded-full pill badge berulang 
     ataupun titik berkedip (animate-ping).
   - Pastikan seluruh halaman bebas 100% dari aksen warna hijau/emerald/teal 
     (kecuali logo resmi yayasan). Gunakan palet Oceanic Blue (#0284C7) dan 
     Deep Slate-Navy (#082F49 s.d. #0C4A6E).

2. Standarisasi Tipografi & Tombol Interaktif:
   - Paragraf pengantar di Hero dan deskripsi kartu program wajib menggunakan 
     perataan teks rata kanan-kiri (text-justify leading-relaxed).
   - Angka tahun ajaran (2026/2027) dan angka numerik penting wajib menggunakan 
     class "tabular-nums font-semibold".
   - Seluruh tombol di Navbar dan Hero wajib menggunakan sudut profesional 
     (rounded-lg atau rounded-xl) dengan efek tekan "active:scale-[0.98] 
     transition-all duration-150".


--------------------------------------------------------------------------------
BAGIAN 2: SPESIFIKASI KODE REFERENSI (HTML + TAILWIND CSS)
--------------------------------------------------------------------------------

[2.1] KODE REFERENSI: NAVIGATION BAR (ANTI-CLS & OCEANIC BLUE)

<header id="navbar-container" class="sticky top-0 z-50 min-h-[76px] bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
  <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[76px] flex items-center justify-between" aria-label="Navigasi Utama">
    
    <!-- Brand Identity -->
    <a href="index.html" class="flex items-center gap-3.5 group focus:outline-none">
      <img src="/assets/img/logo-yayasan.png" alt="Logo Yayasan At Tarbiyyah Wijaya Kusuma" class="w-11 h-11 object-contain shrink-0" />
      <div class="flex flex-col">
        <span class="text-sm sm:text-base font-bold tracking-tight text-slate-900 leading-snug">
          Yayasan At Tarbiyyah Wijaya Kusuma
        </span>
        <span class="text-xs font-medium text-slate-500">
          PAUD Terpadu • TK • TPQ — Samarinda
        </span>
      </div>
    </a>

    <!-- Menu Navigasi Desktop -->
    <div class="hidden lg:flex items-center gap-1">
      <a href="index.html" class="px-3.5 py-2 rounded-lg text-sm font-semibold text-sky-600 bg-sky-50">Beranda</a>
      <a href="profil.html" class="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">Profil Yayasan</a>
      <a href="berita.html" class="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">Informasi</a>
      <a href="ppdb.html" class="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">PPDB Online</a>
      <a href="ppdb/status.html" class="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">Cek Status PPDB</a>
      <a href="kontak.html" class="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">Kontak</a>
    </div>

    <!-- Action CTA Desktop -->
    <div class="hidden lg:flex items-center gap-3">
      <a href="login.html" class="px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50 active:scale-[0.98] transition-all">
        Login SIAKAD
      </a>
      <a href="ppdb.html#formulir-pendaftaran" class="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] shadow-xs active:scale-[0.98] transition-all">
        Daftar PPDB
      </a>
    </div>

    <!-- Tombol Hamburger Mobile -->
    <button type="button" id="mobile-menu-btn" class="lg:hidden p-2.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-[0.98]" aria-label="Buka Menu">
      <i class="fas fa-bars text-lg"></i>
    </button>
  </nav>
</header>


[2.2] KODE REFERENSI: HERO SECTION & 3 PILAR LAYANAN (PENGGANTI STATISTIK PALSU)

<!-- HERO SECTION: Deep Slate-Navy (#082F49 to #0C4A6E) -->
<section class="relative bg-gradient-to-b from-[#082F49] via-[#0C4A6E] to-[#0F172A] text-white overflow-hidden">
  <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(2,132,199,0.22),_transparent_60%)] pointer-events-none"></div>

  <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 lg:pt-24 lg:pb-32">
    <div class="max-w-3xl">
      
      <!-- Kicker Resmi (Bukan Pill Rounded-Full, Tanpa Animasi Ping/Titik Berkedip) -->
      <div class="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-sky-950/80 border border-sky-400/30 text-sky-200 text-xs sm:text-sm font-medium mb-6">
        <i class="fas fa-graduation-cap text-sky-400"></i>
        <span>Penerimaan Santri &amp; Siswa Baru TA <strong class="tabular-nums font-semibold text-white">2026/2027</strong></span>
      </div>

      <!-- Heading Utama -->
      <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15] mb-6">
        Membangun Generasi Cerdas, Beradab &amp; Berkarakter Qur&#39;ani
      </h1>

      <!-- Narasi Pengantar (Rata Kanan-Kiri / Justify) -->
      <p class="text-base sm:text-lg text-slate-200 leading-relaxed text-justify mb-8">
        Yayasan At Tarbiyyah Wijaya Kusuma Samarinda menyelenggarakan pendidikan formal dan non-formal pada jenjang 
        <strong class="font-semibold text-white">PAUD Terpadu, TK, dan TPQ</strong> melalui pendekatan holistik yang mengintegrasikan pembiasaan adab Islami, kecerdasan intelektual, dan pendampingan tumbuh kembang anak secara menyeluruh.
      </p>

      <!-- Dual Action CTA -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
        <a href="ppdb.html#formulir-pendaftaran" class="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold text-sm sm:text-base shadow-lg shadow-sky-950/50 active:scale-[0.98] transition-all">
          <i class="fas fa-file-signature"></i>
          <span>Daftar PPDB Online</span>
        </a>
        <a href="ppdb/status.html" class="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-sm sm:text-base backdrop-blur-xs active:scale-[0.98] transition-all">
          <i class="fas fa-magnifying-glass"></i>
          <span>Cek Status Pendaftaran</span>
        </a>
      </div>

    </div>
  </div>
</section>

<!-- PENGGANTI SEKSI STATISTIK PALSU: 3 Pilar Layanan Cepat Institusi -->
<section class="relative z-10 -mt-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
    
    <!-- Kartu 1: Jenjang Resmi -->
    <a href="#program-pendidikan" class="bg-white rounded-xl p-6 border border-slate-200/90 shadow-md hover:border-sky-500 transition-all group">
      <div class="w-11 h-11 rounded-lg bg-[#F0F9FF] text-[#0284C7] flex items-center justify-center mb-4">
        <i class="fas fa-school text-lg"></i>
      </div>
      <h2 class="text-base font-bold text-slate-900 group-hover:text-[#0284C7] transition-colors">
        <span class="tabular-nums font-semibold">3</span> Jenjang Pendidikan Terpadu
      </h2>
      <p class="mt-1.5 text-sm text-slate-600 text-justify leading-relaxed">
        Kurikulum berjenjang dan terstruktur meliputi PAUD Terpadu, Taman Kanak-Kanak (TK), dan Taman Pendidikan Al-Qur&#39;an (TPQ).
      </p>
    </a>

    <!-- Kartu 2: PPDB 5-Tahap -->
    <a href="ppdb.html" class="bg-white rounded-xl p-6 border border-slate-200/90 shadow-md hover:border-sky-500 transition-all group">
      <div class="w-11 h-11 rounded-lg bg-[#F0F9FF] text-[#0284C7] flex items-center justify-center mb-4">
        <i class="fas fa-clipboard-check text-lg"></i>
      </div>
      <h2 class="text-base font-bold text-slate-900 group-hover:text-[#0284C7] transition-colors">
        Pendaftaran Online <span class="tabular-nums font-semibold">5</span>-Tahap
      </h2>
      <p class="mt-1.5 text-sm text-slate-600 text-justify leading-relaxed">
        Alur pendaftaran santri baru yang ringkas, transparan, dan dilengkapi fitur pelacakan status verifikasi berkas secara langsung.
      </p>
    </a>

    <!-- Kartu 3: Portal Siswa & SPP -->
    <a href="login.html" class="bg-white rounded-xl p-6 border border-slate-200/90 shadow-md hover:border-sky-500 transition-all group">
      <div class="w-11 h-11 rounded-lg bg-[#F0F9FF] text-[#0284C7] flex items-center justify-center mb-4">
        <i class="fas fa-user-shield text-lg"></i>
      </div>
      <h2 class="text-base font-bold text-slate-900 group-hover:text-[#0284C7] transition-colors">
        SIAKAD &amp; Administrasi SPP
      </h2>
      <p class="mt-1.5 text-sm text-slate-600 text-justify leading-relaxed">
        Portal terpadu pengelolaan biodata santri, kelengkapan dokumen, tagihan SPP bulanan, serta pencetakan kuitansi resmi.
      </p>
    </a>

  </div>
</section>


--------------------------------------------------------------------------------
BAGIAN 3: DIRECTIVE EKSEKUSI UNTUK ANTIGRAVITY IDE
--------------------------------------------------------------------------------

TARGET FILE:
1. index.html (atau frontend/public/index.html)
2. File komponen navigasi (misal: js/components.js atau js/navbar.js & css/style.css)

DAFTAR TUGAS (ACTION ITEMS) UNTUK ANTIGRAVITY:
[ ] Tugas 1 - Reservasi Tinggi & Standarisasi Navbar:
    - Tambahkan class "min-h-[76px]" pada elemen kontainer navbar di index.html 
      untuk mencegah Cumulative Layout Shift (CLS) saat JS merender navbar.
    - Pastikan seluruh link aktif dan tombol CTA di dalam komponen navbar 
      menggunakan palet Oceanic Blue (#0284C7 / bg-sky-600, text-sky-600), 
      sudut rounded-lg, dan efek active:scale-[0.98]. Hapus seluruh class 
      berwarna hijau/emerald/teal jika ada.
    - Tambahkan sub-label identitas resmi di bawah nama yayasan pada navbar: 
      "PAUD Terpadu • TK • TPQ — Samarinda".

[ ] Tugas 2 - Refaktor Hero Section (index.html):
    - Ganti latar Hero menjadi gradasi Deep Slate-Navy:
      "bg-gradient-to-b from-[#082F49] via-[#0C4A6E] to-[#0F172A]".
    - Ubah kicker badge di atas <h1> dari bentuk pill (rounded-full) menjadi 
      "rounded-lg bg-sky-950/80 border border-sky-400/30 text-sky-200", 
      pastikan TIDAK ada elemen dot berkedip (animate-ping), dan bungkus angka 
      "2026/2027" dengan <strong class="tabular-nums font-semibold text-white">.
    - Tambahkan class "text-justify" pada paragraf deskripsi Hero dan ubah 
      penyebutan jenjang menjadi "PAUD Terpadu, TK, dan TPQ".
    - Ubah tombol di Hero menggunakan "rounded-xl" dan "active:scale-[0.98]".

[ ] Tugas 3 - Hapus Seksi Statistik Palsu (Anti-AI Slop Enforcement):
    - Hapus seluruh blok <section> yang memuat 4 angka metrik dummy 
      (250+ Siswa Aktif, 24 Tenaga Pendidik, 12 Rombongan Belajar, 15 Tahun Mengabdi).
    - Gantikan blok tersebut dengan komponen "3 Pilar Layanan Cepat Institusi" 
      sesuai spesifikasi pada Bagian [2.2].

[ ] Tugas 4 - Sinkronisasi Seksi #program-pendidikan & Seksi SIAKAD:
    - Pada seksi #program-pendidikan, ubah subjudul dari "Kami menyediakan dua 
      jenjang pendidikan..." menjadi tiga jenjang resmi: PAUD Terpadu, 
      TK (Taman Kanak-Kanak), dan tambahkan kartu ke-3 untuk TPQ (Taman 
      Pendidikan Al-Qur'an) dengan grid "grid-cols-1 lg:grid-cols-3".
    - Pada seksi SIAKAD, perbarui deskripsi kartu SIAKAD Siswa menjadi: 
      "Kelola biodata santri, unggah berkas pendaftaran, cek tagihan & unggah 
      bukti bayar SPP, serta cetak kuitansi resmi."

================================================================================
AKHIR DOKUMEN AUDIT
================================================================================