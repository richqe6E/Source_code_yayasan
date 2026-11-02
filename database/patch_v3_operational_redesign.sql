-- ========================================================================
-- PATCH V3: OPERATIONAL WORKFLOW REDESIGN & DATA INTEGRITY ENHANCEMENT
-- Website SIYAYASAN — Yayasan At Tarbiyyah Wijaya Kusuma Samarinda
-- Tanggal: 2 November 2026
-- ========================================================================
-- Skrip ini bersifat aman, non-destruktif, dan backward-compatible.
-- Jalankan di SQL Editor Supabase untuk melengkapi kolom baru yang dibutuhkan
-- oleh alur kerja operasional baru.
-- ========================================================================

-- 1. MODUL DATA SISWA: Penambahan Kolom Tarif SPP Bulanan per Siswa & Sinkronisasi 36 Field PPDB
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS monthly_spp_amount INTEGER DEFAULT 150000,
ADD COLUMN IF NOT EXISTS form_metadata JSONB DEFAULT '{}'::jsonb;

-- 2. MODUL KEUANGAN & PEMBAYARAN SPP: Penambahan Audit Penolakan & Verifikasi
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS verified_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- 3. MODUL KEUANGAN SPP: Pencegahan Tagihan Duplikat per Periode
CREATE UNIQUE INDEX IF NOT EXISTS uq_invoice_student_month_period 
ON invoices (student_id, month, period);

-- 4. MODUL PPDB: Dukungan Filter Periode & Isolasi Tahun Ajaran
ALTER TABLE ppdb_registrations 
ADD COLUMN IF NOT EXISTS academic_year VARCHAR(20) DEFAULT '2026/2027',
ADD COLUMN IF NOT EXISTS period_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS decision_notes TEXT,
ADD COLUMN IF NOT EXISTS decided_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS decided_by VARCHAR(100);

-- Backfill data lama agar memiliki academic_year terisi
UPDATE ppdb_registrations 
SET academic_year = '2026/2027' 
WHERE academic_year IS NULL OR academic_year = '';

CREATE INDEX IF NOT EXISTS idx_ppdb_academic_year 
ON ppdb_registrations (academic_year, status);

-- 5. MODUL AUTENTIKASI: Pengamanan Kredensial Siswa (Salted Hash & Mandatory Force Change)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS password_salt VARCHAR(64);

-- Sukses pesan
SELECT 'MIGRASI PATCH V3 OPERATIONAL REDESIGN SIYAYASAN SUKSES 100%!' AS status_migrasi;
