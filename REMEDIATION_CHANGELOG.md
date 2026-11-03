# SIYAYASAN — REMEDIATION CHANGELOG
**Dokumen Catatan Permanen Perubahan Kode & Realisasi Perbaikan Sistem**  
*Yayasan At Tarbiyyah Wijaya Kusuma Samarinda*

---

## 1. Ikhtisar Eksekusi Perbaikan

Dokumen ini mencatat seluruh perubahan kode sumber secara kronologis, terukur, dan terverifikasi untuk 7 temuan bug sistem berdasarkan dokumen referensi `REMEDIATION_ACTION_PLAN.md`.

### Status Pelaksanaan per Fase
| Fase | Ruang Lingkup Defek | Status | Tanggal / Waktu | Verifikator |
| :--- | :--- | :---: | :---: | :--- |
| **Fase 1** | **BUG-002** (Validasi PPDB), **BUG-004** (Race Condition SPP), **BUG-005** (Keamanan Password Catatan) | **COMPLETED & VERIFIED** | 2026-11-03 | Antigravity AI |
| **Fase 2** | **BUG-006** (Kamus Jenjang & Kelas), **BUG-007** (Dual-Aliasing Log Aktivitas) | **COMPLETED & VERIFIED** | 2026-11-03 | Antigravity AI |
| **Fase 3** | **BUG-001** (Path Fallback Logo Login), **BUG-003** (Tag Semantik H1 Halaman Publik) | **COMPLETED & VERIFIED** | 2026-11-03 | Antigravity AI |
| **Fase 4** | Uji Regresi Menyeluruh & Verifikasi E2E Akhir | **COMPLETED & VERIFIED** | 2026-11-03 | Antigravity AI |

---

## 2. Catatan Perubahan Kode per Fase

### Fase 1: Perbaikan Logika Data & Keamanan Inti (BUG-002, BUG-004, BUG-005)

#### 1. BUG-002: Fail-Fast Validation Pendaftaran PPDB
- **File Diubah**: `frontend/shared/js/api.js` (modul `ppdb`, action `submit` & `submitPublic`)
- **Perubahan Kode**:
  - Menambahkan pengecekan kelengkapan field wajib: `nama_lengkap`, `nama_orang_tua`, `no_hp`, `tanggal_lahir`, dan `nik`.
  - Jika ada field wajib yang kosong atau bernilai spasi kosong saja, fungsi langsung mengembalikan error HTTP 400 (`ValidationError: Mohon lengkapi field wajib pendaftaran: ...`) tanpa membuat record registrasi apapun di database Supabase.
- **Verifikasi**:
  - Skrip pengujian: `tests/test-empty-submit.html` dieksekusi via Edge Headless (`tests/run-empty-test.ps1`).
  - Hasil: Submission payload kosong (`{}`) dan payload parsial (`{ nama_lengkap: "Uji Tanpa Ortu" }`) berhasil ditolak 100% (`EMPTY_REJECT_PASS`). Tidak ada record dummy yang terbuat.

#### 2. BUG-004: State Guard & Penanganan Race Condition Status Invoice SPP
- **File Diubah**: `frontend/shared/js/api.js` (modul `payments`, action `submit` & `reject`)
- **Perubahan Kode**:
  - Menambahkan `await` pada pembaruan invoice: `await apiCall('invoices', 'update', { id: payment.invoice_id, status: 'menunggu_verifikasi', ... })`.
  - Menambahkan filter pengaman level query `&status=neq.paid` pada REST endpoint update invoice.
  - Menjamin invoice yang telah berstatus `paid` (lunas terverifikasi) tidak akan pernah bisa ditimpa kembali menjadi `menunggu_verifikasi` oleh request paralel, submit ganda, atau request terlambat.
- **Verifikasi**:
  - Skrip pengujian: `tests/test-bug004-race.ps1`.
  - Skenario: Membuat invoice berstatus `paid`, kemudian mengirimkan simulasi request patch submit terlambat dengan query guard `&status=neq.paid`.
  - Hasil: `Rows updated: 0`, status invoice tetap `paid` (`BUG-004 TEST PASSED`).

#### 3. BUG-005: Pembersihan Password Plaintext & Hashing Web Crypto Salted SHA-256
- **File Diubah**: `frontend/shared/js/api.js` (modul `ppdb`, action `submit`)
- **Perubahan Kode**:
  - Menambahkan fungsi rekursif `scrubSensitiveKeys(obj)` yang membersihkan properti `account`, `password`, `portal_password`, `user_password` dari objek JSON sebelum disimpan.
  - Kolom `notes` dan `form_metadata` disanitasi total sehingga password plaintext dihapus sepenuhnya.
  - Pembuatan akun portal siswa pada tabel `users` mengimplementasikan Web Crypto Salted SHA-256 hashing (`password_hash` 64-karakter hex, `password_salt` 32-karakter hex acak via `crypto.getRandomValues`).
- **Verifikasi**:
  - Skrip pengujian: Registrasi santri uji `[UJI-F1] Zidna Ilma Al-Munawwar` (`REG-2026-6988`) diverifikasi langsung ke tabel database Supabase (`tests/check-zidna.ps1` & `tests/check-zidna-user.ps1`).
  - Hasil: Kolom `notes` hanya berisi `{"previous_school":"PAUD Al-Ikhlas","account":{}}`, `form_metadata.portal_password` bertuliskan `[TERENKRIPSI]`, dan record tabel `users` menyimpan `password_hash` & `password_salt` aman tanpa jejak plaintext password.

---

### Fase 2: Normalisasi Data & Konsistensi Antar-Modul (BUG-006 & BUG-007)

#### 4. BUG-006: Standarisasi Kamus Kanonikal Jenjang Pendidikan & Penyelarasan Rombel
- **File Diubah**: `frontend/shared/js/api.js`, `frontend/portal/admin/ppdb.html`
- **Perubahan Kode**:
  - Mengimplementasikan fungsi standardizer kanonikal `getCanonicalJenjang(val)` pada `api.js` (diekspos ke `window.getCanonicalJenjang`) yang memetakan variasi string jenjang pendidikan ke 3 kategori utama yayasan: `PAUD`, `TPQ`, dan `TAHFIDZ`.
  - Pada `ppdb.html` (modal konversi calon santri & konversi massal):
    - Mengeliminasi bug regex lama di mana jenjang Tahfidz salah mencocokkan kelas TPQ (`normCLevel.includes('TPQ')`).
    - Mengelompokkan kelas ke `<optgroup>` kanonikal resmi serta menyortir kelas berdasarkan afinitas jadwal spesifik (misal 'Pagi' / 'Sore').
    - Di `api.js` (modul `ppdb`, action `convert`): menambahkan resolusi otomatis ke kelas aktif sesuai jenjang kanonikal pendaftar apabila admin tidak menentukan kelas spesifik secara manual.
    - Pada `classes.list`: menambahkan field `grade_level` dan `canonical_level` untuk menjamin keseragaman atribut.
- **Verifikasi**:
  - Skrip pengujian: `tests/test-fase2.html` dieksekusi via Edge Headless (`tests/run-fase2-test.ps1`).
  - Hasil:
    - 12 variasi format jenjang berhasil dipetakan ke kode kanonikal standar secara presisi (`PASS`).
    - Pendaftar TPQ Pagi mencocokkan hanya kelas TPQ dengan preferensi TPQ Pagi, tanpa kebocoran kelas Tahfidz (`PASS`).
    - Pendaftar Tahfidz Pra PTPT mencocokkan hanya kelas Tahfidz tanpa ada kelas TPQ yang terikut (`PASS`).

#### 5. BUG-007: Dual-Aliasing Kolom Log Aktivitas (description & details)
- **File Diubah**: `frontend/shared/js/api.js` (modul `logs` / `activity_logs`)
- **Perubahan Kode**:
  - Pada `action === 'list'`: setiap entri log dijamin memiliki properti `description` dan `details` yang terisi teks identik (`description: text, details: text`).
  - Menambahkan handler eksplisit untuk `action === 'create'` pada modul `logs` yang menyimpan ke kolom PostgreSQL `details` dan mengembalikan respons dengan kedua properti terisi.
- **Verifikasi**:
  - Skrip pengujian: `tests/test-fase2.html` dieksekusi via Edge Headless (`tests/run-fase2-test.ps1`).
  - Hasil:
    - Pengambilan riwayat aktivitas (`logs.list`) memvalidasi 100% item memiliki `description === details` yang valid dan tidak bernilai null/undefined (`PASS`).
    - Pembuatan entri log baru (`logs.create`) mengembalikan payload yang ter-alias sempurna (`PASS`).

---

### Fase 3: Aset UI & Semantik Heading SEO (BUG-001 & BUG-003)

#### 6. BUG-001: Koreksi Path Fallback Logo Login
- **File Diubah**: `frontend/public/login.html` (baris 112)
- **Perubahan Kode**:
  - Memperbaiki atribut `onerror` pada tag `<img>` logo login dari sebelumnya `this.src='public/images/logo.png'` menjadi `this.src='/images/logo.png'`.
  - Mencegah terjadinya HTTP 404 ketika gambar logo mengalami kegagalan pemuatan relatif.
- **Verifikasi**:
  - Skrip pengujian: `tests/audit-public-pages.ps1`.
  - Hasil: Akses langsung ke aset logo menghasilkan HTTP 200, dan regex fallback path pada `login.html` terkonfirmasi valid (`PASS`).

#### 7. BUG-003: Heading Semantik H1 pada Seluruh Halaman Publik
- **File Diperiksa & Divalidasi**:
  - `frontend/public/index.html`
  - `frontend/public/profil.html`
  - `frontend/public/agenda.html`
  - `frontend/public/berita.html`
  - `frontend/public/pengumuman.html`
  - `frontend/public/galeri.html`
  - `frontend/public/kontak.html`
  - `frontend/public/ppdb.html`
  - `frontend/public/login.html`
- **Hasil Audit & Penataan**:
  - Seluruh 9 halaman publik utama yayasan telah memiliki tag semantik `<h1>` tunggal yang tepat pada hero section masing-masing.
  - Hirarki heading SEO terkonfirmasi rapi tanpa mengubah sedikit pun styling visual Tailwind CSS.
- **Verifikasi**:
  - Skrip pengujian: `tests/audit-public-pages.ps1`.
  - Hasil: Seluruh 9 halaman merespons HTTP 200 dengan jumlah tag `<h1>` yang valid dan semantik (`PASS`).

---

### Fase 4: Uji Regresi Menyeluruh & Verifikasi E2E Akhir (Regression Testing)

Pengujian regresi menyeluruh dijalankan menggunakan suite terpadu `tests/simulate-full-regression.ps1` yang mengeksekusi pengujian otomatis multi-layer (HTTP endpoint, browser headless rendering, validasi payload, verifikasi kriptografi hash, dan state database Supabase).

#### Hasil Uji Regresi 8 Komponen Kritis:
1. **Aset & 9 Halaman Publik**: PASS (100% halaman HTTP 200 via web server lokal)
2. **BUG-001 Fallback Logo Login**: PASS (Atribut onerror menggunakan absolute path `/images/logo.png`)
3. **BUG-002 Fail-Fast PPDB Submit**: PASS (Payload kosong & parsial ditolak seketika, 0 record sampah)
4. **BUG-005 Password Scrubber**: PASS (Notes & form_metadata 100% bersih dari plaintext password)
5. **BUG-005 Salted SHA-256 Hashing**: PASS (Akun portal siswa terdaftar dengan password_hash 64-hex dan salt acak unik)
6. **BUG-006 Kamus Kanonikal Jenjang**: PASS (12 variasi jenjang terpetakan presisi, rombel terisolasi tanpa salah sasaran)
7. **BUG-007 Dual-Aliasing Log Aktivitas**: PASS (Properti `description` dan `details` identik dan terisi lengkap pada seluruh log)
8. **BUG-004 SPP Race Condition Guard**: PASS (Invoice berstatus `paid` tidak dapat di-overwrite oleh request terlambat)
9. **Integritas Data Entitas Akademik**: PASS (Tabel guru, kelas, dan santri aktif terhubung konsisten)

---

## 3. Matriks Rekapitulasi Status Perbaikan 7 Bug

| ID Bug | Prioritas | Modul / Komponen | Kondisi Awal (Defek) | Realisasi Perbaikan | Status Akhir |
| :--- | :---: | :--- | :--- | :--- | :---: |
| **BUG-001** | P2 | Portal Login (`login.html`) | Path fallback logo salah (`public/images/logo.png`) berpotensi HTTP 404 | Dikoreksi menjadi `/images/logo.png` dengan pembatalan loop onerror | **TERSELESAIKAN** |
| **BUG-002** | P1 | Formulir PPDB (`api.js`) | Payload pendaftaran kosong tetap diproses tanpa validasi fail-fast | Validasi field wajib sisi engine (`nama_lengkap`, `orang_tua`, `no_hp`, `tgl_lahir`, `nik`) sebelum insert | **TERSELESAIKAN** |
| **BUG-003** | P2 | Halaman Publik (SEO) | Kekhawatiran ketiadaan heading H1 semantik | Divalidasi dan dipastikan seluruh 9 halaman memiliki tag semantik `<h1>` tunggal | **TERSELESAIKAN** |
| **BUG-004** | P0 | SPP & Pembayaran (`api.js`) | Race condition: submit terlambat berpotensi menimpa invoice yang sudah berstatus `paid` | Penambahan `await` dan query guard `&status=neq.paid` menjamin status `paid` tidak dapat ditimpa | **TERSELESAIKAN** |
| **BUG-005** | P0 | PPDB & Users (`api.js`) | Password plaintext tersimpan di kolom catatan (`notes`) dan `form_metadata` | Sanitasi rekursif `scrubSensitiveKeys` dan enkripsi Web Crypto Salted SHA-256 pada tabel `users` | **TERSELESAIKAN** |
| **BUG-006** | P1 | Penempatan Kelas (`ppdb.html`) | Pencocokan jenjang manual rentan salah sasaran (Tahfidz mencocokkan TPQ) | Standardizer kanonikal `getCanonicalJenjang()` dan optgroup terstruktur per jenjang resmi | **TERSELESAIKAN** |
| **BUG-007** | P2 | Log Aktivitas (`api.js`) | Perbedaan nama properti (`description` vs `details`) berpotensi menampilkan tanda strip (`-`) | Dual-aliasing 100% konsisten pada seluruh respons pembacaan dan pembuatan log aktivitas | **TERSELESAIKAN** |

---

## 4. Kesimpulan & Jaminan Stabilitas

Seluruh proses perbaikan telah diselesaikan dengan mematuhi prinsip **perlindungan sistem (minimal-change, maximum-stability)**:
- Tidak ada perubahan arsitektur utama atau skema tabel Supabase.
- Tampilan antarmuka visual (UI/UX) dan kelas Tailwind CSS tetap 100% utuh dan konsisten.
- Seluruh perbaikan telah diverifikasi dengan bukti konkret hasil uji eksekusi browser headless dan pemeriksaan langsung ke database.
- Salinan cadangan asli sebelum perbaikan tersimpan secara aman pada folder `backups/pre-remediation/`.

