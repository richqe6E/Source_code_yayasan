-- ==============================================================================
-- SIYAYASAN V2 — DATABASE FOUNDATION MIGRATION & REVAMP PATCH
-- Menyesuaikan skema dengan PRD Revamp V2:
-- 1. Tabel web_settings (Banner Hero Carousel, Sosmed, Kontak)
-- 2. Dukungan Login NIS & Password Pertama Siswa (Tgl Lahir)
-- 3. Tabel student_documents (Upload berkas Akte, KK, Pas Foto)
-- 4. Tabel academic_records (Rapor & Kenaikan Kelas)
-- 5. Role Siswa Aktif & Calon Siswa
-- ==============================================================================

-- 1. TABEL PENGATURAN TAMPILAN WEB (CMS HERO CAROUSEL & SOSMED)
CREATE TABLE IF NOT EXISTS web_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    school_name VARCHAR(255) DEFAULT 'Yayasan Samarinda',
    tagline VARCHAR(255) DEFAULT 'Membentuk Generasi Cerdas, Berkarakter, dan Berakhlak Mulia',
    hero_title VARCHAR(255) DEFAULT 'Selamat Datang di Yayasan Samarinda',
    hero_subtitle TEXT DEFAULT 'Lembaga Pendidikan Islam Terpadu: PAUD, TK, dan TPQ dengan kurikulum holistik dan berbasis nilai islami.',
    hero_images JSONB DEFAULT '[
        {"url": "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1600&auto=format&fit=crop&q=80", "caption": "Suasana Belajar Ceria dan Interaktif"},
        {"url": "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1600&auto=format&fit=crop&q=80", "caption": "Fasilitas Belajar Ramah Anak & Islami"},
        {"url": "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1600&auto=format&fit=crop&q=80", "caption": "Pendidikan Karakter dan Akhlak Mulia"}
    ]'::jsonb,
    facebook_url TEXT DEFAULT 'https://facebook.com/yayasansamarinda',
    instagram_url TEXT DEFAULT 'https://instagram.com/yayasansamarinda',
    youtube_url TEXT DEFAULT 'https://youtube.com/@yayasansamarinda',
    phone VARCHAR(50) DEFAULT '0812-3456-7890',
    whatsapp VARCHAR(50) DEFAULT '081234567890',
    email VARCHAR(100) DEFAULT 'info@yayasan.sch.id',
    address TEXT DEFAULT 'Jl. Pendidikan No. 123, Samarinda, Kalimantan Timur',
    ppdb_active_note TEXT DEFAULT 'Pendaftaran Gelombang 1 Dibuka! Kuota Terbatas.',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Masukkan default jika belum ada
INSERT INTO web_settings (id, school_name)
VALUES ('default', 'Yayasan Samarinda')
ON CONFLICT (id) DO NOTHING;

-- 2. PENAMBAHAN KOLOM PADA USERS
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_password_changed BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS nis VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100);

-- Pastikan roles yang diperlukan tersedia
INSERT INTO roles (id, code, name, description) VALUES
('ROLE-005', 'siswa_aktif', 'Siswa Aktif', 'Akses Rapor, Kenaikan Kelas, SPP, dan Pengumuman Siswa'),
('ROLE-006', 'calon_siswa', 'Calon Siswa / Pendaftar', 'Akses Pengisian Biodata PPDB dan Upload Berkas')
ON CONFLICT (id) DO NOTHING;

-- 3. PENAMBAHAN KOLOM PADA STUDENTS
ALTER TABLE students ADD COLUMN IF NOT EXISTS user_id VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS status_pendaftaran VARCHAR(30) DEFAULT 'pending'; -- pending, accepted, rejected, review
ALTER TABLE students ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS kelas_sekarang VARCHAR(100) DEFAULT 'PAUD Terpadu';
ALTER TABLE students ADD COLUMN IF NOT EXISTS semester_sekarang VARCHAR(20) DEFAULT 'Semester 1';
ALTER TABLE students ADD COLUMN IF NOT EXISTS status_kenaikan VARCHAR(50) DEFAULT 'Aktif';
ALTER TABLE students ADD COLUMN IF NOT EXISTS status_kelulusan VARCHAR(50) DEFAULT 'Belum Lulus';

-- 4. TABEL DOKUMEN SISWA (PPDB & BERKAS PERSYARATAN)
CREATE TABLE IF NOT EXISTS student_documents (
    id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) REFERENCES students(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- 'kk', 'akte', 'foto', 'ktp_ortu', 'lainnya'
    file_name VARCHAR(255),
    file_url TEXT NOT NULL,
    file_size INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABEL REKAM AKADEMIK & RAPOR (SEKOLAH & TPQ)
CREATE TABLE IF NOT EXISTS academic_records (
    id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) REFERENCES students(id) ON DELETE CASCADE,
    academic_year VARCHAR(50) DEFAULT '2026/2027',
    semester VARCHAR(20) DEFAULT '1',
    class_name VARCHAR(100),
    aspect_nam VARCHAR(20) DEFAULT 'BSH', -- BSB, BSH, MB, BB
    aspect_fisik_motorik VARCHAR(20) DEFAULT 'BSH',
    aspect_kognitif VARCHAR(20) DEFAULT 'BSH',
    aspect_bahasa VARCHAR(20) DEFAULT 'BSH',
    aspect_sosial_emosional VARCHAR(20) DEFAULT 'BSH',
    aspect_seni VARCHAR(20) DEFAULT 'BSH',
    hafalan_surah TEXT,
    catatan_wali_kelas TEXT,
    status_kenaikan VARCHAR(50) DEFAULT 'Naik Kelas',
    status_kelulusan VARCHAR(50) DEFAULT 'Belum',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. ENABLE RLS
ALTER TABLE web_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon all on web_settings" ON web_settings;
CREATE POLICY "Allow anon all on web_settings" ON web_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on student_documents" ON student_documents;
CREATE POLICY "Allow anon all on student_documents" ON student_documents FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on academic_records" ON academic_records;
CREATE POLICY "Allow anon all on academic_records" ON academic_records FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

SELECT 'Fondasi SIYAYASAN V2 Revamp (web_settings, users, students, documents, academic_records) Berhasil Dikonfigurasi!' as message;
