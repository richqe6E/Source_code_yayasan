================================================================================
EXECUTABLE DIRECTIVE TAHAP 3 (FINAL SCHEMA & LOGIC SYNC) — SIYAYASAN V2
Dari   : Lead System Auditor (Gemini 4 Argon)
Untuk  : Antigravity IDE Coding Agent
Tujuan : Menuntaskan sinkronisasi kolom SQL Supabase, deduplikasi konversi PPDB,
         filter laporan siswa aktif, dan sanitasi password_hash di sesi lokal.
================================================================================

Tolong eksekusi 6 langkah perbaikan spesifik di bawah ini secara berurutan.
Setiap langkah sudah dilengkapi blok kode lama dan kode penggantinya secara presisi:

--------------------------------------------------------------------------------
LANGKAH 1: SINKRONISASI TABEL & PATCH SQL DI database/MASTER_SUPABASE_SETUP_V2.sql
--------------------------------------------------------------------------------
Target File: `database/MASTER_SUPABASE_SETUP_V2.sql`

1A. Pada definisi `CREATE TABLE IF NOT EXISTS ppdb_registrations`, tambahkan kolom `registration_no VARCHAR(100),` tepat di bawah `registration_number`:
[CARI]:
CREATE TABLE IF NOT EXISTS ppdb_registrations (
    id VARCHAR(50) PRIMARY KEY,
    registration_number VARCHAR(100) UNIQUE NOT NULL,
    student_name VARCHAR(150) NOT NULL,

[GANTI DENGAN]:
CREATE TABLE IF NOT EXISTS ppdb_registrations (
    id VARCHAR(50) PRIMARY KEY,
    registration_number VARCHAR(100) UNIQUE NOT NULL,
    registration_no VARCHAR(100),
    student_name VARCHAR(150) NOT NULL,

1B. Pada definisi `CREATE TABLE IF NOT EXISTS news`, `announcements`, dan `events`, samakan kolom dengan yang dipanggil oleh `api.js` dan `app.js`:
[CARI]:
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
    location VARCHAR(255) DEFAULT 'Kampus Yayasan At Tarbiyyah Wijaya Kusuma',
    status VARCHAR(20) DEFAULT 'published',
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

[GANTI DENGAN]:
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
    author VARCHAR(150) DEFAULT 'Admin Sekolah',
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
    target_audience VARCHAR(50) DEFAULT 'all',
    is_pinned BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'published',
    is_published BOOLEAN DEFAULT TRUE,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE DEFAULT CURRENT_DATE,
    event_date DATE DEFAULT CURRENT_DATE,
    time VARCHAR(50) DEFAULT '08:00 - Selesai',
    location VARCHAR(255) DEFAULT 'Kampus Yayasan At Tarbiyyah Wijaya Kusuma',
    status VARCHAR(20) DEFAULT 'published',
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

1C. Tambahkan blok migrasi otomatis (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`) tepat sebelum bagian `-- 10. ROW LEVEL SECURITY (RLS)` di `database/MASTER_SUPABASE_SETUP_V2.sql` (dan salin juga ke `database/patch_missing_columns.sql`):
```sql
-- Migrasi Kolom Kompatibilitas Penuh (Safe Idempotent Patch)
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

ALTER TABLE news ADD COLUMN IF NOT EXISTS author VARCHAR(150) DEFAULT 'Admin Sekolah';
ALTER TABLE news ADD COLUMN IF NOT EXISTS author_name VARCHAR(150) DEFAULT 'Admin Sekolah';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS target_audience VARCHAR(50) DEFAULT 'all';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS target_role VARCHAR(50) DEFAULT 'all';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS time VARCHAR(50) DEFAULT '08:00 - Selesai';
LANGKAH 2: SINKRONISASI PAYLOAD CMS (NEWS, ANNOUNCEMENTS, EVENTS) DI api.js
Target File: frontend/shared/js/api.js

[CARI pada blok if (module === 'news') -> if (action === 'create')]:
const payload = {
id,
slug,
title: params.title || 'Berita Baru',
category: params.category || 'Umum',
summary: params.summary || params.excerpt || (params.content ? params.content.substring(0, 150) : ''),
content: params.content || params.body || '',
image: img || '',
author: params.author || 'Admin',
status: params.status || (params.is_published ? 'published' : 'draft'),
published_at: params.published_at || new Date().toISOString()
};

[GANTI DENGAN]:
const authorVal = params.author || params.author_name || 'Admin Sekolah';
const payload = {
id,
slug,
title: params.title || 'Berita Baru',
category: params.category || 'Umum',
summary: params.summary || params.excerpt || (params.content ? params.content.substring(0, 150) : ''),
content: params.content || params.body || '',
image: img || '',
author: authorVal,
author_name: authorVal,
status: params.status || (params.is_published ? 'published' : 'draft'),
published_at: params.published_at || new Date().toISOString()
};

[CARI pada blok if (module === 'announcements') -> create & update]:
if (action === 'create') {
const id = 'ANN-' + Date.now();
const payload = {
id,
title: params.title || 'Pengumuman Baru',
content: params.content || params.body || params.excerpt || '',
target_audience: params.target_audience || params.category || 'all',
is_pinned: !!params.is_pinned,
status: params.status || (params.is_published ? 'published' : 'draft'),
published_at: params.published_at || new Date().toISOString()
};
const res = await supabaseRest('announcements', 'POST', payload);
return { success: true, data: res[0] || payload, message: 'Pengumuman diterbitkan' };
}
if (action === 'update') {
const payload = {};
if (params.title) payload.title = params.title;
if (params.content || params.body) payload.content = params.content || params.body;
if (params.target_audience) payload.target_audience = params.target_audience;
if (params.status) payload.status = params.status;
if (params.is_pinned !== undefined) payload.is_pinned = !!params.is_pinned;
const res = await supabaseRest(announcements?id=eq.${encodeURIComponent(params.id)}, 'PATCH', payload);
return { success: true, data: res[0] || params, message: 'Pengumuman diperbarui' };
}

[GANTI DENGAN]:
if (action === 'create') {
const id = 'ANN-' + Date.now();
const targetAud = params.target_audience || params.target_role || params.category || 'all';
const payload = {
id,
title: params.title || 'Pengumuman Baru',
content: params.content || params.body || params.excerpt || '',
target_audience: targetAud,
target_role: targetAud,
is_pinned: !!params.is_pinned,
status: params.status || (params.is_published ? 'published' : 'draft'),
published_at: params.published_at || new Date().toISOString()
};
const res = await supabaseRest('announcements', 'POST', payload);
return { success: true, data: res[0] || payload, message: 'Pengumuman diterbitkan' };
}
if (action === 'update') {
const payload = {};
if (params.title) payload.title = params.title;
if (params.content || params.body) payload.content = params.content || params.body;
if (params.target_audience || params.target_role) {
payload.target_audience = params.target_audience || params.target_role;
payload.target_role = payload.target_audience;
}
if (params.status) payload.status = params.status;
if (params.is_pinned !== undefined) payload.is_pinned = !!params.is_pinned;
const res = await supabaseRest(announcements?id=eq.${encodeURIComponent(params.id)}, 'PATCH', payload);
return { success: true, data: res[0] || params, message: 'Pengumuman diperbarui' };
}

[CARI pada blok if (module === 'events')]:
if (module === 'events') {
if (action === 'list') {
const evts = await supabaseRest('events?select=*&order=date.asc');
return { success: true, data: evts, raw: { items: evts } };
}
if (action === 'create') {
const id = 'EVT-' + Date.now();
const payload = {
id,
title: params.title || 'Agenda Baru',
date: params.date || params.event_date || new Date().toISOString().split('T')[0],
time: params.time || '08:00 - Selesai',
location: params.location || 'Lingkungan Yayasan',
description: params.description || params.content || params.excerpt || '',
status: params.status || (params.is_published ? 'upcoming' : 'draft')
};
const res = await supabaseRest('events', 'POST', payload);
return { success: true, data: res[0] || payload, message: 'Agenda dibuat' };
}
if (action === 'update') {
const payload = {};
if (params.title) payload.title = params.title;
if (params.date || params.event_date) payload.date = params.date || params.event_date;
if (params.time) payload.time = params.time;
if (params.location) payload.location = params.location;
if (params.description || params.content) payload.description = params.description || params.content;
if (params.status) payload.status = params.status;
const res = await supabaseRest(events?id=eq.${encodeURIComponent(params.id)}, 'PATCH', payload);
return { success: true, data: res[0] || payload, message: 'Agenda diperbarui' };
}

[GANTI DENGAN]:
if (module === 'events') {
if (action === 'list') {
const evts = await supabaseRest('events?select=&order=event_date.asc').catch(() => supabaseRest('events?select='));
const normalizedEvts = (evts || []).map(e => ({ ...e, date: e.date || e.event_date, event_date: e.event_date || e.date }));
return { success: true, data: normalizedEvts, raw: { items: normalizedEvts } };
}
if (action === 'create') {
const id = 'EVT-' + Date.now();
const evtDate = params.date || params.event_date || new Date().toISOString().split('T')[0];
const payload = {
id,
title: params.title || 'Agenda Baru',
date: evtDate,
event_date: evtDate,
time: params.time || '08:00 - Selesai',
location: params.location || 'Lingkungan Yayasan',
description: params.description || params.content || params.excerpt || '',
status: params.status || (params.is_published ? 'upcoming' : 'draft')
};
const res = await supabaseRest('events', 'POST', payload);
return { success: true, data: res[0] || payload, message: 'Agenda dibuat' };
}
if (action === 'update') {
const payload = {};
if (params.title) payload.title = params.title;
if (params.date || params.event_date) {
payload.date = params.date || params.event_date;
payload.event_date = payload.date;
}
if (params.time) payload.time = params.time;
if (params.location) payload.location = params.location;
if (params.description || params.content) payload.description = params.description || params.content;
if (params.status) payload.status = params.status;
const res = await supabaseRest(events?id=eq.${encodeURIComponent(params.id)}, 'PATCH', payload);
return { success: true, data: res[0] || payload, message: 'Agenda diperbarui' };
}

LANGKAH 3: CEGAH DUPLIKASI BARIS SISWA & USER SAAT KONVERSI PPDB DI api.js
Target File: frontend/shared/js/api.js (Blok module === 'ppdb' -> action === 'convert')

[CARI]:
const stuId = 'STU-' + String(Date.now()).slice(-5);
const targetClassId = params.class_id || 'CLS-001';

      // Ambil nama kelas
      let targetClassName = 'PAUD / TK Terpadu';
      if (targetClassId) {
        const cls = await supabaseRest(`classes?id=eq.${encodeURIComponent(targetClassId)}&select=name`);
        if (cls && cls[0]) targetClassName = cls[0].name;
      }

      // 2. Tentukan NIS Siswa (bisa input dari admin atau auto-generate)
      const studentNis = params.nis || ('2026' + String(Math.floor(1000 + Math.random() * 9000)));

      // 3. Guard Keunikan NIS: Pastikan belum ada siswa yang memiliki NIS ini
      const existingNis = await supabaseRest(`students?nis=eq.${encodeURIComponent(studentNis)}&select=id`);
      if (existingNis && existingNis.length > 0) {
        return { success: false, message: `NIS ${studentNis} sudah digunakan oleh siswa aktif lain. Silakan gunakan nomor NIS lain.` };
      }

      // 4. Password awal dari Tanggal Lahir (Format default: YYYY-MM-DD atau DDMMYYYY)
      let birthDateStr = reg.birth_date || reg.student_birth_date ? String(reg.birth_date || reg.student_birth_date).trim() : '2021-01-01';
      let birthDatePassword = birthDateStr;
      if (birthDateStr.includes('-')) {
        const p = birthDateStr.split('-');
        if (p.length === 3) birthDatePassword = `${p[2]}${p[1]}${p[0]}`; // DDMMYYYY
      }

      const cleanPhone = (reg.phone || reg.parent_phone || '').replace(/[^0-9]/g, '');
      const studentEmail = reg.email || reg.parent_email || (cleanPhone ? `${studentNis}@siswa.yayasan.sch.id` : `siswa_${studentNis}@yayasan.sch.id`);
      const studentName = reg.student_name || reg.full_name || reg.child_name || 'Santri Baru';

      // 5. Cek apakah user akun pendaftar sudah ada (dari registrasi PPDB Akun-First)
      let existingUsers = await supabaseRest(`users?email=eq.${encodeURIComponent(studentEmail)}&select=*`);
      let userId = 'USR-' + studentNis;

      if (existingUsers && existingUsers.length > 0) {
        userId = existingUsers[0].id;
        await supabaseRest(`users?id=eq.${userId}`, 'PATCH', {
          role: 'siswa_aktif',
          role_label: 'Siswa Aktif',
          nis: studentNis,
          student_id: stuId,
          is_password_changed: false,
          status: 'active'
        });
      } else {
        await supabaseRest('users', 'POST', {
          id: userId,
          email: studentEmail,
          password_hash: birthDatePassword,
          full_name: studentName,
          name: studentName,
          phone: reg.phone || reg.parent_phone || '',
          role: 'siswa_aktif',
          role_label: 'Siswa Aktif',
          nis: studentNis,
          student_id: stuId,
          avatar: reg.photo_url || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
          status: 'active',
          is_password_changed: false
        });
      }

      // 6. Buat / Update Data Siswa Aktif
      const studentPayload = {
        id: stuId,
        user_id: userId,
        nis: studentNis,
        full_name: studentName,
        name: studentName,
        child_name: studentName,
        gender: reg.gender || reg.student_gender || 'L',
        birth_place: reg.birth_place || reg.student_birth_place || 'Samarinda',
        birth_date: birthDateStr,
        class_id: targetClassId,
        class_name: targetClassName,
        kelas_sekarang: targetClassName,
        semester_sekarang: 'Semester 1',
        status_kenaikan: 'Aktif',
        status_pendaftaran: 'accepted',
        is_active: true,
        parent_name: reg.parent_name || reg.father_name || reg.mother_name || '',
        parent_phone: reg.parent_phone || reg.phone || '',
        parent_email: studentEmail,
        address: reg.address || '',
        status: 'active'
      };
      await supabaseRest('students', 'POST', studentPayload);
[GANTI DENGAN]:
const targetClassId = params.class_id || 'CLS-001';

      // Ambil nama kelas
      let targetClassName = 'PAUD / TK Terpadu';
      if (targetClassId) {
        const cls = await supabaseRest(`classes?id=eq.${encodeURIComponent(targetClassId)}&select=name`);
        if (cls && cls[0]) targetClassName = cls[0].name;
      }

      // 2. Tentukan NIS Siswa (bisa input dari admin atau auto-generate)
      const studentNis = params.nis || ('2026' + String(Math.floor(1000 + Math.random() * 9000)));

      // 3. Guard Keunikan NIS: Pastikan belum ada siswa yang memiliki NIS ini
      const existingNis = await supabaseRest(`students?nis=eq.${encodeURIComponent(studentNis)}&select=id`);
      if (existingNis && existingNis.length > 0) {
        return { success: false, message: `NIS ${studentNis} sudah digunakan oleh siswa aktif lain. Silakan gunakan nomor NIS lain.` };
      }

      // 4. Password awal dari Tanggal Lahir (Format default: DDMMYYYY)
      let birthDateStr = reg.birth_date || reg.student_birth_date ? String(reg.birth_date || reg.student_birth_date).trim() : '2021-01-01';
      let birthDatePassword = birthDateStr;
      if (birthDateStr.includes('-')) {
        const p = birthDateStr.split('-');
        if (p.length === 3) birthDatePassword = `${p[2]}${p[1]}${p[0]}`; // DDMMYYYY
      }

      const regNo = reg.registration_number || reg.registration_no || '';
      const pendaftarEmail = `${regNo.toLowerCase().replace(/[^a-z0-9]/g, '')}@pendaftar.yayasan.sch.id`;
      const cleanPhone = (reg.phone || reg.parent_phone || '').replace(/[^0-9]/g, '');
      const studentEmail = reg.email || reg.parent_email || (cleanPhone ? `${studentNis}@siswa.yayasan.sch.id` : `siswa_${studentNis}@yayasan.sch.id`);
      const studentName = reg.student_name || reg.full_name || reg.child_name || 'Santri Baru';

      // 5. Cek apakah user akun pendaftar sudah ada (cari via email, username regNo, atau email pendaftar)
      let existingUsers = await supabaseRest(
        `users?or=(email.eq.${encodeURIComponent(studentEmail)},username.eq.${encodeURIComponent(regNo)},email.eq.${encodeURIComponent(pendaftarEmail)})&select=*`
      ).catch(() => []);

      let userId = (existingUsers && existingUsers[0]) ? existingUsers[0].id : ('USR-' + studentNis);
      let stuId = (existingUsers && existingUsers[0] && existingUsers[0].student_id)
        ? existingUsers[0].student_id
        : ('STU-' + String(Date.now()).slice(-5));

      if (existingUsers && existingUsers.length > 0) {
        await supabaseRest(`users?id=eq.${encodeURIComponent(userId)}`, 'PATCH', {
          email: studentEmail,
          role: 'siswa_aktif',
          role_label: 'Siswa Aktif',
          nis: studentNis,
          student_id: stuId,
          password_hash: birthDatePassword,
          is_password_changed: false,
          status: 'active'
        });
      } else {
        await supabaseRest('users', 'POST', {
          id: userId,
          email: studentEmail,
          password_hash: birthDatePassword,
          full_name: studentName,
          name: studentName,
          phone: reg.phone || reg.parent_phone || '',
          role: 'siswa_aktif',
          role_label: 'Siswa Aktif',
          nis: studentNis,
          student_id: stuId,
          avatar: reg.photo_url || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
          status: 'active',
          is_password_changed: false
        });
      }

      // 6. Buat atau Update Data Siswa Aktif (Tanpa Duplikasi Baris Pending)
      const studentPayload = {
        id: stuId,
        user_id: userId,
        nis: studentNis,
        full_name: studentName,
        name: studentName,
        child_name: studentName,
        nickname: reg.nickname || null,
        gender: reg.gender || reg.student_gender || 'L',
        birth_place: reg.birth_place || reg.student_birth_place || 'Samarinda',
        birth_date: birthDateStr,
        class_id: targetClassId,
        class_name: targetClassName,
        kelas_sekarang: targetClassName,
        semester_sekarang: 'Semester 1',
        status_kenaikan: 'Aktif',
        status_pendaftaran: 'accepted',
        is_active: true,
        parent_name: reg.parent_name || reg.father_name || reg.mother_name || '',
        father_name: reg.father_name || reg.parent_name || '',
        mother_name: reg.mother_name || '',
        parent_phone: reg.parent_phone || reg.phone || '',
        phone: reg.phone || reg.parent_phone || '',
        parent_email: studentEmail,
        photo_url: reg.photo_url || null,
        address: reg.address || '',
        status: 'active'
      };

      const existingStu = await supabaseRest(`students?id=eq.${encodeURIComponent(stuId)}&select=id`).catch(() => []);
      if (existingStu && existingStu.length > 0) {
        const patchStu = { ...studentPayload };
        delete patchStu.id;
        await supabaseRest(`students?id=eq.${encodeURIComponent(stuId)}`, 'PATCH', patchStu);
      } else {
        await supabaseRest('students', 'POST', studentPayload);
      }

      // Update jumlah siswa di kelas tujuan
      if (targetClassId) {
        supabaseRest(`students?class_id=eq.${encodeURIComponent(targetClassId)}&status=eq.active&select=id`).then(list => {
          supabaseRest(`classes?id=eq.${encodeURIComponent(targetClassId)}`, 'PATCH', { student_count: (list || []).length });
        }).catch(() => {});
      }
LANGKAH 4: FILTER LAPORAN SISWA AKTIF & TAMBAHKAN registration_no DI api.js
Target File: frontend/shared/js/api.js

4A. Pada ppdb/submitPublic, tambahkan registration_no: regNum, ke dalam regPayload:
[CARI]:
const regPayload = {
id,
registration_number: regNum,
student_name: studentName,

[GANTI DENGAN]:
const regPayload = {
id,
registration_number: regNum,
registration_no: regNum,
student_name: studentName,

4B. Pada reports/generate (repType === 'students'), filter hanya siswa berstatus active:
[CARI]:
if (repType === 'students') {
headers = ['No', 'NIS', 'Nama Lengkap', 'Kelas', 'Jenis Kelamin', 'Nama Wali', 'No. HP / WA', 'Status'];
const stu = await supabaseRest('students?select=*').catch(() => []);

[GANTI DENGAN]:
if (repType === 'students') {
headers = ['No', 'NIS', 'Nama Lengkap', 'Kelas', 'Jenis Kelamin', 'Nama Wali', 'No. HP / WA', 'Status'];
const stu = await supabaseRest('students?status=eq.active&select=*&order=full_name.asc').catch(() => []);

LANGKAH 5: SANITASI password_hash DARI SESSION LOGIN DI api.js
Target File: frontend/shared/js/api.js

5A. Pada auth/login:
[CARI]:
const userPayload = {
...matchedUser,
role: roleObj,
needs_password_change: needsPasswordChange,
student_id: studentId
};
const token = 'siy_' + matchedUser.id + '_' + Date.now();

[GANTI DENGAN]:
const userPayload = {
...matchedUser,
role: roleObj,
needs_password_change: needsPasswordChange,
student_id: studentId
};
delete userPayload.password_hash;
const token = 'siy_' + matchedUser.id + '_' + Date.now();

5B. Pada auth/register:
[CARI]:
const roleObj = { code: 'calon_siswa', name: 'Calon Siswa / Pendaftar' };
const userPayload = { ...newUser, role: roleObj, student_id: studentId };
const token = 'siy_' + userId + '_' + Date.now();

[GANTI DENGAN]:
const roleObj = { code: 'calon_siswa', name: 'Calon Siswa / Pendaftar' };
const userPayload = { ...newUser, role: roleObj, student_id: studentId };
delete userPayload.password_hash;
const token = 'siy_' + userId + '_' + Date.now();

5C. Pada ppdb/submitPublic:
[CARI]:
const roleObj = { code: 'calon_siswa', name: 'Calon Siswa / Pendaftar' };
const userSession = { ...newUser, role: roleObj, student_id: studentId };
const token = 'siy_' + userId + '_' + Date.now();

[GANTI DENGAN]:
const roleObj = { code: 'calon_siswa', name: 'Calon Siswa / Pendaftar' };
const userSession = { ...newUser, role: roleObj, student_id: studentId };
delete userSession.password_hash;
const token = 'siy_' + userId + '_' + Date.now();

LANGKAH 6: SINKRONKAN QUERY EVENTS DI frontend/public/js/app.js
Target File: frontend/public/js/app.js

[CARI]:
if (module === 'events') {
if (action === 'list') {
const evts = await supabaseRest('events?select=*&order=date.asc');
return { success: true, data: evts, raw: { items: evts } };
}
}

[GANTI DENGAN]:
if (module === 'events') {
if (action === 'list') {
const evts = await supabaseRest('events?select=&order=event_date.asc').catch(() => supabaseRest('events?select='));
const normalizedEvts = (evts || []).map(e => ({ ...e, date: e.date || e.event_date, event_date: e.event_date || e.date }));
return { success: true, data: normalizedEvts, raw: { items: normalizedEvts } };
}
}