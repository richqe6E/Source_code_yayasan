-- ==============================================================================
-- SIYAYASAN V2 — MASTER SUPABASE BACKEND SETUP & DATABASE FOUNDATION
-- Skrip lengkap dan terpadu untuk inisialisasi seluruh Backend Supabase:
-- 1. Storage Buckets (Penampung berkas dokumen, bukti bayar & foto)
-- 2. Seluruh Tabel Database Relasional (Admin & Portal Siswa)
-- 3. Row Level Security (RLS) & Kebijakan Akses API
-- 4. Master Data Seed Awal (Akun Super Admin, Profil Sekolah, Kelas & PPDB)
--
-- CARA PENGGUNAAN:
-- 1. Buka Supabase Dashboard project Anda (https://supabase.com/dashboard)
-- 2. Masuk ke menu "SQL Editor" di bilah navigasi kiri
-- 3. Klik "New Query", tempelkan (Paste) seluruh isi file ini, lalu klik "RUN".
-- ==============================================================================

-- Aktifkan ekstensi yang diperlukan
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. PENAMPUNG PENYIMPANAN BERKAS (STORAGE BUCKETS & POLICIES)
-- ==============================================================================

-- Buat bucket penyimpanan publik untuk berkas dokumen siswa, bukti bayar & CMS
INSERT INTO storage.buckets (id, name, public) 
VALUES ('siyayasan-uploads', 'siyayasan-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Kebijakan Akses Storage Objek (Upload, View & Delete)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Public Access siyayasan-uploads'
    ) THEN
        CREATE POLICY "Public Access siyayasan-uploads" ON storage.objects FOR SELECT TO public USING (bucket_id = 'siyayasan-uploads');
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Public Insert siyayasan-uploads'
    ) THEN
        CREATE POLICY "Public Insert siyayasan-uploads" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'siyayasan-uploads');
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Public Update siyayasan-uploads'
    ) THEN
        CREATE POLICY "Public Update siyayasan-uploads" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'siyayasan-uploads');
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Public Delete siyayasan-uploads'
    ) THEN
        CREATE POLICY "Public Delete siyayasan-uploads" ON storage.objects FOR DELETE TO public USING (bucket_id = 'siyayasan-uploads');
    END IF;
END $$;

-- ==============================================================================
-- 2. TABEL PROFIL SEKOLAH & CMS WEBSITE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS schools (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    npsn VARCHAR(50),
    level VARCHAR(50),
    address TEXT,
    phone VARCHAR(50),
    whatsapp_number VARCHAR(50),
    wa_gateway_token TEXT,
    email VARCHAR(100),
    headmaster_name VARCHAR(150),
    instagram_url TEXT,
    youtube_url TEXT,
    facebook_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
    phone VARCHAR(50) DEFAULT '0812-3456-7891',
    whatsapp VARCHAR(50) DEFAULT '081234567891',
    email VARCHAR(100) DEFAULT 'info@yayasan.sch.id',
    address TEXT DEFAULT 'Jl. Pendidikan No. 123, Samarinda, Kalimantan Timur',
    ppdb_active_note TEXT DEFAULT 'Pendaftaran Gelombang 1 Dibuka! Kuota Terbatas.',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 3. TABEL USERS & ROLES (ADMIN & SISWA)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(150),
    username VARCHAR(100),
    nis VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    name VARCHAR(150),
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL,
    role_label VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    avatar TEXT,
    is_password_changed BOOLEAN DEFAULT TRUE,
    student_id VARCHAR(50),
    teacher_id VARCHAR(50),
    parent_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pencarian akun login
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_nis ON users(nis);

-- ==============================================================================
-- 4. TABEL KELAS & SISWA
-- ==============================================================================

CREATE TABLE IF NOT EXISTS classes (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    level VARCHAR(50) NOT NULL,
    academic_year VARCHAR(50) DEFAULT '2026/2027',
    teacher_id VARCHAR(50),
    teacher_name VARCHAR(150),
    capacity INTEGER DEFAULT 20,
    student_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50),
    nis VARCHAR(50),
    nisn VARCHAR(50),
    full_name VARCHAR(150) NOT NULL,
    name VARCHAR(150),
    child_name VARCHAR(150),
    nickname VARCHAR(100),
    gender VARCHAR(10) DEFAULT 'L',
    birth_place VARCHAR(100),
    birth_date DATE,
    class_id VARCHAR(50) REFERENCES classes(id) ON DELETE SET NULL,
    class_name VARCHAR(100),
    kelas_sekarang VARCHAR(100),
    semester_sekarang VARCHAR(50) DEFAULT 'Semester 1 (Ganjil)',
    status_kenaikan VARCHAR(50) DEFAULT 'Aktif',
    status_kelulusan VARCHAR(50) DEFAULT 'Belum Lulus',
    status_pendaftaran VARCHAR(30) DEFAULT 'accepted',
    parent_id VARCHAR(50),
    parent_name VARCHAR(150),
    father_name VARCHAR(150),
    mother_name VARCHAR(150),
    parent_email VARCHAR(150),
    parent_phone VARCHAR(50),
    phone VARCHAR(50),
    address TEXT,
    religion VARCHAR(50) DEFAULT 'Islam',
    entry_year VARCHAR(10) DEFAULT '2026',
    photo_url TEXT,
    status VARCHAR(20) DEFAULT 'active',
    is_active BOOLEAN DEFAULT TRUE,
    attendance_pct NUMERIC(5,2) DEFAULT 100.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_nis ON students(nis);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);

-- ==============================================================================
-- 5. TABEL DOKUMEN SISWA (PENAMPUNG BERKAS AKTE, KK, PAS FOTO)
-- ==============================================================================

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

CREATE INDEX IF NOT EXISTS idx_student_docs_student ON student_documents(student_id);

-- ==============================================================================
-- 6. TABEL REKAM AKADEMIK & RAPOR EVALUASI STPPA
-- ==============================================================================

CREATE TABLE IF NOT EXISTS academic_records (
    id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) REFERENCES students(id) ON DELETE CASCADE,
    academic_year VARCHAR(50) DEFAULT '2026/2027',
    semester VARCHAR(50) DEFAULT 'Semester 1 (Ganjil)',
    class_name VARCHAR(100),
    aspect_nam VARCHAR(20) DEFAULT 'BSH', -- BSB, BSH, MB, BB
    aspect_fisik_motorik VARCHAR(20) DEFAULT 'BSH',
    aspect_kognitif VARCHAR(20) DEFAULT 'BSH',
    aspect_bahasa VARCHAR(20) DEFAULT 'BSH',
    aspect_sosial_emosional VARCHAR(20) DEFAULT 'BSH',
    aspect_seni VARCHAR(20) DEFAULT 'BSH',
    aspects_json JSONB DEFAULT '{}'::jsonb,
    hafalan_surah TEXT,
    catatan_wali_kelas TEXT,
    teacher_notes TEXT,
    status_kenaikan VARCHAR(50) DEFAULT 'Aktif',
    status_kelulusan VARCHAR(50) DEFAULT 'Belum Lulus',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_academic_student ON academic_records(student_id);

-- ==============================================================================
-- 7. TABEL PPDB (PERIODE & PENDAFTARAN CALON SISWA)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS ppdb_periods (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    academic_year VARCHAR(50) DEFAULT '2026/2027',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reg_start DATE,
    reg_end DATE,
    verif_start DATE,
    verif_end DATE,
    announcement_date DATE,
    reenroll_start DATE,
    reenroll_end DATE,
    quota INTEGER DEFAULT 50,
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    announcement_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ppdb_registrations (
    id VARCHAR(50) PRIMARY KEY,
    registration_number VARCHAR(100) UNIQUE NOT NULL,
    student_name VARCHAR(150) NOT NULL,
    student_gender VARCHAR(10) DEFAULT 'L',
    student_birth_place VARCHAR(100),
    student_birth_date DATE,
    parent_name VARCHAR(150) NOT NULL,
    parent_phone VARCHAR(50) NOT NULL,
    parent_email VARCHAR(150),
    address TEXT,
    level VARCHAR(50) DEFAULT 'PAUD',
    period_id VARCHAR(50) REFERENCES ppdb_periods(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'pending', -- pending, accepted, rejected, review
    notes TEXT,
    documents_url JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 8. TABEL TAGIHAN & PEMBAYARAN SPP SISWA
-- ==============================================================================

CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(50) PRIMARY KEY,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    student_id VARCHAR(50) REFERENCES students(id) ON DELETE CASCADE,
    student_name VARCHAR(150),
    month VARCHAR(50) NOT NULL,
    period VARCHAR(50) DEFAULT '2026/2027',
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    due_date DATE NOT NULL,
    status VARCHAR(30) DEFAULT 'unpaid', -- unpaid, paid, menunggu_verifikasi, overdue
    description TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_method VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(50) PRIMARY KEY,
    invoice_id VARCHAR(50) REFERENCES invoices(id) ON DELETE SET NULL,
    invoice_number VARCHAR(100),
    student_id VARCHAR(50) REFERENCES students(id) ON DELETE CASCADE,
    student_name VARCHAR(150),
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    method VARCHAR(50) DEFAULT 'transfer',
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    proof_image_url TEXT,
    status VARCHAR(30) DEFAULT 'menunggu_verifikasi', -- menunggu_verifikasi, verified, rejected
    notes TEXT,
    verified_by VARCHAR(150),
    verified_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_student ON invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);

-- ==============================================================================
-- 9. TABEL KONTEN WEBSITE (BERITA, PENGUMUMAN, AGENDA, GALERI)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS news (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    content TEXT NOT NULL,
    excerpt TEXT,
    summary TEXT,
    category VARCHAR(100) DEFAULT 'Umum',
    cover_url TEXT,
    image_url TEXT,
    image TEXT,
    featured_image_url TEXT,
    author_name VARCHAR(150) DEFAULT 'Admin Sekolah',
    status VARCHAR(20) DEFAULT 'published',
    is_published BOOLEAN DEFAULT TRUE,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcements (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    target_role VARCHAR(50) DEFAULT 'all',
    status VARCHAR(20) DEFAULT 'published',
    is_published BOOLEAN DEFAULT TRUE,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    location VARCHAR(255) DEFAULT 'Kampus Yayasan Samarinda',
    status VARCHAR(20) DEFAULT 'published',
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS galleries (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT,
    image_url TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'Kegiatan Belajar',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50),
    user_name VARCHAR(150),
    action VARCHAR(100) NOT NULL,
    module VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Views Alias untuk kompatibilitas frontend apiCall
CREATE OR REPLACE VIEW gallery AS SELECT * FROM galleries;
CREATE OR REPLACE VIEW logs AS SELECT * FROM activity_logs;

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) UNTUK AKSES API REST
-- ==============================================================================

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppdb_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppdb_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Izinkan anon & authenticated membaca dan menulis data yang diperlukan oleh aplikasi web
DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'schools', 'web_settings', 'roles', 'users', 'classes', 'students',
        'student_documents', 'academic_records', 'ppdb_periods', 'ppdb_registrations',
        'invoices', 'payments', 'news', 'announcements', 'events', 'galleries', 'activity_logs'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Public Full Access on %I" ON %I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "Public Full Access on %I" ON %I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);', tbl, tbl);
    END LOOP;
END $$;

-- ==============================================================================
-- 11. MASTER DATA SEED AWAL (SIAP PAKAI)
-- ==============================================================================

-- 1. Master Sekolah & CMS
INSERT INTO schools (id, name, npsn, level, address, phone, whatsapp_number, email, headmaster_name, instagram_url, youtube_url, facebook_url) VALUES
('SCH-001', 'Yayasan Samarinda', '69912345', 'PAUD, TK, dan TPQ', 'Jl. Pendidikan No. 123, Samarinda, Kalimantan Timur', '0812-3456-7891', '081234567891', 'info@yayasan.sch.id', 'Ustadzah Fatimah, S.Pd.I.', 'https://instagram.com/yayasansamarinda', 'https://youtube.com/@yayasansamarinda', 'https://facebook.com/yayasansamarinda')
ON CONFLICT (id) DO UPDATE SET
    whatsapp_number = EXCLUDED.whatsapp_number,
    instagram_url = EXCLUDED.instagram_url,
    youtube_url = EXCLUDED.youtube_url,
    facebook_url = EXCLUDED.facebook_url;

INSERT INTO web_settings (id, school_name)
VALUES ('default', 'Yayasan Samarinda')
ON CONFLICT (id) DO NOTHING;

-- 2. Master Roles
INSERT INTO roles (id, code, name, description) VALUES
('ROLE-001', 'super_admin', 'Super Admin', 'Hak akses penuh ke seluruh modul sistem'),
('ROLE-002', 'admin_tu', 'Admin Tata Usaha', 'Manajemen siswa, verifikasi PPDB, dan keuangan SPP'),
('ROLE-005', 'siswa_aktif', 'Siswa Aktif', 'Akses Rapor, Kenaikan Kelas, SPP, dan Pengumuman Siswa'),
('ROLE-006', 'calon_siswa', 'Calon Siswa / Pendaftar', 'Akses Pengisian Biodata PPDB dan Upload Berkas')
ON CONFLICT (id) DO NOTHING;

-- 3. Akun Super Admin Bawaan
INSERT INTO users (id, email, password_hash, full_name, name, role, role_label, status, avatar, is_password_changed) VALUES
('USR-ADMIN01', 'admin@yayasan.sch.id', 'admin123', 'Administrator Yayasan', 'Administrator', 'super_admin', 'Super Admin', 'active', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Master Kelas Awal
INSERT INTO classes (id, name, level, academic_year, capacity, student_count, status) VALUES
('CLS-001', 'Kelompok Bermain (KB) Ceria', 'PAUD', '2026/2027', 20, 0, 'active'),
('CLS-002', 'TK A Al-Fatih', 'TK', '2026/2027', 25, 0, 'active'),
('CLS-003', 'TK B Shalahuddin', 'TK', '2026/2027', 25, 0, 'active'),
('CLS-004', 'TPQ Al-Hikmah', 'TPQ', '2026/2027', 30, 0, 'active')
ON CONFLICT (id) DO NOTHING;

-- 5. Periode PPDB Aktif
INSERT INTO ppdb_periods (id, name, academic_year, start_date, end_date, reg_start, reg_end, verif_start, verif_end, announcement_date, quota, status, notes) VALUES
('PER-2026-1', 'PPDB Gelombang 1 TA 2026/2027', '2026/2027', '2026-01-01', '2026-07-31', '2026-01-01', '2026-07-15', '2026-07-16', '2026-07-20', '2026-07-22', 75, 'active', 'Pendaftaran Peserta Didik Baru Gelombang 1 resmi dibuka. Kuota terbatas.')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- PESAN SUKSES
-- ==============================================================================
SELECT 'SELURUH BACKEND SUPABASE SIYAYASAN V2 BERHASIL DISIAPKAN 100%! Penampung Storage, Tabel Relasional, RLS & Master Data Sudah Siap Digunakan.' as status_laporan;
