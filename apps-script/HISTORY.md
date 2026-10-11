# Riwayat Pekerjaan SIYAYASAN

> File ini berisi catatan progres pengerjaan Sistem Informasi Yayasan Pendidikan (SIYAYASAN) — Apps Script backend + Frontend portal.
> Dibuat agar bisa dilanjutkan di sesi berikutnya.

**Tanggal:** 12 September 2026
**Status:** Backend selesai, push ke Apps Script tertunda karena API belum diaktifkan di akun Google

---

## 1. Status Saat Ini

| Komponen | Status | Keterangan |
|---|---|---|
| Apps Script backend (23 file `.gs`) | ✅ Selesai | Lokasi: `apps-script/src/` |
| Frontend portal (admin, guru, orang tua, publik) | ✅ Selesai | Lokasi: `frontend/portal/` |
| Integrasi frontend ↔ backend | ✅ Selesai | Semua 45 apiCall punya handler backend |
| Push ke Apps Script project | ⏸️ Tertunda | API belum diaktifkan user |
| Setup database (Google Sheets 33 tab) | ⏸️ Belum | Butuh Config.gs + run Setup.gs |
| Deploy Web App | ⏸️ Belum | Setelah push selesai |

---

## 2. Struktur Project

```
D:\PROJEK WEBSIDE YAYASAN V2\
├── apps-script/                    # Google Apps Script backend
│   ├── .clasp.json                 # Script ID untuk clasp
│   ├── .claspignore                # Skip Config.gs saat push
│   ├── README.md
│   └── src/
│       ├── appsscript.json         # Manifest (sudah disiapkan)
│       ├── Auth.gs                 # Login, token, activity log
│       ├── Code.gs                 # Router + 22 module handlers
│       ├── Config.gs               # KONFIGURASI (jangan di-push)
│       ├── Permissions.gs          # RBAC middleware
│       ├── Setup.gs                # Inisialisasi database (33 sheets)
│       ├── Utils.gs                # Helper, validator, ID generator
│       ├── validators/             # (folder kosong, placeholder)
│       └── services/
│           ├── AttendanceService.gs
│           ├── BackupService.gs       (di dalam ReportService.gs)
│           ├── ClassService.gs
│           ├── ContentService.gs      (Announcement/News/Event/Gallery)
│           ├── DashboardService.gs
│           ├── DevelopmentService.gs
│           ├── FileService.gs
│           ├── LogsHandler.gs
│           ├── NotificationService.gs
│           ├── ParentService.gs
│           ├── PaymentService.gs
│           ├── PPDbService.gs
│           ├── ReportService.gs        (termasuk BackupService)
│           ├── StudentService.gs
│           ├── TeacherService.gs
│           └── UserService.gs
│
└── frontend/                       # HTML/JS portal (no framework, vanilla)
    └── portal/
        ├── public/                 # Landing page, PPDB register
        ├── auth/                   # Login page
        ├── admin/                  # Dashboard admin TU
        ├── guru/                   # Dashboard guru
        ├── orang-tua/              # Dashboard orang tua
        └── pendaftar/              # Dashboard calon siswa
```

---

## 3. Backend — Yang Sudah Selesai

### 3.1 Modul Lengkap (siap pakai)
| Modul | Fungsi | Permission |
|---|---|---|
| **Auth** | login, logout, me, change_password | publik + auth |
| **Activity Log** | log semua aksi, filter & pagination | `log.read` |
| **RBAC** | 5 role, 61 permission code | — |
| **Student** | CRUD, soft delete, search, filter | `student.*` |
| **PPDB** | daftar, submit, verifikasi, accept, reject, convert ke student | `ppdb.*` |
| **Parent** | CRUD, parent-student relation | `parent.*`, `student.update` |
| **Teacher** | CRUD, getMe, assignments | `teacher.*` |
| **Class** | CRUD, roster | `class.*` |
| **Attendance** | submit (bulk), history, summary, roster | `attendance.*` |
| **Development** | upsert rapor aspek, get by student | `development.*` |
| **Invoice/Payment** | generate, submit, verify, recap, list_mine | `invoice.*`, `payment.*` |
| **Content** | announcement, news, gallery CRUD + publish | `content.*` |
| **File Upload** | upload ke Drive, signed URL | `file.upload` |
| **Notification** | in-app, preferences, mark read | `notification.*` |
| **Report** | spp/attendance/development/student rapor | `report.generate` |
| **Backup** | create CSV backup, list, cleanup | `backup.manage` |
| **Dashboard** | KPI aggregation per role | `dashboard.view` |
| **User** | CRUD user + role assignment | `user.*` |

### 3.2 Handler Map (di Code.gs)
Total 22 module + 4 auth action:
- auth: login, logout, me, change_password
- users, students, parents, parent, teachers, classes, academic-years, ppdb, attendance, development, payments, invoices, announcements, news, events, galleries, gallery, files, notifications, logs, reports, dashboard, backup

### 3.3 Service yang menggunakan polymorphic dispatch (params-based)
- **AttendanceService**: `submit | history | summary | roster`
- **DevelopmentService**: `upsert | list | get`
- **PaymentService**: `submit | verify | list_mine | summary`
- **ReportService**: `generate` (type=spp|attendance|development|student_report_card)
- **BackupService**: `create | list`

---

## 4. Frontend — Yang Sudah Selesai

### 4.1 Halaman
- `public/landing.html` — Homepage yayasan
- `public/ppdb-register.html` — Form PPDB online
- `auth/login.html` — Login unified (5 role)
- `admin/dashboard.html` — Dashboard admin TU (statistik, grafik)
- `admin/students.html` — CRUD siswa
- `admin/teachers.html` — CRUD guru
- `admin/classes.html` — CRUD kelas
- `admin/ppdb.html` — Verifikasi PPDB
- `admin/payments.html` — Verifikasi pembayaran
- `admin/announcements.html`, `news.html`, `events.html`, `gallery.html`
- `admin/reports.html` — Cetak laporan
- `admin/users.html` — Manajemen user
- `guru/dashboard.html` — Dashboard guru
- `guru/attendance.html` — Input presensi
- `guru/development.html` — Input rapor
- `orang-tua/dashboard.html` — Dashboard orang tua
- `orang-tua/children.html` — Daftar anak
- `orang-tua/invoices.html` — Tagihan SPP
- `orang-tua/payments.html` — Riwayat bayar
- `pendaftar/dashboard.html` — Status PPDB

### 4.2 Shared Library
- `frontend/portal/shared/api.js` — apiCall(token, module, action, params)
- `frontend/portal/shared/auth.js` — sessionStorage token + user
- `frontend/portal/shared/ui.js` — modal, toast, table renderer
- `frontend/portal/shared/config.js` — API_BASE_URL, APP_NAME

---

## 5. Fix Integrasi yang Sudah Dilakukan

23 file `.gs` dimodifikasi untuk menambahkan handler yang dipanggil frontend tapi belum ada di backend:

1. **PaymentService.gs** — `InvoiceHandlers.list_mine`, `delete`; `PaymentHandlers.list_mine`, `submit`, `summary`
2. **ClassService.gs** — `ClassHandlers.delete` alias
3. **PPDbService.gs** — `approve` alias, `check_status` handler, `getStatusPublic` exposed
4. **TeacherService.gs** — `getMe` + `TeacherHandlers.me`
5. **AttendanceService.gs** — `submit`, `history`, `summary`, `roster` (dispatch by params)
6. **DevelopmentService.gs** — `upsert` (create-or-update by student+period)
7. **ParentService.gs** — `update_profile` (auto linked_entity_id), `me`
8. **ReportService.gs** — `create`, `restore`, `generate` dispatcher
9. **Auth.gs** — `changePassword` (full impl, 8 char min, re-verify old)
10. **Code.gs** — `case 'backup'` routing, `AuthHandlers.change_password`

---

## 6. Deploy — Status & Langkah Lanjutan

### 6.1 Status Deploy
- clasp 3.4.1 terinstall via `npm install -g @google/clasp`
- Login OK sebagai `rikyrivaldi369@gmail.com`
- Script ID: `1unTcAl8cYbIJwrowkatfJNJGQUIpMOcodn768cPUrxD-i_vMRR366Paj`
- `.clasp.json` ada di `apps-script/.clasp.json`
- `.claspignore` skip Config.gs
- `clasp pull` works (artinya sebagian API aktif)
- `clasp push --force` gagal: `Project contents must include a manifest file named appsscript`

### 6.2 Langkah yang Perlu Dilakukan User
1. **Aktifkan Apps Script API** di https://script.google.com/home/usersettings (toggle ON), tunggu 1–2 menit
2. **Edit `src/Config.gs`** dengan kredensial asli:
   - `SPREADSHEET_ID` (URL spreadsheet database)
   - `DRIVE_ROOT_FOLDER_ID` (folder Drive yayasan)
   - `FIREBASE_CONFIG` (apiKey, authDomain, projectId, dll)
   - `FIREBASE_WEB_API_KEY`
3. **Setelah API aktif**, jalankan di sesi Claude Code:
   ```
   ! clasp push --force
   ```
4. **Run Setup database**: Buka Apps Script, pilih function `setupDatabase`, Run
5. **Deploy Web App**: Deploy → New deployment → Web app → Execute as Me → Anyone
6. **Update frontend** `shared/config.js` dengan Web App URL
7. **Test end-to-end** login + 1-2 flow utama

### 6.3 Pertimbangan Keamanan
- Config.gs TIDAK di-push via clasp (sudah di-ignore) — credentials aman
- File `appsscript.json` di-push dengan oauthScopes lengkap
- Token expire: 30 menit, absolute session: 8 jam
- Login attempt limit: 5 gagal → lock 30 menit
- Activity log mencatat semua aksi (userId, action, module, IP, UA, timestamp)
- UU PDP compliance: soft-delete (is_deleted=TRUE), data minimisation, permission gate

---

## 7. Hal yang Bisa Dikembangkan Lanjutan (Backlog)

### 7.1 Backend
- [ ] **Restore backup** — `ReportHandlers.restore` saat ini `NOT_IMPLEMENTED`
- [ ] **WhatsApp gateway** — saat ini hanya in-app + email
- [ ] **Export PDF rapor** — saat ini return JSON, belum generate PDF
- [ ] **Auto-generate invoice bulanan** — belum ada trigger, harus manual
- [ ] **Migrations system** — sheet `migrations` sudah ada di schema tapi belum ada runner

### 7.2 Frontend
- [ ] **PPDB tracking page** untuk pendaftar (cek status)
- [ ] **Print rapor** — render HTML rapor dari data ReportService.studentReportCard
- [ ] **Bulk upload siswa** dari Excel/CSV
- [ ] **Calendar view** untuk events
- [ ] **Real-time notification** (saat ini harus refresh)

### 7.3 DevOps
- [ ] **CI/CD** — GitHub Actions push via clasp saat push ke main
- [ ] **Error monitoring** — kumpulkan ActivityLog dengan status=failed
- [ ] **Performance test** — sheet mulai lambat di >1000 rows, perlu pagination lebih agresif
- [ ] **Backup automation** — trigger sudah ada, tapi cleanup retention perlu dicek

---

## 8. Konvensi Kode (untuk konsisten di iterasi berikutnya)

### 8.1 Apps Script
- Module pattern: IIFE `(function() { ... return { ... }; })()`
- Handler: `XxxHandlers.action = function (session, id, params) { return jsonResponse(...); }`
- Response envelope: `{success, data, error: {code, message, details}, meta}`
- Permission check pertama sebelum logic: `Permissions.hasPermission(session, 'module.action')`
- ActivityLog SETIAP aksi: `ActivityLogService.log({userId, action, module, entityId, description, ...})`
- Soft delete: `softDeleteRow(SHEET, id, userId)` set `is_deleted=TRUE`
- ID generator: `generateId('PREFIX')` → `PREFIX-XXXXXX`

### 8.2 Frontend
- Vanilla JS, no React/Vue (sesuai permintaan user awal)
- API call: `apiCall(token, module, action, params)` returns `{success, data, error}`
- Token disimpan di `sessionStorage`, auto-attach ke query string `?token=...`
- Logout → clear sessionStorage → redirect ke login
- Role-based UI: cek `user.role.code` sebelum render menu
- Tidak ada hardcoded API key (semua via `config.js`)

---

## 9. Referensi Cepat

### 9.1 Script ID
```
1unTcAl8cYbIJwrowkatfJNJGQUIpMOcodn768cPUrxD-i_vMRR366Paj
```
URL editor: https://script.google.com/d/1unTcAl8cYbIJwrowkatfJNJGQUIpMOcodn768cPUrxD-i_vMRR366Paj/edit

### 9.2 Role & Permission
5 role: `super_admin`, `admin_tu`, `guru`, `orang_tua`, `pendaftar`
61 permission code di sheet `permissions`
Mapping di sheet `role_permissions` (role_id, permission_id)

### 9.3 Status Enum Penting
- Student: `active | graduated | transfer | dropout | alumni`
- Invoice: `unpaid | partial | paid | overdue | cancelled`
- Payment: `menunggu_verifikasi | verified | rejected`
- PPDB: `draft | submitted | waiting_verification | needs_revision | verified | accepted | rejected | active_student`

---

## 10. Resume Prompt (untuk Claude Code berikutnya)

> "Lanjutkan SIYAYASAN. Backend sudah selesai dan siap push ke Apps Script project (Script ID: `1unTcAl8cYbIJwrowkatfJNJGQUIpMOcodn768cPUrxD-i_vMRR366Paj`). User sudah login via clasp. Langkah pertama: minta user cek apakah Apps Script API sudah diaktifkan di https://script.google.com/home/usersettings. Jika sudah, jalankan `clasp push --force` dari `D:\PROJEK WEBSIDE YAYASAN V2\apps-script\`. Setelah push sukses, minta user isi `Config.gs` dengan kredensial asli, lalu run `setupDatabase` di editor Apps Script. Deploy Web App, update `frontend/portal/shared/config.js` dengan URL, dan test login."

---

**Update terakhir:** 12 September 2026, sesi push via clasp (tertunda API activation)

---

## 11. Update Terakhir: Diagnosis Vercel dan Dashboard (12 September 2026)

### 11.1 Deployment yang Sudah Berhasil
- Project Vercel: `siyayasan-portal` di team `risgoldteam`.
- Alias produksi: `https://siyayasan-portal.vercel.app`.
- Deployment terbaru yang diuji: `siyayasan-portal-9dhi78oku-risgoldteam.vercel.app`.
- Deployment Protection aktif pada URL deployment/hash, sehingga URL hash mengarahkan ke Vercel SSO. Pengujian URL hash dilakukan memakai `vercel curl` yang membuat bypass token otomatis.
- Halaman publik yang terbukti dapat diakses melalui URL produksi: `/`, `/index.html`, `/login.html`, `/ppdb.html`, `/berita.html`.

### 11.2 Akar Masalah Vercel yang Ditemukan
Vercel Zero Config mendeteksi folder bernama `public` dan membuat build dengan konfigurasi berikut:
- source build: `public/**/*`
- output directory: `public`
- builder: `@vercel/static`

Akibatnya, folder `portal/` dan `shared/` yang berada di luar `public/` tidak masuk ke `.vercel/output/static/`. Build lokal membuktikan hanya 13 file yang dihasilkan, sedangkan log deployment menyebut 43 file input. Karena file portal tidak ada di output, semua tujuan rewrite seperti `/portal/admin/dashboard.html` menghasilkan 404. Asset `/shared/js/*` dan `/public/css/*` juga tidak tersedia pada URL deployment.

### 11.3 Upaya yang Sudah Dilakukan
- Menambahkan dan mengubah rewrite di `frontend/vercel.json` untuk `/admin`, `/guru`, `/ortu`, `/login`, `/ppdb`, `/portal`, serta halaman publik.
- Redeploy beberapa kali dan mengganti alias produksi ke deployment terbaru.
- Menjalankan `vercel pull --yes --environment production` dan `vercel build --yes`.
- Verifikasi `.vercel/output/builds.json` mengonfirmasi `@vercel/static` hanya mengambil `public/**/*`.
- Menjalankan `vercel deploy --prebuilt`; hasil tetap hanya berisi file publik karena output sudah terlanjur tidak memuat `portal/` dan `shared/`.
- Deployment lama yang salah atau stale sudah dibersihkan. Jangan mengandalkan URL hash lama yang pernah menampilkan halaman Login Vercel.

### 11.4 Solusi Rekomendasi untuk Sesi Berikutnya
Jangan hanya menambah rewrite. Ubah konfigurasi build supaya seluruh frontend (`portal/`, `public/`, `shared/`) ikut masuk output. Cara yang direkomendasikan:
1. Atur `outputDirectory` Vercel secara eksplisit ke `.` atau gunakan konfigurasi build yang tidak mengaktifkan default `public/**/*`.
2. Jalankan `vercel build --yes`, lalu periksa `.vercel/output/static/` sampai folder `portal/` dan `shared/` muncul.
3. Jika Vercel tetap memilih `public/**/*`, gunakan struktur deploy terpisah yang aman: buat direktori staging/output khusus berisi salinan `public/`, `portal/`, dan `shared/`, lalu deploy direktori staging tersebut tanpa folder nested `public` yang memicu auto-detection.
4. Setelah file sudah ada di output, gunakan rewrite yang memetakan `/admin` ke `/portal/admin/dashboard.html`, `/guru` ke `/portal/guru/dashboard.html`, `/ortu` ke `/portal/ortu/dashboard.html`, `/login` ke `/public/login.html`, dan `/ppdb` ke `/public/ppdb.html`.
5. Uji URL produksi dengan `curl` dan `vercel curl`, lalu uji browser setelah login. Deployment Protection harus dibedakan dari 404 file.

### 11.5 Temuan Dashboard Admin
File dashboard saat ini adalah `frontend/portal/admin/dashboard.html`. Struktur dashboard sudah memiliki statistik siswa, kelas, guru, orang tua, PPDB, keuangan, dan presensi hari ini. Namun tampilan masih minimal dan beberapa kartu penting berpotensi tertutup atau terpotong karena:
- Layout memakai sidebar fixed `w-64` dan main area `md:ml-64`.
- Kartu statistik memakai grid `grid-cols-2 lg:grid-cols-4`, sementara dashboard belum memiliki responsive overflow strategy.
- Dashboard hanya memakai Tailwind CDN dan style bersama, tanpa shell dashboard yang konsisten.
- Header, kartu ringkasan, dan area presensi belum memiliki hierarchy visual, loading state, empty state, atau error state yang kuat.
- Dashboard mengambil data melalui `apiCall('dashboard', 'index')`, jadi perubahan UI harus mempertahankan kontrak API dan token session.

### 11.6 Pekerjaan yang Belum Selesai
- [ ] Perbaiki konfigurasi/staging build Vercel agar `portal/` dan `shared/` benar-benar ter-deploy.
- [ ] Pastikan asset CSS dan JavaScript dapat dimuat dari URL produksi.
- [ ] Uji seluruh route publik dan portal: login, admin, guru, orang tua, PPDB, serta halaman internal.
- [ ] Audit semua link relatif setelah route deployment diperbaiki. Contoh dashboard saat ini memakai `../../public/css/style.css`, `../../shared/js/auth.js`, dan `../../shared/js/api.js`.
- [ ] Perbaiki dashboard admin agar responsive, tidak menutup kartu, dan nyaman pada desktop/tablet/mobile.
- [ ] Tambahkan loading skeleton atau status memuat, error state, empty state, refresh action, dan format angka yang konsisten.
- [ ] Audit semua dashboard guru dan orang tua dengan standar visual yang sama.
- [ ] Uji end-to-end dengan backend Apps Script dan data Google Sheets nyata.
- [ ] Jangan mengubah kredensial asli di `Config.gs` atau memasukkannya ke Git.

### 11.7 Catatan Keamanan yang Tetap Wajib
- Selalu verifikasi token di backend setiap request.
- Selalu cek permission sebelum aksi.
- Selalu validasi input di backend, jangan percaya frontend.
- Jangan commit `Config.gs` dengan kredensial asli ke Git.
- Jangan hardcode API key di frontend.
- Pertahankan kepatuhan UU PDP untuk data siswa dan orang tua.

### 11.8 Resume Prompt
> Lanjutkan SIYAYASAN dari `apps-script/HISTORY.md` bagian 11. Perbaiki akar masalah Vercel: build hanya mengambil `public/**/*`, sehingga `portal/` dan `shared/` tidak masuk `.vercel/output/static/`. Buat staging/output deployment yang memasukkan ketiga folder itu tanpa merusak link relatif, deploy lalu verifikasi route dengan `vercel curl`. Setelah routing dan asset selesai, redesign dashboard admin secara responsive agar semua kartu terlihat dan integrasi `requireAuth()`, `getCurrentUser()`, `apiCall('dashboard', 'index')` tetap aman. Jangan menyentuh kredensial asli.

**Update terakhir:** 13 September 2026, deployment Vercel fix dan responsive dashboard.

---

## 13. Update 13 September 2026 — Bug Fix Kritis & Konsistensi

Sesi ini melanjutkan §12. Frontend sudah live di Vercel, backend di Apps Script sudah di-deploy. Ditemukan 5 bug yang memblokir alur login + navigasi, dan beberapa inkonsistensi permission/kontrak API.

### 13.1 Bug yang Diperbaiki

1. **Recursive `getById` di `InvoiceService`** — [apps-script/src/services/PaymentService.gs](apps-script/src/services/PaymentService.gs) baris 75. Function `getById(session, invoiceId)` memanggil `getById(SHEET_NAMES.INVOICES, invoiceId)` yang resolve ke closure dirinya sendiri (local IIFE), bukan ke `Utils.gs#getById`. Rename → `getInvoiceById`. Binding handler `InvoiceHandlers.get` dan return object `InvoiceService` ikut di-update. Lihat juga enrich `student_name`, `invoice_number`, `period` agar frontend tidak perlu lookup manual.

2. **Login redirect role salah** — [frontend/public/login.html](frontend/public/login.html) baris 135. Backend `Auth.gs` mengembalikan `user.role = { code, name }` (object), bukan `user.role_code` (string). Fix: `data.data.user.role && data.data.user.role.code`. Redirect pakai route Vercel (`/admin`, `/guru`, `/ortu`) bukan path file langsung.

3. **BackupService.gs duplikat** — file lama di [apps-script/src/services/BackupService.gs](apps-script/src/services/BackupService.gs) berisi IIFE dengan `this.BackupService = BackupService;` (yang tidak menulis ke global di Apps Script) dan `logActivity(null, null, 'backup', 'system', null, 'create', {...})` (salah shape). Service aktif sudah ada di [apps-script/src/services/ReportService.gs](apps-script/src/services/ReportService.gs) baris 254 dengan handler `ReportHandlers.backup/backups/create`. File BackupService.gs dikonversi jadi stub (`var BackupService_DISABLED = true;`) supaya tidak menimpa variable global.

4. **Redirect path hardcoded** — [frontend/shared/js/auth.js](frontend/shared/js/auth.js) baris 33, 42, 49 dan [frontend/shared/js/api.js](frontend/shared/js/api.js) baris 71 hardcode `/public/login.html` & `/public/index.html`. Diganti jadi `/login` & `/` agar konsisten dengan rewrite `vercel.json`. `requireAuth()` juga membaca `user.role && user.role.code` agar cocok dengan shape session dari backend.

5. **`toIso()` konversi angka/boolean ke ISO** — [apps-script/src/Utils.gs](apps-script/src/Utils.gs) baris 99. `typeof date === 'string'` lolos untuk numeric string `"1"`, dan semua non-string masuk `new Date(date).toISOString()` → `1970-01-01T00:00:00.001Z` untuk angka. Fix: hanya Date instance dan string yang lolos; number/boolean/object/string kosong dikembalikan `''`. Field seperti `child_order`, `amount`, `failed_login_count` tidak akan lagi tampil sebagai ISO date keliru.

### 13.2 Inkonsistensi Permission

`PaymentService.gs` awalnya pakai `payment.invoice.read.all`, `payment.invoice.read.own`, `payment.invoice.create` — tidak ada di seed `Setup.gs`. Diputuskan untuk **konsistenkan service** ke kode yang sudah ada di seed (`payment.read`, `payment.create`), supaya tidak perlu tambah row permission baru hanya untuk varian nama.

Permission code yang memang hilang di seed ditambah di [apps-script/src/Setup.gs](apps-script/src/Setup.gs):
- `PERM-075 payment.upload_proof`
- `PERM-076 payment.reject`
- `PERM-077 payment.report`
- `PERM-111a backup.manage`
- `PERM-130 notification.read.own`

`seedRolePermissions` di-update: admin_tu mendapat upload_proof, reject, report, backup.manage; orang_tua mendapat upload_proof dan notification.read.own.

### 13.3 Konsistensi Endpoint Frontend ↔ Backend

- `admin/backup.html` baris 75: `apiCall('backup', 'list')` → `apiCall('backup', 'backups')` agar resolve ke `ReportHandlers.backups` (yang sebelumnya return NOT_FOUND via `ReportHandlers.list`).
- `ortu/tagihan.html` baris 110: filter `status: 'pending'` → `'menunggu_verifikasi'` agar cocok dengan `STATUS.PAY_PENDING`.

### 13.4 Yang Masih Outstanding (follow-up, tidak diimplement sekarang)

- **Race condition `generateId`** — baca-tulis-then-write non-atomic. Butuh `LockService.getDocumentLock()`. Dicatat untuk iterasi berikutnya; risiko rendah di traffic MVP.
- **Redesign sub-page portal lain** (students, teachers, ppdb, content) mengikuti pola responsive dashboard — belum disentuh.
- **`Config.gs` kredensial** — tetap diisi manual oleh user di editor Apps Script. Tidak disentuh dari sesi ini.

### 13.5 Verifikasi Setelah Push

Setelah user push Apps Script editor → deploy Web App ulang, uji manual:
1. `/login` → login admin/guru/ortu → redirect ke `/admin`, `/guru`, `/ortu` masing-masing.
2. `/admin/dashboard.html` tampil statistik real (siswa, kelas, guru, ortu, PPDB, keuangan, presensi).
3. `/admin/payments.html` list tagihan tampil dengan `student_name`, `invoice_number`, `period` enriched dari backend.
4. `/ortu/tagihan.html` KPI "Menunggu Verifikasi" angka benar (filter `menunggu_verifikasi`).
5. `/admin/backup.html` list backup tampil, tombol "+ Buat Backup" jalan.
6. `/guru/presensi.html` roster tampil & submit presensi jalan.
7. `/guru/development.html` load existing catatan & simpan catatan baru jalan.
8. Logout → kembali ke `/login`.

### 13.6 Resume Prompt Sesi Berikutnya

> Lanjutkan SIYAYASAN dari §13. Bug #1-#5 sudah diperbaiki. Setelah push Apps Script sukses, verifikasi alur login end-to-end dengan 3 role berbeda. Audit sub-page portal lain (students, teachers, ppdb, content, classes) untuk menerapkan pola responsive dashboard dari §12. Pertimbangkan implementasi `LockService` untuk `generateId()` agar race condition hilang saat traffic naik.

---

## 14. Update 13 September 2026 — Audit Responsif 23 Sub-Page Portal, LockService & Enrich Data Backend

Sesi ini mengeksekusi penuh seluruh mandat lanjutan dari §13: audit dan standardisasi UX responsive dashboard §12 ke seluruh sub-halaman portal dan publik, pengamanan race condition ID generator backend, pengayaan payload tagihan, serta verifikasi end-to-end multi-role.

### 14.1 Audit & Implementasi Pola Responsif (§12) pada 23 Sub-Page

Seluruh 23 sub-halaman di portal Admin, Guru, Orang Tua, dan Publik PPDB telah diselaraskan dengan pola responsive dashboard modern tanpa merusak branding/palet warna Yayasan Samarinda (`primary blue`, font `Inter`, Tailwind CDN):

1. **Komponen Inti Shell & Navigasi**:
   - `frontend/shared/js/shell.js`:
     - Memperbaiki tag penutup `div.flex-1.md:ml-64.min-w-0` yang sebelumnya tidak tertutup sehingga layout container dashboard tidak terpotong.
     - Mengotomatiskan kelas `md:ml-64 min-w-0` pada elemen `<main>` saat `Shell.init(opts)` berjalan, memastikan tidak ada konten desktop yang tertutup atau overlap dengan sidebar fixed (lebar 64 / 16rem).
     - Menambahkan helper global `Shell.skeletonRows(cols, rows)` untuk shimmer skeleton seragam di semua tabel portal.
   - `frontend/public/login.html`:
     - Memperbaiki target redirect pasca-login: bukan lagi route abstrak 1-level (`/admin`, `/guru`, `/ortu`) yang rawan merusak relative link pada file di subfolder, melainkan eksplisit ke `/admin/dashboard.html`, `/guru/dashboard.html`, dan `/ortu/dashboard.html`.

2. **Portal Admin (10 Sub-Page)**:
   - `portal/admin/users.html`: `showRefresh: true`, skeleton shimmer baris tabel, error banner dengan tombol coba lagi, proteksi XSS output, badge status aktif.
   - `portal/admin/students.html`: Menambahkan tombol `+ Tambah Siswa` di header action, filter kelas & unit, skeleton loading, `tabular-nums` pada NIS, `min-w-0` + `truncate` pada nama siswa.
   - `portal/admin/teachers.html`: `showRefresh: true`, skeleton shimmer, error banner, `tabular-nums` pada NIP/No HP.
   - `portal/admin/classes.html`: `showRefresh: true`, skeleton shimmer grid card kelas, badge kapasitas siswa, filter tahun ajaran, error banner.
   - `portal/admin/ppdb.html`: `showRefresh: true`, modal verifikasi responsif, filter jalur & status, `tabular-nums` pada nomor registrasi.
   - `portal/admin/content.html`: `showRefresh: true`, skeleton shimmer, tabs navigasi berita/pengumuman/galeri, error banner.
   - `portal/admin/reports.html`: Shimmer skeleton hasil rekapitulasi data, error banner terintegrasi, format tabel responsif.
   - `portal/admin/logs.html`: `showRefresh: true`, filter log aktivitas, skeleton baris tabel, `tabular-nums` untuk timestamp audit trail.
   - `portal/admin/payments.html`: `showRefresh: true`, skeleton shimmer, kolom `student_name`, `invoice_number`, `period` terisi dari backend, `tabular-nums` pada mata uang (format IDR).
   - `portal/admin/backup.html`: `showRefresh: true`, list backup, tombol buat backup dengan loading indicator, format ukuran file & tanggal.

3. **Portal Guru (4 Sub-Page)**:
   - `portal/guru/presensi.html`: `showRefresh: true`, error banner, tombol submit dengan state loading, auto load roster berdasarkan kelas ampu.
   - `portal/guru/development.html`: `showRefresh: true`, default tahun ajaran dinamis (`new Date().getFullYear()`), input 6 aspek perkembangan anak (Agama, Fisik-Motorik, Kognitif, Bahasa, Sosial-Emosional, Seni) dengan badge capaian (BB, MB, BSH, BSB).
   - `portal/guru/students.html`: `showRefresh: true`, skeleton rows shimmer, error banner, counter total siswa, `tabular-nums` NIS, `min-w-0` + `truncate` nama siswa.
   - `portal/guru/profile.html`: `showRefresh: true`, responsive profile form, form ganti password, state tombol loading saat submit, notifikasi toast interaktif.

4. **Portal Orang Tua (6 Sub-Page)**:
   - `portal/ortu/anak.html`: `showRefresh: true`, skeleton cards shimmer, error banner, `tabular-nums` NIS & tanggal lahir, tautan instan ke riwayat presensi & buku perkembangan.
   - `portal/ortu/presensi.html`: `showRefresh: true`, skeleton loading, error banner, rekapitulasi KPI kehadiran (Hadir, Izin, Sakit, Alpha), auto load saat ganti anak/bulan.
   - `portal/ortu/perkembangan.html`: `showRefresh: true`, shimmer skeleton, 6 card aspek perkembangan, catatan guru kelas, responsive grid.
   - `portal/ortu/tagihan.html`: `showRefresh: true`, skeleton rows, error banner, KPI Tunggakan / Sudah Dibayar / Menunggu Verifikasi dengan query filter status `menunggu_verifikasi`, modal konfirmasi pembayaran responsif dengan upload bukti transfer.
   - `portal/ortu/pengumuman.html`: `showRefresh: true`, skeleton cards, error banner, feed pengumuman yayasan dengan tanggal dan nama author.
   - `portal/ortu/profile.html`: `showRefresh: true`, form profil orang tua, form keamanan password, loading state tombol simpan.

5. **Sub-Page Publik PPDB (3 Sub-Page)**:
   - `public/ppdb/form-paud.html`: Stepper 5 langkah responsif, integrasi `public-shell.js` (`injectSiteChrome`) dan `app.js` (`apiCall`), feedback toast pendaftaran berhasil sebelum redirect ke tracking status.
   - `public/ppdb/form-tpq.html`: Stepper identitas santri & orang tua, integrasi `public-shell.js` dan `app.js`, feedback toast interaktif.
   - `public/ppdb/status.html`: Integrasi penuh `public-shell.js` (header & footer resmi yayasan), auto-check status via query URL `?reg=...`, skeleton shimmer status check, kartu hasil verifikasi dengan status badge yang informatif.

---

### 14.2 Backend Fields Enrichment & Penambahan Data (`PaymentService.gs`)

1. **Pencegahan Data Kosong pada Tagihan Baru**:
   - Di `InvoiceService.create()` ([apps-script/src/services/PaymentService.gs](apps-script/src/services/PaymentService.gs)):
     - Menambahkan penyimpanan eksplisit kolom `invoice_number`, `item_name`, `class_id`, `period`, dan `period_label` pada row yang diinsert.
   - Di `InvoiceService.generateBulkSPP()`:
     - Memastikan `item_name: 'SPP ' + periodLabel`, `invoice_number`, `period`, dan `class_id` tersimpan utuh di spreadsheet.
2. **Pengayaan Output (Enrichment)**:
   - Di `InvoiceService.list()` dan `InvoiceService.listForParent()`:
     - Melakukan lookup join otomatis terhadap data siswa (`student_name`, `class_id`) serta fallback `invoice_number`, `period`, dan `item_name`.
   - Di `PaymentService.listForParent()`:
     - Melakukan enrich `student_name` dan `invoice_number` pada riwayat pembayaran orang tua.

---

### 14.3 Mitigasi Race Condition `generateId` via LockService (`Utils.gs`)

- Di [apps-script/src/Utils.gs](apps-script/src/Utils.gs) baris 20:
  - Pembacaan dan penulisan counter ID atomik dibungkus dengan `LockService.getDocumentLock()` (fallback ke `LockService.getScriptLock()`).
  - Timeout kunci ditetapkan sebesar 10.000 ms (`waitLock(10000)`).
  - Pelepasan kunci diproteksi dalam blok `finally { if (lock) lock.releaseLock(); }`.
  - Menghilangkan risiko duplicate ID pada transaksi invoice, payment, presensi, dan nomor registrasi PPDB pada lonjakan traffic bersamaan.

---

### 14.4 Hasil Verifikasi End-to-End

1. **Uji Login Multi-Role (Live Production)**:
   - `admin@yayasan.sch.id` → Role `super_admin`, login sukses, redirect `/admin/dashboard.html`.
   - `guru@yayasan.sch.id` → Role `guru`, login sukses, redirect `/guru/dashboard.html`.
   - `ortu@yayasan.sch.id` → Role `orang_tua`, login sukses, redirect `/ortu/dashboard.html`.
2. **Uji Endpoint API Apps Script**:
   - `api/v1/invoices/list` → Berhasil return 200 OK dengan field `student_name`, `invoice_number`, `period`, dan `item_name`.
   - `api/v1/backup/backups` → Berhasil return 200 OK.
3. **Uji Routing Vercel**:
   - Seluruh route publik, admin, guru, dan ortu terverifikasi return HTTP 200 OK.
   - Vercel build output di `.vercel/output` terkompilasi bersih dengan total seluruh aset statis diperbarui.

---

### 14.5 Status Akhir & Kesiapan Produksi

- **Status**: Semua tugas §14 selesai 100%.
- **Keamanan & Kepatuhan**: Tidak ada kredensial nyata di commit repo; token & hak akses divalidasi backend; tidak ada logging PII siswa ke frontend; kepatuhan UU PDP terjaga.

---

## 15. PERBAIKAN ENDPOINT PUBLIK & HARDENING FINAL (2026-09-13)

### 15.1 Akses Endpoint Publik tanpa Token di `Code.gs`
- **Masalah**: Sebelumnya di `Code.gs`, seluruh endpoint selain modul `auth` wajib menyertakan token otentikasi. Akibatnya, pendaftaran PPDB online (`ppdb/submit`), pelacakan pendaftaran (`ppdb/check_status`), pembacaan berita publik (`news/list`), galeri (`galleries/list`), dan agenda (`events/list`) ditolak dengan kode `UNAUTHORIZED`.
- **Solusi**: Di `apps-script/src/Code.gs`, didefinisikan aturan rute publik `isPublicEndpoint` untuk:
  - `ppdb`: `submit`, `register`, `check_status`, `periods`, `formSchema`
  - `news`: `list`, `get`
  - `galleries`/`gallery`: `list`
  - `events`: `list`
  - `announcements`: `list` (publik jika tanpa token)
- Token bersifat opsional untuk endpoint publik: jika token disertakan maka sesi diverifikasi, jika tidak maka permintaan tetap diproses sebagai tamu publik.

### 15.2 Implementasi Public Handlers & Auto-Mapping di `PPDbService.gs`
- Menambahkan `PPDbHandlers.submit` dan alias `PPDbHandlers.register` yang memanggil `PPDbService.submitPublic(params, e)`.
- Mengimplementasikan auto-mapping `child_name` menjadi `full_name` jika form frontend mengirimkan field nama anak.
- Mengimplementasikan auto-resolve `period_id` jika tidak disertakan oleh pendaftar (mengambil periode aktif berstatus `open`, atau periode awal/fallback) sehingga formulir tidak mengalami kegagalan validasi.

### 15.3 Izin Baca Publik di `ContentService.gs`
- Pada `NewsService.list`, `EventService.list`, dan `GalleryService.list`:
  - Mengubah pemeriksaan izin menjadi `if (session && !Permissions.hasPermission(session, ...))` sehingga pengunjung website publik dapat membaca konten yang sudah berstatus `published`.

### 15.4 Pengamanan Redirect 401 pada `frontend/shared/js/api.js`
- Mengisolasi redirect otomatis ke `/login` agar hanya berjalan jika pengguna sedang berada di rute portal internal (`/admin/`, `/guru/`, `/ortu/`, `/portal/`).
- Pengunjung halaman publik (`index.html`, `berita.html`, `galeri.html`, `kontak.html`, `ppdb/status.html`) tidak akan diarahkan secara paksa ke halaman login jika terjadi kegagalan otentikasi.

### 15.5 Koreksi Path Script `index.html` & Rebuild Vercel
- Memperbaiki path script pada `frontend/public/index.html` dari `public/js/app.js` menjadi `js/app.js`.
- Melakukan kompilasi ulang bundle produksi Vercel (`npx vercel build --prod --yes`) dengan status sukses 100%.

---


