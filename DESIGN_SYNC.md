# 🎨 DESIGN SYNC: UI/UX Reference & Benchmark Specification
> **Sumber Referensi:** [SMAN 68 Jakarta](https://sman68-jkt.my.id/)  
> **Target Proyek:** Portal Sistem Informasi & Profil Yayasan At Tarbiyyah Wijaya Kusuma Samarinda  
> **Status:** Tersinkronisasi Aktif  
> **Versi:** 1.0.0

---

## 📌 Ringkasan Eksekutif & Tujuan

Dokumen ini disusun oleh **Agen UI/UX Design-Sync** sebagai basis data referensi desain antarmuka (*design token & UI pattern library*). Dokumen ini berfungsi sebagai patokan tolak ukur (*benchmark*) visual dan interaksi untuk ditiru, diamati, dan dikembangkan (*metode ATM: Amati, Tiru, Modifikasi*) pada seluruh halaman website Yayasan At Tarbiyyah Wijaya Kusuma Samarinda (beranda publik, portal siswa, portal admin, modul pembayaran SPP, dll.).

---

## 🏛️ 1. Karakter Visual & Filosofi Desain Referensi

Website referensi SMAN 68 Jakarta merepresentasikan standar modern institusi pendidikan unggulan di Indonesia:
1. **Clean Editorial & Warm Canvas:** Menghindari warna putih polos menyilaukan (*#ffffff* murni) dengan menggunakan warna dasar *warm cream / light sand* (`#FBFBF9` atau `#F8F7F4`), dipadukan dengan kontras warna institusi yang berwibawa (*deep pine green / rich navy*).
2. **Glassmorphism & Depth:** Menggunakan efek kaca blur (`backdrop-blur-md` / `backdrop-blur-xl`) dengan border tipis transparan (`border-black/5` atau `border-white/10`) untuk memberikan kedalaman visual (*surface depth*) tanpa terkesan berat.
3. **Micro-Interactions yang Halus:** Setiap elemen interaktif (kartu, tombol, menu dropdown, tautan) memiliki transisi halus (`duration-300` hingga `duration-500`), efek hover berskala mikro (`hover:scale-105` atau `hover:-translate-y-0.5`), dan feedback kursor yang jelas.
4. **Aksesibilitas Universal (A11y First):** Menyediakan fitur aksesibilitas tingkat lanjut (pengaturan ukuran font, kontras tinggi, font ramah disleksia, dan tombol pintas navigasi keyboard).

---

## 🎨 2. Palet Token Desain (Color & Typography System)

### A. Palet Warna (Color Palette)

| Token Name | Hex Code / HSL | Implementasi Referensi | Rekomendasi Adaptasi Yayasan At Tarbiyyah |
| :--- | :--- | :--- | :--- |
| **`bg-canvas-warm`** | `#FBFBF9` / `#F8F7F4` | Latar belakang utama halaman | Background body halaman publik & kartu info |
| **`brand-primary`** | `#062A31` (Deep Pine) / `#0F3D3E` | Warna identitas utama, header, footer | Warna primer identitas Yayasan (Deep Oceanic / Pine) |
| **`brand-accent`** | `#10B981` (Emerald) / `#84CC16` | Aksen tombol aktif, badge prestasi | Warna aksen hijau islami & tombol konfirmasi |
| **`brand-gold`** | `#D97706` / `#F59E0B` | Highlight prestasi, bintang, sertifikasi | Highlight beasiswa, tahfidz, piagam penghargaan |
| **`text-ink-primary`** | `#111827` (Gray 900) | Judul utama & headline tebal | Tipografi judul dan heading utama |
| **`text-ink-secondary`**| `#4B5563` (Gray 600) | Teks deskripsi & paragraf | Paragraf berita, sub-heading, metadata |
| **`border-subtle`** | `rgba(0, 0, 0, 0.07)` | Garis pemisah kartu & tabel halus | Border kartu, pembatas tabel & input outline |

### B. Tipografi (Typography Hierarchy)

- **Headline Font:** Font berserif modern atau geometric sans-serif dengan wibawa akademis (misal: *Plus Jakarta Sans*, *Outfit*, atau *Noto Serif / Playfair Display* untuk sentuhan editorial).
- **Body Font:** *Inter* atau *Plus Jakarta Sans* dengan rendering jernih (*antialiased*).
- **Skala Ukuran:**
  - Hero Title: `text-4xl lg:text-6xl font-extrabold tracking-tight`
  - Section Heading: `text-2xl lg:text-3xl font-bold tracking-normal`
  - Card Title: `text-lg lg:text-xl font-bold text-slate-900 line-clamp-2`
  - Body Text: `text-sm lg:text-base text-slate-600 leading-relaxed`
  - Micro-label / Badges: `text-xs font-semibold tracking-wider uppercase`

---

## 🧩 3. Dekomposisi Komponen Spesifik (UI Component Specs)

### 3.1. Layer Aksesibilitas Terpadu (Top A11y Toolbar)
- **Struktur:** Bar ramping di paling atas layar sebelum navbar utama (`h-9 bg-slate-900 text-slate-300 text-xs`).
- **Fitur Unggulan:**
  - Tombol pintas **Lompat ke Konten Utama** (*Skip to content link* untuk pembaca layar).
  - Pilihan **Ukuran Teks** (`A-`, `A`, `A+`) dengan penyimpanan `localStorage`.
  - Tombol **Mode Kontras Tinggi** (*High Contrast Switch*).
  - Pilihan **Font Ramah Disleksia** (*OpenDyslexic / Dyslexia mode*).
  - Tautan cepat ke Portal Akademik & Kontak Darurat Yayasan.

### 3.2. Navbar Glassmorphism & Search Shortcut (Header)
- **Visual:**
  - Sticky posisi atas: `sticky top-0 z-40 backdrop-blur-xl bg-white/85 dark:bg-slate-900/85 border-b border-slate-200/50`
  - Tinggi navbar: `h-20 flex items-center justify-between px-6 lg:px-12`
  - Identitas Institusi: Logo yayasan bersanding dengan tipografi nama resmi dua baris (Baris 1: `YAYASAN AT TARBIYYAH`, Baris 2: `WIJAYA KUSUMA SAMARINDA`).
- **Menu Navigasi:**
  - Tautan navigasi responsif dengan hover pill background lembut (`hover:bg-slate-100/70 hover:text-emerald-700 rounded-xl px-3.5 py-2 transition-all`).
  - Dropdown menu dengan efek fade-slide dan shadow berkelas (`shadow-xl rounded-2xl border border-slate-150`).
- **Pemicu Dialog Pencarian (Search Trigger `Ctrl+K`):**
  - Tombol pencarian interaktif di navbar dengan badge keyboard:  
    `[ Cari informasi... | Ctrl K ]`
  - Styling badge kbd: `px-1.5 py-0.5 text-[11px] font-mono bg-slate-100 border border-slate-200 rounded text-slate-500`.

### 3.3. Hero Section dengan Ken-Burns Slider & Progress Indicator
- **Visual & Layout:**
  - Rasio tampilan impresif dengan fotografi aktivitas santri & lingkungan kampus yayasan.
  - Efek foto Ken-Burns: foto bergerak zoom perlahan (`scale-100` ke `scale-105` durasi 8-10 detik) saat slide aktif.
  - Overlay gradient sinematik: `bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent`.
- **Indikator Slider:**
  - Bukan sekadar titik kecil (*bullet dots*), melainkan **horizontal progress bar** yang terisi perlahan dari 0% ke 100% seiring berjalannya durasi slide (5 detik).
- **Action Buttons (CTA Dual):**
  - Tombol Utama: Solid Emerald/Navy dengan shadow bergradasi (`shadow-lg shadow-emerald-600/20 active:scale-95`).
  - Tombol Sekunder: Transparan kaca dengan border tipis (`backdrop-blur-sm bg-white/10 hover:bg-white/20 border border-white/30 text-white`).

### 3.4. Running News Ticker (Live Marquee Breaking News)
- **Visual:**
  - Pita informasi berjalan yang elegan: `bg-amber-50/80 dark:bg-slate-800 border-y border-amber-200/60 py-2.5 px-4`.
  - Elemen di dalamnya:
    - Badge Ticker Tetap: `[ 📢 INFORMASI TERKINI ]` warna emerald/amber kontras tinggi.
    - Konten Marquee: Mengalir mulus secara horizontal (*CSS animation translateX*).
    - Interaktivitas: Berhenti (*pause*) seketika jika kursor diarahkan ke teks (`hover:pause`).
    - Format item: `[Kategori: Pengumuman/Prestasi] Judul Berita Singkat • Tanggal Publikasi`.

### 3.5. Card Grid Komponen (Berita, Agenda, Prestasi & Fasilitas)
- **Struktur Kartu Modern:**
  - Bentuk: `rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group`.
  - Media Pembungkus (Thumbnail):
    - Rasio 16:9 dengan `overflow-hidden`.
    - Efek zoom saat hover: `group-hover:scale-105 transition-transform duration-500 ease-out`.
    - Badge Kategori Melayang (*Floating Badge*): `absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-800 shadow-sm`.
  - Area Konten:
    - Metadata ringkas (Tanggal dengan ikon kalender, pembaca dengan ikon mata).
    - Judul tebal kontras tinggi: `group-hover:text-emerald-700 transition-colors`.
    - Tautan baca selengkapnya dengan ikon panah animasi geser (`group-hover:translate-x-1 transition-transform`).

### 3.6. Dialog Pencarian Cepat (Interactive Command Palette / Search Modal)
- **Mekanisme:**
  - Tekan tombol navbar atau shortcut keyboard `Ctrl + K` (atau `Cmd + K` di Mac) kapan saja untuk membuka modal pop-up.
  - Backdrop: `fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-start justify-center pt-24 px-4`.
  - Kotak Pencarian:
    - Desain minimalis tanpa border kasar: `bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200`.
    - Input form ukuran besar: `text-lg px-6 py-4 outline-none w-full placeholder-slate-400`.
    - Hasil live filter terbagi dalam kategori:
      - 📄 Halaman Portal (Profil, Visi Misi, SPP, Kontak)
      - 📰 Berita & Informasi Santri
      - 🏆 Prestasi & Galeri
    - Navigasi keyboard: Panah atas/bawah untuk memilih, `Enter` untuk membuka, `Esc` untuk menutup.

### 3.7. Footer Komprehensif Berstandar Nasional (4-Kolom)
- **Latar Belakang:** `bg-slate-950 text-slate-300 pt-16 pb-8 border-t border-slate-900`.
- **Hierarki Kolom:**
  - **Kolom 1 (Identitas Resmi):** Logo Yayasan, Nama Resmi Lengkap, Deskripsi Visi Singkat, Alamat Kampus Samarinda, Kontak WhatsApp resmi, dan Email.
  - **Kolom 2 (Navigasi Lembaga):** Profil Yayasan, Sejarah Singkat, Struktur Pengurus, Visi & Misi, Fasilitas Pendidikan.
  - **Kolom 3 (Layanan & Portal Digital):** Portal Login Siswa, Portal Guru & TU, Cek Tagihan SPP Mandiri, Pendaftaran Santri Baru.
  - **Kolom 4 (Media & Lokasi):** Peta Interaktif/Embed Samarinda, Jam Operasional Pelayanan Kantor, Ikon Media Sosial (YouTube, Instagram, Facebook).
- **Sub-Footer (Copyright Bar):**
  - Teks hak cipta resmi: `© 2026 YAYASAN AT TARBIYYAH WIJAYA KUSUMA SAMARINDA. All rights reserved.`
  - Tautan Kebijakan Privasi & Syarat Ketentuan Layanan.

---

## 🎯 4. Matriks Rencana Peningkatan UI/UX untuk Portal Yayasan

| No | Komponen Saat Ini | Kondisi Eksisting | Rekomendasi Peningkatan Hasil Scan SMAN 68 |
| :--- | :--- | :--- | :--- |
| **1** | **Navbar** | Navbar bootstrap standar, belum ada shortcut search | Tambahkan styling glassmorphism (`backdrop-blur-md`), tombol trigger search `Ctrl+K` dengan badge `kbd`, dan logo responsif. |
| **2** | **Hero Beranda** | Slider foto standar tanpa indikator durasi | Tambahkan efek foto Ken-Burns lembut, staggered subtitle fade-up, dan horizontal progress bar timer. |
| **3** | **Breaking News** | Belum memiliki pita berita berjalan (*ticker*) | Tambahkan Running Announcement Ticker berlatar hangat dengan auto-pause saat hover. |
| **4** | **Pencarian Cepat** | Belum ada fitur pencarian global | Pasang modal Dialog Search `Ctrl+K` dengan indexing instan halaman & berita yayasan. |
| **5** | **Kartu Berita & Info** | Kartu flat standar | Upgrade ke desain kartu dengan floating badge kategori, aspect ratio 16:9, dan thumbnail zoom halus saat hover. |
| **6** | **Toolbar Aksesibilitas** | Belum tersedia | Tambahkan top bar A11y (pengatur ukuran teks dan tombol kontras ramah difabel). |
| **7** | **Footer** | Footer sederhana | Perluas menjadi layout 4-kolom berwibawa dengan jam operasional, tautan portal mandiri, dan legalitas resmi yayasan. |

---

## 🔄 5. Protokol Kerja Agen `design-sync`

Setiap kali pengembang atau AI ingin menambahkan atau memperbarui halaman di repositori ini:
1. **Periksa dokumen ini ([DESIGN_SYNC.md](file:///d:/Source_code_yayasan/DESIGN_SYNC.md))** untuk memastikan kelas warna, radius (`rounded-2xl`), shadow, dan tipografi selaras.
2. **Gunakan Skill Agen ([.agents/skills/design-sync/SKILL.md](file:///d:/Source_code_yayasan/.agents/skills/design-sync/SKILL.md))** untuk melakukan audit visual otomatis setiap sebelum dan sesudah perubahan kode diterapkan.
3. **Pastikan 100% Responsif:** Wajib teruji sempurna pada resolusi mobile (360px - 414px), tablet (768px), dan desktop (1280px+).
