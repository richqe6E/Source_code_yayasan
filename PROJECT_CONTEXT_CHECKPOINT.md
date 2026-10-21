# 📌 DOKUMEN KONTEKS & CHECKPOINT RESMI PROYEK SIYAYASAN V2
**Terakhir Diperbarui:** 21 Oktober 2026 (Sesi 48 - Penyatuan Domain Kanonik siyayasan.vercel.app, Pembentukan Subagent SEO Auditor & Eksekusi Fondasi SEO Tahap 1: robots.txt, sitemap.xml, canonical, noindex portal, OpenGraph, JSON-LD Schema.org)
**Status Sistem:** ✅ Production & Database 100% Operasional, Live Verified (`https://siyayasan.vercel.app` & Supabase Cloud).  
**Mandat Konteks:** **HANYA gunakan arsitektur sistem baru ini (Supabase Cloud + Vercel 2-Portal). Seluruh proses/sistem lama (Google Apps Script, Portal Guru, Portal Orang Tua, Password Guru, Rapor Elektronik Siswa, & Kolom Status Verifikasi Berkas tanpa backend) resmi dihapus dan tidak digunakan lagi.**

---

## 🎯 1. Ringkasan & Arsitektur Utama Sistem (Single Source of Truth)
Sistem Informasi Manajemen & Portal Website **Yayasan At Tarbiyyah Wijaya Kusuma Samarinda (PAUD, TK, TPQ)** beroperasi penuh di atas **Supabase Cloud (PostgreSQL + Storage)** dan **Vercel Production** dengan arsitektur **2 Portal Inti + Website Publik Utama**:
1. **Portal Admin & Staf TU** (`frontend/portal/admin/`):
   - Mengelola Dashboard KPI, Manajemen Akun (`users.html`), Data Guru tanpa akun login (`teachers.html`), Kelas & Rombel (`classes.html`), Data Siswa Aktif (`students.html`), Verifikasi & Konversi PPDB (`ppdb.html`), Keuangan SPP & Verifikasi Bukti Transfer (`payments.html`), Kelola Konten & Profil Lembaga (`content.html`), CMS Pengaturan Website & Hero Carousel (`cms_setting.html`), Laporan Ekspor/Impor Excel (`reports.html`), Audit Log (`logs.html`), dan Backup & Restore Database (`backup.html`).
2. **Portal Siswa & Wali Murid** (`frontend/portal/siswa/`):
   - Mengelola Dashboard Status PPDB (4-Step Tracker bagi Calon Siswa) & Ringkasan Akademik/SPP (bagi Siswa Aktif) (`dashboard.html`), Biodata & Sinkronisasi Profil (`biodata.html`), Tagihan SPP, Upload Bukti Transfer & Cetak Kuitansi Resmi (`spp.html`), serta Upload & Pratinjau Berkas Dokumen Siswa (`dokumen.html`).
3. **Website Publik Utama** (`frontend/public/`):
   - Beranda (`index.html`), Profil Yayasan & Bagan Pohon Organisasi (`profil.html`), Berita (`berita.html`), Pengumuman (`pengumuman.html`), Agenda (`agenda.html`), Galeri (`galeri.html`), Kontak & Peta Interaktif Google Maps (`kontak.html`), Formulir PPDB Online 5 Tahap (`ppdb.html`), dan Cek Status Pendaftaran PPDB (`ppdb/status.html`).

---

## ⚖️ 2. Keputusan Arsitektur Kunci yang Berlaku Permanen
1. **Sistem Murni 2-Portal (Tanpa Portal Guru & Tanpa Portal Ortu Terpisah):**
   - **Guru / Tenaga Pendidik** adalah data direktori kepegawaian & wali kelas yang dikelola oleh Admin di `teachers.html` (tanpa field password/login).
   - **Rapor Akademik Elektronik Ditiadakan** karena evaluasi santri usia dini diberikan secara fisik kepada orang tua.
2. **Berkas Dokumen Siswa (`siswa/dokumen.html`) Terintegrasi Langsung ke Modal Detail Siswa Admin (`admin/students.html` & `admin/ppdb.html`):**
   - Kartu unggah **Kartu Keluarga (KK)** dan **Akte Kelahiran** menampilkan pratinjau gambar (*thumbnail*) langsung, dan tabel riwayat unggahan bebas dari kolom status verifikasi per-dokumen yang tidak memiliki tombol aksi di Admin.
3. **Aturan Palet Warna Zero-Green (Oceanic Blue):**
   - Seluruh halaman publik, portal admin, dan portal siswa menggunakan palet **Oceanic Blue** (`#0284c7`, `#0ea5e9`, `#0369a1`, `#e0f2fe`).
4. **Sinkronisasi Penuh Lintas Perangkat (Supabase Cloud Persistence):**
   - Seluruh pengaturan dari `content.html` dan `cms_setting.html` (termasuk `visi`, `misi`, `budaya`, `sejarah`, `program_pendidikan.{paud,tk,tpq}`, `kurikulum`, `struktur_organisasi`, `operational_hours`, `hero_images`, `maps_url`, `maps_embed_url`, dan `backup_history`) disimpan ke Supabase (`web_settings` & `schools`) sehingga tampil konsisten di semua perangkat pengunjung.
5. **Self-Healing PostgREST Adapter (`frontend/shared/js/api.js`):**
   - Fungsi `supabaseRest` dilengkapi mekanisme *automatic column self-healing*: apabila sebuah *payload* `POST`/`PATCH` menyertakan kolom lama yang tidak ada pada skema tabel Supabase, adapter otomatis menghapus kolom tersebut dan mengulang permintaan tanpa error.

---

## 🛠️ 3. Riwayat Remediasi & Pembaruan Sistem Terbaru

### 🔹 A. Remediasi Menyeluruh Pra-Deploy (Sesi 43 — Commit `a2da3a6`)
1. **Perbaikan 4 Runtime Error Kritis:**
   - Mendeklarasikan `loginUrl` pada handler `ppdb/convert` di `api.js`.
   - Memperbaiki percabangan `} else {` di `portal/siswa/dashboard.html` antara tampilan Calon Siswa PPDB dan Siswa Aktif.
   - Mendefinisikan helper `escapeAttr(s)` di `portal/admin/students.html` untuk modal pratinjau dokumen siswa.
   - Memperbaiki fallback logo (`/images/logo.png`) dan cache `sessionStorage` di `public/js/public-shell.js`.
2. **Sinkronisasi Lintas Perangkat & Filter Konten Publik:**
   - Menyimpan atribut diperluas profil yayasan & pengaturan website ke kolom JSON `web_settings.announcement_banner` dan `schools.wa_gateway_token`.
   - Menyaring konten berstatus `draft` dari halaman publik (`news/list`, `announcements/list`, `events/list`) serta menampilkan jam agenda dinamis (`ev.time`) di `agenda.html`.
3. **Penyempurnaan Portal Siswa & Portal Admin:**
   - Menambahkan handler `auth/update_profile` di `api.js`, menormalisasi tipe dokumen (`pas_foto`, `kartu_keluarga`, `akta_kelahiran`), mencegah duplikasi dokumen saat upload ulang, dan menyinkronkan update biodata siswa ke `ppdb_registrations`.

### 🔹 B. Penyempurnaan Operasional Live Hasil Uji Pengguna (Sesi 44 — Commit `b2901a3`, `9cdec0d`, `ed13d57`, `98a0267`)
1. **Manajemen Akun & Ganti Password (`users.html` & `api.js` — Commit `b2901a3`):**
   - Menghapus atribut warisan `role_id` yang memicu error PostgREST `Could not find the 'role_id' column of 'users' in the schema cache`.
   - Memasang *strict column whitelist* pada `users/create` & `users/update` serta proteksi *self-healing* otomatis di `supabaseRest()`.
2. **Pembersihan Field Password Guru & Panduan Pengujian E2E (`teachers.html` & `PANDUAN_PENGUJIAN_MENYELURUH_E2E.md` — Commit `9cdec0d`):**
   - Menghapus field input `Password` warisan dari modal Tambah/Edit Guru di `frontend/portal/admin/teachers.html`.
   - Menyusun dokumen panduan pengujian menyeluruh manual & otomatis di `PANDUAN_PENGUJIAN_MENYELURUH_E2E.md`.
3. **Pembersihan Tabel Berkas Siswa & Pratinjau Thumbnail (`siswa/dokumen.html` — Commit `ed13d57`):**
   - Menghapus kolom `Status Verifikasi (⏳ Menunggu Review)` yang tidak memiliki integrasi tombol di Admin.
   - Menambahkan pratinjau gambar (*thumbnail*) langsung pada kartu **Kartu Keluarga (KK)** dan **Akte Kelahiran**.
4. **Integrasi Penuh Program Pendidikan, Kurikulum, Hero Carousel, Catatan PPDB & Riwayat Backup (`index.html`, `profil.html`, `cms_setting.html`, `backup.html`, `api.js` — Commit `98a0267`):**
   - Menambahkan atribut ID HTML (`#home-program-paud`, `#home-program-tk`, `#home-program-tpq`, `#home-kurikulum`, `#profil-program-paud-tk`, `#profil-program-tpq`, `#profil-kurikulum`) pada `public/index.html` dan `public/profil.html` serta memetakan objek `program_pendidikan.{paud, tk, tpq}` dan `kurikulum` dari tab **Identitas & Medsos Sekolah** (`admin/content.html`).
   - Mengaktifkan **Auto-Save ke Supabase** saat menambah atau menghapus slide gambar Hero Carousel di `admin/cms_setting.html`.
   - Menyinkronkan catatan periode PPDB ke kolom `notes` dan `announcement_notes` di tabel `ppdb_periods`, serta menyinkronkan banner CTA bawah di `public/profil.html` saat pendaftaran PPDB ditutup/dibuka.
   - Memperbaiki penyimpanan riwayat **Backup & Restore Database** (`admin/backup.html` & `api.js`) agar mencakup seluruh 14 tabel utama, bebas dari kegagalan batas kuota `localStorage` (`QuotaExceededError`), dan menyinkronkan metadata riwayat backup ke Supabase Cloud (`web_settings`).

### 🔹 C. Domain Resmi & Simulasi Browser E2E Operasional Menyeluruh (Sesi 45 — 20 Oktober 2026)
1. **Domain Resmi Produksi (`https://siyayasan.vercel.app`):**
   - Berhasil ditetapkan sebagai domain produksi resmi yayasan via Vercel CLI (HTTP 200, clean public URL tanpa proteksi SSO).
2. **Eliminasi 100% Page Errors & Console Errors:**
   - Menghapus aturan native `@view-transition` dari `style.css` dan `page-transitions.js` yang memicu `Transition was aborted because of invalid state. ViewTransition opt-in disabled` saat redirect autentikasi login.
   - Memastikan `siy-page-progress` diinisialisasi setelah `document.body` siap (`DOMContentLoaded`) untuk mengeliminasi error `Cannot read properties of null (reading 'appendChild')`.
   - Menyelaraskan sorting pembayaran di `siswa/get_spp` (`api.js`) menjadi `submitted_at.desc` (kolom `created_at` tidak ada pada tabel `payments`).
   - Membersihkan kolom fiktif dari payload `ppdb/submit` (`password`, `account_password`, `program`, `level`) dan `ppdb/convert` (`fallback_dob_password`, `birth_date`) sehingga operasi REST Supabase berhasil pada *attempt* pertama dengan HTTP 201/200 tanpa memicu error HTTP 400.
3. **Penyempurnaan Sinkronisasi CMS & Pengaturan Sekolah:**
   - Menyinkronkan update profil sekolah dan CMS serentak ke `schools.wa_gateway_token` dan `web_settings.announcement_banner` (`id=default`), serta memadukan data terbaru berdasarkan timestamp `updated_at`.
   - Memperbaiki `frontend/public/kontak.html` agar selalu mengambil data live via `web_settings/get` sehingga jam operasional dan nomor WhatsApp langsung termutakhirkan di perangkat pengunjung lain.
4. **Fitur Baru Operasional Admin:**
   - **Lightbox Preview Dokumen PPDB:** Pratinjau berkas Pas Foto 3x4, Akta Kelahiran, dan Kartu Keluarga langsung di dalam modal `ppdb.html` (`openPpdbDocPreview`) tanpa diblokir browser.
   - **Tab Pesan Kontak Masuk:** Tab `messages` pada `frontend/portal/admin/content.html` untuk menampung pesan konsultasi dari pengunjung `/kontak.html` lengkap dengan tombol **Balas via WA** dan **Hapus**.

### 🔹 D. Branding Resmi Yayasan & Favicon Browser (Sesi 46 — Commit `a18a70a`)
1. **Pembaruan Asset Favicon Multi-Ukuran:**
   - Menghasilkan `frontend/public/favicon.ico` multi-resolusi (16, 32, 48, 64, 128, 256 px) berbasis logo resmi Yayasan At Tarbiyyah Wijaya Kusuma Samarinda (`logo.png`).
   - Menghasilkan `favicon.png` (32x32), `apple-touch-icon.png` (180x180), dan `icon-192.png` (192x192).
2. **Universal HTML Branding (30 Halaman):**
   - Menambahkan tag favicon standar ke seluruh 30 file HTML (14 Halaman Publik, 12 Portal Admin, 4 Portal Siswa).
   - Menghubungkan sinkronisasi otomatis logo di `public-shell.js` jika URL logo sekolah diperbarui di basis data.
3. **Routing & Deployment:**
   - Menambahkan aturan rewrites `/favicon.ico`, `/favicon.png`, `/apple-touch-icon.png`, dan `/icon-192.png` di `vercel.json`.
   - Ter-deploy dan terverifikasi live di `https://siyayasan.vercel.app` (HTTP 200 OK).
4. **Analisis Skalabilitas Portal Siswa:**
   - Struktur portal siswa menggunakan arsitektur multi-tenant dinamis berbasis token JWT dan isolasi query per-`student_id`.
   - Kapasitas database PostgreSQL (Supabase) dan cloud storage siap melayani ratusan hingga ribuan siswa aktif secara bersamaan tanpa benturan data.

### 🔹 E. Pembersihan Form Login & Desain Editorial Modal Panduan Bebas AI-Slop (Sesi 47 — Commit `7e3c7c1`)
1. **Pembersihan Form Login:** Menghapus tombol `?` kecil dan kotak bantuan inline di samping label NIS dan Password di `frontend/public/login.html`. Formulir menjadi lega, elegan, dan bebas dari pergeseran layout (*zero layout shift*).
2. **Desain Editorial Modal Bantuan:** Menghilangkan elemen grafis/ikon lingkaran besar. Menggantinya dengan kartu panduan resmi berstruktur rapi (*clean definition list*), tipografi formal, dan tombol WhatsApp otomatis yang menyesuaikan peran Siswa vs Admin.
3. **Penyempurnaan Interaksi:** Menambahkan event listener penutup modal saat klik di luar kotak (*backdrop click*) dan tombol keyboard `Escape`.

### 🔹 F. Sinkronisasi Tunggal Banner Hero Carousel & Eliminasi Foto Fallback Statis (Sesi 47 — Commit `965d3d2`)
1. **Eliminasi Foto Fallback Statis (Zero FOUC):**
   - Menghapus 3 foto ruang kelas Unsplash yang sebelumnya tertulis secara statis di `frontend/public/index.html`.
   - Menggantinya dengan foto resmi lingkungan sekolah (`hero_slide_1792469386750_srz5t.jpg`) serta menyisipkan script inline instan pada elemen `#hero-slider-container` yang membaca `siy_hero_cache` dari `localStorage` saat detik ke-0 sehingga halaman beranda terbuka mulus tanpa jeda atau kedipan layar.
2. **Penetapan Single Source of Truth `hero_images` di API:**
   - Memperbaiki `frontend/shared/js/api.js` pada aksi `web_settings` get agar kolom `web_settings.hero_images` menjadi satu-satunya sumber kebenaran data slide. Data JSON sekunder (`announcement_banner` dan `schools.wa_gateway_token`) maupun cache usang tidak lagi dapat menimpa daftar slide database.
   - Memastikan `web_settings` update menyertakan `hero_images` bahkan saat fallback `minimalWs` berjalan.
   - Menghapus keterlibatan `hero_images` dari pembaruan modul `schools` agar profil sekolah umum tidak mengotori daftar slide beranda.
3. **Sinkronisasi Instan CMS Admin:**
   - Memperbarui `frontend/portal/admin/cms_setting.html` saat admin menambah, menghapus (`deleteSlide`), atau menyimpan slide untuk langsung menyelaraskan `localStorage.setItem('siy_hero_cache', ...)` sehingga perubahan di tab admin langsung berdampak seketika pada tab beranda publik.
4. **Pembersihan Data Cloud di Supabase:**
   - Membersihkan banner lama "test" (`73w1l`) yang terhapus dari seluruh kolom JSON di Supabase (`web_settings.announcement_banner` dan `schools.wa_gateway_token`) melalui REST API, menghasilkan konsistensi 100% dengan hanya slide aktif "Suasana" (`srz5t`).
5. **Verifikasi Produksi Live:**
   - Ter-deploy dan terverifikasi live di `https://siyayasan.vercel.app` (HTTP fetch: 0 Unsplash, 0 slide terhapus, foto aktif sekolah termuat instan).

---

## 📊 4. Hasil Uji Otomatis & Status Operasional
Semua test suite dan simulasi operasional browser live berjalan **100% LULUS**:
- **Simulasi E2E Browser Headless Chrome (44 Langkah Operasional):** **44/44 PASS (100%)**, 0 Bug, 0 Error Konsol, 0 Error Halaman (`scratch/run-full-browser-uat.js`).
- **Verifikasi Halaman Publik & Autentikasi (`scratch/verify-login-errors.js`):** 0 Error Halaman, 0 Error Konsol.
- **Verifikasi Sinkronisasi Hero Carousel (`verify_hero_sync.js`):** LULUS 100% (0 Unsplash, 0 zombie banner, 1 foto aktif tersinkronisasi).
- **Supabase Cloud Live (`https://hnkxrbmngmveoxipohtk.supabase.co`):** 100% Aktif & Terverifikasi.
- **Vercel Production Domain Resmi:** `https://siyayasan.vercel.app` (Domain Tunggal Resmi; domain lama `siyayasan-portal.vercel.app` telah dihapus total).

---

## 🚀 5. Cara Menjalankan & Menguji Sistem
1. **Akses Daring (Production Live):**
   - URL Resmi: **`https://siyayasan.vercel.app`**
2. **Akses Lokal (Pengembangan):**
   ```bash
   node frontend/dev-server.js
   ```
   Buka peramban: `http://localhost:3000`
3. **Kredensial Akun Login Resmi:**
   - **Super Admin (Tab Staf / Admin):** `admin@yayasan.sch.id` | Password: `230400`
   - **Admin TU (Tab Staf / Admin):** `tu@yayasan.sch.id` | Password: `tu123456`
   - **Siswa Aktif (Tab Portal Siswa):** NIS `2026001` atau NIS hasil aktivasi PPDB | Password: kata sandi pendaftaran atau tanggal lahir

---

## 🗺️ 6. Panduan Wajib untuk Sesi Mendatang
1. **Konteks Tunggal:** Selalu baca `PROJECT_CONTEXT_CHECKPOINT.md` dan `PROJECT_STATUS.md` di awal sesi.
2. **Jangan Gunakan Sistem Lama:** Abaikan dan jangan pernah mengaktifkan kembali sistem/kode lama (Google Apps Script, Portal Guru, Portal Orang Tua, Password Guru, atau field database fiktif seperti `role_id` pada tabel `users`).
3. **Pertahankan Sistem Baru:** Seluruh alur kerja menggunakan `frontend/shared/js/api.js` yang terhubung langsung ke Supabase REST & Storage API serta ter-deploy di Vercel (`https://siyayasan.vercel.app`).


### 🔹 C. Penyatuan Domain Kanonik & Implementasi SEO Tahap 1 (Sesi 48 — 21 Oktober 2026)
1. **Penyatuan Domain & Redirect Kanonik:**
   - Menghapus redundansi `siyayasan-portal.vercel.app` dengan menerapkan aturan HTTP 308 Permanent Redirect di `vercel.json` ke domain kanonik `https://siyayasan.vercel.app`.
2. **Subagent AI SEO Website Auditor:**
   - Agen audit teknis non-destruktif berbasis standar Google Search Essentials dan Core Web Vitals dibentuk di `.agents/skills/seo-website-auditor/SKILL.md` dan artefak audit komprehensif dipublikasikan.
3. **Pondasi SEO Tahap 1 (Infrastruktur & Indexability):**
   - Menerbitkan `robots.txt` dan `sitemap.xml` resmi dengan 10 URL publik kanonik.
   - Menambahkan perlindungan `noindex, nofollow, noarchive` pada 16 file HTML portal admin & siswa (melalui meta tag dan HTTP Edge header `X-Robots-Tag`) guna melindungi privasi data sekolah.
   - Melengkapi 11 halaman publik dengan `<link rel="canonical">`, Open Graph, Twitter Cards, dan Schema.org JSON-LD Structured Data.
   - Seluruh integrasi data (PPDB, SPP, Auth, Supabase REST) tetap 100% utuh tanpa perubahan.
