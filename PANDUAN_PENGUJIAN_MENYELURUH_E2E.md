# PANDUAN & INSTRUKSI PENGUJIAN SIMULASI MENYELURUH (END-TO-END / UAT)
**Sistem Informasi & Portal Terpadu — Yayasan At Tarbiyyah Wijaya Kusuma Samarinda**  
**URL Produksi (Vercel):** `https://siyayasan-portal.vercel.app`  
**URL Lokal (Dev Server):** `http://localhost:5000`

---

## Daftar Isi
1. [Persiapan & Data Akun Pengujian](#1-persiapan--data-akun-pengujian)
2. [Skenario 1: Simulasi Pengunjung Umum (Website Publik)](#2-skenario-1-simulasi-pengunjung-umum-website-publik)
3. [Skenario 2: Simulasi Calon Siswa Baru (Pendaftaran PPDB & Portal Calon Siswa)](#3-skenario-2-simulasi-calon-siswa-baru-pendaftaran-ppdb--portal-calon-siswa)
4. [Skenario 3: Simulasi Admin Yayasan / Tata Usaha (12 Modul Portal Admin)](#4-skenario-3-simulasi-admin-yayasan--tata-usaha-12-modul-portal-admin)
5. [Skenario 4: Simulasi Siswa Aktif / Wali Santri (Portal Siswa Aktif & SPP)](#5-skenario-4-simulasi-siswa-aktif--wali-santri-portal-siswa-aktif--spp)
6. [Skenario 5: Pengujian Integrasi Lintas Perangkat (Cross-Device CMS Sync)](#6-skenario-5-pengujian-integrasi-lintas-perangkat-cross-device-cms-sync)
7. [Panduan Pengujian Otomatis (Browser Console & CLI Test Runner)](#7-panduan-pengujian-otomatis-browser-console--cli-test-runner)
8. [Lembar Checklist UAT (User Acceptance Testing)](#8-lembar-checklist-uat-user-acceptance-testing)

---

## 1. Persiapan & Data Akun Pengujian

Sebelum memulai simulasi dari awal hingga akhir, siapkan:
- **Browser Utama** (Chrome / Edge) untuk berperan sebagai **Pengunjung Umum & Calon Siswa / Siswa Aktif**.
- **Jendela Incognito / Private Window** (atau browser kedua) untuk berperan sebagai **Admin Yayasan**, sehingga sesi login Admin dan Siswa tidak saling menimpa di `localStorage`.
- **3 File Gambar Dummy** (`JPG`/`PNG`, ukuran `< 2 MB`) di komputer Anda untuk simulasi unggah:
  1. `pas_foto_dummy.jpg` (Simulasi Pas Foto 3x4)
  2. `akta_dummy.jpg` (Simulasi Akta Kelahiran)
  3. `kk_dummy.jpg` (Simulasi Kartu Keluarga & Bukti Transfer SPP)

### Daftar Akun Default (Bawaan Database)
| Peran | Halaman Login | Email / Username / NIS | Password Default |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `/login.html` | `admin@yayasan.sch.id` | `admin123` *(atau password baru yang Anda ubah)* |
| **Admin Tata Usaha** | `/login.html` | `tu@yayasan.sch.id` | `tu123` |
| **Calon Siswa (Hasil Simulasi)** | `/login.html` | Email Wali / No. Registrasi (`REG-2026-XXXX`) | Password yang dibuat saat daftar PPDB |
| **Siswa Aktif (Hasil Konversi)** | `/login.html` | NIS Siswa (`2026XXXX`) atau Email Wali | Password PPDB atau Tanggal Lahir (`DDMMYYYY`) |

---

## 2. Skenario 1: Simulasi Pengunjung Umum (Website Publik)

**Tujuan:** Memastikan seluruh halaman informasi publik tampil rapi, responsif, tanpa error konsol (`F12 -> Console`), dan memuat data langsung dari database Supabase.

### Langkah-Langkah Pengujian Manual:
1. **Beranda Utama (`/index.html`)**
   - Buka `https://siyayasan-portal.vercel.app/`.
   - **Yang Diperiksa:**
     - Hero Carousel tampil dengan judul, subjudul, dan tombol CTA **"Daftar PPDB Sekarang"**.
     - Bagian **Program Pendidikan** (KB, TK, TPQ) menampilkan deskripsi yang sesuai.
     - Bagian **Berita Terbaru**, **Pengumuman**, **Agenda Kegiatan**, dan **Galeri Foto** memuat kartu konten (bukan teks *loading* yang macet).
     - Header dan Footer menampilkan nama yayasan, alamat, jam operasional, nomor telepon/WhatsApp, dan tautan media sosial yang benar.

2. **Profil Yayasan (`/profil.html`)**
   - Klik menu **Profil** di navigasi atas.
   - **Yang Diperiksa:**
     - Sejarah Singkat, Visi, Misi, dan Budaya Sekolah tampil lengkap.
     - Detail **Program Pendidikan** & **Kurikulum** tampil sesuai pengaturan CMS.
     - **Struktur Organisasi Yayasan** (Pembina, Pengawas, Ketua Yayasan, Sekretaris, Bendahara, Kepala Sekolah) dan daftar **Tenaga Pendidik (Guru/Ustadz)** tampil dari database.

3. **Berita (`/berita.html`), Pengumuman (`/pengumuman.html`), Agenda (`/agenda.html`), & Galeri (`/galeri.html`)**
   - Buka masing-masing menu secara berurutan.
   - **Yang Diperiksa:**
     - Di `/berita.html`: Klik salah satu artikel berita untuk membuka modal/halaman baca berita lengkap, uji fitur pencarian/filter kategori. Pastikan berita berstatus *Draft* **tidak muncul** di halaman publik.
     - Di `/pengumuman.html`: Klik pengumuman untuk melihat isi lengkap edaran.
     - Di `/agenda.html`: Pastikan tanggal, **jam kegiatan (`time`)**, dan lokasi tampil akurat sesuai input Admin.
     - Di `/galeri.html`: Klik foto galeri untuk memastikan *lightbox* / pratinjau gambar terbuka dengan baik.

4. **Halaman Kontak (`/kontak.html`)**
   - Buka menu **Kontak**.
   - **Yang Diperiksa:**
     - Informasi alamat, nomor WhatsApp, email, jam operasional, dan peta lokasi Google Maps tampil.
     - Isi **Formulir Kirim Pesan** (Nama, Email, No. HP, Subjek, Pesan) lalu klik **Kirim Pesan**.
     - **Hasil yang Diharapkan:** Muncul notifikasi sukses *"Pesan Anda berhasil dikirim"* dan form kembali bersih.

---

## 3. Skenario 2: Simulasi Calon Siswa Baru (Pendaftaran PPDB & Portal Calon Siswa)

**Tujuan:** Menguji alur lengkap calon wali murid yang mendaftarkan anaknya dari halaman PPDB publik hingga masuk ke Portal Calon Siswa.

### Bagian A — Pendaftaran PPDB Online 5 Tahap (`/ppdb.html`)
1. Klik tombol **PPDB Online** di navbar (`/ppdb.html`).
2. Periksa bagian **Jadwal & Linimasa PPDB** serta badge status gelombang (**Buka / Tutup**).
3. Mulai pengisian formulir **5 Tahap**:
   - **Tahap 1 (Pilih Jenjang & Jalur):**
     - Pilih **PAUD / TK** (misal: *TK A*) atau **TPQ**.
     - Perhatikan indikator di kanan atas berubah menjadi **`Tahap 1 dari 5`**. Klik **Lanjut**.
   - **Tahap 2 (Biodata Calon Siswa):**
     - Indikator berubah menjadi **`Tahap 2 dari 5`**.
     - Isi Nama Lengkap (contoh: `Ahmad Fauzan Simulasi`), Nama Panggilan (`Fauzan`), NIK (`6472012005210001`), Jenis Kelamin (`Laki-laki`), Tempat Lahir (`Samarinda`), Tanggal Lahir (`2021-05-20`), Alamat Lengkap. Klik **Lanjut**.
   - **Tahap 3 (Data Orang Tua / Wali & Akun):**
     - Indikator berubah menjadi **`Tahap 3 dari 5`**.
     - Isi Nama Ayah (`Budi Santoso`), Nama Ibu (`Siti Aminah`), Nomor WhatsApp Aktif (`081234567890`), Email Login (`fauzan.test@gmail.com`), dan **Password Akun Portal** (`rahasia123`). Klik **Lanjut**.
   - **Tahap 4 (Unggah Berkas Persyaratan):**
     - Indikator berubah menjadi **`Tahap 4 dari 5`**.
     - Unggah 3 file gambar: **Pas Foto 3x4**, **Akta Kelahiran**, dan **Kartu Keluarga (KK)**. Klik **Lanjut**.
   - **Tahap 5 (Konfirmasi & Pernyataan):**
     - Indikator berubah menjadi **`Tahap 5 dari 5`**.
     - Periksa ringkasan data, centang kotak persetujuan keaslian data, lalu klik **Kirim Pendaftaran**.
4. **Hasil yang Diharapkan:**
   - Muncul layar/modal **Pendaftaran Berhasil** yang menampilkan **Nomor Pendaftaran** (contoh: `REG-2026-XXXX`), Email Login, dan Password.
   - **Catat Nomor Pendaftaran (`REG-2026-XXXX`)** tersebut untuk langkah berikutnya!

### Bagian B — Cek Status Pendaftaran Publik (`/ppdb/status.html`)
1. Buka halaman `/ppdb/status.html` (atau klik tombol **Cek Status Pendaftaran** di halaman PPDB).
2. Masukkan Nomor Pendaftaran `REG-2026-XXXX` yang baru saja didapat, lalu klik **Cek Status**.
3. **Hasil yang Diharapkan:**
   - Muncul kartu informasi pendaftar atas nama `Ahmad Fauzan Simulasi` dengan status **`MENUNGGU VERIFIKASI (PENDING)`**.

### Bagian C — Login & Eksplorasi Portal Calon Siswa (`/portal/siswa/*`)
1. Apabila setelah daftar PPDB Anda belum otomatis diarahkan, buka `/login.html` dan login menggunakan:
   - **Email / Username:** `fauzan.test@gmail.com` (atau Nomor Registrasi `REG-2026-XXXX`)
   - **Password:** `rahasia123`
2. **Yang Diperiksa di Portal Calon Siswa:**
   - **Dashboard (`/portal/siswa/dashboard.html`):**
     - Tampil **Mode Calon Siswa** dengan **Tracker Progres PPDB 4 Tahap** (Tahap 1 *Pendaftaran Terkirim* tercentang aktif, Tahap 2 *Verifikasi Berkas* sedang berlangsung).
     - Kartu informasi menampilkan Nomor Registrasi (`REG-2026-XXXX`) dan status pendaftaran.
   - **Biodata (`/portal/siswa/biodata.html`):**
     - Seluruh data yang diisi saat PPDB tampil lengkap.
     - Coba ubah *Nama Panggilan* atau *Alamat*, lalu klik **Simpan Perubahan**. Pastikan muncul toast sukses dan saat di-refresh perubahan tetap tersimpan.
   - **Dokumen (`/portal/siswa/dokumen.html`):**
     - Ke-3 dokumen yang diunggah saat PPDB (**Pas Foto 3x4**, **Akta Kelahiran**, **Kartu Keluarga**) tampil di daftar dokumen dengan tombol **Lihat Berkas**.
     - Coba unggah ulang / tambah dokumen baru melalui form upload, pastikan pratinjau gambar terbuka dengan benar.

---

## 4. Skenario 3: Simulasi Admin Yayasan / Tata Usaha (12 Modul Portal Admin)

**Tujuan:** Menguji seluruh fitur operasional dan manajerial di Portal Admin, termasuk memverifikasi dan mengonversi pendaftar PPDB dari Skenario 2 menjadi **Siswa Aktif**.

Buka jendela browser baru (atau *Incognito*), masuk ke `/login.html`, dan login sebagai **Super Admin** (`admin@yayasan.sch.id`).

### 1. Dashboard Admin (`/portal/admin/dashboard.html`)
- **Yang Diperiksa:**
  - Kartu KPI menampilkan jumlah **Siswa Aktif**, **Guru Aktif**, **Rombongan Belajar (Kelas)**, **Pendaftar PPDB Baru (Pending)**, serta ringkasan **Tagihan SPP Lunas vs Tunggakan** secara *real-time* dari database.
  - Tabel Pendaftar PPDB Terbaru menampilkan `Ahmad Fauzan Simulasi` yang baru mendaftar di Skenario 2.

### 2. Manajemen PPDB & Konversi Siswa (`/portal/admin/ppdb.html`)
- **Langkah Pengujian:**
  1. **Pengaturan Gelombang & Jadwal:** Klik tombol **Pengaturan Jadwal / Periode PPDB**, ubah tanggal atau catatan pengumuman, lalu klik **Simpan**.
  2. **Inspeksi Berkas Pendaftar:** Cari nama `Ahmad Fauzan Simulasi` di tabel PPDB, klik tombol **Detail / Lihat**.
     - Pastikan seluruh biodata dan ke-3 foto berkas (Pas Foto, Akta, KK) tampil jelas dan dapat diklik.
  3. **Terima Pendaftar (Approve):** Klik tombol **Terima / Setujui Berkas**. Status pendaftar berubah menjadi **`Diterima (Accepted)`**.
  4. **Konversi ke Siswa Aktif (Convert):**
     - Klik tombol **Aktifkan / Konversi ke Siswa** pada baris `Ahmad Fauzan Simulasi`.
     - Pilih Kelas Tujuan (misal: **TK A**), biarkan NIS dibuat otomatis (atau isi misal `20269901`), pastikan opsi **Terbitkan Tagihan SPP Bulan Pertama Otomatis** aktif, lalu klik **Konversi Sekarang**.
- **Hasil yang Diharapkan:**
  - Status pendaftar berubah menjadi **`Telah Dikonversi (Converted)`**.
  - Muncul modal **Ringkasan Kredensial Siswa Baru** berisi **NIS (`2026XXXX`)**, Kelas, dan Password Login (beserta tombol Salin / Kirim WhatsApp). **Catat NIS tersebut!**
  - Coba klik konversi sekali lagi pada siswa yang sama — sistem harus menolak duplikasi (Idempotency Guard).

### 3. Manajemen Siswa Aktif (`/portal/admin/students.html`)
- **Langkah Pengujian:**
  1. Pastikan `Ahmad Fauzan Simulasi` kini otomatis muncul di daftar **Siswa Aktif** lengkap dengan NIS dan Kelas yang dipilih.
  2. Gunakan **Filter Kelas** dan **Kotak Pencarian** untuk memfilter siswa.
  3. Klik tombol **Dokumen / Berkas** pada baris `Ahmad Fauzan Simulasi` — pastikan berkas Pas Foto, Akta, dan KK yang diunggah saat PPDB otomatis terhubung dan bisa dilihat oleh Admin.
  4. Klik **Edit** pada data siswa, ubah salah satu field (misal Semester atau Catatan), lalu **Simpan**.
  5. Uji tombol **Reset Password** pada salah satu siswa untuk memastikan fitur reset password ke tanggal lahir berjalan lancar.

### 4. Manajemen Kelas & Rombongan Belajar (`/portal/admin/classes.html`)
- **Langkah Pengujian:**
  1. Periksa jumlah siswa (`student_count`) pada kelas tempat `Ahmad Fauzan Simulasi` ditempatkan — pastikan angkanya bertambah secara akurat.
  2. Klik **Tambah Kelas**, buat kelas uji coba (misal: `TK B - Al-Fath`, Kapasitas `25`, pilih Wali Kelas dari daftar Guru), lalu **Simpan**.
  3. Edit kelas tersebut, lalu hapus kembali kelas uji coba jika sudah terverifikasi.

### 5. Manajemen Guru & Tenaga Pendidik (`/portal/admin/teachers.html`)
- **Langkah Pengujian:**
  1. Klik **Tambah Guru**, isi NIP, Nama Lengkap, Spesialisasi/Jabatan, Pendidikan, No. HP, dan Status Aktif, lalu **Simpan**.
  2. Uji pencarian guru berdasarkan Nama / NIP, uji tombol **Edit**, serta toggle **Aktifkan / Nonaktifkan**.

### 6. Manajemen Keuangan & SPP (`/portal/admin/payments.html`)
- **Langkah Pengujian:**
  1. Periksa tab **Daftar Tagihan (Invoices)**: Pastikan tagihan SPP bulan pertama milik `Ahmad Fauzan Simulasi` otomatis muncul dengan status **Belum Lunas (`unpaid`)**.
  2. **Buat Tagihan Manual (Single Invoice):** Klik **Buat Tagihan**, pilih siswa, masukkan nominal & jatuh tempo, lalu simpan.
  3. **Buat Tagihan Massal (Bulk Invoice):** Klik **Tagihan Massal (Per Kelas)**, pilih kelas & bulan, lalu terbitkan.
  4. **Tandai Lunas Offline (Tunai):** Pada salah satu tagihan yang belum lunas, klik **Tandai Lunas (Tunai)**, lalu uji tombol **Cetak Kuitansi** untuk melihat tampilan bukti pembayaran resmi.
  5. *(Tab **Verifikasi Pembayaran Online** akan diuji bersama Skenario 4 setelah Siswa mengunggah bukti transfer).*

### 7. Manajemen Konten & Profil Institusi (`/portal/admin/content.html`)
- **Langkah Pengujian:**
  1. **Tab Berita:** Buat 1 berita baru dengan status **Published** (beserta gambar sampul) dan 1 berita dengan status **Draft**. Pastikan hanya yang *Published* yang tampil di `/berita.html`.
  2. **Tab Pengumuman:** Buat pengumuman baru, simpan, dan cek di `/pengumuman.html`.
  3. **Tab Agenda Kegiatan:** Buat agenda baru dengan tanggal, **jam pelaksanaan** (misal `09:00 - 11:30 WITA`), dan lokasi. Cek di `/agenda.html`.
  4. **Tab Galeri:** Unggah foto kegiatan baru ke galeri, cek di `/galeri.html`.
  5. **Tab Profil Institusi:** Ubah teks Visi, Misi, Program Pendidikan, Kurikulum, atau nama pengurus di Struktur Organisasi, lalu klik **Simpan Profil**.

### 8. Pengaturan Website / CMS (`/portal/admin/cms_setting.html`)
- **Langkah Pengujian:**
  1. Ubah judul Hero Beranda, nomor WhatsApp resmi, Jam Operasional, atau tautan sosial media (Instagram/YouTube/Facebook).
  2. Klik **Simpan Pengaturan**.
  3. Buka halaman publik `/index.html` dan `/kontak.html` untuk memastikan perubahan langsung diterapkan.

### 9. Manajemen User (`/portal/admin/users.html`)
- **Langkah Pengujian:**
  1. Klik **Tambah User** untuk membuat akun staf/admin baru, lalu **Simpan**.
  2. Klik **Edit** pada akun Admin atau user lain, masukkan password baru di kolom **Password**, lalu klik **Simpan** (memastikan perbaikan `role_id` berfungsi mulus).
  3. Uji filter berdasarkan Role (`Super Admin`, `Admin TU`, `Siswa Aktif`, `Calon Siswa`) dan pencarian nama/email.

### 10. Laporan & Import Excel (`/portal/admin/reports.html`)
- **Langkah Pengujian:**
  1. Pilih jenis laporan (**Laporan Data Siswa**, **Laporan Keuangan SPP**, **Laporan PPDB**, atau **Rekapitulasi Semua Modul**), klik **Tampilkan Laporan**.
  2. Klik tombol **Export ke Excel (`.xls`)** — pastikan file berhasil terunduh dan dapat dibuka.
  3. Uji fitur **Import Data (Siswa / Tagihan)** menggunakan template CSV/Excel yang tersedia.

### 11. Log Aktivitas Sistem (`/portal/admin/logs.html`)
- **Langkah Pengujian:**
  1. Buka halaman Log Aktivitas.
  2. Pastikan aksi-aksi yang baru saja Anda lakukan (`APPROVE_PPDB`, `CONVERT_SISWA`, `UPDATE_USER`, `UPDATE_PERIOD`) tercatat dengan waktu dan keterangan yang rapi.

### 12. Backup & Restore Database (`/portal/admin/backup.html`)
- **Langkah Pengujian:**
  1. Klik **Buat Cadangan Baru (Create Backup)**.
  2. Pastikan riwayat backup muncul di tabel dan file `.json` dapat diunduh ke komputer.

---

## 5. Skenario 4: Simulasi Siswa Aktif / Wali Santri (Portal Siswa Aktif & SPP)

**Tujuan:** Menguji pengalaman `Ahmad Fauzan Simulasi` setelah resmi diaktifkan menjadi siswa oleh Admin pada Skenario 3, hingga melakukan pembayaran SPP dan mencetak kuitansi.

### Langkah-Langkah Pengujian Manual:
1. **Cek Perubahan Status Publik (`/ppdb/status.html`)**
   - Buka `/ppdb/status.html` dan masukkan kembali Nomor Registrasi `REG-2026-XXXX`.
   - **Hasil yang Diharapkan:** Status kini tampil **`DITERIMA / SISWA AKTIF`** lengkap dengan informasi **NIS (`2026XXXX`)** dan **Kelas**.

2. **Login sebagai Siswa Aktif (`/login.html`)**
   - Masuk ke `/login.html` menggunakan **NIS (`2026XXXX`)** dan Password pendaftaran PPDB (atau tanggal lahir `20052021`).
   - **Yang Diperiksa di Dashboard (`/portal/siswa/dashboard.html`):**
     - Tampilan otomatis beralih dari *Mode Calon Siswa* menjadi **Mode Siswa Aktif**!
     - Menampilkan kartu identitas NIS, Kelas, Semester, Persentase Kehadiran, Pengumuman Sekolah, dan Ringkasan Tagihan SPP.

3. **Pembayaran SPP Online (`/portal/siswa/spp.html`)**
   - Buka menu **Tagihan & SPP** (`/portal/siswa/spp.html`).
   - Temukan tagihan SPP Bulan Pertama (Rp 150.000) yang berstatus **Belum Bayar (`unpaid`)**.
   - Klik tombol **Bayar / Unggah Bukti Transfer**, pilih metode pembayaran (`Transfer Bank`), unggah gambar bukti transfer (`kk_dummy.jpg`), lalu klik **Kirim Bukti Pembayaran**.
   - **Hasil yang Diharapkan:** Status tagihan pada Portal Siswa berubah menjadi **`Menunggu Verifikasi`**.

4. **Verifikasi Pembayaran oleh Admin & Cetak Kuitansi Siswa**
   - Kembali ke jendela **Portal Admin -> Keuangan & SPP (`/portal/admin/payments.html`)**.
   - Buka tab **Verifikasi Pembayaran Masuk**. Anda akan melihat kiriman bukti bayar dari `Ahmad Fauzan Simulasi`.
   - Klik **Lihat Bukti** untuk mengecek foto bukti transfer, lalu klik **Setujui / Verifikasi (Approve)**.
   - Kembali ke jendela **Portal Siswa -> Tagihan & SPP (`/portal/siswa/spp.html`)** dan lakukan refresh:
     - Status tagihan kini berubah menjadi **`LUNAS (Paid)`**!
     - Klik tombol **Cetak Kuitansi** — pastikan kuitansi resmi terbuka lengkap dengan nominal angka dan kalimat **Terbilang** (*"Seratus Lima Puluh Ribu Rupiah"*).

---

## 6. Skenario 5: Pengujian Integrasi Lintas Perangkat (Cross-Device CMS Sync)

**Tujuan:** Memastikan perubahan pengaturan website yang dilakukan Admin tersimpan di **Supabase Cloud** (bukan hanya di `localStorage` browser Admin) dan terlihat oleh pengunjung di perangkat/HP lain.

1. Di **Portal Admin** (`/portal/admin/content.html` -> Tab Profil Institusi atau `/portal/admin/cms_setting.html`), ubah teks **Tagline / Jam Operasional / Visi** dengan tambahan kata unik (misal: `Update Cloud 2026`). Klik **Simpan**.
2. Buka **Perangkat Berbeda** (misalnya melalui browser Smartphone Anda, atau profil browser baru yang bersih tanpa cache/`localStorage`).
3. Kunjungi `https://siyayasan-portal.vercel.app/` dan `/profil.html`.
4. **Hasil yang Diharapkan:** Perubahan `Update Cloud 2026` langsung tampil di perangkat kedua tersebut.

---

## 7. Panduan Pengujian Otomatis (Browser Console & CLI Test Runner)

Selain pengujian klik manual di atas, proyek ini dilengkapi dengan **2 metode pengujian otomatis**:

### Metode A — Pengujian Otomatis via Terminal (Node.js Test Suites)
Jalankan perintah berikut di terminal pada folder proyek (`d:\Source_code_yayasan`):

```powershell
# 1. Menjalankan Verifikasi Pre-Deployment & Integrasi Kode (12 Test Utama)
node tests/test-predeploy-remediation.js

# 2. Menjalankan Pengujian Alur End-to-End PPDB -> Konversi -> Siswa Aktif
node tests/test-ppdb-e2e-flow.js

# 3. Menjalankan Pengujian Integritas Kontrak API & Skema
node tests/test-api-contract.js
```

### Metode B — Skrip Smoke-Test Otomatis Langsung di Browser (DevTools Console)
Anda dapat menguji seluruh koneksi API dan ketersediaan modul langsung dari browser pada website `https://siyayasan-portal.vercel.app`:

1. Buka `https://siyayasan-portal.vercel.app`.
2. Tekan **`F12`** (atau Klik Kanan -> **Inspect**) lalu pilih tab **Console**.
3. Salin dan tempel (*copy-paste*) skrip pengujian otomatis berikut ke dalam Console, lalu tekan **Enter**:

```javascript
(async function runBrowserSmokeTest() {
  console.log('%c🚀 MEMULAI SMOKE TEST OTOMATIS SIYAYASAN...', 'color:#0284c7;font-weight:bold;font-size:14px;');
  const checks = [
    { name: '1. Web Settings & CMS Cloud Sync', call: () => window.apiCall('web_settings', 'get') },
    { name: '2. Identitas & Profil Yayasan (Schools)', call: () => window.apiCall('schools', 'get') },
    { name: '3. Periode & Jadwal PPDB', call: () => window.apiCall('ppdb', 'period') },
    { name: '4. Daftar Berita Publik', call: () => window.apiCall('news', 'list', { published_only: true }) },
    { name: '5. Daftar Pengumuman Publik', call: () => window.apiCall('announcements', 'list', { published_only: true }) },
    { name: '6. Daftar Agenda Kegiatan', call: () => window.apiCall('events', 'list', { published_only: true }) },
    { name: '7. Daftar Galeri Foto', call: () => window.apiCall('galleries', 'list') },
    { name: '8. Daftar Tenaga Pendidik (Guru)', call: () => window.apiCall('teachers', 'list', { is_active: true }) },
    { name: '9. Daftar Kelas / Rombel', call: () => window.apiCall('classes', 'list') },
    { name: '10. Statistik Dashboard KPI', call: () => window.apiCall('dashboard', 'stats') }
  ];

  let passed = 0;
  const results = [];
  for (const c of checks) {
    const t0 = performance.now();
    try {
      const res = await c.call();
      const ms = Math.round(performance.now() - t0);
      const ok = Boolean(res && res.success);
      if (ok) passed++;
      results.push({ Modul: c.name, Status: ok ? '✅ LULUS' : '❌ GAGAL', 'Waktu (ms)': ms, Keterangan: ok ? 'OK' : (res?.message || 'Error') });
    } catch (err) {
      results.push({ Modul: c.name, Status: '❌ ERROR', 'Waktu (ms)': 0, Keterangan: err.message });
    }
  }
  console.table(results);
  console.log(`%c🏁 HASIL AKHIR: ${passed}/${checks.length} Modul Lulus Pengujian Otomatis Browser!`, 'color:#0369a1;font-weight:bold;font-size:13px;');
})();
```

---

## 8. Lembar Checklist UAT (User Acceptance Testing)

Gunakan tabel di bawah ini untuk memberi tanda centang (`[x]`) saat Anda melakukan simulasi:

| No | Peran | Modul / Alur yang Diuji | Halaman | Status (`[ ]` / `[x]`) | Catatan |
| :-: | :--- | :--- | :--- | :-: | :--- |
| 1 | **Umum** | Beranda, Hero, Program Pendidikan, & Footer | `/index.html` | `[ ]` | |
| 2 | **Umum** | Profil Yayasan, Visi-Misi, Kurikulum, Struktur Organisasi | `/profil.html` | `[ ]` | |
| 3 | **Umum** | Berita, Pengumuman, Agenda, & Galeri Foto | `/berita.html` dkk. | `[ ]` | |
| 4 | **Umum** | Kirim Pesan via Formulir Kontak & Peta Lokasi | `/kontak.html` | `[ ]` | |
| 5 | **Calon Siswa** | Pendaftaran PPDB 5 Tahap + Upload 3 Berkas | `/ppdb.html` | `[ ]` | |
| 6 | **Calon Siswa** | Cek Status Pendaftaran via Nomor `REG-2026-XXXX` | `/ppdb/status.html` | `[ ]` | |
| 7 | **Calon Siswa** | Login Portal Calon Siswa (Tracker 4 Tahap, Biodata, Dokumen) | `/portal/siswa/dashboard.html` | `[ ]` | |
| 8 | **Admin** | Login Admin & Verifikasi Angka KPI Dashboard | `/portal/admin/dashboard.html` | `[ ]` | |
| 9 | **Admin** | Verifikasi Berkas PPDB, Terima, & Konversi ke Siswa Aktif | `/portal/admin/ppdb.html` | `[ ]` | |
| 10 | **Admin** | Kelola Siswa Aktif, Cek Berkas Siswa, & Reset Password | `/portal/admin/students.html` | `[ ]` | |
| 11 | **Admin** | Kelola Kelas/Rombel & Wali Kelas | `/portal/admin/classes.html` | `[ ]` | |
| 12 | **Admin** | Kelola Data Guru / Ustadz | `/portal/admin/teachers.html` | `[ ]` | |
| 13 | **Admin** | Kelola Tagihan SPP (Single, Massal, Lunas Offline) | `/portal/admin/payments.html` | `[ ]` | |
| 14 | **Admin** | Kelola Konten (Berita, Pengumuman, Agenda, Galeri, Profil) | `/portal/admin/content.html` | `[ ]` | |
| 15 | **Admin** | Pengaturan Website / CMS & Sinkronisasi Lintas Perangkat | `/portal/admin/cms_setting.html` | `[ ]` | |
| 16 | **Admin** | Manajemen User & Ubah Password Admin | `/portal/admin/users.html` | `[ ]` | |
| 17 | **Admin** | Export Laporan Excel (`.xls`) & Import Data | `/portal/admin/reports.html` | `[ ]` | |
| 18 | **Admin** | Audit Log Aktivitas & Backup/Restore JSON | `/portal/admin/logs.html` & `backup.html` | `[ ]` | |
| 19 | **Siswa Aktif** | Login dengan NIS, Cek Dashboard Siswa Aktif & Biodata | `/portal/siswa/dashboard.html` | `[ ]` | |
| 20 | **Siswa Aktif** | Unggah Bukti Bayar SPP -> Admin Verifikasi -> Cetak Kuitansi | `/portal/siswa/spp.html` | `[ ]` | |
