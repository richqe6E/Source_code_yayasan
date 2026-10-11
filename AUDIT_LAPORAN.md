# SIYAYASAN V2 — Laporan Audit Terpadu

> **Tujuan:** Audit-only. TIDAK ada perubahan kode. Dokumen ini mendaftar akar masalah yang ditemukan dari cross-check tiga sisi: GAS backend (`apps-script/src/`), mock backend (`frontend/local-api.js`), dan frontend HTML+JS.
> **Tanggal:** 2026-09-14

---

## Ringkasan Eksekutif

Sistem **tidak stabil end-to-end**. Ada **15 masalah critical/high** yang akan menyebabkan error, data kosong, atau halaman crash di production. Banyak di antaranya ada di frontend, bukan backend.

**Fakta penting:**
- HANDOVER.md klaim "171/171 RBAC pass" — angka ini **stale**. File `test-rbac-matrix.js` saat ini berisi **144 test, bukan 171**. Klaim ini perlu dikoreksi.
- `SPREADSHEET_ID` di [Config.gs:15](apps-script/src/Config.gs#L15) masih placeholder `'PASTE_SPREADSHEET_ID_DISINI'`. `getDatabase()` akan throw error. **Walau user mengklaim sudah konfigurasi, file kode masih placeholder — ini sumber utama kenapa semua endpoint production return INTERNAL_ERROR.**

---

## Bagian A — Akar Masalah Produksi (Live Server)

### A1. SPREADSHEET_ID belum dikonfigurasi di kode (CRITICAL)
- **Lokasi:** [Config.gs:15](apps-script/src/Config.gs#L15) dan [Config.gs:21](apps-script/src/Config.gs#L21)
- **Bukti:** Kode masih `var SPREADSHEET_ID = 'PASTE_SPREADSHEET_ID_DISINI';`
- **Dampak:** Setiap endpoint backend yang membaca sheet → throw `SPREADSHEET_ID belum dikonfigurasi di Config.gs`. Login, list, dashboard semua gagal.
- **Mengapa HANDOVER.md klaim berfungsi:** Mungkin user sudah pernah konfigurasi tapi perubahan di-overwrite oleh `clasp push -f`, atau user konfigurasi via Script Properties (yang tidak dibaca `getDatabase()`).
- **Tindakan manual:** Buka script.google.com → file `Config.gs` → ganti kedua placeholder dengan ID spreadsheet & folder Drive yang sebenarnya → Save → Deploy ulang.

### A2. DRIVE_ROOT_FOLDER_ID placeholder
- **Lokasi:** [Config.gs:21](apps-script/src/Config.gs#L21)
- **Dampak:** Upload foto/berkas apa pun (foto siswa, bukti bayar, foto pengumuman) akan throw.
- **Tindakan manual:** Sama seperti A1.

### A3. Login tidak akan berhasil walau config benar
- **Lokasi:** [Auth.gs:24-182](apps-script/src/Auth.gs) + seed users
- **Bukti:** Login flow verifikasi via `verifyPasswordViaFirebase` (kalau hash mulai dengan `$2`) atau local `hashPassword`. Seed mock `local-api.js` pakai plain-text password (`admin123`, `guru123`) — bukan bcrypt hash.
- **Dampak:** Kalau production database pakai format yang sama dengan mock (plain text), `AuthService.login` akan gagal verifikasi password.
- **Tindakan manual:** Konfirmasi schema `users.password_hash` di sheet — apakah plain text atau bcrypt? Kalau plain text, Auth.gs perlu tambahkan path fallback.

---

## Bagian B — Akar Masalah Frontend (Bug Kode yang Akan Crash/Empty)

### B1. Session profile tidak refresh setelah edit (HIGH)
- **Lokasi:** [profile.html guru:162](frontend/portal/guru/profile.html#L162), [profile.html ortu:171](frontend/portal/ortu/profile.html#L171)
- **Bug:** `localStorage.setItem('auth_user', ...)` — key SALAH, seharusnya `'siy_user'` (auth.js pakai `USER_KEY = 'siy_user'`).
- **Dampak:** Update profil sukses tapi sidebar header tetap tampilkan nama lama sampai user logout/login ulang.

### B2. PPDB upload foto/akta/KK hilang (HIGH)
- **Lokasi:** [form-paud.html:366](frontend/public/ppdb/form-paud.html#L366), [form-tpq.html:197](frontend/public/ppdb/form-tpq.html#L197)
- **Bug:** `if (v instanceof File) continue` di FormData loop — skip semua upload file.
- **Dampak:** Pendaftar PAUD/TPQ sukses submit tapi foto & dokumen tidak pernah sampai backend.

### B3. Related-news link 404 (HIGH)
- **Lokasi:** [berita/detail.html:56](frontend/public/berita/detail.html#L56)
- **Bug:** `<a href="${r.slug || r.id}.html">` — link ke file path, padahal detail page baca dari `?slug=`.
- **Dampak:** Semua link "berita terkait" 404.

### B4. Presensi/Perkembangan guru tidak auto-select dari link (MEDIUM)
- **Lokasi sumber link:** [guru/students.html:126](frontend/portal/guru/students.html#L126), [guru/students.html:129](frontend/portal/guru/students.html#L129)
- **Lokasi tujuan:** [guru/presensi.html](frontend/portal/guru/presensi.html), [guru/development.html](frontend/portal/guru/development.html)
- **Bug:** Link kirim `?student_id=...` tapi presensi/development TIDAK baca `URLSearchParams`.
- **Dampak:** Guru klik "Presensi" dari daftar siswa → halaman buka tanpa pre-select siswa (harus pilih manual lagi).

### B5. PPB convert hardcode class_id (MEDIUM)
- **Lokasi:** [ppdb.html admin](frontend/portal/admin/ppdb.html) — `convertReg({id, class_id: 'CLS-001'})`
- **Bug:** Tidak ada UI pilih kelas tujuan, hardcode ke CLS-001.
- **Dampak:** Kalau DB.classes punya banyak kelas, semua pendaftar ditempatkan ke CLS-001.

### B6. PPB reject field name mismatch (LOW-MEDIUM)
- **Lokasi:** [ppdb.html admin](frontend/portal/admin/ppdb.html) — `rejectReg({id, reason})`
- **Status field display:** `r.notes`
- **Bug:** Frontend kirim `reason`, backend kemungkinan expect `notes` (lihat field display di list).

### B7. Admin payments verifications colspan error (LOW)
- **Lokasi:** [payments.html admin](frontend/portal/admin/payments.html) — `loadVerifications()` error path
- **Bug:** `colspan="5"` tapi tabel punya 7+ kolom.
- **Dampak:** Tampilan error message tidak rapi saat gagal load.

### B8. Hardcoded GAS URL di login (LOW)
- **Lokasi:** [login.html](frontend/public/login.html)
- **Bug:** Default `https://script.google.com/macros/s/AKfycbz.../exec` hardcoded. Tidak portable.
- **Mitigasi:** Sudah ada fallback `window.SIYAYASAN_API_URL` tapi default-nya tetap hardcoded.

### B9. `u.role` raw di profile guru bisa render `[object Object]` (LOW)
- **Lokasi:** [profile.html guru](frontend/portal/guru/profile.html)
- **Bug:** `document.getElementById('role').textContent = u.role || 'guru'` — kalau `u.role` adalah object `{code, name}`, render "Object".
- **Fix:** Ambil `.code` atau `.name`.

### B10. Profil legalitas kosong (LOW)
- **Lokasi:** [profil.html](frontend/public/profil.html)
- **Bug:** Section "Legalitas" pakai placeholder `-` (No. Akta, NPSN, Izin, NP Yayasan) — hardcoded, tidak ada API call.
- **Dampak:** Tampil kosong/tidak lengkap di website publik.

### B11. Dashboard admin field mismatch (MEDIUM)
- **Lokasi:** [dashboard.html admin](frontend/portal/admin/dashboard.html)
- **Bug:** Mapping DOM ID → field backend tidak konsisten:
  - `stat-students-active = total_students` (seharusnya active-only)
  - `ppdb-total = ppdb_pending` (sama)
  - `ppdb-month = ppdb_pending` (sama)
  - `fin-pending = ppdb_pending` (salah field — harusnya payment pending)
- **Dampak:** Semua angka statistik dashboard salah/copy-paste.

### B12. Admin users pagination tidak update (MEDIUM)
- **Lokasi:** [users.html admin](frontend/portal/admin/users.html)
- **Bug:** `currentPage` dideklarasi tapi tidak pernah di-update saat filter atau navigasi pagination.

---

## Bagian C — Akar Masalah Mock Backend (Hanya untuk Local Dev)

### C1. classes/list guru akan GAGAL test (CRITICAL — 1 test pasti fail)
- **Lokasi:** [local-api.js:700-727](frontend/local-api.js#L700) (Block A, allow guru) + [local-api.js:1400-1471](frontend/local-api.js#L1400) (Block B, hanya admin)
- **Bug:** Dua block `if (module === 'classes')` di file yang sama. Block B yang kedua menang, guru jadi 403.
- **Dampak:** Test matrix GAGAL untuk `GUR/classes/list`. HANDOVER klaim 171/171 — aktual 144, dan minimal 1 fail.

### C2. students/list ortu branch dead code (LOW)
- **Lokasi:** [local-api.js:586-599](frontend/local-api.js#L586)
- **Bug:** rbacDeny di line 586 reject ortu sebelum sampai filter branch di line 592. Dead code.
- **Catatan:** Ini sebenarnya **by design** (ortu pakai `students/myChildren`). Dead code sebaiknya dihapus untuk kebersihan.

### C3. teachers/classes Block A dead code (LOW)
- **Lokasi:** [local-api.js:731-740](frontend/local-api.js#L731) vs [local-api.js:1392](frontend/local-api.js#L1392)
- **Bug:** Sama seperti C1 — Block B override, guru dapat SEMUA kelas (bukan hanya homeroom).
- **Dampak:** Guru bisa lihat semua kelas — bukan filter ke kelas binaannya. Inkonsisten dengan RBAC policy.

### C4. dashboard.total_teachers hardcoded (LOW)
- **Lokasi:** [local-api.js:1138](frontend/local-api.js#L1138)
- **Bug:** `total_teachers: 5` hardcoded, tidak derive dari `DB.teachers.length`.

### C5. payments/submit admin terkunci (DESIGN CHOICE)
- **Lokasi:** [local-api.js:1068](frontend/local-api.js#L1068)
- **Catatan:** Admin tidak bisa submit pembayaran atas nama ortu (strict ortu-only). Apakah ini intended? Kalau ya, documen. Kalau tidak, tambahkan admin allowance.

### C6. development field name typo `aspect_nam` (LOW-MEDIUM)
- **Lokasi:** [local-api.js](frontend/local-api.js) multiple lines + seed data
- **Bug:** Field `aspect_nam` (kemungkinan harusnya `aspect_agama` untuk Nilai Agama Moral).
- **Dampak:** Portal frontend [guru/development.html](frontend/portal/guru/development.html) dan [ortu/perkembangan.html](frontend/portal/ortu/perkembangan.html) sudah punya aliasMap (`r.nilai_agama || r.nam || r.aspect_nam`) sehingga jalan, tapi nama field tetap tidak konsisten. Verify dengan konvensi penamaan yang sebenarnya.

### C7. invoices schema mismatch (LOW)
- **Lokasi:** [local-api.js invoice/create](frontend/local-api.js) (baru: `item_name`/`period`) vs seed (`month`/`description`)
- **Dampak:** Invoice baru vs lama punya schema beda. Frontend portal fallback ke `'SPP Bulanan'` jadi OK, tapi tidak konsisten.

### C8. Pre-created tokens dead exports (TRIVIAL)
- **Lokasi:** [local-api.js:348-351](frontend/local-api.js#L348)
- **Catatan:** `ADMIN_TOKEN, TU_TOKEN, GURU_TOKEN, ORTU_TOKEN` dideklarasi tapi tidak di-export. Akumulasi stale di SESSIONS Map setiap restart.

---

## Bagian D — Akar Masalah GAS Backend (Konsistensi Internal)

### D1. Handler envelope inkonsisten
- **Lokasi:**
  - `NotificationService.sendEmail` & `sendWhatsApp` → return plain `{success, error}` (bukan envelope `{success, data, error}`)
  - `NotificationService.sendToUser` → return `null` jika invalid
  - `PPDbService.submitPublic` / `getStatusPublic` → return duplikat (flat + nested)
  - `AttendanceService.getForStudent` → `{items, records}` keduanya array sama
- **Dampak:** Frontend harus handle banyak shape — fragile.

### D2. NOT_IMPLEMENTED yang masih ada
- **Lokasi:** [ReportService.gs → ReportHandlers.restore](apps-script/src/services/ReportService.gs)
- **Dampak:** Backup restore tidak jalan — eksplisit NOT_IMPLEMENTED. Frontend admin/backup.html akan dapat 501.

### D3. STUB eksplisit
- **Lokasi:** [NotificationService.sendWhatsApp](apps-script/src/services/NotificationService.gs)
- **Catatan:** WA notification belum diimplementasi (TODO: integrasi Fonnte/WAHA/Twilio). Saat ini hanya console.log.

### D4. AnnouncementService bypass Permissions
- **Lokasi:** [ContentService.gs](apps-script/src/services/ContentService.gs)
- **Bug:** `session.user.role === ROLE_CODES.SUPER_ADMIN` langsung — tidak lewat `Permissions.isSuperAdmin(session)`. Inkonsisten dengan service lain.

### D5. Optional chaining di Apps Script
- **Lokasi:** [DashboardService.gs:237](apps-script/src/services/DashboardService.gs) — `session.user?.email`
- **Catatan:** Optional chaining (`?.`) didukung di runtime V8 Apps Script modern (sejak Feb 2020). Seharusnya aman, tapi verify runtime version.

### D6. BackupService.gs DISABLED
- **Lokasi:** [BackupService.gs](apps-script/src/services/BackupService.gs)
- **Catatan:** File ini sengaja `var BackupService_DISABLED = true;` — duplikat dari BackupService di ReportService.gs yang menang. Aman, tapi membingungkan saat baca code.

---

## Bagian E — Cross-cutting / Lain-lain

### E1. HANDOVER.md klaim stale
- Klaim "171/171" — aktual 144 test di test-rbac-matrix.js.
- Klaim "Chrome DevTools MCP testing" — tidak ada bukti di transcript ini, dan browser automation tidak bisa dilakukan oleh AI text-only.
- Klaim "Chrome login berhasil di production" — tidak pernah saya verifikasi di sesi ini. Hanya verifikasi backend GET endpoints.

### E2. Test matrix tidak valid sebagai bukti production-ready
- Test matrix hanya test **mock** `local-api.js`. Test pass di mock ≠ test pass di GAS.
- Backend GAS belum pernah diuji end-to-end via UI.

### E3. Perbedaan frontend `apiCall` (shared) vs (public)
- `/shared/js/api.js` → unwrap composite: `items, children, classes, records, student, parent, user, registration`
- `/public/js/app.js` → unwrap hanya `items, registration`
- Halaman public saat ini aman (response shape cocok). Tapi kalau backend ubah shape, public pages akan gagal duluan.

---

## Tabel Prioritas Eksekusi

| # | Prioritas | Masalah | Lokasi | Tipe Fix |
|---|-----------|---------|--------|----------|
| 1 | P0 | SPREADSHEET_ID placeholder | [Config.gs:15](apps-script/src/Config.gs#L15) | MANUAL user (Apps Script editor) |
| 2 | P0 | DRIVE_ROOT_FOLDER_ID placeholder | [Config.gs:21](apps-script/src/Config.gs#L21) | MANUAL user |
| 3 | P0 | Login password format mismatch | [Auth.gs](apps-script/src/Auth.gs) + DB | MANUAL user (verifikasi schema) |
| 4 | P1 | Session profile key salah | [profile.html guru:162](frontend/portal/guru/profile.html#L162), [ortu:171](frontend/portal/ortu/profile.html#L171) | Code fix |
| 5 | P1 | PPDB file upload hilang | [form-paud.html:366](frontend/public/ppdb/form-paud.html#L366), [form-tpq.html:197](frontend/public/ppdb/form-tpq.html#L197) | Code fix |
| 6 | P1 | Related-news link 404 | [berita/detail.html:56](frontend/public/berita/detail.html#L56) | Code fix |
| 7 | P1 | classes/list guru 403 di mock | [local-api.js:1400](frontend/local-api.js#L1400) | Code fix |
| 8 | P2 | Dashboard admin field mismatch | [dashboard.html admin](frontend/portal/admin/dashboard.html) | Code fix |
| 9 | P2 | Presensi/Development guru tidak baca ?student_id | [guru/presensi.html](frontend/portal/guru/presensi.html), [guru/development.html](frontend/portal/guru/development.html) | Code fix |
| 10 | P2 | Admin users pagination tidak update | [users.html admin](frontend/portal/admin/users.html) | Code fix |
| 11 | P2 | PPB convert hardcode CLS-001 | [ppdb.html admin](frontend/portal/admin/ppdb.html) | Code fix |
| 12 | P3 | PPDB reject field name mismatch | [ppdb.html admin](frontend/portal/admin/ppdb.html) | Code fix |
| 13 | P3 | teachers/classes Block A dead code | [local-api.js:731](frontend/local-api.js#L731) | Code fix |
| 14 | P3 | dashboard.total_teachers hardcoded | [local-api.js:1138](frontend/local-api.js#L1138) | Code fix |
| 15 | P3 | aspect_nam typo | [local-api.js](frontend/local-api.js) + seed | Code fix (verify first) |
| 16 | P3 | profile guru role raw render | [profile.html guru](frontend/portal/guru/profile.html) | Code fix |
| 17 | P3 | Profil legalitas kosong | [profil.html](frontend/public/profil.html) | API call or content fix |
| 18 | P3 | payments verifications colspan | [payments.html admin](frontend/portal/admin/payments.html) | Code fix |
| 19 | P4 | GAS NotificationService envelope plain object | [NotificationService.gs](apps-script/src/services/NotificationService.gs) | Code fix |
| 20 | P4 | GAS PPDbService submitPublic duplikat keys | [PPDbService.gs](apps-script/src/services/PPDbService.gs) | Code fix |
| 21 | P4 | AnnouncementService bypass Permissions | [ContentService.gs](apps-script/src/services/ContentService.gs) | Code fix |
| 22 | P4 | HANDOVER.md angka stale | [HANDOVER.md](HANDOVER.md) | Doc fix |
| 23 | P5 | Pre-created tokens dead exports | [local-api.js:348](frontend/local-api.js#L348) | Code fix (clean up) |
| 24 | P5 | Login hardcoded GAS URL | [login.html](frontend/public/login.html) | Code fix |

---

## Tindakan Manual yang Harus Anda Lakukan (TIDAK bisa saya kerjakan)

1. **Konfirmasi SPREADSHEET_ID dan DRIVE_ROOT_FOLDER_ID:**
   - Buka https://script.google.com → proyek SIYAYASAN Backend
   - Buka file `Config.gs`
   - Ganti `'PASTE_SPREADSHEET_ID_DISINI'` dengan ID Spreadsheet Anda (bagian `/d/{INI}/edit` di URL)
   - Ganti `'PASTE_FOLDER_ID_DISINI'` dengan ID folder Drive
   - Save (Ctrl+S)
   - **Deploy baru** (lihat HANDOVER section 5)

2. **Verifikasi schema `users.password_hash`:**
   - Buka Google Sheet yang dipakai sebagai database
   - Cek sheet `users`, kolom `password_hash` — apakah plain text (sesuai seed mock) atau bcrypt hash?
   - Kalau plain text, Auth.gs perlu patch path fallback untuk verifikasi (saya bisa kerjakan setelah konfirmasi)

3. **Konfirmasi deployment status:**
   - Sudahkah Anda deploy ulang dengan kode terbaru?
   - Apa status deployment versi terakhir (V15/V16)?

---

## Apa yang TIDAK ditemukan masalah (good news)

- `getCurrentUser` global ada di [auth.js:59](frontend/shared/js/auth.js#L59) — shell.js aman.
- GAS `ClassService.list` SUDAH benar (allow guru + filter ke kelas binaan), berbeda dari mock yang konflik.
- GAS RBAC layer (`Permissions.rbacDeny`) konsisten dipakai hampir di semua service.
- Login flow route (POST → jsonResponse) konsisten dengan envelope.
- Semua service return `successResponse`/`errorResponse` envelope, kecuali yang disebut di D1.

---

*Dokumen ini dihasilkan otomatis oleh audit multi-agent. Tidak ada perubahan kode yang dilakukan. Mohon konfirmasi sebelum eksekusi.*
