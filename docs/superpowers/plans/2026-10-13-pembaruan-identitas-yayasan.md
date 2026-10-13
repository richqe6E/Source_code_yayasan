# Rencana Kerja: Pembaruan Identitas Resmi Yayasan At Tarbiyyah Wijaya Kusuma Samarinda

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Memperbarui seluruh identitas yayasan di seluruh antarmuka website publik, portal sistem (Admin & Siswa), cetakan dokumen resmi dinas, format ekspor Excel, data backend mock, dan logo resmi sesuai data resmi YAYASAN AT TARBIYYAH WIJAYA KUSUMA SAMARINDA.

**Architecture:** Menerapkan strategi pembaruan berjenjang mulai dari aset logo inti, konfigurasi sumber kebenaran backend (`local-api.js` & `seed-data.js`), komponen shell bersama (`public-shell.js` & `shell.js`), halaman publik beserta seksi struktur organisasi baru di `profil.html`, hingga dokumen kop dinas & lembar tanda tangan pengesahan di `reports.html` dan `payments.html`.

**Tech Stack:** HTML5 Semantik, Tailwind CSS, Vanilla JavaScript (ES6+), System.Drawing (Konversi Logo PNG), Node.js dev-server & mock API engine, Automated E2E Test Suite.

**Spec:** Instruksi data pengguna (13 Oktober 2026):
- **Nama:** YAYASAN AT TARBIYYAH WIJAYA KUSUMA SAMARINDA
- **Alamat:** Jl. Wijaya Kusuma V-A No. 38, Kel. Air Putih, Kec. Samarinda Ulu Kota Samarinda, Kalimantan Timur, Kode Pos: 75124
- **Telepon / WhatsApp:** 081347142829
- **Struktur Inti Organisasi:**
  - Pembina: DJOKO IRIANDONO
  - Pengawas: Suhardi
  - Ketua Yayasan: Makhrus
  - Sekretaris: Candra Gunawan
  - Bendahara: Sri Pragawati
- **Logo Resmi:** Berkas gambar logo kubah & bulan sabit hijau diunggah pengguna (`media_1791870726129.jpg`).

---

## Global Constraints

- Semua teks nama yayasan, alamat, nomor telepon, dan nama struktur pengurus harus menggunakan data resmi di atas secara presisi tanpa salah ketik.
- Desain antarmuka tetap mematuhi prinsip anti-AI-slop: tipografi bersih, layout bento berwibawa, dan kontras tinggi.
- Seluruh 38 rute sistem wajib tetap berstatus HTTP 200 OK.
- Seluruh automated test suite (34/34 pengujian fitur) wajib tetap 100% lulus (zero regression).

## Review Focus

1. **Konsistensi Nama & Alamat:** Tidak boleh ada teks lama ("Yayasan Samarinda" generik atau alamat Polnes) yang tertinggal di website publik, portal, footer, atau kop cetak.
2. **Kualitas & Ketajaman Logo:** Logo baru harus tampil proporsional, tajam, dan tidak terdistorsi di header navbar desktop, mobile drawer, footer, halaman login SIAKAD, dan kop cetak laporan.
3. **Seksi Struktur Organisasi di Halaman Profil:** 5 figur pimpinan (Pembina, Pengawas, Ketua, Sekretaris, Bendahara) harus disajikan dalam layout grid kartu yang profesional dan elegan di `profil.html`.
4. **Legitimasi Kop Surat & Lembar Tanda Tangan Cetak:** Dokumen rekapitulasi `reports.html` dan tanda bukti bayar `payments.html` harus menampilkan nama resmi Ketua Yayasan (Makhrus) dan Bendahara (Sri Pragawati) di lembar pengesahan dinas dan file ekspor Excel (`.xls`).
5. **Aksesibilitas Link WhatsApp & Maps:** Tautan WhatsApp resmi harus mengarah ke `https://wa.me/6281347142829` dan link Google Maps serta embed iframe harus menunjukkan alamat Jalan Wijaya Kusuma V-A Samarinda Ulu.

---

### Task 1: Pemrosesan & Pembaruan Aset Logo Resmi Yayasan

**Files:**
- Source: `C:\Users\MSi-Modern\.gemini\antigravity-ide\brain\1ed495cd-b7b7-464e-8a11-3c49f81146be\.user_uploaded\media_1791870726129.jpg`
- Modify / Replace: `d:\Source_code_yayasan\frontend\public\images\logo.png`
- Modify / Replace: `d:\Source_code_yayasan\frontend\shared\images\logo.png`

**Interfaces:**
- Consumes: Berkas gambar JPEG logo baru dari pengguna.
- Produces: Berkas `logo.png` beresolusi tinggi di direktori public dan shared images.

- [ ] **Step 1: Konversi dan simpan berkas logo ke PNG**
  Gunakan PowerShell System.Drawing untuk membaca `media_1791870726129.jpg` dan menyimpannya sebagai format PNG murni berkualitas tinggi ke `frontend/public/images/logo.png` dan `frontend/shared/images/logo.png`.

- [ ] **Step 2: Verifikasi eksistensi dan integritas berkas logo**
  Pastikan kedua berkas `logo.png` berukuran valid (>50KB) dan dapat dimuat oleh dev server pada `http://localhost:3000/images/logo.png`.

- [ ] **Step 3: Commit perubahan aset logo**
  ```bash
  git add frontend/public/images/logo.png frontend/shared/images/logo.png
  git commit -m "feat(branding): perbarui aset logo resmi Yayasan At Tarbiyyah Wijaya Kusuma"
  ```

---

### Task 2: Pembaruan Data Sumber Kebenaran Backend & Konfigurasi Default

**Files:**
- Modify: `d:\Source_code_yayasan\frontend\local-api.js`
- Modify: `d:\Source_code_yayasan\frontend\seed-data.js`

**Interfaces:**
- Consumes: Data teks identitas dan struktur yayasan dari pengguna.
- Produces: State awal `DB.school_profile` dan `DB.web_settings` dengan data resmi terbaru.

- [ ] **Step 1: Perbarui data default di `local-api.js`**
  Ubah nilai `school_profile` dan `DEFAULT_SETTINGS` pada `local-api.js`:
  - `name` / `school_name`: `'YAYASAN AT TARBIYYAH WIJAYA KUSUMA SAMARINDA'`
  - `address`: `'Jl. Wijaya Kusuma V-A No. 38, Kel. Air Putih, Kec. Samarinda Ulu Kota Samarinda, Kalimantan Timur, Kode Pos: 75124'`
  - `campus_note`: `'Kampus Utama Air Putih, Samarinda Ulu'`
  - `phone`: `'081347142829'`
  - `whatsapp` / `whatsapp_number` / `whatsapp_official`: `'081347142829'`
  - `email` / `contact_email`: `'info@attarbiyyah-samarinda.sch.id'`
  - `maps_url`: `'https://maps.google.com/?q=Jl.+Wijaya+Kusuma+V-A+No.+38,+Air+Putih,+Samarinda+Ulu,+Kota+Samarinda,+Kalimantan+Timur+75124'`
  - `maps_embed_url`: Embed iframe Google Maps dengan query lokasi alamat baru.
  - Struktur pimpinan: `headmaster_name`: `'Makhrus'`, `ketua_yayasan`: `'Makhrus'`, `bendahara`: `'Sri Pragawati'`, `sekretaris`: `'Candra Gunawan'`, `pembina`: `'DJOKO IRIANDONO'`, `pengawas`: `'Suhardi'`.

- [ ] **Step 2: Perbarui data guru dan user profile di `seed-data.js` jika ada referensi sekolah**
  Pastikan email dan organisasi pada `seed-data.js` selaras dengan domain `attarbiyyah-samarinda.sch.id`.

- [ ] **Step 3: Uji response API `schools/get` dan `web_settings/get`**
  Jalankan curl/node script untuk memastikan endpoint mengembalikan data baru dengan status success.

- [ ] **Step 4: Commit pembaruan backend data**
  ```bash
  git add frontend/local-api.js frontend/seed-data.js
  git commit -m "feat(api): sinkronkan profil yayasan dan struktur pimpinan di local backend"
  ```

---

### Task 3: Pembaruan Header & Footer Terpadu Publik & Shell Portal

**Files:**
- Modify: `d:\Source_code_yayasan\frontend\public\js\public-shell.js`
- Modify: `d:\Source_code_yayasan\frontend\shared\js\shell.js`

**Interfaces:**
- Consumes: Komponen shell situs publik dan portal SIAKAD.
- Produces: Header sticky, drawer navigasi, topbar kontak, footer dengan alamat & nomor HP baru, dan sidebar portal yang konsisten.

- [ ] **Step 1: Perbarui data fallback di `public-shell.js`**
  - Topbar kontak: Telepon `081347142829`, WhatsApp `081347142829`.
  - Brand header: Nama `YAYASAN AT TARBIYYAH WIJAYA KUSUMA SAMARINDA` (label tampilan: `Yayasan At Tarbiyyah` dengan sublabel `Wijaya Kusuma Samarinda`).
  - Footer: Nama lengkap yayasan, alamat `Jl. Wijaya Kusuma V-A No. 38, Kel. Air Putih, Kec. Samarinda Ulu, Samarinda`, telepon `081347142829`, tautan WhatsApp ke `https://wa.me/6281347142829`, dan link Google Maps ke alamat baru.
  - Sinkronisasi fungsi `applySchoolData()`.

- [ ] **Step 2: Perbarui judul dan nama brand di `shell.js`**
  - Ganti default `'Yayasan Samarinda'` menjadi `'Yayasan At Tarbiyyah Wijaya Kusuma'` di header mobile, sidebar mobile, dan sidebar desktop portal.

- [ ] **Step 3: Verifikasi responsivitas header dan footer**
  Pastikan nama yayasan yang lebih panjang tidak menyebabkan teks meluap (*overflow*) atau merusak layout di resolusi HP (390px) maupun Laptop (1280px).

- [ ] **Step 4: Commit pembaruan shell**
  ```bash
  git add frontend/public/js/public-shell.js frontend/shared/js/shell.js
  git commit -m "feat(ui): perbarui nama yayasan, kontak, dan footer pada komponen shell terpadu"
  ```

---

### Task 4: Pembaruan Halaman Publik Inti & Seksi Struktur Inti Organisasi

**Files:**
- Modify: `d:\Source_code_yayasan\frontend\public\index.html`
- Modify: `d:\Source_code_yayasan\frontend\public\profil.html`
- Modify: `d:\Source_code_yayasan\frontend\public\kontak.html`

**Interfaces:**
- Consumes: Metadata dan teks pada landing page, profil, dan kontak.
- Produces: Halaman publik dengan identitas baru dan seksi struktur kepengurusan interaktif.

- [ ] **Step 1: Perbarui Beranda (`index.html`)**
  - Update tag `<title>` dan `<meta name="description">`.
  - Sesuaikan teks pengantar yayasan di section Program Pendidikan.

- [ ] **Step 2: Tambahkan Seksi Struktur Inti Yayasan di Halaman Profil (`profil.html`)**
  - Update header hero menjadi: `Profil Yayasan At Tarbiyyah Wijaya Kusuma Samarinda`.
  - Tambahkan seksi baru yang didesain elegan dan berwibawa: **"Struktur Kepengurusan Yayasan"**:
    - **Dewan Pembina:** DJOKO IRIANDONO
    - **Dewan Pengawas:** Suhardi
    - **Ketua Yayasan:** Makhrus
    - **Sekretaris:** Candra Gunawan
    - **Bendahara:** Sri Pragawati
  - Gunakan kartu beraksen bersih, border halus, ikon hierarki kepemimpinan dinas, dan tipografi tegas anti-AI-slop.

- [ ] **Step 3: Perbarui Halaman Kontak (`kontak.html`)**
  - Alamat: `Jl. Wijaya Kusuma V-A No. 38, Kel. Air Putih, Kec. Samarinda Ulu Kota Samarinda, Kalimantan Timur, Kode Pos: 75124`.
  - Keterangan Kampus: `Kampus Utama Air Putih, Samarinda Ulu`.
  - Nomor Telepon & WhatsApp: `081347142829`.
  - Peta Google Maps Iframe: Update ke sematan peta lokasi Jalan Wijaya Kusuma V-A, Air Putih, Samarinda Ulu.
  - Tautan tombol "Buka di Google Maps" dan "Petunjuk Arah (GPS)" ke alamat baru.

- [ ] **Step 4: Commit pembaruan halaman publik inti**
  ```bash
  git add frontend/public/index.html frontend/public/profil.html frontend/public/kontak.html
  git commit -m "feat(pages): tambahkan struktur kepengurusan di profil dan perbarui kontak yayasan"
  ```

---

### Task 5: Pembaruan Halaman Pendukung, PPDB & Autentikasi

**Files:**
- Modify: `d:\Source_code_yayasan\frontend\public\ppdb.html`
- Modify: `d:\Source_code_yayasan\frontend\public\ppdb\status.html`
- Modify: `d:\Source_code_yayasan\frontend\public\login.html`
- Modify: `d:\Source_code_yayasan\frontend\public\berita.html` & `berita/detail.html`
- Modify: `d:\Source_code_yayasan\frontend\public\pengumuman.html`
- Modify: `d:\Source_code_yayasan\frontend\public\agenda.html`
- Modify: `d:\Source_code_yayasan\frontend\public\galeri.html`

**Interfaces:**
- Consumes: Teks pendaftaran, cek status penerimaan, dan login SIAKAD.
- Produces: Bukti pendaftaran resmi, surat pengumuman ber-kop nama baru, dan form login terselaraskan.

- [ ] **Step 1: Perbarui Bukti Pendaftaran & Pengumuman Seleksi PPDB (`ppdb.html` & `ppdb/status.html`)**
  - Kop surat cetak: `YAYASAN AT TARBIYYAH WIJAYA KUSUMA SAMARINDA`.
  - Nomor WhatsApp resmi verifikasi pendaftaran: `081347142829`.
  - Format pesan WhatsApp konfirmasi registrasi diperbarui menyebut nama yayasan resmi.
  - Tanda tangan surat pengumuman penerimaan: `Panitia PPDB Yayasan At Tarbiyyah Wijaya Kusuma`.

- [ ] **Step 2: Perbarui Halaman Login SIAKAD (`login.html`)**
  - Title, meta description, dan teks header brand pada kartu login.
  - Modal bantuan WhatsApp diselaraskan ke nomor `081347142829`.

- [ ] **Step 3: Perbarui Title & Meta Tags pada Berita, Pengumuman, Agenda, Galeri**
  - Standarisasi seluruh title menjadi `<Nama Halaman> - Yayasan At Tarbiyyah Wijaya Kusuma Samarinda`.

- [ ] **Step 4: Commit pembaruan halaman pendukung**
  ```bash
  git add frontend/public/ppdb.html frontend/public/ppdb/status.html frontend/public/login.html frontend/public/berita.html frontend/public/berita/detail.html frontend/public/pengumuman.html frontend/public/agenda.html frontend/public/galeri.html
  git commit -m "feat(ppdb): selaraskan identitas yayasan pada PPDB online, surat tanda terima, dan login"
  ```

---

### Task 6: Pembaruan CMS Pengaturan & Dokumen Cetak/Excel Portal Admin

**Files:**
- Modify: `d:\Source_code_yayasan\frontend\portal\admin\cms_setting.html`
- Modify: `d:\Source_code_yayasan\frontend\portal\admin\content.html`
- Modify: `d:\Source_code_yayasan\frontend\portal\admin\reports.html`
- Modify: `d:\Source_code_yayasan\frontend\portal\admin\payments.html`

**Interfaces:**
- Consumes: Form pengaturan website, dokumen cetak laporan, dan kuitansi SPP.
- Produces: Fitur CMS sinkron dengan alamat baru, Kop Cetak berstandar dinas dengan nama Ketua Yayasan (Makhrus) & Bendahara (Sri Pragawati), serta file Excel (.xls) berpenandatangan resmi.

- [ ] **Step 1: Perbarui `cms_setting.html` & `content.html`**
  - Default input form memuat nama yayasan baru, alamat Jl. Wijaya Kusuma V-A No. 38, nomor WA/telepon 081347142829.
  - Tombol reset lokasi maps: "Reset ke Lokasi Kampus Wijaya Kusuma" yang memuat koordinat / link Maps Air Putih Samarinda Ulu.

- [ ] **Step 2: Perbarui Kop Cetak & Pengesahan Dokumen di `reports.html`**
  - Kop Surat Cetak Dokumen:
    - Nama: `YAYASAN AT TARBIYYAH WIJAYA KUSUMA SAMARINDA`
    - Subtitle: `PENDIDIKAN ANAK USIA DINI (PAUD) & TK TERPADU - TPQ ULINNUHA`
    - Alamat: `Jl. Wijaya Kusuma V-A No. 38, Kel. Air Putih, Kec. Samarinda Ulu, Kota Samarinda`
    - Kontak: `Telepon/WhatsApp: 081347142829 | Email: info@attarbiyyah-samarinda.sch.id`
  - Lembar Pengesahan Tanda Tangan:
    - Pihak 1 (Kiri): Mengetahui, **Ketua Yayasan / Kepala Sekolah**: `( Makhrus )`
    - Pihak 2 (Kanan): **Petugas Tata Usaha / Bendahara**: `( Sri Pragawati )`
  - Template ekspor Microsoft Excel (`.xls`):
    - Selaraskan kop surat Excel dan nama penandatangan Makhrus & Sri Pragawati.

- [ ] **Step 3: Perbarui Kuitansi SPP di `payments.html`**
  - Tanda tangan kuitansi mengetahui: `Ketua Yayasan: Makhrus` dan `Kasir / Bendahara: Sri Pragawati`.

- [ ] **Step 4: Commit pembaruan dokumen admin**
  ```bash
  git add frontend/portal/admin/cms_setting.html frontend/portal/admin/content.html frontend/portal/admin/reports.html frontend/portal/admin/payments.html
  git commit -m "feat(reports): sematkan nama Ketua Yayasan Makhrus & Bendahara Sri Pragawati pada cetak dinas & Excel"
  ```

---

### Task 7: Uji Regresi Menyeluruh & Verifikasi Kualitas

**Files:**
- Test: `d:\Source_code_yayasan\frontend\audit-all-features.js`
- Test: `d:\Source_code_yayasan\frontend\test-cms-e2e.js`
- Test: `d:\Source_code_yayasan\frontend\test-ppdb-e2e.js`
- Test: `d:\Source_code_yayasan\frontend\test-spp-e2e.js`
- Test: `d:\Source_code_yayasan\frontend\test-routes.js`
- Update: `d:\Source_code_yayasan\PROJECT_STATUS.md`
- Update: `d:\Source_code_yayasan\HANDOVER.md`

**Interfaces:**
- Consumes: Seluruh endpoint, rute, dan fitur yang telah diperbarui.
- Produces: Bukti hasil pengujian 100% lulus dan catatan dokumentasi mutakhir.

- [ ] **Step 1: Jalankan Automated Test Suite**
  - `node frontend/test-routes.js` -> Seluruh rute wajib HTTP 200 OK.
  - `node frontend/test-cms-e2e.js` -> 17/17 PASS.
  - `node frontend/test-ppdb-e2e.js` -> 11/11 PASS.
  - `node frontend/test-spp-e2e.js` -> 13/13 PASS.
  - `node frontend/audit-all-features.js` -> 34/34 PASS.

- [ ] **Step 2: Inspeksi Visual Peramban (Headless/Localhost)**
  - Verifikasi tampilan logo baru di desktop & mobile navbar.
  - Verifikasi seksi struktur kepengurusan di `profil.html`.
  - Verifikasi alamat baru dan kartu peta di `kontak.html`.
  - Verifikasi tampilan cetak kop surat di `reports.html`.

- [ ] **Step 3: Perbarui `PROJECT_STATUS.md` dan `HANDOVER.md`**
  - Dokumentasikan pembaruan Sesi 27: Transformasi Identitas Resmi Yayasan At Tarbiyyah Wijaya Kusuma Samarinda, Struktur Kepengurusan, dan Integrasi Logo Baru.

- [ ] **Step 4: Commit & Sinkronisasi Repositori**
  ```bash
  git add PROJECT_STATUS.md HANDOVER.md
  git commit -m "docs: catat pembaruan identitas resmi yayasan dan hasil verifikasi pada Sesi 27"
  ```
