# SRD — Software Requirements Document
## SIYAYASAN — Sistem Informasi Yayasan Pendidikan

| Field | Value |
|-------|-------|
| **Dokumen** | SRD (Software Requirements Document) |
| **Versi** | 1.0 |
| **Tanggal** | 12 September 2026 |
| **Status** | Disetujui |
| **Disusun oleh** | Tim Pengembang SIYAYASAN |
| **Stakeholder** | Yayasan Pendidikan (PAUD & TK), Orang Tua, Guru, Panitia PPDB, Admin TU |

---

## 1. Pendahuluan

### 1.1 Tujuan Dokumen
Dokumen ini menjelaskan kebutuhan perangkat lunak (software requirements) untuk sistem informasi yayasan pendidikan PAUD/TK. Dokumen menjadi acuan bagi tim teknis dalam membangun, menguji, dan menerima sistem.

### 1.2 Lingkup Sistem
**SIYAYASAN** adalah sistem terintegrasi berbasis web yang mencakup:
- **Public Website** — Profil yayasan, berita, pengumuman, galeri, informasi PPDB.
- **Portal Privat** — Beranda per peran (Super Admin, Admin TU, Guru, Orang Tua, Pendaftar).
- **Backend API** — Google Apps Script Web App sebagai REST API.
- **Database** — Google Sheets (MVP) dengan potensi migrasi ke PostgreSQL/Supabase.
- **File Storage** — Google Drive.

### 1.3 Definisi, Akronim, dan Singkatan

| Istilah | Keterangan |
|---------|------------|
| PPDB | Penerimaan Peserta Didik Baru |
| RBAC | Role-Based Access Control |
| PAUD | Pendidikan Anak Usia Dini |
| TK | Taman Kanak-kanak |
| TU | Tata Usaha |
| SPP | Sumbangan Pembinaan Pendidikan |
| SRD | Software Requirements Document |
| PRD | Product Requirements Document |

### 1.4 Referensi
- Blueprint SIYAYASAN.md (arsitektur & detail)
- DataDictionary.md (struktur sheet)
- SETUP_DATABASE.md (panduan setup awal)
- Detail Formulir.md (spesifikasi formulir PPDB)

---

## 2. Deskripsi Umum Sistem

### 2.1 Perspektif Produk
SIYAYASAN dirancang sebagai sistem mandiri (self-contained) yang mengandalkan ekosistem Google Workspace. Sistem memiliki tiga komponen utama:
1. **Frontend** — HTML + Tailwind CSS + Vanilla JS (kompatibel dengan Apps Script hosting).
2. **Backend** — Apps Script V8 runtime, Router pattern.
3. **Storage** — Google Sheets + Google Drive.

### 2.2 Fungsi Utama Produk

#### F1 — Public Website
- F1.1 Beranda dengan hero, ringkasan, dan CTA ke PPDB.
- F1.2 Profil yayasan (sambutan, visi-misi, struktur, program, fasilitas).
- F1.3 Daftar berita, detail berita, kategori/tag.
- F1.4 Daftar pengumuman.
- F1.5 Galeri foto.
- F1.6 Agenda/kegiatan.
- F1.7 Halaman PPDB informasional + form pendaftaran online.
- F1.8 Halaman kontak + peta lokasi.

#### F2 — Authentication & Authorization
- F2.1 Login dengan email & password.
- F2.2 Token-based session (HMAC-signed).
- F2.3 RBAC 5 peran (Super Admin, Admin TU, Guru, Orang Tua, Pendaftar).
- F2.4 Logout, session expiry, refresh token.
- F2.5 Reset password (admin).

#### F3 — Manajemen Data Master
- F3.1 CRUD Users.
- F3.2 CRUD Roles & Permissions.
- F3.3 CRUD Schools (cabang).
- F3.4 CRUD Academic Years.
- F3.5 CRUD Classes (kelas per tahun ajaran).
- F3.6 CRUD Subjects.

#### F4 — Manajemen Siswa & Guru
- F4.1 CRUD Students + enrollment per tahun ajaran.
- F4.2 CRUD Teachers + assignment ke kelas.
- F4.3 CRUD Parents + relasi parent-student.
- F4.4 Generate user account otomatis untuk guru & orang tua baru.

#### F5 — PPDB Online
- F5.1 Dual form: TPQ Ulinnuha (TPQ) & PAUD/TK.
- F5.2 Form dinamis berdasarkan form_type (getFormSchema endpoint).
- F5.3 Upload lampiran (foto, akta, KK).
- F5.4 Review & approval oleh admin.
- F5.5 Convert ke siswa aktif (auto-create student + parent + enrollment + tagihan SPP).

#### F6 — Presensi
- F6.1 Input presensi harian per kelas (bulk).
- F6.2 Rekap bulanan per kelas.
- F6.3 Rekap per siswa.
- F6.4 Status: Hadir, Izin, Sakit, Alpha.

#### F7 — Catatan Perkembangan Siswa (PAUD/TK)
- F7.1 6 aspek (Agama & Budi Pekerti, Jasmani & Kesehatan, Kognitif, Bahasa, Sosial Emosional, Seni).
- F7.2 Predikat: BB, MB, BSH, BSB.
- F7.3 Rekap per siswa, per kelas, per periode.

#### F8 — Pembayaran (SPP & Tagihan Lain)
- F8.1 CRUD Invoice (tagihan).
- F8.2 Generate SPP bulanan (bulk).
- F8.3 Submit bukti bayar (upload).
- F8.4 Verifikasi oleh admin TU.
- F8.5 Rekap pembayaran per siswa, per kelas, per periode.

#### F9 — Konten & Komunikasi
- F9.1 CRUD Pengumuman (dengan target audience).
- F9.2 CRUD Berita.
- F9.3 CRUD Agenda/Event.
- F9.4 CRUD Galeri Foto.
- F9.5 Notifikasi in-app per user.
- F9.6 Email notifikasi.
- F9.7 WhatsApp gateway (stub/integrasi Fonnte/WAHA).

#### F10 — Laporan & Backup
- F10.1 Laporan SPP bulanan.
- F10.2 Laporan presensi bulanan.
- F10.3 Laporan catatan perkembangan.
- F10.4 Rapor individual siswa.
- F10.5 Backup Sheets ke Drive (CSV per sheet, retensi 3 bulan).

#### F11 — Dashboard
- F11.1 Dashboard Super Admin (statistik global).
- F11.2 Dashboard Admin TU (statistik yayasan).
- F11.3 Dashboard Guru (kelas yang diajar, presensi hari ini).
- F11.4 Dashboard Orang Tua (anak-anak, tagihan, perkembangan).
- F11.5 Dashboard Pendaftar (status pendaftaran).

#### F12 — Activity Log & Audit
- F12.1 Log otomatis setiap mutasi data.
- F12.2 Log login (success/failed).
- F12.3 Filter & search log.
- F12.4 Compliance dengan UU PDP.

### 2.3 Karakteristik Pengguna

| Peran | Deskripsi | Akses |
|-------|-----------|-------|
| **Super Admin** | Pengembang sistem / kepala yayasan | Full access semua fitur & konfigurasi |
| **Admin TU** | Staf tata usaha | Manajemen data akademik, verifikasi pembayaran |
| **Guru** | Tenaga pendidik | Presensi, catatan perkembangan, lihat data kelas |
| **Orang Tua** | Wali murid | Lihat data anak, presensi, perkembangan, tagihan |
| **Pendaftar** | Calon wali murid | Submit PPDB, lihat status |

### 2.4 Batasan (Constraints)
- **C1**: Google Apps Script quota limits (6 menit eksekusi per request, 30 MB response, 50 MB payload).
- **C2**: Google Sheets cell limit (10M cells per spreadsheet).
- **C3**: Concurrent write ke Sheets terbatas (race condition risk).
- **C4**: Akses Drive dibatasi oleh akun peng deploy.
- **C5**: Frontend harus compatible dengan hosting Apps Script (no Node.js, no SSR).

### 2.5 Asumsi & Dependensi
- **A1**: Yayasan memiliki akun Google Workspace.
- **A2**: Internet stabil di sisi admin TU.
- **A3**: Orang tua & guru familiar dengan smartphone.
- **A4**: Browser modern (Chrome/Edge/Firefox/Safari versi 2 tahun terakhir).

---

## 3. Kebutuhan Fungsional

### 3.1 Use Case Diagram (Ringkas)

```
                ┌─────────────────────────────────────┐
                │         SIYAYASAN System            │
                └─────────────────────────────────────┘
   Super Admin ┌─────┐ Admin TU ┌──────┐ Guru ┌──────┐ Orang Tua ┌──────┐ Pendaftar ┌──────┐
   ─────────► │     │ ───────► │      │ ──► │      │ ────────► │      │ ────────► │      │
              │     │          │      │     │      │           │      │           │      │
   Manage All │     │ Manage   │      │Presensi│ Anak & │ Tagihan  │PPDB  │
   Users,Roles │     │ Akademik │      │& Dev   │ Presensi│ & SPP   │ Online│
   Settings,  │     │ Payment  │      │        │ & Dev  │         │       │
   Backup     │     │          │      │        │        │         │       │
```

### 3.2 Detail Use Case Kritis

#### UC-01: Login
- **Aktor**: Semua pengguna terautentikasi
- **Pre-kondisi**: User memiliki akun di sistem
- **Alur**: User input email & password → Backend validasi → Token dikembalikan → Frontend simpan token → Redirect ke dashboard sesuai peran
- **Post-kondisi**: User terautentikasi, session aktif
- **Exception**: Akun terkunci (3x gagal), email tidak ditemukan, password salah

#### UC-02: Submit PPDB Online (Pendaftar)
- **Aktor**: Pendaftar (tanpa login untuk lihat form, dengan login untuk submit)
- **Pre-kondisi**: Periode PPDB terbuka
- **Alur**:
  1. Pendaftar pilih form (TPQ atau PAUD)
  2. Sistem return form schema via `getFormSchema(formType)`
  3. Pendaftar isi form + upload lampiran
  4. Submit → Backend simpan dengan status `pending`
  5. Admin TU review → approve/reject
  6. Jika approve → Convert ke siswa + parent + enrollment + tagihan
- **Post-kondisi**: Pendaftaran tercatat, notifikasi terkirim

#### UC-03: Input Presensi Harian (Guru)
- **Aktor**: Guru
- **Pre-kondisi**: Guru login, kelas yang diajar aktif
- **Alur**:
  1. Guru pilih kelas & tanggal
  2. Sistem tampilkan daftar siswa
  3. Guru input status per siswa (Hadir/Izin/Sakit/Alpha)
  4. Submit → Backend bulk upsert
  5. Orang tua dapat notifikasi (opsional)
- **Post-kondisi**: Presensi tersimpan, dapat dilihat orang tua

#### UC-04: Verifikasi Pembayaran (Admin TU)
- **Aktor**: Admin TU
- **Pre-kondisi**: Pembayaran status `menunggu_verifikasi`
- **Alur**:
  1. Admin TU lihat antrian pembayaran
  2. Buka bukti bayar yang di-upload
  3. Approve → update invoice.total_paid + status (PAID/PARTIAL)
  4. Reject → alasan + kembali ke status unpaid
- **Post-kondisi**: Status invoice ter-update, orang tua dapat notifikasi

#### UC-05: Backup Database (Super Admin / Auto)
- **Aktor**: Sistem (weekly trigger) atau Super Admin (manual)
- **Pre-kondisi**: Drive folder tersedia
- **Alur**:
  1. Backend ambil semua sheet
  2. Convert masing-masing ke CSV
  3. Upload ke folder Drive `SIYAYASAN_Backups/backup_YYYYMMDD_HHMMSS/`
  4. Generate manifest.json
  5. Hapus backup > 3 bulan
- **Post-kondisi**: Backup tersimpan, log tercatat

### 3.3 Spesifikasi API (Ringkas)

Lihat dokumen terpisah: `API_SPEC.md`.

Endpoint mengikuti pola:
```
GET    /api/v1/{module}?action=list&token=xxx
GET    /api/v1/{module}/{id}?action=get&token=xxx
POST   /api/v1/{module}?action=create&token=xxx (body: JSON)
POST   /api/v1/{module}/{id}?action=update&token=xxx
POST   /api/v1/{module}/{id}?action=delete&token=xxx
```

Response format:
```json
{
  "success": true,
  "data": { ... },
  "message": "OK",
  "meta": { "timestamp": "2026-09-12T10:00:00Z", "request_id": "..." }
}
```

Error format:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Field X wajib diisi",
    "details": { "missing": ["X"] }
  },
  "meta": { ... }
}
```

---

## 4. Kebutuhan Non-Fungsional

### 4.1 Performance
- **NFR-P1**: Response time API < 3 detik untuk operasi standar (read).
- **NFR-P2**: Response time API < 6 detik untuk operasi kompleks (bulk insert).
- **NFR-P3**: Frontend First Contentful Paint < 2 detik pada 3G.
- **NFR-P4**: Sistem mampu handle 100 concurrent users (tingkat PAUD/TK).

### 4.2 Security
- **NFR-S1**: Token-based auth (HMAC-SHA256), expiry 24 jam.
- **NFR-S2**: Password di-hash (SHA-256 + salt) — rencana migrasi ke Firebase Auth.
- **NFR-S3**: HTTPS only.
- **NFR-S4**: RBAC enforced di setiap endpoint.
- **NFR-S5**: Activity log untuk audit trail.
- **NFR-S6**: Validasi input server-side (jangan percaya frontend).
- **NFR-S7**: Sanitasi output untuk mencegah XSS.
- **NFR-S8**: Upload file divalidasi (mime type & size).
- **NFR-S9**: Compliance UU PDP (UU No. 27/2022) — enkripsi data sensitif, hak akses, retensi.

### 4.3 Reliability
- **NFR-R1**: Backup mingguan otomatis ke Drive.
- **NFR-R2**: Error handling dengan try-catch, return error response.
- **NFR-R3**: Logging untuk debugging (LOG_STATUS, error_message).
- **NFR-R4**: Graceful degradation jika service eksternal (email/WhatsApp) down.

### 4.4 Usability
- **NFR-U1**: Mobile-responsive (mobile-first).
- **NFR-U2**: Bahasa Indonesia.
- **NFR-U3**: Aksesibilitas dasar (label, focus management, color contrast).
- **NFR-U4**: Pesan error jelas & actionable.

### 4.5 Maintainability
- **NFR-M1**: Kode terstruktur modular (services pattern, handler registration).
- **NFR-M2**: Naming convention konsisten.
- **NFR-M3**: DataDictionary.md selalu up-to-date saat ada perubahan schema.
- **NFR-M4**: Dokumentasi inline (JSDoc-style).

### 4.6 Scalability
- **NFR-SC1**: Arsitektur siap migrasi dari Sheets ke PostgreSQL/Supabase.
- **NFR-SC2**: Data access layer terpisah dari business logic.
- **NFR-SC3**: Stateless API (session via token).
- **NFR-SC4**: Schema database mencerminkan normalisasi (siap migrasi ke SQL).

### 4.7 Portability
- **NFR-PO1**: Frontend dapat di-host di Apps Script atau static host lain (Netlify, Vercel).
- **NFR-PO2**: Backend dapat di-pindah ke Node.js/Firebase Cloud Functions tanpa rewrite besar.

---

## 5. Batasan Desain

### 5.1 Platform
- Browser: Chrome, Edge, Firefox, Safari (2 versi terakhir).
- Device: Desktop, tablet, smartphone.
- OS: Windows, macOS, Android, iOS.

### 5.2 Bahasa & Lokasi
- Bahasa: Indonesia (default).
- Timezone: Asia/Jakarta (WIB).
- Format tanggal: `YYYY-MM-DD` (ISO 8601).
- Format mata uang: `Rp 1.000.000` (IDR, tanpa desimal).

---

## 6. Acceptance Criteria

| ID | Kriteria | Test |
|----|----------|------|
| AC-01 | User dapat login dengan email & password valid | Login test dengan akun seed |
| AC-02 | User ditolak akses jika tidak sesuai peran | Cross-role access attempt |
| AC-03 | Pendaftar dapat submit PPDB TPQ & PAUD | Submit form end-to-end |
| AC-04 | Guru hanya dapat input presensi untuk kelas yang diajar | Permission boundary test |
| AC-05 | Orang tua hanya melihat data anak-anaknya | Data isolation test |
| AC-06 | Verifikasi pembayaran update status invoice otomatis | Payment flow test |
| AC-07 | Backup mingguan terbuat otomatis | Trigger setup + manual run |
| AC-08 | Frontend mobile-responsive | Visual test di viewport 375px |
| AC-09 | API mengembalikan error format konsisten | Error response inspection |
| AC-10 | Activity log tercatat untuk setiap mutasi | Log audit |

---

## 7. Lampiran

### 7.1 Tabel Prioritas Kebutuhan

| Modul | Prioritas | MVP | Catatan |
|-------|-----------|-----|---------|
| Auth & RBAC | P0 | ✅ | Wajib |
| Data Master (Users, Classes) | P0 | ✅ | Wajib |
| Students CRUD | P0 | ✅ | Wajib |
| Teachers CRUD | P0 | ✅ | Wajib |
| PPDB Online | P0 | ✅ | Wajib |
| Presensi | P0 | ✅ | Wajib |
| Perkembangan Siswa | P0 | ✅ | Wajib |
| Pembayaran SPP | P0 | ✅ | Wajib |
| Dashboard | P0 | ✅ | Wajib |
| Backup Mingguan | P1 | ✅ | Auto-trigger |
| Pengumuman & Berita | P1 | ✅ | |
| Galeri & Agenda | P1 | ✅ | |
| Email Notification | P1 | ✅ | |
| WhatsApp Gateway | P2 | ⚪ | Stub dulu |
| Laporan Export PDF | P2 | ⚪ | Future |
| Multi-cabang Yayasan | P2 | ⚪ | Schema-ready |

### 7.2 Riwayat Revisi

| Versi | Tanggal | Perubahan |
|-------|---------|-----------|
| 1.0 | 2026-09-12 | Initial document |

---
**— Akhir Dokumen SRD —**