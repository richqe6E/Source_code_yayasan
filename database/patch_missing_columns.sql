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

-- 5. Hapus tabel rapor digital warisan jika tidak digunakan lagi
DROP TABLE IF EXISTS academic_records CASCADE;
DROP TABLE IF EXISTS developments CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;

-- 6. Tabel Pendataan Tenaga Pendidik / Wali Kelas (Dikelola Admin TU)
CREATE TABLE IF NOT EXISTS teachers (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50),
    nip VARCHAR(50),
    full_name VARCHAR(150) NOT NULL,
    name VARCHAR(150),
    gender VARCHAR(10) DEFAULT 'L',
    phone VARCHAR(50),
    email VARCHAR(150),
    education VARCHAR(100) DEFAULT 'S1 Pendidikan',
    position VARCHAR(100) DEFAULT 'Guru Kelas',
    specialization VARCHAR(100),
    start_date DATE,
    joined_at DATE,
    avatar TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabel Pesan Kontak Pengunjung Publik
CREATE TABLE IF NOT EXISTS contact_messages (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(50),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'unread',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Kolom Lengkap Biodata Siswa (Untuk Edit Biodata di Portal Siswa Mandiri)
ALTER TABLE students ADD COLUMN IF NOT EXISTS nik VARCHAR(30);
ALTER TABLE students ADD COLUMN IF NOT EXISTS father_phone VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS mother_phone VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS father_occupation VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS mother_occupation VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS previous_school VARCHAR(150);
ALTER TABLE students ADD COLUMN IF NOT EXISTS blood_type VARCHAR(10);
ALTER TABLE students ADD COLUMN IF NOT EXISTS hobbies TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS joined_at DATE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS user_id VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS nisn VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS kelas_sekarang VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS semester_sekarang VARCHAR(50) DEFAULT 'Semester 1 (Ganjil)';
ALTER TABLE students ADD COLUMN IF NOT EXISTS status_kenaikan VARCHAR(50) DEFAULT 'Aktif';
ALTER TABLE students ADD COLUMN IF NOT EXISTS status_kelulusan VARCHAR(50) DEFAULT 'Belum Lulus';
ALTER TABLE students ADD COLUMN IF NOT EXISTS status_pendaftaran VARCHAR(30) DEFAULT 'accepted';
ALTER TABLE students ADD COLUMN IF NOT EXISTS father_name VARCHAR(150);
ALTER TABLE students ADD COLUMN IF NOT EXISTS mother_name VARCHAR(150);
ALTER TABLE students ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS religion VARCHAR(50) DEFAULT 'Islam';
ALTER TABLE students ADD COLUMN IF NOT EXISTS entry_year VARCHAR(10) DEFAULT '2026';
ALTER TABLE students ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 8B. Kolom Otentikasi & Sesi Users V2
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS nis VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_password_changed BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS student_id VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS teacher_id VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_id VARCHAR(50);

-- Pastikan akun Super Admin tersedia
INSERT INTO users (id, email, password_hash, full_name, name, role, role_label, status, is_password_changed)
VALUES ('USR-ADMIN01', 'admin@yayasan.sch.id', 'admin123', 'Administrator Yayasan', 'Administrator', 'super_admin', 'Super Admin', 'active', true)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  status = 'active';

-- 9. Kolom Lengkap Pengaturan CMS & Identitas Yayasan (Untuk Sinkronisasi Cloud)
ALTER TABLE schools ADD COLUMN IF NOT EXISTS campus_note TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS maps_url TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS maps_embed_url TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS ketua_yayasan VARCHAR(150) DEFAULT 'Makhrus';
ALTER TABLE schools ADD COLUMN IF NOT EXISTS bendahara VARCHAR(150) DEFAULT 'Sri Pragawati';
ALTER TABLE schools ADD COLUMN IF NOT EXISTS sekretaris VARCHAR(150) DEFAULT 'Candra Gunawan';
ALTER TABLE schools ADD COLUMN IF NOT EXISTS pembina VARCHAR(150) DEFAULT 'DJOKO IRIANDONO';
ALTER TABLE schools ADD COLUMN IF NOT EXISTS pengawas VARCHAR(150) DEFAULT 'Suhardi';
ALTER TABLE schools ADD COLUMN IF NOT EXISTS footer_bg_url TEXT DEFAULT '/images/school-campus.jpg';

ALTER TABLE web_settings ADD COLUMN IF NOT EXISTS header_title VARCHAR(255);
ALTER TABLE web_settings ADD COLUMN IF NOT EXISTS announcement_banner TEXT;
ALTER TABLE web_settings ADD COLUMN IF NOT EXISTS whatsapp_official VARCHAR(50);
ALTER TABLE web_settings ADD COLUMN IF NOT EXISTS contact_email VARCHAR(100);
ALTER TABLE web_settings ADD COLUMN IF NOT EXISTS campus_note TEXT;
ALTER TABLE web_settings ADD COLUMN IF NOT EXISTS maps_url TEXT;
ALTER TABLE web_settings ADD COLUMN IF NOT EXISTS maps_embed_url TEXT;
ALTER TABLE web_settings ADD COLUMN IF NOT EXISTS academic_year VARCHAR(50) DEFAULT '2026/2027';
ALTER TABLE web_settings ADD COLUMN IF NOT EXISTS footer_bg_url TEXT DEFAULT '/images/school-campus.jpg';
ALTER TABLE web_settings ADD COLUMN IF NOT EXISTS login_bg_url TEXT DEFAULT '/images/school-campus.jpg';

-- 10. RLS & Policy untuk teachers dan contact_messages
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Full Access on teachers" ON teachers;
CREATE POLICY "Public Full Access on teachers" ON teachers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Full Access on contact_messages" ON contact_messages;
CREATE POLICY "Public Full Access on contact_messages" ON contact_messages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 11. Muat Ulang Cache Skema API Supabase Seketika
NOTIFY pgrst, 'reload schema';

SELECT 'MIGRASI PATCH SUPABASE SIYAYASAN V2 SUKSES 100%!' as status_laporan;
