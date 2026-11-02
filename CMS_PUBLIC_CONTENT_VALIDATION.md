# MATRIKS VALIDASI LAPANGAN KONTEN CMS & WEBSITE PUBLIK
## Bidirectional CMS Content & Public Website Verification Matrix
**Proyek:** Sistem Informasi Yayasan At Tarbiyyah Wijaya Kusuma Samarinda (SIYAYASAN)  
**Dokumen:** `CMS_PUBLIC_CONTENT_VALIDATION.md`  
**Status:** Audit Lapangan Selesai (100% Berbasis Bukti Nyata & Query Live Database)  
**Tanggal:** 2 November 2026  
**Auditor:** Tim Arsitektur Sistem & Rekayasa Frontend SIYAYASAN  

---

## 1. PANDUAN STATUS VALIDASI (VALIDATION CRITERIA)

Setiap elemen antarmuka CMS dan representasinya di halaman publik diuji dan diklasifikasikan ke dalam 4 status:
- **`VERIFIED`**: Alur data dari form admin $\rightarrow$ database $\rightarrow$ halaman publik terbukti berjalan 100% akurat, aman, dan langsung tercermin pada tampilan pengunjung.
- **`PARTIALLY VERIFIED`**: Data berhasil tersimpan dan tampil di publik, namun terdapat kompromi kualitas (misal: formatting paragraf terbatas, workaround mapping di API, atau ketergantungan cache).
- **`FAILED`**: Ditemukan kegagalan integrasi, gambar tidak muncul sehingga sistem memunculkan fallback hardcoded, skema database tidak cocok, atau penyimpanan data yang merusak performa (seperti raw Base64 di database).
- **`NOT VERIFIED`**: Fitur formulir tersedia di admin namun belum memiliki tabel pendukung aktif atau belum ada implementasi DOM di halaman publik.

---

## 2. MATRIKS VALIDASI DUA ARAH (BIDIRECTIONAL TRACEABILITY MATRIX)

| ID | Modul CMS | Field Input Admin | Kolom Database & Tipe Data | Endpoint PostgREST API | Target Halaman Publik | Target Elemen DOM Publik | Status Validasi | Bukti Teknis & Catatan Lapangan |
|:--:|:---|:---|:---|:---|:---|:---|:---:|:---|
| **V-01** | Berita | Judul Berita (`#news-title`) | `public.news.title` (TEXT) | `/rest/v1/news` (POST/PATCH) | `index.html`, `berita.html`, `detail.html` | `.news-card h3`, `#article-title` | **`VERIFIED`** | Judul berita tersimpan utuh dan dirender via `.textContent` (aman dari XSS). |
| **V-02** | Berita | Kategori (`#news-category`) | `public.news.category` (TEXT) | `/rest/v1/news` | `berita.html`, `detail.html` | `.news-category-badge`, `#article-category` | **`VERIFIED`** | Kategori ("PPDB", dll.) tersimpan dan muncul di badge kartu serta filter kategori. |
| **V-03** | Berita | Isi Berita (`#news-content`) | `public.news.content` (TEXT) | `/rest/v1/news` | `detail.html` | `#article-body` | **`PARTIALLY VERIFIED`** | Teks tersimpan lengkap, namun hanya textarea biasa. Pemisahan paragraf mengandalkan newline replace ganda. Tidak ada WYSIWYG. |
| **V-04** | Berita | Gambar Utama / Thumbnail (`#news-image`) | `public.news.image` (TEXT / URL) | `/storage/v1/object/siyayasan-uploads` lalu `/rest/v1/news` | `index.html`, `berita.html`, `detail.html` | `.news-card img`, `#article-hero-img` | **`FAILED`** | Pada record riil `NWS-1793241017163`, kolom `image` bernilai kosong (`null`/`""`). Publik merender fallback gambar hardcoded `images/school-campus.jpg`. |
| **V-05** | Berita | Status Publikasi (`#news-status`) | `public.news.status` (TEXT) & `is_published` (BOOL) | `/rest/v1/news` | `berita.html`, `app.js` | Filter query: `status=eq.published&is_published=eq.true` | **`VERIFIED`** | Berita draft atau archived tidak bocor ke halaman publik. |
| **V-06** | Pengumuman | Judul (`#announcement-title`) | `public.announcements.title` (TEXT) | `/rest/v1/announcements` | `pengumuman.html` | `.announcement-card h3` | **`VERIFIED`** | Judul muncul akurat di kartu pengumuman publik. |
| **V-07** | Pengumuman | Kategori Pengumuman (`#announcement-category`) | **TIDAK ADA KOLOM `category` DI DATABASE** | `/rest/v1/announcements` | `pengumuman.html` | Badge kategori pengumuman | **`FAILED`** | Form mengirim `category`, tapi tabel fisik hanya punya `target_audience`. Query langsung via `category=eq...` menghasilkan HTTP 400 Bad Request. Ditangani sementara via adaptor di `api.js`. |
| **V-08** | Pengumuman | Sematkan / Pinned (`#announcement-is-pinned`) | `public.announcements.is_pinned` (BOOL) | `/rest/v1/announcements` | `pengumuman.html` | Badge "PENTING" & Urutan Teratas | **`VERIFIED`** | Query `order=is_pinned.desc,published_at.desc` menempatkan pengumuman pinned di urutan pertama. |
| **V-09** | Pengumuman | Isi Pengumuman (`#announcement-content`) | `public.announcements.content` (TEXT) | `/rest/v1/announcements` | `pengumuman.html` | `.announcement-body` | **`VERIFIED`** | Isi pengumuman dirender utuh pada modal dan accordion publik. |
| **V-10** | Banner Hero | Slide 1 (URL Storage) | `web_settings.hero_images[0].url` (TEXT) | `/rest/v1/web_settings?id=eq.default` | `index.html` | `#heroCarousel .swiper-slide:nth-child(1)` | **`VERIFIED`** | URL berupa storage bucket publik (`hero_slide_1792469386750_srz5t.jpg`), ter-render sempurna dan cepat. |
| **V-11** | Banner Hero | Slide 2 (Base64 Raksasa) | `web_settings.hero_images[1].url` (TEXT) | `/rest/v1/web_settings?id=eq.default` | `index.html` | `#heroCarousel .swiper-slide:nth-child(2)` | **`FAILED`** | Nilai berupa **Raw Base64 sepanjang 2.195.451 karakter (~2,2 MB)**! Menyebabkan query lambat dan simpan pengaturan macet. |
| **V-12** | Banner Hero | Slide 3 & 4 (Base64) | `web_settings.hero_images[2..3].url` (TEXT) | `/rest/v1/web_settings?id=eq.default` | `index.html` | `#heroCarousel .swiper-slide:nth-child(3..4)` | **`FAILED`** | Masing-masing bernilai Base64 >129 KB. Gagal terunggah ke storage bucket sehingga fallback ke data URL. |
| **V-13** | Banner Hero | Judul & Deskripsi Slide (`#slide-title`, `#slide-desc`) | `web_settings.hero_images[i].title` & `.desc` | `/rest/v1/web_settings?id=eq.default` | `index.html` | `.hero-slide-content h1`, `.hero-slide-content p` | **`VERIFIED`** | Teks judul slide ("Suasana", "mushola") muncul sesuai input admin. |
| **V-14** | Identitas | Nama Yayasan / Sekolah (`#school-name`) | `schools.name` & `web_settings.school_name` | `/rest/v1/schools` & `/rest/v1/web_settings` | `public-shell.js`, semua halaman | `.brand-name`, `.footer-school-name`, `<title>` | **`PARTIALLY VERIFIED`** | Tampil seragam "YAYASAN AT TARBIYYAH WIJAYA KUSUMA SAMARINDA", namun disimpan redundan di 2 tabel berbeda. |
| **V-15** | Identitas | Alamat Lengkap (`#school-address`) | `schools.address` & `web_settings.address` | `/rest/v1/schools` & `/rest/v1/web_settings` | `public-shell.js`, `kontak.html` | `.footer-address`, `#contact-address` | **`VERIFIED`** | Alamat Jl. Wijaya Kusuma V-A No. 38 tersinkronisasi akurat ke footer dan halaman kontak. |
| **V-16** | Identitas | Nomor Telepon & WhatsApp (`#school-phone`, `#school-wa`) | `schools.phone`, `schools.whatsapp_number`, `web_settings.phone`, `web_settings.whatsapp` | `/rest/v1/schools` & `/rest/v1/web_settings` | `public-shell.js`, `kontak.html` | `.footer-phone`, `.footer-wa`, CTA WhatsApp | **`VERIFIED`** | Terhubung ke nomor 0813-4714-2829 / 6281347142829. Klik tombol WA mengarah ke link resmi. |
| **V-17** | Identitas | Email Resmi (`#school-email`) | `schools.email` & `web_settings.email` | `/rest/v1/schools` & `/rest/v1/web_settings` | `public-shell.js`, `kontak.html` | `.footer-email`, `#contact-email` | **`VERIFIED`** | Terhubung ke info@attarbiyyah-samarinda.sch.id. |
| **V-18** | Identitas | Struktur Organisasi (5 Pimpinan) | `schools.pembina`, `pengawas`, `ketua_yayasan`, `sekretaris`, `bendahara` | `/rest/v1/schools?id=eq.SCH-001` | `profil.html` | `#org-structure .org-card` | **`PARTIALLY VERIFIED`** | Kelima nama pimpinan tampil sesuai, namun foto pimpinan tertanam dalam JSON Base64 di `schools.wa_gateway_token` (3,2 MB). |
| **V-19** | Pengaturan Web | Tautan Facebook (`#setting-fb`) | `web_settings.facebook_url` (TEXT) | `/rest/v1/web_settings?id=eq.default` | `public-shell.js` (Footer & Header) | `a.social-fb` | **`VERIFIED`** | Tersinkron ke `https://facebook.com/attarbiyyah.samarinda`. Fallback hardcoded berhasil ditimpa. |
| **V-20** | Pengaturan Web | Tautan Instagram (`#setting-ig`) | `web_settings.instagram_url` (TEXT) | `/rest/v1/web_settings?id=eq.default` | `public-shell.js` (Footer & Header) | `a.social-ig` | **`VERIFIED`** | Tersinkron ke `https://instagram.com/attarbiyyah.smd`. |
| **V-21** | Pengaturan Web | Tautan YouTube (`#setting-yt`) | `web_settings.youtube_url` (TEXT) | `/rest/v1/web_settings?id=eq.default` | `public-shell.js` (Footer & Header) | `a.social-yt` | **`VERIFIED`** | Tersinkron ke `https://youtu.be/TwMZEbDbi3c?si=9WasYWL8r7eheKXh`. |
| **V-22** | Pengaturan Web | Peta Google Maps Embed (`#setting-maps-embed`) | `web_settings.maps_embed_url` (TEXT) | `/rest/v1/web_settings?id=eq.default` | `kontak.html` | `#maps-iframe` | **`VERIFIED`** | Iframe Google Maps aktif dan menampilkan titik lokasi Samarinda Ulu secara presisi. |
| **V-23** | Pengaturan Web | Jam Operasional (`#setting-op-hours`) | `web_settings.announcement_banner` (JSON) | `/rest/v1/web_settings?id=eq.default` | `public-shell.js` (Footer), `kontak.html` | `.footer-op-hours`, `#contact-op-hours` | **`PARTIALLY VERIFIED`** | Tampil di publik, namun disimpan di dalam kolom serialized JSON bayangan bersama Base64 lain. |
| **V-24** | Galeri Foto | Judul & Kategori Galeri (`#gallery-title`, `#gallery-cat`) | `galleries.title`, `galleries.category` | `/rest/v1/galleries` | `index.html`, `galeri.html` | `.gallery-item h4`, `.gallery-item .badge` | **`VERIFIED`** | Judul dan badge kategori ("PPDB") tampil pada kartu galeri. |
| **V-25** | Galeri Foto | File Gambar Galeri (`#gallery-file`) | `galleries.image_url` (TEXT) | `/rest/v1/galleries` | `index.html`, `galeri.html` | `.gallery-item img` | **`FAILED`** | Kedua data riil (`GAL-1793622084947` dan `GAL-1793622064316`) menyimpan **Base64 string ~800 KB per item**. |
| **V-26** | Agenda / Event | Judul, Tanggal & Lokasi Agenda | `events.title`, `event_date`, `time_start`, `location` | `/rest/v1/events` | `index.html`, `agenda.html` | `.event-item` | **`VERIFIED`** | Data riil `EVT-1793246625986` ("PENERIMAAN SISWA BARU TELAH DIBUKA", 30 Okt 2026, Lingkungan Yayasan) tersinkronisasi 100%. |

---

## 3. STATISTIK HASIL VALIDASI LAPANGAN

Dari total **26 titik integrasi data CMS** yang diperiksa secara ketat:
- **`VERIFIED` (Terkonfirmasi Sempurna):** **17 item (65,4%)**  
  Alur teks, judul, tanggal, status terbit, tautan media sosial, iframe maps, dan agenda kegiatan bekerja dengan benar dan aman.
- **`PARTIALLY VERIFIED` (Terkonfirmasi dengan Catatan/Kelemahan Teknis):** **4 item (15,4%)**  
  Meliputi dual-store identitas sekolah, struktur organisasi via shadow dump, jam operasional di JSON banner, dan formatting konten berita yang masih polos.
- **`FAILED` (Gagal / Anomali Arsitektural / Base64 Bloat):** **5 item (19,2%)**  
  Meliputi thumbnail berita yang kosong sehingga memicu fallback hardcoded bawaan template, tumpukan Base64 raksasa pada banner hero (slide 2, 3, 4), skema kategori pengumuman yang tidak ada di PostgreSQL, dan penyimpanan Base64 pada galeri foto.

---

## 4. KESIMPULAN VALIDASI LAPANGAN

Secara struktural, jembatan antara Portal Admin CMS dan Halaman Publik SIYAYASAN **sudah terbangun dan berfungsi**. Kegagalan dan anomali yang terjadi bukan disebabkan oleh terputusnya koneksi antara admin dan publik, melainkan akibat:
1. **Fallback Diam-Diam (*Silent Fallback*) ke Base64 saat Upload Storage Gagal**: Menyebabkan database menampung jutaan karakter string gambar yang memperlambat sistem.
2. **Fallback Gambar Hardcoded Bawaan Template**: Memunculkan gambar statis bawaan saat gambar database kosong.
3. **Penyalahgunaan Kolom Database sebagai Shadow Dump JSON**: Menyimpan ribuan kilobyte data di kolom yang tidak semestinya (`wa_gateway_token` dan `announcement_banner`).

Seluruh solusi untuk memperbaiki status `FAILED` dan `PARTIALLY VERIFIED` menjadi `VERIFIED` 100% telah dirancang dalam dokumen **`CMS_CONTENT_IMPROVEMENT_PLAN.md`**.

