
# Apps Script Backend — SIYAYASAN

Backend Google Apps Script untuk sistem SIYAYASAN. Folder ini berisi source code modular yang siap di-deploy ke Apps Script.

## Struktur Folder

```
apps-script/src/
├── Code.gs             # Main entry point + routing
├── Config.gs           # Konstanta global (perlu diedit)
├── Utils.gs            # Helper functions (ID generator, validators, dll)
├── Auth.gs             # Authentication service + activity log
├── Permissions.gs      # RBAC middleware + data isolation
│
└── services/           # Business logic per module
    ├── StudentService.gs   ✅ READY
    ├── PPDbService.gs      ✅ READY
    ├── ParentService.gs    📝 TODO
    ├── TeacherService.gs   📝 TODO
    ├── ClassService.gs     📝 TODO
    ├── AcademicYearService.gs 📝 TODO
    ├── AttendanceService.gs 📝 TODO
    ├── DevelopmentService.gs 📝 TODO
    ├── PaymentService.gs   📝 TODO
    ├── InvoiceService.gs   📝 TODO
    ├── AnnouncementService.gs 📝 TODO
    ├── NewsService.gs      📝 TODO
    ├── EventService.gs     📝 TODO
    ├── GalleryService.gs   📝 TODO
    ├── FileService.gs      📝 TODO
    ├── NotificationService.gs 📝 TODO
    ├── BackupService.gs    📝 TODO
    ├── ReportService.gs    📝 TODO
    ├── DashboardService.gs 📝 TODO
    ├── UserService.gs      📝 TODO
    └── Validator/          📝 TODO
```

## Status Implementasi

| Modul | Status |
|---|---|
| **Auth** | ✅ Lengkap |
| **Activity Log** | ✅ Lengkap |
| **Permissions / RBAC** | ✅ Lengkap |
| **Student Service** | ✅ Lengkap |
| **PPDB Service** | ✅ Lengkap |
| **Parent Service** | 📝 Stub |
| **Teacher Service** | 📝 Stub |
| **Class Service** | 📝 Stub |
| **Payment/Invoice** | 📝 Stub |
| **Attendance/Development** | 📝 Stub |
| **Content (Announcement/News/Event)** | 📝 Stub |
| **File Upload** | 📝 Stub |
| **Backup** | 📝 Stub |

## Cara Deploy

### Step 1: Buat Project Apps Script Baru

1. Buka https://script.google.com
2. Klik **"+ New Project"**
3. Rename jadi `SIYAYASAN_Backend`

### Step 2: Copy File ke Project

Untuk setiap file `.gs` di folder ini, buat file baru di project Apps Script dengan nama yang sama, lalu copy-paste isinya.

**Urutan penting:**

1. `Config.gs` (edit dulu `SPREADSHEET_ID` dan Firebase config)
2. `Utils.gs`
3. `Auth.gs`
4. `Permissions.gs`
5. `Code.gs`
6. `services/*.gs` (StudentService dulu, PPDbService, dst)

### Step 3: Edit Config.gs

Buka `Config.gs` dan ganti placeholder:

```js
var SPREADSHEET_ID = 'PASTE_SPREADSHEET_ID_DISINI';
// → ganti dengan ID spreadsheet dari URL

var DRIVE_ROOT_FOLDER_ID = 'PASTE_FOLDER_ID_DISINI';
// → ganti dengan ID folder Drive yayasan

var FIREBASE_CONFIG = { ... };
var FIREBASE_WEB_API_KEY = '...';
// → ganti dengan konfigurasi Firebase project
```

### Step 4: Setup Manifest

Apps Script otomatis membuat `appsscript.json`. Untuk set permission, edit:

```json
{
  "timeZone": "Asia/Jakarta",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/script.send_mail",
    "https://www.googleapis.com/auth/userinfo.email"
  ]
}
```

### Step 5: Deploy as Web App

1. Klik **Deploy** → **New deployment**
2. Type: **Web app**
3. Execute as: **Me** (akun owner)
4. Who has access: **Anyone** (untuk API publik PPDB)
5. Klik **Deploy**
6. Copy **Deployment ID** dan **Web App URL**

### Step 6: Setup Firebase Project

1. Buka https://console.firebase.google.com
2. Buat project baru (gratis Spark plan)
3. **Authentication** → **Get started** → aktifkan **Email/Password**
4. **Project Settings** → **General** → **Your apps** → **Web app**
5. Copy konfigurasi ke `Config.gs`
6. **Project Settings** → **Service Accounts** → generate new private key (untuk admin SDK)

### Step 7: Setup Triggers

1. Di editor Apps Script, buka `Code.gs`
2. Pilih function `setupTriggers`
3. Klik **Run**
4. Authorize permissions yang diminta
5. Cek di **Triggers** icon ⏰ di sidebar — pastikan trigger mingguan aktif

## API Endpoint Pattern

Base URL setelah deploy:

```
https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec
```

Request pattern:

```
GET  /api/v1/{module}/{action}?token=xxx&param1=value1
POST /api/v1/{module}/{action}  body: {param1: value1, ...}
```

Response format:

```json
{
  "success": true,
  "data": {...},
  "error": null,
  "meta": {
    "timestamp": "2026-09-12T10:00:00Z",
    "request_id": "uuid",
    "version": "1.0.0"
  }
}
```

## Testing Lokal

### Test Login

```bash
curl -X POST \
  "https://script.google.com/macros/s/{DEPLOY_ID}/exec?path=api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@yayasan.sch.id",
    "password": "your-password"
  }'
```

### Test Get Current User

```bash
curl "https://script.google.com/macros/s/{DEPLOY_ID}/exec?path=api/v1/auth/me&token={TOKEN}"
```

### Test List Students

```bash
curl "https://script.google.com/macros/s/{DEPLOY_ID}/exec?path=api/v1/students/list&token={TOKEN}"
```

## Pattern Pengembangan Service Baru

1. Buat file baru di folder `services/` dengan nama `XxxService.gs`
2. Ikuti pola IIFE (Immediately Invoked Function Expression)
3. Register handler di akhir file ke global object (e.g. `XxxHandlers`)
4. Tambahkan routing di `Code.gs` (switch case di `routeRequest`)
5. Test

Template minimal:

```js
var XxxService = (function () {
  function list(session, params) {
    if (!Permissions.hasPermission(session, 'xxx.read')) {
      return errorResponse(ERROR_CODES.FORBIDDEN, 'Tidak punya akses', {}, HTTP_STATUS.FORBIDDEN);
    }
    // ... business logic
    ActivityLogService.log({...});
    return successResponse({...});
  }

  return { list: list };
})();

// Register handler
XxxHandlers.list = function (session, id, params) {
  return jsonResponse(XxxService.list(session, params));
};
```

## Catatan Keamanan

1. **JANGAN** commit `Config.gs` ke Git dengan kredensial asli — gunakan env file terpisah
2. **JANGAN** hardcode API key di frontend
3. **SELALU** verify token di backend setiap request
4. **SELALU** cek permission sebelum aksi
5. **SELALU** validate input di backend (jangan percaya frontend)

## Roadmap Implementasi

Sudah selesai: Auth, Activity Log, Student, PPDB, struktur modular.

Berikutnya (urutan prioritas):

1. ParentService (auto-created di PPDB convert sudah ada, tinggal expose CRUD)
2. TeacherService
3. ClassService & AcademicYearService
4. AttendanceService (penting untuk guru)
5. DevelopmentService (penting untuk rapor online)
6. InvoiceService & PaymentService (penting untuk SPP)
7. AnnouncementService, NewsService, EventService, GalleryService (content)
8. FileService (upload ke Drive)
9. NotificationService (in-app + email)
10. ReportService (cetak PDF / export Excel)
11. DashboardService (kpi aggregations)
12. UserService (manajemen user oleh super admin)
13. BackupService (export sheets ke CSV mingguan)

---

**Dokumen ini bagian dari SIYAYASAN Blueprint v1.0**  
**Update terakhir:** 12 September 2026