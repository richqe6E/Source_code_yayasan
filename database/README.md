# 🗄️ Database Schema & DDL — SIYAYASAN V2

Direktori ini berisi skema basis data resmi berteknologi **Supabase Cloud (PostgreSQL 15+)** untuk Sistem Informasi Manajemen & Portal Terpadu **Yayasan At Tarbiyyah Wijaya Kusuma Samarinda**.

---

## 📁 Daftar Berkas SQL

1. **`MASTER_SUPABASE_SETUP_V2.sql`**
   - Skrip DDL master resmi untuk inisialisasi awal seluruh tabel, relasi, tipe data, indeks, dan trigger basis data PostgreSQL di Supabase.
   - Mencakup tabel: `users`, `schools`, `academic_years`, `classes`, `students`, `teachers`, `ppdb_periods`, `ppdb_registrations`, `student_documents`, `invoices`, `payments`, `news`, `announcements`, `events`, `galleries`, `web_settings`, dan `activity_logs`.

2. **`patch_siyayasan_v2_foundation.sql`**
   - Patch fondasi untuk penyesuaian tipe data, foreign key, dan konfigurasi skema dasar.

3. **`patch_siyayasan_v2_phase1_columns.sql`**
   - Penambahan kolom-kolom ekstensi untuk kebutuhan modul akademik dan operasional.

4. **`patch_missing_columns.sql`**
   - Patch pemutakhiran kolom tambahan untuk sinkronisasi profil yayasan, status PPDB, dan audit log.

---

## 🚀 Panduan Setup & Migrasi ke Supabase

1. Buka dashboard proyek Supabase Anda di [https://supabase.com](https://supabase.com).
2. Masuk ke menu **SQL Editor**.
3. Buat query baru, kemudian salin (*copy*) dan tempel (*paste*) isi dari berkas `MASTER_SUPABASE_SETUP_V2.sql`.
4. Jalankan skrip (*Run*). Semua tabel, relasi, dan konfigurasi RLS siap digunakan.
5. Konfigurasi kredensial koneksi (URL & Anon Key) di file frontend:
   `frontend/shared/js/supabase-config.js`
