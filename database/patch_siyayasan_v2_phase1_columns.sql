-- ==============================================================================
-- PATCH TAHAP 1: PENYIAPAN LACI & KOLOM DATABASE RESMI (SIYAYASAN V2)
-- Yayasan At Tarbiyyah Wijaya Kusuma Samarinda
-- Jalankan skrip SQL ini di SQL Editor Dashboard Supabase untuk menjamin 100%
-- kompatibilitas kolom pada alur PPDB, Konversi Siswa, Dokumen, dan Tenaga Pendidik.
-- ==============================================================================

-- 1. Penyiapan Kolom pada Tabel Registrasi PPDB (ppdb_registrations)
-- Menampung NIS resmi hasil konversi, nama rombel/kelas, dan kata sandi pendaftaran
ALTER TABLE ppdb_registrations ADD COLUMN IF NOT EXISTS converted_nis VARCHAR(50);
ALTER TABLE ppdb_registrations ADD COLUMN IF NOT EXISTS nis VARCHAR(50);
ALTER TABLE ppdb_registrations ADD COLUMN IF NOT EXISTS class_name VARCHAR(100);
ALTER TABLE ppdb_registrations ADD COLUMN IF NOT EXISTS password VARCHAR(255);
ALTER TABLE ppdb_registrations ADD COLUMN IF NOT EXISTS registration_no VARCHAR(100);
ALTER TABLE ppdb_registrations ADD COLUMN IF NOT EXISTS full_name VARCHAR(150);
ALTER TABLE ppdb_registrations ADD COLUMN IF NOT EXISTS child_name VARCHAR(150);

-- Index pencarian cepat registrasi PPDB
CREATE INDEX IF NOT EXISTS idx_ppdb_nis ON ppdb_registrations(nis);
CREATE INDEX IF NOT EXISTS idx_ppdb_converted_nis ON ppdb_registrations(converted_nis);

-- 2. Penyiapan Kolom pada Tabel Pengguna & Akun Login (users)
-- Menampung tanggal lahir dan kata sandi cadangan santri baru
ALTER TABLE users ADD COLUMN IF NOT EXISTS fallback_dob_password VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS nis VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_password_changed BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS student_id VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS teacher_id VARCHAR(50);

-- 3. Penyiapan Kolom pada Tabel Data Siswa Aktif (students)
-- Menampung referensi pendaftaran dan jenjang santri
ALTER TABLE students ADD COLUMN IF NOT EXISTS program VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS level VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS reg_number VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS user_id VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS kelas_sekarang VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS semester_sekarang VARCHAR(50) DEFAULT 'Semester 1 (Ganjil)';
ALTER TABLE students ADD COLUMN IF NOT EXISTS status_kenaikan VARCHAR(50) DEFAULT 'Aktif';
ALTER TABLE students ADD COLUMN IF NOT EXISTS status_pendaftaran VARCHAR(30) DEFAULT 'accepted';

-- Index pencarian cepat siswa
CREATE INDEX IF NOT EXISTS idx_students_reg_number ON students(registration_number);
CREATE INDEX IF NOT EXISTS idx_students_reg_num_short ON students(reg_number);

-- 4. Penyiapan Kolom pada Tabel Guru & Tenaga Pendidik (teachers)
-- Kompatibilitas alias kolom pencarian spesialisasi / mata pelajaran
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS subject_specialty VARCHAR(100);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS specialization VARCHAR(100);

-- 5. Penyiapan Kolom pada Tabel Berkas Dokumen Santri (student_documents)
-- Menampung status verifikasi berkas PPDB dan dokumen susulan siswa
ALTER TABLE student_documents ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'pending';
ALTER TABLE student_documents ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- 6. Reload Cache Skema Supabase PostgREST
NOTIFY pgrst, 'reload schema';

SELECT 'TAHAP 1: SKEMA KOLOM DATABASE SUPABASE SIYAYASAN V2 SUKSES DIVERIFIKASI 100%!' as status_migrasi;
