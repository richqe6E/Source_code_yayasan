# PANDUAN SETUP DATABASE — SIYAYASAN

**Target:** Setup Google Sheets sebagai database MVP  
**Lama:** ± 1–2 jam untuk setup awal, ± 30 menit untuk import data  
**Skill yang dibutuhkan:** Bisa copy-paste di Google Sheets

---

## 📋 Daftar Isi

1. [Persiapan](#1-persiapan)
2. [Buat Spreadsheet Baru](#2-buat-spreadsheet-baru)
3. [Buat Sheets (Tab)](#3-buat-sheets-tab)
4. [Setup Kolom Header](#4-setup-kolom-header)
5. [Setup Sheet `config`](#5-setup-sheet-config)
6. [Setup Sheet `id_counters`](#6-setup-sheet-id_counters)
7. [Import Data Master (Seed)](#7-import-data-master-seed)
8. [Setup Format & Validasi](#8-setup-format--validasi)
9. [Dokumentasi Tautan](#9-dokumentasi-tautan)
10. [Testing Awal](#10-testing-awal)

---

## 1. Persiapan

### Akun yang dibutuhkan

- ✅ Akun Google pribadi (gratis) atau akun Google Workspace yayasan (lebih profesional)
- ✅ Akses internet
- ✅ Browser modern (Chrome / Edge / Firefox terbaru)

### Catatan penting

- **Akun Google pribadi**: gratis, kapasitas Drive 15 GB
- **Akun Workspace**: lebih profesional (domain custom), biaya ±Rp 70rb/user/bulan via Google
- **Untuk MVP**: akun pribadi cukup

### Tools tambahan (opsional)

- VS Code atau text editor (untuk buka file CSV)
- Spreadsheet viewer (Excel / LibreOffice) — opsional

---

## 2. Buat Spreadsheet Baru

1. Buka https://sheets.google.com
2. Klik **"+ Blank"** (atau Blank spreadsheet)
3. Akan muncul spreadsheet baru dengan nama default "Untitled spreadsheet"
4. Klik judulnya di kiri atas, ganti jadi:

```
SIYAYASAN_DB_v1.0
```

atau lebih deskriptif:

```
Database SIYAYASAN — [Nama Yayasan] — [Tahun]
```

5. Klik folder 📁 di kanan atas → pilih/buat folder Drive khusus:

```
/Yayasan/Database/2026-2027
```

6. **Catat ID Spreadsheet** dari URL:
   - URL: `https://docs.google.com/spreadsheets/d/{INI_ADALAH_ID}/edit`
   - Copy ID (string panjang antara `/d/` dan `/edit`)
   - Simpan di catatan: `SPREADSHEET_ID = "..."`

### Pratinjau URL

```
https://docs.google.com/spreadsheets/d/1AbC2dEf...XYZ/edit#gid=0
                              ^^^^^^^^^^^^
                              INI ADALAH ID
```

---

## 3. Buat Sheets (Tab)

Secara default, spreadsheet baru punya 1 sheet bernama **Sheet1**. Hapus dan buat 25 sheet baru.

### Cara cepat (manual, 10–15 menit)

Klik kanan tab **Sheet1** di bawah → **Delete** → **OK**

Lalu klik tombol **+** di sebelah tab untuk tambah sheet baru, beri nama sesuai daftar:

#### Daftar 25 Sheet (WAJIB URUT INI)

| # | Nama Sheet | Tipe | Master/Transaksi |
|---|---|---|---|
| 1 | `config` | Konfigurasi | Master |
| 2 | `id_counters` | Auto-number | Master |
| 3 | `users` | User login | Master |
| 4 | `roles` | Role | Master |
| 5 | `permissions` | Permission | Master |
| 6 | `role_permissions` | Junction | Master |
| 7 | `schools` | Sekolah | Master |
| 8 | `academic_years` | Tahun ajaran | Master |
| 9 | `classes` | Kelas | Master |
| 10 | `students` | Siswa | Transaksi |
| 11 | `parents` | Orang tua | Master |
| 12 | `parent_student_relations` | Junction | Transaksi |
| 13 | `teachers` | Guru | Master |
| 14 | `teacher_class_assignments` | Junction | Transaksi |
| 15 | `enrollments` | Siswa di kelas | Transaksi |
| 16 | `ppdb_periods` | Periode PPDB | Master |
| 17 | `ppdb_registrations` | Pendaftar | Transaksi |
| 18 | `ppdb_documents` | Dokumen pendaftar | Transaksi |
| 19 | `student_documents` | Dokumen siswa | Transaksi |
| 20 | `attendance` | Presensi | Transaksi |
| 21 | `student_development` | Perkembangan anak | Transaksi |
| 22 | `teacher_notes` | Catatan guru | Transaksi |
| 23 | `invoices` | Tagihan | Transaksi |
| 24 | `payments` | Pembayaran | Transaksi |
| 25 | `announcements` | Pengumuman | Master |
| 26 | `news` | Berita | Master |
| 27 | `events` | Agenda | Master |
| 28 | `galleries` | Galeri | Master |
| 29 | `activity_logs` | Audit log | Transaksi |
| 30 | `notifications` | Notifikasi | Transaksi |
| 31 | `system_settings` | Pengaturan sistem | Master |
| 32 | `user_notification_preferences` | Preferensi notif user | Master |
| 33 | `migrations` | Log migrasi schema | Master |

**Total: 33 sheet.** (Blueprint menyebut 24 sheet utama, versi lengkap ini termasuk sheet turunan.)

### Tips: Cara Cepat Buat Banyak Sheet

Klik tombol **+** di sebelah tab → beri nama. Ulangi 32 kali. Atau:

1. Buat satu sheet dengan nama yang benar
2. Klik kanan → **Duplicate** untuk sheet yang struktur mirip (misal announcements, news, events)
3. Rename setelah duplicate

---

## 4. Setup Kolom Header

Untuk setiap sheet, baris 1 adalah **header** (nama kolom). Semua sheet WAJIB:

- ✅ Baris 1: header (huruf kecil, snake_case)
- ✅ Baris 2 dst: data
- ✅ **Jangan pakai baris kosong** di antara
- ✅ **Jangan pakai merged cells** di header

### Cara Setup Header

#### Cara 1: Manual (5–10 menit per sheet)

1. Klik sel A1
2. Ketik nama kolom
3. Tekan Tab untuk ke kolom berikutnya
4. Ulangi

#### Cara 2: Copy dari file CSV (Lebih Cepat!)

File CSV sudah disediakan di folder `database/` repo ini. Lihat:
- `database/headers.csv` (semua header sheet dalam satu file)
- `database/sheets/[nama_sheet].csv` (per sheet, lengkap dengan beberapa baris contoh)

Cara import ke Google Sheets:

1. Buka file `database/sheets/users.csv` di text editor / Excel
2. Select All (Ctrl+A) → Copy (Ctrl+C)
3. Pergi ke Google Sheets, klik sel A1 di sheet `users`
4. Paste (Ctrl+V)
5. Google Sheets akan otomatis pisah per kolom (CSV format detected)

#### Cara 3: Upload File CSV Langsung

1. Klik kanan di area Drive → **File upload** → upload file `database/sheets/users.csv`
2. Setelah upload, klik kanan file → **Open with** → **Google Sheets**
3. Akan terbuka sebagai Google Sheets baru
4. Select All → Copy → Paste ke sheet `users` di spreadsheet utama

**Rekomendasi: Gunakan Cara 2 atau 3** — lebih cepat dan akurat.

### Format Header Standar

Setiap sheet punya kolom standar di akhir:

| Kolom | Wajib | Keterangan |
|---|---|---|
| `created_at` | ✅ | Timestamp ISO 8601 |
| `created_by` | ✅ | user_id (FK) |
| `updated_at` | ✅ | Timestamp ISO 8601 |
| `updated_by` | ✅ | user_id (FK) |
| `is_deleted` | ✅ | TRUE/FALSE |

Detail header setiap sheet ada di file `docs/DataDictionary.md`.

---

## 5. Setup Sheet `config`

Sheet `config` adalah sheet khusus berisi metadata sistem.

### Isi Sheet `config`

| A (key) | B (value) | C (description) |
|---|---|---|
| `version` | `1.0` | Versi schema |
| `last_migration` | `001_initial_schema` | ID migrasi terakhir |
| `created_at` | `2026-09-12T00:00:00Z` | Waktu setup |
| `created_by` | `system` | Dibuat oleh |
| `spreadsheet_id` | `[paste ID dari URL]` | ID spreadsheet |
| `organization_name` | `[Nama Yayasan]` | Nama yayasan |
| `current_academic_year` | `AY-2026-2027` | Tahun ajaran aktif |
| `default_school` | `[SCH-...]` | Default sekolah |

### Cara Setup

1. Pilih sheet `config` (sheet pertama)
2. Copy paste header & isi di atas
3. Update value sesuai data yayasan Anda
4. **PENTING:** Isi `created_at` dengan format ISO 8601

---

## 6. Setup Sheet `id_counters`

Sheet `id_counters` adalah generator ID otomatis. Setiap entitas punya 1 row.

### Struktur Sheet `id_counters`

| Kolom A | Kolom B | Kolom C |
|---|---|---|
| `prefix_year` | `last_number` | `updated_at` |
| `USR-2026` | `0` | `2026-09-12T00:00:00Z` |
| `STU-2026` | `0` | `2026-09-12T00:00:00Z` |
| `PAR-2026` | `0` | `2026-09-12T00:00:00Z` |
| `TCH-2026` | `0` | `2026-09-12T00:00:00Z` |
| `SCH-2026` | `0` | `2026-09-12T00:00:00Z` |
| `CLS-2026` | `0` | `2026-09-12T00:00:00Z` |
| `AY-2026` | `0` | `2026-09-12T00:00:00Z` |
| `ENR-2026` | `0` | `2026-09-12T00:00:00Z` |
| `REG-2026` | `0` | `2026-09-12T00:00:00Z` |
| `REGDOC-2026` | `0` | `2026-09-12T00:00:00Z` |
| `STUDOC-2026` | `0` | `2026-09-12T00:00:00Z` |
| `ATT-2026` | `0` | `2026-09-12T00:00:00Z` |
| `DEV-2026` | `0` | `2026-09-12T00:00:00Z` |
| `NOTE-2026` | `0` | `2026-09-12T00:00:00Z` |
| `INV-2026` | `0` | `2026-09-12T00:00:00Z` |
| `PAY-2026` | `0` | `2026-09-12T00:00:00Z` |
| `ANN-2026` | `0` | `2026-09-12T00:00:00Z` |
| `NWS-2026` | `0` | `2026-09-12T00:00:00Z` |
| `EVT-2026` | `0` | `2026-09-12T00:00:00Z` |
| `GAL-2026` | `0` | `2026-09-12T00:00:00Z` |
| `LOG-2026` | `0` | `2026-09-12T00:00:00Z` |
| `NOTIF-2026` | `0` | `2026-09-12T00:00:00Z` |
| `PERM-2026` | `0` | `2026-09-12T00:00:00Z` |
| `ROLE-2026` | `0` | `2026-09-12T00:00:00Z` |

### Aturan Sheet `id_counters`

- ⚠️ **Kolom `prefix_year` HARUS unique** (tidak boleh duplikat)
- ⚠️ **Kolom `last_number` HARUS angka** (mulai dari 0)
- ⚠️ **Jangan edit manual** kecuali paham konsekuensi — generator ID ada di Apps Script
- Setiap tahun ajaran baru (2027), tambah row baru: `STU-2027`, `STU-2028`, dll.

---

## 7. Import Data Master (Seed)

Setelah semua header siap, import data master awal. **Lakukan URUT dari atas:**

### Step 7.1 — Seed `roles` (5 role utama)

| code | name | description | is_system |
|---|---|---|---|
| `super_admin` | `Super Admin` | `Akses penuh ke seluruh sistem` | TRUE |
| `admin_tu` | `Admin / TU` | `Tata Usaha, kelola operasional harian` | TRUE |
| `guru` | `Guru` | `Guru PAUD/TK, input presensi & perkembangan` | TRUE |
| `orang_tua` | `Orang Tua` | `Wali murid, lihat data anak` | TRUE |
| `pendaftar` | `Pendaftar` | `Calon siswa, akses portal PPDB` | TRUE |

Lengkapi dengan kolom ID, audit fields, dll. Lihat `database/seed/roles.csv`.

### Step 7.2 — Seed `permissions`

Sekitar 30–40 permission standar. Lihat `database/seed/permissions.csv`.

### Step 7.3 — Seed `role_permissions`

Mapping setiap role ke permissions. Lihat `database/seed/role_permissions.csv`.

### Step 7.4 — Seed `schools` (1 yayasan minimal)

1 sekolah (TK). Lihat `database/seed/schools.csv`.

### Step 7.5 — Seed `academic_years`

Tahun ajaran saat ini. Lihat `database/seed/academic_years.csv`.

### Step 7.6 — Seed `system_settings`

Pengaturan global. Lihat `database/seed/system_settings.csv`.

### Step 7.7 — Seed `users` awal (5 user demo)

1 user per role untuk testing. Lihat `database/seed/users.csv`.

> ⚠️ **PENTING:** User demo ini hanya untuk testing awal. Setelah sistem jadi, **HAPUS** dan buat user baru via sistem.

> ⚠️ Password disimpan sebagai **hash**, bukan plaintext. Untuk testing awal, hash dummy boleh dipakai (lihat `docs/DataDictionary.md` untuk format).

### Step 7.8 — Master data opsional

- `classes` (opsional, bisa dibuat via sistem)
- `teachers` (opsional, buat setelah guru ada)
- `parents` (opsional, buat setelah ada PPDB)

---

## 8. Setup Format & Validasi

### 8.1 Format Tanggal & Waktu

Untuk kolom bertipe `date` / `datetime`:

1. Select kolom (misal `birth_date` di sheet `students`)
2. **Format** → **Number** → **Date** atau **Date time**
3. Pilih format: `YYYY-MM-DD` atau `YYYY-MM-DD HH:MM:SS`

> ⚠️ **Lebih baik** simpan sebagai **TEXT** ISO 8601 (`2026-09-12`) daripada date native. Alasannya:
> - Konsisten dengan format ISO 8601 global
> - Tidak terpengaruh time zone Sheets
> - Lebih mudah di-parse oleh Apps Script / JS
> - Format: `2026-09-12T10:00:00Z` (dengan Z = UTC)

### 8.2 Validasi Data (Data Validation)

Untuk kolom `status` (enum), `gender` (L/P), `is_deleted` (TRUE/FALSE), dll:

1. Select kolom (misal kolom `status` di sheet `students`)
2. **Data** → **Data validation**
3. **Criteria**: dropdown dari list
4. Masukkan opsi (satu per baris):
   ```
   active
   inactive
   graduated
   transfer
   dropout
   ```
5. **On invalid data**: Show warning
6. Save

### 8.3 Conditional Formatting (Visual cue)

Contoh: warna merah untuk `is_deleted = TRUE`:
1. Select seluruh baris data
2. **Format** → **Conditional formatting**
3. **Format rules**: Custom formula
4. Formula: `=$A1<>""` (ada ID) → hijau (data aktif)
5. Formula: `=$R1=TRUE` (kolom R = is_deleted) → merah (data dihapus)
6. Done

### 8.4 Freeze Header Row

1. View → Freeze → 1 row
2. Sekarang baris 1 (header) tetap terlihat saat scroll ke bawah

### 8.5 Protect Sheet Tertentu

Sheet `config` dan `id_counters` sebaiknya dilindungi:

1. Klik kanan tab sheet → **Protect sheet**
2. Pilih "Only you" atau custom
3. Set permissions: hanya super admin yang bisa edit
4. Save

---

## 9. Dokumentasi Tautan

Setelah setup, simpan informasi berikut di catatan pribadi (atau di `config` sheet):

| Info | Sumber | Simpan di |
|---|---|---|
| **SPREADSHEET_ID** | URL spreadsheet | config.spreadsheet_id |
| **Drive Folder ID** | URL folder Drive | config (opsional) |
| **Firebase Project ID** | Firebase Console | file terpisah (lihat `apps-script/src/Config.gs`) |
| **API Key** (jika ada) | Firebase / Google | file terpisah |

---

## 10. Testing Awal

### Test 10.1 — Sheet & Header Benar

Cek setiap sheet punya header yang benar (lihat `docs/DataDictionary.md`).

### Test 10.2 — ID Generator Manual

Di sheet `id_counters`, cek:
- Ada 24 row untuk prefix berbeda
- `last_number` mulai dari 0
- `prefix_year` unique

### Test 10.3 — Data Master Lengkap

Cek sheet berikut punya data:
- [ ] `config` — minimal ada `version`, `last_migration`
- [ ] `id_counters` — 24 rows
- [ ] `roles` — 5 roles (system)
- [ ] `permissions` — minimal 20 permissions
- [ ] `role_permissions` — mapping lengkap
- [ ] `schools` — minimal 1
- [ ] `academic_years` — minimal 1 (tahun ajaran aktif)
- [ ] `system_settings` — minimal 5 settings
- [ ] `users` — 5 user demo

### Test 10.4 — Relasi Terlihat Jelas

Buka sheet `parent_student_relations`. Apakah kolomnya jelas?
- `parent_id` → seharusnya `PAR-2026-00001`
- `student_id` → seharusnya `STU-2026-00001`

Cek `teacher_class_assignments`:
- `teacher_id` → `TCH-2026-00001`
- `class_id` → `CLS-2026-00001`

Jika belum ada data → OK, kosong dulu, nanti diisi via sistem.

---

## Checklist Setup Selesai

Tandai ✅ setiap item:

- [ ] Spreadsheet `SIYAYASAN_DB_v1.0` dibuat
- [ ] 33 sheet sudah dibuat dengan nama benar
- [ ] Header sudah diisi untuk setiap sheet
- [ ] Sheet `config` sudah diisi
- [ ] Sheet `id_counters` sudah diisi (24 rows)
- [ ] Seed data `roles` (5 rows)
- [ ] Seed data `permissions` (minimal 20 rows)
- [ ] Seed data `role_permissions` (lengkap)
- [ ] Seed data `schools` (minimal 1)
- [ ] Seed data `academic_years` (minimal 1)
- [ ] Seed data `system_settings` (minimal 5)
- [ ] Seed data `users` (5 user demo)
- [ ] Format tanggal ISO 8601 sudah diatur
- [ ] Data validation untuk enum sudah diatur
- [ ] Freeze header row sudah aktif
- [ ] Sheet `config` dan `id_counters` diproteksi
- [ ] `SPREADSHEET_ID` dicatat

**Setelah semua ✅, lanjut ke tahap berikutnya: Setup Backend Apps Script.**

---

## Troubleshooting

### ❓ "Sheet sudah ada, mau ditimpa?"

Biasanya muncul saat duplicate. Klik **OK** untuk timpa.

### ❓ "Data validation tidak muncul"

Pastikan select kolom yang benar, dan range cell valid.

### ❓ "Format tanggal berubah jadi angka"

Ini karena format cell di-set Number, bukan Plain text. Format ulang atau simpan sebagai TEXT.

### ❓ "Kolom ID auto-generated kok bentrok?"

Ini akan dicegah oleh Apps Script di fase selanjutnya. Untuk setup manual, pastikan `last_number` di `id_counters` selalu di-update.

### ❓ "Permission denied saat edit"

Sheet diproteksi. Hanya owner / super admin yang bisa edit. Hubungi admin.

---

## Next Step

Setelah database siap, langkah berikutnya:

1. **Setup Folder Drive** sesuai PART 11 blueprint
2. **Setup Apps Script project** (modular sesuai Lampiran A blueprint)
3. **Setup Firebase Auth** (gratis tier)
4. **Develop Public Website** (Phase 1)
5. **Develop per fase sesuai roadmap**

---

**Dokumen ini bagian dari SIYAYASAN Blueprint v1.0**  
**Update terakhir:** 12 September 2026