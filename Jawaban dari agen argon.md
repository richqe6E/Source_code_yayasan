================================================================================
EXECUTABLE DIRECTIVE TAHAP 4: PEMBERSIHAN TOTAL FITUR GURU/NILAI & FIX CELAH E2E
Dari   : Lead System Auditor (Gemini 4 Argon)
Untuk  : Antigravity IDE Coding Agent
Konteks: Portal Guru serta seluruh fitur Nilai / Rapor Evaluasi Digital /
         Presensi Guru TELAH DITIADAKAN. Sistem hanya menggunakan Arsitektur
         2-Portal Resmi (Portal Admin/TU & Portal Siswa Mandiri untuk Biodata,
         Dokumen, dan Pembayaran SPP).
================================================================================

Tolong eksekusi 6 langkah perbaikan teknis di bawah ini secara menyeluruh:

--------------------------------------------------------------------------------
LANGKAH 1: HAPUS SISA HALAMAN & MENU NILAI/AKADEMIK DI PORTAL SISWA & ADMIN
--------------------------------------------------------------------------------
Target File:
- `frontend/portal/siswa/akademik.html`
- `frontend/portal/siswa/dashboard.html`
- `frontend/portal/siswa/biodata.html`
- `frontend/portal/siswa/dokumen.html`
- `frontend/portal/siswa/spp.html`
- `frontend/portal/admin/students.html`
- `frontend/portal/admin/reports.html`

Aksi Spesifik:
1. Hapus atau pindahkan `frontend/portal/siswa/akademik.html` ke `.legacy_backup/`
   (atau ubah menjadi redirect langsung ke `dashboard.html`).
2. Pada seluruh halaman di `frontend/portal/siswa/` (`dashboard.html`, `biodata.html`,
   `dokumen.html`, `spp.html`), hapus item navigasi sidebar/menu yang mengarah ke
   `akademik.html` serta hapus kartu/widget "Nilai / Rapor / Evaluasi STPPA / Presensi"
   di `siswa/dashboard.html`. Pastikan menu Portal Siswa hanya terdiri dari 4 menu inti:
   - `dashboard.html` (Ringkasan & Status)
   - `biodata.html` (Biodata Santri)
   - `dokumen.html` (Berkas Dokumen)
   - `spp.html` (Tagihan & Pembayaran SPP)
3. Pada `frontend/portal/admin/students.html`, hapus tombol/modal "Input Evaluasi /
   Nilai STPPA" (`save_evaluasi`) jika masih ada di tabel aksi siswa.
4. Pada `frontend/portal/admin/reports.html`, hapus opsi filter jenis laporan
   "Perkembangan / Nilai (development)" dan "Presensi (attendance)". Fokuskan
   laporan hanya pada: Data Siswa Aktif (`students`), Keuangan SPP (`payments`),
   Pendaftar PPDB (`ppdb`), dan Ringkasan Semua Modul (`all`).

--------------------------------------------------------------------------------
LANGKAH 2: BERSIHKAN ENDPOINT GURU/NILAI & PERBAIKI ROLE USER DI api.js
--------------------------------------------------------------------------------
Target File: `frontend/shared/js/api.js`

2A. Perbaiki `module === 'dashboard'` agar tidak crash jika salah satu tabel gagal
    dan tidak menghitung siswa `pending` sebagai wali murid aktif:
[CARI]:
      if (module === 'dashboard') {
        const [students, teachers, classes, ppdb, invoices, payments] = await Promise.all([
          supabaseRest('students?select=id,status'),
          supabaseRest('teachers?select=id,status'),
          supabaseRest('classes?select=id'),
          supabaseRest('ppdb_registrations?select=id,status'),
          supabaseRest('invoices?select=id,amount,status'),
          supabaseRest('payments?select=id,status')
        ]);

        const activeStudents = (students || []).filter(s => s.status === 'active').length;
        const activeTeachers = (teachers || []).filter(t => t.status === 'active').length;
        const pendingPPDB = (ppdb || []).filter(p => p.status === 'pending').length;
        const acceptedPPDB = (ppdb || []).filter(p => p.status === 'accepted' || p.status === 'approved').length;
        const unpaidInvoices = (invoices || []).filter(i => i.status === 'unpaid');
        const paidInvoices = (invoices || []).filter(i => i.status === 'paid');
        const pendingPayments = (payments || []).filter(p => p.status === 'menunggu_verifikasi').length;

        const totalUnpaidAmount = unpaidInvoices.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
        const totalPaidAmount = paidInvoices.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
        const totalTargetAmount = (invoices || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

        const stats = {
          total_students: activeStudents,
          active_students: activeStudents,
          total_students_active: activeStudents,
          total_teachers: activeTeachers,
          total_teachers_active: activeTeachers,
          total_classes: (classes || []).length,
          total_parents: (students || []).length,

[GANTI DENGAN]:
      if (module === 'dashboard') {
        const [students, teachers, classes, ppdb, invoices, payments] = await Promise.all([
          supabaseRest('students?select=id,status').catch(() => []),
          supabaseRest('teachers?select=id,status').catch(() => []),
          supabaseRest('classes?select=id').catch(() => []),
          supabaseRest('ppdb_registrations?select=id,status').catch(() => []),
          supabaseRest('invoices?select=id,amount,status').catch(() => []),
          supabaseRest('payments?select=id,status').catch(() => [])
        ]);

        const activeStudents = (students || []).filter(s => s.status === 'active').length;
        const activeTeachers = (teachers || []).filter(t => t.status === 'active').length;
        const pendingPPDB = (ppdb || []).filter(p => p.status === 'pending').length;
        const acceptedPPDB = (ppdb || []).filter(p => p.status === 'accepted' || p.status === 'approved' || p.status === 'converted').length;
        const unpaidInvoices = (invoices || []).filter(i => i.status === 'unpaid');
        const paidInvoices = (invoices || []).filter(i => i.status === 'paid');
        const pendingPayments = (payments || []).filter(p => p.status === 'menunggu_verifikasi').length;

        const totalUnpaidAmount = unpaidInvoices.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
        const totalPaidAmount = paidInvoices.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
        const totalTargetAmount = (invoices || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

        const stats = {
          total_students: activeStudents,
          active_students: activeStudents,
          total_students_active: activeStudents,
          total_teachers: activeTeachers,
          total_teachers_active: activeTeachers,
          total_classes: (classes || []).length,
          total_parents: activeStudents,

2B. Perbaiki `module === 'users'` -> `create` & `update` agar hanya memakai 4 Role
    Resmi (`super_admin`, `admin_tu`, `siswa_aktif`, `calon_siswa`) dan menghapus
    `password_hash` dari response:
[CARI]:
        if (action === 'create') {
          const id = 'USR-' + String(Date.now()).slice(-5);
          const roleLabelMap = {
            super_admin: 'Super Admin',
            admin_tu: 'Admin Tata Usaha',
            guru: 'Guru Kelas',
            orang_tua: 'Orang Tua / Wali'
          };
          const role = params.role || 'guru';
          const payload = {
            id,
            email: params.email,
            password_hash: params.password || '123456',
            full_name: params.full_name || params.name,
            name: params.name || params.full_name,
            phone: params.phone || '',
            role,
            role_label: roleLabelMap[role] || role,
            status: params.status || 'active',
            avatar: params.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
          };
          const created = await supabaseRest('users', 'POST', payload);
          return { success: true, data: created[0] || payload, message: 'User berhasil dibuat' };
        }
        if (action === 'update') {
          const id = params.id;
          const payload = { ...params };
          delete payload.id;
          delete payload.is_active;
          if (params.is_active !== undefined && !payload.status) {
            payload.status = params.is_active ? 'active' : 'inactive';
          }
          if (payload.password) {
            payload.password_hash = payload.password;
            delete payload.password;
          }
          if (payload.name && !payload.full_name) payload.full_name = payload.name;
          payload.updated_at = new Date().toISOString();
          const updated = await supabaseRest(`users?id=eq.${encodeURIComponent(id)}`, 'PATCH', payload);
          return { success: true, data: updated[0] || payload, message: 'User berhasil diperbarui' };
        }

[GANTI DENGAN]:
        if (action === 'create') {
          const id = 'USR-' + String(Date.now()).slice(-5);
          const roleLabelMap = {
            super_admin: 'Super Admin',
            admin_tu: 'Admin Tata Usaha',
            siswa_aktif: 'Siswa Aktif',
            calon_siswa: 'Calon Siswa / Pendaftar'
          };
          const role = params.role || 'admin_tu';
          const payload = {
            id,
            email: params.email,
            nis: params.nis || null,
            password_hash: params.password || '123456',
            full_name: params.full_name || params.name,
            name: params.name || params.full_name,
            phone: params.phone || '',
            role,
            role_label: roleLabelMap[role] || role,
            status: params.status || 'active',
            avatar: params.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
          };
          const created = await supabaseRest('users', 'POST', payload);
          const { password_hash, ...safeCreated } = (created && created[0]) || payload;
          return { success: true, data: safeCreated, message: 'User berhasil dibuat' };
        }
        if (action === 'update') {
          const id = params.id;
          const roleLabelMap = {
            super_admin: 'Super Admin',
            admin_tu: 'Admin Tata Usaha',
            siswa_aktif: 'Siswa Aktif',
            calon_siswa: 'Calon Siswa / Pendaftar'
          };
          const payload = { ...params };
          delete payload.id;
          delete payload.is_active;
          if (params.is_active !== undefined && !payload.status) {
            payload.status = params.is_active ? 'active' : 'inactive';
          }
          if (payload.role && !payload.role_label && roleLabelMap[payload.role]) {
            payload.role_label = roleLabelMap[payload.role];
          }
          if (payload.password) {
            payload.password_hash = payload.password;
            delete payload.password;
          }
          if (payload.name && !payload.full_name) payload.full_name = payload.name;
          payload.updated_at = new Date().toISOString();
          const updated = await supabaseRest(`users?id=eq.${encodeURIComponent(id)}`, 'PATCH', payload);
          const { password_hash, ...safeUpdated } = (updated && updated[0]) || payload;
          return { success: true, data: safeUpdated, message: 'User berhasil diperbarui' };
        }

2C. Pada `module === 'students'` -> `action === 'list'`, filter otomatis baris
    `status=neq.pending` agar calon siswa PPDB yang belum diterima tidak masuk ke
    tabel Siswa Aktif Admin:
[CARI]:
      if (module === 'students') {
        if (action === 'list') {
          let query = 'students?select=*&order=full_name.asc';
          if (params.class_id) query += `&class_id=eq.${encodeURIComponent(params.class_id)}`;
          if (params.status) query += `&status=eq.${encodeURIComponent(params.status)}`;

[GANTI DENGAN]:
      if (module === 'students') {
        if (action === 'list') {
          let query = 'students?select=*&order=full_name.asc';
          if (params.class_id) query += `&class_id=eq.${encodeURIComponent(params.class_id)}`;
          if (params.status) {
            query += `&status=eq.${encodeURIComponent(params.status)}`;
          } else {
            query += `&status=neq.pending`;
          }

2D. Hapus blok dead-code warisan Portal Guru & Nilai di `frontend/shared/js/api.js`:
    - Hapus aksi `if (action === 'get_academic')` di dalam `module === 'siswa'`.
    - Hapus aksi `if (action === 'me')` di dalam `module === 'teachers'` (karena tidak ada lagi login Portal Guru; sisakan hanya `list`, `get`, `create`, `update`, `activate`, `deactivate`, dan tambahkan `delete` untuk keperluan Admin mengelola data staf pengajar/wali kelas).
    - Hapus aksi `if (action === 'myChildren')` dan `if (action === 'save_evaluasi')` di dalam `module === 'students'`.
    - Hapus seluruh blok `if (module === 'parent' || module === 'parents')`, `if (module === 'attendance')`, dan `if (module === 'development')`.
    - Pada `if (module === 'reports')` -> `action === 'generate'`, hapus cabang `else if (repType === 'attendance')` dan `else if (repType === 'development')`, serta pada cabang `repType === 'all'` ubah query siswa menjadi `supabaseRest('students?status=eq.active&select=id').catch(() => [])`.

--------------------------------------------------------------------------------
LANGKAH 3: TAMBAHKAN HANDLER CONTACT, IMPORT EXCEL & TEACHER DELETE DI api.js
--------------------------------------------------------------------------------
Target File: `frontend/shared/js/api.js`

3A. Di dalam `if (module === 'teachers')`, tambahkan aksi `delete` (agar tombol
    hapus data pendidik di `admin/teachers.html` berfungsi di Supabase, sama seperti
    di `local-api.js`):
```javascript
        if (action === 'delete') {
          await supabaseRest(`teachers?id=eq.${encodeURIComponent(params.id)}`, 'DELETE');
          return { success: true, message: 'Data pendidik berhasil dihapus' };
        }
3B. Di dalam if (module === 'reports'), tambahkan handler import_invoices dan
import_students (setelah blok if (action === 'generate')):

JavaScript
        if (action === 'import_invoices') {
          const rawItems = Array.isArray(params.items) ? params.items : [];
          if (rawItems.length === 0) return { success: false, message: 'Tidak ada data tagihan untuk diimpor' };
          const stuList = await supabaseRest('students?status=eq.active&select=id,nis,full_name').catch(() => []);
          let insertedCount = 0;
          for (let i = 0; i < rawItems.length; i++) {
            const row = rawItems[i];
            const stu = (stuList || []).find(s =>
              (row.nis && s.nis && String(s.nis).trim() === String(row.nis).trim()) ||
              (row.student_name && s.full_name && s.full_name.toLowerCase().includes(String(row.student_name).toLowerCase().trim()))
            ) || (stuList && stuList[0]);
            if (!stu) continue;
            const invPayload = {
              id: 'INV-' + Date.now() + '-' + i,
              invoice_number: row.invoice_number || ('INV/' + new Date().getFullYear() + '/' + String(Date.now()).slice(-4) + '/' + (i + 1)),
              student_id: stu.id,
              student_name: row.student_name || stu.full_name,
              month: row.period || row.month || 'Periode Berjalan',
              period: row.period || row.month || '2026/2027',
              amount: Number(row.amount) || 150000,
              due_date: row.due_date || new Date().toISOString().slice(0, 10),
              status: (row.status || 'unpaid').toLowerCase(),
              description: row.description || row.item_name || 'SPP Import Excel'
            };
            await supabaseRest('invoices', 'POST', invPayload).catch(() => {});
            insertedCount++;
          }
          return { success: true, count: insertedCount, message: `Berhasil mengimpor ${insertedCount} data tagihan ke dalam database!` };
        }

        if (action === 'import_students') {
          const rawItems = Array.isArray(params.items) ? params.items : [];
          if (rawItems.length === 0) return { success: false, message: 'Tidak ada data siswa untuk diimpor' };
          let insertedCount = 0;
          for (let i = 0; i < rawItems.length; i++) {
            const row = rawItems[i];
            const stuId = 'STU-' + Date.now() + '-' + i;
            const fullName = row.full_name || row.name || ('Siswa Baru ' + (i + 1));
            const stuPayload = {
              id: stuId,
              nis: row.nis || ('2026' + String(1000 + i)),
              full_name: fullName,
              name: fullName,
              child_name: fullName,
              nickname: row.nickname || fullName.split(' ')[0],
              gender: row.gender || 'L',
              birth_place: row.birth_place || 'Samarinda',
              birth_date: row.birth_date || '2020-01-01',
              class_id: row.class_id || 'CLS-001',
              class_name: row.class_name || 'PAUD / TK',
              kelas_sekarang: row.class_name || 'PAUD / TK',
              parent_name: row.parent_name || row.father_name || 'Wali Siswa',
              father_name: row.father_name || row.parent_name || '',
              mother_name: row.mother_name || '',
              parent_phone: row.phone || row.parent_phone || '',
              phone: row.phone || row.parent_phone || '',
              parent_email: row.email || '',
              address: row.address || 'Samarinda',
              status: 'active',
              is_active: true
            };
            await supabaseRest('students', 'POST', stuPayload).catch(() => {});
            insertedCount++;
          }
          return { success: true, count: insertedCount, message: `Berhasil mengimpor ${insertedCount} data siswa ke dalam database!` };
        }
3C. Tambahkan handler if (module === 'contact') di frontend/shared/js/api.js
(sebelum baris fallback terakhir const items = await supabaseRest(...)) agar
pengiriman form di kontak.html tidak gagal dengan HTTP 404:

JavaScript
      // 18. CONTACT MESSAGES (Form Kontak Publik)
      if (module === 'contact' || module === 'contact_messages') {
        if (action === 'list') {
          const msgs = await supabaseRest('contact_messages?select=*&order=created_at.desc').catch(() => []);
          return { success: true, data: msgs };
        }
        const id = 'MSG-' + Date.now();
        const msgPayload = {
          id,
          name: params.name || 'Pengunjung',
          email: params.email || '',
          phone: params.phone || '',
          subject: params.subject || 'Pesan Website',
          message: params.message || '',
          status: 'unread'
        };
        await supabaseRest('contact_messages', 'POST', msgPayload).catch(() => {});
        return { success: true, data: msgPayload, message: 'Pesan Anda berhasil dikirim.' };
      }
LANGKAH 4: BERSIHKAN SISA FITUR GURU/NILAI DI frontend/local-api.js
Target File: frontend/local-api.js

Aksi Spesifik:

Hapus array dummy attendance dan developments dari objek DB.

Hapus blok endpoint warisan Portal Guru/Ortu:

if (action === 'get_academic') pada module === 'siswa'

if (action === 'save_evaluasi') dan if (action === 'myChildren') pada module === 'students'

if (module === 'attendance')

if (module === 'development')

if (module === 'parent')

Cabang else if (reportType === 'attendance') dan else if (reportType === 'development') pada module === 'reports'.

Pada module === 'users' -> action === 'create', ubah default role dari
params.role || 'orang_tua' menjadi params.role || 'admin_tu'.

Tambahkan handler if (module === 'contact') di local-api.js yang mengembalikan
{ success: true, message: 'Pesan Anda berhasil dikirim.' }.

LANGKAH 5: SINKRONKAN TABEL & KOLOM DI MASTER_SUPABASE_SETUP_V2.sql & PATCH SQL
Target File:

database/MASTER_SUPABASE_SETUP_V2.sql

database/patch_missing_columns.sql

database/supabase_schema.sql

Aksi Spesifik:

Pindahkan atau hapus database/supabase_schema.sql (skema V1 lama yang masih
memiliki DROP TABLE CASCADE, role guru/orang_tua, serta tabel developments
dan attendance) ke .legacy_backup/ agar tidak pernah tidak sengaja dijalankan.

Di database/MASTER_SUPABASE_SETUP_V2.sql:

HAPUS bagian -- 6. TABEL REKAM AKADEMIK & RAPOR EVALUASI STPPA (CREATE TABLE IF NOT EXISTS academic_records ...) dan hapus 'academic_records' dari array tables pada bagian RLS.

TAMBAHKAN tabel teachers (untuk menu Admin Data Pendidik & Wali Kelas di classes) dan tabel contact_messages (untuk form kontak.html), serta masukkan 'teachers' dan 'contact_messages' ke dalam array tables pada loop RLS.

Tambahkan skrip SQL berikut ke dalam database/MASTER_SUPABASE_SETUP_V2.sql
dan database/patch_missing_columns.sql:

SQL
-- Hapus tabel rapor digital warisan jika tidak digunakan lagi
DROP TABLE IF EXISTS academic_records CASCADE;
DROP TABLE IF EXISTS developments CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;

-- Tabel Pendataan Tenaga Pendidik / Wali Kelas (Dikelola Admin TU)
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

-- Tabel Pesan Kontak Pengunjung Publik
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

-- Kolom Lengkap Biodata Siswa (Untuk Edit Biodata di Portal Siswa Mandiri)
ALTER TABLE students ADD COLUMN IF NOT EXISTS nik VARCHAR(30);
ALTER TABLE students ADD COLUMN IF NOT EXISTS father_phone VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS mother_phone VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS father_occupation VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS mother_occupation VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS previous_school VARCHAR(150);
ALTER TABLE students ADD COLUMN IF NOT EXISTS blood_type VARCHAR(10);
ALTER TABLE students ADD COLUMN IF NOT EXISTS hobbies TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS aspirations TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS joined_at DATE;

-- Kolom Lengkap Pengaturan CMS & Identitas Yayasan (Untuk Sinkronisasi Cloud)
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

-- RLS & Policy untuk teachers dan contact_messages
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Full Access on teachers" ON teachers;
CREATE POLICY "Public Full Access on teachers" ON teachers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Full Access on contact_messages" ON contact_messages;
CREATE POLICY "Public Full Access on contact_messages" ON contact_messages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);