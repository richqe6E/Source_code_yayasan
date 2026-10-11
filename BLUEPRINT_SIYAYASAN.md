# BLUEPRINT SISTEM INFORMASI YAYASAN PENDIDIKAN PAUD/TK
**Dokumen Perencanaan Arsitektur & Produk**

**Versi:** 1.0 (Pre-Development)  
**Tanggal:** 12 September 2026  
**Status:** Analisis & Rekomendasi (Belum ada kode aplikasi)  
**Tujuan:** Menjadi acuan pembangunan website + sistem informasi yayasan PAUD/TK yang aman, scalable, mudah dipelihara, dan berbiaya rendah.

---

## PART 1 — Executive Summary

Dokumen ini merancang sistem informasi terintegrasi untuk Yayasan Pendidikan yang menaungi PAUD dan TK. Sistem mencakup:

- **Public Website** (profil, berita, PPDB online publik)
- **Private Portal** (5 role: Super Admin, Admin/TU, Guru, Orang Tua, Pendaftar)

**Rekomendasi teknologi utama (Justifikasi lengkap di PART 8):**

| Layer | Rekomendasi | Alasan Singkat |
|---|---|---|
| Frontend | HTML + Tailwind CSS + Vanilla JS (mulai), React (fase lanjut) | Murah, mudah dipelajari, modern, cepat |
| Backend | Google Apps Script (MVP) → Node.js/Express (fase scaling) | Biaya Rp 0, native dengan Google Workspace |
| Database | Google Sheets (MVP) → Supabase Postgres (fase scaling) | Migrasi terstruktur dengan ID format konsisten |
| Auth | Firebase Auth atau Supabase Auth (recommended) → bukan Apps Script | Keamanan produksi, mudah integrasi |
| File Storage | Google Drive (MVP) → Supabase Storage / Cloudinary (scaling) | Gratis, kemudian scalable |
| Hosting | Apps Script Web App + Cloudflare (MVP) → Vercel/Railway (scaling) | Murah, CDN, SSL gratis |
| Domain | Domain gratis (Freenom/Cloudflare) → custom .sch.id | Profesional & murah |

**Prinsip arsitektur:**
1. **Single Source of Truth** — satu database untuk seluruh portal
2. **RBAC** (Role-Based Access Control) — setiap role hanya akses sesuai kebutuhan
3. **Modular Architecture** — backend dipisah per file sesuai domain
4. **Migration-Ready** — struktur ID, kolom, dan relasi dirancang agar bisa migrasi ke SQL tanpa refactor besar
5. **Security First** — data anak dan orang tua wajib dienkripsi/dilindungi
6. **Audit Log** — semua mutasi data dicatat (siapa, kapan, apa)

**Estimasi biaya MVP: Rp 0/bulan** (cuma pakai akun Google gratis) + biaya opsional Rp 100–200rb/tahun untuk domain.

---

## PART 2 — Problem Analysis

### 2.1 Masalah Bisnis Saat Ini

| No | Masalah | Dampak |
|---|---|---|
| 1 | Pendaftaran siswa masih manual (datang ke sekolah) | Menghambat calon orang tua, antrian panjang |
| 2 | Data siswa/guru/orang tua tersebar di banyak file (Excel, buku, map) | Sulit cari data, rentan hilang |
| 3 | Tidak ada portal komunikasi terpusat antara sekolah & orang tua | Informasi terlambat disampaikan |
| 4 | Rekap pembayaran SPP masih manual | Rawan selisih, sulit audit |
| 5 | Pencatatan perkembangan anak (rapor) masih tulisan tangan | Sulit arsip, rentan rusak/hilang |
| 6 | Tidak ada sistem backup data terpusat | Risiko data hilang |
| 7 | Tidak ada akses orang tua untuk melihat data anak secara real-time | Orang tua harus menunggu rapor |
| 8 | Tidak ada monitoring PPDB online | Banyak pertanyaan berulang via WA |

### 2.2 Masalah Teknis Jika Tidak Dirancang dengan Benar

- Sistem dibangun "asal jalan" tanpa RBAC → data anak bisa bocor
- Tiap portal punya database sendiri → inkonsistensi data
- Tidak ada audit log → sulit investigasi kesalahan
- ID primary key pakai nama → bentrok saat data sama
- Backend satu file ribuan baris → sulit maintenance
- Tidak ada strategi migrasi → terjebak di teknologi yang tidak scalable

### 2.3 Kebutuhan Pengguna (Ringkas)

- **Orang tua:** mudah cek info anak, bayar SPP online (nanti), lihat perkembangan
- **Guru PAUD/TK:** input perkembangan anak & presensi dengan cepat via HP
- **Admin/TU:** verifikasi PPDB, kelola data, rekap pembayaran, cetak laporan
- **Super Admin:** monitor keseluruhan yayasan, kelola user, audit log
- **Pendaftar:** daftar online tanpa datang ke sekolah

---

## PART 3 — System Goals

### 3.1 Tujuan Utama

1. **Meningkatkan kualitas layanan PPDB** — calon orang tua bisa daftar 24/7 dari rumah
2. **Sentralisasi data** yayasan — satu sumber data utama
3. **Mempercepat komunikasi** sekolah ↔ orang tua
4. **Mempermudah pencatatan perkembangan** anak usia dini
5. **Meningkatkan transparansi pembayaran** SPP
6. **Membangun citra profesional** yayasan melalui website modern

### 3.2 Tujuan Teknis

1. **Scalable** — mampu menangani 100 → 1.000 siswa tanpa redesign
2. **Maintainable** — developer solo bisa maintain
3. **Secure** — data anak terlindungi sesuai UU PDP
4. **Low Cost** — biaya infrastruktur minimal di tahap awal
5. **Migration-Ready** — struktur dirancang agar migrasi DB murah
6. **Mobile-Friendly** — bisa dipakai via HP (mayoritas orang tua)
7. **Backup-able** — data bisa di-restore dari backup
8. **Auditable** — semua perubahan data tercatat

### 3.3 Non-Goals (Di Luar Scope)

- Payment gateway otomatis (MVP) — baru pencatatan manual oleh admin
- E-learning / video conference
- Integrasi Dapodik / sistem pemerintah (fase lanjut)
- Mobile app native (cukup responsive web dulu)
- Multi-bahasa (cukup Bahasa Indonesia)

---

## PART 4 — User & Role Analysis

### 4.1 User Roles

| Role | Deskripsi | Akses Portal |
|---|---|---|
| **Super Admin** | Ketua Yayasan / Pemilik | Portal Yayasan, semua modul |
| **Admin / TU** | Tata Usaha sekolah | Portal Admin |
| **Guru** | Guru PAUD/TK | Portal Guru |
| **Orang Tua** | Wali murid | Portal Orang Tua |
| **Pendaftar** | Calon orang tua siswa | Portal PPDB |

### 4.2 User Personas

**Persona 1: Ibu Siti (Orang Tua)**  
- Usia 28–40 tahun, melek HP Android, sering WA
- Ingin lihat perkembangan anak tanpa harus ke sekolah
- Kebutuhan: notifikasi pengumuman, cek tagihan, lihat rapor

**Persona 2: Bu Rina (Guru TK)**  
- Usia 30–50 tahun, tidak terlalu mahir komputer
- Input nilai & presensi via HP
- Kebutuhan: form input sederhana, lihat daftar siswa, kirim catatan

**Persona 3: Pak Andi (Admin TU)**  
- Usia 25–45 tahun, mahir komputer dasar
- Kelola PPDB, siswa, pembayaran
- Kebutuhan: verifikasi PPDB, cetak laporan, rekap pembayaran

**Persona 4: Bapak Hendra (Ketua Yayasan)**  
- Usia 40–60 tahun, supervisory role
- Ingin lihat dashboard ringkasan
- Kebutuhan: monitor PPDB, pembayaran, aktivitas admin

**Persona 5: Ibu Lina (Calon Orang Tua)**  
- Usia 25–35 tahun
- Ingin daftar TK untuk anaknya
- Kebutuhan: formulir online yang mudah, cek status pendaftaran

### 4.3 Prinsip Least Privilege

Setiap role hanya boleh:
- **Lihat** data yang menjadi haknya
- **Ubah** data yang menjadi haknya
- **Tidak boleh** akses data role lain kecuali diizinkan

---

## PART 5 — Portal Architecture

### 5.1 Struktur Portal

```
YAYASAN EDUCATION SYSTEM
│
├── 1. PUBLIC WEBSITE (tanpa login)
│   ├── Beranda
│   ├── Profil Yayasan (Visi, Misi, Struktur)
│   ├── Program Pendidikan
│   ├── Fasilitas
│   ├── Galeri
│   ├── Berita
│   ├── Pengumuman
│   ├── Agenda
│   ├── Kontak & Lokasi
│   ├── Info PPDB
│   ├── Formulir Pendaftaran Online
│   └── Cek Status Pendaftaran
│
├── 2. PRIVATE PORTAL (perlu login)
│   │
│   ├── 2.1 PORTAL SUPER ADMIN
│   │   ├── Dashboard Yayasan
│   │   ├── Manajemen User & Role
│   │   ├── Manajemen Sekolah
│   │   ├── Manajemen Data Master (Tahun Ajaran, Kelas, dll)
│   │   ├── Monitoring Sistem
│   │   ├── Audit Log
│   │   ├── Backup & Restore
│   │   └── Pengaturan Sistem
│   │
│   ├── 2.2 PORTAL ADMIN / TU
│   │   ├── Dashboard Operasional
│   │   ├── PPDB (Verifikasi, Penerimaan, Konversi)
│   │   ├── Data Siswa, Orang Tua, Kelas
│   │   ├── Pembayaran SPP
│   │   ├── Pengumuman, Berita, Agenda
│   │   ├── Cetak Laporan
│   │   └── Manajemen Dokumen
│   │
│   ├── 2.3 PORTAL GURU
│   │   ├── Dashboard Guru
│   │   ├── Daftar Kelas & Siswa
│   │   ├── Presensi Siswa
│   │   ├── Penilaian / Perkembangan Anak
│   │   ├── Catatan Perilaku / Kegiatan
│   │   ├── Pengumuman Kelas
│   │   └── Riwayat Aktivitas
│   │
│   ├── 2.4 PORTAL ORANG TUA
│   │   ├── Dashboard Anak
│   │   ├── Data Anak
│   │   ├── Perkembangan Anak (Rapor)
│   │   ├── Kehadiran
│   │   ├── Tagihan & Riwayat Pembayaran
│   │   ├── Pengumuman
│   │   ├── Notifikasi
│   │   └── Pengajuan Perubahan Data
│   │
│   └── 2.5 PORTAL PENDAFTAR (lightweight)
│       ├── Status Pendaftaran
│       ├── Perbaikan Data (jika diminta)
│       └── Cetak Bukti Pendaftaran
```

### 5.2 Prinsip Portal

- **Satu domain, banyak "area"** — misal `yayasan.sch.id/admin`, `yayasan.sch.id/guru`, `yayasan.sch.id/ortu`
- **Satu login page universal** → redirect sesuai role
- **Satu session/token** — frontend cek role lalu tampilkan menu sesuai role
- **Backend sama, route berbeda** — tidak ada backend terpisah per portal (Single Source of Truth)

---

## PART 6 — Feature Architecture

### 6.1 Daftar Fitur per Portal + Prioritas

Format: **P0** (Wajib MVP) | **P1** (Penting, fase 2) | **P2** (Bisa ditunda) | **P3** (Future)

#### A. PUBLIC WEBSITE
| Fitur | Prioritas |
|---|---|
| Beranda | P0 |
| Profil Yayasan | P0 |
| Visi Misi | P0 |
| Struktur Organisasi | P1 |
| Program Pendidikan | P0 |
| Fasilitas | P1 |
| Galeri Foto | P1 |
| Berita | P0 |
| Pengumuman | P0 |
| Agenda | P1 |
| Kontak & Lokasi (peta) | P0 |
| Info PPDB (brosur online) | P0 |
| Persyaratan & Jadwal | P0 |
| Biaya Pendidikan | P1 |
| FAQ | P2 |
| Formulir Pendaftaran Online | P0 |
| Cek Status Pendaftaran | P0 |

#### B. PORTAL SUPER ADMIN
| Fitur | Prioritas |
|---|---|
| Dashboard | P0 |
| Manajemen User | P0 |
| Manajemen Role & Permission | P0 |
| Manajemen Yayasan | P1 |
| Manajemen Sekolah | P1 |
| Manajemen Tahun Ajaran | P0 |
| Manajemen Kelas | P0 |
| Manajemen Guru | P0 |
| Manajemen Siswa (read-only view) | P0 |
| Monitoring Aktivitas User | P1 |
| Backup Data | P1 |
| Audit Log | P0 |
| Pengaturan Sistem | P1 |
| Restore Data | P2 |

#### C. PORTAL ADMIN / TU
| Fitur | Prioritas |
|---|---|
| Dashboard | P0 |
| PPDB: Buka/Tutup Periode | P0 |
| PPDB: Verifikasi Pendaftaran | P0 |
| PPDB: Terima/Tolak | P0 |
| PPDB: Minta Perbaikan | P0 |
| Konversi Pendaftar → Siswa Aktif | P0 |
| Pembuatan Akun Orang Tua | P0 |
| Data Siswa | P0 |
| Data Orang Tua | P0 |
| Data Guru (input) | P0 |
| Data Kelas & Rombel | P0 |
| Pembuatan Tagihan SPP | P0 |
| Verifikasi Pembayaran Manual | P0 |
| Rekap Pembayaran | P0 |
| Cetak Laporan (PDF/Excel) | P1 |
| Pengumuman | P0 |
| Berita | P0 |
| Agenda | P1 |
| Galeri | P1 |
| Manajemen Dokumen | P1 |

#### D. PORTAL GURU
| Fitur | Prioritas |
|---|---|
| Dashboard | P0 |
| Profil Guru | P1 |
| Daftar Kelas yang Diajar | P0 |
| Daftar Siswa per Kelas | P0 |
| Presensi Harian | P0 |
| Input Perkembangan Anak | P0 |
| Catatan Perilaku | P1 |
| Catatan Kegiatan Harian | P1 |
| Kirim Pesan ke Orang Tua (tercatat) | P2 |
| Lihat Pengumuman | P0 |
| Riwayat Input | P1 |

#### E. PORTAL ORANG TUA
| Fitur | Prioritas |
|---|---|
| Dashboard Anak | P0 |
| Profil Anak | P0 |
| Perkembangan Anak (Rapor Online) | P0 |
| Kehadiran | P0 |
| Catatan dari Guru | P0 |
| Tagihan SPP | P0 |
| Riwayat Pembayaran | P0 |
| Upload Bukti Pembayaran | P1 |
| Status Tunggakan | P0 |
| Pengumuman | P0 |
| Notifikasi | P1 |
| Pengajuan Perubahan Data | P2 |
| Dokumen Anak (lihat) | P1 |

#### F. PORTAL PENDAFTAR (Simpel)
| Fitur | Prioritas |
|---|---|
| Cek Status Pendaftaran | P0 |
| Perbaikan Data (jika status NEEDS_REVISION) | P0 |
| Cetak Bukti Pendaftaran | P0 |
| Ajukan Daftar Ulang | P0 |

### 6.2 Fitur yang Sebaiknya Ditunda untuk PAUD/TK

- ❌ Mata pelajaran & jadwal pelajaran seperti SMA
- ❌ Sistem kurikulum & silabus digital
- ❌ E-learning / video conference
- ❌ Mobile app native
- ❌ Integrasi payment gateway otomatis (tahap awal cukup pencatatan manual)
- ❌ Multi-cabang (fase scaling)
- ❌ Sistem absensi guru dengan fingerprint (cukup manual oleh guru)
- ❌ Raport digital lengkap seperti SMA (cukup catatan perkembangan naratif)

---

## PART 7 — System Architecture

### 7.1 Arsitektur 3-Layer (Simplified)

```
┌─────────────────────────────────────────────────┐
│                USER (Browser/Mobile)             │
└─────────────────────────────────────────────────┘
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────────┐
│   FRONTEND (HTML + Tailwind + Vanilla JS)       │
│   - Public site                                 │
│   - Login page                                  │
│   - Dashboards per role                         │
└─────────────────────────────────────────────────┘
                       │ HTTPS / JSON
                       ▼
┌─────────────────────────────────────────────────┐
│   BACKEND (Google Apps Script / Node.js)        │
│   ┌──────────────────────────────────────────┐  │
│   │  Auth Module                             │  │
│   │  RBAC Module                             │  │
│   │  Business Logic per Service              │  │
│   │  File Upload Handler                     │  │
│   │  Notification Service                    │  │
│   └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
        │                              │
        ▼                              ▼
┌──────────────────┐         ┌──────────────────┐
│  DATABASE        │         │  FILE STORAGE    │
│  Google Sheets   │         │  Google Drive    │
│  (→ Postgres)    │         │  (→ Supabase     │
│                  │         │   Storage)       │
└──────────────────┘         └──────────────────┘
```

### 7.2 Arsitektur Fase Scaling

```
USER → Cloudflare CDN → Vercel (Frontend)
                          │
                          ▼
                       Railway/Fly.io (Backend Node.js)
                          │
                          ▼
                       Supabase Postgres + Storage + Auth
                          │
                          ▼
                       Email Service (Resend/SendGrid)
                       WhatsApp Gateway (Fonnte/WAHA)
```

### 7.3 Pola Komunikasi Frontend ↔ Backend

Ada 2 metode di Apps Script:

1. **`google.script.run`** — khusus untuk web app yang di-host di Apps Script sendiri
   - ✅ Lebih cepat (no network round-trip ekstra)
   - ✅ Cocok untuk halaman admin yang di-serve dari Apps Script
   - ❌ Hanya untuk Apps Script Web App
   
2. **HTTP `doGet`/`doPost` (Web App API)** — endpoint publik
   - ✅ Frontend bisa di-host di mana saja (Vercel, GitHub Pages, Cloudflare Pages)
   - ✅ Bisa dipanggil dari mobile app
   - ✅ Standar industri (REST)
   - ✅ Lebih mudah di-mock saat testing

**Rekomendasi:** Gunakan **`doGet`/`doPost` sebagai JSON API** (REST-style) karena:
- Frontend bisa static (cache via Cloudflare, gratis)
- Lebih portabel saat migrasi
- Standar industri
- `google.script.run` masih boleh dipakai untuk halaman yang benar-benar perlu optimasi internal

### 7.4 Prinsip Desain

- **Stateless Backend** — setiap request bawa token
- **Token-Based Auth** — JWT atau session token (bukan cookie-only)
- **API Versioning** — `/api/v1/...`
- **Standardized Response**:
```json
{
  "success": true,
  "data": {...},
  "error": null,
  "meta": {"timestamp": "2026-09-12T10:00:00Z"}
}
```

---

## PART 8 — Technology Stack Recommendation

### 8.1 Perbandingan Frontend

| Option | Kelebihan | Kekurangan | Biaya | Kesulitan | Rekomendasi |
|---|---|---|---|---|---|
| **HTML + Vanilla JS** | Murah, ringan, mudah | Repetitif untuk UI kompleks | Rp 0 | ⭐ | Cocok untuk landing page |
| **Bootstrap 5** | Cepat styling, banyak komponen | Tampilan generik | Rp 0 | ⭐⭐ | Alternatif |
| **Tailwind CSS** ⭐ | Modern, fleksibel, cepat | Learning curve awal | Rp 0 | ⭐⭐ | **Rekomendasi utama** |
| **React** | Komponen reusable, ekosistem besar | Perlu build tool, lebih kompleks | Rp 0 | ⭐⭐⭐⭐ | Untuk fase scaling |
| **Vue** | Lebih mudah dari React | Ekosistem lebih kecil | Rp 0 | ⭐⭐⭐ | Alternatif React |

**Keputusan: Tailwind CSS + Vanilla JS untuk MVP**, **React (Vite) untuk fase scaling.**

Alasan: Tailwind menghasilkan UI modern & responsive tanpa framework berat. Vanilla JS cukup untuk interaksi sederhana. Saat kompleksitas naik, migrasi ke React lebih mudah.

### 8.2 Perbandingan Backend

| Option | Kelebihan | Kekurangan | Biaya | Kesulitan | Rekomendasi |
|---|---|---|---|---|---|
| **Google Apps Script** ⭐ | Gratis, integrasi Sheets/Drive, cepat deploy | Limit execution time, limit concurrent, debugging lebih susah | Rp 0 | ⭐⭐ | **MVP** |
| **Node.js + Express** | Standar industri, ekosistem besar, scalable | Perlu setup server, hosting bayar | Rp 0–100rb/bln | ⭐⭐⭐ | **Scaling** |
| **Python + Flask/FastAPI** | Mudah, cocok untuk data | Performa lebih lambat | Rp 0–100rb/bln | ⭐⭐⭐ | Alternatif |
| **Supabase Functions** | Terintegrasi DB, gratis tier | Vendor lock-in | Rp 0 | ⭐⭐ | Scaling alternatif |
| **Firebase Functions** | Skalabel otomatis, gratis tier | Vendor lock-in | Rp 0 | ⭐⭐⭐ | Alternatif |

**Keputusan: Apps Script untuk MVP**, **Node.js (Express) + hosting Railway/Fly.io untuk scaling.**

### 8.3 Perbandingan Database

| Option | Kelebihan | Kekurangan | Biaya | Kesulitan | Rekomendasi |
|---|---|---|---|---|---|
| **Google Sheets** ⭐ | Gratis, mudah, visual, kolaboratif | Concurrency terbatas (~40 writer), max ~10 juta cell, query lambat | Rp 0 | ⭐ | **MVP** |
| **Supabase Postgres** ⭐ | Postgres proper, gratis 500MB, real-time, REST auto | Butuh internet stabil | Rp 0–$25/bln | ⭐⭐ | **Scaling** |
| **Firebase Firestore** | Real-time, mudah mobile | NoSQL, query terbatas | Rp 0–blaya pakai | ⭐⭐⭐ | Alternatif |
| **MySQL/Postgres VPS** | Full control | Perlu setup & maintenance | Rp 50–200rb/bln | ⭐⭐⭐⭐ | Untuk yayasan besar |
| **PlanetScale / Neon** | Serverless Postgres | Learning curve | Rp 0–$29/bln | ⭐⭐⭐ | Alternatif Supabase |

**Keputusan: Google Sheets untuk MVP (≤100 siswa), Supabase Postgres untuk scaling.**

### 8.4 Perbandingan Authentication

| Option | Kelebihan | Kekurangan | Biaya | Kesulitan | Rekomendasi |
|---|---|---|---|---|---|
| **Apps Script Custom Auth** | Gratis | Lemah, hash terbatas, XSS rentan | Rp 0 | ⭐⭐ | ❌ Tidak untuk production |
| **Google Identity (OAuth)** ⭐ | Gratis, aman, single sign-on | Butuh akun Google | Rp 0 | ⭐⭐ | Cocok untuk guru/admin |
| **Firebase Auth** ⭐ | Gratis, banyak metode (email/WA/Google), JWT | Vendor lock-in | Rp 0 | ⭐⭐ | **Rekomendasi utama** |
| **Supabase Auth** | Terintegrasi DB, RLS | Vendor lock-in | Rp 0 | ⭐⭐ | **Rekomendasi utama** |
| **Clerk / Auth0** | UI cantik, banyak fitur | Mahal | $25+/bln | ⭐⭐ | Untuk enterprise |

**Keputusan: Gunakan Firebase Auth atau Supabase Auth**, **bukan custom auth di Apps Script.**

Alasan: Data anak & orang tua adalah data sensitif (UU PDP). Jangan bikin auth sendiri di Apps Script karena:
- Apps Script tidak punya middleware security proper
- Password hashing terbatas
- Tidak ada rate limiting built-in
- Token management sulit

Untuk MVP dengan budget Rp 0, **pakai Firebase Auth (Spark plan gratis)** atau **Supabase Auth (gratis tier)**.

### 8.5 Perbandingan File Storage

| Option | Kelebihan | Kekurangan | Biaya | Rekomendasi |
|---|---|---|---|---|
| **Google Drive** ⭐ | Gratis 15GB, integrasi Apps Script | Sharing permission ribet, URL暴露 | Rp 0 | **MVP** |
| **Supabase Storage** | S3-compatible, signed URL | Butuh migrasi | Gratis 1GB | Scaling |
| **Cloudinary** | Image optimization, transform | Berbayar setelah free tier | $0–$99/bln | Alternatif |

### 8.6 Perbandingan Hosting

| Option | Biaya | Catatan |
|---|---|---|
| **Apps Script Web App** ⭐ | Rp 0 | MVP |
| **Cloudflare Pages** ⭐ | Rp 0 | Static frontend |
| **Vercel** | Rp 0 | Frontend modern, mudah deploy |
| **Railway** | $5/bln (free trial) | Backend Node.js |
| **Fly.io** | Free tier | Backend alternatif |

### 8.7 Stack Final (Rekomendasi)

**MVP Stack:**
```
Frontend:  Tailwind CSS + Vanilla JS
Backend:   Google Apps Script (modular)
Database:  Google Sheets (struktur SQL-like)
Auth:      Firebase Auth (free tier)
Storage:   Google Drive (folder terstruktur)
Hosting:   Apps Script Web App + Cloudflare Pages
Domain:    Cloudflare Registrar /免费 domain
Biaya:     ~Rp 100–200rb/tahun (opsional: domain)
```

**Scaling Stack (saat siswa > 100 atau masalah performa):**
```
Frontend:  React + Vite + Tailwind (di Vercel)
Backend:   Node.js + Express (di Railway/Fly.io)
Database:  Supabase Postgres
Auth:      Supabase Auth
Storage:   Supabase Storage
Email:     Resend / SendGrid
WA:        Fonnte API (resmi, bukan spam)
Biaya:     ~$0–25/bln (Rp 0–400rb/bln)
```

---

## PART 9 — Database Architecture

### 9.1 Prinsip Database

1. **Single Source of Truth** — semua portal akses DB yang sama
2. **Unique ID Format** — ID bisnis (bukan auto-increment DB)
3. **Soft Delete** — data tidak langsung dihapus, ditandai `is_deleted`
4. **Audit Fields** — `created_at`, `created_by`, `updated_at`, `updated_by`
5. **Timestamp ISO 8601** — format konsisten UTC
6. **Relational Structure** — meskipun di Sheets, gunakan foreign key logic

### 9.2 ID Format Standar

Format: `PREFIX-TAHUN-NOMOR_URUT_5_DIGIT`

| Entity | Prefix | Contoh |
|---|---|---|
| User | USR | USR-2026-00001 |
| Student | STU | STU-2026-00001 |
| Parent | PAR | PAR-2026-00001 |
| Teacher | TCH | TCH-2026-00001 |
| School | SCH | SCH-2026-00001 |
| Class | CLS | CLS-2026-00001 |
| Academic Year | AY | AY-2026-2027 |
| Enrollment | ENR | ENR-2026-00001 |
| PPDB Registration | REG | REG-2026-00001 |
| PPDB Document | REGDOC | REGDOC-2026-00001 |
| Student Document | STUDOC | STUDOC-2026-00001 |
| Attendance | ATT | ATT-2026-00001 |
| Development Record | DEV | DEV-2026-00001 |
| Teacher Note | NOTE | NOTE-2026-00001 |
| Invoice | INV | INV-2026-00001 |
| Payment | PAY | PAY-2026-00001 |
| Announcement | ANN | ANN-2026-00001 |
| News | NWS | NWS-2026-00001 |
| Event | EVT | EVT-2026-00001 |
| Gallery Item | GAL | GAL-2026-00001 |
| Activity Log | LOG | LOG-2026-00001 |
| Notification | NOTIF | NOTIF-2026-00001 |
| Permission | PERM | PERM-2026-00001 |
| Role | ROLE | ROLE-2026-00001 |

**Keuntungan format ini:**
- ✅ Tahun terlihat → mudah filter per tahun ajaran
- ✅ Sequence number → simple ordering
- ✅ Prefix jelas → mudah dikenali entity-nya
- ✅ Migrasi ke SQL → ID jadi varchar primary key
- ✅ Anti tabrakan → antar entity tidak akan bentrok

**Generator ID di Apps Script:**
```
function generateId(prefix) {
  const year = new Date().getFullYear();
  const counterSheet = SpreadsheetApp.openById(COUNTER_ID).getSheetByName('counter');
  const key = prefix + '-' + year;
  const last = counterSheet.getRange(...).getValue();
  const next = (parseInt(last) || 0) + 1;
  counterSheet.getRange(...).setValue(next);
  return prefix + '-' + year + '-' + String(next).padStart(5, '0');
}
```

### 9.3 Entity List (Lengkap)

Lihat PART 17 untuk ERD detail. Singkatnya:

**Master Data:**
- `users`, `roles`, `permissions`, `role_permissions`
- `schools`, `academic_years`, `classes`, `subjects` (opsional)

**People:**
- `students`, `parents`, `teachers`, `parent_student_relations`

**Academic:**
- `enrollments`, `attendance`, `student_development`, `teacher_notes`

**PPDB:**
- `ppdb_registrations`, `ppdb_documents`, `ppdb_periods`

**Finance:**
- `invoices`, `payments`, `payment_verifications`

**Content:**
- `announcements`, `news`, `events`, `galleries`

**System:**
- `activity_logs`, `notifications`, `system_settings`

### 9.4 Relasi Utama (Singkat)

- `users` 1—N (one to many) → bisa jadi student/parent/teacher/admin
- `students` N—N → `parents` (via `parent_student_relations`)
- `students` N—1 → `classes`
- `classes` N—1 → `schools`
- `classes` N—1 → `academic_years`
- `teachers` N—N → `classes` (via `teacher_class_assignments`)
- `enrollments` → `students` × `academic_years`
- `ppdb_registrations` → setelah diterima → buat `students` + `enrollments`
- `invoices` → `students` per `academic_year`
- `payments` → `invoices`

### 9.5 Validasi Data

Setiap sheet/tabel harus punya:
- **Data validation** (dropdown, format)
- **Required fields** (tidak boleh kosong)
- **Format validation** (email, phone, date ISO)
- **Unique constraints** (email, ID)
- **Referential integrity** (FK harus valid)

Di Apps Script, validasi dilakukan di:
- Layer backend (sebelum write ke sheet)
- Apps Script `onEdit` trigger (validasi ringan)

### 9.6 Tanda "-" atau catatan

**Jangan pakai nama siswa sebagai primary key** karena:
- Bisa bentrok jika nama sama
- Bisa berubah (pernikahan, adopsi)
- Tidak unik secara global

---

## PART 10 — Google Sheets Database Design

### 10.1 Struktur Sheet (Tabel)

Setiap sheet = 1 tabel. Konvensi penamaan:
- Huruf kecil semua, underscore untuk spasi
- Sheet pertama selalu `config` (pengaturan sistem)
- ID selalu kolom A

### 10.2 Daftar Sheet

#### Sheet: `users`
| Kolom | Tipe | Keterangan |
|---|---|---|
| A: id | string | PK, format USR-YYYY-NNNNN |
| B: email | string | Unique, login identifier |
| C: password_hash | string | bcrypt/scrypt hash |
| D: full_name | string | |
| E: phone | string | |
| F: role_id | string | FK ke roles.id |
| G: status | enum | active/inactive/suspended |
| H: linked_entity_id | string | ID student/parent/teacher/admin |
| I: linked_entity_type | enum | student/parent/teacher/admin/none |
| J: last_login | datetime | |
| K: failed_login_count | int | Untuk lockout |
| L: locked_until | datetime | |
| M: email_verified | bool | |
| N: created_at | datetime | |
| O: created_by | string | FK ke users.id |
| P: updated_at | datetime | |
| Q: updated_by | string | FK ke users.id |
| R: is_deleted | bool | Soft delete |

#### Sheet: `roles`
| Kolom | Tipe |
|---|---|
| A: id | PK (ROLE-2026-00001) |
| B: code | enum: super_admin, admin_tu, guru, orang_tua, pendaftar |
| C: name | string |
| D: description | string |
| E: is_system | bool (role bawaan tidak bisa dihapus) |
| F-I: audit fields |

#### Sheet: `permissions`
| Kolom | Tipe |
|---|---|
| A: id | PK |
| B: code | e.g. "student.create", "ppdb.verify" |
| C: module | string |
| D: action | enum: create/read/update/delete/verify/approve |
| E: description | string |

#### Sheet: `role_permissions`
| Kolom | Tipe |
|---|---|
| A: id | PK |
| B: role_id | FK |
| C: permission_id | FK |
| D: created_at | |

#### Sheet: `schools`
| Kolom | Tipe |
|---|---|
| A: id | PK (SCH-2026-00001) |
| B: code | string (e.g. TK-A) |
| C: name | string |
| D: level | enum: PAUD/TK/SD/dst |
| E: address | string |
| F: phone | string |
| G: email | string |
| H: head_id | FK ke teachers (kepsek) |
| I: status | enum |
| J-Q: audit fields |

#### Sheet: `academic_years`
| Kolom | Tipe |
|---|---|
| A: id | PK (AY-2026-2027) |
| B: name | e.g. "2026/2027" |
| C: start_date | date |
| D: end_date | date |
| E: is_active | bool |
| F-K: audit |

#### Sheet: `classes`
| Kolom | Tipe |
|---|---|
| A: id | PK (CLS-2026-00001) |
| B: school_id | FK |
| C: academic_year_id | FK |
| D: name | string (TK-A, PAUD-Bintang) |
| E: level | enum (PAUD-A, PAUD-B, TK-A, TK-B) |
| F: homeroom_teacher_id | FK ke teachers |
| G: capacity | int |
| H: status | enum |
| I-P: audit |

#### Sheet: `students`
| Kolom | Tipe |
|---|---|
| A: id | PK |
| B: nis | string (Nomor Induk Siswa) |
| C: nisn | string (nullable) |
| D: full_name | string |
| E: nickname | string |
| F: gender | enum: L/P |
| G: birth_place | string |
| H: birth_date | date |
| I: religion | string |
| J: address | string |
| K: photo_file_id | FK ke Drive |
| L: birth_cert_number | string |
| M: status | enum: active/graduated/transfer/dropout |
| N: enrollment_date | date |
| O: created_from_ppdb_reg | FK ke ppdb_registrations |
| P-Y: audit + soft delete |

#### Sheet: `parents`
| Kolom | Tipe |
|---|---|
| A: id | PK |
| B: full_name | string |
| C: relation | enum: ayah/ibu/wali |
| D: nik | string |
| E: phone | string |
| F: email | string |
| G: occupation | string |
| H: address | string |
| I: user_id | FK ke users (akun login ortu) |
| J-Q: audit |

#### Sheet: `parent_student_relations`
| Kolom | Tipe |
|---|---|
| A: id | PK |
| B: parent_id | FK |
| C: student_id | FK |
| D: relation | enum |
| E: is_primary | bool (ortu utama untuk notif) |
| F-K: audit |

#### Sheet: `teachers`
| Kolom | Tipe |
|---|---|
| A: id | PK |
| B: nip | string |
| C: full_name | string |
| D: gender | enum |
| E: phone | string |
| F: email | string |
| G: address | string |
| H: position | enum: guru_kelas/guru_pendamping/kepsek |
| I: school_id | FK |
| J: photo_file_id | FK ke Drive |
| K: hire_date | date |
| L: status | enum |
| M: user_id | FK ke users (akun login guru) |
| N-W: audit |

#### Sheet: `enrollments`
| Kolom | Tipe |
|---|---|
| A: id | PK (ENR-2026-00001) |
| B: student_id | FK |
| C: class_id | FK |
| D: academic_year_id | FK |
| E: enrollment_date | date |
| F: status | enum: aktif/cuti/lulus/pindah |
| G-L: audit |

#### Sheet: `ppdb_periods`
| Kolom | Tipe |
|---|---|
| A: id | PK |
| B: academic_year_id | FK |
| C: school_id | FK |
| D: name | string |
| E: start_date | datetime |
| F: end_date | datetime |
| G: registration_fee | decimal |
| H: spp_monthly | decimal |
| I: quota_per_class | int |
| J: status | enum: draft/open/closed |
| K-R: audit |

#### Sheet: `ppdb_registrations`
| Kolom | Tipe |
|---|---|
| A: id | PK (REG-2026-00001) |
| B: period_id | FK |
| C: full_name | string |
| D: nickname | string |
| E: gender | enum |
| F: birth_place, birth_date | |
| G: religion | |
| H: address | |
| I: father_name, mother_name, guardian_name | |
| J: father_phone, mother_phone, guardian_phone | |
| K: father_email, mother_email | |
| L: previous_school | string |
| M: notes | string |
| N: status | enum: draft/submitted/waiting_verification/needs_revision/verified/accepted/rejected/re_registration/active_student |
| O: verified_by | FK ke users |
| P: verified_at | datetime |
| Q: rejection_reason | string |
| R: accepted_at | datetime |
| S: converted_to_student_id | FK ke students |
| T-Y: audit |

#### Sheet: `ppdb_documents`
| Kolom | Tipe |
|---|---|
| A: id | PK (REGDOC-...) |
| B: registration_id | FK |
| C: doc_type | enum: akta_kelahiran/kartu_keluarga/ktp_ortu/foto_anak/ijazah/rapor |
| D: file_id | FK ke Drive |
| E: file_name | string |
| F: mime_type | string |
| G: file_size | int |
| H: uploaded_at | datetime |
| I: verified | bool |
| J: verified_by | FK |
| K-Q: audit |

#### Sheet: `student_documents`
(Sama strukturnya dengan `ppdb_documents` tapi setelah siswa aktif)

#### Sheet: `attendance`
| Kolom | Tipe |
|---|---|
| A: id | PK (ATT-2026-00001) |
| B: student_id | FK |
| C: class_id | FK |
| D: date | date |
| E: status | enum: hadir/izin/sakit/alpha |
| F: check_in_time | time |
| G: check_out_time | time |
| H: notes | string |
| I: recorded_by | FK ke teachers |
| J-Q: audit |

#### Sheet: `student_development`
| Kolom | Tipe |
|---|---|
| A: id | PK (DEV-2026-00001) |
| B: student_id | FK |
| C: class_id | FK |
| D: academic_year_id | FK |
| E: period | enum: semester_1/semester_2 |
| F: recorded_by | FK ke teachers |
| G: recorded_date | date |
| H: aspek_nilai_agama_dan_budi_pekerti | json/text |
| I: aspek_jasmani_dan_kesehatan | json/text |
| J: aspek_kognitif | json/text |
| K: aspek_bahasa | json/text |
| L: aspek_sosial_emosional | json/text |
| M: aspek_seni | json/text |
| N: catatan_guru | text (narasi) |
| O: rekomendasi | text |
| P-Y: audit |

> Catatan: Untuk PAUD/TK, penilaian berbasis **narasi + checklist perkembangan**, bukan angka seperti SMA.

#### Sheet: `teacher_notes`
| Kolom | Tipe |
|---|---|
| A: id | PK |
| B: student_id | FK |
| C: teacher_id | FK |
| D: type | enum: perilaku/kegiatan/komunikasi |
| E: note_date | date |
| F: note | text |
| G: visibility | enum: internal/parent |
| H-N: audit |

#### Sheet: `invoices`
| Kolom | Tipe |
|---|---|
| A: id | PK (INV-2026-00001) |
| B: student_id | FK |
| C: academic_year_id | FK |
| D: period_label | string (e.g. "SPP September 2026") |
| E: due_date | date |
| F: amount | decimal |
| G: status | enum: unpaid/partial/paid/overdue/cancelled |
| H: total_paid | decimal |
| I-L: audit |

#### Sheet: `payments`
| Kolom | Tipe |
|---|---|
| A: id | PK (PAY-2026-00001) |
| B: invoice_id | FK |
| C: student_id | FK |
| D: parent_id | FK |
| E: payment_date | date |
| F: amount | decimal |
| G: method | enum: cash/transfer/qris |
| H: proof_file_id | FK ke Drive |
| I: notes | string |
| J: status | enum: menunggu_verifikasi/verified/rejected |
| K: verified_by | FK |
| L: verified_at | datetime |
| M: rejection_reason | string |
| N-W: audit |

#### Sheet: `announcements`
| Kolom | Tipe |
|---|---|
| A: id | PK |
| B: title | string |
| C: content | text/html |
| D: target_audience | enum: all/parents/teachers/public |
| E: school_id | FK (nullable) |
| F: is_pinned | bool |
| G: published_at | datetime |
| H: expires_at | datetime |
| I: status | enum: draft/published/archived |
| J-P: audit |

#### Sheet: `news`
(Mirip `announcements`, tapi untuk berita website publik)

#### Sheet: `events`
| Kolom | Tipe |
|---|---|
| A: id | PK |
| B: title | string |
| C: description | text |
| D: event_date | date |
| E: start_time | time |
| F: end_time | time |
| G: location | string |
| H: image_file_id | FK ke Drive |
| I: target_audience | enum |
| J: status | enum: draft/published |
| K-Q: audit |

#### Sheet: `galleries`
| Kolom | Tipe |
|---|---|
| A: id | PK |
| B: title | string |
| C: description | text |
| D: file_id | FK ke Drive |
| E: file_type | enum: image/video |
| F: mime_type | string |
| G: category | string (kegiatan/fasilitas/acara) |
| H: is_featured | bool |
| I: display_order | int |
| J-P: audit |

#### Sheet: `activity_logs`
| Kolom | Tipe |
|---|---|
| A: id | PK (LOG-2026-00001) |
| B: timestamp | datetime |
| C: user_id | FK |
| D: action | enum: login/logout/create/update/delete/verify/approve/reject |
| E: module | string (auth/ppdb/payment/dll) |
| F: entity_type | string (student/payment/dll) |
| G: entity_id | string |
| H: description | string |
| I: ip_address | string |
| J: user_agent | string |
| K: old_values | json |
| L: new_values | json |

#### Sheet: `notifications`
| Kolom | Tipe |
|---|---|
| A: id | PK |
| B: user_id | FK (penerima) |
| C: type | enum: ppdb/payment/announcement/development/dll |
| D: title | string |
| E: message | text |
| F: link | string (URL halaman terkait) |
| G: read_at | datetime (null = belum dibaca) |
| H: channel | enum: in_app/email/whatsapp |
| I: sent_at | datetime |
| J-P: audit |

#### Sheet: `system_settings`
| Kolom | Tipe |
|---|---|
| A: key | string (PK) |
| B: value | string |
| C: type | enum: string/number/boolean/json |
| D: description | string |
| E: updated_at | datetime |
| F: updated_by | FK |

#### Sheet: `teacher_class_assignments`
| Kolom | Tipe |
|---|---|
| A: id | PK |
| B: teacher_id | FK |
| C: class_id | FK |
| D: subject_id | FK (nullable untuk PAUD/TK) |
| E: role | enum: homeroom/subject_teacher |
| F-J: audit |

### 10.3 Counter Sheet

Sheet khusus untuk generate ID otomatis:
- Sheet: `id_counters`
- Kolom: `prefix_year`, `last_number`, `updated_at`

### 10.4 Catatan Struktur Sheets

- **Sheet `config`** — berisi metadata: version, last_migration, dll
- **Sheet `migrations`** — log migrasi schema
- **Gunakan format tanggal ISO 8601** (YYYY-MM-DD atau YYYY-MM-DDTHH:mm:ssZ) untuk konsistensi
- **Currency** selalu decimal (float), format Rupiah di frontend saja
- **JSON fields** disimpan sebagai string (akan diparse di backend)

---

## PART 11 — Google Drive Architecture

### 11.1 Struktur Folder

```
[Yavasan Root] / (id_folder_root)
│
├── PPDB/
│   ├── 2025-2026/
│   │   ├── Pendaftaran/
│   │   │   ├── REG-2025-00001_Akta/
│   │   │   ├── REG-2025-00001_KK/
│   │   │   └── ...
│   │   └── Verifikasi/
│   └── 2026-2027/
│       └── ...
│
├── SISWA/
│   ├── STU-2026-00001/
│   │   ├── Foto/
│   │   ├── Dokumen/
│   │   │   ├── Akta/
│   │   │   ├── KK/
│   │   │   └── Rapor/
│   │   └── Pembayaran/
│   │       ├── INV-2026-00001/
│   │       └── INV-2026-00002/
│   └── STU-2026-00002/
│       └── ...
│
├── GURU/
│   ├── TCH-2026-00001/
│   │   ├── Foto/
│   │   └── Dokumen/
│   └── ...
│
├── BERITA/
│   ├── 2026/
│   │   ├── NWS-2026-00001/
│   │   └── NWS-2026-00002/
│   └── ...
│
├── PENGUMUMAN/
│   └── ...
│
├── AGENDA/
│   └── ...
│
├── GALERI/
│   ├── 2026/
│   │   ├── Kegiatan_Sekolah/
│   │   │   ├── image1.jpg
│   │   │   └── ...
│   │   └── Fasilitas/
│   └── ...
│
├── PEMBAYARAN/
│   ├── Bukti_Transfer/
│   │   ├── PAY-2026-00001/
│   │   └── ...
│   └── Rekap_Bulanan/
│       └── 2026/
│
├── DOKUMEN_SEKOLAH/
│   ├── Akreditasi/
│   ├── Ijin_Operasional/
│   ├── Kurikulum/
│   └── ...
│
└── TEMPLATE/
    ├── Template_Rapor.pdf
    ├── Template_Surat.pdf
    └── ...
```

### 11.2 Aturan Folder

1. **Root folder** hanya diakses oleh super admin
2. **Subfolder per siswa/guru** — ID = entitas terkait
3. **File naming**: `{doc_type}_{original_name}_{timestamp}` untuk mencegah duplikat
4. **Backup folder** — dibuat duplikat ke folder khusus bulanan

### 11.3 Akses & Permissions

| Aktor | Akses |
|---|---|
| Super Admin | Semua folder |
| Admin/TU | Semua kecuali internal admin folder |
| Guru | Folder kelas & siswa yang diajar |
| Orang Tua | Hanya foto anak & dokumen publik (via signed URL) |
| Publik | Hanya folder galeri publik |

**PENTING:** File TIDAK boleh di-share langsung via link publik kecuali file publik (galeri, berita). File sensitif menggunakan **signed URL** (URL sementara dengan expiry).

### 11.4 File Upload Rules

- **Ukuran maks:** 5 MB untuk dokumen, 2 MB untuk foto
- **MIME type validation:**
  - Gambar: image/jpeg, image/png
  - Dokumen: application/pdf
- **Nama file:** sanitized (hapus karakter aneh, batasi panjang)
- **Duplicate check:** jika nama sama, tambahkan suffix `_1`, `_2`
- **Virus scan:** idealnya pakai API (ClamAV) tapi untuk MVP cukup validasi MIME
- **Storage path returned:** simpan Drive file ID di database, bukan URL langsung

### 11.5 Cara Frontend Mengambil File

**JANGAN** simpan URL publik Drive di database. Simpan **Drive file ID** saja. Saat frontend butuh file:

```
Frontend → Request ke Backend → Backend generate signed URL dari Drive → Return URL → Frontend tampilkan
```

URL signed memiliki expiry (misal 1 jam). Ini mencegah file sensitif di-share sembarangan.

### 11.6 Migrasi Storage

Saat migrasi ke Supabase Storage / S3:
- Drive file ID tetap di database sebagai reference historis
- File di-copy ke storage baru
- Field `storage_provider` ditambahkan: `gdrive` / `supabase` / `s3`
- API `getFileUrl()` transparan — cek provider, return URL sesuai provider

---

## PART 12 — Authentication & Authorization

### 12.1 Authentication Strategy

**JANGAN** bangun custom auth di Apps Script untuk production.

**Rekomendasi: Firebase Authentication (free tier)**

Alasan:
- Gratis 10k user/bulan (cukup untuk PAUD/TK)
- Support email/password, Google Sign-In
- JWT token built-in
- Password hashing & salting proper
- Email verification built-in
- 2FA bisa diaktifkan
- SDK ringan
- Tidak perlu maintenance

### 12.2 Flow Autentikasi

```
┌──────────────┐                      ┌──────────────┐
│  Frontend    │                      │  Firebase    │
│              │                      │   Auth       │
└──────────────┘                      └──────────────┘
       │                                      │
       │ 1. Login (email, password)           │
       │─────────────────────────────────────►│
       │                                      │
       │ 2. Return ID Token (JWT)             │
       │◄─────────────────────────────────────│
       │                                      │
       │ 3. Use ID Token                      │
       │    untuk request ke Backend          │
       │─────────────────────────────────┐    │
       │                                 ▼    │
       │                          ┌──────────────┐
       │                          │   Backend    │
       │                          │ (Apps Script │
       │                          │  / Node.js)  │
       │                          └──────────────┘
       │                                 │
       │ 4. Verify JWT di Backend        │
       │    (decode & validate)          │
       │◄────────────────────────────────│
       │                                 │
       │ 5. Return user data + role      │
       │◄────────────────────────────────│
```

### 12.3 Authorization (RBAC)

**Role-Based Access Control dengan Permission Granular**

```
ROLE (5 roles)
  ↓ (N to N)
PERMISSION (contoh: "student.read", "payment.verify")
```

Permissions dikodekan sebagai `{module}.{action}`:
- `auth.login`, `auth.logout`
- `student.create`, `student.read`, `student.update`, `student.delete`
- `ppdb.create`, `ppdb.read`, `ppdb.verify`, `ppdb.accept`, `ppdb.reject`
- `payment.create`, `payment.read`, `payment.verify`
- `development.create`, `development.read`
- `announcement.create`, dll.
- `user.create`, `role.manage`
- `system.settings`, `system.backup`, `system.audit`

### 12.4 Middleware Authorization (Backend)

```
function requireAuth() {
  const token = getTokenFromRequest();
  const decoded = verifyFirebaseToken(token);
  return decoded; // {uid, email, ...}
}

function requirePermission(user, permCode) {
  if (!userHasPermission(user.uid, permCode)) {
    throw new Error('Forbidden: ' + permCode);
  }
}
```

### 12.5 Data Isolation

**Kunci penting:** Orang tua HANYA boleh lihat data anak yang terhubung dengan akunnya.

Di setiap query backend:
```
function getMyChildren(parentUserId) {
  // 1. Get parent_id from user_id
  // 2. Query parent_student_relations
  // 3. Return hanya student_id yang valid untuk parent ini
  // JANGAN percaya parameter dari frontend
}
```

**Prinsip:** Backend tidak pernah percaya input dari frontend. Selalu cek ulang.

### 12.6 Session Management

- **Token Storage:** Frontend simpan di `sessionStorage` (bukan localStorage agar lebih aman)
- **Token Refresh:** Firebase Auth handle otomatis
- **Idle Timeout:** 30 menit logout otomatis
- **Absolute Timeout:** 8 jam (wajib login ulang)

### 12.7 Password Policy

- Minimal 8 karakter
- Kombinasi huruf besar, kecil, angka, simbol
- Tidak boleh mengandung email/name
- Expiry 90 hari (untuk admin)
- Password tidak boleh sama dengan 3 password sebelumnya

### 12.8 Failed Login Protection

- 5x gagal login → akun dikunci 30 menit
- Log percobaan login di activity_logs
- Captcha setelah 3x gagal (jika pakai web custom)

### 12.9 Logout

- Hapus token di frontend
- Panggil Firebase signOut
- Catat di activity_logs

---

## PART 13 — Security Architecture

### 13.1 Prinsip Keamanan

1. **Defense in Depth** — berlapis
2. **Least Privilege** — seminimal mungkin
3. **Fail Secure** — default deny
4. **Zero Trust** — verifikasi setiap request
5. **Audit Everything** — log semua aktivitas sensitif

### 13.2 Ancaman & Mitigasi

| Ancaman | Mitigasi |
|---|---|
| **Brute force login** | Rate limiting, lockout, captcha |
| **Password bocor** | Hashing (Firebase Auth), tidak disimpan plaintext |
| **XSS** | Sanitize HTML, Content Security Policy, escape output |
| **CSRF** | CSRF token, SameSite cookie, custom header |
| **SQL Injection** | Parameterized query (saat migrasi ke SQL) |
| **Session hijacking** | HTTPS only, secure cookie, short-lived token |
| **Privilege escalation** | RBAC check di backend setiap request |
| **Data leakage (IDOR)** | Filter data by ownership di backend |
| **File access tanpa izin** | Signed URL dengan expiry |
| **API abuse** | Rate limiting per IP/user |
| **Drive sharing bocor** | Jangan share langsung, hanya via signed URL |
| **Backup hilang** | Backup otomatis 2 lokasi (lokal + cloud) |
| **Backup di-encrypt?** | Untuk MVP opsional, untuk production WAJIB |

### 13.3 Security Headers

Frontend harus set:
```
Content-Security-Policy: default-src 'self'; ...
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), camera=()
Strict-Transport-Security: max-age=31536000
```

### 13.4 Validasi Input

**Dua lapis:**
1. **Frontend** — UX (disable button, format hint)
2. **Backend** — Wajib (jangan percaya frontend)

Validasi setiap input:
- Tipe data
- Panjang
- Format (regex)
- Range
- Required/optional
- Whitelist (dropdown value)

### 13.5 HTTPS Wajib

- Domain harus HTTPS
- Apps Script Web App sudah HTTPS
- Tolak HTTP

### 13.6 Data Encryption

- **In transit:** HTTPS
- **At rest (MVP):** Google sudah handle (Sheets, Drive)
- **At rest (production):** Encrypt kolom sensitif (NIK, no KK) di DB

### 13.7 Audit Log (WAJIB)

Setiap aksi CRUD + auth harus dicatat di `activity_logs`:
- who, what, when, where (IP)
- Old values & new values (untuk update)

Retention: minimal 1 tahun.

### 13.8 Backup & Recovery

- **Database:** Backup Sheets mingguan (export ke Excel/CSV)
- **Drive:** Backup file penting bulanan ke akun kedua
- **Retention:** Backup disimpan min. 3 bulan terakhir
- **Test restore:** Rutin (tiap quarter)

### 13.9 UU PDP (Perlindungan Data Pribadi)

Sistem ini memproses data pribadi anak → wajib patuh UU PDP No. 27/2022:
- ✅ Minta persetujuan orang tua saat pengumpulan data
- ✅ Tujuan pengumpulan data jelas
- ✅ Batasi akses sesuai kebutuhan
- ✅ Sediakan cara orang tua melihat & mengubah data anaknya
- ✅ Sediakan cara orang tua meminta hapus data
- ✅ Insiden data breach → lapor dalam 3x24 jam

---

## PART 14 — API Architecture

### 14.1 Prinsip API

- **RESTful** — resource-oriented
- **JSON only** — content-type application/json
- **Stateless** — server tidak simpan state sesi
- **Versioned** — `/api/v1/...`
- **Token-based** — Authorization: Bearer {token}
- **Standardized response** (lihat PART 7.4)

### 14.2 Struktur Endpoint

Base URL: `https://script.google.com/macros/s/{DEPLOY_ID}/api/v1`

(Untuk fase scaling: `https://api.yayasan.sch.id/v1`)

### 14.3 Daftar Endpoint

#### Authentication
| Method | Endpoint | Role | Keterangan |
|---|---|---|---|
| POST | `/auth/login` | public | Login, return token |
| POST | `/auth/logout` | all | Logout |
| POST | `/auth/refresh` | all | Refresh token |
| GET | `/auth/me` | all | Get current user info |
| POST | `/auth/forgot-password` | public | Kirim email reset |
| POST | `/auth/reset-password` | public | Reset password |

#### Users & Roles
| Method | Endpoint | Role |
|---|---|---|
| GET | `/users` | super_admin, admin_tu |
| POST | `/users` | super_admin |
| GET | `/users/:id` | super_admin, admin_tu (terbatas) |
| PUT | `/users/:id` | super_admin |
| DELETE | `/users/:id` | super_admin |
| POST | `/users/:id/activate` | super_admin |
| POST | `/users/:id/deactivate` | super_admin |
| GET | `/roles` | super_admin |
| POST | `/roles` | super_admin |
| GET | `/permissions` | super_admin |

#### Students
| Method | Endpoint | Role |
|---|---|---|
| GET | `/students` | super_admin, admin_tu, guru |
| POST | `/students` | admin_tu, super_admin |
| GET | `/students/:id` | super_admin, admin_tu, guru (kelasnya), orang_tua (anaknya saja) |
| PUT | `/students/:id` | admin_tu, super_admin |
| DELETE | `/students/:id` | super_admin |
| GET | `/students/:id/development` | guru, orang_tua |
| GET | `/students/:id/attendance` | guru, orang_tua |

#### Parents
| Method | Endpoint | Role |
|---|---|---|
| GET | `/parents` | super_admin, admin_tu |
| GET | `/parents/:id/children` | super_admin, admin_tu, orang_tua (anaknya saja) |
| POST | `/parents` | admin_tu, super_admin |
| PUT | `/parents/:id` | admin_tu, super_admin |

#### Teachers
| Method | Endpoint | Role |
|---|---|---|
| GET | `/teachers` | super_admin, admin_tu |
| POST | `/teachers` | super_admin |
| GET | `/teachers/:id/classes` | super_admin, admin_tu, guru (dirinya) |
| POST | `/teachers/:id/assign-class` | admin_tu |

#### Classes & Academic Years
| Method | Endpoint | Role |
|---|---|---|
| GET | `/classes` | super_admin, admin_tu, guru |
| POST | `/classes` | admin_tu |
| PUT | `/classes/:id` | admin_tu |
| GET | `/academic-years` | all |
| POST | `/academic-years` | super_admin |

#### PPDB
| Method | Endpoint | Role |
|---|---|---|
| GET | `/ppdb/periods` | all (publik untuk yg open) |
| POST | `/ppdb/periods` | admin_tu |
| GET | `/ppdb/registrations` | admin_tu, super_admin |
| POST | `/ppdb/registrations` | public (pendaftar) |
| GET | `/ppdb/registrations/:id` | pendaftar (punyanya), admin_tu |
| PUT | `/ppdb/registrations/:id` | pendaftar (jika status needs_revision), admin_tu |
| POST | `/ppdb/registrations/:id/submit` | pendaftar |
| POST | `/ppdb/registrations/:id/verify` | admin_tu |
| POST | `/ppdb/registrations/:id/request-revision` | admin_tu |
| POST | `/ppdb/registrations/:id/accept` | admin_tu |
| POST | `/ppdb/registrations/:id/reject` | admin_tu |
| POST | `/ppdb/registrations/:id/re-registration` | pendaftar |
| POST | `/ppdb/registrations/:id/convert-to-student` | admin_tu |
| GET | `/ppdb/registrations/:id/documents` | admin_tu, pendaftar |
| POST | `/ppdb/registrations/:id/documents` | pendaftar |

#### Attendance
| Method | Endpoint | Role |
|---|---|---|
| GET | `/attendance` | guru, admin_tu |
| POST | `/attendance` | guru |
| POST | `/attendance/bulk` | guru (input banyak sekaligus) |
| GET | `/attendance/student/:id` | guru, orang_tua |

#### Development (Penilaian)
| Method | Endpoint | Role |
|---|---|---|
| GET | `/development` | guru, admin_tu |
| POST | `/development` | guru |
| PUT | `/development/:id` | guru (yg membuat) |
| GET | `/development/student/:id` | guru, orang_tua |

#### Teacher Notes
| Method | Endpoint | Role |
|---|---|---|
| GET | `/notes` | guru, admin_tu |
| POST | `/notes` | guru |

#### Payments
| Method | Endpoint | Role |
|---|---|---|
| GET | `/invoices` | admin_tu, super_admin, orang_tua (anaknya) |
| POST | `/invoices` | admin_tu |
| GET | `/invoices/:id` | admin_tu, orang_tua |
| GET | `/payments` | admin_tu |
| POST | `/payments` | orang_tua (upload bukti), admin_tu |
| POST | `/payments/:id/verify` | admin_tu |
| POST | `/payments/:id/reject` | admin_tu |
| GET | `/payments/student/:id` | orang_tua, admin_tu |
| GET | `/payments/outstanding` | admin_tu |

#### Content (Berita, Pengumuman, Agenda, Galeri)
| Method | Endpoint | Role |
|---|---|---|
| GET | `/announcements` | all |
| POST | `/announcements` | admin_tu, super_admin |
| PUT | `/announcements/:id` | admin_tu |
| DELETE | `/announcements/:id` | admin_tu |
| (Sama untuk `/news`, `/events`, `/galleries`) |

#### Files
| Method | Endpoint | Role |
|---|---|---|
| POST | `/files/upload` | sesuai permission |
| GET | `/files/:id/url` | sesuai permission (returns signed URL) |
| DELETE | `/files/:id` | sesuai permission |

#### Activity Logs
| Method | Endpoint | Role |
|---|---|---|
| GET | `/logs` | super_admin |
| GET | `/logs/user/:id` | super_admin |

#### Notifications
| Method | Endpoint | Role |
|---|---|---|
| GET | `/notifications` | all |
| POST | `/notifications/:id/read` | all (owner) |
| POST | `/notifications/mark-all-read` | all |

### 14.4 Contoh Request & Response

**Request:**
```http
POST /api/v1/auth/login HTTP/1.1
Content-Type: application/json

{
  "email": "admin@yayasan.sch.id",
  "password": "********"
}
```

**Response Sukses:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "id": "USR-2026-00001",
      "email": "admin@yayasan.sch.id",
      "full_name": "Andi Wijaya",
      "role": "super_admin",
      "permissions": ["*"]
    }
  },
  "error": null,
  "meta": {
    "timestamp": "2026-09-12T10:00:00Z",
    "request_id": "req_abc123"
  }
}
```

**Response Error:**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email atau password salah",
    "details": {}
  },
  "meta": {
    "timestamp": "2026-09-12T10:00:00Z",
    "request_id": "req_abc124"
  }
}
```

### 14.5 Error Codes

| Code | HTTP | Keterangan |
|---|---|---|
| `UNAUTHORIZED` | 401 | Belum login |
| `FORBIDDEN` | 403 | Tidak punya akses |
| `NOT_FOUND` | 404 | Data tidak ditemukan |
| `VALIDATION_ERROR` | 400 | Input tidak valid |
| `DUPLICATE_ENTRY` | 409 | Data sudah ada |
| `RATE_LIMIT_EXCEEDED` | 429 | Terlalu banyak request |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Sedang maintenance |

---

## PART 15 — Data Flow

### 15.1 Data Flow Login

```
[User] → POST /auth/login
   ↓
[Frontend] Validasi format
   ↓
[Backend] Receive request
   ↓
[Auth Service] Verify password via Firebase Auth
   ↓
[Auth Service] Get user data from DB
   ↓
[Auth Service] Get role & permissions
   ↓
[Backend] Return token + user data
   ↓
[Frontend] Simpan token di sessionStorage
   ↓
[Frontend] Redirect sesuai role
```

### 15.2 Data Flow Pendaftaran PPDB

```
[Pendaftar] Isi form di website publik
   ↓
[Frontend] Validasi client-side
   ↓
[Frontend] Upload file (jika ada) → Backend
   ↓
[Backend] PPDBService.submitRegistration()
   ↓
[DB] Simpan ke ppdb_registrations (status: DRAFT)
   ↓
[Backend] Generate ID: REG-2026-00001
   ↓
[Backend] Return ID ke frontend
   ↓
[Frontend] Tampilkan halaman "Status: DRAFT, silakan lengkapi"
   ↓
[Pendaftar] Submit final
   ↓
[Backend] Update status: SUBMITTED
   ↓
[Backend] Kirim notifikasi ke admin (in-app + email)
   ↓
[Admin] Login → lihat notifikasi
   ↓
[Admin] Buka detail pendaftar → klik Verify
   ↓
[Backend] Update status: WAITING_VERIFICATION
   ↓
[Admin] Review dokumen → klik Accept / Reject / Request Revision
   ↓
[Backend] Update status accordingly
   ↓
[Backend] Kirim notifikasi ke pendaftar
   ↓
[Pendaftar] Lihat status di halaman cek status
```

### 15.3 Data Flow Verifikasi Pembayaran

```
[Orang Tua] Login → Dashboard → klik "Bayar SPP"
   ↓
[Frontend] Tampilkan invoice yang belum dibayar
   ↓
[Orang Tua] Pilih invoice → klik "Upload Bukti"
   ↓
[Frontend] Form upload (jumlah, tanggal, metode, file bukti)
   ↓
[Frontend] Upload file ke Backend
   ↓
[Backend] FileService.upload() → simpan ke Drive
   ↓
[Backend] PaymentService.create()
   ↓
[DB] Simpan ke payments (status: MENUNGGU_VERIFIKASI)
   ↓
[Backend] Kirim notifikasi ke admin
   ↓
[Admin] Login → notifikasi → buka detail pembayaran
   ↓
[Admin] Verifikasi → klik Verified / Rejected
   ↓
[Backend] Update payment status
   ↓
[Backend] Update invoice status (LUNAS jika lunas)
   ↓
[Backend] Kirim notifikasi ke orang tua
```

### 15.4 Data Flow Input Perkembangan Anak (Guru)

```
[Guru] Login → Dashboard → klik kelas → klik siswa
   ↓
[Guru] Buka form "Input Perkembangan"
   ↓
[Guru] Pilih aspek (agama, kognitif, dll) + narasi
   ↓
[Guru] Submit
   ↓
[Backend] DevelopmentService.create()
   ↓
[DB] Simpan ke student_development
   ↓
[Backend] Kirim notifikasi ke orang tua
   ↓
[Orang Tua] Lihat rapor online
```

### 15.5 Data Flow Backup

```
[Cron Trigger - setiap Minggu 02:00]
   ↓
[BackupService.run()]
   ↓
[Backend] Export semua sheets ke CSV (di Drive folder backup)
   ↓
[Backend] Copy semua file penting ke folder backup
   ↓
[Backend] Catat di activity_logs
   ↓
[Backend] Kirim notifikasi ke super admin (opsional)
```

---

## PART 16 — Complete Workflow

Format: **ACTOR → ACTION → SYSTEM PROCESS → DATABASE → RESULT**

### 16.1 Workflow Registrasi Akun (Orang Tua)

**ACTOR:** Orang Tua / Admin TU  
**ACTION:** Orang tua baru pertama kali → dibuatkan akun oleh admin saat anaknya diterima

```
1. ACTOR: Admin TU
2. ACTION: Klik "Buat Akun Orang Tua" dari data pendaftar yang diterima
3. SYSTEM: Generate temporary password
4. SYSTEM: Panggil Firebase Auth API → createUser
5. DATABASE: Insert ke users (role: orang_tua)
6. DATABASE: Insert ke parents
7. DATABASE: Insert ke parent_student_relations
8. SYSTEM: Kirim email welcome + kredensial
9. RESULT: Orang tua menerima email, bisa login
```

### 16.2 Workflow Login

```
1. ACTOR: User (semua role)
2. ACTION: Buka halaman login, input email & password
3. SYSTEM: Validasi format
4. SYSTEM: Firebase Auth signInWithEmailAndPassword
5. SYSTEM: Get user record dari DB
6. SYSTEM: Get role + permissions
7. SYSTEM: Generate custom token (jika perlu)
8. RESULT: User ter-redirect ke dashboard sesuai role
```

### 16.3 Workflow Logout

```
1. ACTOR: User
2. ACTION: Klik tombol Logout
3. SYSTEM: Hapus token dari sessionStorage
4. SYSTEM: Firebase signOut
5. DATABASE: Insert activity_log (logout)
6. RESULT: Redirect ke halaman login
```

### 16.4 Workflow PPDB (Lengkap)

Lihat PART 15.2 untuk flow umum. Detail per status:

| Status | Deskripsi | Transisi |
|---|---|---|
| `DRAFT` | Pendaftar baru mulai isi, belum submit | → SUBMITTED (saat submit) |
| `SUBMITTED` | Sudah submit, masuk antrian verifikasi | → WAITING_VERIFICATION (admin mulai cek) |
| `WAITING_VERIFICATION` | Sedang diverifikasi admin | → VERIFIED / NEEDS_REVISION / REJECTED |
| `VERIFIED` | Data valid, dokumen lengkap | → ACCEPTED / REJECTED |
| `NEEDS_REVISION` | Admin minta pendaftar perbaiki | → SUBMITTED (setelah diperbaiki) |
| `ACCEPTED` | Diterima, lanjut daftar ulang | → RE_REGISTRATION |
| `REJECTED` | Ditolak | (final) |
| `RE_REGISTRATION` | Sedang daftar ulang | → ACTIVE_STUDENT (setelah selesai) |
| `ACTIVE_STUDENT` | Sudah jadi siswa aktif, data sudah dikonversi | (final) |

### 16.5 Workflow Konversi Pendaftar → Siswa Aktif

```
1. ACTOR: Admin TU
2. ACTION: Buka pendaftar status ACCEPTED → klik "Daftar Ulang"
3. SYSTEM: Tampilkan form daftar ulang (konfirmasi data, bayar daftar ulang)
4. ACTOR: Admin TU input data daftar ulang (tanggal, bukti bayar)
5. SYSTEM: Update status ke RE_REGISTRATION
6. ACTOR: Orang tua bayar & upload bukti
7. SYSTEM: Admin verifikasi pembayaran → status: ACTIVE_STUDENT
8. SYSTEM: Otomatis:
   - Insert ke students (NIS auto-generated)
   - Insert ke enrollments (kelas + tahun ajaran)
   - Insert ke parents (jika belum ada)
   - Insert ke parent_student_relations
   - Buat akun user untuk orang tua
   - Kirim email kredensial ke orang tua
9. RESULT: Siswa aktif, orang tua punya akun login
```

### 16.6 Workflow Presensi (Guru)

```
1. ACTOR: Guru
2. ACTION: Login → buka kelas → klik "Presensi Hari Ini"
3. SYSTEM: Tampilkan daftar siswa di kelas tersebut (default HADIR)
4. ACTOR: Guru ubah status (HADIR/IZIN/SAKIT/ALPHA), tambah catatan jika perlu
5. ACTION: Submit
6. SYSTEM: AttendanceService.bulkCreate()
7. DATABASE: Insert ke attendance (1 row per siswa)
8. SYSTEM: Kirim notifikasi ke orang tua (jika ada yg alpha/izin)
9. RESULT: Presensi tersimpan, orang tua dapat notifikasi
```

### 16.7 Workflow Penilaian Perkembangan Anak

```
1. ACTOR: Guru
2. ACTION: Login → buka kelas → pilih siswa → "Input Perkembangan"
4. SYSTEM: Tampilkan form dengan 6 aspek perkembangan (PAUD/TK):
   - Nilai Agama & Budi Pekerti
   - Jasmani & Kesehatan
   - Kognitif
   - Bahasa
   - Sosial Emosional
   - Seni
   + Catatan narasi guru
5. ACTOR: Guru input checklist + narasi
6. ACTION: Submit
7. SYSTEM: DevelopmentService.create()
8. DATABASE: Insert ke student_development
9. SYSTEM: Kirim notifikasi ke orang tua
10. RESULT: Orang tua bisa lihat rapor online
```

### 16.8 Workflow Pembayaran SPP

```
1. ACTOR: Admin TU
2. ACTION: Awal bulan → klik "Generate Invoice SPP"
3. SYSTEM: InvoiceService.bulkCreate() untuk semua siswa aktif
4. DATABASE: Insert ke invoices (status: UNPAID)
5. SYSTEM: Kirim notifikasi ke semua orang tua (invoice ready)

6. ACTOR: Orang Tua
7. ACTION: Login → lihat tagihan → "Bayar"
8. ACTION: Transfer ke rekening sekolah → upload bukti
9. SYSTEM: PaymentService.create() dengan bukti
10. DATABASE: Insert ke payments (status: MENUNGGU_VERIFIKASI)
11. SYSTEM: Kirim notifikasi ke admin

12. ACTOR: Admin TU
13. ACTION: Verifikasi → klik "Verified"
14. SYSTEM: PaymentService.verify()
15. DATABASE: Update payment status ke VERIFIED
16. DATABASE: Update invoice status (PAID jika lunas)
17. SYSTEM: Kirim notifikasi ke orang tua (pembayaran diterima)
```

### 16.9 Workflow Upload Dokumen

```
1. ACTOR: User (sesuai permission)
2. ACTION: Pilih file dari device
3. FRONTEND: Validasi ukuran (max 5MB), tipe (image/pdf)
4. FRONTEND: Tampilkan preview
5. ACTION: Submit
6. SYSTEM: FileService.upload()
7. VALIDASI BACKEND: Ulang validasi (jangan percaya frontend)
8. DATABASE: Generate file ID, simpan metadata
9. STORAGE: Upload ke Drive (folder sesuai)
10. DATABASE: Update entity terkait (misal ppdb_documents.file_id)
11. RESULT: File ter-upload, ID tersimpan
```

### 16.10 Workflow Deaktivasi Akun

```
1. ACTOR: Super Admin
2. ACTION: Buka detail user → klik "Deactivate"
3. SYSTEM: Konfirmasi dialog
4. ACTION: Konfirmasi
5. SYSTEM: Update user status ke INACTIVE
6. DATABASE: Catat di activity_logs
7. SYSTEM: User yang login dengan akun ini akan ditolak saat login berikutnya
8. DATA: Tidak dihapus, hanya di-nonaktifkan
```

### 16.11 Workflow Penghapusan Data (Soft Delete)

```
1. ACTOR: Super Admin / Admin TU (sesuai permission)
2. ACTION: Buka detail data → klik "Hapus"
3. SYSTEM: Konfirmasi
4. ACTION: Konfirmasi
5. DATABASE: Update is_deleted = true (soft delete)
6. DATABASE: Catat di activity_logs (who, when, what)
7. RESULT: Data tidak muncul di list, tapi masih ada di DB (untuk audit)
```

---

## PART 17 — ERD Description

### 17.1 Entity-Relationship Diagram (Teks)

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│   USERS     │ N────1  │     ROLES        │         │ PERMISSIONS │
│             │         │                  │         │             │
│ id (PK)     │         │ id (PK)          │         │ id (PK)     │
│ email       │         │ code             │         │ code        │
│ password    │         │ name             │         │ module      │
│ role_id(FK) │         └──────────────────┘         │ action      │
│ status      │              │                      └─────────────┘
│ linked_*    │              │ 1                            │ 1
└─────────────┘              │                              │
       │                     │                              │
       │ 1                   N                              │
       │              ┌──────────────────┐                  N
       │              │ ROLE_PERMISSIONS │──────────────────┘
       │              │                  │
       │              │ role_id (FK)     │
       │              │ permission_id(FK)│
       │              └──────────────────┘
       │
       │ linked ke salah satu:
       ├───────────────┐
       │               │
       ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  STUDENTS   │  │   PARENTS   │  │  TEACHERS   │
│             │  │             │  │             │
│ id (PK)     │  │ id (PK)     │  │ id (PK)     │
│ nis         │  │ full_name   │  │ nip         │
│ full_name   │  │ user_id(FK) │  │ full_name   │
│ class_id(FK)│  └─────────────┘  │ user_id(FK) │
│ status      │         │         │ school_id(FK)│
└─────────────┘         │         └─────────────┘
       │                │                │
       │ N              │ 1              │ N
       │                │                │
       │         ┌──────┴──────┐         │
       │         │  PARENT_    │         │
       └────────►│  STUDENT    │◄────────┘
                 │  RELATIONS  │
                 │             │
                 │ parent_id   │
                 │ student_id  │
                 │ relation    │
                 └─────────────┘
       │
       │ N
       ▼
┌─────────────┐         ┌──────────────┐
│ENROLLMENTS  │ N────1  │   CLASSES    │
│             │         │              │
│ student_id  │         │ id (PK)      │
│ class_id(FK)│         │ school_id(FK)│
│ academic_yr │         │ academic_yr  │
└─────────────┘         │ homeroom_id  │
                        └──────────────┘
                              │ N
                              │ 1
                              ▼
                        ┌──────────────┐
                        │  SCHOOLS     │
                        └──────────────┘
                              │ N
                              │ 1
                              ▼
                        ┌──────────────┐
                        │ACADEMIC_YEARS│
                        └──────────────┘

┌──────────────────┐         ┌────────────────────┐
│  TEACHER_CLASS_  │ N────N  │    CLASSES        │
│  ASSIGNMENTS     │         │  (sudah di atas)  │
└──────────────────┘         └────────────────────┘

┌─────────────┐         ┌──────────────────┐
│ ATTENDANCE  │ N────1  │    STUDENTS      │
│             │         └──────────────────┘
│ student_id  │
│ date        │         ┌──────────────────┐
│ status      │ N────1  │    TEACHERS      │
└─────────────┘         │  (recorded_by)   │
                        └──────────────────┘

┌──────────────────────┐
│ STUDENT_DEVELOPMENT  │ N────1  STUDENTS, CLASSES, TEACHERS
│                      │
│ 6 aspek perkembangan │
│ + catatan narasi     │
└──────────────────────┘

┌─────────────────┐
│ TEACHER_NOTES   │ N────1  STUDENTS, TEACHERS
└─────────────────┘

┌─────────────────┐
│ PPDB_PERIODS    │ N────1  ACADEMIC_YEARS, SCHOOLS
└─────────────────┘

┌─────────────────┐         ┌──────────────────┐
│PPDB_REGISTRATIONS│ N────1 │  PPDB_PERIODS    │
│                  │        └──────────────────┘
│ status (enum)    │         ┌──────────────────┐
│ converted_to_    │ 1────N  │  PPDB_DOCUMENTS  │
│ student_id (FK)  │        │  registration_id │
└─────────────────┘         │  file_id (Drive) │
                            └──────────────────┘

┌─────────────┐         ┌──────────────┐
│  INVOICES   │ N────1  │   STUDENTS   │
│             │         └──────────────┘
│ student_id  │
│ amount      │         ┌──────────────┐
│ status      │ 1────N  │   PAYMENTS   │
└─────────────┘         │              │
                        │ invoice_id   │
                        │ parent_id    │
                        │ status       │
                        │ proof_file_id│
                        └──────────────┘

┌──────────────┐         ┌──────────────┐
│ANNOUNCEMENTS │         │    NEWS      │
│ target_aud   │         │  public      │
└──────────────┘         └──────────────┘

┌──────────────┐
│   EVENTS     │
└──────────────┘

┌──────────────┐         ┌──────────────┐
│  GALLERIES   │         │  FILE_DRIVE  │
└──────────────┘         │  id (PK)     │
                         │  provider    │
┌──────────────┐         │  file_path   │
│ ACTIVITY_LOGS│         └──────────────┘
└──────────────┘
        │ N
        │ 1
        ▼
┌──────────────┐
│    USERS     │
└──────────────┘

┌──────────────┐
│ NOTIFICATIONS│ N────1  USERS (penerima)
└──────────────┘

┌──────────────┐
│SYSTEM_SETTINGS│ (key-value)
└──────────────┘
```

### 17.2 Tabel Ringkasan

| Tabel | Fungsi | Relasi Utama |
|---|---|---|
| users | Akun login semua user | N→1 roles, linked ke entity |
| roles | 5 role utama + custom | N↔N permissions |
| permissions | Permission granular | |
| role_permissions | Junction | |
| schools | Sekolah di bawah yayasan | |
| academic_years | Tahun ajaran | 1→N classes, enrollments |
| classes | Kelas per sekolah per tahun | N→1 school, AY |
| students | Data siswa | N→1 class, N↔N parents |
| parents | Data orang tua | N↔N students |
| parent_student_relations | Junction ortu-anak | |
| teachers | Data guru | N→1 school, N↔N classes |
| teacher_class_assignments | Guru mengajar kelas | |
| enrollments | Siswa di kelas per tahun ajaran | N→1 student, class, AY |
| ppdb_periods | Periode PPDB | N→1 school, AY |
| ppdb_registrations | Data pendaftar | N→1 period, 1→N docs, 1→1 student (setelah konversi) |
| ppdb_documents | Dokumen pendaftar | N→1 registration |
| student_documents | Dokumen siswa aktif | N→1 student |
| attendance | Presensi harian | N→1 student, class, teacher |
| student_development | Penilaian perkembangan | N→1 student, class, AY, teacher |
| teacher_notes | Catatan guru | N→1 student, teacher |
| invoices | Tagihan SPP | N→1 student, AY |
| payments | Pembayaran | N→1 invoice, student, parent |
| announcements | Pengumuman internal | |
| news | Berita publik | |
| events | Agenda/kegiatan | |
| galleries | Galeri foto | |
| activity_logs | Audit trail | N→1 user |
| notifications | Notifikasi user | N→1 user |
| system_settings | Konfigurasi | |

### 17.3 Cardinality Ringkas

- users N→1 roles
- students N→1 classes (per tahun ajaran via enrollments)
- students N↔N parents (via parent_student_relations)
- teachers N↔N classes (via teacher_class_assignments)
- ppdb_registrations 1→1 students (setelah konversi)
- invoices 1→N payments
- activity_logs N→1 users

---

## PART 18 — User Role Matrix

| Fitur | Super Admin | Admin TU | Guru | Orang Tua | Pendaftar |
|---|---|---|---|---|---|
| **Auth** | | | | | |
| Login sendiri | CRUD | ✅ | ✅ | ✅ | ✅ |
| Manage user | CRUD | R | - | - | - |
| Manage role | CRUD | - | - | - | - |
| **Master Data** | | | | | |
| Yayasan | CRUD | R | - | - | - |
| Sekolah | CRUD | CRUD | R | R | R |
| Tahun Ajaran | CRUD | CRUD | R | R | - |
| Kelas | CRUD | CRUD | R(walas) | R(anak) | - |
| **People** | | | | | |
| Siswa | R(all) | CRUD | R(kelas) | R(anak) | - |
| Orang Tua | R | CRUD | R(kelas) | R(diri) | - |
| Guru | CRUD | CRUD | R(diri) | R(nama+foto) | - |
| **PPDB** | | | | | |
| Buka periode | - | CUD | - | - | - |
| Submit pendaftaran | - | - | - | - | C |
| Lihat status sendiri | - | - | - | - | R |
| Verifikasi | - | A/Reject | - | - | - |
| Accept/Reject | - | A/Reject | - | - | - |
| Minta revisi | - | ✅ | - | - | Edit sendiri |
| Konversi ke siswa | - | C | - | - | - |
| **Akademik** | | | | | |
| Presensi | R(all) | R | CUD(kelas) | R(anak) | - |
| Perkembangan anak | R | R | CUD(kelas) | R(anak) | - |
| Catatan guru | R | R | C | R(anak, jika visibility=parent) | - |
| **Keuangan** | | | | | |
| Generate invoice | - | C | - | - | - |
| Lihat invoice | R(all) | CRUD | - | R(anak) | - |
| Upload bukti bayar | - | - | - | C | - |
| Verifikasi bayar | - | V/Approve | - | - | - |
| Rekap | R | R+Export | - | R(anak) | - |
| **Konten** | | | | | |
| Berita | CRUD | CRUD | - | R | R(publik) |
| Pengumuman | CRUD | CRUD | R | R | - |
| Agenda | CRUD | CRUD | R | R | R(publik) |
| Galeri | CRUD | CRUD | - | R | R(publik) |
| **Laporan** | | | | | |
| Cetak laporan | ✅ | ✅ | - | - | - |
| Export Excel | ✅ | ✅ | - | - | - |
| **Sistem** | | | | | |
| Audit log | R | - | - | - | - |
| Backup/Restore | ✅ | - | - | - | - |
| Settings | CRUD | R(bagiannya) | - | - | - |
| Monitoring | ✅ | - | - | - | - |

**Legenda:**
- C = Create (buat baru)
- R = Read (lihat)
- U = Update (ubah)
- D = Delete (hapus)
- A = Approve
- V = Verify
- - = No Access

---

## PART 19 — PRD (Product Requirements Document)

### 19.1 Product Overview

**Nama Produk:** SIYAYASAN (Sistem Informasi Yayasan)  
**Tipe:** Website + Sistem Informasi Akademik Terintegrasi  
**Target:** Yayasan Pendidikan PAUD/TK skala kecil-menengah

### 19.2 Background

Yayasan Pendidikan saat ini mengelola PAUD dan TK dengan proses manual:
- Pendaftaran datang ke sekolah
- Data siswa di Excel/ buku tulis
- Pembayaran SPP manual
- Perkembangan anak di buku rapor
- Tidak ada portal orang tua

### 19.3 Problem Statement

1. Proses PPDB lambat & kurang transparan
2. Data tersebar, rentan hilang
3. Orang tua tidak punya akses informasi real-time
4. Rekap pembayaran & perkembangan manual, rentan kesalahan
5. Tidak ada backup data terpusat

### 19.4 Objectives

1. Digitalisasi PPDB online 24/7
2. Sentralisasi data yayasan (Single Source of Truth)
3. Portal orang tua untuk akses informasi anak
4. Otomatisasi rekap pembayaran & presensi
5. Meningkatkan profesionalisme yayasan

### 19.5 Target Users

- Orang tua PAUD/TK (mayoritas)
- Guru PAUD/TK
- Staf administrasi TU
- Ketua Yayasan / Super Admin
- Calon orang tua (PPDB)

### 19.6 User Roles

(Sudah dijabarkan di PART 4)

### 19.7 User Personas

(Sudah dijabarkan di PART 4.2)

### 19.8 Scope (In-Scope)

✅ Public website (profil, berita, PPDB online)  
✅ 5 portal user dengan RBAC  
✅ PPDB online lengkap dengan workflow  
✅ Presensi & penilaian perkembangan anak  
✅ Pembayaran SPP (pencatatan manual)  
✅ Notifikasi in-app & email  
✅ Cetak laporan (PDF, Excel)  
✅ Audit log & backup data  
✅ Mobile-responsive  
✅ Keamanan sesuai UU PDP

### 19.9 Out of Scope (MVP)

❌ Payment gateway otomatis  
❌ Mobile app native  
❌ E-learning / video conference  
❌ Integrasi Dapodik  
❌ Multi-bahasa  
❌ Multi-cabang real-time  
❌ Custom domain email

### 19.10 Functional Requirements (Ringkas)

| ID | Prioritas | Deskripsi |
|---|---|---|
| FR-AUTH-001 | P0 | Login dengan email & password |
| FR-AUTH-002 | P0 | Logout |
| FR-AUTH-003 | P1 | Reset password via email |
| FR-AUTH-004 | P2 | 2FA untuk admin |
| FR-USER-001 | P0 | CRUD user oleh super admin |
| FR-USER-002 | P0 | Lihat profil sendiri |
| FR-USER-003 | P1 | Update profil sendiri |
| FR-PPDB-001 | P0 | Buka/tutup periode PPDB |
| FR-PPDB-002 | P0 | Submit pendaftaran online |
| FR-PPDB-003 | P0 | Upload dokumen pendaftaran |
| FR-PPDB-004 | P0 | Cek status pendaftaran |
| FR-PPDB-005 | P0 | Verifikasi pendaftaran oleh admin |
| FR-PPDB-006 | P0 | Accept/Reject oleh admin |
| FR-PPDB-007 | P0 | Minta revisi oleh admin |
| FR-PPDB-008 | P0 | Perbaikan data oleh pendaftar |
| FR-PPDB-009 | P0 | Konversi ke siswa aktif |
| FR-PPDB-010 | P0 | Buat akun orang tua otomatis |
| FR-STUDENT-001 | P0 | CRUD data siswa oleh admin |
| FR-STUDENT-002 | P0 | Lihat data siswa (sesuai role) |
| FR-PARENT-001 | P0 | CRUD data orang tua oleh admin |
| FR-PARENT-002 | P0 | Orang tua lihat data anak |
| FR-TEACHER-001 | P0 | CRUD data guru oleh admin |
| FR-ATTEND-001 | P0 | Input presensi harian oleh guru |
| FR-ATTEND-002 | P0 | Orang tua lihat presensi anak |
| FR-DEV-001 | P0 | Input perkembangan anak oleh guru |
| FR-DEV-002 | P0 | Orang tua lihat rapor online |
| FR-PAY-001 | P0 | Generate invoice oleh admin |
| FR-PAY-002 | P0 | Orang tua upload bukti bayar |
| FR-PAY-003 | P0 | Verifikasi pembayaran oleh admin |
| FR-PAY-004 | P0 | Lihat riwayat pembayaran |
| FR-PAY-005 | P1 | Rekap tunggakan |
| FR-CONTENT-001 | P0 | CRUD berita oleh admin |
| FR-CONTENT-002 | P0 | CRUD pengumuman oleh admin |
| FR-CONTENT-003 | P1 | CRUD agenda oleh admin |
| FR-CONTENT-004 | P1 | CRUD galeri oleh admin |
| FR-NOTIF-001 | P0 | Notifikasi in-app |
| FR-NOTIF-002 | P1 | Notifikasi email |
| FR-NOTIF-003 | P2 | Notifikasi WhatsApp |
| FR-REPORT-001 | P1 | Cetak laporan PDF |
| FR-REPORT-002 | P1 | Export Excel |
| FR-SEC-001 | P0 | RBAC enforcement |
| FR-SEC-002 | P0 | Audit log |
| FR-SEC-003 | P0 | HTTPS only |
| FR-SEC-004 | P0 | Data validation |
| FR-SEC-005 | P1 | Rate limiting |
| FR-BACKUP-001 | P1 | Backup mingguan otomatis |
| FR-BACKUP-002 | P2 | Restore dari backup |

### 19.11 Non-Functional Requirements

| ID | Kategori | Requirement |
|---|---|---|
| NFR-PERF-001 | Performa | Halaman load < 3 detik (3G) |
| NFR-PERF-002 | Performa | API response < 2 detik |
| NFR-PERF-003 | Performa | Support 100 concurrent users |
| NFR-AVAIL-001 | Availability | 99% uptime |
| NFR-SCAL-001 | Scalability | Handle 100 → 1.000 siswa tanpa migrasi besar |
| NFR-SEC-001 | Security | HTTPS only |
| NFR-SEC-002 | Security | Password di-hash (bukan plaintext) |
| NFR-SEC-003 | Security | RBAC enforcement di backend |
| NFR-SEC-004 | Security | Audit log semua aktivitas |
| NFR-SEC-005 | Security | Data pribadi anak terisolasi per ortu |
| NFR-COMPAT-001 | Compatibility | Chrome, Safari, Firefox, Edge (latest) |
| NFR-COMPAT-002 | Compatibility | Mobile: iOS 14+, Android 10+ |
| NFR-COMPAT-003 | Compatibility | Responsive: 320px → 1920px |
| NFR-MAINT-001 | Maintainability | Kode modular, dokumentasi ada |
| NFR-MAINT-002 | Maintainability | Migrasi ke stack modern tanpa rewrite total |
| NFR-USAB-001 | Usability | Orang tua bisa pakai tanpa training |
| NFR-USAB-002 | Usability | Guru bisa input presensi via HP < 30 detik |
| NFR-COST-001 | Cost | MVP: Rp 0/bulan + opsional domain |

### 19.12 Feature Priorities

(Sudah dijabarkan di PART 6 dengan tag P0/P1/P2/P3)

### 19.13 User Stories (Contoh P0)

**Sebagai orang tua, saya ingin:**
- Melihat data anak saya (nama, kelas, foto)
- Melihat perkembangan anak setiap semester
- Melihat tagihan SPP dan status pembayaran
- Mendapat notifikasi pengumuman penting
- Mengajukan perubahan data diri jika ada kesalahan

**Sebagai guru, saya ingin:**
- Login dengan akun saya
- Melihat daftar siswa di kelas yang saya ajar
- Input presensi harian dengan cepat via HP
- Input catatan perkembangan anak
- Melihat pengumuman dari sekolah

**Sebagai admin TU, saya ingin:**
- Verifikasi pendaftar PPDB
- Mengelola data siswa, guru, orang tua
- Generate invoice SPP bulanan
- Verifikasi bukti pembayaran
- Mencetak laporan

**Sebagai super admin, saya ingin:**
- Memantau keseluruhan aktivitas sistem via dashboard
- Mengelola user & hak akses
- Melihat audit log
- Backup & restore data

**Sebagai calon orang tua, saya ingin:**
- Mendaftar online tanpa ke sekolah
- Upload dokumen persyaratan
- Cek status pendaftaran

### 19.14 Acceptance Criteria (Contoh)

**AC untuk FR-PPDB-002 (Submit Pendaftaran):**
- ✅ Form bisa diakses publik tanpa login
- ✅ Validasi: semua field required harus diisi
- ✅ Upload max 5 file, masing-masing max 5MB, format PDF/JPG/PNG
- ✅ Setelah submit, sistem generate ID REG-YYYY-NNNNN
- ✅ Halaman "status" menampilkan ID pendaftaran
- ✅ Email konfirmasi dikirim ke pendaftar
- ✅ Data masuk ke sheet `ppdb_registrations` dengan status SUBMITTED
- ✅ Activity log tercatat

### 19.15 Business Rules

1. Satu siswa bisa punya banyak orang tua (ayah, ibu, wali)
2. Satu orang tua bisa punya banyak anak (saudara kandung)
3. Siswa hanya boleh aktif di satu kelas per tahun ajaran
4. PPDB hanya bisa dibuka di periode yang di-set admin
5. Invoice SPP hanya untuk siswa aktif di tahun ajaran aktif
6. Penilaian perkembangan hanya sekali per periode (semester)
7. Guru hanya bisa input data untuk kelas yang diajar
8. Orang tua hanya bisa lihat data anak yang terhubung
9. File yang di-upload max 5MB (dokumen), 2MB (foto)
10. Akun yang tidak login 90 hari → flagged inactive

### 19.16 Security Requirements

(Sudah dijabarkan di PART 13)

### 19.17 Data Requirements

(Sudah dijabarkan di PART 9-10)

### 19.18 Integration Requirements

| ID | Sistem | Keterangan |
|---|---|---|
| INT-001 | Firebase Auth | Autentikasi |
| INT-002 | Google Sheets | Database MVP |
| INT-003 | Google Drive | File storage MVP |
| INT-004 | Email Service | Notifikasi (Resend/SendGrid) |
| INT-005 | WhatsApp Gateway | Notifikasi (Fonnte, resmi) |

### 19.19 Reporting Requirements

(Lihat PART 23)

### 19.20 Future Development

- Payment gateway otomatis (Midtrans/Xendit)
- Mobile app native (Flutter)
- Integrasi Dapodik
- E-learning
- Multi-cabang real-time
- Custom email domain
- AI chatbot untuk FAQ
- Analitik prediktif (prediksi dropout, dsb)

---

## PART 20 — SRD (Software Requirements Document)

### 20.1 System Overview

SIYAYASAN adalah sistem informasi berbasis web yang terdiri dari public website dan 5 portal private dengan RBAC. Berbasis arsitektur client-server dengan backend API dan database relasional (Sheets → Postgres).

### 20.2 System Architecture

(Lihat PART 7)

### 20.3 Functional Requirements

(Sudah dijabarkan di PART 19.10 dengan ID FR-*)

### 20.4 Non-Functional Requirements

(Sudah dijabarkan di PART 19.11 dengan ID NFR-*)

### 20.5 User Roles

(Sudah dijabarkan di PART 4)

### 20.6 Authentication

(Sudah dijabarkan di PART 12)

### 20.7 Authorization

(Sudah dijabarkan di PART 12)

### 20.8 Database Requirements

- **Struktur:** Relasional dengan primary key & foreign key
- **ID Format:** PREFIX-YYYY-NNNNN
- **Soft Delete:** Wajib untuk semua tabel
- **Audit Fields:** created_at, created_by, updated_at, updated_by
- **Migration-Ready:** Struktur kompatibel dengan SQL

### 20.9 API Requirements

- RESTful JSON API
- Token-based authentication (JWT)
- Standardized response format
- API versioning (/api/v1)
- HTTPS only
- Rate limiting: 60 req/menit per user

### 20.10 File Management

- **Storage:** Google Drive MVP, Supabase Storage scaling
- **Access:** Signed URL dengan expiry
- **Validation:** MIME type, ukuran, nama file
- **Organization:** Folder per entitas (lihat PART 11)

### 20.11 Security Requirements

(Sudah dijabarkan di PART 13)

### 20.12 Logging

- **Activity Log:** WAJIB untuk semua aksi CRUD + auth
- **Error Log:** Server-side, dengan stack trace
- **Retention:** Minimal 1 tahun
- **Format:** timestamp, user_id, action, module, entity, details

### 20.13 Backup

- **Database:** Backup mingguan ke Drive folder khusus
- **Files:** Backup bulanan
- **Retention:** 3 bulan terakhir
- **Test Restore:** Tiap quarter

### 20.14 Error Handling

- **Standard Response:** Format JSON konsisten (PART 14.4)
- **Error Codes:** Daftar kode (PART 14.5)
- **User-friendly messages:** Hindari tampilkan technical error ke user
- **Logging:** Semua error dicatat di activity_logs atau error_logs

### 20.15 Performance

- Frontend load < 3 detik (3G)
- API response < 2 detik (p95)
- Database query < 1 detik
- Lighthouse score > 80

### 20.16 Availability

- Target uptime 99% (MVP)
- Maintenance window: Minggu 02:00–04:00
- Status page (opsional fase lanjut)

### 20.17 Scalability

- Vertikal: tambah user tanpa redesign
- Horizontal: pindah ke backend proper saat > 100 siswa aktif
- Database: migrasi terstruktur ke Postgres

### 20.18 Browser Compatibility

- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Android)

### 20.19 Mobile Compatibility

- Responsive: 320px – 1920px
- Touch-friendly: minimal tap target 44x44px
- No horizontal scroll
- Form usable di mobile

### 20.20 Deployment

- **Environment:** dev, staging, production
- **CI/CD (fase scaling):** GitHub Actions
- **Domain:** custom domain dengan HTTPS
- **CDN:** Cloudflare (cache static assets)

### 20.21 Maintenance

- **Code documentation:** Setiap service module didokumentasikan
- **DB documentation:** Data dictionary (lihat PART 10)
- **API documentation:** OpenAPI/Swagger (fase scaling)
- **Change log:** Setiap perubahan dicatat
- **Bug tracking:** GitHub Issues atau Trello

### 20.22 Migration Strategy

(Lihat PART 30)

---

## PART 21 — UI/UX Structure

### 21.1 Prinsip Desain

1. **Clean & Minimalis** — tidak ramai
2. **Ramah Anak** — warna cerah tapi profesional
3. **Mobile-First** — mayoritas orang tua akses via HP
4. **Accessible** — kontras cukup, font readable, alt text
5. **Konsisten** — design system (warna, tipografi, spacing)

### 21.2 Design System (Usulan)

**Warna:**
- Primary: Biru (#1E40AF) — profesional, terpercaya
- Secondary: Kuning Cerah (#FBBF24) — ceria, anak-anak
- Success: Hijau (#10B981)
- Danger: Merah (#EF4444)
- Warning: Orange (#F59E0B)
- Neutral: Gray (#6B7280, #F3F4F6)

**Tipografi:**
- Heading: Poppins / Inter
- Body: Inter / system font

**Spacing:** 8px grid (4, 8, 16, 24, 32, 48, 64)

**Border Radius:** 8px (kartu), 6px (button)

### 21.3 Layout Public Website

```
┌────────────────────────────────────────────┐
│  HEADER (Logo, Menu, PPDB Button)          │
├────────────────────────────────────────────┤
│                                            │
│  HERO (Image carousel + tagline)           │
│                                            │
├────────────────────────────────────────────┤
│  STATISTIK (Total Siswa, Guru, Alumni)     │
├────────────────────────────────────────────┤
│  PROGRAM UNGGULAN (3 cards)                │
├────────────────────────────────────────────┤
│  BERITA TERBARU (3 latest)                 │
├────────────────────────────────────────────┤
│  PPDB BANNER (Call to action)              │
├────────────────────────────────────────────┤
│  TESTIMONI / GALERI                        │
├────────────────────────────────────────────┤
│  FOOTER (Alamat, Kontak, Sosmed)           │
└────────────────────────────────────────────┘
```

### 21.4 Layout Dashboard (Contoh: Orang Tua)

```
┌────────────────────────────────────────────┐
│  TOP BAR (Logo, Notifikasi, User menu)     │
├──────────┬─────────────────────────────────┤
│          │  BREADCRUMB                     │
│  SIDE    ├─────────────────────────────────┤
│  NAV     │  SELAMAT DATANG, IBU SITI       │
│          │                                 │
│ • Home   │  ┌──────┐ ┌──────┐ ┌──────┐    │
│ • Anak   │  │Foto  │ │Kelas │ │ SPP  │    │
│ • Raport │  │Anak  │ │TK-A  │ │Status│    │
│ • SPP    │  └──────┘ └──────┘ └──────┘    │
│ • Pengum │                                 │
│ • Akun   │  PERKEMBANGAN TERBARU           │
│          │  ┌─────────────────────────┐   │
│          │  │ Semester 1 2026/2027    │   │
│          │  │ [Lihat Rapor]           │   │
│          │  └─────────────────────────┘   │
│          │                                 │
│          │  PENGUMUMAN                     │
│          │  ┌─────────────────────────┐   │
│          │  │ Libur Hari Raya         │   │
│          │  │ 10 Sep 2026             │   │
│          │  └─────────────────────────┘   │
└──────────┴─────────────────────────────────┘
```

### 21.5 Komponen UI Penting

- **Data Table:** dengan search, filter, pagination, sortir
- **Form:** dengan validasi inline
- **Modal:** untuk konfirmasi & detail
- **Toast/Alert:** untuk notifikasi sukses/gagal
- **Calendar:** untuk agenda
- **File Upload:** dengan drag-drop + preview
- **Status Badge:** warna sesuai status
- **Empty State:** ilustrasi + CTA

### 21.6 Icon Library

Gunakan **Lucide Icons** atau **Heroicons** (open source, ringan).

### 21.7 Aksesibilitas

- Color contrast minimal AA (4.5:1)
- Focus visible untuk keyboard navigation
- Alt text untuk gambar
- ARIA labels
- Form labels yang jelas
- Error message yang jelas

---

## PART 22 — Dashboard Structure

### 22.1 Dashboard Super Admin

**Komponen:**
- **KPI Cards:**
  - Total Siswa Aktif
  - Total Guru
  - Total Kelas
  - Pendaftar PPDB (bulan ini)
  - Pembayaran Bulan Ini (total nominal)
  - Tunggakan
- **Charts:**
  - Grafik pendaftar PPDB per bulan
  - Grafik pembayaran bulanan
  - Distribusi siswa per kelas
- **Tables:**
  - Aktivitas terbaru (audit log)
  - User login terakhir
- **Quick Actions:**
  - Buka periode PPDB
  - Backup data
  - Tambah user

### 22.2 Dashboard Admin TU

**Komponen:**
- **KPI Cards:**
  - PPDB Menunggu Verifikasi
  - Pembayaran Menunggu Verifikasi
  - Total Siswa Aktif
  - Tunggakan Aktif
- **Tables:**
  - Daftar pendaftar terbaru (perlu aksi)
  - Daftar pembayaran perlu verifikasi
- **Charts:**
  - Rekap pembayaran bulanan
  - Status PPDB
- **Quick Actions:**
  - Tambah siswa
  - Generate invoice SPP
  - Buat pengumuman

### 22.3 Dashboard Guru

**Komponen:**
- **KPI Cards:**
  - Jumlah Kelas yang Diajar
  - Total Siswa Diajar
  - Presensi Hari Ini
  - Catatan Pending
- **Tables:**
  - Daftar siswa per kelas (dengan quick action: input presensi, input perkembangan)
  - Jadwal mengajar (opsional untuk PAUD/TK)
- **Quick Actions:**
  - Input presensi hari ini
  - Input perkembangan anak
  - Kirim catatan

### 22.4 Dashboard Orang Tua

**Komponen:**
- **Kartu Anak (bisa multiple jika punya > 1 anak):**
  - Foto, Nama, Kelas, Tahun Ajaran
- **KPI per anak:**
  - Kehadiran bulan ini (%)
  - Status SPP (Lunas/Tunggakan)
  - Rapor terakhir (periode)
- **Lists:**
  - Pengumuman terbaru
  - Tagihan belum dibayar
- **Notifications:**
  - In-app notifications

### 22.5 Dashboard Pendaftar (Simpel)

- Status pendaftaran
- Daftar tindakan yang perlu dilakukan
- Cetak bukti pendaftaran

---

## PART 23 — Reporting System

### 23.1 Daftar Laporan

| ID | Nama Laporan | Tipe | Pembuat | Role |
|---|---|---|---|---|
| RPT-001 | Daftar Siswa Aktif | Tabel | Sistem | super_admin, admin_tu |
| RPT-002 | Daftar Siswa per Kelas | Tabel | Sistem | super_admin, admin_tu, guru |
| RPT-003 | Daftar Guru | Tabel | Sistem | super_admin, admin_tu |
| RPT-004 | Daftar Orang Tua | Tabel | Sistem | super_admin, admin_tu |
| RPT-005 | Rekap PPDB | Tabel | Sistem | super_admin, admin_tu |
| RPT-006 | Rekap Siswa Diterima | Tabel | Sistem | super_admin, admin_tu |
| RPT-007 | Rekap Siswa per Tahun Ajaran | Tabel | Sistem | super_admin |
| RPT-008 | Rekap Pembayaran per Bulan | Tabel | Sistem | super_admin, admin_tu |
| RPT-009 | Rekap Pembayaran per Siswa | Tabel | Sistem | super_admin, admin_tu, orang_tua |
| RPT-010 | Rekap Tunggakan | Tabel | Sistem | super_admin, admin_tu |
| RPT-011 | Rekap Presensi per Kelas | Tabel | Sistem | guru, admin_tu |
| RPT-012 | Rekap Presensi per Siswa | Tabel | Sistem | guru, orang_tua |
| RPT-013 | Rapor Individual | PDF | Sistem | guru, orang_tua |
| RPT-014 | Rekap Perkembangan per Kelas | Tabel | Sistem | guru, admin_tu |
| RPT-015 | Daftar User Aktif | Tabel | Sistem | super_admin |
| RPT-016 | Audit Log | Tabel | Sistem | super_admin |
| RPT-017 | Statistik Yayasan | Dashboard | Sistem | super_admin |
| RPT-018 | Rekap Dokumen PPDB | Tabel | Sistem | admin_tu |
| RPT-019 | Rekap Pengumuman | Tabel | Sistem | admin_tu |
| RPT-020 | Rekap Berita | Tabel | Sistem | admin_tu |

### 23.2 Format Export

| Format | Use Case | Tools |
|---|---|---|
| **PDF** | Cetak resmi, rapor | jsPDF (frontend), atau Apps Script DocService |
| **Excel** | Analisis lebih lanjut | SheetApp.makeCopy() atau SheetJS |
| **CSV** | Import ke sistem lain | Apps Script utilities |

### 23.3 Cetak Rapor Individual

Template rapor PAUD/TK (umum):
- Halaman 1: Identitas siswa
- Halaman 2: Perkembangan per aspek (6 aspek)
- Halaman 3: Catatan guru & saran
- Halaman 4: Kehadiran

Cetak via PDF generator (frontend atau Apps Script).

---

## PART 24 — Notification System

### 24.1 Jenis Notifikasi

| Trigger | Penerima | Channel | Prioritas |
|---|---|---|---|
| Pendaftaran berhasil | Pendaftar | Email + In-app | High |
| Pendaftaran perlu revisi | Pendaftar | Email + In-app | High |
| Pendaftaran diterima | Pendaftar | Email + In-app + WA* | High |
| Pendaftaran ditolak | Pendaftar | Email + In-app | High |
| Pembayaran perlu verifikasi | Admin | In-app + Email | Medium |
| Pembayaran diverifikasi | Orang Tua | Email + In-app | High |
| Pembayaran ditolak | Orang Tua | Email + In-app | Medium |
| Pengumuman baru | Target audience | In-app + Email | Medium |
| Perkembangan anak diperbarui | Orang Tua | Email + In-app | Medium |
| Presensi alpha | Orang Tua | In-app + WA* | Low |
| User baru dibuat | User baru | Email | High |
| Password di-reset | User | Email | High |

\* Channel WhatsApp hanya jika diaktifkan & ada budget.

### 24.2 Channel Implementasi

**MVP:**
- In-app notification (table `notifications`)
- Email (via Firebase Auth trigger atau Resend/SendGrid)

**Scaling:**
- WhatsApp via Fonnte/WAHA (WAHA self-hosted, Fonnte berbayar murah)
- Push notification (jika ada mobile app)

### 24.3 Penting tentang WhatsApp

⚠️ **JANGAN gunakan WhatsApp Gateway ilegal/spam.**

Opsi legal:
1. **WhatsApp Business API** (resmi, mahal, $0.005–0.08/msg)
2. **Fonnte** (resmi aggregator Indonesia, mulai Rp 100rb/bln)
3. **WAHA** (self-hosted open source, gratis tapi perlu server)
4. **Twilio WhatsApp** (resmi global)

Untuk yayasan kecil, **Fonnte** paling realistis (mulai Rp 100rb/bln, 1000 pesan).

### 24.4 Notification Service Pattern

```
function notify(userId, type, title, message, link) {
  // 1. Simpan ke notifications table
  // 2. Kirim email
  // 3. Kirim WA jika diaktifkan
  // 4. Return notification ID
}
```

### 24.5 User Preferences

Orang tua bisa setting:
- Mau email atau tidak
- Mau WA atau tidak (jika diaktifkan)
- Mau notif jenis apa (PPDB/pembayaran/pengumuman/perkembangan)

Disimpan di `user_notification_preferences`.

---

## PART 25 — MVP

### 25.1 MVP Scope (Fase 1–5)

MVP harus bisa launch dan dipakai nyata, meskipun belum sempurna.

**Yang WAJIB ada di MVP:**
- ✅ Public website (profil, berita, kontak, PPDB info)
- ✅ Formulir PPDB online + cek status
- ✅ Login (5 role)
- ✅ Dashboard masing-masing role (basic)
- ✅ Admin: verifikasi PPDB, terima/tolak, konversi siswa
- ✅ Admin: CRUD siswa, guru, orang tua, kelas
- ✅ Admin: generate invoice SPP + verifikasi pembayaran manual
- ✅ Guru: input presensi harian
- ✅ Guru: input perkembangan anak (basic)
- ✅ Orang tua: lihat data anak, presensi, perkembangan, tagihan
- ✅ Notifikasi in-app + email (basic)
- ✅ Audit log
- ✅ Backup mingguan

**Yang BISA DITUNDA (Post-MVP):**
- ⏸ Cetak laporan PDF lengkap
- ⏸ Multi-foto per siswa
- ⏸ Notifikasi WhatsApp
- ⏸ Custom domain
- ⏸ 2FA
- ⏸ Pengajuan perubahan data oleh ortu
- ⏸ Mobile app

### 25.2 Kriteria Sukses MVP

1. 100% calon orang tua bisa daftar online tanpa ke sekolah
2. Admin bisa verifikasi & konversi pendaftar dalam < 5 menit
3. Orang tua bisa login & lihat data anak dengan benar (data isolation tested)
4. Guru bisa input presensi via HP < 30 detik untuk 1 kelas
5. Pembayaran SPP tercatat dan bisa di-rekap
6. Sistem tidak down > 1 jam/bulan
7. Tidak ada kebocoran data antar role (security tested)

### 25.3 Estimasi Effort

| Fase | Estimasi |
|---|---|
| Phase 0–2 (Plan + Public + Auth) | 2–3 minggu |
| Phase 3 (Database Core) | 1–2 minggu |
| Phase 4 (PPDB) | 2 minggu |
| Phase 5 (Admin Portal) | 3–4 minggu |
| Phase 6 (Guru Portal) | 2 minggu |
| Phase 7 (Parent Portal) | 2 minggu |
| Phase 8 (Payment) | 1–2 minggu |
| Phase 9 (Reporting) | 1 minggu |
| Phase 10 (Security Hardening) | 1 minggu |
| Phase 11 (Testing) | 2 minggu |
| Phase 12 (Production Launch) | 1 minggu |

**Total MVP: ~4–6 bulan** (1 developer, paruh waktu)

---

## PART 26 — Development Roadmap

### Phase 0 — Planning & Setup (1 minggu)
**Goals:** Setup project, finalisasi rancangan

**Tasks:**
- [ ] Finalisasi blueprint ini
- [ ] Setup Google Workspace (akun yayasan)
- [ ] Buat Google Sheets sesuai struktur
- [ ] Setup Apps Script project
- [ ] Setup Firebase project
- [ ] Setup repository GitHub
- [ ] Pilih & pesan domain (opsional)

**Deliverable:** Project skeleton, database schema siap, repo online

### Phase 1 — Public Website (2 minggu)
**Goals:** Website profil & landing page jadi

**Tasks:**
- [ ] HTML + Tailwind setup
- [ ] Halaman Beranda
- [ ] Halaman Profil (Visi, Misi, Struktur)
- [ ] Halaman Program Pendidikan
- [ ] Halaman Fasilitas
- [ ] Halaman Galeri (read-only)
- [ ] Halaman Berita (read-only)
- [ ] Halaman Pengumuman (read-only)
- [ ] Halaman Kontak + Peta
- [ ] Halaman Informasi PPDB (brosur online)
- [ ] Responsive test
- [ ] SEO basic (meta tags, sitemap)
- [ ] Deploy ke Cloudflare Pages

**Deliverable:** Website publik live

### Phase 2 — Authentication (1 minggu)
**Goals:** Sistem login untuk 5 role

**Tasks:**
- [ ] Firebase Auth setup
- [ ] Halaman login (universal)
- [ ] Halaman lupa password
- [ ] Halaman reset password
- [ ] Auth service di Apps Script
- [ ] Token management (sessionStorage)
- [ ] Middleware auth di backend
- [ ] Middleware RBAC
- [ ] Seed data: 5 user demo (1 per role)
- [ ] Activity log untuk login/logout

**Deliverable:** User bisa login sesuai role

### Phase 3 — Database Core (1–2 minggu)
**Goals:** Database siap, struktur lengkap

**Tasks:**
- [ ] Buat semua sheet sesuai PART 10
- [ ] Generator ID function
- [ ] Helper functions (CRUD generic)
- [ ] Validasi layer
- [ ] Audit log writer
- [ ] Data dictionary (README)
- [ ] Seed data master (roles, permissions, yayasan, dll)

**Deliverable:** Database siap pakai

### Phase 4 — PPDB Online (2 minggu)
**Goals:** PPDB online end-to-end

**Tasks:**
- [ ] Form pendaftaran publik
- [ ] Upload dokumen (foto, akta, KK)
- [ ] Generate nomor pendaftaran
- [ ] Halaman cek status (publik, cukup masukkan nomor + tanggal lahir)
- [ ] Notifikasi email submission
- [ ] Admin: daftar pendaftar
- [ ] Admin: detail pendaftar + dokumen
- [ ] Admin: verifikasi (accept/reject/request revision)
- [ ] Pendaftar: perbaikan data (jika perlu)
- [ ] Konversi pendaftar → siswa aktif
- [ ] Auto create akun orang tua
- [ ] Activity log PPDB

**Deliverable:** PPDB online lengkap

### Phase 5 — Admin Portal (3–4 minggu)
**Goals:** Admin bisa kelola semua data master

**Tasks:**
- [ ] Dashboard admin
- [ ] CRUD Sekolah
- [ ] CRUD Tahun Ajaran
- [ ] CRUD Kelas
- [ ] CRUD Guru
- [ ] CRUD Siswa (input manual, import CSV opsional)
- [ ] CRUD Orang Tua
- [ ] Generate invoice SPP (bulk)
- [ ] Verifikasi pembayaran
- [ ] Rekap pembayaran
- [ ] Rekap tunggakan
- [ ] CRUD Berita
- [ ] CRUD Pengumuman
- [ ] CRUD Agenda
- [ ] CRUD Galeri (upload foto)
- [ ] Cetak laporan basic (PDF)
- [ ] Manajemen Dokumen Siswa

**Deliverable:** Portal admin fungsional

### Phase 6 — Teacher Portal (2 minggu)
**Goals:** Guru bisa input data via HP

**Tasks:**
- [ ] Dashboard guru
- [ ] Profil guru
- [ ] Daftar kelas yang diajar
- [ ] Daftar siswa per kelas
- [ ] Input presensi harian (form mobile-friendly)
- [ ] Input perkembangan anak (form 6 aspek)
- [ ] Catatan perilaku/kegiatan
- [ ] Lihat pengumuman
- [ ] Riwayat input

**Deliverable:** Portal guru fungsional

### Phase 7 — Parent Portal (2 minggu)
**Goals:** Orang tua bisa lihat data anak

**Tasks:**
- [ ] Dashboard orang tua (kartu anak)
- [ ] Profil anak (read-only, dengan pengajuan perubahan)
- [ ] Lihat presensi anak
- [ ] Lihat perkembangan anak (rapor online)
- [ ] Lihat catatan guru
- [ ] Lihat tagihan SPP
- [ ] Riwayat pembayaran
- [ ] Status tunggakan
- [ ] Upload bukti pembayaran (opsional MVP, lebih baik masuk admin)
- [ ] Lihat pengumuman
- [ ] Notifikasi in-app

**Deliverable:** Portal orang tua fungsional

### Phase 8 — Payment System (1–2 minggu)
**Goals:** Sistem pembayaran fungsional

**Tasks:**
- [ ] Generate invoice SPP (cron bulanan)
- [ ] Verifikasi pembayaran oleh admin
- [ ] Notifikasi pembayaran
- [ ] Riwayat pembayaran
- [ ] Export laporan pembayaran

**Deliverable:** Sistem pembayaran berjalan

### Phase 9 — Reporting (1 minggu)
**Goals:** Laporan cetak & export

**Tasks:**
- [ ] Template PDF (rapor, laporan)
- [ ] Export Excel
- [ ] Filter & parameter laporan
- [ ] Cetak massal

**Deliverable:** Sistem reporting lengkap

### Phase 10 — Security Hardening (1 minggu)
**Goals:** Sistem aman sesuai UU PDP

**Tasks:**
- [ ] Security audit (penetration test sederhana)
- [ ] Rate limiting
- [ ] Security headers
- [ ] CSP (Content Security Policy)
- [ ] Validasi ulang semua input
- [ ] Review RBAC enforcement
- [ ] Test IDOR (data isolation)
- [ ] Backup teruji
- [ ] Dokumentasi keamanan

**Deliverable:** Sistem lulus security audit

### Phase 11 — Testing (2 minggu)
**Goals:** Bug-free, performa baik

**Tasks:**
- [ ] Unit test (untuk logic kritis)
- [ ] Integration test (alur end-to-end)
- [ ] UAT (User Acceptance Test) dengan user nyata
- [ ] Performance test
- [ ] Mobile testing (iOS + Android)
- [ ] Browser testing
- [ ] Load test (seberapa banyak concurrent user)

**Deliverable:** Sistem stabil untuk production

### Phase 12 — Production Launch (1 minggu)
**Goals:** Live & monitored

**Tasks:**
- [ ] Migrasi data (jika dari sistem lama)
- [ ] Setup production environment
- [ ] DNS setup
- [ ] SSL certificate
- [ ] Monitoring setup
- [ ] User training
- [ ] Documentation (user manual)
- [ ] Launch announcement
- [ ] Hypercare (1 minggu intensive support)

**Deliverable:** Sistem LIVE

### Total Timeline

**MVP (Phase 0–12): ± 4–6 bulan** (1 developer solo, paruh waktu)

### Post-MVP (Phase 13+)

- Phase 13: Notifikasi WhatsApp
- Phase 14: Mobile App (Flutter)
- Phase 15: Payment Gateway
- Phase 16: Multi-cabang
- Phase 17: E-learning
- Phase 18: AI features

---

## PART 27 — Testing Strategy

### 27.1 Jenis Testing

| Jenis | Tujuan | Tools | Dilakukan |
|---|---|---|---|
| **Unit Test** | Test function individual | Built-in | Developer |
| **Integration Test** | Test alur antar service | Manual/auto | Developer |
| **E2E Test** | Test flow user | Cypress/Playwright | Developer |
| **UAT** | Validasi user | Manual | User + Developer |
| **Security Test** | Cari celah keamanan | Manual + OWASP ZAP | Developer |
| **Performance Test** | Cek kecepatan | Lighthouse, GTmetrix | Developer |
| **Mobile Test** | Cek responsive | BrowserStack/real device | Developer |

### 27.2 Test Cases Penting

**Security Tests:**
- Coba akses data anak orang lain sebagai orang tua (HARUS gagal)
- Coba akses endpoint admin sebagai guru (HARUS gagal)
- Coba SQL injection
- Coba XSS
- Coba CSRF
- Coba brute force login
- Coba akses file Drive langsung (HARUS gagal/expired)

**Functional Tests:**
- Submit PPDB → terima → konversi → siswa muncul di kelas → orang tua bisa login
- Generate invoice → orang tua bayar → upload bukti → admin verifikasi → status lunas
- Guru input presensi → orang tua lihat presensi update
- Guru input perkembangan → orang tua lihat rapor update

**Performance Tests:**
- Load time halaman < 3 detik
- API response < 2 detik
- 100 user concurrent bisa akses

### 27.3 Bug Tracking

- Gunakan **GitHub Issues** atau **Trello**
- Severity: Blocker / Critical / Major / Minor / Trivial
- Setiap bug harus reproducible

---

## PART 28 — Deployment Strategy

### 28.1 Environment

| Env | Tujuan | URL | Data |
|---|---|---|---|
| **Local** | Development | localhost | Dummy |
| **Staging** | Test sebelum production | staging.yayasan.sch.id | Sample |
| **Production** | User nyata | yayasan.sch.id | Real |

### 28.2 Deployment MVP

```
1. Setup Apps Script Web App (deploy as API)
2. Deploy frontend ke Cloudflare Pages
3. Setup custom domain (jika ada)
4. SSL via Cloudflare (gratis)
5. Monitor via Cloudflare Analytics
```

### 28.3 Deployment Scaling

```
1. Backend di Railway / Fly.io (auto deploy dari GitHub)
2. Frontend di Vercel / Cloudflare Pages
3. Database di Supabase
4. CI/CD via GitHub Actions
5. Monitor via Sentry + LogRocket
```

### 28.4 Database Migration saat Deploy

- Setiap perubahan schema harus via migration script
- Backup sebelum deploy
- Test di staging dulu

### 28.5 Rollback Plan

- Setiap deploy harus bisa di-revert
- Simpan versi sebelumnya di Git
- Database migration harus reversible

---

## PART 29 — Backup & Disaster Recovery

### 29.1 Strategi Backup

**Database (Sheets):**
- Backup mingguan: Export semua sheets ke CSV di folder backup
- Otomatis via Apps Script time trigger
- Retensi: 3 bulan
- Lokasi: Folder khusus di Drive

**Files (Drive):**
- Backup bulanan: Copy folder penting ke akun Google kedua
- Retensi: 3 bulan
- Lokasi: Drive akun backup

**Konfigurasi (Apps Script):**
- Source code di GitHub (version control)
- Deployment ID dicatat di `system_settings`

### 29.2 RTO & RPO

- **RTO (Recovery Time Objective):** 4 jam
- **RPO (Recovery Point Objective):** 1 minggu (backup mingguan)

### 29.3 Disaster Recovery Plan

**Skenario 1: Database corruption/rusak**
1. Identifikasi waktu backup terakhir yang bersih
2. Restore dari backup
3. Input ulang data yang hilang (jika ada)

**Skenario 2: File hilang**
1. Restore dari folder backup
2. Re-upload ke folder utama jika perlu

**Skenario 3: Akun Google compromised**
1. Recover akun via Google Account Recovery
2. Jika gagal, restore dari backup ke akun baru
3. Ganti semua kredensial

**Skenario 4: Apps Script dihapus**
1. Restore dari GitHub (source code)
2. Redeploy

**Skenario 5: Data breach (peretasan)**
1. Identifikasi scope
2. Laporkan ke pihak berwenang (UU PDP: 3x24 jam)
3. Informasikan ke orang tua
4. Force reset semua password
5. Restore dari backup bersih terakhir

### 29.4 Test Restore

- Tiap quarter, test restore dari backup
- Pastikan data bisa dikembalikan

---

## PART 30 — Migration Strategy

### 30.1 Kapan Harus Migrasi

Indikator pindah dari Google Sheets ke database proper (Supabase/MySQL/Postgres):

| Indikator | Threshold | Status |
|---|---|---|
| Jumlah siswa aktif | > 100 | 🟡 Pertimbangkan |
| Jumlah siswa aktif | > 200 | 🔴 Wajib migrasi |
| Concurrent users | > 30 | 🟡 Pertimbangkan |
| Transaction per hari | > 100 | 🟡 Pertimbangkan |
| Database size | > 5 MB | 🟡 Pertimbangkan |
| Query lambat | > 5 detik | 🔴 Wajib migrasi |
| Concurrency issues (lost update) | Sering | 🔴 Wajib migrasi |
| Butuh JOIN kompleks | Ya | 🔴 Wajib migrasi |
| Butuh real-time | Ya | 🟡 Pertimbangkan |
| Audit compliance tinggi | Ya | 🟡 Pertimbangkan |

### 30.2 Tahapan Migrasi

**STAGE 1: Google Sheets + Apps Script + Drive** (Sekarang)
- Cocok untuk 0–100 siswa
- Biaya Rp 0
- Sudah cukup untuk MVP

**STAGE 2: Database Cloud + Backend Production**
Trigger: > 100 siswa atau ada masalah performa/konkurensi

Langkah:
1. Setup Supabase project
2. Convert struktur Sheets → Postgres schema (otomatis via tools atau manual)
3. Migrasi data dari Sheets ke Postgres (script ETL)
4. Refactor backend dari Apps Script ke Node.js
5. Setup hosting (Railway/Fly.io)
6. Migrasi file dari Drive ke Supabase Storage
7. Dual-run period (Sheets + Postgres sinkron) → gradual cutover
8. Archive Sheets

**STAGE 3: Backend Production + Scaling**
Trigger: > 500 siswa atau multi-cabang

Langkah:
1. Pecah monolithic backend ke microservices (jika perlu)
2. Setup load balancer
3. Setup CDN
4. Cache layer (Redis)
5. Background jobs (queue)
6. Monitoring proper (Sentry, DataDog)
7. CI/CD otomatis

**STAGE 4: Enterprise / Multi-Yayasan**
Trigger: Multi-cabang / multi-yayasan / SaaS

Langkah:
1. Multi-tenant architecture
2. SSO
3. RBAC advanced
4. Audit compliance (ISO 27001)
5. SLA 99.9%
6. Dedicated support

### 30.3 Migration-Ready Architecture

Kenapa arsitektur kita sudah migration-ready:
- ✅ ID format konsisten (varchar, bukan auto-increment)
- ✅ Foreign key logic jelas
- ✅ Audit fields standard
- ✅ Soft delete
- ✅ Timestamp ISO
- ✅ Service modular
- ✅ API contract jelas
- ✅ Single Source of Truth

Saat migrasi:
1. Schema generator dari dokumen ini
2. ETL script konversi Sheets → SQL
3. Backend rewrite modular (per service)
4. File migration script
5. Data validation sebelum cutover
6. Rollback plan

### 30.4 Biaya Migrasi

| Stage | Biaya Bulanan | Biaya Setup |
|---|---|---|
| Stage 1 | Rp 0 | Rp 0 |
| Stage 2 | Rp 0–400rb (Supabase free/Pro) | ~Rp 0 (developer sendiri) |
| Stage 3 | Rp 400rb–2jt | ~Rp 0–500rb |
| Stage 4 | Rp 2jt+ | ~Rp 5jt+ |

---

## PART 31 — Risks & Mitigation

### 31.1 Risk Matrix

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| **Google Sheets concurrency issue** (data hilang/corrupt) | Medium | High | Migrasi ke SQL saat >100 siswa; backup rutin |
| **Apps Script execution time limit** (6 menit) | Medium | Medium | Optimasi query, batch processing, migrasi ke Node.js |
| **Akun Google di-hack** | Low | Critical | 2FA, password kuat, monitoring login |
| **Drive file bocor (URL publik)** | Medium | High | Signed URL, tidak share langsung, audit access |
| **Data breach / peretasan** | Low | Critical | Security hardening, penetration test, UU PDP compliance |
| **Developer tunggal overwhelmed** | High | Medium | Dokumentasi, modular, training orang kedua |
| **Biaya tak terduga** | Medium | Medium | Mulai Rp 0, scaling sesuai kebutuhan |
| **Resistensi user (guru/admin tua)** | Medium | Medium | Training, UI simple, pendampingan |
| **Calon orang tua tidak paham PPDB online** | Medium | Medium | Video tutorial, panduan WhatsApp, fallback manual |
| **Maintenance Apps Script jarang update Google** | Low | Medium | Migrasi ke Node.js saat perlu |
| **Backup gagal diam-diam** | Medium | High | Monitoring backup, notifikasi ke admin |
| **Password lemah user** | High | High | Policy password, edukasi, 2FA untuk admin |
| **Session token dicuri (XSS)** | Low | High | CSP, sanitize input, HttpOnly cookie (kalau bisa) |
| **Downtime Apps Script** | Low | Medium | Apps Script cukup reliable 99%+; fallback ke static info |
| **Kehilangan data saat migrasi** | Low | High | Backup sebelum migrasi, dual-run period, validasi |
| **Skalabilitas tidak cukup** | Medium | Medium | Migrasi terstruktur ke SQL (lihat PART 30) |

### 31.2 Risk vs Benefit Analysis

**Risiko utama menggunakan Google Sheets + Apps Script:**
1. Concurrency limit (~40 concurrent writer)
2. Execution time limit (6 menit)
3. Tidak ada real-time DB trigger
4. Query lambat untuk data besar
5. Tidak ada transaksi atomik

**Benefit:**
1. Biaya Rp 0
2. Setup cepat
3. Visual & mudah di-maintain developer solo
4. Cocok untuk MVP dan skala kecil
5. Migration path jelas

**Verdict:** Trade-off worth it untuk MVP dan yayasan kecil. Rencanakan migrasi sebelum masalah muncul.

---

## PART 32 — Final Technology Recommendation

### 32.1 Rekomendasi Final (Jika Saya di Posisi Anda)

> **"Jika saya berada di posisi Anda dan harus membangun sistem ini dari nol, inilah arsitektur yang akan saya pilih."**

#### MVP Stack (Phase 0–12)

| Komponen | Pilihan | Alasan |
|---|---|---|
| **Frontend** | HTML + Tailwind CSS + Vanilla JS | Murah, mudah dipelajari, modern, cepat di-deploy ke Cloudflare Pages |
| **Backend** | Google Apps Script (modular: Code.gs, Auth.gs, StudentService.gs, PPDBService.gs, PaymentService.gs, FileService.gs, NotificationService.gs, Utils.gs) | Gratis, integrasi native Sheets/Drive/Firebase, cukup untuk 100 siswa |
| **Database** | Google Sheets (24 sheet sesuai PART 10, struktur SQL-like) | Gratis, visual, kolaboratif, migration-ready |
| **Authentication** | Firebase Authentication (free tier) | Gratis, aman, JWT built-in, 2FA ready, tidak custom auth |
| **File Storage** | Google Drive (struktur folder sesuai PART 11) + signed URL | Gratis 15GB, integrasi native |
| **Hosting** | Apps Script Web App (API) + Cloudflare Pages (frontend statis) | Gratis, CDN, SSL |
| **Domain** | Domain gratis (Freenom/Cloudflare Pages subdomain) atau custom murah (~Rp 100rb/tahun) | Profesional & murah |
| **Email** | Gmail SMTP via Firebase Functions trigger (free tier) atau Resend | Gratis, reliable |
| **Backup** | Apps Script time trigger mingguan → Drive folder backup + akun kedua | Gratis |

**Total biaya MVP: Rp 0–200rb/tahun**

#### Scaling Stack (Phase 13+, saat > 100 siswa atau masalah performa)

| Komponen | Pilihan |
|---|---|
| **Frontend** | React + Vite + Tailwind (di Vercel) |
| **Backend** | Node.js + Express + TypeScript (di Railway/Fly.io) |
| **Database** | Supabase Postgres + Row Level Security |
| **Authentication** | Supabase Auth |
| **File Storage** | Supabase Storage + Image optimization |
| **Email** | Resend / SendGrid |
| **WhatsApp** | Fonnte (resmi aggregator Indonesia) |
| **Monitoring** | Sentry + Uptime Robot |
| **CI/CD** | GitHub Actions |

**Total biaya scaling: Rp 0–400rb/bulan**

### 32.2 Alasan Pilihan untuk PAUD/TK

1. **Biaya sangat rendah di awal** — yayasan kecil biasanya budget IT minim
2. **Mudah dikembangkan solo** — developer independen bisa handle
3. **Tidak over-engineered** — sesuai skala PAUD/TK
4. **Migration-ready** — saat tumbuh, migrasi terstruktur tanpa rewrite
5. **Modern & professional** — website tetap terlihat profesional
6. **Aman** — Firebase Auth + RBAC + audit log = cukup aman untuk UU PDP
7. **Mobile-friendly** — responsive web cukup untuk 90%+ kasus
8. **Komunitas & dokumentasi** — semua teknologi punya komunitas besar

### 32.3 Hal yang JANGAN Dilakukan

❌ Bangun custom auth di Apps Script (pakai Firebase Auth)  
❌ Pakai nama siswa sebagai primary key (pakai ID format)  
❌ Share file Drive langsung via link publik (pakai signed URL)  
❌ Akses Sheets langsung dari frontend (selalu via backend)  
❌ Satu file backend ribuan baris (modular)  
❌ Setiap portal punya database sendiri (Single Source of Truth)  
❌ Simpan password plaintext (Firebase Auth handle)  
❌ Lewati validasi di backend (selalu validasi ulang)  
❌ Hardcode API key di frontend (pakai backend proxy)  
❌ Pakai payment gateway ilegal/spam (pakai Fonnte atau resmi)  
❌ Skip audit log (WAJIB ada)  
❌ Lupakan backup (WAJIB ada)

### 32.4 Hal yang WAJIB Dilakukan

✅ RBAC di setiap endpoint  
✅ Audit log untuk semua aksi  
✅ HTTPS only  
✅ Validasi di backend  
✅ Backup rutin  
✅ Test restore  
✅ Dokumentasi kode & API  
✅ Mobile-first design  
✅ Modular architecture  
✅ Single Source of Truth  
✅ Soft delete untuk data penting  
✅ Unique ID format konsisten

### 32.5 Timeline Ringkas

| Bulan | Kegiatan |
|---|---|
| 1 | Phase 0–1 (Plan + Public Website) |
| 2 | Phase 2–3 (Auth + DB Core) |
| 3 | Phase 4 (PPDB) |
| 4 | Phase 5 (Admin Portal) |
| 5 | Phase 6 (Guru Portal) + Phase 7 (Parent Portal) |
| 6 | Phase 8 (Payment) + Phase 9 (Reporting) |
| 7 | Phase 10–11 (Security + Testing) |
| 8 | Phase 12 (Launch) |

### 32.6 Penutup

Sistem ini dirancang dengan prinsip **SIMPLICITY + SECURITY + MAINTAINABILITY + SCALABILITY + LOW COST**. Tahap awal menggunakan teknologi gratis yang sudah cukup untuk yayasan PAUD/TK. Saat tumbuh, migrasi terstruktur ke stack yang lebih scalable tanpa rewrite besar.

Dokumen ini adalah **blueprint** yang akan memandu pembangunan. Setelah Anda approve, kita bisa mulai masuk ke tahap:
1. Setup project skeleton
2. Buat database Sheets sesuai struktur
3. Develop per fase sesuai roadmap

**Silakan review blueprint ini dan berikan instruksi untuk fase selanjutnya.**

---

## Lampiran A: Struktur File Apps Script (Modular)

```
yayasan-apps-script/
├── Code.gs                    # Entry point, routing, doGet/doPost
├── Config.gs                  # Konstanta (sheet ID, folder ID, dll)
├── Auth.gs                    # Firebase Auth integration, token verify
├── Permissions.gs             # RBAC helper
├── Utils.gs                   # Helper functions (ID generator, date, validation)
│
├── services/
│   ├── UserService.gs
│   ├── StudentService.gs
│   ├── ParentService.gs
│   ├── TeacherService.gs
│   ├── ClassService.gs
│   ├── AcademicYearService.gs
│   ├── PPDbService.gs
│   ├── PaymentService.gs
│   ├── AttendanceService.gs
│   ├── DevelopmentService.gs
│   ├── TeacherNoteService.gs
│   ├── AnnouncementService.gs
│   ├── NewsService.gs
│   ├── EventService.gs
│   ├── GalleryService.gs
│   ├── FileService.gs
│   ├── NotificationService.gs
│   ├── ActivityLogService.gs
│   └── ReportService.gs
│
├── validators/
│   ├── StudentValidator.gs
│   ├── PPDbValidator.gs
│   ├── PaymentValidator.gs
│   └── ...
│
└── triggers/
    ├── BackupTrigger.gs       # Time-based: backup mingguan
    └── InvoiceTrigger.gs      # Monthly: generate invoice SPP
```

## Lampiran B: Struktur Folder Frontend (Cloudflare Pages)

```
public-website/
├── index.html                 # Beranda
├── profil.html
├── program.html
├── fasilitas.html
├── galeri.html
├── berita/
│   ├── index.html
│   └── [slug].html            # atau dynamic via JS
├── pengumuman/
├── agenda/
├── kontak.html
├── ppdb/
│   ├── index.html             # Info PPDB
│   ├── daftar.html            # Formulir
│   └── cek-status.html        # Cek status
├── assets/
│   ├── css/
│   ├── js/
│   ├── img/
│   └── fonts/
└── components/
    ├── header.html
    └── footer.html            # atau include via JS

portal/
├── login.html
├── admin/
│   ├── index.html             # Dashboard
│   ├── ppdb.html
│   ├── siswa.html
│   ├── guru.html
│   ├── spp.html
│   └── ...
├── guru/
│   ├── index.html
│   ├── presensi.html
│   ├── perkembangan.html
│   └── ...
└── ortu/
    ├── index.html
    ├── anak.html
    ├── raport.html
    ├── spp.html
    └── ...
```

## Lampiran C: Glossary (Istilah Teknis)

| Istilah | Penjelasan Singkat |
|---|---|
| **API** | Pintu masuk ke backend; frontend "ngobrol" dengan backend lewat sini |
| **REST** | Gaya desain API yang pakai HTTP method (GET/POST/PUT/DELETE) |
| **CRUD** | Create, Read, Update, Delete — 4 operasi dasar data |
| **RBAC** | Role-Based Access Control — hak akses berdasarkan peran |
| **JWT** | JSON Web Token — token login yang aman, ada expiry |
| **OAuth** | Standar login via pihak ketiga (misal "Login dengan Google") |
| **Hashing** | Mengubah password jadi kode acak yang tidak bisa dibalik |
| **Session** | Status login user yang disimpan server |
| **Webhook** | Notifikasi otomatis antar sistem saat ada event |
| **Endpoint** | URL spesifik di API untuk fungsi tertentu |
| **ERD** | Entity-Relationship Diagram — peta hubungan antar tabel |
| **Foreign Key** | Kolom di tabel A yang menunjuk ke primary key tabel B (relasi) |
| **Primary Key** | Kolom unik yang jadi identitas tiap baris |
| **Soft Delete** | Data tidak benar-benar dihapus, hanya ditandai `is_deleted=true` |
| **Migration** | Proses mengubah struktur database (tambah kolom, tabel, dll) |
| **CDN** | Content Delivery Network — server yang tersebar di banyak negara untuk mempercepat loading |
| **SSL/HTTPS** | Protokol aman untuk web (data terenkripsi) |
| **CSRF** | Serangan yang bikin user tanpa sadar mengirim request berbahaya |
| **XSS** | Serangan dengan menyisipkan kode berbahaya di halaman web |
| **IDOR** | Insecure Direct Object Reference — bug yang bikin user bisa akses data orang lain dengan ganti ID di URL |

---

**Akhir Dokumen Blueprint v1.0**

Dokumen ini akan di-update sesuai perkembangan proyek. Setelah Anda approve, kita mulai implementasikan sesuai roadmap.