-- ==============================================================================
-- SIYAYASAN V2 — PATCH MIGRASI KOLOM AMAN (TANPA HAPUS DATA)
-- Jalankan di Supabase Dashboard -> SQL Editor -> Run
-- Skrip ini TIDAK AKAN MENGHAPUS / MERUBAH data yang sudah ada, hanya menambahkan kolom baru jika belum ada.
-- ==============================================================================

-- 1. Tambah kolom WhatsApp & Media Sosial ke tabel schools
ALTER TABLE schools ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(50);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS wa_gateway_token TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS youtube_url TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS facebook_url TEXT;

-- 2. Tambah kolom content ke tabel galleries (opsional/kompatibilitas)
ALTER TABLE galleries ADD COLUMN IF NOT EXISTS content TEXT;

-- 3. Tambah kolom linimasa tanggal resmi ke tabel ppdb_periods
ALTER TABLE ppdb_periods ADD COLUMN IF NOT EXISTS reg_start DATE;
ALTER TABLE ppdb_periods ADD COLUMN IF NOT EXISTS reg_end DATE;
ALTER TABLE ppdb_periods ADD COLUMN IF NOT EXISTS verif_start DATE;
ALTER TABLE ppdb_periods ADD COLUMN IF NOT EXISTS verif_end DATE;
ALTER TABLE ppdb_periods ADD COLUMN IF NOT EXISTS announcement_date DATE;
ALTER TABLE ppdb_periods ADD COLUMN IF NOT EXISTS reenroll_start DATE;
ALTER TABLE ppdb_periods ADD COLUMN IF NOT EXISTS reenroll_end DATE;
ALTER TABLE ppdb_periods ADD COLUMN IF NOT EXISTS announcement_notes TEXT;

-- 4. Buat View Alias agar query 'gallery' dan 'logs' otomatis tersambung
CREATE OR REPLACE VIEW gallery AS SELECT * FROM galleries;
CREATE OR REPLACE VIEW logs AS SELECT * FROM activity_logs;

SELECT 'Patch kolom baru berhasil diterapkan 100% tanpa ada data yang terhapus!' as status;
