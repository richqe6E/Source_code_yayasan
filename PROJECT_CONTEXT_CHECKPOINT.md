# 📌 DOKUMEN KONTEKS & CHECKPOINT RESMI PROYEK SIYAYASAN V2
**Terakhir Diperbarui:** 19 Oktober 2026 (Sesi 44 — Finalisasi Operasional Live Production Vercel & Supabase Cloud: Integrasi Penuh Portal Admin, Portal Siswa & Website Utama)  
**Status Sistem:** ✅ Production & Database 100% Operasional, Live Verified (`https://siyayasan-portal.vercel.app` & Supabase Cloud).  
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

## 🛠️ 3. Riwayat Remediasi & Pembaruan Sistem Terbaru (Sesi 43 & Sesi 44)

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

---

## 📊 4. Hasil Uji Otomatis & Status Operasional
Semua test suite dan verifikasi live berjalan **100% LULUS**:
- `tests/test-predeploy-remediation.js`: **LULUS 100%** (12/12 pengujian regresi menyeluruh pra-deploy & pasca-deploy)
- `PANDUAN_PENGUJIAN_MENYELURUH_E2E.md`: Tersedia di root direktori untuk panduan pengujian simulasi dari awal hingga akhir (Pengunjung Umum, Pendaftar PPDB, Admin/Staf TU, dan Siswa Aktif).
- **Supabase Cloud Live (`https://hnkxrbmngmveoxipohtk.supabase.co`):** 100% Aktif & Terverifikasi.
- **Vercel Production (`https://siyayasan-portal.vercel.app`):** 100% Aktif (`READY` — Deployment `dpl_JAqeMH6KfuQNzQSJsRPutKUzJPrb`).

---

## 🚀 5. Cara Menjalankan & Menguji Sistem
1. **Akses Daring (Production Live):**
   - URL Utama: `https://siyayasan-portal.vercel.app`
2. **Akses Lokal (Pengembangan):**
   ```bash
   node frontend/dev-server.js
   ```
   Buka peramban: `http://localhost:3000`
3. **Kredensial Akun Login Resmi:**
   - **Super Admin (Tab Staf / Admin):** `admin@yayasan.sch.id` (Password sesuai yang diatur Admin di Manajemen Akun)
   - **Admin TU (Tab Staf / Admin):** `tu@yayasan.sch.id` | Password: `tu123456`
   - **Siswa Aktif (Tab Portal Siswa):** NIS `2026001` | Password: `2020-03-12`

---

## 🗺️ 6. Panduan Wajib untuk Sesi Mendatang
1. **Konteks Tunggal:** Selalu baca `PROJECT_CONTEXT_CHECKPOINT.md` dan `PROJECT_STATUS.md` di awal sesi.
2. **Jangan Gunakan Sistem Lama:** Abaikan dan jangan pernah mengaktifkan kembali sistem/kode lama (Google Apps Script, Portal Guru, Portal Orang Tua, Password Guru, atau field database fiktif seperti `role_id` pada tabel `users`).
3. **Pertahankan Sistem Baru:** Seluruh alur kerja menggunakan `frontend/shared/js/api.js` yang terhubung langsung ke Supabase REST & Storage API serta ter-deploy di Vercel (`https://siyayasan-portal.vercel.app`).

