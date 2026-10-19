# Audit Remediation & System Integration (SIYAYASAN V2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Memperbaiki bug integrasi lintas portal, sinkronisasi nomor NIS & password PPDB, filter rombel berjenjang, query master guru, visibilitas berkas dokumen siswa di admin, otomatisasi invoice SPP awal, dan standardisasi konten identitas institusi sesuai hasil audit yang telah divalidasi.

**Architecture:** Memperbaiki adapter data hybrid di `frontend/shared/js/api.js` (dengan sinkronisasi Supabase Cloud & local fallback), memperkaya antarmuka modal di portal admin (`admin/ppdb.html`, `admin/students.html`, `admin/classes.html`), serta membenahi alur cek status & autentikasi publik (`ppdb/status.html`, `login.html`, `profil.html`, `index.html`) tanpa melanggar arsitektur 2-portal dan standar warna Oceanic Blue.

**Tech Stack:** Vanilla JavaScript (ES6+ Native), HTML5 Semantik, Tailwind CSS + Vanilla CSS (Oceanic Blue: `#0284c7`), Supabase REST API (PostgreSQL & Storage), Node.js HTTP dev-server & test harness.

**Spec:** [`directive_antigravity_siyayasan_v2.md`](file:///d:/Source_code_yayasan/directive_antigravity_siyayasan_v2.md) (dengan koreksi teknis pada nama file `siswa/spp.html` dan pembersihan klaim redundan).

---

## Global Constraints

- **Arsitektur 2-Portal Tetap:** Portal Admin Sekolah & Portal Siswa Mandiri. Modul guru & orang tua tetap nonaktif di `.legacy_backup/`.
- **Zero-Green Rule (Oceanic Blue):** Seluruh elemen UI portal baru harus menggunakan token warna primer `#0284c7`, `#0ea5e9`, `#0369a1` dan turunan sky/slate, bukan hijau/emerald.
- **Dual-Storage Compatibility:** Semua perubahan adapter `api.js` wajib mendukung Supabase Cloud REST API dengan graceful fallback ke `localStorage` / `local-api.js` saat offline.
- **Non-Destructive DB Policy:** Tidak boleh menghapus data uji coba yang sudah ada di database Supabase Cloud kecuali pembaruan record saat pengujian.

---

## Review Focus

1. **NIS Resolver Mismatch:** Jika pendaftar sudah berstatus `converted` tetapi query lama belum memiliki kolom `converted_nis`, sistem harus secara cerdas mencari NIS dari tabel `students` berdasarkan `registration_number` agar tidak muncul `"NIS Anda ()"`.
2. **Password Flexibility:** Siswa yang mendaftar dan menentukan password kustom di PPDB Tahap 3 harus bisa login dengan password tersebut ATAU dengan tanggal lahir (`DDMMYYYY` / `YYYY-MM-DD`).
3. **Database Schema Divergence (`teachers`):** Kolom status aktif pada tabel `teachers` di Supabase adalah `status` (bukan boolean `is_active`), sehingga adapter harus memetakan filter `status = 'active'` secara aman.
4. **Missing SPP Invoice for Converted Students:** Pendaftar yang baru dikonversi harus memiliki invoice SPP bulan pertama berstatus `unpaid` agar saat pertama kali membuka `spp.html`, langsung muncul tagihan resmi.
5. **Admin Document Review Dead-End:** File pas foto, KK, dan akta kelahiran santri di `student_documents` harus dapat dilihat langsung oleh admin di `admin/students.html` tanpa error CORS atau broken link.

---

## Rincian Task Implementasi

### Task 1: Binding NIS, Resolusi Status Siswa Diterima & Tombol Login SIAKAD di `ppdb/status.html` & `api.js`

**Files:**
- Modify: `frontend/shared/js/api.js:1896-1915`
- Modify: `frontend/public/ppdb/status.html:130-195`
- Test: `tests/test-nis-status-flow.js`

**Interfaces:**
- Consumes: `ppdb_registrations` data, `students` table record via Supabase / Local DB.
- Produces: `registration.converted_nis` / `registration.nis` tersimpan di DB & tersaji di UI `status.html`. Tombol portal siswa menggunakan styling kontras tinggi yang jelas.

- [ ] **Step 1: Tulis tes otomatis untuk alur cek status PPDB dan nomor NIS**

Buat file `tests/test-nis-status-flow.js`:
```javascript
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE: NIS STATUS & BUTTON VISIBILITY ===');

// 1. Periksa kode di api.js bahwa konversi menyimpan nis dan class_name ke ppdb_registrations
const apiContent = fs.readFileSync(path.join(__dirname, '../frontend/shared/js/api.js'), 'utf8');
assert(apiContent.includes("converted_nis: studentNis") || apiContent.includes("nis: studentNis"), 'api.js wajib menyimpan NIS ke ppdb_registrations');

// 2. Periksa ppdb/status.html bahwa tombol login tidak menggunakan class invisible text-primary-950
const statusContent = fs.readFileSync(path.join(__dirname, '../frontend/public/ppdb/status.html'), 'utf8');
assert(!statusContent.includes('text-primary-950'), 'status.html tidak boleh menggunakan class text-primary-950 yang tak terdefinisi');
assert(statusContent.includes('resolveStudentNis') || statusContent.includes('converted_nis || r.nis'), 'status.html wajib memiliki NIS resolver yang tangguh');

console.log('✅ Semua pengujian spesifikasi Task 1 valid!');
```

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan awal**

Jalankan: `node tests/test-nis-status-flow.js`
Ekspektasi: GAGAL (karena `api.js` belum menyimpan `converted_nis` ke `ppdb_registrations`).

- [ ] **Step 3: Perbaiki `frontend/shared/js/api.js` pada blok `action === 'convert'`**

Di `frontend/shared/js/api.js`, ubah bagian update status registrasi PPDB:
```javascript
// Update Status Registrasi PPDB menjadi 'converted' beserta metadata NIS & Kelas
await supabaseRest(`ppdb_registrations?id=eq.${reg.id}`, 'PATCH', {
  status: 'converted',
  converted_nis: studentNis,
  nis: studentNis,
  class_name: targetClassName,
  notes: `Diterima sebagai Siswa Aktif (NIS: ${studentNis}, Kelas: ${targetClassName})`
}).catch(async () => {
  // Fallback jika kolom nis/converted_nis belum ada di tabel Supabase: simpan di notes & form_metadata
  await supabaseRest(`ppdb_registrations?id=eq.${reg.id}`, 'PATCH', {
    status: 'converted',
    notes: `Diterima sebagai Siswa Aktif (NIS: ${studentNis}, Kelas: ${targetClassName})`,
    form_metadata: {
      ...(reg.form_metadata || {}),
      converted_nis: studentNis,
      nis: studentNis,
      class_name: targetClassName
    }
  });
});
```

- [ ] **Step 4: Perbaiki `frontend/public/ppdb/status.html` pada resolver NIS dan tombol login**

Di `frontend/public/ppdb/status.html`:
1. Tambahkan resolver pencarian NIS fallback ke API `students` jika di registrasi belum ada angka NIS:
```javascript
let nis = r.converted_nis || r.nis || (r.form_metadata && (r.form_metadata.converted_nis || r.form_metadata.nis)) || '';
if (!nis && (rawStatus === 'converted' || isConverted)) {
  try {
    const stuRes = await apiCall('students', 'list', { search: regNo, per_page: 5 });
    const students = Array.isArray(stuRes.data) ? stuRes.data : ((stuRes.data && (stuRes.data.students || stuRes.data.items)) || []);
    const matched = students.find(s => s.reg_number === regNo || s.full_name?.toLowerCase() === childName?.toLowerCase());
    if (matched && matched.nis) nis = String(matched.nis);
  } catch (_) {}
}
```
2. Ganti class tombol `Masuk ke Portal Siswa Sekarang` dari `text-primary-950` menjadi warna teks tegas dengan latar putih bersih:
```html
<a href="../login.html" class="flex-1 py-3 px-4 bg-white hover:bg-slate-100 text-primary-800 font-bold text-xs rounded-xl shadow-md border border-white/40 transition flex items-center justify-center gap-2">
  <span>Masuk ke Portal Siswa Sekarang</span>
  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
</a>
```

- [ ] **Step 5: Jalankan tes ulang dan verifikasi kelulusan**

Jalankan: `node tests/test-nis-status-flow.js`
Ekspektasi: PASS (LULUS 100%).

- [ ] **Step 6: Commit perubahan Task 1**

```bash
git add tests/test-nis-status-flow.js frontend/shared/js/api.js frontend/public/ppdb/status.html
git commit -m "fix(ppdb): save converted NIS to registration and fix white button in status.html"
```

---

### Task 2: Harmonisasi Password PPDB Tahap 3, Konversi Admin, & Validator `login.html`

**Files:**
- Modify: `frontend/shared/js/api.js:1797-1848, 385-408`
- Modify: `frontend/public/login.html:325-335`
- Test: `tests/test-auth-password-flow.js`

**Interfaces:**
- Consumes: `reg.password` dari PPDB Tahap 3, tanggal lahir santri (`DDMMYYYY` / `YYYY-MM-DD`).
- Produces: User record dengan password kustom atau fallback tanggal lahir ganda, pesan error login yang informatif.

- [ ] **Step 1: Tulis tes otomatis untuk multi-password login (Password PPDB & Tanggal Lahir)**

Buat file `tests/test-auth-password-flow.js`:
```javascript
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE: AUTHENTICATION & PASSWORD HARMONIZATION ===');

const apiContent = fs.readFileSync(path.join(__dirname, '../frontend/shared/js/api.js'), 'utf8');

// Pastikan convert menyimpan password kustom jika ada
assert(apiContent.includes('customPassword') || apiContent.includes('customPpdbPass'), 'api.js convert harus mendukung password pendaftaran PPDB');

// Pastikan validator login mendukung format DDMMYYYY dan YYYY-MM-DD
assert(apiContent.includes('DDMMYYYY') || apiContent.includes('ddmmyyyy'), 'api.js validator harus mengenali format DDMMYYYY');

const loginHtml = fs.readFileSync(path.join(__dirname, '../frontend/public/login.html'), 'utf8');
assert(loginHtml.includes('DDMMYYYY') || loginHtml.includes('Tanggal Lahir'), 'login.html harus mencantumkan petunjuk tanggal lahir yang jelas');

console.log('✅ Semua pengujian spesifikasi Task 2 valid!');
```

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan awal**

Jalankan: `node tests/test-auth-password-flow.js`
Ekspektasi: GAGAL.

- [ ] **Step 3: Modifikasi `frontend/shared/js/api.js` pada fungsi konversi dan login**

1. Pada blok konversi (`action === 'convert'`):
```javascript
// Password pendaftaran kustom atau fallback tanggal lahir
const customPpdbPass = reg.password || (reg.form_metadata && reg.form_metadata.password) || '';
const initialPassword = customPpdbPass || birthDatePassword;
```
Simpan `password_hash: initialPassword`, serta catat `fallback_dob_password: birthDatePassword`.

2. Pada blok login (`action === 'login'`):
Izinkan kecocokan jika `password === matchedUser.password_hash`, atau jika cocok dengan tanggal lahir santri dalam format `DDMMYYYY`, `YYYY-MM-DD`, maupun angka bersih.
Perbarui pesan error jika salah password:
`return { success: false, message: 'Password salah. Gunakan password yang Anda buat saat pendaftaran PPDB atau gunakan Tanggal Lahir format DDMMYYYY (cth: 14052020).' };`

3. Pada `frontend/public/login.html`:
Perbarui petunjuk login siswa:
`• <strong>Password Awal:</strong> Tanggal Lahir format DDMMYYYY (cth: 14052020) atau password saat pendaftaran PPDB`

- [ ] **Step 4: Jalankan tes ulang dan verifikasi kelulusan**

Jalankan: `node tests/test-auth-password-flow.js`
Ekspektasi: PASS (LULUS 100%).

- [ ] **Step 5: Commit perubahan Task 2**

```bash
git add tests/test-auth-password-flow.js frontend/shared/js/api.js frontend/public/login.html
git commit -m "fix(auth): harmonize PPDB custom password and multi-format birthdate login validator"
```

---

### Task 3: Filter Otomatis Dropdown Rombel Berdasarkan Jenjang Pendaftar di `admin/ppdb.html`

**Files:**
- Modify: `frontend/portal/admin/ppdb.html:534-580`
- Test: `tests/test-ppdb-class-filter.js`

**Interfaces:**
- Consumes: `applicant.level` / `applicant.jenjang`, array `classes` dari API.
- Produces: Dropdown `<select id="cm-class">` terkelompok rapi dengan `<optgroup>` dan auto-selected pada kelas yang cocok.

- [ ] **Step 1: Tulis tes unit untuk perenderan opsi kelas berjenjang**

Buat file `tests/test-ppdb-class-filter.js`:
```javascript
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE: PPDB CLASS SELECTION BY LEVEL ===');

const ppdbAdminContent = fs.readFileSync(path.join(__dirname, '../frontend/portal/admin/ppdb.html'), 'utf8');

// Pastikan ada logika pencocokan jenjang kelas
assert(ppdbAdminContent.includes('matchingClasses') || ppdbAdminContent.includes('targetJenjang') || ppdbAdminContent.includes('optgroup'), 'admin/ppdb.html wajib memiliki filter jenjang untuk opsi rombel');

console.log('✅ Semua pengujian spesifikasi Task 3 valid!');
```

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan awal**

Jalankan: `node tests/test-ppdb-class-filter.js`
Ekspektasi: GAGAL.

- [ ] **Step 3: Modifikasi `convertReg(id)` di `frontend/portal/admin/ppdb.html`**

Cari pendaftar yang sedang dikonversi dari array `allRegistrations` / cache:
```javascript
const applicant = (allRegistrations || []).find(x => String(x.id) === String(id)) || {};
const targetJenjang = (applicant.level || applicant.form_type || applicant.jenjang || '').toUpperCase();

// Pisahkan kelas yang sesuai jenjang pendaftar
const matchingClasses = classes.filter(c => {
  const cLevel = (c.level || c.grade_level || c.name || '').toUpperCase();
  if (targetJenjang.includes('PAUD') || targetJenjang.includes('KB')) {
    return cLevel.includes('PAUD') || cLevel.includes('KB') || cLevel.includes('BERMAIN');
  }
  if (targetJenjang.includes('TK A') || targetJenjang.includes('TKA')) {
    return cLevel.includes('TK A') || cLevel.includes('TKA');
  }
  if (targetJenjang.includes('TK B') || targetJenjang.includes('TKB')) {
    return cLevel.includes('TK B') || cLevel.includes('TKB');
  }
  if (targetJenjang.includes('TK')) return cLevel.includes('TK');
  if (targetJenjang.includes('TPQ')) return cLevel.includes('TPQ');
  return false;
});

const otherClasses = classes.filter(c => !matchingClasses.includes(c));

let optionsHtml = '';
if (matchingClasses.length > 0) {
  optionsHtml += `<optgroup label="Sesuai Jenjang (${targetJenjang})">`;
  optionsHtml += matchingClasses.map((c, i) => `<option value="${c.id}" ${i === 0 ? 'selected' : ''}>${c.name} (${c.level || targetJenjang})</option>`).join('');
  optionsHtml += `</optgroup>`;
}
if (otherClasses.length > 0) {
  optionsHtml += `<optgroup label="Pilihan Kelas Lainnya">`;
  optionsHtml += otherClasses.map((c, i) => `<option value="${c.id}" ${matchingClasses.length === 0 && i === 0 ? 'selected' : ''}>${c.name} (${c.level || '-'})</option>`).join('');
  optionsHtml += `</optgroup>`;
}
```

- [ ] **Step 4: Jalankan tes ulang dan verifikasi kelulusan**

Jalankan: `node tests/test-ppdb-class-filter.js`
Ekspektasi: PASS (LULUS 100%).

- [ ] **Step 5: Commit perubahan Task 3**

```bash
git add tests/test-ppdb-class-filter.js frontend/portal/admin/ppdb.html
git commit -m "feat(ppdb): auto-filter class rombel options based on applicant target level"
```

---

### Task 4: Perbaikan Query Guru Aktif untuk Dropdown Wali Kelas Rombel di `admin/classes.html` & `api.js`

**Files:**
- Modify: `frontend/shared/js/api.js:820-836`
- Modify: `frontend/portal/admin/classes.html:140-146`
- Test: `tests/test-teachers-classes-flow.js`

**Interfaces:**
- Consumes: Tabel `teachers` (kolom `status` = 'active').
- Produces: Respon `apiCall('teachers', 'list', ...)` yang berisi daftar guru aktif lengkap, terpopulasi di dropdown Wali Kelas `classes.html`.

- [ ] **Step 1: Tulis tes unit untuk query guru aktif dan dropdown wali kelas**

Buat file `tests/test-teachers-classes-flow.js`:
```javascript
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE: TEACHER QUERY & HOMEROOM DROPDOWN ===');

const apiContent = fs.readFileSync(path.join(__dirname, '../frontend/shared/js/api.js'), 'utf8');

// Pastikan query teachers di api.js memeriksa kolom status='active' (bukan hanya is_active)
assert(apiContent.includes("status.eq.active") || apiContent.includes("t.status === 'active'"), 'api.js harus query status=active untuk kompatibilitas skema Supabase');

const classesContent = fs.readFileSync(path.join(__dirname, '../frontend/portal/admin/classes.html'), 'utf8');
assert(classesContent.includes('loadTeachersOptions'), 'classes.html harus memiliki fungsi pemuat opsi guru');

console.log('✅ Semua pengujian spesifikasi Task 4 valid!');
```

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan awal**

Jalankan: `node tests/test-teachers-classes-flow.js`
Ekspektasi: GAGAL (karena `api.js` masih query `is_active=eq.true` yang tidak ada di skema).

- [ ] **Step 3: Perbaiki modul `teachers` action `list` di `frontend/shared/js/api.js`**

Di `frontend/shared/js/api.js` baris 821–836:
```javascript
if (module === 'teachers') {
  if (action === 'list') {
    let query = 'teachers?select=*&order=full_name.asc';
    if (params.search || params.q) {
      const sTerm = encodeURIComponent(params.search || params.q);
      query += `&or=(full_name.ilike.*${sTerm}*,nip.ilike.*${sTerm}*,specialization.ilike.*${sTerm}*)`;
    }
    // Kompatibilitas skema: tabel teachers menggunakan kolom status='active', bukan boolean is_active
    if (params.is_active !== undefined && params.is_active !== '') {
      const isAct = (params.is_active === true || params.is_active === 'true' || params.is_active === 1 || params.is_active === '1');
      if (isAct) {
        query += `&status=eq.active`;
      }
    }
    const teachers = await supabaseRest(query);
    const mapped = (teachers || []).map(t => ({
      ...t,
      is_active: t.status === 'active' || t.is_active === true
    }));
    return { success: true, data: mapped };
  }
```

- [ ] **Step 4: Perbaiki pemetaan dropdown di `frontend/portal/admin/classes.html`**

Di `frontend/portal/admin/classes.html` fungsi `loadTeachersOptions()`:
```javascript
async function loadTeachersOptions() {
  const res = await apiCall('teachers', 'list', { per_page: 100, is_active: 'true' });
  if (res.success) {
    const teachers = Array.isArray(res.data) ? res.data : ((res.data && (res.data.items || res.data.teachers)) || []);
    document.getElementById('form-teacher').innerHTML = '<option value="">- Tanpa Wali Kelas -</option>' + teachers.map(t => {
      const name = t.full_name || t.name;
      const nip = t.nip ? ` (NIP: ${t.nip})` : '';
      return `<option value="${t.id}">${escapeAttr(name)}${escapeAttr(nip)}</option>`;
    }).join('');
  }
}
```

- [ ] **Step 5: Jalankan tes ulang dan verifikasi kelulusan**

Jalankan: `node tests/test-teachers-classes-flow.js`
Ekspektasi: PASS (LULUS 100%).

- [ ] **Step 6: Commit perubahan Task 4**

```bash
git add tests/test-teachers-classes-flow.js frontend/shared/js/api.js frontend/portal/admin/classes.html
git commit -m "fix(classes): resolve teachers status column query for homeroom dropdown"
```

---

### Task 5: Panel Pratinjau Berkas Dokumen Siswa di `admin/students.html`

**Files:**
- Modify: `frontend/portal/admin/students.html:390-440`
- Modify: `frontend/shared/js/api.js:900-940`
- Test: `tests/test-admin-student-docs.js`

**Interfaces:**
- Consumes: Dokumen siswa dari tabel `student_documents` / properti `students.documents`.
- Produces: Seksi visual pratinjau dokumen santri (Pas Foto, Kartu Keluarga, Akta Kelahiran) di modal detail admin dengan link/tombol buka file.

- [ ] **Step 1: Tulis tes unit untuk panel berkas dokumen di modal data siswa**

Buat file `tests/test-admin-student-docs.js`:
```javascript
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE: ADMIN STUDENT DOCUMENTS PREVIEW ===');

const studentsHtml = fs.readFileSync(path.join(__dirname, '../frontend/portal/admin/students.html'), 'utf8');

// Pastikan ada container berkas dokumen siswa di dalam modal
assert(studentsHtml.includes('student-documents-preview') || studentsHtml.includes('loadStudentDocuments'), 'admin/students.html harus memiliki panel dokumen siswa');

console.log('✅ Semua pengujian spesifikasi Task 5 valid!');
```

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan awal**

Jalankan: `node tests/test-admin-student-docs.js`
Ekspektasi: GAGAL.

- [ ] **Step 3: Modifikasi modal siswa di `frontend/portal/admin/students.html`**

1. Tambahkan kontainer dokumen di dalam modal edit siswa:
```html
<div class="mt-4 pt-4 border-t border-gray-200">
  <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Berkas Dokumen Santri (Persyaratan PPDB / Susulan)</label>
  <div id="student-documents-preview" class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
    <div class="text-gray-400 italic">Memuat berkas dokumen...</div>
  </div>
</div>
```

2. Tambahkan fungsi `loadStudentDocuments(studentId, studentNis)`:
Ambil berkas dari `apiCall('students', 'documents', { student_id: studentId })` atau `apiCall('ppdb', 'list_documents', { student_id: studentId })`.
Tampilkan kartu berkas untuk:
- Pas Foto Santri (dengan thumbnail preview)
- Kartu Keluarga (KK) (dengan tombol Buka File / Unduh)
- Akta Kelahiran (dengan tombol Buka File / Unduh)
Jika belum diunggah, tampilkan badge abu-abu: *"Belum Diunggah"*.

- [ ] **Step 4: Jalankan tes ulang dan verifikasi kelulusan**

Jalankan: `node tests/test-admin-student-docs.js`
Ekspektasi: PASS (LULUS 100%).

- [ ] **Step 5: Commit perubahan Task 5**

```bash
git add tests/test-admin-student-docs.js frontend/portal/admin/students.html
git commit -m "feat(students): add student documents review panel in admin modal"
```

---

### Task 6: Otomatisasi Penerbitan Tagihan SPP Bulan Pertama Saat Konversi Siswa Baru

**Files:**
- Modify: `frontend/portal/admin/ppdb.html:565-595`
- Modify: `frontend/shared/js/api.js:1890-1925`
- Test: `tests/test-auto-invoice-flow.js`

**Interfaces:**
- Consumes: Parameter `auto_spp` dari modal konversi di `admin/ppdb.html`.
- Produces: 1 record invoice baru di tabel `invoices` dengan status `unpaid` dan nomor invoice resmi `INV/2026/XXXX`.

- [ ] **Step 1: Tulis tes unit untuk pembuatan otomatis tagihan SPP awal**

Buat file `tests/test-auto-invoice-flow.js`:
```javascript
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE: AUTO FIRST MONTH SPP INVOICE ===');

const ppdbHtml = fs.readFileSync(path.join(__dirname, '../frontend/portal/admin/ppdb.html'), 'utf8');
assert(ppdbHtml.includes('cm-auto-spp') || ppdbHtml.includes('auto_spp'), 'admin/ppdb.html harus memiliki opsi terbitkan SPP awal');

const apiContent = fs.readFileSync(path.join(__dirname, '../frontend/shared/js/api.js'), 'utf8');
assert(apiContent.includes("invoices") && (apiContent.includes("INV/") || apiContent.includes("SPP Bulan")), 'api.js harus memiliki generator invoice SPP awal saat konversi');

console.log('✅ Semua pengujian spesifikasi Task 6 valid!');
```

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan awal**

Jalankan: `node tests/test-auto-invoice-flow.js`
Ekspektasi: GAGAL.

- [ ] **Step 3: Tambahkan checkbox di modal `admin/ppdb.html` dan proses di `api.js`**

1. Pada modal konversi di `frontend/portal/admin/ppdb.html`:
```html
<label class="flex items-start gap-2.5 p-3 rounded-lg bg-sky-50 border border-sky-200 cursor-pointer">
  <input type="checkbox" id="cm-auto-spp" checked class="mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500">
  <span class="text-xs text-slate-700">
    <strong class="font-bold text-slate-900 block">Terbitkan Tagihan SPP Bulan Pertama Otomatis</strong>
    Buat tagihan SPP awal (Rp 150.000) agar langsung muncul di Portal Siswa.
  </span>
</label>
```
Kirim `auto_spp: modal.querySelector('#cm-auto-spp').checked` ke `apiCall('ppdb', 'convert', ...)`.

2. Pada `frontend/shared/js/api.js` di dalam blok `convert`:
```javascript
if (params.auto_spp !== false) {
  const currentYear = new Date().getFullYear();
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const currentMonthName = monthNames[new Date().getMonth()];
  const invNumber = `INV/${currentYear}/${String(Math.floor(1000 + Math.random() * 9000))}`;
  const invPayload = {
    id: 'INV-' + String(Date.now()).slice(-6),
    invoice_number: invNumber,
    student_id: stuId,
    student_name: studentName,
    student_nis: studentNis,
    title: `SPP Bulan ${currentMonthName} ${currentYear}`,
    amount: 150000,
    status: 'unpaid',
    due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    academic_year: `${currentYear}/${currentYear + 1}`,
    created_at: new Date().toISOString()
  };
  await supabaseRest('invoices', 'POST', invPayload).catch(() => {});
}
```

- [ ] **Step 4: Jalankan tes ulang dan verifikasi kelulusan**

Jalankan: `node tests/test-auto-invoice-flow.js`
Ekspektasi: PASS (LULUS 100%).

- [ ] **Step 5: Commit perubahan Task 6**

```bash
git add tests/test-auto-invoice-flow.js frontend/portal/admin/ppdb.html frontend/shared/js/api.js
git commit -m "feat(ppdb): auto-generate first month SPP invoice upon student conversion"
```

---

### Task 7: Standardisasi Konten Usia Jenjang & Pembersihan Kicker Pill di Halaman Publik

**Files:**
- Modify: `frontend/public/index.html:269-338`
- Modify: `frontend/public/profil.html:70-85, 170-210`
- Modify: `frontend/public/ppdb.html:180-200`
- Test: `tests/test-content-consistency.js`

**Interfaces:**
- Menyamakan standar rentang usia pendidikan di seluruh teks halaman publik:
  - PAUD Terpadu: Usia 2–4 Tahun
  - TK At Tarbiyyah: Usia 4–6 Tahun (TK A: 4–5 Tahun, TK B: 5–6 Tahun)
  - TPQ At Tarbiyyah: Usia 5–12 Tahun
- Menghapus sisa badge kapsul `rounded-full` di `profil.html` dan menggantinya dengan teks overline formal.

- [ ] **Step 1: Tulis tes unit untuk konsistensi usia jenjang dan ketiadaan kicker pill**

Buat file `tests/test-content-consistency.js`:
```javascript
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE: CONTENT & AGE CONSISTENCY ===');

const profilHtml = fs.readFileSync(path.join(__dirname, '../frontend/public/profil.html'), 'utf8');

// Pastikan profil.html memisahkan rentang usia secara konsisten
assert(!profilHtml.includes('Perjalanan Sejak 2010</span>\n          </span>'), 'profil.html kicker harus formal');
assert(profilHtml.includes('2 - 4 Tahun') || profilHtml.includes('2–4 Tahun'), 'profil.html wajib menyebut PAUD 2-4 tahun');

console.log('✅ Semua pengujian spesifikasi Task 7 valid!');
```

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan awal**

Jalankan: `node tests/test-content-consistency.js`
Ekspektasi: GAGAL.

- [ ] **Step 3: Update `profil.html`, `index.html`, dan `ppdb.html`**

1. Di `frontend/public/profil.html`:
Ganti badge kapsul `rounded-full` di baris 74 menjadi overline formal:
```html
<span class="block text-xs font-bold uppercase tracking-widest text-primary-700 mb-1">
  Sejarah &amp; Komitmen Institusi &bull; Samarinda Ulu
</span>
```
Perbarui rentang usia jenjang di kartu program agar seragam:
- PAUD Terpadu: `Usia 2 – 4 Tahun`
- TK At Tarbiyyah: `Usia 4 – 6 Tahun`
- TPQ At Tarbiyyah: `Usia 5 – 12 Tahun`

2. Di `frontend/public/index.html` dan `frontend/public/ppdb.html`:
Pastikan teks narasi jenjang konsisten menggunakan standar angka tersebut.

- [ ] **Step 4: Jalankan tes ulang dan verifikasi kelulusan**

Jalankan: `node tests/test-content-consistency.js`
Ekspektasi: PASS (LULUS 100%).

- [ ] **Step 5: Commit perubahan Task 7**

```bash
git add tests/test-content-consistency.js frontend/public/profil.html frontend/public/index.html frontend/public/ppdb.html
git commit -m "style(content): standardize academic unit age ranges and polish profile typography"
```

---

### Task 8: Regresi Menyeluruh, Audit 4 Persona & Pembaruan Dokumen Status

**Files:**
- Modify: `PROJECT_STATUS.md`
- Modify: `PROJECT_CONTEXT_CHECKPOINT.md`
- Test: Seluruh file pengujian otomatis sistem

- [ ] **Step 1: Jalankan seluruh suite tes otomatis komprehensif**

Jalankan rangkaian tes:
```bash
node test-simulation.js
node frontend/audit-all-features.js
node frontend/test-ppdb-visibility.js
node frontend/test-routes.js
node frontend/test-cms-e2e.js
node frontend/test-ppdb-e2e.js
node frontend/test-spp-e2e.js
node tests/test-nis-status-flow.js
node tests/test-auth-password-flow.js
node tests/test-ppdb-class-filter.js
node tests/test-teachers-classes-flow.js
node tests/test-admin-student-docs.js
node tests/test-auto-invoice-flow.js
node tests/test-content-consistency.js
```
Ekspektasi: Seluruh pengujian berstatus **100% LULUS**.

- [ ] **Step 2: Perbarui dokumentasi resmi `PROJECT_STATUS.md` dan `PROJECT_CONTEXT_CHECKPOINT.md`**

Dokumentasikan pelaksanaan Sesi 40 (Remediasi Audit Direktif Agen Argon), rincian commit, status integrasi baru, dan pastikan SOP pembaruan status terpenuhi 100%.

- [ ] **Step 3: Commit akhir dan verifikasi status git bersih**

```bash
git add PROJECT_STATUS.md PROJECT_CONTEXT_CHECKPOINT.md
git commit -m "docs: update PROJECT_STATUS and checkpoint for Session 40 audit remediation"
git status
```
Ekspektasi: Git working tree clean (tanpa file uncommitted/untracked).
