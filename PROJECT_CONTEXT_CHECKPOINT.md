# 📌 DOKUMEN KONTEKS & CHECKPOINT RESMI PROYEK SIYAYASAN V2
**Terakhir Diperbarui:** 19 Oktober 2026 (Sesi 42 — Remediasi 4 Tahap Terpadu: Penyiapan Skema Database, Keamanan Privasi & Preservasi Sandi PPDB, Sinkronisasi Rombel Kelas & Anti-Duplikasi SPP, Serta Simulasi Siklus Penuh E2E)  
**Status Sistem:** ✅ Production & Database 100% Operasional, Live Verified (Vercel & Supabase Cloud).

---

## 🎯 1. Ringkasan & Arsitektur Utama Sistem
Sistem Informasi Manajemen & Portal Website Yayasan (PAUD, TK, TPQ Samarinda) dirancang dengan arsitektur **Lean & Terkoordinasi**, terdiri dari 2 portal inti:
1. **Portal Admin & Staf TU** (`frontend/portal/admin/`):
   - Mengelola PPDB (Penerimaan Peserta Didik Baru), Keuangan SPP & Infaq, Kelas & Rombel, Data Siswa Aktif, Guru/Tenaga Pendidik, CMS Konten Website (Berita, Pengumuman, Agenda, Galeri), CMS Pengaturan Website & Tampilan, Audit Logs, Laporan Ekspor/Impor, dan Backup Database.
2. **Portal Siswa & Wali Murid** (`frontend/portal/siswa/`):
   - Mengelola pendaftaran/biodata calon santri, upload berkas persyaratan, pelacakan seleksi PPDB (4-step tracker), rincian kewajiban SPP & konfirmasi bayar transfer, cetak kuitansi dengan format terbilang resmi Indonesia, dan unduh berkas dokumen sekolah.
3. **Website Publik Utama** (`frontend/public/`):
   - Beranda, Profil Yayasan, Berita, Pengumuman, Agenda, Galeri, Kontak & Peta Interaktif Google Maps, serta Formulir PPDB Online 5 tahap dengan sinkronisasi langsung ke Supabase.

---

## ⚖️ 2. Keputusan Arsitektur Kunci yang Berlaku
1. **Rapor Akademik Siswa Ditiadakan:**
   - **Keputusan:** Halaman rapor elektronik di portal siswa resmi **ditiadakan**.
   - **Rasional:** Tidak ada Portal Guru dalam sistem yayasan ini. Evaluasi santri usia dini (STPPA 6 Aspek) berupa rapor fisik yang diserahkan guru langsung ke orang tua santri saat pertemuan akhir semester.
   - **Arsip Digital:** Jika sekolah ingin membagikan scan PDF ijazah/rapor, didistribusikan melalui menu **Berkas Dokumen** (`dokumen.html`). Rute lama `akademik.html` dialihkan secara mulus ke `dashboard.html`.
2. **Aturan Palet Warna Zero-Green (Oceanic Blue):**
   - **Keputusan:** Seluruh aksen warna hijau (`emerald`, `green`, `teal`) dihilangkan dari seluruh halaman portal admin dan siswa.
   - **Standar:** Menggunakan palet Oceanic Blue (`#0284c7`, `#0ea5e9`, `#0369a1`, `#e0f2fe`) untuk status lunas, aktif, disetujui, dan elemen brand yayasan.
3. **Pengaturan Lokasi, Alamat & Google Maps Dinamis Tanpa Koding:**
   - **Keputusan:** Alamat fisik, catatan kampus, tautan langsung Google Maps, dan URL iframe embed peta Google Maps dapat diubah sewaktu-waktu oleh pihak Admin/TU melalui formulir visual di **CMS Pengaturan Website** (`cms_setting.html`) dan **Profil Lembaga** (`content.html`).
4. **Skema Storage & Basis Data Supabase Cloud:**
   - **Database:** Menggunakan 16 tabel relasional PostgreSQL di Supabase Cloud (`users`, `students`, `teachers`, `classes`, `invoices`, `payments`, `ppdb_registrations`, `ppdb_periods`, `student_documents`, `news`, `announcements`, `events`, `galleries`, `schools`, `activity_logs`, `contact_messages`).
   - **Storage:** Bucket `siyayasan-uploads` aktif dengan kebijakan public access untuk file bukti transfer, foto profil, dokumen santri, dan aset konten.
   - **Graceful Fallback:** Jika koneksi Supabase terputus, sistem otomatis berpindah ke `localStorage` tanpa menimbulkan crash layar.
5. **Visibilitas Kartu Formulir PPDB Dinamis Berbasis Status Admin:**
   - **Keputusan:** Saat admin menutup pendaftaran PPDB (`status = closed`), kartu formulir pendaftaran diri (`#formulir-pendaftaran`) disembunyikan sepenuhnya dari website publik, dan digantikan oleh kartu pemberitahuan pendaftaran ditutup beserta linimasa jadwal. Saat admin membuka kembali PPDB (`status = open`), kartu formulir otomatis muncul kembali.

---

## 🛠️ 3. Remediasi 12 Kerentanan Audit Komprehensif (Sesi 37)
Seluruh 12 temuan dari laporan audit telah diremediasi secara tuntas melalui **Plan B (Implementasi Bertahap Berlapis)**:

### 🔹 Batch 1: Pondasi Adapter Supabase & Integrasi Skema
- **BUG-01:** Menambahkan batas waktu (`timeout` 8s read, 15s write, 25s storage) di `frontend/shared/js/api.js` untuk mencegah hanging UI saat jaringan terputus.
- **BUG-02:** Menghapus payload Base64 raksasa dari kolom JSONB `cleanMeta` sebelum disimpan ke tabel `student_documents`.
- **BUG-03:** Memperbaiki hardcoded period ID `1` pada `update_period` di `api.js` menjadi dinamis sesuai parameter pemanggilan.
- **BUG-04:** Memperbaiki filter status PPDB di `api.js` agar mendukung pencarian multi-status `status=in.(approved,accepted)`.
- **BUG-05:** Menstandarkan respon `payments/summary` agar menyediakan kunci ganda (`total_amount`/`total_revenue`, `paid_amount`/`total_paid`, `unpaid_amount`/`total_unpaid`, `pending_amount`/`total_pending`).
- **BUG-06:** Menginjeksi tag `<script src="../../shared/js/supabase-config.js"></script>` pada seluruh 12 file HTML portal admin agar adapter Supabase selalu siap pakai.
- **BUG-11:** Menghapus blok dead-code duplikat di `frontend/portal/admin/dashboard.html`.
- **Tambahan:** Menghubungkan modul `backup/restore` langsung ke Supabase dengan metode `upsert`, dan memetakan field `activity_logs` (`details`, `entity_type`).

### 🔹 Batch 2: Alur Kritis PPDB, Dokumen Santri & Kontak
- **BUG-07:** Memperbaiki modal sukses konversi siswa baru di `ppdb.html` dengan mendeklarasikan variabel `defaultPassword` dan `loginUrl`.
- **Penyelarasan PPDB Publik:** Form registrasi online publik (`frontend/public/js/app.js`) menyinkronkan seluruh biodata lengkap santri ke tabel `ppdb_registrations` dan meregistrasikan berkas dokumen ke tabel `student_documents`.
- **Dynamic 4-Step Tracker:** Halaman `frontend/portal/siswa/dashboard.html` menyajikan visual status seleksi PPDB 4 tahap (`Pendaftaran` -> `Verifikasi Berkas` -> `Wawancara & Seleksi` -> `Diterima / Registrasi Ulang`).
- **Standardisasi Kontak:** Menstandarkan format nomor WhatsApp ke format internasional `62...` di `kontak.html` dan menyimpan pesan formulir ke tabel `contact_messages`.

### 🔹 Batch 3: Konsistensi Antarmuka Admin & Siswa
- **Manajemen Konten:** Memprioritaskan field `status` di atas boolean `is_published` pada `content.html`, serta menambahkan tombol hapus galeri.
- **Manajemen Pengguna:** Membatasi pilihan role di `users.html` hanya pada role aktif 2-portal (`super_admin`, `admin`, `siswa_aktif`, `calon_siswa`) dan menambahkan aksi hapus user (`deleteUser`).
- **Manajemen Kelas:** Menambahkan jenjang `TK` dan `TPQ` pada formulir kelas (`classes.html`).
- **Manajemen Guru:** Menambahkan tombol hapus guru dan filter pencarian berbasis NIP di `teachers.html`.
- **Format Kuitansi Resmi:** Menambahkan generator terbilang Bahasa Indonesia (`angkaKeTerbilang`) pada kuitansi pembayaran SPP di `payments.html` (Admin) dan `spp.html` (Siswa).

### 🔹 Batch 4: Penegakan Zero-Green Rule & Audit Palet
- Mengaudit seluruh 14 file portal HTML (`10 portal admin` + `4 portal siswa`).
- Menghapus 113 deklarasi warna hijau/emerald/teal dan mengonversinya ke palet Oceanic Blue (`#0284c7`, `#0ea5e9`, `#0369a1`).

---

## 🛠️ 3.1. Remediasi 17 Temuan Audit Pengguna (Sesi 41 — TDD 4 Batch)
1. **Batch 1 (Bug Kritis & Keamanan — Commit `4607f13`):**
   - SyntaxError pada `ppdb.html` diperbaiki.
   - Kueri dokumen santri di `api.js` dibersihkan dari kolom fiktif `student_nis.eq`.
   - Isolasi role login di `login.html` mencegah tab siswa dimasuki email admin dan sebaliknya, plus modal bantuan kontekstual.
   - Uji unit: `tests/test-batch-1-critical.js` 100% LULUS.
2. **Batch 2 (UX Portal, Profil 1-Klik & Navigasi — Commit `5335d5c`):**
   - Tombol refresh modern 360° tactile state di `shell.js` dan `dokumen.html`.
   - Ikon resmi siswa `STUDENT_ICONS` di `shell.js` dan emoji duplikat dibersihkan.
   - Modal profil 1-klik di header portal untuk ganti nama dan upload avatar seketika.
   - Sinkronisasi instan nama santri di `biodata.html` ke `localStorage.siy_user` dan database.
   - Uji unit: `tests/test-batch-2-portal-ux.js` 100% LULUS.
3. **Batch 3 (Eliminasi Fallback Dummy, Standarisasi Terminologi, Jam Operasional Dinamis, & Accordion PPDB — Commit `d4d0e54`):**
   - Logika pemaksaan data dummy saat konten kosong dihapus total di `agenda.html`, `berita.html`, `pengumuman.html`, dan `galeri.html`; diganti *Empty State* resmi.
   - Istilah "Kampus" distandarkan menjadi "Gedung Utama Yayasan" / "Lokasi Yayasan".
   - Form Jam Operasional Pelayanan Kantor di `cms_setting.html` disinkronkan ke `kontak.html`.
   - Accordion persyaratan & kelengkapan berkas PPDB interaktif buka-tutup dengan animasi chevron di `ppdb.html`.
   - Uji unit: `tests/test-batch-3-cms-fallback.js` 100% LULUS.
4. **Batch 4 (Penyelarasan Total Profil & Beranda — Single Source of Truth — Commit `b417948`):**
   - Form CMS Profil Lengkap di `content.html` (Visi, Misi, Budaya, Sejarah, Program Pendidikan, Kurikulum Unggulan, Struktur Organisasi).
   - Single Source of Truth Visi & Misi serentak ke Beranda (`index.html`) dan Profil (`profil.html`).
   - Bagan Pohon Organisasi (*Org Tree Chart*) visual 4 level berdesain elegan putih bersih aksen Oceanic Blue di `profil.html`.
   - Propagasi data instan via `api.js` (Supabase `schools`, `web_settings`, dan cache `siy_school_ext`).
   - Uji unit: `tests/test-batch-4-profile-alignment.js` 100% LULUS.

---

## 📊 4. Hasil Uji Otomatis & Status Operasional
Semua test suite dan verifikasi live telah dijalankan dengan hasil **100% LULUS**:
- `tests/test-batch-1-critical.js`: **LULUS 100%** (Remediasi bug sintaks PPDB, kueri dokumen santri, & isolasi role login)
- `tests/test-batch-2-portal-ux.js`: **LULUS 100%** (Tombol refresh 360°, ikon resmi siswa, modal profil 1-klik, & sync nama)
- `tests/test-batch-3-cms-fallback.js`: **LULUS 100%** (Eliminasi fallback dummy, standardisasi istilah kampus, jam operasional, & accordion PPDB)
- `tests/test-batch-4-profile-alignment.js`: **LULUS 100%** (CMS profil lengkap, Single Source of Truth Visi Misi, & bagan pohon organisasi)
- `tests/test-nis-status-flow.js`: **LULUS 100%** (Resolusi NIS calon siswa & warna tombol login kontras)
- `tests/test-auth-password-flow.js`: **LULUS 100%** (Harmonisasi sandi pendaftaran & multi-format validator)
- `tests/test-ppdb-class-filter.js`: **LULUS 100%** (Filter kelas berjenjang otomatis pada modal admin)
- `tests/test-teachers-classes-flow.js`: **LULUS 100%** (Query guru aktif skema riil & dropdown wali kelas lengkap)
- `tests/test-admin-student-docs.js`: **LULUS 100%** (Pratinjau berkas dokumen santri di modal detail admin)
- `tests/test-auto-invoice-flow.js`: **LULUS 100%** (Otomatisasi penerbitan invoice SPP bulan pertama siswa baru)
- `tests/test-content-consistency.js`: **LULUS 100%** (Konsistensi rentang usia PAUD/TK/TPQ & overline tipografi profil)
- `test-batch-1.js`: **LULUS 100%** (8 subtes adapter & timeout)
- `test-batch-2.js`: **LULUS 100%** (8 subtes alur PPDB & dokumen)
- `test-batch-3.js`: **LULUS 100%** (12 subtes konsistensi admin & siswa)
- `test-batch-4.js`: **LULUS 100%** (Zero-Green verification pada 14 file portal)
- `test-phase-1-schema.js`: **LULUS 100%** (Migrasi DDL & Defensive Query Adapter)
- `test-phase-2-privacy-password.js`: **LULUS 100%** (Privasi catatan & preservasi kata sandi PPDB)
- `test-phase-3-classes-spp.js`: **LULUS 100%** (Normalisasi filter rombel & anti-duplikasi SPP)
- `test-phase-4-e2e-simulation.js`: **LULUS 100%** (Simulasi siklus penuh 4 tahap PPDB -> Login Siswa)
- `test-simulation.js`: **LULUS 100%** (Simulasi end-to-end profil & Supabase)
- `audit-all-features.js`: **LULUS 100%** (34/34 skenario fitur penuh 2 portal)
- `test-ppdb-visibility.js`: **LULUS 100%** (15/15 subtes visibilitas kartu buka/tutup)
- `test-routes.js`: **LULUS 100%** (37/37 rute berstatus HTTP 200 OK)
- `test-ppdb-e2e.js`: **LULUS 100%** (11/11 skenario alur PPDB hingga siswa login)
- `test-cms-e2e.js`: **LULUS 100%** (17/17 skenario konten CMS)
- `test-spp-e2e.js`: **LULUS 100%** (13/13 skenario sistem pembayaran SPP)
- **Supabase Cloud Live Test:**
  - 16 Tabel Database: `HTTP 200 OK`
  - Storage Bucket `siyayasan-uploads`: `Upload 200 OK`, `Public Read 200 OK`, `Delete 200 OK`.
- **Vercel Production:**
  - URL: `https://siyayasan-portal.vercel.app` (Status: Ready)

---

## 🚀 5. Cara Menjalankan & Menguji Sistem
1. **Akses Daring (Production Live):**
   - Kunjungi: `https://siyayasan-portal.vercel.app`

2. **Akses Lokal (Pengembangan / Offline):**
   ```bash
   node frontend/dev-server.js
   ```
   Buka peramban: `http://localhost:3000`

3. **Kredensial Akun Login Resmi:**
   - **Super Admin:**
     - URL: `http://localhost:3000/login.html` (Tab Admin)
     - Email: `admin@yayasan.sch.id` | Password: `admin123`
   - **Admin TU:**
     - Email: `tu@yayasan.sch.id` | Password: `tu123456`
   - **Siswa Aktif (Demo):**
     - URL: `http://localhost:3000/login.html` (Tab Siswa)
     - NIS: `2026001` | Password: `2020-03-12` (Tanggal Lahir)

---

## 🗺️ 6. Panduan untuk Sesi Mendatang
1. **Dokumentasi Utama:** Rujuk selalu `PROJECT_STATUS.md` dan `PROJECT_CONTEXT_CHECKPOINT.md` sebelum memulai tugas baru.
2. **Arsitektur 2-Portal:** Jangan mengaktifkan kembali modul Guru atau Orang Tua secara terpisah karena sudah diputuskan tidak digunakan.
3. **Penyimpanan Berkas:** Gunakan selalu Supabase Storage bucket `siyayasan-uploads` untuk aset berkas, bukti transfer, dan foto.
4. **Palet Warna:** Wajib mempertahankan aturan **Zero-Green** (Oceanic Blue) pada seluruh elemen portal baru.
5. **SOP Pembaruan Konteks Permanen:** Wajib selalu memperbarui dokumen pelacakan (`PROJECT_STATUS.md` dan `PROJECT_CONTEXT_CHECKPOINT.md`) setiap kali selesai melakukan audit, analisis, pengembangan, atau eksekusi perubahan apapun agar kontinuitas konteks terjamin 100%.
