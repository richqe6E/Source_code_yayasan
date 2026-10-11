# Data Dictionary — SIYAYASAN

**Versi:** 1.0  
**Tanggal:** 12 September 2026  
**Tujuan:** Referensi lengkap struktur semua sheet (tabel) di Google Sheets MVP

---

## Cara Baca Dokumen Ini

- **Tipe data:**
  - `string` = teks
  - `text` = teks panjang (maksimal ribuan karakter)
  - `int` = bilangan bulat
  - `decimal` = bilangan desimal (untuk nominal)
  - `date` = tanggal ISO 8601 (YYYY-MM-DD)
  - `datetime` = tanggal + waktu ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)
  - `time` = waktu (HH:mm:ss)
  - `bool` = TRUE / FALSE
  - `enum` = nilai dari daftar tetap (lihat Allowed Values)
  - `json` = string berformat JSON (akan di-parse di backend)
  - `fk` = foreign key ke sheet lain

- **PK** = Primary Key (unik, wajib ada)
- **FK** = Foreign Key (mengacu ke ID di sheet lain)
- **Required** = WAJIB diisi
- **Nullable** = boleh kosong

- **Audit fields** (wajib ada di SEMUA sheet):
  - `created_at` (datetime, required)
  - `created_by` (fk → users.id)
  - `updated_at` (datetime)
  - `updated_by` (fk → users.id)
  - `is_deleted` (bool, default FALSE)

---

## Sheet 1: `config`

Konfigurasi global sistem (key-value).

| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| A: key | string (PK) | ✅ | Nama setting, e.g. "version", "organization_name" |
| B: value | text | ✅ | Nilai setting |
| C: type | enum | ✅ | Allowed: string / number / boolean / json |
| D: description | text | | Penjelasan |
| E: updated_at | datetime | ✅ | Terakhir diubah |
| F: updated_by | fk | ✅ | User yang mengubah |

---

## Sheet 2: `id_counters`

Generator ID otomatis. JANGAN edit manual kecuali paham.

| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| A: prefix_year | string (PK) | ✅ | Format PREFIX-YYYY, e.g. "STU-2026" |
| B: last_number | int | ✅ | Counter terakhir, mulai 0 |
| C: updated_at | datetime | ✅ | |

**Daftar prefix (lihat blueprint PART 9.2):**

USR, STU, PAR, TCH, SCH, CLS, AY, ENR, REG, REGDOC, STUDOC, ATT, DEV, NOTE, INV, PAY, ANN, NWS, EVT, GAL, LOG, NOTIF, PERM, ROLE

---

## Sheet 3: `users`

Akun login untuk semua role.

| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| A: id | string (PK) | ✅ | Format USR-YYYY-NNNNN |
| B: email | string | ✅ | Unique, login identifier |
| C: password_hash | string | ✅ | Hash (bukan plaintext) |
| D: full_name | string | ✅ | Nama lengkap |
| E: phone | string | | |
| F: role_id | fk | ✅ | → roles.id |
| G: status | enum | ✅ | Allowed: `active` / `inactive` / `suspended` / `pending_verification` |
| H: linked_entity_id | string | | ID student/parent/teacher/admin yang terkait |
| I: linked_entity_type | enum | | Allowed: `student` / `parent` / `teacher` / `admin` / `none` |
| J: last_login | datetime | | |
| K: failed_login_count | int | | Default 0 |
| L: locked_until | datetime | | Akun terkunci sampai |
| M: email_verified | bool | | |
| N-Q: audit fields | | ✅ | |

---

## Sheet 4: `roles`

Role user.

| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| A: id | string (PK) | ✅ | ROLE-YYYY-NNNNN |
| B: code | enum | ✅ | Allowed: `super_admin` / `admin_tu` / `guru` / `orang_tua` / `pendaftar` |
| C: name | string | ✅ | Nama display |
| D: description | string | | |
| E: is_system | bool | ✅ | Role bawaan, tidak bisa dihapus |
| F-J: audit | | ✅ | |

---

## Sheet 5: `permissions`

Permission granular.

| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| A: id | string (PK) | ✅ | PERM-YYYY-NNNNN |
| B: code | string | ✅ | Format `{module}.{action}`, e.g. "student.create" |
| C: module | string | ✅ | Modul: auth, user, student, parent, teacher, ppdb, payment, dll |
| D: action | enum | ✅ | Allowed: `create` / `read` / `update` / `delete` / `verify` / `approve` / `manage` |
| E: description | string | | |
| F-J: audit | | ✅ | |

**Daftar permissions standar (seed):**

| code | module | action |
|---|---|---|
| `auth.login` | auth | login |
| `auth.logout` | auth | logout |
| `user.create` | user | create |
| `user.read` | user | read |
| `user.update` | user | update |
| `user.delete` | user | delete |
| `user.manage_role` | user | manage |
| `student.create` | student | create |
| `student.read` | student | read |
| `student.read.own` | student | read |
| `student.update` | student | update |
| `student.delete` | student | delete |
| `parent.create` | parent | create |
| `parent.read` | parent | read |
| `parent.update` | parent | update |
| `teacher.create` | teacher | create |
| `teacher.read` | teacher | read |
| `teacher.update` | teacher | update |
| `class.create` | class | create |
| `class.read` | class | read |
| `class.update` | class | update |
| `ppdb.period.manage` | ppdb | manage |
| `ppdb.register` | ppdb | create |
| `ppdb.read.own` | ppdb | read |
| `ppdb.read.all` | ppdb | read |
| `ppdb.verify` | ppdb | verify |
| `ppdb.accept` | ppdb | approve |
| `ppdb.reject` | ppdb | approve |
| `ppdb.convert` | ppdb | manage |
| `attendance.create` | attendance | create |
| `attendance.read.all` | attendance | read |
| `attendance.read.own` | attendance | read |
| `development.create` | development | create |
| `development.read.all` | development | read |
| `development.read.own` | development | read |
| `payment.invoice.create` | payment | create |
| `payment.invoice.read.all` | payment | read |
| `payment.invoice.read.own` | payment | read |
| `payment.upload_proof` | payment | create |
| `payment.verify` | payment | verify |
| `payment.reject` | payment | approve |
| `payment.report` | payment | read |
| `announcement.create` | announcement | create |
| `announcement.read` | announcement | read |
| `announcement.update` | announcement | update |
| `announcement.delete` | announcement | delete |
| `news.create` | news | create |
| `news.read` | news | read |
| `news.update` | news | update |
| `news.delete` | news | delete |
| `event.create` | event | create |
| `event.read` | event | read |
| `event.update` | event | update |
| `event.delete` | event | delete |
| `gallery.create` | gallery | create |
| `gallery.read` | gallery | read |
| `gallery.update` | gallery | update |
| `gallery.delete` | gallery | delete |
| `file.upload` | file | create |
| `file.read` | file | read |
| `file.delete` | file | delete |
| `notification.read.own` | notification | read |
| `report.generate` | report | read |
| `audit.read` | audit | read |
| `backup.manage` | backup | manage |
| `system.settings` | system | manage |

**Total: ~60 permissions.**

---

## Sheet 6: `role_permissions`

Junction table roles ↔ permissions.

| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| A: id | string (PK) | ✅ | |
| B: role_id | fk | ✅ | → roles.id |
| C: permission_id | fk | ✅ | → permissions.id |
| D-K: audit | | ✅ | |

**Mapping default (seed):**

| Role | Permissions |
|---|---|
| super_admin | SEMUA permissions (`*`) |
| admin_tu | Semua kecuali `user.delete`, `system.settings`, `backup.manage`, `audit.read` |
| guru | attendance.create, attendance.read.all, development.create, development.read.all, file.upload, file.read, announcement.read, news.read, event.read, gallery.read, notification.read.own, teacher.read |
| orang_tua | student.read.own, parent.read, attendance.read.own, development.read.own, payment.invoice.read.own, payment.upload_proof, announcement.read, news.read, event.read, gallery.read, notification.read.own, file.read |
| pendaftar | ppdb.register, ppdb.read.own, file.upload, file.read, news.read, event.read |

---

## Sheet 7: `schools`

Sekolah di bawah yayasan.

| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| A: id | string (PK) | ✅ | SCH-YYYY-NNNNN |
| B: code | string | ✅ | e.g. "TK-A", "PAUD-BINTANG" |
| C: name | string | ✅ | e.g. "TK Pertiwi 1" |
| D: level | enum | ✅ | Allowed: `PAUD` / `TK` / `SD` / `SMP` / `SMA` / `lainnya` |
| E: address | text | | |
| F: phone | string | | |
| G: email | string | | |
| H: head_id | fk | | → teachers.id (kepsek) |
| I: status | enum | ✅ | Allowed: `active` / `inactive` |
| J-Q: audit | | ✅ | |

---

## Sheet 8: `academic_years`

Tahun ajaran.

| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| A: id | string (PK) | ✅ | Format AY-YYYY-YYYY, e.g. "AY-2026-2027" |
| B: name | string | ✅ | e.g. "2026/2027" |
| C: start_date | date | ✅ | ISO 8601 |
| D: end_date | date | ✅ | ISO 8601 |
| E: is_active | bool | ✅ | Hanya 1 yang aktif per yayasan |
| F-K: audit | | ✅ | |

---

## Sheet 9: `classes`

Kelas per sekolah per tahun ajaran.

| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| A: id | string (PK) | ✅ | CLS-YYYY-NNNNN |
| B: school_id | fk | ✅ | → schools.id |
| C: academic_year_id | fk | ✅ | → academic_years.id |
| D: name | string | ✅ | e.g. "TK-A", "PAUD-Bintang" |
| E: level | enum | ✅ | Allowed: `PAUD-A` / `PAUD-B` / `TK-A` / `TK-B` |
| F: homeroom_teacher_id | fk | | → teachers.id |
| G: capacity | int | | Kapasitas siswa |
| H: status | enum | ✅ | Allowed: `active` / `inactive` / `archived` |
| I-P: audit | | ✅ | |

---

## Sheet 10: `students`

Data siswa.

| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| A: id | string (PK) | ✅ | STU-YYYY-NNNNN |
| B: nis | string | ✅ | Nomor Induk Siswa, unique |
| C: nisn | string | | Nomor Induk Siswa Nasional |
| D: full_name | string | ✅ | |
| E: nickname | string | | |
| F: gender | enum | ✅ | Allowed: `L` / `P` |
| G: birth_place | string | ✅ | |
| H: birth_date | date | ✅ | ISO 8601 |
| I: religion | enum | | Allowed: `Islam` / `Kristen` / `Katolik` / `Hindu` / `Buddha` / `Konghucu` / `Lainnya` |
| J: address | text | | |
| K: photo_file_id | string | | Drive file ID foto |
| L: birth_cert_number | string | | No akta kelahiran |
| M: status | enum | ✅ | Allowed: `active` / `graduated` / `transfer` / `dropout` / `alumni` |
| N: enrollment_date | date | | |
| O: created_from_ppdb_reg | fk | | → ppdb_registrations.id (asal dari PPDB) |
| P: current_class_id | fk | | → classes.id (kelas saat ini) |
| Q-X: audit | | ✅ | |

---

## Sheet 11: `parents`

Data orang tua / wali.

| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| A: id | string (PK) | ✅ | PAR-YYYY-NNNNN |
| B: full_name | string | ✅ | |
| C: relation | enum | ✅ | Allowed: `ayah` / `ibu` / `wali` |
| D: nik | string | | NIK KTP |
| E: phone | string | ✅ | |
| F: email | string | | |
| G: occupation | string | | Pekerjaan |
| H: address | text | | |
| I: user_id | fk | | → users.id (akun login ortu) |
| J: status | enum | ✅ | Allowed: `active` / `inactive` |
| K-Q: audit | | ✅ | |

---

## Sheet 12: `parent_student_relations`

Relasi orang tua ↔ siswa (bisa banyak).

| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| A: id | string (PK) | ✅ | |
| B: parent_id | fk | ✅ | → parents.id |
| C: student_id | fk | ✅ | → students.id |
| D: relation | enum | ✅ | Allowed: `ayah` / `ibu` / `wali` |
| E: is_primary | bool | ✅ | Ortu utama untuk notifikasi (TRUE/FALSE) |
| F: status | enum | ✅ | Allowed: `active` / `inactive` |
| K-Q: audit | | ✅ | |

---

## Sheet 13: `teachers`

Data guru.

| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| A: id | string (PK) | ✅ | TCH-YYYY-NNNNN |
| B: nip | string | | NIP |
| C: full_name | string | ✅ | |
| D: gender | enum | ✅ | L / P |
| E: phone | string | ✅ | |
| F: email | string | ✅ | |
| G: address | text | | |
| H: position | enum | ✅ | Allowed: `guru_kelas` / `guru_pendamping` / `kepsek` / `staff` |
| I: school_id | fk | ✅ | → schools.id |
| J: photo_file_id | string | | Drive file ID foto |
| K: hire_date | date | | |
| L: status | enum | ✅ | Allowed: `active` / `inactive` / `cuti` / `resign` |
| M: user_id | fk | | → users.id (akun login guru) |
| N-W: audit | | ✅ | |

---

## Sheet 14: `teacher_class_assignments`

Guru mengajar kelas.

| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| A: id | string (PK) | ✅ | |
| B: teacher_id | fk | ✅ | → teachers.id |
| C: class_id | fk | ✅ | → classes.id |
| D: subject_id | fk | | → subjects.id (nullable untuk PAUD/TK) |
| E: role | enum | ✅ | Allowed: `homeroom` / `subject_teacher` / `assistant` |
| F: status | enum | ✅ | Allowed: `active` / `inactive` |
| K-Q: audit | | ✅ | |

---

## Sheet 15: `enrollments`

Siswa terdaftar di kelas per tahun ajaran.

| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| A: id | string (PK) | ✅ | ENR-YYYY-NNNNN |
| B: student_id | fk | ✅ | → students.id |
| C: class_id | fk | ✅ | → classes.id |
| D: academic_year_id | fk | ✅ | → academic_years.id |
| E: enrollment_date | date | ✅ | |
| F: status | enum | ✅ | Allowed: `aktif` / `cuti` / `lulus` / `pindah` / `do` |
| G-L: audit | | ✅ | |

---

## Sheet 16: `ppdb_periods`

Periode PPDB.

| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| A: id | string (PK) | ✅ | |
| B: academic_year_id | fk | ✅ | → academic_years.id |
| C: school_id | fk | ✅ | → schools.id |
| D: name | string | ✅ | e.g. "PPDB 2026/2027 Gelombang 1" |
| E: start_date | datetime | ✅ | ISO 8601 |
| F: end_date | datetime | ✅ | ISO 8601 |
| G: registration_fee | decimal | ✅ | Biaya pendaftaran |
| H: spp_monthly | decimal | ✅ | SPP per bulan |
| I: quota_per_class | int | | |
| J: status | enum | ✅ | Allowed: `draft` / `open` / `closed` / `archived` |
| K-Q: audit | | ✅ | |

---

## Sheet 17: `ppdb_registrations`

Pendaftar PPDB.

| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| A: id | string (PK) | ✅ | REG-YYYY-NNNNN |
| B: period_id | fk | ✅ | → ppdb_periods.id |
| C: full_name | string | ✅ | |
| D: nickname | string | | |
| E: gender | enum | ✅ | L / P |
| F: birth_place | string | ✅ | |
| G: birth_date | date | ✅ | |
| H: religion | enum | | (sama seperti students) |
| I: address | text | | |
| J: father_name | string | | |
| K: mother_name | string | | |
| L: guardian_name | string | | |
| M: father_phone | string | | |
| N: mother_phone | string | | |
| O: guardian_phone | string | | |
| P: father_email | string | | |
| Q: mother_email | string | | |
| R: previous_school | string | | |
| S: notes | text | | |
| T: status | enum | ✅ | Allowed: `draft` / `submitted` / `waiting_verification` / `needs_revision` / `verified` / `accepted` / `rejected` / `re_registration` / `active_student` |
| U: verified_by | fk | | → users.id |
| V: verified_at | datetime | | |
| W: rejection_reason | text | | |
| X: accepted_at | datetime | | |
| Y: converted_to_student_id | fk | | → students.id (setelah konversi) |
| Z: converted_at | datetime | | |
| AA-AE: audit | | ✅ | |

---

## Sheet 18: `ppdb_documents`

Dokumen yang di-upload pendaftar.

| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| A: id | string (PK) | ✅ | REGDOC-YYYY-NNNNN |
| B: registration_id | fk | ✅ | → ppdb_registrations.id |
| C: doc_type | enum | ✅ | Allowed: `akta_kelahiran` / `kartu_keluarga` / `ktp_ortu` / `foto_anak` / `ijazah` / `rapor` / `lainnya` |
| D: file_id | string | ✅ | Drive file ID |
| E: file_name | string | ✅ | |
| F: mime_type | string | ✅ | |
| G: file_size | int | ✅ | dalam bytes |
| H: uploaded_at | datetime | ✅ | |
| I: verified | bool | ✅ | |
| J: verified_by | fk | | → users.id |
| K: verified_at | datetime | | |
| L-Q: audit | | ✅ | |

---

## Sheet 19: `student_documents`

Dokumen siswa aktif.

| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| A: id | string (PK) | ✅ | STUDOC-YYYY-NNNNN |
| B: student_id | fk | ✅ | → students.id |
| C: doc_type | enum | ✅ | Allowed: sama seperti ppdb_documents + `surat_pernyataan` / `surat_keterangan` |
| D: file_id | string | ✅ | Drive file ID |
| E: file_name | string | ✅ | |
| F: mime_type | string | ✅ | |
| G: file_size | int | ✅ | |
| H: uploaded_at | datetime | ✅ | |
| I: uploaded_by | fk | ✅ | → users.id |
| J-Q: audit | | ✅ | |

---

## Sheet 20: `attendance`

Presensi harian.

| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| A: id | string (PK) | ✅ | ATT-YYYY-NNNNN |
| B: student_id | fk | ✅ | → students.id |
| C: class_id | fk | ✅ | → classes.id |
| D: date | date | ✅ | ISO 8601 |
| E: status | enum | ✅ | Allowed: `hadir` / `izin` / `sakit` / `alpha` |
| F: check_in_time | time | | HH:mm:ss |
| G: check_out_time | time | | |
| H: notes | text | | |
| I: recorded_by | fk | ✅ | → users.id (guru) |
| J-Q: audit | | ✅ | |

---

## Sheet 21: `student_development`

Penilaian perkembangan anak PAUD/TK.

| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| A: id | string (PK) | ✅ | DEV-YYYY-NNNNN |
| B: student_id | fk | ✅ | → students.id |
| C: class_id | fk | ✅ | → classes.id |
| D: academic_year_id | fk | ✅ | → academic_years.id |
| E: period | enum | ✅ | Allowed: `semester_1` / `semester_2` |
| F: recorded_by | fk | ✅ | → users.id (guru) |
| G: recorded_date | date | ✅ | |
| H: aspek_agama_budi_pekerti | text | | JSON atau checklist |
| I: aspek_jasmani_kesehatan | text | | |
| J: aspek_kognitif | text | | |
| K: aspek_bahasa | text | | |
| L: aspek_sosial_emosional | text | | |
| M: aspek_seni | text | | |
| N: catatan_guru | text | | Narasi |
| O: rekomendasi | text | | Saran untuk ortu |
| P-Y: audit | | ✅ | |

**Format nilai:** Bisa JSON seperti:
```json
{
  "checklist": {
    "berdoa_sebelum_kegiatan": true,
    "mengenal_nama_agama": true,
    "bersikap_sopan": false
  },
  "narasi": "Ananda sudah bisa berdoa..."
}
```

---

## Sheet 22: `teacher_notes`

Catatan guru tentang siswa.

| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| A: id | string (PK) | ✅ | NOTE-YYYY-NNNNN |
| B: student_id | fk | ✅ | → students.id |
| C: teacher_id | fk | ✅ | → teachers.id |
| D: type | enum | ✅ | Allowed: `perilaku` / `kegiatan` / `komunikasi` / `kesehatan` |
| E: note_date | date | ✅ | |
| F: note | text | ✅ | Isi catatan |
| G: visibility | enum | ✅ | Allowed: `internal` / `parent` (apakah ortu boleh lihat) |
| H: created_by | fk | ✅ | → users.id |
| I-N: audit | | ✅ | |

---

## Sheet 23: `invoices`

Tagihan (SPP, daftar ulang, dll).

| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| A: id | string (PK) | ✅ | INV-YYYY-NNNNN |
| B: student_id | fk | ✅ | → students.id |
| C: academic_year_id | fk | ✅ | → academic_years.id |
| D: period_label | string | ✅ | e.g. "SPP September 2026" |
| E: due_date | date | ✅ | |
| F: amount | decimal | ✅ | |
| G: status | enum | ✅ | Allowed: `unpaid` / `partial` / `paid` / `overdue` / `cancelled` |
| H: total_paid | decimal | ✅ | Total sudah dibayar (default 0) |
| I: invoice_type | enum | ✅ | Allowed: `spp` / `daftar_ulang` / `lainnya` |
| J-N: audit | | ✅ | |

---

## Sheet 24: `payments`

Pembayaran.

| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| A: id | string (PK) | ✅ | PAY-YYYY-NNNNN |
| B: invoice_id | fk | ✅ | → invoices.id |
| C: student_id | fk | ✅ | → students.id |
| D: parent_id | fk | | → parents.id |
| E: payment_date | date | ✅ | |
| F: amount | decimal | ✅ | |
| G: method | enum | ✅ | Allowed: `cash` / `transfer` / `qris` / `lainnya` |
| H: proof_file_id | string | | Drive file ID bukti |
| I: notes | text | | |
| J: status | enum | ✅ | Allowed: `menunggu_verifikasi` / `verified` / `rejected` |
| K: verified_by | fk | | → users.id (admin) |
| L: verified_at | datetime | | |
| M: rejection_reason | text | | |
| N-W: audit | | ✅ | |

---

## Sheet 25: `announcements`

Pengumuman internal.

| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| A: id | string (PK) | ✅ | ANN-YYYY-NNNNN |
| B: title | string | ✅ | |
| C: content | text | ✅ | Bisa HTML |
| D: target_audience | enum | ✅ | Allowed: `all` / `parents` / `teachers` / `public` |
| E: school_id | fk | | → schools.id |
| F: is_pinned | bool | ✅ | |
| G: published_at | datetime | ✅ | |
| H: expires_at | datetime | | |
| I: status | enum | ✅ | Allowed: `draft` / `published` / `archived` |
| J-P: audit | | ✅ | |

---

## Sheet 26: `news`

Berita publik (ditampilkan di website).

| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| A: id | string (PK) | ✅ | NWS-YYYY-NNNNN |
| B: title | string | ✅ | |
| C: slug | string | ✅ | URL-friendly, unique |
| D: content | text | ✅ | Bisa HTML |
| E: excerpt | text | | Ringkasan |
| F: featured_image_file_id | string | | |
| G: category | string | | e.g. "kegiatan", "pengumuman", "artikel" |
| H: tags | text | | Comma-separated |
| I: author_id | fk | ✅ | → users.id |
| J: view_count | int | | |
| K: published_at | datetime | ✅ | |
| L: status | enum | ✅ | Allowed: `draft` / `published` / `archived` |
| M-R: audit | | ✅ | |

---

## Sheet 27: `events`

Agenda / kegiatan.

| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| A: id | string (PK) | ✅ | EVT-YYYY-NNNNN |
| B: title | string | ✅ | |
| C: description | text | ✅ | |
| D: event_date | date | ✅ | |
| E: start_time | time | | |
| F: end_time | time | | |
| G: location | string | | |
| H: image_file_id | string | | |
| I: target_audience | enum | ✅ | Allowed: `all` / `parents` / `teachers` / `public` |
| J: status | enum | ✅ | Allowed: `draft` / `published` / `cancelled` |
| K-Q: audit | | ✅ | |

---

## Sheet 28: `galleries`

Galeri foto / video.

| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| A: id | string (PK) | ✅ | GAL-YYYY-NNNNN |
| B: title | string | ✅ | |
| C: description | text | | |
| D: file_id | string | ✅ | Drive file ID |
| E: file_type | enum | ✅ | Allowed: `image` / `video` |
| F: mime_type | string | ✅ | |
| G: thumbnail_file_id | string | | Untuk video |
| H: category | string | | e.g. "kegiatan", "fasilitas", "acara" |
| I: is_featured | bool | ✅ | Tampil di homepage? |
| J: display_order | int | | Urutan tampil |
| K: status | enum | ✅ | Allowed: `draft` / `published` |
| L-Q: audit | | ✅ | |

---

## Sheet 29: `activity_logs`

Audit log (WAJIB ada, semua aksi CRUD + auth).

| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| A: id | string (PK) | ✅ | LOG-YYYY-NNNNN |
| B: timestamp | datetime | ✅ | |
| C: user_id | fk | | → users.id (null jika anonymous) |
| D: action | enum | ✅ | Allowed: `login` / `logout` / `create` / `read` / `update` / `delete` / `verify` / `approve` / `reject` / `export` / `backup` / `restore` |
| E: module | string | ✅ | e.g. "auth", "ppdb", "payment" |
| F: entity_type | string | | e.g. "student", "payment" |
| G: entity_id | string | | ID entity terkait |
| H: description | string | ✅ | Ringkasan |
| I: ip_address | string | | |
| J: user_agent | string | | |
| K: old_values | text | | JSON |
| L: new_values | text | | JSON |
| M: status | enum | ✅ | Allowed: `success` / `failed` |
| N: error_message | text | | |

---

## Sheet 30: `notifications`

Notifikasi in-app.

| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| A: id | string (PK) | ✅ | NOTIF-YYYY-NNNNN |
| B: user_id | fk | ✅ | → users.id (penerima) |
| C: type | enum | ✅ | Allowed: `ppdb` / `payment` / `announcement` / `development` / `attendance` / `system` |
| D: title | string | ✅ | |
| E: message | text | ✅ | |
| F: link | string | | URL halaman terkait |
| G: read_at | datetime | | null = belum dibaca |
| H: channel | enum | ✅ | Allowed: `in_app` / `email` / `whatsapp` |
| I: sent_at | datetime | ✅ | |
| J: status | enum | ✅ | Allowed: `pending` / `sent` / `failed` |
| K-P: audit | | ✅ | |

---

## Sheet 31: `system_settings`

Pengaturan sistem global.

| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| A: key | string (PK) | ✅ | |
| B: value | text | ✅ | |
| C: type | enum | ✅ | Allowed: `string` / `number` / `boolean` / `json` |
| D: description | text | | |
| E: is_public | bool | ✅ | Bisa diakses frontend? |
| F-K: audit | | ✅ | |

**Settings awal (seed):**

| key | value | type | description |
|---|---|---|---|
| `organization_name` | `Yayasan Pendidikan ...` | string | Nama yayasan |
| `organization_logo_file_id` | `` | string | Drive ID logo |
| `ppdb_open` | `false` | boolean | Apakah PPDB sedang buka? |
| `current_period_label` | `2026/2027` | string | |
| `timezone` | `Asia/Jakarta` | string | |
| `date_format` | `YYYY-MM-DD` | string | |
| `currency` | `IDR` | string | |
| `default_language` | `id` | string | |
| `min_password_length` | `8` | number | |
| `session_timeout_minutes` | `30` | number | Idle timeout |
| `max_login_attempts` | `5` | number | |
| `lockout_duration_minutes` | `30` | number | |
| `backup_retention_months` | `3` | number | |
| `enable_wa_notification` | `false` | boolean | |
| `wa_gateway` | `` | string | e.g. "fonnte" |
| `wa_api_key` | `` | string | encrypted |
| `email_from` | `noreply@yayasan.sch.id` | string | |
| `email_from_name` | `SIYAYASAN` | string | |

---

## Sheet 32: `user_notification_preferences`

Preferensi notifikasi per user.

| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| A: id | string (PK) | ✅ | |
| B: user_id | fk | ✅ | → users.id |
| C: notification_type | enum | ✅ | Allowed: `ppdb` / `payment` / `announcement` / `development` / `attendance` |
| D: channel_in_app | bool | ✅ | |
| E: channel_email | bool | ✅ | |
| F: channel_whatsapp | bool | ✅ | |
| G: is_enabled | bool | ✅ | |
| H-M: audit | | ✅ | |

---

## Sheet 33: `migrations`

Log migrasi schema database.

| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| A: id | string (PK) | ✅ | Format MIGR-NNN, e.g. "MIGR-001" |
| B: name | string | ✅ | Nama migrasi |
| C: description | text | | |
| D: applied_at | datetime | ✅ | |
| E: applied_by | fk | ✅ | → users.id |
| F: rollback_sql | text | | SQL/script rollback (jika ada) |

**Seed:**

| id | name | description | applied_at |
|---|---|---|---|
| `MIGR-001` | `initial_schema` | Schema awal SIYAYASAN v1.0 | `2026-09-12T00:00:00Z` |

---

## Enum Reference (Daftar Nilai Tetap)

### Status Umum

| Enum | Allowed Values |
|---|---|
| User status | `active` / `inactive` / `suspended` / `pending_verification` |
| Student status | `active` / `graduated` / `transfer` / `dropout` / `alumni` |
| Teacher status | `active` / `inactive` / `cuti` / `resign` |
| Attendance status | `hadir` / `izin` / `sakit` / `alpha` |
| PPDB status | `draft` / `submitted` / `waiting_verification` / `needs_revision` / `verified` / `accepted` / `rejected` / `re_registration` / `active_student` |
| Invoice status | `unpaid` / `partial` / `paid` / `overdue` / `cancelled` |
| Payment status | `menunggu_verifikasi` / `verified` / `rejected` |
| Content status | `draft` / `published` / `archived` / `cancelled` |
| Gender | `L` / `P` |
| Religion | `Islam` / `Kristen` / `Katolik` / `Hindu` / `Buddha` / `Konghucu` / `Lainnya` |
| Role code | `super_admin` / `admin_tu` / `guru` / `orang_tua` / `pendaftar` |
| School level | `PAUD` / `TK` / `SD` / `SMP` / `SMA` / `lainnya` |
| Document type | `akta_kelahiran` / `kartu_keluarga` / `ktp_ortu` / `foto_anak` / `ijazah` / `rapor` / `lainnya` / `surat_pernyataan` / `surat_keterangan` |

---

## Tips Praktis

### Freeze Header

View → Freeze → 1 row (semua sheet)

### Filter Otomatis

Select header row → Data → Create a filter

### Validasi Status Enum

Data → Data validation → List of items → paste enum values

### Format Tanggal ISO 8601

Lebih baik simpan sebagai **TEXT** (YYYY-MM-DD atau YYYY-MM-DDTHH:mm:ssZ) daripada date native Sheets. Alasannya: tidak terpengaruh time zone Sheets.

---

**Dokumen ini bagian dari SIYAYASAN Blueprint v1.0**