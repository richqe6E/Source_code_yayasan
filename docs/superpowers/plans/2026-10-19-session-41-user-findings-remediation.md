# Rencana Implementasi Pembenahan Sistem & Sinkronisasi Menyeluruh (Sesi 41)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Memperbaiki 17 temuan hasil audit manual pengguna pada portal admin, portal siswa, dan website publik SIYAYASAN V2; menuntaskan cacat fallback dummy data yang menimpa penghapusan konten; serta mengintegrasikan Visi, Misi, Program, dan Struktur Organisasi dengan arsitektur *Single Source of Truth*.

**Architecture:** Memperbaiki adapter API di `frontend/shared/js/api.js` dan `frontend/local-api.js`, menyempurnakan `shell.js` untuk navigasi dan modal profil/avatar, memperbaiki syntax error pada `admin/ppdb.html`, menghilangkan anti-pattern fallback dummy di halaman publik (`agenda.html`, `berita.html`, `pengumuman.html`, `galeri.html`), serta menyediakan modul CMS terpadu di admin untuk mengelola Visi Misi, Sejarah, Kurikulum, Jam Operasional, dan Bagan Organisasi Pohon (*Org Tree Chart*).

**Tech Stack:** Vanilla JavaScript (ES6+), HTML5 Semantik, Tailwind CSS + Vanilla CSS (Oceanic Blue: `#0284c7`, `#0ea5e9`, `#0369a1`), Supabase REST API & Storage, Node.js HTTP dev-server & automated test harness.

---

## Global Constraints
- **Zero-Green Rule (Oceanic Blue):** Seluruh elemen visual UI baru harus menggunakan palet biru bahari (`#0284c7`, `#0ea5e9`, `#0369a1`), tanpa aksen hijau/emerald.
- **Arsitektur 2-Portal Tetap:** Hanya Portal Administrator & Portal Siswa Mandiri yang aktif. Portal guru & ortu tetap diarsipkan.
- **Single Source of Truth:** Data institusi (Visi, Misi, Program, Jam Operasional, Struktur Organisasi) dikelola dari satu tempat di admin dan tersinkronisasi otomatis ke seluruh halaman publik (`index.html`, `profil.html`, `kontak.html`, dll.).
- **Zero Dummy Data Injection:** Jika database kosong (0 data berita, agenda, pengumuman, galeri), halaman publik wajib menampilkan *Empty State* resmi yang elegan, bukan menginjeksi paksa data dummy/mock bawaan.
- **Test-Driven Development (TDD):** Setiap batch perubahan wajib divalidasi dengan suite pengujian otomatis Node.js sebelum dinyatakan selesai.

---

## Daftar Lengkap 17 Temuan & Rencana Batch

### Batch 1: Bug Kritis, Keamanan Autentikasi & Query Data
- **Task 1.1:** Perbaikan SyntaxError pada fungsi `convertReg` di `frontend/portal/admin/ppdb.html` (Temuan 1).
- **Task 1.2:** Perbaikan kueri dokumen santri di `frontend/shared/js/api.js` dengan menghapus filter `student_nis` fiktif agar berkas tampil di modal detail admin (Temuan 7).
- **Task 1.3:** Penguncian Role Login (RBAC Guard) dan modal bantuan dinamis kontekstual di `frontend/public/login.html` (Temuan 9).

### Batch 2: UX Interaktivitas, Profil Pengguna & Navigasi Portal
- **Task 2.1:** Modernisasi Tombol Refresh dengan micro-animation spin 360° dan feedback klik di `frontend/shared/js/shell.js` (Temuan 2).
- **Task 2.2:** Perbaikan Ikon Navigasi Siswa di `frontend/shared/js/shell.js` (hapus simbol burger `☰` dan ganti dengan ikon SVG resmi) (Temuan 3).
- **Task 2.3:** Modal Interaktif 1-Klik Edit Nama & Unggah Foto Profil Avatar Admin & Siswa ke Supabase Storage (Temuan 4).
- **Task 2.4:** Sinkronisasi Nama Siswa di `biodata.html` & `api.js` ke `localStorage.siy_user`, tabel `users`, dan header/sidebar (Temuan 5).
- **Task 2.5:** Feedback interaktif tombol "Refresh Daftar Berkas" di `frontend/portal/siswa/dokumen.html` (Temuan 6).

### Batch 3: Eliminasi Cacat Fallback Dummy & Fleksibilitas Konten Publik
- **Task 3.1:** Perbaikan Logika Konten Publik (Hapus Injeksi Dummy saat Kosong) pada `agenda.html`, `berita.html`, `pengumuman.html`, `galeri.html`, dan `berita/detail.html`, ganti dengan *Empty State* resmi (Temuan 17).
- **Task 3.2:** Pembersihan Terminologi "Kampus" menjadi "Gedung / Lokasi Yayasan" di `cms_setting.html`, `kontak.html`, agenda, dan footer (Temuan 8).
- **Task 3.3:** Modul Jam Operasional Dinamis di CMS Admin dan sinkronisasi ke Halaman Kontak (Temuan 10).
- **Task 3.4:** Persyaratan Berkas PPDB Dinamis & Tampilan Accordion Buka-Tutup Beranimasi di `ppdb.html` (Temuan 11).

### Batch 4: Penyelarasan Total Profil & Beranda Utama (Single Source of Truth)
- **Task 4.1:** Panel Terpadu Visi & Misi Dinamis di Admin (`content.html` / `cms_setting.html`) dengan butir-butir misi yang bisa ditambah/diedit/dihapus (Temuan 14).
- **Task 4.2:** Sinkronisasi Visi & Misi Serempak ke Beranda Utama (`index.html`) dan Profil (`profil.html`) (Temuan 14 & 16).
- **Task 4.3:** Diagram Pohon Struktur Organisasi (*Org Tree Chart*) warna putih bersih beraksen Oceanic Blue di `profil.html` dan panel CRUD pengurus di admin (Temuan 12).
- **Task 4.4:** Modul Dinamis Program Pendidikan (PAUD, TK, TPQ) & Kurikulum Unggulan yang tersinkron ke Beranda dan Profil (Temuan 13 & 16).
- **Task 4.5:** Modul Dinamis Sejarah & Latar Belakang Yayasan di Admin dan sinkronisasi ke Profil (Temuan 15).

---

## Rincian Eksekusi Per Task

### Task 1: Batch 1 (Bug Kritis & Keamanan)
**Files to modify:**
- `frontend/portal/admin/ppdb.html`
- `frontend/shared/js/api.js`
- `frontend/public/login.html`
**Files to test:**
- `tests/test-batch-1-critical.js`

- [ ] **Step 1:** Buat file tes `tests/test-batch-1-critical.js` untuk memverifikasi sintaks PPDB admin, kueri dokumen santri tanpa `student_nis`, dan proteksi role login.
- [ ] **Step 2:** Perbaiki `frontend/portal/admin/ppdb.html` baris 649-653 dengan melengkapi kurung penutup `}` dan `};` pada `convertReg`.
- [ ] **Step 3:** Perbaiki `frontend/shared/js/api.js` modul `siswa/documents` dan `admin/students/documents` agar murni memfilter via `student_id`.
- [ ] **Step 4:** Tambahkan pengecekan role `currentLoginMode` di `login.html` agar menolak admin di tab siswa dan menolak siswa di tab admin, serta sesuaikan modal bantuan secara dinamis.
- [ ] **Step 5:** Jalankan `tests/test-batch-1-critical.js` dan pastikan PASS.
- [ ] **Step 6:** Commit: `fix(auth-admin): resolve ppdb syntax, student doc queries, and login role guard`.

---

### Task 2: Batch 2 (UX Portal, Profil & Navigasi)
**Files to modify:**
- `frontend/shared/js/shell.js`
- `frontend/shared/js/api.js`
- `frontend/portal/siswa/biodata.html`
- `frontend/portal/siswa/dokumen.html`
**Files to test:**
- `tests/test-batch-2-portal-ux.js`

- [ ] **Step 1:** Buat file tes `tests/test-batch-2-portal-ux.js` untuk memverifikasi struktur tombol refresh, mapping ikon siswa, modal avatar, dan sinkronisasi nama biodata.
- [ ] **Step 2:** Perbarui tombol Refresh di `shell.js` dengan ikon SVG putar, animasi spin 360°, dan micro-interaction.
- [ ] **Step 3:** Tambahkan mapping ikon SVG resmi untuk menu siswa di `shell.js` (Dashboard, Biodata, SPP, Berkas) dan hapus ikon burger `☰`.
- [ ] **Step 4:** Buat modal 1-klik edit profil dan ganti avatar di `shell.js` yang terhubung ke Supabase Storage via `api.js`.
- [ ] **Step 5:** Perbarui `biodata.html` agar saat simpan, meng-update `localStorage.siy_user` dan `users.full_name` secara serentak.
- [ ] **Step 6:** Beri visual loading feedback pada tombol "Refresh Daftar Berkas" di `dokumen.html`.
- [ ] **Step 7:** Jalankan `tests/test-batch-2-portal-ux.js` dan pastikan PASS.
- [ ] **Step 8:** Commit: `feat(portal-ux): modern refresh button, student nav icons, profile modal, and biodata sync`.

---

### Task 3: Batch 3 (Eliminasi Fallback Dummy & CMS Konten)
**Files to modify:**
- `frontend/public/agenda.html`
- `frontend/public/berita.html`
- `frontend/public/pengumuman.html`
- `frontend/public/galeri.html`
- `frontend/public/berita/detail.html`
- `frontend/portal/admin/cms_setting.html`
- `frontend/public/kontak.html`
- `frontend/public/ppdb.html`
- `frontend/portal/admin/ppdb.html`
**Files to test:**
- `tests/test-batch-3-cms-fallback.js`

- [ ] **Step 1:** Buat file tes `tests/test-batch-3-cms-fallback.js` untuk memverifikasi bahwa ketika data API kosong (`[]`), halaman publik merender Empty State resmi dan TIDAK merender dummy data.
- [ ] **Step 2:** Hapus injeksi array dummy di `agenda.html`, `berita.html`, `pengumuman.html`, `galeri.html`, dan `berita/detail.html`. Gantikan dengan tampilan *Empty State* (ikon + pesan informatif).
- [ ] **Step 3:** Ganti istilah "Kampus" menjadi "Gedung / Lokasi Yayasan" di seluruh template publik dan CMS.
- [ ] **Step 4:** Buat form Jam Operasional Pelayanan di `cms_setting.html` dan render dinamis di `kontak.html`.
- [ ] **Step 5:** Buat form persyaratan berkas di modal periode admin `admin/ppdb.html` dan render sebagai Accordion buka-tutup interaktif di `ppdb.html`.
- [ ] **Step 6:** Jalankan `tests/test-batch-3-cms-fallback.js` dan pastikan PASS.
- [ ] **Step 7:** Commit: `fix(public-cms): eliminate dummy fallback, clean terminology, dynamic hours, and ppdb accordion`.

---

### Task 4: Batch 4 (Penyelarasan Total Profil & Beranda Visi Misi)
**Files to modify:**
- `frontend/portal/admin/content.html`
- `frontend/shared/js/api.js`
- `frontend/local-api.js`
- `frontend/public/index.html`
- `frontend/public/profil.html`
**Files to test:**
- `tests/test-batch-4-profile-alignment.js`

- [ ] **Step 1:** Buat file tes `tests/test-batch-4-profile-alignment.js` untuk memverifikasi keselarasan Visi Misi, Sejarah, Kurikulum, dan Struktur Organisasi antara admin, beranda, dan profil.
- [ ] **Step 2:** Di `content.html` / `cms_setting.html`, bangun tab/panel "Profil & Visi Misi Yayasan" yang mencakup:
  * Form Visi Lembaga
  * List Repeater Butir Misi (Tambah, Edit, Hapus, Urutkan)
  * Form Sejarah & Latar Belakang Yayasan
  * Form Kurikulum & Program Pendidikan
  * Form Manajemen Struktur Pengurus Organisasi
- [ ] **Step 3:** Di `frontend/public/index.html`, ubah section Visi Misi dan Program agar merender dinamis dari `web_settings` Supabase.
- [ ] **Step 4:** Di `frontend/public/profil.html`, ubah section Visi Misi, Sejarah, Kurikulum, dan bangun Diagram Pohon (*Org Tree Chart*) warna putih Oceanic Blue yang membaca data terpusat.
- [ ] **Step 5:** Jalankan `tests/test-batch-4-profile-alignment.js` dan pastikan PASS.
- [ ] **Step 6:** Commit: `feat(profile-sync): implement single source of truth for visi misi, org tree chart, and curriculum`.

---

### Task 5: Regresi Penuh, Verifikasi E2E & SOP Penutupan
- [ ] **Step 1:** Jalankan seluruh pengujian regresi: `tests/test-batch-1-critical.js`, `tests/test-batch-2-portal-ux.js`, `tests/test-batch-3-cms-fallback.js`, `tests/test-batch-4-profile-alignment.js`, dan tes end-to-end `test-cms-e2e.js`.
- [ ] **Step 2:** Jalankan audit komprehensif seluruh fitur (`audit-all-features.js`) untuk memastikan semua 34 fitur tetap 100% lulus.
- [ ] **Step 3:** Perbarui `PROJECT_STATUS.md` dan `PROJECT_CONTEXT_CHECKPOINT.md` sesuai SOP.
- [ ] **Step 4:** Git commit akhir dan git push ke `origin/main`.
