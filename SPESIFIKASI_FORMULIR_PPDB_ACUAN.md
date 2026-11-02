# 📋 SPESIFIKASI ACUAN FORMULIR PPDB FISIK (SIYAYASAN V2)
> **Dokumen Resmi Acuan Struktur Formulir PPDB Online**  
> Sumber: Berkas Formulir Fisik Asli Buku Induk TK/PAUD & Formulir Pendaftaran TPQ Ulinnuha  
> Lokasi Aset Gambar: `frontend/public/assets/ppdb-reference/`  
> Tanggal Dicatat: 2 November 2026

---

## 🎯 1. Ringkasan & Tujuan Dokumen

Dokumen ini memetakan seluruh kolom data (*fields*) yang terdapat pada **formulir fisik asli** yang digunakan oleh unit pendidikan Yayasan At Tarbiyyah Wijaya Kusuma Samarinda:
1. **Buku Induk Siswa TK / PAUD** (`form-buku-induk-tk-halaman-1.jpg` & `form-buku-induk-tk-halaman-2.jpg`)
2. **Formulir Pendaftaran Santri Baru TPQ Ulinnuha** (`form-pendaftaran-santri-tpq.jpg`)

Dokumen ini disimpan sebagai **spesifikasi master** yang akan digunakan sebagai landasan pembaruan struktur formulir PPDB online (`ppdb.html`), basis data Supabase (`ppdb_registrations`), dan portal admin/siswa ketika instruksi pembaruan diberikan.

---

## 📸 2. Inventaris Aset Berkas Fisik

| Nama Berkas | Unit | Keterangan & Isi Dokumen |
| :--- | :---: | :--- |
| **`form-buku-induk-tk-halaman-1.jpg`** | TK & PAUD | Nomor Induk, Kelompok (A/B), Tahun Ajaran, Pas Foto, Identitas Anak Didik (11 poin), dan Data Ayah (6 poin). |
| **`form-buku-induk-tk-halaman-2.jpg`** | TK & PAUD | Data Ibu (6 poin), Riwayat Mutasi Masuk/Pindah (3 poin), serta Keterangan Tambahan (Jarak ke TK & Transportasi). |
| **`form-pendaftaran-santri-tpq.jpg`** | TPQ | Formulir resmi TPQ Ulinnuha: NIK, Anak ke, Saudara, Alamat detail, 2 Nomor Kontak, Data Ayah/Ibu/Wali (Pendidikan & Pekerjaan), serta Administrasi Tanggal Masuk/NIS. |

---

## 📝 3. Rincian Lengkap Kolom Formulir Fisik

### A. Format Buku Induk TK & PAUD

#### Header Dokumen:
* **Nomor Induk Siswa:** Format penomoran (contoh: `2024.03.273`)
* **Kelompok / Rombel:** Kelompok A / Kelompok B (contoh: `A`, `B2`)
* **Tahun Pelajaran:** Tahun rentang (contoh: `2024 / 2026`)
* **Pas Foto:** Pas foto resmi ukuran 3x4 (berbusana muslimah/rapi)
* **Status Kelulusan / Keaktifan:** (contoh: `LULUS` / `Aktif`)

#### 1. Identitas Anak Didik (Siswa):
1. **Nama Anak Didik:**
   * a. Nama Lengkap (contoh: *Ilhamiya Kasiyfa Auliya*)
   * b. Nama Panggilan (contoh: *Ilhamiya*)
2. **Jenis Kelamin:** Laki-laki / Perempuan
3. **Tempat dan Tanggal Lahir:** Kota Lahir, Tanggal Lahir (contoh: *Samarinda, 01 Februari 2020*)
4. **Alamat Rumah Lengkap:**
   * a. Jalan / Gang / Komplek / No. Rumah / RT (contoh: *Jln. Juanda komplek Wijaya Kusuma V Rt. 017*)
   * b. Desa / Kelurahan (contoh: *Air Putih*)
   * c. Kecamatan (contoh: *Samarinda Ulu*)
   * d. Kabupaten / Kota (contoh: *Samarinda*)
   * e. Provinsi (contoh: *Kalimantan Timur*)
5. **Agama:** (contoh: *Islam*)
6. **Kewarganegaraan:** (contoh: *Indonesia*)
7. **Anak ke:** Angka urutan kelahiran (contoh: *1*)
8. **Jumlah Saudara:**
   * a. Saudara Kandung
   * b. Saudara Tiri
   * c. Saudara Angkat
9. **Status Yatim Piatu:** Anak Kandung / Yatim / Piatu / Yatim Piatu
10. **Bahasa Sehari-hari di Rumah:** (contoh: *Bahasa Indonesia / Daerah*)
11. **Ciri-ciri Khusus Santri:** Tanda lahir, kebutuhan khusus, atau alergi

#### 2. Identifikasi Orang Tua / Wali:
* **Ayah (Kandung / Tiri / Angkat / Wali):**
  * a. Nama Lengkap Ayah (contoh: *Maswadi*)
  * b. Tempat dan Tanggal Lahir (contoh: *Bangkalan, 21-09-1980*)
  * c. Agama (contoh: *Islam*)
  * d. Pendidikan Terakhir (contoh: *SLTA / S1 / dll.*)
  * e. Pekerjaan Ayah
  * f. Nomor Telepon / HP: 1) Rumah, 2) Kantor / WhatsApp
* **Ibu (Kandung / Tiri / Angkat / Wali):**
  * a. Nama Lengkap Ibu (contoh: *Sri Wahyuni*)
  * b. Tempat dan Tanggal Lahir (contoh: *Ngawi, 03-06-1982*)
  * c. Agama (contoh: *Islam*)
  * d. Pendidikan Terakhir (contoh: *SD / SMP / SMA / S1*)
  * e. Pekerjaan Ibu
  * f. Nomor Telepon / HP: 3) Rumah, 4) Kantor / WhatsApp

#### 3. Riwayat Mutasi Santri:
1. Diterima tanggal
2. Di tempatkan di kelompok (A/B)
3. Berasal dari sekolah sebelumnya (karena pindah / melanjutkan)

#### 4. Keterangan Tambahan (Logistik Santri):
1. **Jarak Tempat Tinggal ke Sekolah (TK):** Satuan Kilometer (KM)
2. **Moda Transportasi ke Sekolah:** Berkendara / Jalan kaki / Antar jemput

---

### B. Format Formulir Pendaftaran Santri Baru TPQ Ulinnuha

#### Kop Lembaga:
* **Nama Unit:** TPQ ULINNUHA
* **Wilayah:** Kelurahan Air Putih, Kecamatan Samarinda Ulu, Cabang Samarinda
* **Sekretariat:** Jl. Wijaya Kesuma Va RT 17 No. 32 — Telp/WA: `0896 8882 2263`

#### 1. Identitas Santri:
1. **Nama Lengkap:** (contoh: *Syafiqa Fayda Maalaika*)
2. **Nama Panggilan:** (contoh: *Alika*)
3. **Jenis Kelamin:** Perempuan / Laki-laki
4. **Tempat / Tanggal Lahir:** (contoh: *Samarinda, 30 Januari 2022*)
5. **Anak ke:** (contoh: *1 / Pertama*)
6. **Jumlah Saudara:** (contoh: *2 / Dua*)
7. **Nomor Induk Kependudukan (NIK):** 16 digit (contoh: *6472037001220001*)
8. **Alamat Rumah:**
   * a. Provinsi: *Kalimantan Timur*
   * b. Kabupaten / Kota: *Samarinda*
   * c. Kecamatan: *Samarinda Ulu*
   * d. Desa / Kelurahan: *Sidodadi / Air Putih*
   * e. Alamat Rinci: *Jl. KS Tubun Gg Jabal Noor*
9. **Kontak Telepon / WhatsApp:**
   * a. Telepon Utama (1): (contoh: *0821 8881 1615*)
   * b. Telepon Cadangan (2): (contoh: *0812 5662 7722*)

#### 2. Data Orang Tua & Wali:
10. **Data Ayah:**
    * a. Nama Ayah: (contoh: *Tomy Fahdian*)
    * b. Pekerjaan Ayah: (contoh: *Karyawan Swasta*)
    * c. Pendidikan Ayah: (contoh: *SMK / SMA*)
11. **Data Ibu:**
    * a. Nama Ibu: (contoh: *Isny Nur Khasanah*)
    * b. Pekerjaan Ibu: (contoh: *PNS / ASN*)
    * c. Pendidikan Ibu: (contoh: *Strata 1 / S1*)
12. **Data Wali (Jika tinggal bersama wali):**
    * a. Nama Wali: (contoh: *RODIYAH*)
    * b. Pekerjaan Wali: (contoh: *Ibu Rumah Tangga*)
    * c. Pendidikan Wali: (contoh: *SMA / Sederajat*)
    * d. Hubungan dengan Santri: (contoh: *Keluarga / Nenek / Tante*)

#### 3. Data Pendaftaran & Administrasi Internal Sekolah:
13. **Administrasi Penerimaan:**
    * a. Tanggal Daftar
    * b. Tanggal Masuk
    * c. NIS Lokal (Nomor Induk Santri Lokal TPQ)

---

## 🏗️ 4. Rencana Pemetaan Arsitektur Digital (Untuk Implementasi Nanti)

Saat instruksi perubahan struktur formulir online diberikan, data di atas akan diintegrasikan dengan arsitektur modern berikut:

```
[Formulir PPDB Online ppdb.html]
 ├── Tahap 1: Pilihan Jenjang & Identitas Calon Santri
 │    ├── Jenjang: PAUD Terpadu / TK (A & B) / TPQ
 │    ├── Nama Lengkap & Nama Panggilan
 │    ├── NIK (16 Digit) & Pas Foto
 │    ├── Jenis Kelamin, Tempat & Tanggal Lahir
 │    ├── Anak ke, Jumlah Saudara (Kandung/Tiri/Angkat)
 │    └── Ciri Khusus & Bahasa Sehari-hari
 │
 ├── Tahap 2: Alamat Tinggal & Logistik Transportasi
 │    ├── Jalan/RT/No, Kelurahan, Kecamatan, Kab/Kota, Provinsi
 │    ├── Jarak ke Sekolah (KM) & Transportasi (Khusus TK/PAUD)
 │    └── Nomor Kontak 1 (WhatsApp Utama) & Kontak 2 (Alternatif)
 │
 ├── Tahap 3: Data Orang Tua & Wali Santri
 │    ├── Ayah: Nama, NIK, Tempat/Tgl Lahir, Pendidikan, Pekerjaan, No. Telepon
 │    ├── Ibu: Nama, NIK, Tempat/Tgl Lahir, Pendidikan, Pekerjaan, No. Telepon
 │    └── Wali: Nama, Hubungan, Pendidikan, Pekerjaan (Opsional)
 │
 ├── Tahap 4: Upload Berkas Dokumen Fisik (Auto-Compress)
 │    ├── Pas Foto 3x4 (Background Merah/Biru/Bebas)
 │    ├── Kartu Keluarga (KK)
 │    ├── Akta Kelahiran
 │    └── Surat Pindah / Mutasi (Jika santri pindahan)
 │
 └── Tahap 5: Buat Kata Sandi Akun & Konfirmasi Pendaftaran
      ├── Kata Sandi Akun Siswa (untuk cek status & login portal)
      └── Pratinjau Resume Lengkap & Submit ke Supabase
```

### Penyimpanan Basis Data di Supabase (`ppdb_registrations`):
Kolom-kolom standar (`full_name`, `nik`, `birth_date`, `birth_place`, `gender`, `father_name`, `mother_name`, `phone`, `photo_url`, `family_card_url`, `birth_certificate_url`) akan disimpan pada kolom tabel utama, sedangkan kolom spesifik lainnya (anak ke, jumlah saudara, jarak KM, moda transportasi, riwayat mutasi, nomor kontak 2, pekerjaan & pendidikan detail orang tua) akan disimpan secara rapi di dalam kolom JSONB `form_metadata`.

---

## 📌 5. Status Dokumen
* **Status:** Tersimpan Aman & Siap Digunakan.
* **Aksi Berikutnya:** Menunggu instruksi spesifik dari pengguna untuk melakukan perubahan kode formulir antarmuka publik dan integrasi database.
