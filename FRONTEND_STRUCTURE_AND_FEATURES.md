# 🏗️ Struktur Frontend, Fitur & Alur Aktivitas Pengguna (Persiapan Revamp)

Dokumen ini memetakan secara detail struktur antarmuka (frontend), pembagian fitur per portal (RBAC), serta alur aktivitas (*user flows*) dari Sistem Informasi SIYAYASAN V2. Dokumen ini dibuat sebagai landasan (baseline) sebelum melakukan perombakan total (revamp) pada sisi UI/UX maupun fitur, agar kita mengetahui bagian mana saja yang akan berdampak pada backend.

---

## 1. 📂 Struktur Direktori Frontend Saat Ini

Pendekatan saat ini menggunakan **Vanilla JavaScript (ES6) + Tailwind CSS (via CDN) + HTML5 Murni**. Tidak ada build step (Node.js/Webpack) di production, semua langsung di-serve oleh Vercel.

```text
frontend/
├── public/                 # Area Website Publik (Tanpa Login)
│   ├── index.html          # Landing Page (Hero, Profil Singkat, PPDB Dinamis)
│   ├── profil.html         # Profil Yayasan & Struktur Kelembagaan
│   ├── pengumuman.html     # Papan Edaran Resmi & Pengumuman
│   ├── berita.html         # Portal Berita & Artikel
│   ├── berita/
│   │   └── detail.html     # Pembaca Artikel Berita Lengkap
│   ├── galeri.html         # Dokumentasi Visual & Kegiatan Yayasan
│   ├── kontak.html         # Form Kontak & Layanan Konsultasi WhatsApp
│   ├── login.html          # Login Terpadu (Admin TU, Super Admin, Guru, Ortu, Siswa)
│   ├── ppdb.html           # Informasi & Alur Pendaftaran Siswa Baru
│   ├── ppdb/
│   │   └── status.html     # Cek Status Pendaftaran Publik (Acuan Desain Utama)
│   ├── images/
│   │   └── logo.png        # Logo Resmi Institusi
│   ├── css/
│   │   └── style.css       # Styling Global, Tipografi, Focus Rings
│   └── js/
│       ├── app.js          # Logika Publik (Berita, Galeri, Agenda)
│       └── public-shell.js # Shell Navigasi Header/Footer Publik
│
├── portal/                 # Area Terotorisasi Multi-Role (RBAC)
│   ├── admin/              # Portal Manajemen Sekolah (Users, PPDB, Tagihan, Konten)
│   ├── guru/               # Portal Guru (Presensi Siswa, Rapor Aspek PAUD)
│   ├── ortu/               # Portal Orang Tua (Tagihan, Presensi, Perkembangan Anak)
│   └── siswa/              # Portal Siswa (Biodata, Status Pendaftaran, Dokumen)
│
└── shared/                 # Logika & Aset Bersama
    ├── images/
    │   └── logo.png        # Salinan Logo Resmi untuk Portal
    └── js/
        ├── api.js          # Adaptor Data REST Supabase (Sanitasi Payload)
        ├── auth.js         # Token, Sesi & Proteksi Rute RBAC
        ├── shell.js        # Navigasi Portal, Drawer Mobile, dan User Bar
        ├── page-transitions.js # Transisi Halaman Halus & Micro Loading Bar
        └── supabase-config.js  # Kredensial URL & Anon Key Supabase
```

---

## 2. 🧩 Pemetaan Fitur & Alur Aktivitas Pengguna (*User Flows*)

Jika fitur dirombak, berikut adalah alur logika yang berjalan saat ini dan akan terpengaruh:

### A. Alur Publik & Pendaftaran (PPDB)
- **Aktivitas:** Pengunjung melihat informasi yayasan, membaca berita, dan mendaftar PPDB.
- **Logika Berjalan:** 
  1. Frontend mengecek status PPDB (Buka/Tutup) ke Supabase.
  2. Jika buka, pengunjung mengisi form pendaftaran (dengan input wajib bersyarat).
  3. Dokumen (KK/Akte) diupload (opsional) ke Supabase Storage.
  4. Pendaftar mendapat Nomor Registrasi untuk mengecek status pendaftaran.
- **Titik Perombakan:** Jika UI/UX form pendaftaran diubah, validasi data di `api.js` (payload sanitization) wajib disesuaikan dengan skema `supabase_schema.sql` (tabel `ppdb_registrations`).

### B. Alur Manajemen Admin (Super Admin & Admin TU)
- **Aktivitas:** Admin mengelola konten website (berita/galeri) dan memvalidasi pendaftaran siswa baru.
- **Logika Berjalan:**
  - **CMS Publikasi:** Admin mengupload foto kegiatan atau berita melalui portal. Data disimpan di database (Supabase) dan file foto di Storage, lalu otomatis di-render di website utama.
  - **Verifikasi PPDB:** Admin melihat daftar siswa yang mendaftar. Admin mengecek kelengkapan biodata dan dokumen (seperti foto/KK), lalu menekan tombol "Validasi/Diterima".
  - **Pengaturan Jadwal:** Admin bisa menyalakan atau mematikan status "Pendaftaran Buka/Tutup".

### C. Alur Calon Siswa Baru
- **Aktivitas:** Melengkapi pendaftaran dan mengecek status.
- **Logika Berjalan:**
  - **Registrasi Akun:** Siswa baru membuat akun melalui halaman register (hanya jika PPDB sedang dibuka).
  - **Upload Dokumen:** Siswa masuk ke portal mereka dan mengunggah dokumen wajib (Akte/KK).
  - **Pantau Status:** Siswa melihat status pendaftaran (Menunggu/Diterima/Ditolak) yang ter-update otomatis ketika admin melakukan verifikasi.

---

## 3. ⚠️ Analisa Dampak ke Backend Jika Frontend Dirombak

Karena aplikasi ini sangat reaktif dan terhubung langsung secara relasional ke Supabase (via `api.js`), perombakan antarmuka harus memperhatikan hal-hal berikut:

1. **Payload Request ke Supabase (`api.js`):**
   Saat ini, fungsi di `api.js` membersihkan (*sanitize*) properti input dari frontend agar sesuai dengan kolom persis di tabel PostgreSQL. Jika Anda menambahkan form input baru di frontend (misal: "Hobi Anak" pada form PPDB), Anda **wajib** menambahkan kolom `hobi` di tabel Supabase dan mengizinkannya di `api.js`.

2. **Sistem File Upload (Supabase Storage):**
   Saat ini, bukti transfer pembayaran, foto profil, dan dokumen PPDB di-handle lewat input `<input type="file">`. Jika perombakan mengubah UX upload file (misal menggunakan modul dropzone JS), pastikan output akhirnya tetap file yang dikirimkan ke Supabase SDK.

3. **Injeksi Komponen (Navbar & Sidebar):**
   Navigasi saat ini tidak di-*copy-paste* ke semua halaman html, melainkan di-inject menggunakan JavaScript di dalam `shared/js/shell.js`. Jika Anda merombak total desain menggunakan *framework* (seperti React/Next.js) atau memodifikasi layout HTML, struktur `shell.js` ini kemungkinan harus dibongkar total atau dibuang.

4. **Keamanan RBAC (Role-Based Access Control):**
   Logika pemisahan area, seperti "Siswa hanya bisa melihat status miliknya sendiri" dan "Hanya Admin yang bisa mengedit berita/galeri", akan dikunci di level `auth.js` dan Supabase RLS (Row-Level Security). Mengubah alur routing (URL) harus tetap mempertahankan *guard* autentikasi ini.

---

## 4. 🚀 Riwayat Pekerjaan & Status Terkini (Changelog & Status Terakhir)

### Status Operasional: **AKTIF & STABIL (v2.2.0)**
- **Local Dev Server:** Berjalan aktif di `http://localhost:3000` via `node dev-server.js`.
- **Integrasi Backend:** Supabase REST & Storage terhubung via `frontend/shared/js/api.js`.

### Rincian Pekerjaan Terakhir yang Telah Selesai:
1. **Pembersihan Total Elemen "AI SLOP" (Impeccable Design Standard):**
   - **Pill Badges Dihapus:** Menghilangkan badge melekuk pastel (`rounded-full`) dengan ikon kecil di atas judul pada semua sub-halaman: `profil.html`, `berita.html`, `pengumuman.html`, `agenda.html`, `galeri.html`, `kontak.html`, `ppdb.html`, dan `index.html`.
   - **Lampu Hijau Kelap-Kelip Dihapus:** Menghapus animasi `animate-ping` dot hijau berkedip pada teks status PPDB di beranda dan halaman PPDB. Digantikan dengan label pengumuman institusional resmi yang tenang dan elegan.
   - **Bentuk Tombol Profesional:** Menghilangkan tombol kapsul melekuk berlebihan (`rounded-full`), distandarisasi ke bentuk presisi institusional **`rounded-lg`** (8px) dengan respon taktil sentuhan `active:scale-[0.98]`.

2. **Penyelarasan Warna Utama: Biru Samudra (Oceanic / Royal Blue):**
   - Mengikuti karakter dasar identitas dari `http://localhost:3000/ppdb/status.html`.
   - Palet: `primary: { 50:'#F0F9FF', 500:'#0EA5E9', 600:'#0284C7', 700:'#0369A1', 900:'#0C4A6E', 950:'#082F49' }`.
   - Menghapus gradasi hijau gelap (*dark emerald*) dan menggantikannya dengan gradasi biru samudra (*navy blue*) pada Hero Banner, CTA section bawah, dan kartu profil di seluruh 10 halaman publik.
   - **Pembersihan Tuntas Sisa Warna Hijau (Zero-Emerald Sweep):**
     - Kartu tanggal kalender agenda (`agenda.html`: tanggal 06 OKT, 13 OKT, 26 OKT) kini berlatar `bg-primary-50` berbingkai `border-primary-200` dengan tipografi `text-primary-800` & `text-primary-600`.
     - Ikon kalender, pengumuman, dan artikel terkait pada `pengumuman.html`, `berita.html`, dan `berita/detail.html` diselaraskan ke `text-primary-600`.
     - Kartu bento, visi misi, program PAUD/TPQ, dan legalitas resmi pada `profil.html` diselaraskan ke `bg-primary-50` dan `text-primary-700`.
     - Form kontak, jam operasional, alert, dan tombol WhatsApp pada `kontak.html` diselaraskan ke `primary-600`.
     - Ilustrasi SVG, gradasi background kiri, dan tombol bantuan pada `login.html` diselaraskan ke palet biru samudra dan sky blue.
     - Hover link topbar navigasi sosial pada `public-shell.js` diselaraskan ke `hover:text-primary-300`.
   - Mengalihkan warna aksen fokus aksesibilitas (`style.css`) dan micro progress bar atas (`page-transitions.js`) ke palet biru samudra.

3. **Integrasi Logo Resmi Institusi:**
   - Mengunduh berkas resmi logo institusi dari [Wikimedia](https://upload.wikimedia.org/wikipedia/id/6/6a/Logo_Polnes_2015-sekarang.png) ke `frontend/public/images/logo.png` dan `frontend/shared/images/logo.png`.
   - Menggantikan logo huruf kotak hijau "Y" di:
     - Header navigasi utama & footer publik (`frontend/public/js/public-shell.js`).
     - Halaman login (`frontend/public/login.html`).
     - Mobile header, menu drawer, dan sidebar portal (`frontend/shared/js/shell.js`).

4. **Sinkronisasi Dinamis PPDB (Real-Time Database):**
   - Menghubungkan Beranda (`index.html`) ke `apiCall('ppdb', 'period')`.
   - Jika admin mengubah status PPDB menjadi **Buka** atau **Tutup** di portal admin:
     - Teks status hero otomatis menampilkan tahun ajaran aktif dan status terkini.
     - Tombol aksi utama otomatis berubah fungsi (mengarah ke formulir saat buka, atau ke info & alur saat tutup).
     - Section CTA PPDB bawah otomatis menyesuaikan narasi penutupan atau pembukaan gelombang pendaftaran.

5. **Optimalisasi UX & Transisi Halaman (Zero Layout Shift):**
   - Tombol sekunder hero diganti dari "Pelajari Lebih Lanjut" menjadi **"Jelajahi Program Belajar"** dengan *smooth scroll* ke `#program-pendidikan`.
   - Reservasi ruang header `#site-header` dengan `contain: layout; min-height: 104px;` sehingga navigasi antarhalaman tidak memiliki *layout shift* (CLS = 0).
   - Animasi transisi View Transitions lembut dengan *micro loading progress bar* di bagian atas.

### Hasil Verifikasi Rute (HTTP 200 OK):
| Rute Halaman | Status | Tampilan & Branding |
|---|---|---|
| `http://localhost:3000/` | **200 OK** | Oceanic Blue, Logo Resmi, Hero Status Dinamis, 4 Floating Stat Cards |
| `http://localhost:3000/ppdb.html` | **200 OK** | Oceanic Blue, Multi-Tahap 5-Step Wizard, Live File Upload & Preview |
| `http://localhost:3000/ppdb/status.html` | **200 OK** | Acuan Desain Utama (Oceanic Blue), Tracking NIS/Reg |
| `http://localhost:3000/login.html` | **200 OK** | Oceanic Blue, Logo Resmi, Dual Mode (Siswa / Admin) |
| `http://localhost:3000/profil.html` | **200 OK** | Clean Typography, Bento Key Numbers, No AI Slop |
| `http://localhost:3000/berita.html` | **200 OK** | Instant Category Filter, Rounded-lg Buttons |
| `http://localhost:3000/berita/detail.html` | **200 OK** | Clean Editorial Article Layout |
| `http://localhost:3000/pengumuman.html` | **200 OK** | Papan Edaran Resmi, Accordion Details |
| `http://localhost:3000/agenda.html` | **200 OK** | Kalender & Timeline Kegiatan |
| `http://localhost:3000/galeri.html` | **200 OK** | Dokumentasi Visual & Lightbox |
| `http://localhost:3000/kontak.html` | **200 OK** | Form Pesan & Google Maps POLNES Samarinda (Clean Layout) |

6. **Penyempurnaan Layout Hero & Pembersihan Maps (Sesi 10):**
   - Menghapus kartu floating gelap (*Yayasan Samarinda / Akreditasi A / Checklist*) dari Hero Section `index.html`.
   - Mengembalikan layout **4 Kartu Statistik Putih Melayang** (*Siswa Aktif, Tenaga Pendidik, Rombongan Belajar, Tahun Mengabdi*) yang menimpa batas hero secara elegan.
   - Mengintegrasikan peta Google Maps POLNES Samarinda pada `kontak.html` dan menghapus badge pills berlebih (*Parkir Mobil, Akses Ojol, Area Drop-Off*).

7. **Transformasi Formulir PPDB Online Multi-Tahap 5-Step Wizard (Sesi 11):**
   - Mengubah formulir pendaftaran panjang menjadi 5 tahapan terstruktur sesuai `Detail Formulir.md`:
     - **Tahap 1:** Pilihan Jenjang & Identitas Siswa/Santri (NIK 16 digit, Anak Ke/Sdr, Status Kandung/Yatim/Piatu/Yatim Piatu, Agama, WNI, Bahasa, Ciri Khusus).
     - **Tahap 2:** Alamat & Rayon Domisili (Kaltim, Samarinda, Kecamatan, Kelurahan, Alamat Lengkap, Jarak, Transportasi).
     - **Tahap 3:** Data Orang Tua & Wali (Ayah lengkap, Ibu lengkap, Data Wali opsional & collapsible, No WA Utama, Password Akun Portal Siswa).
     - **Tahap 4:** Unggah Dokumen Berkas (Pas Foto Siswa, Akta Kelahiran, Kartu Keluarga KK) dengan validasi ukuran 5MB dan live preview thumbnail.
     - **Tahap 5:** Review Data Lengkap, Tombol Quick-Edit per bagian, Checkbox Pernyataan Keabsahan Data, dan Modal Berhasil dengan Nomor Registrasi.
   - Resiliensi data: Serialisasi metadata lengkap ke kolom `notes` (JSON) dan fallback offline/localStorage pada `frontend/public/js/app.js`.

8. **Upgrade Animasi Vektor Lottie Interaktif di Halaman Login (Sesi 12):**
   - Mengganti video MP4 dengan animasi vektor Lottie (`@lottiefiles/lottie-player`).
   - Aset animasi disimpan lokal di `frontend/public/assets/lottie/education.json` (vektor edukasi, 100% transparan, tanpa kotak latar).
   - Skrip pemutar mandiri disimpan di `frontend/public/js/lottie-player.js` dengan fallback ke CDN.
   - Kebal terhadap pembatasan autoplay browser seluler dan selalu tajam di layar Retina 4K.
   - Konfigurasi server lokal & Vercel mendukung penyajian `/assets/`. Lolos uji 38/38 rute 200 OK.


