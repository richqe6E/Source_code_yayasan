-- ==============================================================================
-- SIYAYASAN V2 — SUPABASE POSTGRESQL SCHEMA (CLEAN SLATE & EXTENDED)
-- Arsitektur Database Sekolah: PAUD, TK, dan TPQ Yayasan Samarinda
-- Mulai Bersih dari Awal (Total Zero) — Siap untuk input berita, foto, PPDB dari 0
-- Jalankan di Supabase Dashboard -> SQL Editor -> Run
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. DROP TABLES JIKA SUDAH ADA (URUTAN REVERSE FOREIGN KEY)
DROP VIEW IF EXISTS gallery CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS contact_messages CASCADE;
DROP TABLE IF EXISTS galleries CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS news CASCADE;
DROP TABLE IF EXISTS developments CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS ppdb_registrations CASCADE;
DROP TABLE IF EXISTS ppdb_periods CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS parents CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS academic_years CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS schools CASCADE;

-- ==============================================================================
-- 3. TABEL UTAMA & IDENTITAS SEKOLAH
-- ==============================================================================

-- Tabel Identitas Sekolah & Link Media Sosial
CREATE TABLE schools (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    npsn VARCHAR(50),
    level VARCHAR(50) DEFAULT 'PAUD/TK/TPQ',
    address TEXT,
    phone VARCHAR(50),
    whatsapp_number VARCHAR(50),
    email VARCHAR(100),
    headmaster_name VARCHAR(150),
    instagram_url TEXT DEFAULT '',
    youtube_url TEXT DEFAULT '',
    facebook_url TEXT DEFAULT '',
    wa_gateway_token TEXT DEFAULT '', -- Token Fonnte / WA Gateway untuk kirim pesan otomatis
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel Pengaturan Sistem Fleksibel (Key-Value)
CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel Tahun Ajaran
CREATE TABLE academic_years (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50) NOT NULL, -- e.g. 2026/2027
    semester VARCHAR(10) DEFAULT '1',
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel Roles
CREATE TABLE roles (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel Users (Autentikasi & Akun Portal Multi-Role)
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    name VARCHAR(150),
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL, -- super_admin, admin_tu, guru, orang_tua
    role_label VARCHAR(100),
    role_id VARCHAR(50),
    parent_id VARCHAR(50),
    student_id VARCHAR(50),
    teacher_id VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    avatar TEXT,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel Guru / Tenaga Pendidik
CREATE TABLE teachers (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50),
    nip VARCHAR(50),
    full_name VARCHAR(150) NOT NULL,
    gender VARCHAR(10),
    phone VARCHAR(50),
    email VARCHAR(150),
    education VARCHAR(50),
    position VARCHAR(100),
    avatar TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel Kelas
CREATE TABLE classes (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    level VARCHAR(50) NOT NULL, -- PAUD, TK, TPQ
    academic_year VARCHAR(50) DEFAULT '2026/2027',
    teacher_id VARCHAR(50),
    teacher_name VARCHAR(150),
    capacity INTEGER DEFAULT 20,
    student_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel Orang Tua / Wali
CREATE TABLE parents (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50),
    father_name VARCHAR(150),
    mother_name VARCHAR(150),
    phone VARCHAR(50),
    email VARCHAR(150),
    address TEXT,
    occupation VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel Siswa / Santri
CREATE TABLE students (
    id VARCHAR(50) PRIMARY KEY,
    nis VARCHAR(50),
    nisn VARCHAR(50),
    full_name VARCHAR(150) NOT NULL,
    name VARCHAR(150),
    child_name VARCHAR(150),
    nickname VARCHAR(50),
    gender VARCHAR(10),
    birth_place VARCHAR(100),
    birth_date DATE,
    class_id VARCHAR(50) REFERENCES classes(id) ON DELETE SET NULL,
    class_name VARCHAR(100),
    parent_id VARCHAR(50),
    parent_name VARCHAR(150),
    parent_email VARCHAR(150),
    parent_phone VARCHAR(50),
    photo_url TEXT,
    address TEXT,
    status VARCHAR(20) DEFAULT 'active',
    attendance_pct NUMERIC DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 4. TABEL PPDB (LENGKAP DENGAN KONTROL JADWAL & STATUS)
-- ==============================================================================

CREATE TABLE ppdb_periods (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    academic_year VARCHAR(50) DEFAULT '2026/2027',
    start_date DATE,
    end_date DATE,
    quota INTEGER DEFAULT 50,
    status VARCHAR(20) DEFAULT 'open', -- 'open' (buka pendaftaran) atau 'closed' (tutup)
    -- Jadwal Penting Resmi yang Diatur Admin
    reg_start DATE,
    reg_end DATE,
    verif_start DATE,
    verif_end DATE,
    announcement_date DATE,
    reenroll_start DATE,
    reenroll_end DATE,
    announcement_notes TEXT DEFAULT 'Pendaftaran Peserta Didik Baru saat ini belum dibuka / telah ditutup. Silakan pantau jadwal penting di bawah ini.',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE ppdb_registrations (
    id VARCHAR(50) PRIMARY KEY,
    registration_number VARCHAR(100) UNIQUE NOT NULL,
    registration_no VARCHAR(100),
    period_id VARCHAR(50) REFERENCES ppdb_periods(id) ON DELETE SET NULL,
    period_name VARCHAR(150),
    form_type VARCHAR(50) NOT NULL, -- paud / tpq
    full_name VARCHAR(150) NOT NULL,
    child_name VARCHAR(150),
    nickname VARCHAR(50),
    gender VARCHAR(10),
    birth_place VARCHAR(100),
    birth_date DATE,
    father_name VARCHAR(150),
    mother_name VARCHAR(150),
    phone VARCHAR(50),
    address TEXT,
    status VARCHAR(30) DEFAULT 'pending', -- pending, accepted, rejected
    notes TEXT,
    registration_date DATE DEFAULT CURRENT_DATE,
    birth_certificate_url TEXT,
    family_card_url TEXT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 5. TABEL KEUANGAN (INVOICES & PAYMENTS)
-- ==============================================================================

CREATE TABLE invoices (
    id VARCHAR(50) PRIMARY KEY,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    student_id VARCHAR(50) REFERENCES students(id) ON DELETE CASCADE,
    student_name VARCHAR(150),
    month VARCHAR(50) NOT NULL,
    period VARCHAR(50),
    amount NUMERIC NOT NULL,
    due_date DATE,
    status VARCHAR(30) DEFAULT 'unpaid', -- unpaid, paid, menunggu_verifikasi, cancelled
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_method VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE payments (
    id VARCHAR(50) PRIMARY KEY,
    invoice_id VARCHAR(50) REFERENCES invoices(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100),
    student_id VARCHAR(50),
    student_name VARCHAR(150),
    amount NUMERIC NOT NULL,
    method VARCHAR(50) DEFAULT 'transfer',
    payment_date DATE DEFAULT CURRENT_DATE,
    proof_image_url TEXT,
    status VARCHAR(30) DEFAULT 'menunggu_verifikasi', -- menunggu_verifikasi, verified, rejected
    verified_by VARCHAR(50),
    verified_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 6. TABEL AKADEMIK (PRESENSI & RAPOR 6 ASPEK)
-- ==============================================================================

CREATE TABLE attendance (
    id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) REFERENCES students(id) ON DELETE CASCADE,
    student_name VARCHAR(150),
    class_id VARCHAR(50) REFERENCES classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(10) NOT NULL, -- H, S, I, A
    notes TEXT,
    created_by VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE developments (
    id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) REFERENCES students(id) ON DELETE CASCADE,
    student_name VARCHAR(150),
    class_id VARCHAR(50) REFERENCES classes(id) ON DELETE CASCADE,
    semester VARCHAR(10) DEFAULT '1',
    academic_year VARCHAR(50) DEFAULT '2026/2027',
    aspect_nam VARCHAR(10) DEFAULT 'BSH',
    aspect_fisik_motorik VARCHAR(10) DEFAULT 'BSH',
    aspect_kognitif VARCHAR(10) DEFAULT 'BSH',
    aspect_bahasa VARCHAR(10) DEFAULT 'BSH',
    aspect_sosial_emosional VARCHAR(10) DEFAULT 'BSH',
    aspect_seni VARCHAR(10) DEFAULT 'BSH',
    teacher_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 7. TABEL KONTEN PUBLIK (BERITA, PENGUMUMAN, AGENDA, GALERI)
-- ==============================================================================

CREATE TABLE news (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(100) DEFAULT 'Umum',
    summary TEXT,
    content TEXT NOT NULL,
    image TEXT,
    author VARCHAR(100) DEFAULT 'Humas Yayasan',
    status VARCHAR(20) DEFAULT 'published',
    published_at DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE announcements (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    target_audience VARCHAR(50) DEFAULT 'all',
    is_pinned BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'published',
    published_at DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE events (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    time VARCHAR(50),
    location VARCHAR(255),
    description TEXT,
    status VARCHAR(20) DEFAULT 'upcoming',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE galleries (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'Kegiatan',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VIEW Alias agar pemanggilan 'gallery' maupun 'galleries' keduanya berfungsi 100%
CREATE OR REPLACE VIEW gallery AS SELECT * FROM galleries;

CREATE TABLE contact_messages (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(50),
    subject VARCHAR(200),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'unread',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE notifications (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE activity_logs (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50),
    user_name VARCHAR(150),
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppdb_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppdb_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE developments ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon all on schools" ON schools FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on system_settings" ON system_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on academic_years" ON academic_years FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on roles" ON roles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on users" ON users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on teachers" ON teachers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on classes" ON classes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on parents" ON parents FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on students" ON students FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on ppdb_periods" ON ppdb_periods FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on ppdb_registrations" ON ppdb_registrations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on invoices" ON invoices FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on payments" ON payments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on attendance" ON attendance FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on developments" ON developments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on news" ON news FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on announcements" ON announcements FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on events" ON events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on galleries" ON galleries FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on contact_messages" ON contact_messages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on notifications" ON notifications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on activity_logs" ON activity_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- 9. STORAGE BUCKET
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('siyayasan-uploads', 'siyayasan-uploads', true)
ON CONFLICT (id) DO NOTHING;

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
END $$;

-- ==============================================================================
-- 10. SEED DATA AWAL (TOTAL CLEAN SLATE — HANYA MASTER DASAR)
-- ==============================================================================

-- 1. Sekolah Master
INSERT INTO schools (id, name, npsn, level, address, phone, whatsapp_number, email, headmaster_name, instagram_url, youtube_url, facebook_url) VALUES
('SCH-001', 'Yayasan Samarinda', '69912345', 'PAUD, TK, dan TPQ', 'Jl. Pendidikan No. 123, Samarinda, Kalimantan Timur', '0812-3456-7890', '081234567890', 'info@yayasan.sch.id', 'Ustadzah Fatimah, S.Pd.I.', 'https://instagram.com/yayasansamarinda', 'https://youtube.com/@yayasansamarinda', 'https://facebook.com/yayasansamarinda');

-- 2. Roles
INSERT INTO roles (id, code, name, description) VALUES
('ROLE-001', 'super_admin', 'Super Admin', 'Hak akses penuh ke seluruh modul sistem'),
('ROLE-002', 'admin_tu', 'Admin Tata Usaha', 'Manajemen siswa, verifikasi PPDB, dan keuangan SPP'),
('ROLE-003', 'guru', 'Guru Kelas', 'Pengisian presensi dan rapor perkembangan siswa'),
('ROLE-004', 'orang_tua', 'Orang Tua / Wali', 'Melihat presensi, rapor, dan pembayaran SPP anak');

-- 3. Akun Administrator Utama (Satu-satunya akun awal)
INSERT INTO users (id, email, password_hash, full_name, name, phone, role, role_label, role_id, status, avatar) VALUES
('USR-001', 'admin@yayasan.sch.id', 'admin123', 'Ahmad Dahlan (Super Admin)', 'Ahmad Dahlan', '081234567890', 'super_admin', 'Super Admin', 'ROLE-001', 'active', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150');

-- 4. Gelombang PPDB Awal (Status Open dan Jadwal Resmi)
INSERT INTO ppdb_periods (
    id, name, academic_year, start_date, end_date, quota, status,
    reg_start, reg_end, verif_start, verif_end, announcement_date, reenroll_start, reenroll_end, announcement_notes
) VALUES (
    'PPDPER-2026', 'PPDB 2026/2027 Gelombang 1', '2026/2027', '2026-01-01', '2026-12-31', 60, 'open',
    '2026-02-01', '2026-03-31', '2026-04-01', '2026-04-05', '2026-04-10', '2026-04-12', '2026-04-20',
    'Pendaftaran Peserta Didik Baru Gelombang 1 Resmi Dibuka. Silakan mengisi formulir pendaftaran di bawah ini.'
);

-- CATATAN:
-- Tabel news, announcements, events, galleries, students, parents, teachers, classes, invoices, payments, attendance, developments, ppdb_registrations SENGAJA KOSONG (0 data)
-- agar semua data dapat diinput murni dari awal oleh Admin, Guru, dan Pendaftar!

SELECT 'Database SIYAYASAN V2 Bersih (Clean Slate) Siap Digunakan dari Nol!' as status;
