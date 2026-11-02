# 🗄️ Database Schema & DDL — SIYAYASAN V2

Direktori ini berisi skema basis data resmi berteknologi **Supabase Cloud (PostgreSQL 15+)** untuk Sistem Informasi Manajemen & Portal Terpadu **Yayasan At Tarbiyyah Wijaya Kusuma Samarinda**.

---

## 📁 Daftar Berkas SQL Resmi

1. **`MASTER_SUPABASE_SETUP_V2.sql` (Skrip Utama / Fresh Setup)**
   - Skrip DDL master resmi untuk inisialisasi awal seluruh basis data PostgreSQL di Supabase dari nol.
   - Mengaktifkan ekstensi UUID & pgcrypto, membuat storage bucket `siyayasan-uploads` beserta seluruh kebijakan keamanannya (RLS), membuat 14+ tabel relasional utama (`schools`, `web_settings`, `roles`, `users`, `classes`, `teachers`, `students`, `student_documents`, `contact_messages`, `ppdb_periods`, `ppdb_registrations`, `invoices`, `payments`, `news`, `announcements`, `events`, `galleries`, `activity_logs`), indeks pencarian cepat, serta *seed data* bawaan (Akun Super Admin, Master Sekolah, Kelas, dan Periode PPDB aktif).

2. **`patch_missing_columns.sql` (Skrip Patch / Live Maintenance)**
   - Skrip migrasi *idempotent* (`ADD COLUMN IF NOT EXISTS`) untuk memperbarui dan memastikan kelengkapan kolom pada basis data Supabase yang **sudah ada datanya (live)** tanpa me-reset isi tabel.
   - Menyelaraskan kolom pendataan tenaga pendidik (`teachers`), pesan kontak (`contact_messages`), author berita, pin pengumuman penting, tanggal/waktu agenda kegiatan, dan membersihkan tabel lama yang sudah ditiadakan (`academic_records`, `attendance`).

---

## 🚀 Panduan Penggunaan di Supabase

### A. Untuk Inisialisasi Proyek Baru (Fresh Setup):
1. Buka dashboard proyek Supabase Anda di [https://supabase.com](https://supabase.com).
2. Masuk ke menu **SQL Editor** pada bilah menu kiri.
3. Buat query baru (*New Query*), salin (*copy*) seluruh isi berkas **`MASTER_SUPABASE_SETUP_V2.sql`**, lalu klik **Run**.
4. Seluruh tabel, bucket penyimpanan dokumen, dan akun admin bawaan langsung siap digunakan 100%.

### B. Untuk Memeriksa / Memperbarui Database Live (Tanpa Hapus Data):
1. Buka menu **SQL Editor** di Supabase.
2. Salin dan jalankan berkas **`patch_missing_columns.sql`**.
3. Kolom-kolom baru akan otomatis terpasang dengan aman tanpa mengganggu data yang sudah ada.
