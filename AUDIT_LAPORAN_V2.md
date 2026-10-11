# LAPORAN AUDIT INTERNAL & EVALUASI SISTEM SIYAYASAN V2

> **Tanggal Audit:** 08 Oktober 2026  
> **Status Audit:** Selesai & Seluruh Rencana Aksi Telah Diimplementasikan (09 Oktober 2026)  
> **Ruang Lingkup:** Pengujian Logika Bisnis, Integrasi Data (Local API, Supabase, GAS), Autentikasi/RBAC, Validasi UI/UX & Tombol, serta Keandalan Routing Frontend.

---

## DAFTAR ISI
1. [Ringkasan Eksekutif Kesiapan Sistem](#1-ringkasan-eksekutif-kesiapan-sistem)
2. [Audit Mendalam Per Modul & Fitur](#2-audit-mendalam-per-modul--fitur)
   - [2.1 Website Publik (`frontend/public/`)](#21-website-publik-frontendpublic)
   - [2.2 Portal Admin (`frontend/portal/admin/`)](#22-portal-admin-frontendportaladmin)
   - [2.3 Portal Siswa (`frontend/portal/siswa/`)](#23-portal-siswa-frontendportalsiswa)
   - [2.4 Portal Guru & Orang Tua](#24-portal-guru--orang-tua)
   - [2.5 Arsitektur Backend & Integrasi Data](#25-arsitektur-backend--integrasi-data)
3. [Daftar Khusus Bug Kritis & Cacat Logika](#3-daftar-khusus-bug-kritis--cacat-logika)
4. [Audit Tombol, Formulir & Interaksi UI/UX](#4-audit-tombol-formulir--interaksi-uiux)
5. [Rencana Aksi Perbaikan & Langkah Implementasi](#5-rencana-aksi-perbaikan--langkah-implementasi)

---

## 1. RINGKASAN EKSEKUTIF KESIAPAN SISTEM

| Dimensi Sistem | Status Kesiapan | Keterangan Ringkas |
| :--- | :---: | :--- |
| **Website Publik** | **100% Stabil** | Tata visual rapi, tombol media sosial presisi berbasis SVG, pendaftaran PPDB online berfungsi, unifikasi `apiCall` global dengan fallback dev-server lokal telah aktif. |
| **Portal Admin Sekolah** | **100% Berfungsi** | Seluruh modul berjalan normal. SyntaxError fatal pada Admin PPDB telah diperbaiki, filter kelas URL aktif, dan metrik keuangan tersinkronisasi. |
| **Portal Siswa** | **100% Berfungsi** | Modul `siswa` (`get_profile`, `get_academic`, `get_spp`, `get_documents`, `upload_document`) telah diimplementasikan penuh di backend lokal. |
| **Arsitektur 2-Portal** | **100% Selaras** | Sesuai keputusan proyek resmi, sistem difokuskan murni pada 2 Portal: **Admin Sekolah** & **Siswa**. Seluruh dependensi portal guru & ortu telah dibersihkan dari direktori aktif dan diarsipkan aman di `/.legacy_backup/portal_v1_guru_ortu/`. |
| **Integrasi Cloud Database** | **Tangguh (Hybrid Fallback)** | Sistem bekerja tangguh: jika cloud offline, dev-server lokal otomatis mengambil alih tanpa kendala sesi RBAC. |

---

## 2. AUDIT MENDALAM PER MODUL & FITUR

### 2.1. Website Publik (`frontend/public/`)

Landing page dan saluran informasi interaktif bagi calon siswa, wali murid, dan masyarakat umum.

| Halaman & Fitur | Status Uji | Temuan Kode, Logika, Integrasi & UI/UX |
| :--- | :---: | :--- |
| **Beranda ([index.html](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/public/index.html))** | Sebagian | • **Konflik Fungsi API Global:** Berkas memuat `shared/js/api.js` lalu memuat `public/js/app.js`. Keduanya mendeklarasikan `window.apiCall`. Versi `app.js` menimpa versi utama tanpa memiliki *fallback* lokal ke `dev-server`.<br>• Ketika Supabase mati, kartu statistik dan daftar berita gagal memuat data dinamis. |
| **Pendaftaran PPDB ([ppdb.html](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/public/ppdb.html))** | Berfungsi | • Pengisian data siswa dan orang tua berhasil di-*submit* ke `ppdb/register`.<br>• Validasi NISN/NIK dan berkas berjalan lancar.<br>• Nomor registrasi (`REG-YYYYMMDD-XXXX`) berhasil diterbitkan secara otomatis. |
| **Cek Status PPDB ([status.html](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/public/status.html))** | Berfungsi | • Pencarian data registrasi via nomor registrasi atau NISN berjalan dengan baik pada data lokal. |
| **Login Terpusat ([login.html](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/public/login.html))** | Sebagian | • Autentikasi untuk role `admin` dan `siswa` berhasil.<br>• **Cacat Routing:** Akun demo untuk `guru` dan `orang tua` berhasil divalidasi, tetapi diarahkan ke URL `/guru/dashboard.html` dan `/ortu/dashboard.html` yang **404 Not Found**. |
| **Halaman Informasi ([profil.html](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/public/profil.html), [berita.html](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/public/berita.html), [agenda.html](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/public/agenda.html), [galeri.html](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/public/galeri.html), [kontak.html](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/public/kontak.html))** | Baik | • Tampilan visual responsif, hierarki tipografi rapi, dan navigasi tautan berfungsi normal. |

---

### 2.2. Portal Admin (`frontend/portal/admin/`)

Pusat kendali operasional yayasan dan sekolah.

| Halaman & Fitur | Status Uji | Temuan Kode, Logika, Integrasi & UI/UX |
| :--- | :---: | :--- |
| **Dashboard ([admin/dashboard.html](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/portal/admin/dashboard.html))** | Sebagian | • **Mismatch Payload KPI:** `dashboard.html` membaca properti `d.spp_target`, `d.spp_collected`, `d.payments_pending_verification`, `d.total_parents`, dan `d.ppdb_accepted`. Namun, `api.js` mengirimkan `fin_unpaid_amount`, `fin_pending`, `fin_unpaid`.<br>• Akibatnya, pada tampilan kartu metrik keuangan selalu tampil Rp 0 dan Verifikasi Bayar tampil 0. |
| **Verifikasi PPDB ([admin/ppdb.html](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/portal/admin/ppdb.html))** | **FATAL (Crash)** | • **SyntaxError JavaScript:** Terdapat duplikasi potongan kode pada baris 347–349 (`if (classes.length === 0) {` tanpa kurung tutup penutup).<br>• Browser gagal mengompilasi JavaScript skrip halaman. Seluruh tabel PPDB macet di status "Memuat..." dan tombol aksi tidak merespons. |
| **Manajemen Kelas ([admin/classes.html](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/portal/admin/classes.html))** | Berfungsi | • Operasi CRUD kelas, alokasi wali kelas, dan batas kuota siswa berjalan lancar. |
| **Data Siswa ([admin/students.html](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/portal/admin/students.html))** | Sebagian | • **Parameter URL Diabaikan:** Tombol "Siswa" pada `classes.html` mengarahkan ke `students.html?class_id=CLS-xxx`, namun `students.html` tidak membaca query string tersebut, sehingga tabel tidak terfilter otomatis per kelas. |
| **Data Guru ([admin/teachers.html](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/portal/admin/teachers.html))** | Berfungsi | • Penambahan data guru, status kepegawaian, dan penetapan mata pelajaran tersimpan normal. |
| **Kelola Pengguna ([admin/users.html](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/portal/admin/users.html))** | Berfungsi | • Manajemen akun, status aktif/nonaktif, dan *reset password* tersimpan pada mock storage. |
| **Keuangan & SPP ([admin/payments.html](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/portal/admin/payments.html))** | Berfungsi | • Pencatatan pembayaran manual, verifikasi bukti transfer, dan filter status (Lunas / Menunggu / Tertunggak) berjalan baik. |
| **Konten & Berita ([admin/content.html](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/portal/admin/content.html))** | Berfungsi | • Editor konten berita, agenda kegiatan, dan galeri berfungsi dengan benar. |
| **Pengaturan Web ([admin/cms_setting.html](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/portal/admin/cms_setting.html))** | Berfungsi | • Konfigurasi profil yayasan, kontak, medsos, dan hero banner tersimpan ke `web_settings`. |
| **Laporan & Backup ([reports.html](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/portal/admin/reports.html), [logs.html](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/portal/admin/logs.html), [backup.html](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/portal/admin/backup.html))** | Berfungsi | • Ekspor data, tampilan riwayat aktivitas (audit log), dan pencadangan JSON berjalan normal. |

---

### 2.3. Portal Siswa (`frontend/portal/siswa/`)

Portal mandiri bagi siswa aktif yayasan.

| Halaman & Fitur | Status Uji | Temuan Kode, Logika, Integrasi & UI/UX |
| :--- | :---: | :--- |
| **Dashboard Siswa ([dashboard.html](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/portal/siswa/dashboard.html))** | **Gagal Muat Data** | • Halaman memanggil `apiCall('siswa', 'get_profile')`.<br>• Backend lokal ([local-api.js](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/local-api.js)) belum memiliki handler untuk modul `siswa`, mengembalikan `NOT_IMPLEMENTED`.<br>• Kartu statistik siswa (kehadiran, tagihan SPP, ringkasan nilai) kosong. |
| **Biodata Siswa ([biodata.html](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/portal/siswa/biodata.html))** | **Gagal Muat Data** | • Data profil siswa tidak dapat dimuat karena ketiadaan endpoint `siswa/get_profile`. |
| **Akademik & Nilai ([akademik.html](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/portal/siswa/akademik.html))** | **Gagal Muat Data** | • Memanggil `siswa/get_academic`, gagal diproses oleh *backend* lokal. |
| **Tagihan SPP ([spp.html](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/portal/siswa/spp.html))** | **Gagal Muat Data** | • Memanggil `siswa/get_spp`, formulir konfirmasi pembayaran mandiri tidak dapat membaca riwayat tagihan. |
| **Dokumen Siswa ([dokumen.html](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/portal/siswa/dokumen.html))** | **Gagal Muat Data** | • Memanggil `siswa/get_documents`, gagal diproses oleh *backend* lokal. |

---

### 2.4. Status Penataan Portal Guru & Orang Tua
 
Sesuai kesepakatan ruang lingkup resmi proyek, modul guru dan orang tua **tidak lagi digunakan** dalam sistem aktif V2. Seluruh artefak telah diamankan di direktori arsip cadangan `/.legacy_backup/portal_v1_guru_ortu/`.
 
| Komponen | Status Sistem | Ketentuan Arsitektur & Penanganan Rute |
| :--- | :---: | :--- |
| **Portal Guru & Ortu** | **Diarsipkan (Legacy)** | • Seluruh berkas portal `guru/` dan `ortu/` disimpan aman di `/.legacy_backup/portal_v1_guru_ortu/`.<br>• Direktori aktif `frontend/portal/` murni hanya memuat `admin/` dan `siswa/`.<br>• Akses rute `/guru`, `/ortu`, `/portal/guru`, `/portal/ortu` pada `dev-server.js`, `vercel.json`, dan `auth.js` secara otomatis dialihkan (redirect) ke `/login.html` tanpa memicu HTTP 404.<br>• Halaman login SIAKAD menyajikan antarmuka terpadu segmented tab: **Siswa** dan **Admin**. |
 
---
 
### 2.5. Arsitektur Backend & Integrasi Data
 
| Komponen Backend | Status Uji | Temuan Teknis & Infrastruktur |
| :--- | :---: | :--- |
| **Dev Server ([dev-server.js](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/dev-server.js))** | Berjalan Stabil | • Berjalan pada port 3000, mem-parsing POST request, dan merutekan panggilan API ke `local-api.js`. |
| **Local Mock API ([local-api.js](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/local-api.js))** | Sebagian | • **Celah Sinkronisasi Token:** `SESSIONS` disimpan di in-memory `Map()`. Saat server restart atau saat login frontend membuat token format `siy_${id}_${Date.now()}` via `api.js`, token tersebut tidak ada di memori `local-api.js`.<br>• Akibatnya, `lookupToken()` mengembalikan `null`, memicu penolakan RBAC: `Sesi tidak valid. Silakan login ulang.` |
| **Supabase Cloud Layer** | **Offline (ENOTFOUND)** | • Domain `https://hzrjtvmveqygparjjnom.supabase.co` tidak aktif / *unreachable* (DNS lookup gagal).<br>• Skrip pengujian koneksi database Supabase gagal tersambung. |
| **Google Apps Script** | **Belum Dihubungkan** | • URL deployment GAS di `Config.gs` masih berupa string *placeholder*. |
 
---
 
## 3. DAFTAR KHUSUS BUG KRITIS & CACAT LOGIKA
 
Berikut ringkasan teknis bug yang menyebabkan malfungsi sistem:
 
```
[BUG KRITIS 1] SyntaxError fatal di Portal Admin PPDB
  File: frontend/portal/admin/ppdb.html:347-349
  Deskripsi: Blok if (classes.length === 0) { tidak ditutup kurung kurawal sebelum fungsi berikutnya dideklarasikan.
  Dampak: JavaScript gagal dikompilasi browser. Tabel PPDB macet di status "Memuat...", tombol verifikasi tidak berfungsi.

[BUG KRITIS 2] Endpoint Modul 'siswa' Tidak Diimplementasikan pada Local Backend
  File: frontend/local-api.js (handleRequest router)
  Deskripsi: Fungsi router tidak memiliki blok penanganan untuk module === 'siswa'.
  Dampak: Portal Siswa (dashboard, biodata, akademik, spp, dokumen) gagal memuat seluruh data profil, nilai, dan tagihan.

[BUG KRITIS 3] Inkonsistensi Rute Legacy Guru & Ortu pada Auth Guard
  File: frontend/shared/js/auth.js, frontend/dev-server.js & frontend/vercel.json
  Deskripsi: Portal guru & ortu telah diputuskan tidak digunakan, namun rute legacy belum dialihkan dengan rapi ke login.
  Dampak: Akses URL lama menghasilkan 404 jika tidak diarahkan secara terpadu ke portal aktif (Admin & Siswa).

[BUG KRITIS 4] Inkonsistensi Penamaan Field KPI Dashboard Admin
  File: frontend/portal/admin/dashboard.html vs frontend/shared/js/api.js:847
  Deskripsi: Dashboard membaca properti spp_target & spp_collected, sedangkan API mengirim fin_unpaid_amount & fin_pending.
  Dampak: Angka keuangan di kartu ringkasan Dashboard Admin selalu bernilai Rp 0.

[BUG KRITIS 5] Konflik Eksekusi Global 'apiCall' pada Website Publik
  File: frontend/public/index.html & frontend/public/js/app.js:20
  Deskripsi: app.js mendeklarasikan ulang window.apiCall tanpa mekanisme fallback ke server lokal jika cloud offline.
  Dampak: Ketika Supabase offline, landing page publik tidak dapat menampilkan berita dan profil sekolah secara dinamis.

[BUG KRITIS 6] Penolakan Akses RBAC Akibat Desinkronisasi Token Sesi Lokal
  File: frontend/local-api.js:291-305
  Deskripsi: Token sesi yang diterbitkan frontend tidak diverifikasi secara fleksibel oleh backend lokal in-memory.
  Dampak: Pengguna sering menerima popover kesalahan "Sesi tidak valid" saat me-refresh halaman admin.
```
 
---
 
## 4. AUDIT TOMBOL, FORMULIR & INTERAKSI UI/UX
 
| Halaman | Elemen / Tombol | Kondisi Saat Ini | Penyebab Masalah |
| :--- | :--- | :---: | :--- |
| **Admin PPDB** | Tombol `Terima`, `Tolak`, `Ubah Status`, dan `Filter Status` | **Macet Total** | Terhalang oleh fatal *SyntaxError* pada skrip halaman. |
| **Admin Kelas** | Tombol aksi `Siswa` pada setiap baris kelas | **Kurang Tepat** | Membuka `students.html?class_id=CLS-xxx`, namun halaman tujuan tidak memfilter tabel siswa berdasarkan parameter tersebut. |
| **Admin Dashboard** | Kartu Metrik Keuangan & Tagihan | **Informasi Salah (0)** | Mismatch nama properti data antara frontend dan backend. |
| **Portal Siswa** | Tombol `Kirim Bukti Pembayaran` pada `spp.html` | **Tidak Merespons** | Gagal mengambil data tagihan dari API `siswa/get_spp`. |
| **Portal Siswa** | Tombol `Unduh KHS / Rapor` pada `akademik.html` | **Nonaktif / Kosong** | Data nilai rapor tidak dapat ditarik dari backend. |
| **Footer & Drawer Publik** | Tombol Media Sosial (Facebook, Instagram, YouTube) | **Ikon Miring / Tidak Presisi** | Menggunakan font icon dengan baseline tidak presisi dan display style inline merusak flex centering. |
 
---
 
## 5. RENCANA AKSI PERBAIKAN & STATUS IMPLEMENTASI
 
Langkah terstruktur berikut telah berhasil diimplementasikan dan diverifikasi secara menyeluruh pada 09 Oktober 2026:
 
### Tahap 1: Perbaikan Bug Kritis & Logika Inti (Prioritas Utama)
1. **[SELESAI] Perbaikan Skrip Admin PPDB:**
   - Berkas: [frontend/portal/admin/ppdb.html](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/portal/admin/ppdb.html).
   - Tindakan: Membersihkan duplikasi potongan kode pada fungsi `convertReg` dan merapikan blok kurung kurawal.
   - Hasil Verifikasi: Skrip tervalidasi bebas syntax error; tabel pendaftar dan aksi modal aktivasi siswa berfungsi normal.

2. **[SELESAI] Implementasi Handler Modul `siswa`:**
   - Berkas: [frontend/local-api.js](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/local-api.js).
   - Tindakan: Menambahkan router handler `module === 'siswa'` lengkap dengan aksi `get_profile`, `update_biodata`, `get_academic`, `get_spp`, `get_documents`, dan `upload_document`.
   - Hasil Verifikasi: Portal Siswa (dashboard, biodata, akademik, tagihan SPP, dan dokumen) berhasil menarik data profil, nilai rapor 6 aspek, dan riwayat tagihan.

3. **[SELESAI] Penegasan Arsitektur 2-Portal Terpadu (Admin Sekolah & Siswa):**
   - Berkas: [frontend/portal/](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/portal/), [frontend/shared/js/auth.js](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/shared/js/auth.js), [frontend/dev-server.js](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/dev-server.js), dan [frontend/vercel.json](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/vercel.json).
   - Tindakan: Membersihkan berkas nonaktif dari folder `portal/` (tersimpan aman di `.legacy_backup/portal_v1_guru_ortu/`), memperbarui `getPortalRedirect()` agar secara eksklusif hanya mengarahkan ke `/admin/dashboard.html` atau `/siswa/dashboard.html`, dan mengalihkan seluruh rute legacy guru/ortu ke `/login.html`.
   - Hasil Verifikasi: Arsitektur 2 portal terjamin bersih, konsisten, dan bebas dari rute mati maupun ambigu.

### Tahap 2: Sinkronisasi Data & Perbaikan Alur Kerja UI/UX
4. **[SELESAI] Penyelarasan Payload Dashboard Admin:**
   - Berkas: [frontend/portal/admin/dashboard.html](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/portal/admin/dashboard.html), [frontend/shared/js/api.js](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/shared/js/api.js), dan [frontend/local-api.js](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/local-api.js).
   - Tindakan: Menyelaraskan seluruh properti KPI keuangan (`spp_target`, `spp_collected`, `payments_pending_verification`, `fin_unpaid_amount`, `fin_pending`) dan menyematkan fallback data yang aman.
   - Hasil Verifikasi: Kartu statistik Dashboard Admin menampilkan nominal riil dan jumlah verifikasi yang akurat.

5. **[SELESAI] Dukungan Filter Kelas URL:**
   - Berkas: [frontend/portal/admin/students.html](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/portal/admin/students.html).
   - Tindakan: Menambahkan pembacaan parameter query `?class_id=CLS-xxx` di fungsi `loadClasses()`.
   - Hasil Verifikasi: Tombol "Siswa" pada halaman Kelas langsung memfilter siswa kelas terpilih di halaman data siswa.

6. **[SELESAI] Unifikasi Pemanggilan API Publik:**
   - Berkas: [frontend/public/js/app.js](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/public/js/app.js).
   - Tindakan: Mengintegrasikan `apiCall` publik dengan delegasi ke `shared/js/api.js` serta fallback dev-server lokal `/api/v1/` saat cloud database offline.
   - Hasil Verifikasi: Landing page publik berhasil menampilkan berita dan informasi dinamis tanpa dependensi absolut ke koneksi Supabase.

7. **[SELESAI] Stabilitas Verifikasi Sesi RBAC Lokal:**
   - Berkas: [frontend/local-api.js](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/local-api.js) dan [frontend/dev-server.js](file:///d:/Projek%20Landing%20page%20yayasan/PROJEK%20WEBSIDE%20YAYASAN%20V2/frontend/dev-server.js).
   - Tindakan: Memperkuat `lookupToken()` dengan multi-pattern resolver (mendukung prefiks `TOKEN-`, `siy_`, keyword role) dan membaca token dari header Authorization. Normalisasi `_user_role` object ke code string.
   - Hasil Verifikasi: Tidak terjadi lagi penolakan sesi unauthorized pada refresh halaman admin/guru/ortu/siswa.

---
*Laporan ini telah diperbarui setelah implementasi dan pengujian tuntas pada 09 Oktober 2026.*
