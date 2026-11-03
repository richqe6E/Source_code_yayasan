# SIYAYASAN — STUDENT PORTAL REMEDIATION CHANGELOG
**Dokumen Catatan Permanen Perbaikan Keamanan, Autentikasi, Hak Akses & Biodata Siswa**  
*Yayasan At Tarbiyyah Wijaya Kusuma Samarinda*

---

## 1. Ikhtisar Eksekusi & Status per Fase

Dokumen ini melacak seluruh modifikasi kode sumber, endpoint backend, validasi keamanan, serta integrasi antar-portal berdasarkan dokumen arahan pelaksanaan *Approval & Implementation Directive*.

| Fase | Ruang Lingkup | Status | Tanggal / Waktu | Verifikator |
| :--- | :--- | :---: | :---: | :--- |
| **Fase 1** | Standarisasi Autentikasi NIS Murni, Penghapusan Akun Prematur, Karantina Hak Akses & Kata Sandi Awal | **COMPLETED** | 2026-11-03 | Antigravity AI |
| **Fase 2** | Perlindungan Backend Biodata Siswa (Strict Allowlist Kolom Pribadi & Isolasi Hak Akses Akademik) | **COMPLETED** | 2026-11-03 | Antigravity AI |
| **Fase 3** | Restrukturisasi Tampilan Biodata Portal Siswa (Pemisahan Mandiri Data Wali & Keterangan Tambahan) | **COMPLETED** | 2026-11-03 | Antigravity AI |
| **Fase 4** | Integrasi Alur Konversi PPDB, Penerbitan Akun Idempoten, Sinkronisasi SPP & Pembersihan Status PPDB | **COMPLETED** | 2026-11-03 | Antigravity AI |
| **Fase 5** | Regression Testing Menyeluruh (13 Skenario Pengujian Operasional & Verifikasi Akhir) | **COMPLETED** | 2026-11-03 | Antigravity AI |

---

## 2. Rincian Perubahan Kode Sumber per Fase

### A. Fase 1: Standarisasi Autentikasi NIS Murni & Karantina Hak Akses
1. **Penghapusan Pembuatan Akun Prematur (`frontend/shared/js/api.js` - `ppdb.submit`)**:
   - Menghapus pembuatan user di tabel `users` saat formulir PPDB dikirim secara publik.
   - Menghapus pembuatan profil di tabel `students` sebelum siswa resmi diterima dan diaktivasi.
   - Menghapus penyimpanan otomatis token login calon siswa ke `localStorage` (`siy_token` & `siy_user`).
   - Pendaftaran PPDB kini murni hanya membuat entri berstatus `pending` di tabel `ppdb_registrations`.
2. **Penolakan Nomor Registrasi di Login Siswa (`frontend/shared/js/api.js` & `login.html`)**:
   - Menambahkan guard penolakan langsung apabila input login diawali string `REG-` atau `REG`. Sistem mengembalikan pesan edukatif bahwa Nomor Registrasi hanya diperuntukkan untuk memantau status seleksi di halaman Cek Status PPDB.
   - Di `frontend/public/login.html`, tab siswa diperbarui labelnya menjadi `Nomor Induk Siswa (NIS) *` dengan placeholder `Contoh: 2026001`.
3. **Karantina Hak Akses Role Calon Siswa (`frontend/shared/js/auth.js`)**:
   - Menghapus role `calon_siswa` dan `pendaftar` dari daftar `siswaRoles` di `requireAuth` dan `getPortalRedirect`.
   - Hanya role `siswa_aktif` dan `siswa` yang diizinkan masuk ke folder `/siswa/` (Dashboard, Biodata, Dokumen, SPP).
4. **Penghapusan Total Tanggal Lahir Sebagai Bypass Password (`frontend/shared/js/api.js`)**:
   - Menghapus blok pengecekan tanggal lahir otomatis (`passedBirthdate` & `fallback_dob_password`). Autentikasi siswa kini murni memvalidasi salted SHA-256 hash kata sandi yang sah.
   - Akun baru hasil konversi admin memiliki bendera `must_change_password: true` dan `is_password_changed: false` sehingga siswa diwajibkan mengganti kata sandi pada login pertama kali.

### B. Fase 2: Perlindungan Backend Biodata Siswa (Strict Allowlist)
1. **Penerapan Strict Allowlist Kolom Pribadi (`frontend/shared/js/api.js` - `siswa.update_biodata`)**:
   - Menetapkan daftar kolom yang diizinkan secara ketat (`ALLOWED_BIODATA_COLS`):
     `['nickname', 'blood_type', 'hobbies', 'aspirations', 'religion', 'address', 'parent_phone', 'phone', 'father_phone', 'mother_phone', 'father_occupation', 'mother_occupation', 'father_name', 'mother_name', 'parent_name', 'guardian_name', 'guardian_relation', 'guardian_job', 'guardian_phone', 'guardian_office', 'daily_language', 'special_traits', 'distance_km', 'transport_mode', 'form_metadata']`
   - Menerapkan *banned exclusion guard* terhadap kolom identitas akademik dan administratif (`BANNED_ACADEMIC_COLS`):
     `['nis', 'nisn', 'class_id', 'class_name', 'kelas_sekarang', 'semester_sekarang', 'status_kenaikan', 'status_kelulusan', 'status_pendaftaran', 'level', 'program', 'registration_number', 'reg_number', 'status', 'is_active', 'monthly_spp_amount', 'user_id', 'id', 'created_at', 'joined_at', 'entry_year', 'entry_date']`
   - Menghapus kemampuan sesi santri mengubah penempatan rombel atau tanggal bergabung via `form_metadata.mutasi`.
2. **Validasi Otorisasi Kepemilikan Sesi**:
   - Memastikan pengguna non-admin hanya dapat memperbarui data santri yang terhubung dengan akun login aktif mereka sendiri (`currentUser.id === stuRecord.user_id` atau `currentUser.student_id === stuRecord.id`).

### C. Fase 3: Restrukturisasi UI Biodata Portal Siswa
1. **Pemisahan Mandiri Bagian 3 dan Bagian 4 (`frontend/portal/siswa/biodata.html`)**:
   - **Bagian 1: Data Pribadi Siswa / Santri**: Difokuskan khusus pada data dasar murid, nomor NIK, urutan anak, dan alamat tempat tinggal lengkap.
   - **Bagian 2: Data Orang Tua**: Tetap mengelola data Ayah dan Ibu kandung.
   - **Bagian 3: Data Wali Santri (Mandiri)**: Menampung Nama Lengkap Wali, Hubungan Keluarga, Pekerjaan, No. Telepon/WhatsApp, dan Alamat Lengkap/Kantor Wali (`guardian_office`).
   - **Bagian 4: Keterangan Tambahan & Informasi Penunjang (Mandiri)**: Menampung Bahasa Sehari-hari di Rumah (`daily_language`), Ciri Khusus / Catatan Kesehatan (`special_traits`), Jarak Rumah ke Sekolah (`distance_km`), dan Moda Transportasi (`transport_mode`).
2. **Penyesuaian Binding Form**:
   - Menambahkan binding otomatis untuk `guardian_office` pada saat pembacaan profil (`setVal`) dan pengiriman form submit.

### D. Fase 4: Integrasi Alur Konversi PPDB, Penerbitan Akun & Pembersihan Status
1. **Penerbitan Akun Idempoten Tanpa Email Fiktif (`frontend/shared/js/api.js` - `ppdb.convert`)**:
   - Akun siswa di tabel `users` dibuat menggunakan NIS sebagai *username* tunggal.
   - Email menggunakan alamat asli pendaftar/orang tua jika tersedia, atau `NULL` jika tidak diisi. Generator email palsu `@siswa.yayasan.sch.id` dihilangkan sepenuhnya.
   - Menambahkan pengecekan idempotensi akun sebelum insert agar tidak terjadi duplikasi akun bila admin mengonversi santri.
2. **Sinkronisasi Nominal SPP Dinamis (`dashboard.html` & `spp.html`)**:
   - Menghapus elemen teks mati `Rp 150.000` di `frontend/portal/siswa/dashboard.html` (L221) dan menggantikannya dengan elemen ber-ID `id="dash-monthly-spp"`.
   - Menghapus elemen teks mati `Rp 150.000` di `frontend/portal/siswa/spp.html` (L77) dan menggantikannya dengan elemen ber-ID `id="stat-monthly-fee"`.
   - Menghapus seluruh fallback nominal `150000` di dalam JavaScript `spp.html` sehingga tampilan SPP membaca langsung besaran nominal SPP yang ditentukan admin saat pendaftaran/konversi (misalnya Rp 50.000).
3. **Pembersihan Teks Teknis di Halaman Cek Status PPDB (`frontend/public/ppdb/status.html`)**:
   - Menghilangkan tulisan teknis `[TERENKRIPSI]` dan instruksi usang terkait tanggal lahir.
   - Menampilkan nomor NIS resmi secara elegan dengan tombol salin, disertai instruksi resmi untuk menggunakan kata sandi sementara dari Tata Usaha yang wajib diubah saat pertama kali masuk ke Portal Siswa.

### E. Fase 5: Pengujian Menyeluruh (Regression Testing)
- Pengujian otomatis 13 skenario komprehensif dijalankan menggunakan script `tests/run_lifecycle_e2e.ps1`.
- Seluruh 13 skenario terverifikasi **100% PASS** langsung terhadap database PostgreSQL Supabase yang aktif.

---

## 3. Matriks Hasil Pengujian 13 Skenario Operasional

| No | Skenario Pengujian | Hasil Uji | Keterangan Verifikasi |
| :-: | :--- | :---: | :--- |
| **S1** | PPDB Submit Masuk ke `ppdb_registrations` Tanpa Akun Prematur | **PASS** | Pendaftar tersimpan, tabel `users` = 0, `students` = 0, sesi lokal = null |
| **S2** | Penolakan Login Siswa Menggunakan Nomor Registrasi (`REG-xxxx`) | **PASS** | Guard penolakan aktif dengan pesan panduan Cek Status PPDB |
| **S3** | Karantina Hak Akses Role `calon_siswa` / `pendaftar` | **PASS** | Ditolak login ke Portal Siswa, redirect dialihkan ke `/login.html` |
| **S4** | Penghapusan Total Jalan Pintas Password Tanggal Lahir (DOB) | **PASS** | Login tanpa hash sandi yang sah ditolak keras ("Password salah") |
| **S5** | Konversi Admin Menerbitkan Akun NIS Murni & Email Asli | **PASS** | Username = NIS, role = `siswa_aktif`, tidak ada email fiktif |
| **S6** | Penandaan Wajib Ubah Password pada Login Perdana | **PASS** | `must_change_password: true`, `is_password_changed: false` |
| **S7** | Eksekusi Penggantian Kata Sandi Akun Siswa Baru | **PASS** | Kata sandi baru tersimpan dengan salted SHA-256 hash |
| **S8** | Perlindungan Backend Strict Allowlist pada Update Biodata | **PASS** | `BANNED_ACADEMIC_COLS` & `ALLOWED_BIODATA_COLS` aktif di backend |
| **S8-B**| Simulasi Serangan Manipulasi NIS / Kelas / SPP | **PASS** | Kolom akademik tidak berubah; hanya data pribadi yang terupdate |
| **S9** | Konsistensi Nominal SPP Dinamis (Rp 50.000 vs Hardcoded 150rb) | **PASS** | Elemen `#dash-monthly-spp` & `#stat-monthly-fee` memuat nominal profil |
| **S10**| Tampilan Halaman Status PPDB Bersih (Tanpa `[TERENKRIPSI]`) | **PASS** | Menampilkan panduan kata sandi dari Tata Usaha secara ramah |
| **S11**| Restrukturisasi UI Biodata (Bagian 3 Data Wali & Bagian 4 Penunjang)| **PASS** | Formulir terbagi 4 card mandiri dengan input `guardian_office` |
| **S12**| Idempotensi Penerbitan Akun Santri pada Konversi | **PASS** | Pengecekan akun eksisting mencegah duplikasi baris user |
| **S13**| Pembersihan Aman Data Pengujian Otomatis | **PASS** | Seluruh record dummy pengujian terhapus bersih dari basis data |

---

## 4. Berkas Sumber yang Dimodifikasi

1. [`frontend/shared/js/api.js`](file:///d:/Source_code_yayasan/frontend/shared/js/api.js) — *Karantina registrasi PPDB, penghapusan akun prematur, penghapusan DOB bypass, strict allowlist biodata, dan idempotensi konversi.*
2. [`frontend/shared/js/auth.js`](file:///d:/Source_code_yayasan/frontend/shared/js/auth.js) — *Isolasi role calon_siswa/pendaftar dari akses portal siswa aktif.*
3. [`frontend/public/login.html`](file:///d:/Source_code_yayasan/frontend/public/login.html) — *Standarisasi tab login NIS, penolakan input REG-xxxx, dan pembaruan modal bantuan akses.*
4. [`frontend/portal/siswa/biodata.html`](file:///d:/Source_code_yayasan/frontend/portal/siswa/biodata.html) — *Restrukturisasi card Bagian 3 (Data Wali) dan Bagian 4 (Keterangan Penunjang).*
5. [`frontend/portal/siswa/dashboard.html`](file:///d:/Source_code_yayasan/frontend/portal/siswa/dashboard.html) — *Penggantian hardcoded 150rb menjadi elemen dinamis `#dash-monthly-spp`.*
6. [`frontend/portal/siswa/spp.html`](file:///d:/Source_code_yayasan/frontend/portal/siswa/spp.html) — *Penggantian hardcoded 150rb menjadi elemen dinamis `#stat-monthly-fee` dan eliminasi fallback statik.*
7. [`frontend/portal/siswa/dokumen.html`](file:///d:/Source_code_yayasan/frontend/portal/siswa/dokumen.html) — *Penyesuaian role guard requireAuth hanya untuk siswa aktif.*
8. [`frontend/public/ppdb/status.html`](file:///d:/Source_code_yayasan/frontend/public/ppdb/status.html) — *Pembersihan teks `[TERENKRIPSI]` dan penyajian panduan akses resmi dari Tata Usaha.*
9. [`tests/run_lifecycle_e2e.ps1`](file:///d:/Source_code_yayasan/tests/run_lifecycle_e2e.ps1) — *Automated E2E Regression Test Suite untuk memvalidasi seluruh alur operasional.*
