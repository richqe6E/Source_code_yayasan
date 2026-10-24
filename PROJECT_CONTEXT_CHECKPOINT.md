# 📌 DOKUMEN KONTEKS & CHECKPOINT RESMI PROYEK SIYAYASAN V2
**Terakhir Diperbarui:** 24 Oktober 2026 (Sesi 55 - Redesain Struktur Organisasi & Integrasi Upload Foto Wajah Pengurus: Eliminasi Total Kepala PAUD/TK & Koordinator TPQ, 5 Posisi Inti, Upload Foto Admin Portal, dan Zero-FOUC Pre-Hydration Profil Publik)
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


### 🔹 D. Redesain Visual UI/UX Clean & Aesthetic Bebas AI-Slop (Sesi 49 — 21 Oktober 2026)
1. **Pembersihan Ornamen Generik AI-Slop:**
   - Menghapus baris ke-3 teks sub-judul navbar di `public-shell.js` agar header ramping dan elegan.
   - Menghapus floating kicker pill `[🎓 Penerimaan Santri 2026/2027]` pada hero beranda.
   - Menghapus badge `Interaktif` dan kotak bersarang (*box-in-box*) pada accordion persyaratan PPDB.
2. **Ikonografi Vektor Murni & Presisi (Zero Broken Icons):**
   - Mengganti font ikon klip-art yang rentan hilang dengan SVG inline 1.75px stroke untuk PAUD (Tunas), TK (Lentera/Matahari), TPQ (Rehal Al-Qur'an), serta 4 kategori berkas PPDB.
3. **Keseimbangan Tata Letak Cerdas (*Zero-Void Bento Layout*):**
   - Mengubah seksi berita beranda menjadi Bento Hub adaptif: memadukan Warta Utama dengan Potret Galeri Kegiatan Santri sehingga tidak ada kekosongan ruang putih saat data artikel baru sedikit.
4. **Hierarki Tipografi Tenang & Konsisten:**
   - Merapikan kartu alamat kampus di `kontak.html` dengan hierarki bersih dan tombol peta minimalis.


### 🔹 E. Integrasi Real-Time Galeri Beranda dengan Portal Admin (Sesi 50 — 21 Oktober 2026)
1. **Dinamisasi Kartu Galeri Beranda:**
   - Kartu "Potret Kegiatan Santri" di beranda terhubung langsung ke API Supabase `gallery` via `Promise.all` di `frontend/public/js/app.js`.
   - Foto yang diunggah staf/admin di Portal Admin (`content.html`) otomatis tampil di beranda secara *real-time* tanpa perubahan kode.


### 🔹 F. Remediasi Tagihan SPP Massal & Redesain Struktur Organisasi Anti-Slop (Sesi 51 — 21 Oktober 2026)
1. **Analisis Masalah SPP Ganda:**
   - Teridentifikasi akar masalah: loop buta tanpa de-duplikasi di `create_bulk` (`api.js`) dan input bulan teks bebas tanpa normalisasi di `payments.html`.
2. **Pembersihan Invoice Duplikat di Database Supabase:**
   - Berhasil menghapus invoice duplikat `INV-1792580611754-0` (INV/2026/1754/1). Riky Rivaldi terverifikasi hanya memiliki 1 invoice sah `INV/2026/2758` senilai Rp 150.000.
3. **Penyusunan Solusi & Persiapan Skrip:**
   - Dibuat `getInvoiceMonthKey` normalizer (mengonversi seluruh variasi bulan bahasa Indonesia dan tahun ke format standar `YYYY-MM`).
   - Disiapkan pencegahan tagihan ganda pada `create` dan `create_bulk` di `api.js`.
   - Disiapkan penggantian input bulan di `payments.html` menjadi dropdown bulan (Jan–Des) dan tahun (2026–2028).
   - Disiapkan redesain bagan organisasi di `frontend/public/profil.html` dengan kanvas `bg-slate-50/70`, monogram inisial (`DI`, `SH`, `MK`, `CG`, `SP`), konektor arsitektural netral 1.5px, eliminasi total clipart AI-slop, dan layout adaptif (Desktop Tree + Mobile Stepper) dengan preservasi 100% ID CMS Supabase (`org-pembina`, `org-pengawas`, `org-ketua`, `org-sekretaris`, `org-bendahara`, `org-kepala-paud-tk`, `org-kepala-tpq`).
4. **Status Eksekusi (Tuntas):**
   - Anti-duplikasi SPP telah aktif di `frontend/shared/js/api.js` dan modal `payments.html` telah terstandarisasi.
   - Tagihan duplikat Riky Rivaldi di Supabase Cloud telah bersih (sisa 1 invoice sah Rp 150.000).
   - Redesain struktur pengurus di `frontend/public/profil.html` telah aktif (anti-slop, slate-50 canvas, monogram inisial, konektor netral 1.5px, mobile stepper, dan 100% sinkronisasi dinamis CMS Supabase).
   - Pembersihan ornamen AI-slop lanjutan: menghapus badge pill `[✓ Terverifikasi Sah]` di `profil.html` dan floating kicker badge `[📢 PPDB Online Tahun Ajaran 2026/2027]` di `ppdb.html`.
### 🔹 G. Pembersihan Visual & Redesain Anti-AI-Slop Tahap 2 (Sesi 52 — 22 Oktober 2026)
1. **Penghapusan Ornamen AI-Slop & Kicker Mengambang:**
   - **Badge "✓ Terverifikasi Sah"** dihapus seutuhnya dari Seksi 4 Profil Legalitas (`frontend/public/profil.html`), menyisakan judul berwibawa dengan tipografi editorial bersih.
   - **Floating Kicker Badge "📢 PPDB Online Tahun Ajaran 2026/2027"** dihapus dari Hero Section PPDB (`frontend/public/ppdb.html`), membiarkan judul utama H1 memimpin seksi tanpa elemen template AI-slop. Skrip JavaScript dibersihkan dari referensi badge.
2. **Standardisasi Tata Nama & Perapian Kartu Kontak (`frontend/public/kontak.html`):**
   - **"KAMPUS UTAMA"** diganti menjadi **"LOKASI UTAMA"** pada kartu alamat, meta description, iframe Google Maps, dan tooltip link footer di `public-shell.js`.
   - **Teks Keterangan WhatsApp Redundan** ("Pesan Anda akan otomatis terhubung ke WhatsApp resmi...") dihapus dari formulir konsultasi, membuat formulir ringkas dan langsung ke pokok pesan.
   - **Catatan Patokan Legacy "Ulinnuha"** pada kartu alamat dihapus, kolom `campus_note` di Supabase Cloud `web_settings` dikosongkan, dan teks footer diselaraskan menjadi "TPQ At Tarbiyyah".
   - **Garis Pembatas Terpotong (*Broken Half-Dividers*) Dihapus**: Menghilangkan garis pembatas `border-t border-slate-100` terpotong di atas tombol aksi pada kartu Lokasi Utama, Telepon, dan Email.
   - **Penyelarasan Posisi Tombol Aksi**: Tombol Google Maps, Panggilan Telepon, dan Chat WhatsApp dinaikkan posisinya (`mt-2.5`) sehingga menyatu padu dan proporsional dengan teks di atasnya. Ikon pin lokasi dan telepon disejajarkan optis (`mt-0.5`).
3. **Formulir Konsultasi Lebih Ramah Pengunjung:**
   - **Isian Alamat Email Menjadi Opsional**: Menghilangkan tanda wajib merah dan atribut `required`, memperbarui label menjadi `Alamat Email (Opsional)`. Pengiriman pesan ke WhatsApp dan API tetap berjalan lancar tanpa mewajibkan email.
4. **Pembersihan Kartu Galeri Beranda (`frontend/public/js/app.js`):**
   - **Badge Pill "Dokumentasi" Dihapus**: Menghapus elemen badge pill mengambang pada header kartu bento *"Potret Kegiatan Santri"*.
   - **Penyelarasan Teks Fallback**: Istilah "Kampus" pada atribut alt/title fallback gambar diselaraskan menjadi "Gedung Utama" & "Lingkungan Sekolah".
5. **Verifikasi Produksi Live:**
   - Seluruh perubahan telah lolos uji bebas error, ter-commit dan ter-push ke GitHub `origin/main` (Commit `24f5896`, `fe02c92`, `5fc0761`, `465df97`), dan 100% aktif terverifikasi di `https://siyayasan.vercel.app`.
### 🔹 H. Verifikasi Google Search Console, Optimasi Mobile PageSpeed & Eliminasi Zero-FOUC Lintas Halaman (Sesi 53 — 23 Oktober 2026)
1. **Verifikasi Resmi Google Search Console (GSC):**
   - File verifikasi `google65a66b7608d95bce.html` diterbitkan dan ter-deploy aktif (HTTP 200).
   - Meta tag cadangan disematkan di `<head>` `index.html`, dan diizinkan secara eksplisit pada `robots.txt`.
2. **Optimasi Aset & Google PageSpeed Mobile (Fase 2 Performance):**
   - **Kompresi Gambar Masif**: Aset gambar gedung utama `school-campus.jpg` dikompresi dari 998 KB (~1 MB) menjadi 245 KB JPG (-75%) dan format modern `school-campus.webp` 169 KB (-83%) dengan ketajaman visual tetap utuh.
   - **Eliminasi Render-Blocking CSS Flaticon**: 4 file CSS ikon eksternal (~782 KB) diubah menjadi pemanggilan asinkron non render-blocking (`media="print" onload="this.media='all'"` dengan fallback `<noscript>`) di seluruh 8 halaman publik utama.
   - **Penyelarasan Target Sentuh (*Tap Targets*) Mobile**: Menambah padding sentuh (`py-1` dan `min-h-[36px]`) pada seluruh tautan footer dan menu navigasi mobile agar memenuhi standar ergonomi jari Google (≥ 44px).
3. **Eliminasi Total Kedipan Konten Lama (*Zero-FOUC & Static-Cloud Sync*) Lintas Halaman:**
   - **Halaman Profil (`profil.html`)**: Teks statis Sejarah disinkronkan 100% dengan teks terbaru Supabase Cloud (*"Yayasan At Tarbiyyah Wijaya Kusuma Samarinda berdiri sebagai wujud kepedulian..."*), begitu pula Visi dan Misi (bullet points).
   - **Halaman PPDB (`ppdb.html`)**: Linimasa tanggal statis disinkronkan dengan status database terkini (`tanggal 17`, `TUTUP`, `TUTUP`, `TUTUP`, dan catatan resmi panitia) sejak detik ke-0.
   - **Halaman Kontak (`kontak.html`)**: Jam operasional statis diselaraskan dengan database (`07.30 - 12.30 WITA` & `07.30 - 11.00 WITA`).
   - **Instant Pre-Hydration Cache (`siy_school_ext` & `siy_ppdb_period_cache`)**: Skrip inline instan di `<head>` membaca cache lokal pada detik ke-0 sehingga perubahan CMS admin di masa mendatang otomatis tampil instan tanpa jeda latensi jaringan.
4. **Verifikasi Produksi Live:**
   - Ter-deploy dan terverifikasi live di `https://siyayasan.vercel.app` (Commit `ecbf560` & `6c79d63`).
5. **Redesain Sub-Poin Akademik Bersih & Eliminasi Ikon Centang AI-Slop (Item #12 - Commit `cfd8c96`):**
   - Menghapus seluruh ikon centang biru (`fi-rr-check` & SVG checkmark) pada kartu Misi Utama dan Program Pendidikan PAUD, TK, TPQ di `profil.html` dan `index.html`.
   - Menggantinya dengan penanda titik piringan mikro proporsional (`w-1.5 h-1.5 rounded-full bg-primary-600 mt-2 shrink-0`) yang tenang, rapi, lapang, dan bebas polusi visual.
   - Menjaga 100% integritas logika kode dan ID binding CMS (`home-program-paud`, `profil-program-paud-tk`, dll.) serta membiarkan data teks database tetap utuh sesuai input admin.


### 🔹 I. Remediasi Logika Portal Admin & Siswa, Decommissioning Legacy Role Ortu, dan Restorasi Navigasi Sticky (Sesi 54 — 23 Oktober 2026)
1. **Perbaikan Bug Penghapusan Pendaftar PPDB (Item #17 - Commit `cf8da26`):**
   - Menerapkan penghapusan *dual-key* fleksibel ke Supabase REST: `or=(id.eq.${id},registration_number.eq.${id},registration_no.eq.${id})`.
   - Membersihkan record serentak dari seluruh memori lokal (`siy_local_ppdb_regs`, `siy_local_students`, dan `siy_local_users`), menjamin data yang dihapus hilang permanen dan tidak bangkit kembali saat tabel dimuat ulang.
2. **Pembersihan UI Pembayaran & Fitur 1-Klik WhatsApp Tunggakan (Items #18, #19, #20 - Commit `cf8da26`):**
   - Menghilangkan duplikasi tanda tambah pada tombol `[ Buat Tagihan Individu ]` di `payments.html`.
   - Menghilangkan bilah scroll vertikal palsu (*scrollbar thumb artifact*) pada tab bar `payments.html`, `ppdb.html`, dan `content.html` dengan utility anti-scrollbar modern.
   - Mengimplementasikan fitur **1-Klik Kirim Pengingat Tunggakan SPP via WhatsApp** pada tombol `[ 💬 Kirim WA ]` di setiap baris tagihan siswa menunggak, lengkap dengan normalisasi nomor internasional (`628xxx`), salam Islami, rincian bulan, nominal, jatuh tempo, serta nomor rekening resmi Yayasan At Tarbiyyah (BSI `7123456789` & Bank Kaltimtara `0012345678`).
3. **Perbaikan Menyeluruh Sistem Filter & Tab Status PPDB Admin (Item #21 - Commit `cf8da26`):**
   - Memperbaiki logika fallback di `api.js` agar hasil pencarian kosong valid (`[]`) tidak ditimpa data mentah lokal tanpa filter.
   - Menerapkan filter status tab (*Pending, Approved, Converted, Rejected*), dropdown jenjang fleksibel (`paud`, `tk`, `tpq`), dan pencarian teks nama/no pendaftaran multi-kolom yang reaktif dengan event `onchange`, tombol `Enter`, dan tombol `Reset Filter`.
   - Menambahkan mutasi status lokal pada aksi `approve` (`accepted`), `reject` (`rejected`), dan `convert` (`converted`).
4. **Decommissioning Penuh Akun/Peran Orang Tua & Penyelarasan 2 Portal (Item #22 - Commit `cf8da26`):**
   - Menghapus peran `orang_tua` dari `users.html` dan query invoices `api.js`.
   - Mengganti kartu KPI ke-4 di Dashboard Admin dari *"Orang Tua 0 Terdaftar"* menjadi kartu operasional aktif **"Pendaftar PPDB (Perlu Verifikasi)"** yang terhubung langsung ke tabel PPDB.
   - Memperbaiki nomor WA Bendahara di `spp.html` menjadi nomor resmi `081347142829`, serta membersihkan *flashing mock badges* di `students.html` dan `teachers.html`.
5. **Restorasi Navigasi Sticky & Proporsi Desain Publik Asli (Item #23 - Commit `2d3dbb5`):**
   - Mengidentifikasi akar masalah hilangnya navigasi saat scroll: penambahan `overflow-x: hidden` pada `html, body` di `style.css` mematikan fungsi `position: sticky` per spesifikasi W3C CSS.
   - Menghapus aturan `overflow-x: hidden` pada `html, body` serta menghapus blok media query overrides agresif `!important`.
   - Mengembalikan proporsi logo, teks nama yayasan, dan tombol burger di `public-shell.js` ke ukuran nyaman sentuh.
   - Mengembalikan keleluasaan padding kartu di `index.html`, `profil.html`, `kontak.html`, dan `ppdb.html` ke proporsi estetis asli dengan tetap mempertahankan dropdown listbox jenjang pendidikan (Item #14) dan pencegahan autofill email admin (Item #13).
6. **Status Produksi Terkini:**
   - Git Commit: `2d3dbb5` di branch `main` GitHub (`origin/main`).
   - Vercel: 100% aktif ter-deploy di `https://siyayasan.vercel.app`.
   - Status Working Tree: Bersih (`working tree clean`).

### 🔹 J. Redesain Struktur Organisasi & Integrasi Upload Foto Pengurus (Sesi 55 — 24 Oktober 2026)
1. **Eliminasi Total Kepala PAUD/TK & Koordinator TPQ:**
   - Menghapus 2 posisi pelaksana teknis (Kepala Sekolah PAUD/TK dan Koordinator TPQ) dari form input Admin Portal (`content.html`) dan tampilan Bagan Pohon di Profil Publik (`profil.html`).
   - Menghapus percabangan Tier 4 pada Desktop Architectural Tree dan Mobile Vertical Stepper.
2. **5 Posisi Pimpinan Inti Yayasan:**
   - Struktur kepengurusan resmi difokuskan pada 5 posisi inti: Dewan Pembina (DJOKO IRIANDONO), Dewan Pengawas (Suhardi), Ketua Umum (Makhrus), Sekretaris (Candra Gunawan), dan Bendahara (Sri Pragawati).
3. **Fitur Upload & Manajemen Foto Pengurus di Portal Admin (`content.html`):**
   - Membuat kartu manajemen foto & nama untuk ke-5 pengurus dengan circular preview, tombol file picker, tombol hapus foto, serta upload asinkron ke Supabase Storage (`siyayasan-uploads`) dengan fallback Base64 Data URL.
   - Menyimpan URL foto (`pembina_photo`, `pengawas_photo`, `ketua_photo`/`ketua_yayasan_photo`, `sekretaris_photo`, `bendahara_photo`) ke `schools` dan `web_settings` via `api.js`.
4. **Tampilan Dinamis & Monogram Fallback di Profil Publik (`profil.html`):**
   - Menampilkan foto pengurus beresolusi proporsional di tengah kartu pohon organisasi desktop dan thumbnail stepper mobile.
   - Jika foto belum diunggah, otomatis menampilkan monogram inisial nama yang elegan (`DI`, `SH`, `MK`, `CG`, `SP`).
   - Menerapkan instant pre-hydration script di `<head>` membaca `siy_school_ext` untuk mencegah jeda/kedipan gambar (*Zero-FOUC*).
5. **Zero-Regression & Sticky Header Preserved:**
   - Memastikan navigasi website tetap menempel (*sticky*) tanpa ada penambahan `overflow-x: hidden` pada `html, body`. Seluruh modul portal admin, siswa, dan CMS website tetap bekerja normal dan stabil.
6. **Penyempurnaan Hero Headline & Copywriting Beranda (`index.html`):**
   - Mengganti teks pembuka hero lama (*"Membangun Generasi Cerdas..."*) menjadi kalimat penyambut hangat dan langsung: *"Selamat Datang di Website Resmi Yayasan At Tarbiyyah Wijaya Kusuma Samarinda"*.
   - Menyederhanakan sub-judul pengantar menjadi ringkas, profesional, dan padat: *"Pusat sistem informasi daring terpadu untuk layanan PPDB online, administrasi, serta seluruh informasi resmi jenjang PAUD Terpadu, TK, dan TPQ"*.
   - Menghapus badge/kicker pill buatan ("Portal Layanan...") guna mematuhi larangan keras terhadap pola AI-slop, menjaga tipografi tetap bersih, anggun, dan langsung terpusat pada judul penyambut utama.
7. **Fitur Tombol Bantuan WhatsApp Melayang (*Floating WhatsApp Support Button*) (`public-shell.js`):**
   - Menambahkan tombol melayang WhatsApp resmi (`#25D366`, ikon squircle rounded sesuai standar aplikasi WhatsApp) di pojok kanan bawah (`fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50`).
   - Selalu terlihat (*persistent across scroll*) saat pengunjung menjelajahi beranda dan seluruh halaman publik website.
   - Mengarahkan pengunjung secara otomatis ke chat WhatsApp admin resmi yayasan (`081347142829`) dengan teks pembuka ramah seputar bantuan PPDB, administrasi, dan informasi lembaga.
   - Terhubung dinamis dengan sinkronisasi nomor WhatsApp di database (`schools` / `web_settings`).

8. **Rombak Total Struktur Pengurus Yayasan Menjadi Kartu Foto Eksekutif & Sinkronisasi 3 Field Admin (profil.html, content.html, pi.js):**
   - **Halaman Profil Publik (profil.html):**
     - Menghilangkan sepenuhnya format diagram pohon, batang hierarki (stems), garis penghubung, serta stepper vertikal bertingkat.
     - Menghapus badge/kicker buatan (pill badge) 'Tata Kelola Lembaga' guna menjaga estetika bebas AI-slop.
     - Menyusun 5 pimpinan inti yayasan (Pembina, Pengawas, Ketua Yayasan, Sekretaris, Bendahara) dalam bentuk kartu foto eksekutif yang rapi, modern, dan profesional.
     - Menampilkan secara strictly hanya 3 elemen esensial sesuai instruksi pengguna:
       1. **Di atas foto:** Status jabatan yang diemban (dinamis dan editable dari admin, bebas kata berlebihan seperti 'Dewan').
       2. **Tengah:** Foto resmi berbingkai portrait proporsional dengan fallback monogram inisial elegan.
       3. **Di bawah foto:** Nama lengkap pejabat bersangkutan.
     - Meniadakan seluruh sub-deskripsi atau keterangan tambahan yang tidak perlu di luar dari ketiga elemen inti tersebut.
     - Menyediakan pre-hidrasi instan di <head> (milidetik ke-0) agar halaman langsung menampilkan data dan foto terbaru dari database/cache tanpa jeda rendering (Zero FOUC).
   - **Portal Admin Pengaturan Identitas (content.html):**
     - Memperbarui Bagian 5 (Struktur Kepengurusan Organisasi) menjadi kartu manajemen 3 field per orang:
       1. *Jabatan* (input teks fleksibel dan tersinkronisasi)
       2. *Foto Pejabat* (pratinjau instan, unggah ke Supabase Storage, dan tombol hapus)
       3. *Nama Pejabat* (input teks nama lengkap)
     - Menghapus kata-kata berlebihan seperti 'Dewan' sesuai ketetapan pengguna.
   - **Sinkronisasi Data Dua Arah (pi.js):**
     - Memperluas payload schools.update dan web_settings.update untuk menyimpan secara persisten kolom jabatan (pembina_jabatan, pengawas_jabatan, ketua_jabatan, sekretaris_jabatan, endahara_jabatan) bersama foto dan nama pejabat.
     - Terintegrasi penuh ke Supabase dan caching sinkron lintas sesi.

9. **Perbaikan & Optimalisasi Upload/Ganti Foto Pengurus Inti (content.html, pi.js, profil.html):**
   - **Akar Masalah Foto Tidak Bisa Diganti/Diperbarui:**
     1. *Batas Ukuran File (3MB):* Foto kamera smartphone modern umumnya berukuran 3.5MB - 10MB sehingga tertolak otomatis oleh validasi mentah client-side tanpa kompresi.
     2. *Payload Size & Quota Exceeded:* Foto mentah yang dikonversi ke Base64 tanpa kompresi menghasilkan data > 3MB, melampaui batas PostgREST Supabase (HTTP 413) serta kuota browser localStorage (5MB), menyebabkan data baru gagal tersimpan di database dan cache.
     3. *Race Condition:* FileReader async menimpa URL cloud storage, dan klik ulang input file tidak memicu onchange jika file yang dipilih sama.
     4. *Logika Fallback Revert:* Pada schools.get, pengecekan sch[k] === '' memulihkan foto lama (seperti foto nyamuk) dari baris lain secara otomatis.
   - **Solusi Komprehensif yang Diimplementasikan:**
     - **Kompresi Gambar Otomatis Klien (HTML5 Canvas):** Mendukung unggahan file foto hingga 15MB. Foto secara otomatis di-*resize* ke resolusi optimal 600x600 px (JPEG 0.85) dengan ukuran super ringan (~30KB - 60KB), tajam, tanpa lag, dan 100% aman masuk ke database maupun storage.
     - **Feedback Visual & Status Unggah:** Menampilkan indikator status *real-time* (Foto siap disimpan, Mengunggah ke Cloud Storage..., dsb.) serta opsi **Input URL** jika admin ingin menggunakan tautan foto eksternal langsung.
     - **Pemberian Izin Bearer Token Supabase Storage:** Menambahkan token otorisasi admin pada *header* upload Supabase Storage.
     - **Pembersihan Logika Merge pi.js:** Menghapus || sch[k] === '' agar status foto yang dikosongkan/diperbarui tidak ditimpa kembali oleh foto lama.
     - **Perbaikan Pre-Hidrasi profil.html:** Memastikan foto yang dikosongkan otomatis menyembunyikan elemen <img> dan menampilkan inisial monogram tanpa jeda.

10. **Pembersihan Keterangan Usia pada Program PAUD & TPQ (profil.html):**
    - Menghapus teks biru keterangan rentang usia di bawah judul jenjang pada Section Program Pendidikan:
      - Menghapus PAUD: Usia 2 – 4 Tahun • TK (A/B): Usia 4 – 6 Tahun di bawah judul *PAUD & TK Terpadu*.
      - Menghapus Santri Usia 5 – 12 Tahun di bawah judul *Taman Pendidikan Al-Qur'an (TPQ)*.
    - Menjaga tampilan judul dan ikon jenjang pendidikan tetap rapi, simetris, dan bersih sesuai permintaan pengguna.
