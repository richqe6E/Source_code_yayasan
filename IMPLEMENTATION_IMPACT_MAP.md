# IMPLEMENTATION IMPACT MAP — SIYAYASAN
## Yayasan At Tarbiyyah Wijaya Kusuma Samarinda
**Pemetaan Ketergantungan Antarmodul, Dampak Database, API, Storage, dan Kompatibilitas Historis**  
**Tanggal:** 2 November 2026 | **Status:** Usulan Perencanaan (Read-Only Planning Phase)

---

## 1. PENDAHULUAN & PRINSIP INTEGRASI SISTEM

Setiap perubahan pada modul website SIYAYASAN tidak berdiri sendiri, melainkan memiliki efek domino ke modul-modul lain di sekitarnya.
Dokumen ini menyajikan **peta dampak perubahan (Cross-Module Impact Matrix)** secara komprehensif, menghubungkan:
1. Lapisan Antarmuka Publik (`frontend/public/`)
2. Portal Administrasi (`frontend/portal/admin/`)
3. Portal Siswa (`frontend/portal/siswa/`)
4. Lapisan API & Client Controller (`frontend/shared/js/api.js`)
5. Tabel & Relasi Database Supabase PostgreSQL
6. Objek & Bucket Supabase Storage (`siyayasan-uploads`)
7. Caching Lokal (`localStorage` & `sessionStorage`)

---

## 2. MATRIKS DAMPAK ANTARMODUL (CROSS-MODULE IMPACT MATRIX)

| Modul Sumber | Komponen Terdampak | Hubungan & Ketergantungan yang Harus Dijaga | Potensi Risiko Ketidaksesuaian | Strategi Mitigasi & Pengamanan |
|---|---|---|---|---|
| **CMS Banner & Web** | • Storage (`siyayasan-uploads`)<br>• DB `web_settings`<br>• DB `schools`<br>• Halaman Publik (`index.html`, `kontak.html`) | Perubahan gambar hero dan kontak yayasan disinkronkan ke publik dan profil sekolah | • Payload Base64 membengkak dan memperlambat DB.<br>• URL usang tetap muncul jika fallback hardcoded tidak dibersihkan. | Kompresi WebP client-side sebelum upload; bersihkan URL hardcoded di `index.html`; simpan URL murni tanpa Base64. |
| **Halaman Publik** | • CMS Setting<br>• Supabase DB<br>• LocalStorage Cache | `index.html` membaca banner dan info PPDB dinamis dari `web_settings` dan `ppdb_periods` | • Pengunjung baru melihat tampilan rusak jika query DB gagal.<br>• Data pendaftaran tertukar periode. | Sediakan fallback offline elegan; sinkronisasi cache `siy_hero_cache` dengan mekanisme revalidasi otomatis. |
| **PPDB** | • Publik `ppdb.html`<br>• Status `status.html`<br>• DB `ppdb_registrations`<br>• Admin `admin/ppdb.html`<br>• DB `students` & `users` | Pendaftar publik menghasilkan nomor registrasi, diverifikasi admin, dan dikonversi menjadi siswa resmi | • Calon santri kehilangan riwayat kelulusan saat tahun ajaran berganti.<br>• Konversi ganda menghasilkan siswa kembar. | Isolasi periode via `academic_year`; kunci tombol konversi dengan bendera `is_converted = true`. |
| **Portal Admin** | • PPDB<br>• Data Siswa<br>• Data Guru<br>• Keuangan SPP | Portal admin adalah pusat kendali CRUD untuk seluruh entitas akademik dan keuangan | • Latensi tinggi saat simpan massal.<br>• Form tidak menyimpan field yang baru ditambahkan jika skema DB belum siap. | Eksekusi patch kolom skema database terlebih dahulu; gunakan batch insert native; hilangkan blocking await pada log. |
| **Data Siswa** | • PPDB Form Metadata<br>• Akun Portal (`users`)<br>• Penempatan Kelas (`classes`)<br>• Buku Induk Siswa | Siswa aktif mewarisi 36 field lengkap dari form pendaftaran PPDB | • Admin mengedit data siswa dan secara tidak sengaja menghapus metadata orang tua/pekerjaan.<br>• NIS ganda. | Implementasi *safe-merge* metadata JSON `{ ...existingMeta, ...newInputs }`; validasi unik NIS. |
| **Sistem SPP** | • Data Siswa (`students`)<br>• Tagihan (`invoices`)<br>• Pembayaran (`payments`)<br>• Laporan Keuangan | Pembuatan tagihan bulanan membaca daftar siswa aktif dan tarif program masing-masing santri | • Tagihan bulanan terbit ganda.<br>• Perubahan tarif baru merusak nominal invoice masa lalu.<br>• Pembayaran tercatat 2 kali. | Unique Index `(student_id, month, period)`; terapkan snapshot pattern (nominal historis tetap); kunci form bayar yang sedang pending. |
| **Portal Siswa** | • Biodata Siswa<br>• Kredensial Login (`users`)<br>• Tagihan SPP<br>• Bukti Bayar (`payments`) | Siswa mengakses tagihan, melihat biodata, dan mengirim bukti transfer | • Siswa bingung saat bukti ditolak tanpa keterangan.<br>• Akun diambil alih jika memakai password bersama. | Tampilkan kolom `rejection_reason`; terapkan salted hash dan wajib ganti password di login pertama. |

---

## 3. PEMETAAN PERUBAHAN FILE & ARTEFAK KODE

Berikut adalah daftar file fisik yang akan dimodifikasi saat implementasi:

```
Source_code_yayasan/
├── frontend/
│   ├── shared/
│   │   └── js/
│   │       └── api.js                   <-- [CRITICAL] WebP kompresi, batch bulk invoice, salted Web Crypto, formatIDR baku
│   ├── portal/
│   │   ├── admin/
│   │   │   ├── cms_setting.html         <-- Optimasi simpan, hapus double-call schools.update, live preview
│   │   │   ├── payments.html            <-- Form tolak berpenjelasan, modal bulk invoice multi-tarif, Rupiah preview
│   │   │   ├── ppdb.html                <-- Filter periode PPDB, modal Penerimaan Massal, modal Aktivasi Massal
│   │   │   ├── students.html            <-- Modal edit 5-tab (36 field), Form Tambah Siswa identik PPDB
│   │   │   └── teachers.html            <-- Hapus 'required' & '*' pada input email guru
│   │   └── siswa/
│   │       ├── dashboard.html           <-- Interceptor wajib ganti password (must_change_password)
│   │       └── spp.html                 <-- Kotak alasan penolakan, tombol upload ulang bukti bayar
│   └── public/
│       ├── index.html                   <-- Bersihkan hardcoded hero fallback slide, sinkronisasi dinamis
│       └── login.html                   <-- Sinkronisasi verifikasi login hash & notice ganti sandi awal
└── database/
    └── patch_v3_operational_redesign.sql <-- Migrasi kolom baru (monthly_spp_amount, rejection_reason, academic_year, dll)
```

---

## 4. PEMETAAN PERUBAHAN DATABASE & SKEMA

Seluruh perubahan skema dirancang dengan prinsip **Zero Breaking Change**:
- Tidak ada tabel yang di-drop atau diganti namanya.
- Tidak ada kolom yang diubah tipe datanya secara destruktif.
- Seluruh kolom baru memiliki nilai default (`DEFAULT`) yang aman untuk baris data yang sudah ada.

| Tabel Target | Kolom Baru / Index | Tipe Data | Nilai Default | Dampak & Kompatibilitas Data Historis |
|---|---|---|---|---|
| `students` | `monthly_spp_amount` | `INTEGER` | `150000` | Santri lama otomatis memiliki nominal default Rp150.000 tanpa merusak data |
| `payments` | `rejection_reason` | `TEXT` | `NULL` | Pembayaran lama yang pernah ditolak tetap valid; baris baru mencatat alasan |
| `payments` | `verified_by` | `VARCHAR(100)` | `NULL` | Mencatat identitas staf TU yang menyetujui/menolak bukti transfer |
| `payments` | `verified_at` | `TIMESTAMPTZ` | `NULL` | Timestamp audit kepatuhan keuangan |
| `invoices` | `uq_inv_student_month_period` | `UNIQUE INDEX` | - | Mencegah terbitnya tagihan ganda untuk santri yang sama pada bulan yang sama |
| `ppdb_registrations` | `academic_year` | `VARCHAR(20)` | `'2026/2027'` | Mengisolasi pendaftar per tahun ajaran; data lama otomatis masuk ke 2026/2027 |
| `ppdb_registrations` | `decision_notes` | `TEXT` | `NULL` | Catatan keputusan panitia seleksi massal |
| `users` | `must_change_password` | `BOOLEAN` | `FALSE` | Pengguna lama (admin, guru, siswa lama) tidak terganggu; hanya aktif untuk santri baru |
| `users` | `password_salt` | `VARCHAR(64)` | `NULL` | Mendukung fungsi hash SHA-256 modern; akun legacy dimigrasikan saat login |

---

## 5. PEMETAAN LAPISAN API & POSTGREST ENDPOINTS

| Endpoint / Router `apiCall` | Aksi Baru / Dimodifikasi | Payload Masuk | Respon / Dampak |
|---|---|---|---|
| `web_settings` -> `update` | Disederhanakan | Payload murni tanpa Base64 bloated strings | Update tabel `web_settings` instan; hilangkan loop query |
| `invoices` -> `create_bulk` | Ditingkatkan ke Batch Insert | `class_id`, `month`, `period`, `due_date`, `use_student_fee: true` | Single POST array ke PostgREST; waktu eksekusi < 300ms |
| `payments` -> `reject` | Ditingkatkan | `id`, `reason`, `notes` | Update `payments.status = 'rejected'`, simpan `rejection_reason`, set `invoices.status = 'unpaid'` |
| `ppdb` -> `list` | Ditambahkan Filter | `status`, `form_type`, `academic_year`, `search` | PostgREST menyaring pendaftar hanya untuk tahun ajaran yang dipilih |
| `ppdb` -> `bulk_accept` | **Endpoint Baru** | `accepted_ids: []`, `rejected_ids: []`, `rejection_reasons: {}`, `considered_ids: []` | Batch patch status pendaftar dalam 1 transaksi terkelola |
| `ppdb` -> `bulk_convert` | **Endpoint Baru** | `registrations: [{ id, class_id, nis, spp_amount, temp_pass }]` | Batch aktivasi siswa, akun portal, dan invoice perdana |
| `auth` -> `login` | Dual-mode Verifier | `username/nis`, `password` | Mendukung verifikasi hash bertaut salt baru sekaligus login fallback siswa lama |

---

## 6. ANALISIS RISIKO REGRESI & RENCANA ROLLBACK

### 6.1. Identifikasi Risiko Regresi
1. **Risiko Auth Siswa Lama Terkunci:**
   Jika verifikasi hash baru menolak password plain text siswa lama, siswa tidak dapat mengakses portal.
   *Mitigasi:* Gunakan logika pencocokan bertingkat di `auth.login`:
   `if (hashMatch(password, salt) || plainMatch(password)) { ... }`
2. **Risiko Gambar Carousel Kosong:**
   Jika URL gambar lama dibersihkan dan admin belum mengunggah slide baru, hero slider tampak kosong.
   *Mitigasi:* Sediakan fallback grafis internal `/images/school-campus.jpg` dan gradien brand resmi yayasan.
3. **Risiko Migrasi Skema Supabase Tertunda:**
   Jika kode frontend diperbarui sebelum admin mengeksekusi SQL patch di dashboard Supabase.
   *Mitigasi:* Kode frontend mempertahankan modul *graceful fallback* (mencegah crash jika kolom baru belum terbaca).

### 6.2. Rencana Rollback (Kembali ke Kondisi Stabil)
- **Lapisan Kode (Git):**  
  Seluruh titik perubahan dikelompokkan dalam commit atomik per tahap. Jika terjadi kendala pada satu tahap, git checkout atau git revert dapat dilakukan secara independen terhadap commit tahap tersebut tanpa merusak pekerjaan tahap lain.
- **Lapisan Database:**  
  Karena skema hanya menambahkan kolom baru (`ADD COLUMN IF NOT EXISTS`) dan tidak menghapus kolom lama, database tetap 100% kompatibel dengan versi kode sebelumnya.

---

*Pemetaan dampak ini menjamin seluruh proses implementasi perbaikan berjalan terukur, aman, dan tanpa disrupsi pada operasional harian Yayasan At Tarbiyyah Wijaya Kusuma Samarinda.*

