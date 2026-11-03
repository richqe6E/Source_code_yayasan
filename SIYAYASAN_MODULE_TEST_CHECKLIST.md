# SIYAYASAN — COMPREHENSIVE MODULE TEST CHECKLIST
**Sistem Informasi Terpadu Yayasan At Tarbiyyah Wijaya Kusuma Samarinda**
*Daftar Periksa Kesiapan Operasional, Pengujian Modul, dan Status Validasi Fitur*

---

## Legenda Status Pengujian
- `[x] PASS` : Fitur berhasil diuji dan bekerja 100% sesuai spesifikasi bisnis tanpa kendala.
- `[-] PARTIAL` : Fitur bekerja, namun terdapat catatan minor atau penurunan visual (non-blocking).
- `[ ] FAIL` : Fitur gagal memenuhi kriteria atau ditemukan defek fungsional/kritis.
- `[ ] NOT TESTED` : Fitur belum dieksekusi dalam cakupan pengujian saat ini.
- `[!] BLOCKED` : Pengujian fitur terhalang oleh kegagalan komponen prasyarat sebelumnya.

---

## 1. Modul Website Publik & Asisten Informasi Q/A

| ID | Fitur / Skenario Pengujian | Lingkungan Uji | Status | Bukti & Catatan Pengujian |
| :--- | :--- | :--- | :---: | :--- |
| **PUB-001** | Beranda (`index.html`): HTTP 200, Banner Hero, Sambutan Pimpinan, Ringkasan Statistik Lembaga | Local & Live | `[x] PASS` | Tampilan responsive, tag `<h1>` hadir, data dinamis termuat. |
| **PUB-002** | Profil Yayasan (`profil.html`): Sejarah, Visi, Misi, Struktur Organisasi, Legalitas SK | Local & Live | `[-] PARTIAL` | HTTP 200 OK, konten lengkap. Catatan: Tag `<h1>` belum semantik (`BUG-003`). |
| **PUB-003** | Agenda Kegiatan (`agenda.html`): Daftar kegiatan yayasan, kalender acara, tanggal & lokasi | Local & Live | `[-] PARTIAL` | HTTP 200 OK, agenda dinamis termuat. Catatan: Tag `<h1>` belum semantik (`BUG-003`). |
| **PUB-004** | Berita & Artikel (`berita.html` & `berita/detail.html`): Grid berita, kategori, tanggal rilis | Local & Live | `[-] PARTIAL` | HTTP 200 OK, sinkron dengan CMS `news`. Catatan: Tag `<h1>` belum semantik (`BUG-003`). |
| **PUB-005** | Pengumuman Resmi (`pengumuman.html`): Daftar surat edaran yayasan & tautan dokumen PDF | Local & Live | `[-] PARTIAL` | HTTP 200 OK, sinkron dengan CMS `announcements`. Tag `<h1>` belum semantik (`BUG-003`). |
| **PUB-006** | Galeri Dokumentasi (`galeri.html`): Masonry grid foto kegiatan sekolah & TPQ | Local & Live | `[-] PARTIAL` | HTTP 200 OK, foto termuat dari Supabase & Unsplash. Tag `<h1>` belum semantik (`BUG-003`). |
| **PUB-007** | Kontak & Lokasi (`kontak.html`): Peta Google Maps, formulir pesan, kontak WhatsApp/Telepon | Local & Live | `[-] PARTIAL` | HTTP 200 OK, kontak Samarinda sesuai identitas. Tag `<h1>` belum semantik (`BUG-003`). |
| **PUB-008** | Floating Action Button WhatsApp (`bottom-6 right-6`): Tautan langsung ke nomor admin yayasan | Local & Live | `[x] PASS` | Tombol hijau floating tampil konsisten di kanan bawah layar tanpa menutupi konten. |
| **PUB-009** | Floating Button Q/A Assistant (`bottom-24 right-6`): Tombol akses chatbot di atas WhatsApp | Local & Live | `[x] PASS` | Tombol biru floating tampil rapi bertumpuk di atas tombol WA, icon robot interaktif. |
| **PUB-010** | Q/A Chatbot - Intent Sapaan & Identitas: "Halo", "Siapa Anda?", "Tugas Anda apa?" | Local Browser | `[x] PASS` | Chatbot merespons sopan sebagai Asisten Informasi Resmi Yayasan At Tarbiyyah. |
| **PUB-011** | Q/A Chatbot - Intent PPDB & Syarat: "Kapan PPDB buka?", "Syarat berkas apa saja?" | Local Browser | `[x] PASS` | Chatbot menyajikan rincian jadwal, dokumen (Foto, Akta, KK), dan tautan ke halaman PPDB. |
| **PUB-012** | Q/A Chatbot - Scope Guard: Penanganan pertanyaan di luar konteks yayasan | Local Browser | `[x] PASS` | Chatbot secara sopan membatasi diri pada ruang lingkup yayasan dan mengarahkan ke admin. |

---

## 2. Modul Sistem PPDB Online & Calon Siswa

| ID | Fitur / Skenario Pengujian | Lingkungan Uji | Status | Bukti & Catatan Pengujian |
| :--- | :--- | :--- | :---: | :--- |
| **PPD-001** | Informasi Persyaratan PPDB (`ppdb.html`): Restrukturisasi 3 berkas (Pasfoto, Akta, KK) | Local & Live | `[x] PASS` | Informasi berkas telah bersih dari unsur internal yayasan (NIS/password). |
| **PPD-002** | Validasi Field Wajib Formulir PPDB: Uji pengiriman data formulir kosong `{}` | Local Browser | `[ ] FAIL` | **Kritis (`BUG-002`)**: Submit kosong diterima dan membuat record sampah `REG-2026-7233`. |
| **PPD-003** | Pendaftaran Calon Siswa Lengkap: Input identitas santri, orang tua, kontak, dan alamat | Local Browser | `[x] PASS` | Berhasil diajukan. Menerbitkan nomor registrasi resmi `REG-2026-6951` di Supabase. |
| **PPD-004** | Pengunggahan Berkas Persyaratan Digital: Unggah foto 3x4, akta kelahiran, dan kartu keluarga | Local Browser | `[x] PASS` | URL dokumen tersimpan di `ppdb_registrations` dan ditautkan ke `student_documents`. |
| **PPD-005** | Pembuatan Akun Portal Calon Siswa Otomatis: Akun login langsung aktif pasca-submit | Local Browser | `[x] PASS` | Akun pendaftar dibuat di tabel `users` dengan hak akses `calon_siswa`. |
| **PPD-006** | Keamanan Penyimpanan Kredensial Metadata: Pemeriksaan string teks catatan registrasi | Database Supabase | `[ ] FAIL` | **Major (`BUG-005`)**: Format `account.initial_password` bocor ke kolom `notes` pendaftar. |
| **PPD-007** | Pelacakan Status Calon Siswa (`ppdb/status.html`): Pengecekan nomor `REG-2026-6951` status pending | Local Browser | `[x] PASS` | Halaman status menampilkan lencana kuning "Menunggu Verifikasi Administrasi". |
| **PPD-008** | Pelacakan Status Pasca-Konversi: Pengecekan status setelah santri resmi diterima | Local Browser | `[x] PASS` | Menampilkan lencana hijau "Diterima / Siswa Aktif", menyajikan NIS `2026001` & nama kelas. |

---

## 3. Modul Portal Admin — Otentikasi & Keamanan (RBAC)

| ID | Fitur / Skenario Pengujian | Lingkungan Uji | Status | Bukti & Catatan Pengujian |
| :--- | :--- | :--- | :---: | :--- |
| **ADM-001** | Antarmuka Login Terpadu (`login.html`): Desain bersih dengan opsi tab Email / NIS | Local & Live | `[-] PARTIAL` | HTTP 200 OK. Catatan: Fallback logo mengarah ke path 404 `public/images/logo.png` (`BUG-001`). |
| **ADM-002** | Proteksi Password Salah: Login admin dengan password yang tidak cocok | Local Browser | `[x] PASS` | Request ditolak dengan pesan error yang aman, tidak membocorkan hash password. |
| **ADM-003** | Login Berhasil Super Admin: `admin@yayasan.sch.id` / `230400` | Local Browser | `[x] PASS` | Berhasil login. Sesi token `siy_token` disimpan, role `super_admin` terverifikasi. |
| **ADM-004** | Salted Hash Password & Lazy Migration: Validasi hashing Web Crypto SHA-256 | Database Supabase | `[x] PASS` | Password diverifikasi dengan garam acak 16-byte, upgrade otomatis dari plaintext legacy. |
| **ADM-005** | Route Guard Admin Portal: Akses langsung ke `/admin/*` tanpa sesi login | Local Browser | `[x] PASS` | Pengguna tanpa token otomatis dialihkan kembali ke `/login.html`. |
| **ADM-006** | Logout Admin: Pembersihan token dan data sesi di penyimpanan lokal | Local Browser | `[x] PASS` | Sesi dibersihkan dari `localStorage`, pengguna dialihkan ke halaman login. |

---

## 4. Modul Portal Admin — Master Data (Guru, Kelas & Lembaga)

| ID | Fitur / Skenario Pengujian | Lingkungan Uji | Status | Bukti & Catatan Pengujian |
| :--- | :--- | :--- | :---: | :--- |
| **MST-001** | Informasi Lembaga & Sekolah (`admin/cms_setting.html`): Cek tabel `schools` | Local Browser | `[x] PASS` | Profil Yayasan At Tarbiyyah termuat dari tabel `schools` di Supabase. |
| **MST-002** | Pengaturan Jadwal PPDB: Buka / tutup periode penerimaan dan tanggal gelombang | Local Browser | `[x] PASS` | Perubahan jadwal tersimpan di tabel `ppdb_periods`, aksi tercatat di audit log. |
| **MST-003** | Tambah Guru Baru (`admin/teachers.html`): Pembuatan data pendidik | Local Browser | `[x] PASS` | Guru `[SIMULASI] Ustadz Ahmad Fauzi` tersimpan di `teachers` (ID: `TEA-20574`). |
| **MST-004** | Tambah Rombel / Kelas (`admin/classes.html`): Pembuatan rombongan belajar baru | Local Browser | `[x] PASS` | Kelas `[SIMULASI] TPQ Al-Hikmah Pagi` tersimpan di `classes` (ID: `CLS-0594`). |
| **MST-005** | Penugasan Wali Kelas: Menghubungkan guru ke rombel kelas yang dibina | Local Browser | `[x] PASS` | `homeroom_teacher_id` dan `teacher_name` terhubung otomatis di tabel `classes`. |

---

## 5. Modul Portal Admin — Pengelolaan & Konversi PPDB

| ID | Fitur / Skenario Pengujian | Lingkungan Uji | Status | Bukti & Catatan Pengujian |
| :--- | :--- | :--- | :---: | :--- |
| **ADM-PPD-001** | Daftar Pendaftar PPDB (`admin/ppdb.html`): Query registrasi masuk | Local Browser | `[x] PASS` | Pendaftar `REG-2026-6951` termuat lengkap beserta rincian jenjang dan kontak. |
| **ADM-PPD-002** | Filter Jenjang & Status PPDB: Filter berdasarkan `pending`, `accepted`, `rejected` | Local Browser | `[-] PARTIAL` | Filter berjalan, namun format variatif jenjang membutuhkan penanganan khusus (`BUG-006`). |
| **ADM-PPD-003** | Peninjauan Berkas Persyaratan Calon Santri: Modal preview foto, akta, dan kartu keluarga | Local Browser | `[x] PASS` | Ketiga dokumen pendukung dapat dilihat langsung oleh petugas Tata Usaha. |
| **ADM-PPD-004** | Persetujuan Penerimaan (Keputusan TU): Mengubah status menjadi `accepted` | Local Browser | `[x] PASS` | Status pendaftar berubah menjadi `accepted`, aksi tercatat di `activity_logs`. |
| **ADM-PPD-005** | Penolakan Calon Santri: Menolak pendaftar dengan mencantumkan alasan resmi | Local Browser | `[x] PASS` | Status berubah menjadi `rejected`, catatan alasan tersimpan pada metadata pendaftar. |
| **ADM-PPD-006** | Konversi Calon Siswa ke Siswa Aktif: Input NIS `2026001` & pemilihan kelas rombel | Local Browser | `[x] PASS` | Status pendaftar berubah menjadi `converted`, NIS tercatat di `converted_nis`. |
| **ADM-PPD-007** | Pembuatan Record Siswa Aktif (`students`): Pemindahan data biodata pendaftar | Database Supabase | `[x] PASS` | Record `STU-1793673254202` aktif dengan NIS `2026001` dan kelas `TPQ Al-Hikmah Pagi`. |
| **ADM-PPD-008** | Peningkatan Hak Akses User Siswa (`users`): Role upgrade calon siswa | Database Supabase | `[x] PASS` | Role pengguna `USR-1793673254202` naik menjadi `siswa_aktif`. |
| **ADM-PPD-009** | Penerbitan Otomatis Tagihan SPP Bulan Berjalan: Otomasi penagihan awal | Database Supabase | `[x] PASS` | Invoice `INV-820774` senilai Rp 150.000 terbit otomatis pada tabel `invoices`. |
| **ADM-PPD-010** | Hubungan Berkas Siswa Aktif (`student_documents`): Migrasi dokumen persyaratan | Database Supabase | `[x] PASS` | 3 dokumen PPDB terhubung permanen ke siswa aktif dengan status `is_verified: true`. |
| **ADM-PPD-011** | Idempotensi Konversi: Upaya konversi ulang untuk pendaftar yang telah aktif | Local Browser | `[x] PASS` | Ditolak oleh sistem bisnis, mencegah duplikasi NIS dan penggandaan akun. |

---

## 6. Modul Keuangan & Pembayaran SPP

| ID | Fitur / Skenario Pengujian | Lingkungan Uji | Status | Bukti & Catatan Pengujian |
| :--- | :--- | :--- | :---: | :--- |
| **FIN-001** | Daftar Tagihan SPP Admin (`admin/payments.html`): Memuat invoice seluruh siswa | Local Browser | `[x] PASS` | Menampilkan tagihan siswa baru, status pelunasan, dan jatuh tempo. |
| **FIN-002** | Pengajuan Bukti Bayar Siswa: Siswa mengunggah foto bukti transfer | Local Browser | `[x] PASS` | Record tersimpan di `payments` (ID: `PAY-1793673820854`) status `menunggu_verifikasi`. |
| **FIN-003** | Verifikasi Pembayaran Admin TU: Admin menyetujui bukti bayar yang masuk | Local Browser | `[x] PASS` | Status pembayaran berubah menjadi `verified` dengan verifikator tercatat. |
| **FIN-004** | Sinkronisasi Status Invoice Pasca-Verifikasi: Transisi tagihan menjadi `paid` | Database Supabase | `[ ] FAIL` | **Kritis (`BUG-004`)**: Race condition membuat status invoice tertinggal di `menunggu_verifikasi`. |
| **FIN-005** | Ringkasan Keuangan Dashboard: Kalkulasi total tagihan, pelunasan, dan tunggakan | Local Browser | `[x] PASS` | Perhitungan total tagihan, lunas, dan saldo tunggakan terakumulasi secara akurat. |

---

## 7. Modul Portal Siswa

| ID | Fitur / Skenario Pengujian | Lingkungan Uji | Status | Bukti & Catatan Pengujian |
| :--- | :--- | :--- | :---: | :--- |
| **STU-001** | Login Siswa - NIS + Password Pendaftaran: Login santri baru dengan sandi kustom | Local Browser | `[x] PASS` | Berhasil login dengan NIS `2026001` dan password `Password123!`. |
| **STU-002** | Login Siswa - Fallback Tanggal Lahir: Login santri baru dengan format DDMMYYYY | Local Browser | `[x] PASS` | Berhasil login dengan NIS `2026001` dan tanggal lahir `12052018`. |
| **STU-003** | Dashboard Santri (`siswa/dashboard.html`): Ringkasan informasi akademik siswa | Local Browser | `[x] PASS` | Menampilkan sapaan santri, rombel kelas, nama wali kelas, dan status keaktifan. |
| **STU-004** | Biodata Santri (`siswa/biodata.html`): Data pribadi, NIK, alamat, nama ayah/ibu | Local Browser | `[x] PASS` | Seluruh data pendaftaran tersaji lengkap dan akurat sesuai data database. |
| **STU-005** | Kartu SPP Siswa (`siswa/spp.html`): Daftar tagihan bulanan dan formulir konfirmasi bayar | Local Browser | `[x] PASS` | Menampilkan invoice aktif, nominal tagihan, dan riwayat transaksi. |
| **STU-006** | Berkas Dokumen Persyaratan (`siswa/dokumen.html`): Repositori berkas digital | Local Browser | `[x] PASS` | Menampilkan foto santri, salinan akta, dan kartu keluarga yang telah diverifikasi. |

---

## 8. Modul Rekapitulasi Laporan & Audit Trail

| ID | Fitur / Skenario Pengujian | Lingkungan Uji | Status | Bukti & Catatan Pengujian |
| :--- | :--- | :--- | :---: | :--- |
| **REP-001** | Laporan Data Siswa Aktif (`admin/reports.html`): Rekapitulasi rombel dan jenjang | Local Browser | `[x] PASS` | Menghasilkan rekap 1 siswa aktif dalam rombel `[SIMULASI] TPQ Al-Hikmah Pagi`. |
| **REP-002** | Laporan Penerimaan PPDB: Rekapitulasi calon santri per status dan periode | Local Browser | `[x] PASS` | Menghasilkan rekap pendaftar diterima dan dikonversi sesuai database. |
| **REP-003** | Laporan Keuangan SPP: Rekapitulasi penerimaan kas pembayaran SPP per bulan | Local Browser | `[x] PASS` | Menyajikan data penerimaan riil dari tagihan yang telah disetujui TU. |
| **REP-004** | Cetak & Ekspor Laporan: Fungsi preview cetak resmi dengan kop surat yayasan | Local Browser | `[x] PASS` | Template cetak menyertakan kop resmi Yayasan At Tarbiyyah Samarinda. |
| **LOG-001** | Pencatatan Log Aktivitas Sistem (`activity_logs`): Perekaman mutasi data penting | Database Supabase | `[-] PARTIAL` | Log `APPROVE_PPDB` & `CONVERT_SISWA` tercatat pada kolom `details` (`BUG-007`). |

---

## 9. Rekapitulasi Akhir Pengujian Modul

| Kategori Modul | Total Uji | PASS | PARTIAL | FAIL | Persentase Lolos |
| :--- | :---: | :---: | :---: | :---: | :---: |
| 1. Website Publik & Q/A Assistant | 12 | 6 | 6 | 0 | 50.0% Penuh (100% Fungsi) |
| 2. Sistem PPDB Online | 8 | 6 | 0 | 2 | 75.0% |
| 3. Portal Admin - Keamanan & RBAC | 6 | 5 | 1 | 0 | 83.3% |
| 4. Portal Admin - Master Data | 5 | 5 | 0 | 0 | 100.0% |
| 5. Portal Admin - Pengelolaan PPDB | 11 | 10 | 1 | 0 | 90.9% |
| 6. Modul Keuangan & Pembayaran SPP | 5 | 4 | 0 | 1 | 80.0% |
| 7. Portal Siswa | 6 | 6 | 0 | 0 | 100.0% |
| 8. Laporan & Audit Trail | 5 | 4 | 1 | 0 | 80.0% |
| **TOTAL KESELURUHAN** | **58** | **46** | **9** | **3** | **79.3% Lolos Mutlak** |

---
*Daftar periksa ini merupakan rekaman verifikasi komprehensif atas kesiapan rilis operasional sistem informasi Yayasan At Tarbiyyah Wijaya Kusuma Samarinda.*

