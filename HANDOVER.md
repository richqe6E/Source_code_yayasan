# 📦 DOKUMEN HANDOVER & STATUS SISTEM — SIYAYASAN V2

> **PANDUAN RESMI UNTUK PENGEMBANGAN BESOK & SINGLE SOURCE OF TRUTH**  
> Terakhir Diperbarui: **11 Oktober 2026 (Malam)**  
> Repositori GitHub: [https://github.com/richqe6E/Source_code_yayasan](https://github.com/richqe6E/Source_code_yayasan) (Branch `main`)  
> Status Sistem: **✅ 100% PRODUCTION READY & LULUS PENGUJIAN END-TO-END MENYELURUH**

---

## 1. 🌐 Teknologi & Arsitektur yang Digunakan

Proyek **SIYAYASAN V2** (Sistem Informasi Manajemen Sekolah & Yayasan Samarinda) dibangun dengan arsitektur **Hybrid Cloud & Local First** yang dirancang ringan, cepat, tanpa dependensi build kompleks yang rentan error:

### A. Frontend (Antarmuka Pengguna):
- **Core:** HTML5 Semantik berstandar W3C.
- **Styling:** Vanilla CSS + Tailwind CSS (via CDN) dengan palet warna terkurasi *Oceanic Blue* (`primary-600: #0284C7`), bebas dari styling bertabrakan (*anti-AI slop*).
- **Logika Aplikasi:** Vanilla JavaScript (ES6+ Native Modern) tanpa framework berat (React/Vue/Webpack) agar mudah dipelihara, cepat dimuat di mobile/desktop, dan kompatibel langsung di browser.
- **Tipografi:** Google Fonts *Inter* & *Cinzel/Lora/Serif* untuk dokumen dinas.
- **Ikonografi & Animasi:** Vektor SVG Inline berpresisi tinggi & Lottie Vector Player.
- **Dua Portal Resmi:**
  1. **Portal Admin Sekolah** (`frontend/portal/admin/`): Manajemen Pengguna, Guru, Kelas, Siswa, PPDB, Pembayaran SPP, CMS Konten, Laporan & Rekapitulasi, Backup Database, dan Pengaturan Web.
  2. **Portal Siswa** (`frontend/portal/siswa/`): Dashboard Siswa Mandiri, Biodata, Akademik/Rapor 6 Aspek, Tagihan & Konfirmasi Pembayaran SPP, dan Dokumen Berkas.
  *(Catatan: Portal Guru & Ortu diarsipkan permanen di `.legacy_backup/` sesuai kesepakatan final ruang lingkup 2 portal).*

### B. Backend & Data Integration:
- **Local Dev Server:** Node.js HTTP Server (`frontend/dev-server.js`) pada port `3000` yang menangani static asset serving, MIME types, CORS headers, API routing, dan graceful error handling.
- **Local Mock API:** `frontend/local-api.js` mengimplementasikan 100% kontrak endpoint backend (Auth, PPDB, Siswa, SPP, CMS, Laporan, Backup) sehingga aplikasi dapat diuji dan dijalankan secara mandiri secara offline.
- **Cloud Database Backend:** Supabase (PostgreSQL & PostgREST API) terintegrasi via `frontend/shared/js/api.js` dan skrip DDL `database/MASTER_SUPABASE_SETUP_V2.sql`.
- **Sistem Keamanan:** *Role-Based Access Control (RBAC)* dengan verifikasi sesi token di `frontend/shared/js/auth.js`.

### C. Spreadsheet & Dokumen Engine:
- **Excel Generation:** Microsoft Office XML & HTML Spreadsheet (`.xls`) dengan native `<x:DisplayGridlines/>` dan formatting CSS `mso-number-format: "\@"` untuk melindungi integritas nomor HP dan NIS.
- **CSV Engine:** UTF-8 BOM (`\uFEFF`) + header pembatas `sep=,` untuk kompatibilitas Windows Excel Indonesia.
- **Print Engine:** CSS `@media print` A4 Portrait dengan Kop Dinas Pendidikan resmi, garis pembatas ganda, dan lembar pengesahan tanda tangan.

---

## 2. 🚀 Rangkuman Perkembangan yang Diselesaikan Malam Ini

Dalam sesi pengembangan malam ini (11 Oktober 2026), seluruh poin permintaan dan penyempurnaan sistem telah diselesaikan 100% tanpa menyisakan bug:

### 1. Audit Menyeluruh & Uji End-to-End Seluruh Fitur (100% Pass)
- Dilakukan audit komprehensif pada: upload berkas, unggah foto, pembaruan PPDB (alur submit -> verifikasi approved -> convert otomatis terbit NIS), pembayaran SPP (unggah bukti bayar -> antrean verifikasi -> approved lunas), dan login portal.
- Dibuat dan dijalankan 3 suite pengujian E2E otomatis:
  - `test-cms-e2e.js`: **17/17 (100%) Lulus**.
  - `test-ppdb-e2e.js`: **11/11 (100%) Lulus**.
  - `test-spp-e2e.js`: **13/13 (100%) Lulus**.

### 2. Perbaikan CMS Banner & Web (`cms_setting.html` & `content.html`)
- **Masalah Sebelumnya:** Tidak ada batas tegas antara upload file dari galeri vs tautan URL eksternal, berpotensi membingungkan admin dan memicu bug input tumpang tindih.
- **Solusi yang Diterapkan:**
  - Ditambahkan **segmented tab selector** tegas: **"Unggah Berkas Gambar"** vs **"Gunakan Link URL Gambar"**.
  - Mekanisme *Mutual Exclusion*: Jika memilih link URL, form unggah file dan preview berkas lokal otomatis dibersihkan/dikosongkan. Sebaliknya, jika memilih upload file, input teks link dinonaktifkan/dibersihkan.
  - Ditambahkan live image preview dan validasi tipe berkas (JPG/PNG/WEBP maks 2MB).

### 3. Perombakan Sistem Backup & Restore Database (`backup.html`)
- **Masalah Sebelumnya:** Tombol dan aksi kurang jelas manfaatnya, tidak memberikan umpan balik visual saat ditekan.
- **Solusi yang Diterapkan:**
  - **Pembuatan Cadangan Real-Time:** Tombol *"Buat Backup Baru Sekarang"* mengompilasi snapshot database lengkap (Siswa, Kelas, Guru, Tagihan SPP, PPDB, Berita, Galeri, Pengaturan Sekolah).
  - **Aksi Cadangan Jelas:**
    - Tombol **Unduh JSON Snapshot** untuk menyimpan berkas backup ke komputer admin.
    - Tombol **Pulihkan (Restore)** dengan modal konfirmasi keamanan dan visual loader.
    - Tombol **Hapus Cadangan** untuk mengelola riwayat backup.
  - **Fitur Unggah File Backup Eksternal:** Admin dapat mengunggah berkas `.json` dari komputer luar untuk memulihkan database kapan saja.

### 4. Fitur Unggah / Import Rekap Data Spreadsheet (`reports.html`)
- Menambahkan modal dan handler **Unggah / Import Excel (CSV)** langsung ke database yayasan untuk:
  - **Tagihan SPP Massal** (NIS, Nama Siswa, Keterangan, Nominal, Jatuh Tempo).
  - **Data Siswa Baru Massal** (NIS, Nama, Kelas, Jenis Kelamin, Nama Wali, No HP).
- Dilengkapi template helper unduh format CSV contoh yang benar, validasi baris, dan tabel pratinjau data sebelum disimpan ke database.

### 5. Restorasi Desain UI/UX Laporan ke Standar Profesional
- Mengembalikan desain kartu filter rekapan ke tampilan elegan, rapi, dan konsisten (border lembut `border-gray-200`, tombol seragam `bg-primary-600`, input parameter Bulan, Semester, dan Tahun Ajaran).
- Menghapus elemen warna bertabrakan (*anti-AI slop*).

### 6. Desain Layout Cetak Resmi Berstandar Pendidikan
- `@media print` diperbarui untuk mencetak khusus data rekapan (menyembunyikan sidebar, navbar, kartu filter, tombol aksi).
- Memuat **Kop Surat Resmi Yayasan** (Nama Yayasan, Unit PAUD & TK Terpadu - TPQ Ulinnuha, Alamat, Telepon, WhatsApp, Email, dan Logo).
- Garis ganda dinas pembatas kop.
- Lembar pengesahan tanda tangan resmi (*Ketua Yayasan / Kepala Sekolah* dan *Petugas Tata Usaha / Bendahara* lengkap dengan nama admin yang login secara dinamis).

### 7. Peningkatan Format Hasil Rekap di Excel (`.xls`)
- Menggantikan ekspor CSV polos menjadi berkas **Microsoft Excel Spreadsheet (`.xls`)**:
  - Memuat Kop Surat Resmi di baris atas lembar kerja (*merged cells*).
  - Mengaktifkan `<x:DisplayGridlines/>` sehingga seluruh garis tabel langsung tampil tajam dan tegas.
  - Header kolom berwarna `#0284C7` dengan font putih tebal.
  - Kolom **NIS** dan **Nomor HP** dilindungi dengan styling `mso-number-format: "\@"` agar **angka 0 di awal (misal `0812...` atau `0012`) tidak terpotong atau berubah menjadi format eksponensial ilmiah**.
  - Kolom nominal diformat rapi rata kanan, kolom status diberi aksen warna lembut.
  - Baris ringkasan total (Total Data / Total Nominal).
  - Lembar tanda tangan dinas di bagian bawah spreadsheet.
  - Opsi CSV tetap disediakan dengan pengaman pemisah kolom `sep=,`.

---

## 3. 🔑 Kredensial Akun Pengujian Resmi

| Peran (Role) | Identitas (Email / NIS) | Password | URL Akses |
|---|---|---|---|
| **Super Admin** | `admin@yayasan.sch.id` | `admin123` | `http://localhost:3000/admin/dashboard.html` |
| **Admin TU** | `tu@yayasan.sch.id` | `tu123456` | `http://localhost:3000/admin/dashboard.html` |
| **Siswa Aktif (Demo 1)** | `2026001` (NIS) | `2020-03-12` (Tgl Lahir) | `http://localhost:3000/siswa/dashboard.html` |
| **Siswa Aktif (Demo 2)** | `2026002` (NIS) | `2019-08-25` (Tgl Lahir) | `http://localhost:3000/siswa/dashboard.html` |

---

## 4. 💻 Cara Menjalankan & Melanjutkan Pekerjaan Besok

Untuk memulai kembali sesi besok tanpa kehilangan konfigurasi:

```powershell
# 1. Buka folder kerja proyek
cd "d:\Source_code_yayasan"

# 2. Jalankan server lokal
node frontend/dev-server.js

# 3. Buka browser pada URL:
# Website Publik       : http://localhost:3000
# Portal Login SIAKAD  : http://localhost:3000/login.html
# Portal Admin         : http://localhost:3000/admin/dashboard.html
# Rekapitulasi Data    : http://localhost:3000/admin/reports.html
# Backup & Restore     : http://localhost:3000/admin/backup.html
# CMS Banner & Web     : http://localhost:3000/admin/cms_setting.html
# Portal Siswa         : http://localhost:3000/siswa/dashboard.html

# 4. Jalankan pengujian otomatis untuk verifikasi cepat:
node frontend/test-cms-e2e.js
node frontend/test-ppdb-e2e.js
node frontend/test-spp-e2e.js
```

---
*Catatan Akhir: Seluruh modifikasi kode telah disimpan, diuji, dan diselaraskan ke dalam repositori. Konteks kerja malam ini tersimpan utuh dan siap dilanjutkan besok.*