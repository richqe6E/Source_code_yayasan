# PRD — Product Requirements Document
## SIYAYASAN — Sistem Informasi Yayasan Pendidikan

| Field | Value |
|-------|-------|
| **Dokumen** | PRD (Product Requirements Document) |
| **Versi** | 1.0 |
| **Tanggal** | 12 September 2026 |
| **Status** | Disetujui |
| **Target Pasar** | Yayasan Pendidikan PAUD/TK skala kecil-menengah |

---

## 1. Visi & Misi Produk

### Visi
Menjadi sistem informasi yayasan pendidikan yang **terjangkau, mudah digunakan, dan scalable** untuk yayasan PAUD/TK di Indonesia, dengan memanfaatkan teknologi yang sudah familiar.

### Misi
1. Menyediakan platform digital yang menyatukan website profil, PPDB online, dan portal manajemen akademik dalam satu sistem terpadu.
2. Mempermudah komunikasi yayasan → orang tua → guru melalui portal dan notifikasi terpusat.
3. Mengurangi beban administratif tata usaha (TU) dengan otomatisasi (presensi, tagihan, backup).

---

## 2. Masalah & Solusi

### 2.1 Masalah
| Persona | Masalah | Dampak |
|---------|---------|--------|
| **Orang Tua** | Tidak tahu perkembangan anak, sulit cek tagihan SPP | Komunikasi terbatas via WhatsApp manual |
| **Guru** | Presensi manual di kertas, catatan perkembangan tidak terstruktur | Pekerjaan administratif berlebih |
| **Admin TU** | Input data siswa/ortu/guru berulang-ulang di banyak tempat (Excel, WA, grup) | Rentan duplikasi & kesalahan |
| **Panitia PPDB** | Formulir fisik banyak, rekap manual, rentan hilang | Proses lambat, tidak transparan |
| **Yayasan** | Tidak ada gambaran statistik real-time | Sulit ambil keputusan |

### 2.2 Solusi
| Solusi | Outcome |
|--------|---------|
| Portal Orang Tua terpusat | Orang tua cek tagihan, perkembangan, presensi kapan saja |
| Portal Guru | Presensi digital, catatan perkembangan 6 aspek PAUD/TK |
| PPDB Online dual form (TPQ + PAUD) | Pendaftaran online, paperless, otomatis rekap |
| Dashboard Admin | Statistik real-time (jumlah siswa, tunggakan, PPDB masuk) |
| Activity Log + Backup otomatis | Audit trail, data aman |

---

## 3. Target Pengguna

### 3.1 Personas

#### P1: Bu Ani — Orang Tua PAUD
- **Usia**: 30-45 tahun
- **Perangkat**: Smartphone Android
- **Kebutuhan**: Lihat tagihan SPP, presensi anak, info pengumuman
- **Pain point**: Sering telat bayar karena lupa nominal, tidak tahu perkembangan anak
- **Outcome**: Notifikasi pengingat + portal mobile-friendly

#### P2: Pak Budi — Guru PAUD
- **Usia**: 25-55 tahun
- **Perangkat**: Laptop & smartphone
- **Kebutuhan**: Input presensi, isi catatan perkembangan
- **Pain point**: Banyak kertas, harus rekap manual untuk rapor
- **Outcome**: Input via portal, auto-rekap, mudah unduh rapor

#### P3: Mbak Sari — Admin TU
- **Usia**: 25-40 tahun
- **Perangkat**: Laptop
- **Kebutuhan**: Kelola data siswa/orang tua/guru, verifikasi pembayaran
- **Pain point**: Data terpisah-pisah, verifikasi pembayaran manual
- **Outcome**: Satu dashboard terpusat, verifikasi via upload bukti

#### P4: Pak RT — Panitia PPDB
- **Usia**: 35-55 tahun
- **Perangkat**: Laptop
- **Kebutuhan**: Terima pendaftaran, rekap calon siswa
- **Pain point**: Formulir fisik berceceran, double input
- **Outcome**: Form online, auto-rekap, approval workflow

---

## 4. Fitur Produk

### 4.1 Roadmap Prioritas

#### MVP (Bulan 1-3) — Sudah selesai ☐
- ✅ Backend Apps Script + database Sheets
- ✅ RBAC 5 peran
- ✅ CRUD data master (users, classes, students, teachers, parents)
- ✅ PPDB online dual form
- ✅ Presensi digital
- ✅ Catatan perkembangan
- ✅ Pembayaran SPP + verifikasi
- ✅ Dashboard per peran
- ✅ Activity log

#### V1.1 (Bulan 4-6) — Berikutnya
- ☐ Frontend Public Website (HTML + Tailwind)
- ☐ Frontend Portal Privat (login + dashboard)
- ☐ Pengumuman & berita publik
- ☐ Email notifikasi (transaksional)
- ☐ Backup otomatis mingguan

#### V1.2 (Bulan 7-9)
- ☐ WhatsApp gateway (Fonnte/WAHA)
- ☐ Galeri publik + upload multi-foto
- ☐ Export rapor PDF
- ☐ Agenda/kalendar event

#### V2.0 (Bulan 10+)
- ☐ Migrasi backend ke Node.js/Firebase
- ☐ Database PostgreSQL/Supabase
- ☐ Multi-cabang yayasan
- ☐ Mobile app (Flutter/React Native)
- ☐ Integrasi Bank/E-Wallet untuk SPP

---

## 5. Spesifikasi Fitur Detail

### 5.1 PPDB Online

**User Story**:
> Sebagai **Pendaftar**, saya ingin mengisi formulir pendaftaran online (TPQ atau PAUD) dari rumah, agar tidak perlu datang ke sekolah hanya untuk mendaftar.

**Acceptance Criteria**:
1. Pendaftar dapat memilih form (TPQ Ulinnuha atau PAUD/TK) sebelum mengisi.
2. Form sesuai dengan `Detail Formulir.md` — semua field & section tampil.
3. Upload minimal 3 lampiran: foto siswa, akta kelahiran, kartu keluarga.
4. Setelah submit, pendaftar dapat cek status via dashboard tanpa login ulang (berdasarkan email).
5. Admin TU dapat review dan approve/reject dengan catatan.
6. Setelah approve, otomatis terbuat: data siswa, data orang tua, relasi, enrollment, user account orang tua, dan tagihan SPP.
7. Pendaftar dapat melihat status: `pending` → `reviewing` → `approved`/`rejected` → `converted`.

**Out of Scope (V1)**:
- Pembayaran uang pendaftaran online (saat ini konfirmasi via transfer manual).

### 5.2 Presensi Digital

**User Story**:
> Sebagai **Guru**, saya ingin input presensi kelas saya setiap pagi dengan cepat via smartphone, agar tidak perlu tulis di kertas.

**Acceptance Criteria**:
1. Guru hanya melihat kelas yang diajar (auto-filter).
2. Default hadir, guru tinggal tap yang tidak hadir.
3. Bulk save untuk 1 kelas sekaligus (≤ 30 detik untuk 20 siswa).
4. Rekap otomatis per bulan tersedia.
5. Orang tua dapat lihat presensi anak via portal.

### 5.3 Catatan Perkembangan

**User Story**:
> Sebagai **Guru**, saya ingin mencatat perkembangan anak per periode dengan format yang terstruktur, agar siap cetak untuk rapor.

**Acceptance Criteria**:
1. 6 aspek perkembangan sesuai kurikulum PAUD/TK.
2. Predikat BB/MB/BSH/BSB (tidak berkembang, mulai berkembang, berkembang sesuai harapan, berkembang sangat baik).
3. Catatan guru & rekomendasi per periode.
4. Periode: `YYYY-[S1|S2|Q1|Q2|Q3|Q4]` (semester atau quarter).

### 5.4 Pembayaran SPP

**User Story**:
> Sebagai **Orang Tua**, saya ingin upload bukti transfer SPP dan mendapat notifikasi setelah diverifikasi, agar tidak perlu datang ke sekolah.

**Acceptance Criteria**:
1. Sistem auto-generate tagihan SPP bulanan (configurable).
2. Orang tua upload bukti bayar (foto/PDF).
3. Admin TU verifikasi via portal → approve/reject.
4. Status invoice otomatis update: `unpaid` → `partial` → `paid` (atau `overdue` jika lewat jatuh tempo).
5. Rekap pembayaran tersedia untuk admin.

### 5.5 Activity Log & Audit

**User Story**:
> Sebagai **Super Admin**, saya ingin tahu siapa yang mengubah apa dan kapan, untuk audit trail.

**Acceptance Criteria**:
1. Setiap mutasi (create/update/delete) tercatat dengan: user, action, module, entity, old/new values, timestamp, IP, user agent.
2. Log dapat di-filter berdasarkan user, action, module, rentang tanggal.
3. Retention: 12 bulan (kemudian auto-archive).

---

## 6. Metrik Keberhasilan

### 6.1 Metrik Adopsi
- **M1**: 100% data master dipindah dari Excel manual ke sistem dalam 1 bulan pertama.
- **M2**: ≥ 80% pendaftar menggunakan form online di tahun ajaran berikutnya.
- **M3**: ≥ 90% presensi diisi via portal (bukan kertas).

### 6.2 Metrik Kualitas
- **Q1**: Uptime ≥ 99% (Apps Script SLA).
- **Q2**: Response time < 3 detik untuk 95% request.
- **Q3**: Zero data loss (backup mingguan berjalan sukses).

### 6.3 Metrik Bisnis
- **B1**: Pengurangan waktu rekap manual admin TU: target 50% lebih cepat.
- **B2**: Pengurangan formulir fisik: 100% paperless PPDB.

---

## 7. Risiko & Mitigasi

| Risiko | Dampak | Probabilitas | Mitigasi |
|--------|--------|--------------|----------|
| Apps Script quota habis | Sistem down sementara | Sedang | Cache, batch operation, monitor quota |
| Sheets concurrent write | Data race / lost update | Rendah-Sedang | Lock sheet via script property, queue operation |
| Migration ke DB baru | Downtime saat migrasi | Tinggi (jika terlambat) | Schema design SQL-ready sejak awal |
| Adoption rendah orang tua | PPDB & SPP kembali manual | Sedang | Onboarding via WA, video tutorial |
| Kuota Drive penuh | Upload gagal | Rendah | Monitor size, cleanup file lama |
| Keamanan data bocor | Pelanggaran UU PDP | Rendah | RBAC ketat, audit log, enkripsi |

---

## 8. Model Monetisasi (jika applicable)

Untuk yayasan milik sendiri, sistem ini digunakan internal tanpa biaya tambahan selain infrastruktur Google Workspace.

Jika ingin dijual sebagai SaaS ke yayasan lain:
- **Tier Gratis**: Sampai 50 siswa.
- **Tier Pro**: Rp 200.000/bulan, sampai 500 siswa.
- **Tier Enterprise**: Custom, multi-cabang + white-label.

---

## 9. Rencana Release

| Versi | Tanggal | Highlight |
|-------|---------|-----------|
| 0.5 (Internal Alpha) | Sept 2026 | Backend selesai, frontend draft |
| 1.0 (MVP Launch) | Okt 2026 | Public website + portal siap, PPDB online untuk tahun ajaran baru |
| 1.1 | Nov 2026 | Email notifikasi, WhatsApp gateway |
| 1.2 | Q1 2027 | Export PDF, mobile-friendly polish |
| 2.0 | Q3 2027 | Migrasi DB, multi-cabang |

---

## 10. Lampiran

### 10.1 Glosarium
- **SPA** — Single Page Application.
- **SSR** — Server-Side Rendering.
- **REST API** — Representational State Transfer API.
- **RBAC** — Role-Based Access Control.
- **UUID** — Universally Unique Identifier.
- **HMAC** — Hash-based Message Authentication Code.

### 10.2 Riwayat Revisi

| Versi | Tanggal | Perubahan |
|-------|---------|-----------|
| 1.0 | 2026-09-12 | Initial document |

---
**— Akhir Dokumen PRD —**