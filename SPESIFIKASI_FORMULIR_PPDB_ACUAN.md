# Spesifikasi Acuan Resmi PPDB — Yayasan At Tarbiyyah Wijaya Kusuma Samarinda (TPQ Ulinnuha & KB Ulinnuha)

Dokumen ini menjadi **Acuan Utama (Single Source of Truth)** untuk restrukturisasi sistem **PPDB (Penerimaan Peserta Didik Baru)** dari Frontend, Backend (`api.js` & `local-api.js`), Portal Admin, hingga Portal Siswa.

---

## 1. Berkas Aset Referensi Fisik (`frontend/public/assets/ppdb-reference/`)

1. **`plang-tpq-ulinnuha.jpg`** — Plang Resmi **Taman Pendidikan Al-Qur'an (TPQ) ULINNUHA** (Koordinator Pendidikan Al-Qur'an Metode Qiraati Cabang Samarinda - Kaltim, Nomor Induk: `05.01.01.001`, Air Putih - Samarinda Ulu - Samarinda).
2. **`plang-kb-ulinnuha-paud.jpg`** — Plang Resmi **Pendidikan Anak Usia Dini KB ULINNUHA** (NPSN: `69840840`, Jln. Ir. H. Juanda Komplek Wijaya Kusuma VA Perum Guru SMPN 5 RT. 017 Kel. Air Putih Kec. Samarinda Ulu).
3. **`form-pendaftaran-santri-tpq.jpg`** — Formulir Pendaftaran Santri Baru **TPQ ULINNUHA** (digunakan untuk Jenjang TPQ Pagi dan Jenjang Tahfidz).
4. **`form-buku-induk-tk-halaman-1.jpg`** & **`form-buku-induk-tk-halaman-2.jpg`** — Formulir Buku Induk Anak Didik (digunakan untuk **KB ULINNUHA / PAUD**).

---

## 2. Visi, Misi & Struktur Jenjang Baru PPDB (Tanpa TK)

> **Catatan Penting**: Program **TK (TK A & TK B)** resmi **dihapus dari PPDB**. Struktur program PPDB kini terdiri dari **3 Pilihan Jenjang Utama**:

### Visi
**"Mewujudkan Anak Hafal Al-Qur'an di Bawah Usia 9 Tahun, Hafal Tanpa Menghafal"**

### A. TPQ ULINNUHA — JENJANG TPQ PAGI (`TPQ_PAGI`)
- **Metode**: Belajar Al-Qur'an dengan **Metode Qiraati 5 Jilid** untuk anak usia dini **maksimal / di bawah 3 tahun** (juga menerima jalur **Usia Reguler > 3 tahun**).
- **Pola Kurikulum**: Buku 1, Buku 2, Buku 3, Buku 4, Buku 5, Al-Qur'an, Ghorib, Tajwid.
- **Jam Belajar**: Sehari 2x yaitu **Pagi dan Sore (@ 75 menit)** selama **6 hari kerja (Senin – Sabtu)**.
- **Target Waktu Belajar**: **6 Bulan Khotam**.

### B. TPQ ULINNUHA — JENJANG TAHFIDZ (`TAHFIDZ`)
Memiliki struktur formulir biodata yang sama dengan **Jenjang TPQ Pagi (A)**, namun dengan pilihan sub-program dan ketentuan khusus:

#### 1. Pra PTPT (Pra Pasca TPQ Program Tahfidz) (`TAHFIDZ_PRA_PTPT`)
- **Ketentuan Syarat**: Wajib **mempunyai Ijazah TPQ (Qiraati 5 Jilid)**.
- **Tujuan**: Anak terbiasa duduk untuk *"nderes"* (baca) Al-Qur'an selama 90 menit.
- **Target Khotam**: **60 kali** dalam waktu **16 bulan 17 hari (± 1,5 tahun)**.
- **Alokasi Waktu KBM**:
  - `15 menit`: Kelas berbaris
  - `90 menit`: Nderes Al-Qur'an sesuai level (**Level ½ Juz, Level 1 Juz, Level 1½ Juz, Level 2 Juz, Level 3 Juz**)
  - `15 menit`: Istirahat
  - `30 menit`: Kelas baca dan berhitung
- **Catatan KBM**:
  - Level ½ sampai 1½ Juz dibaca **2 kali sehari** (Pagi dan Sore).
  - Level 2 dan 3 Juz dibaca **3 kali sehari** (Pagi, Siang, dan Sore).
  - Khusus Level 3 Juz: tanpa baris, langsung klasikal Al-Qur'an.
  - Total khotaman: **60 kali**.

#### 2. PTPT (Pasca TPQ Program Tahfidz) (`TAHFIDZ_PTPT`)
- **Struktur 6 Kelas Berkelanjutan**:
  - **Kelas 1**: Juz 1 s/d 5
  - **Kelas 2**: Juz 1 s/d 10
  - **Kelas 3**: Juz 1 s/d 15
  - **Kelas 4**: Juz 1 s/d 20
  - **Kelas 5**: Juz 1 s/d 25
  - **Kelas 6**: Juz 1 s/d 30
- **Alokasi Waktu KBM**:
  - `30 menit`: Membuat hafalan
  - `15 menit`: Setor hafalan
  - `15 menit`: Istimror
  - `15 menit`: Kelas kecil
  - `30 menit`: Kelas besar
- **Target**: **Anak hafal Al-Qur'an sebelum usia 9 tahun**.

#### Dukungan Jalur Usia Reguler & Pendidikan Non-Formal (PKBM) untuk TPQ & Tahfidz:
- **Kategori Usia Santri**:
  1. **Usia Dini (≤ 3 Tahun)** — Khusus program unggulan usia dini.
  2. **Usia Reguler (> 3 Tahun)** — Menerima usia di atas 3 tahun baik untuk TPQ 5 Jilid maupun Tahfidz (Pra PTPT & PTPT).
- **Backup Ijazah Pemerintah melalui PKBM (Pendidikan Non-Formal)**:
  - **A. Jenjang Pendidikan Usia Dini melalui SPS (Satuan Pendidikan Sejenis)**
  - **B. Jenjang Pendidikan Kesetaraan**: **Program Paket A (Setara SD), Paket B (Setara SMP), dan Paket C (Setara SMA)**.

---

### C. KB ULINNUHA (PAUD — Pendidikan Anak Usia Dini) (`KB_ULINNUHA`)
- **Identitas Resmi**: Pendidikan Anak Usia Dini **KB ULINNUHA** (NPSN: `69840840`).
- **Alamat**: Jln. Ir. H. Juanda Komplek Wijaya Kusuma VA Perum Guru SMPN 5 RT. 017 Kelurahan Air Putih Kecamatan Samarinda Ulu.

---

## 3. Spesifikasi Field Formulir Berdasarkan Jenjang

### 3.1. Formulir A & B: Pendaftaran Santri Baru TPQ Ulinnuha (TPQ Pagi & Jenjang Tahfidz)
Mengacu pada formulir fisik **TPQ ULINNUHA** ditambah pilihan ketentuan jenjang:
- **Pilihan Program & Ketentuan TPQ**:
  - Jenjang Utama: `TPQ Pagi (Metode Qiraati 5 Jilid)` atau `Jenjang Tahfidz`
  - Kategori Usia: `Usia Dini (Maksimal / Di Bawah 3 Tahun)` atau `Usia Reguler (> 3 Tahun)`
  - Khusus `Jenjang Tahfidz`:
    - Sub-Jenjang: `Pra PTPT (Pra Pasca TPQ Program Tahfidz)` atau `PTPT (Pasca TPQ Program Tahfidz)`
    - Status Ijazah Qiraati 5 Jilid (untuk Pra PTPT): `Sudah Memiliki Ijazah TPQ Qiraati 5 Jilid` / Nomor/Keterangan Ijazah
    - Pilihan Level Nderes (untuk Pra PTPT): `Level 1/2 Juz`, `Level 1 Juz`, `Level 1 1/2 Juz`, `Level 2 Juz`, `Level 3 Juz`
    - Pilihan Kelas Hafalan (untuk PTPT): `Kelas 1 (Juz 1-5)`, `Kelas 2 (Juz 1-10)`, `Kelas 3 (Juz 1-15)`, `Kelas 4 (Juz 1-20)`, `Kelas 5 (Juz 1-25)`, `Kelas 6 (Juz 1-30)`
  - Pilihan Dukungan Jalur PKBM (Non-Formal): `Tidak Mengikuti PKBM`, `SPS (Satuan Pendidikan Sejenis - Usia Dini)`, `Paket A (Setara SD)`, `Paket B (Setara SMP)`, `Paket C (Setara SMA)`
- **A. Identitas Santri**:
  1. Nama Lengkap (`full_name`)
  2. Nama Panggilan (`nickname`)
  3. Jenis Kelamin (`gender`: Laki-laki / Perempuan)
  4. Tempat & Tanggal Lahir (`birth_place`, `birth_date`)
  5. Anak ke (`birth_order`)
  6. Jumlah Saudara (`siblings_count`)
  7. No. NIK (`nik` — **opsional untuk anak di bawah 3 tahun** jika belum terbit di KK; **tanpa input NIS** karena anak < 3 tahun belum memiliki NIS dan **NIS Lokal** baru diterbitkan oleh Admin saat diterima)
  8. Alamat Rumah Terstruktur:
     - a. Provinsi (`province`)
     - b. Kab/Kota (`city`)
     - c. Kecamatan (`district`)
     - d. Desa/Kelurahan (`village`)
     - e. Alamat Jalan / RT / No (`street_address`)
  9. Kontak:
     - a. Telpon 1 / WhatsApp Utama (`phone` / `phone_1`)
     - b. Telpon 2 / Nomor Cadangan (`phone_2`)
  10. Ayah: Nama Ayah (`father_name`), Pekerjaan Ayah (`father_occupation`), Pendidikan Ayah (`father_education`)
  11. Ibu: Nama Ibu (`mother_name`), Pekerjaan Ibu (`mother_occupation`), Pendidikan Ibu (`mother_education`)
  12. Wali (Opsional): Nama Wali (`guardian_name`), Pekerjaan Wali (`guardian_occupation`), Pendidikan Wali (`guardian_education`), Hubungan Wali (`guardian_relation`)
  13. Pendaftaran (Diisi Sistem / Admin):
      - a. Tanggal Daftar (`registration_date` — otomatis saat submit)
      - b. Tanggal Masuk (`entry_date` — diisi Admin saat aktivasi)
      - c. NIS Lokal (`nis` / `local_nis` — diterbitkan Admin saat diterima/konversi)

### 3.2. Formulir C: Pendaftaran Anak Didik KB ULINNUHA (PAUD)
Mengacu pada formulir fisik **Buku Induk Anak Didik PAUD / KB Ulinnuha**:
- **A. Identitas Anak Didik**:
  1. Nama Lengkap & Nama Panggilan (`full_name`, `nickname`)
  2. Jenis Kelamin (`gender`: Laki-laki / Perempuan)
  3. Tempat dan Tanggal Lahir (`birth_place`, `birth_date`)
  4. Alamat Rumah: Jalan (`street_address`), Desa/Kelurahan (`village`), Kecamatan (`district`), Kabupaten/Kota (`city`), Provinsi (`province`)
  5. Agama (`religion`)
  6. Kewarganegaraan (`citizenship`)
  7. Anak ke (`birth_order`)
  8. Jumlah Saudara: Kandung (`siblings_kandung`), Tiri (`siblings_tiri`), Angkat (`siblings_angkat`)
  9. Status Anak (`child_status`: Kandung / Yatim / Piatu / Yatim Piatu)
  10. Bahasa Sehari-hari (`daily_language`)
  11. Ciri-ciri Khusus (`special_traits` / riwayat kesehatan)
  - *Catatan NIS/NIK*: Anak usia dini (< 3–5 tahun) **tidak diminta mengisi NIS** saat pendaftaran; No. Induk (`2026.xx.xxx` / NIS) diterbitkan oleh Admin saat diterima.
- **B. Identifikasi Orang Tua / Wali**:
  1. Ayah (Kandung/Tiri/Angkat/Wali): Nama (`father_name`), Tempat & Tgl Lahir (`father_birth_info`), Agama (`father_religion`), Pendidikan Terakhir (`father_education`), Pekerjaan (`father_occupation`), Nomor Telepon Rumah (`father_phone_home`) & Kantor/HP (`father_phone`)
  2. Ibu (Kandung/Tiri/Angkat/Wali): Nama (`mother_name`), Tempat & Tgl Lahir (`mother_birth_info`), Agama (`mother_religion`), Pendidikan Terakhir (`mother_education`), Pekerjaan (`mother_occupation`), Nomor Telepon Rumah (`mother_phone_home`) & Kantor/HP (`mother_phone`)
  3. Wali (Opsional): Nama, Hubungan, Pekerjaan, Pendidikan
- **C. Asal / Mutasi & Keterangan Lain-lain**:
  1. Diterima di Kelompok (`group_target`: KB Ulinnuha)
  2. Berasal dari (`origin_school`: Rumah Tangga / Pindahan)
  3. Jarak Tempat Tinggal ke KB Ulinnuha (`distance_km` dalam KM)
  4. Pergi ke KB Ulinnuha dengan (`transport_mode`: Berkendara / Jalan kaki / Antar jemput)
