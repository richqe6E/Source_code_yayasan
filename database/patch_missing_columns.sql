-- ==============================================================================
-- PATCH MISSING COLUMNS (SAFE IDEMPOTENT MIGRATION)
-- Yayasan At Tarbiyyah Wijaya Kusuma Samarinda - SIYAYASAN V2
-- Jalankan skrip ini di SQL Editor Supabase untuk memastikan seluruh kolom kompatibel
-- ==============================================================================

-- 1. PPDB Registrations
ALTER TABLE ppdb_registrations ADD COLUMN IF NOT EXISTS registration_no VARCHAR(100);
ALTER TABLE ppdb_registrations ADD COLUMN IF NOT EXISTS full_name VARCHAR(150);
ALTER TABLE ppdb_registrations ADD COLUMN IF NOT EXISTS child_name VARCHAR(150);
ALTER TABLE ppdb_registrations ADD COLUMN IF NOT EXISTS nickname VARCHAR(100);
ALTER TABLE ppdb_registrations ADD COLUMN IF NOT EXISTS nik VARCHAR(30);
ALTER TABLE ppdb_registrations ADD COLUMN IF NOT EXISTS form_type VARCHAR(50);
ALTER TABLE ppdb_registrations ADD COLUMN IF NOT EXISTS gender VARCHAR(10) DEFAULT 'L';
ALTER TABLE ppdb_registrations ADD COLUMN IF NOT EXISTS birth_place VARCHAR(100);
ALTER TABLE ppdb_registrations ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE ppdb_registrations ADD COLUMN IF NOT EXISTS father_name VARCHAR(150);
ALTER TABLE ppdb_registrations ADD COLUMN IF NOT EXISTS mother_name VARCHAR(150);
ALTER TABLE ppdb_registrations ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE ppdb_registrations ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE ppdb_registrations ADD COLUMN IF NOT EXISTS birth_certificate_url TEXT;
ALTER TABLE ppdb_registrations ADD COLUMN IF NOT EXISTS family_card_url TEXT;
ALTER TABLE ppdb_registrations ADD COLUMN IF NOT EXISTS form_metadata JSONB DEFAULT '{}'::jsonb;

-- 2. News (Berita)
ALTER TABLE news ADD COLUMN IF NOT EXISTS author VARCHAR(150) DEFAULT 'Admin Sekolah';
ALTER TABLE news ADD COLUMN IF NOT EXISTS author_name VARCHAR(150) DEFAULT 'Admin Sekolah';

-- 3. Announcements (Pengumuman)
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS target_audience VARCHAR(50) DEFAULT 'all';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS target_role VARCHAR(50) DEFAULT 'all';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- 4. Events (Agenda Kegiatan)
ALTER TABLE events ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS time VARCHAR(50) DEFAULT '08:00 - Selesai';
