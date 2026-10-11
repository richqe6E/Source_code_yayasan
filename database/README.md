# README — Database SIYAYASAN

Folder ini berisi template header dan seed data untuk setup Google Sheets sebagai database MVP.

## Struktur Folder

```
database/
├── headers/         # Header (baris 1) untuk setiap sheet
│   ├── users.csv
│   ├── students.csv
│   └── ... (33 file)
├── seed/            # Data awal untuk master data
│   ├── config.csv
│   ├── id_counters.csv
│   ├── roles.csv
│   ├── permissions.csv
│   ├── role_permissions.csv
│   ├── schools.csv
│   ├── academic_years.csv
│   ├── users.csv          # 5 user demo
│   ├── system_settings.csv
│   └── migrations.csv
└── README.md        # File ini
```

## Cara Pakai

### Step 1: Buat Spreadsheet Baru

1. Buka https://sheets.google.com
2. Buat spreadsheet baru
3. Rename jadi `SIYAYASAN_DB_v1.0`
4. **Catat ID spreadsheet** dari URL

### Step 2: Buat 33 Sheet

Lihat `docs/SETUP_DATABASE.md` untuk daftar 33 sheet yang harus dibuat, atau lihat `docs/DataDictionary.md` untuk detail struktur setiap sheet.

### Step 3: Import Header (Baris 1)

Untuk setiap sheet, copy-paste isi file `headers/[nama_sheet].csv` ke baris 1 sheet terkait.

**Cara cepat:**
1. Buka file `headers/users.csv`
2. Select all (Ctrl+A) → Copy (Ctrl+C)
3. Pergi ke sheet `users` di spreadsheet
4. Klik sel A1 → Paste (Ctrl+V)
5. Sheets akan paste sebagai kolom terpisah

Ulangi untuk 33 sheet.

### Step 4: Import Seed Data (Baris 2+)

Import seed data dari folder `seed/` ke sheet terkait. **Lakukan berurutan sesuai urutan di bawah** karena ada foreign key dependencies:

1. `config` → seed/config.csv
2. `id_counters` → seed/id_counters.csv
3. `roles` → seed/roles.csv
4. `permissions` → seed/permissions.csv
5. `role_permissions` → seed/role_permissions.csv (perlu roles & permissions sudah ada)
6. `schools` → seed/schools.csv
7. `academic_years` → seed/academic_years.csv
8. `users` → seed/users.csv (perlu roles sudah ada)
9. `system_settings` → seed/system_settings.csv
10. `migrations` → seed/migrations.csv

### Step 5: Verifikasi

Setelah import, cek:
- [ ] Semua 33 sheet ada
- [ ] Header di baris 1 sesuai `headers/*.csv`
- [ ] Data seed ada di sheet terkait
- [ ] ID format konsisten (prefix-YYYY-NNNNN)
- [ ] Timestamp ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`)
- [ ] `is_deleted` default `FALSE`

## Catatan Penting

### ⚠️ User Demo untuk Testing Saja

`seed/users.csv` berisi 5 user demo untuk testing awal. **Setelah sistem jadi, HAPUS dan buat user baru via sistem.**

Password hash adalah placeholder. Nanti akan di-generate oleh sistem saat user pertama login atau oleh super admin.

### ⚠️ Foreign Key Validation

Saat import, jika ada error "FK tidak ditemukan":
- Pastikan import SEBELUM sheet yang di-reference
- Cek ID di seed file apakah match dengan sheet master

### ⚠️ Tanggal dalam Format TEXT ISO 8601

Lebih baik simpan sebagai TEXT (`2026-09-12T00:00:00Z`) daripada date native Sheets. Alasannya:
- Konsisten dengan format ISO 8601 global
- Tidak terpengaruh time zone
- Lebih mudah di-parse oleh Apps Script

### ⚠️ Soft Delete Pattern

Semua tabel punya kolom `is_deleted` (TRUE/FALSE). Default FALSE. **Jangan** hapus baris, set `is_deleted=TRUE`.

## Lihat Juga

- `docs/SETUP_DATABASE.md` — Panduan lengkap setup database
- `docs/DataDictionary.md` — Detail semua kolom, tipe, enum
- `BLUEPRINT_SIYAYASAN.md` — Dokumen blueprint utama

---

**Update terakhir:** 12 September 2026  
**Versi:** 1.0