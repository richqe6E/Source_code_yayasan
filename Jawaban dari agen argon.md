================================================================================
EXECUTABLE DIRECTIVE TAHAP 5 (FINAL CRUD FIELD MAPPING) — SIYAYASAN V2
Dari   : Lead System Auditor (Gemini 4 Argon)
Untuk  : Antigravity IDE Coding Agent
Tujuan : Memperbaiki mapping field yang terlewat pada `students/update` dan
         `teachers/create & update` di `api.js` & `local-api.js`, serta
         menyinkronkan blok ALTER TABLE ke `MASTER_SUPABASE_SETUP_V2.sql`.
================================================================================

Tolong eksekusi 4 langkah perbaikan spesifik di bawah ini:

--------------------------------------------------------------------------------
LANGKAH 1: LENGKAPI FIELD WALI & KONTAK PADA students/create & update DI api.js
--------------------------------------------------------------------------------
Target File: `frontend/shared/js/api.js`

1A. Pada `if (module === 'students')` -> `if (action === 'create')`, pastikan
    `father_name`, `mother_name`, `phone`, dan `nik` ikut tersimpan:
[CARI]:
            parent_id: params.parent_id || null,
            parent_name: params.parent_name || '',
            parent_email: params.parent_email || '',
            parent_phone: params.parent_phone || '',
            photo_url: params.photo_url || null,

[GANTI DENGAN]:
            nik: params.nik || null,
            parent_id: params.parent_id || null,
            parent_name: params.parent_name || params.father_name || params.mother_name || '',
            father_name: params.father_name || params.parent_name || '',
            mother_name: params.mother_name || '',
            parent_email: params.parent_email || params.email || '',
            parent_phone: params.parent_phone || params.phone || '',
            phone: params.phone || params.parent_phone || '',
            photo_url: params.photo_url || null,

1B. Pada `if (module === 'students')` -> `if (action === 'update')`, tambahkan
    mapping untuk data orang tua/wali, telepon, email, dan NIK agar perubahan dari
    Portal Admin tersimpan ke Supabase:
[CARI]:
          if (params.address !== undefined) payload.address = params.address;
          if (params.religion !== undefined) payload.religion = params.religion;
          if (params.entry_year !== undefined) payload.entry_year = params.entry_year;
          if (params.kelas_sekarang !== undefined) payload.kelas_sekarang = params.kelas_sekarang;
          if (params.semester_sekarang !== undefined) payload.semester_sekarang = params.semester_sekarang;
          if (params.status_kenaikan !== undefined) payload.status_kenaikan = params.status_kenaikan;
          if (params.status !== undefined) payload.status = params.status;
          if (params.photo_url !== undefined) payload.photo_url = params.photo_url;

          const res = await supabaseRest(`students?id=eq.${encodeURIComponent(id)}`, 'PATCH', payload);

[GANTI DENGAN]:
          if (params.nik !== undefined) payload.nik = params.nik;
          if (params.parent_name !== undefined) payload.parent_name = params.parent_name;
          if (params.father_name !== undefined) {
            payload.father_name = params.father_name;
            if (params.parent_name === undefined) payload.parent_name = params.father_name;
          }
          if (params.mother_name !== undefined) payload.mother_name = params.mother_name;
          if (params.parent_phone !== undefined || params.phone !== undefined) {
            const ph = params.parent_phone !== undefined ? params.parent_phone : params.phone;
            payload.parent_phone = ph;
            payload.phone = ph;
          }
          if (params.parent_email !== undefined || params.email !== undefined) {
            payload.parent_email = params.parent_email !== undefined ? params.parent_email : params.email;
          }
          if (params.address !== undefined) payload.address = params.address;
          if (params.religion !== undefined) payload.religion = params.religion;
          if (params.entry_year !== undefined) payload.entry_year = params.entry_year;
          if (params.kelas_sekarang !== undefined) payload.kelas_sekarang = params.kelas_sekarang;
          if (params.semester_sekarang !== undefined) payload.semester_sekarang = params.semester_sekarang;
          if (params.status_kenaikan !== undefined) payload.status_kenaikan = params.status_kenaikan;
          if (params.status !== undefined) payload.status = params.status;
          if (params.photo_url !== undefined) payload.photo_url = params.photo_url;
          payload.updated_at = new Date().toISOString();

          const res = await supabaseRest(`students?id=eq.${encodeURIComponent(id)}`, 'PATCH', payload);

--------------------------------------------------------------------------------
LANGKAH 2: LENGKAPI FIELD SPECIALIZATION & START_DATE GURU DI api.js
--------------------------------------------------------------------------------
Target File: `frontend/shared/js/api.js` (Blok `if (module === 'teachers')`)

[CARI]:
        if (action === 'create') {
          const id = 'TEA-' + String(Date.now()).slice(-5);
          const payload = {
            id,
            nip: params.nip || '',
            full_name: params.full_name || params.name || '',
            gender: params.gender || 'L',
            phone: params.phone || '',
            email: params.email || '',
            education: params.education || 'S1 Pendidikan',
            position: params.position || params.specialization || 'Guru Kelas',
            status: params.status || (params.is_active === false ? 'inactive' : 'active')
          };
          const res = await supabaseRest('teachers', 'POST', payload);
          return { success: true, data: res[0] || payload, message: 'Guru berhasil ditambahkan' };
        }
        if (action === 'update') {
          const id = params.id || (currentUser ? (currentUser.teacher_id || currentUser.id) : null);
          const payload = {};
          if (params.nip !== undefined) payload.nip = params.nip;
          if (params.full_name || params.name) payload.full_name = params.full_name || params.name;
          if (params.gender !== undefined) payload.gender = params.gender;
          if (params.phone !== undefined) payload.phone = params.phone;
          if (params.email !== undefined) payload.email = params.email;
          if (params.education !== undefined) payload.education = params.education;
          if (params.position || params.specialization) payload.position = params.position || params.specialization;
          if (params.status) payload.status = params.status;
          if (params.is_active !== undefined) payload.status = params.is_active ? 'active' : 'inactive';

[GANTI DENGAN]:
        if (action === 'create') {
          const id = 'TEA-' + String(Date.now()).slice(-5);
          const fullName = params.full_name || params.name || '';
          const spec = params.specialization || params.position || 'Guru Kelas';
          const sDate = params.start_date || params.joined_at || new Date().toISOString().slice(0, 10);
          const payload = {
            id,
            nip: params.nip || '',
            full_name: fullName,
            name: fullName,
            gender: params.gender || 'L',
            phone: params.phone || '',
            email: params.email || '',
            education: params.education || 'S1 Pendidikan',
            position: params.position || spec,
            specialization: spec,
            start_date: sDate,
            joined_at: sDate,
            status: params.status || (params.is_active === false ? 'inactive' : 'active')
          };
          const res = await supabaseRest('teachers', 'POST', payload);
          return { success: true, data: res[0] || payload, message: 'Guru berhasil ditambahkan' };
        }
        if (action === 'update') {
          const id = params.id || (currentUser ? (currentUser.teacher_id || currentUser.id) : null);
          const payload = {};
          if (params.nip !== undefined) payload.nip = params.nip;
          if (params.full_name || params.name) {
            payload.full_name = params.full_name || params.name;
            payload.name = payload.full_name;
          }
          if (params.gender !== undefined) payload.gender = params.gender;
          if (params.phone !== undefined) payload.phone = params.phone;
          if (params.email !== undefined) payload.email = params.email;
          if (params.education !== undefined) payload.education = params.education;
          if (params.position || params.specialization) {
            payload.position = params.position || params.specialization;
            payload.specialization = params.specialization || params.position;
          }
          if (params.start_date || params.joined_at) {
            payload.start_date = params.start_date || params.joined_at;
            payload.joined_at = payload.start_date;
          }
          if (params.status) payload.status = params.status;
          if (params.is_active !== undefined) payload.status = params.is_active ? 'active' : 'inactive';
          payload.updated_at = new Date().toISOString();

--------------------------------------------------------------------------------
LANGKAH 3: LENGKAPI students/update DI frontend/local-api.js
--------------------------------------------------------------------------------
Target File: `frontend/local-api.js` (Blok `if (module === 'students')` -> `update`)

[CARI]:
      if (params.parent_id != null) stu.parent_id = params.parent_id;
      if (params.parent_name != null) stu.parent_name = params.parent_name;
      if (params.birth_place != null) stu.birth_place = params.birth_place;
      if (params.birth_date != null) stu.birth_date = params.birth_date;
      if (params.status != null) stu.status = params.status;

[GANTI DENGAN]:
      if (params.nis != null) stu.nis = params.nis;
      if (params.nik != null) stu.nik = params.nik;
      if (params.parent_id != null) stu.parent_id = params.parent_id;
      if (params.parent_name != null) stu.parent_name = params.parent_name;
      if (params.father_name != null) { stu.father_name = params.father_name; if (params.parent_name == null) stu.parent_name = params.father_name; }
      if (params.mother_name != null) stu.mother_name = params.mother_name;
      if (params.parent_phone != null || params.phone != null) {
        stu.parent_phone = params.parent_phone != null ? params.parent_phone : params.phone;
        stu.phone = stu.parent_phone;
      }
      if (params.parent_email != null || params.email != null) {
        stu.parent_email = params.parent_email != null ? params.parent_email : params.email;
      }
      if (params.address != null) stu.address = params.address;
      if (params.birth_place != null) stu.birth_place = params.birth_place;
      if (params.birth_date != null) stu.birth_date = params.birth_date;
      if (params.status != null) stu.status = params.status;

--------------------------------------------------------------------------------
LANGKAH 4: SALIN BLOK ALTER TABLE KE MASTER_SUPABASE_SETUP_V2.sql & HAPUS akademik.html
--------------------------------------------------------------------------------
Target File:
- `database/MASTER_SUPABASE_SETUP_V2.sql`
- `frontend/portal/siswa/akademik.html`

Aksi Spesifik:
1. Salin blok nomor 8 (`ALTER TABLE students ...`) dan nomor 9 (`ALTER TABLE schools ...`
   serta `ALTER TABLE web_settings ...`) dari `database/patch_missing_columns.sql`
   ke dalam bagian `-- Migrasi Kolom Kompatibilitas Penuh` di `database/MASTER_SUPABASE_SETUP_V2.sql`.
2. Hapus file `frontend/portal/siswa/akademik.html` agar tidak lagi muncul di pohon
   direktori `frontend/portal/siswa/`.
================================================================================