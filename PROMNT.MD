Saya sedang merancang sebuah website dan sistem informasi terintegrasi untuk sebuah Yayasan Pendidikan yang saat ini menaungi PAUD dan TK.

Saya membutuhkan bantuan Anda bukan hanya untuk membuat kode, tetapi terlebih dahulu bertindak sebagai:

1. System Analyst
2. Software Architect
3. Database Architect
4. UI/UX Designer
5. Business Process Analyst
6. Security Analyst
7. Project Manager
8. Full-Stack Web Developer
9. Technical Consultant

Tujuan utama saya adalah menghasilkan rancangan sistem yang realistis, aman, mudah dikembangkan, mudah dipelihara, dan sesuai dengan kondisi yayasan skala kecil/menengah.

==================================================
A. KONDISI DAN KONSEP SISTEM
==================================================

Website ini bukan hanya website profil sekolah, tetapi akan menjadi:

"Website Profil Yayasan + Sistem Informasi Akademik + PPDB Online + Portal Guru + Portal Administrasi + Portal Orang Tua"

Website akan memiliki bagian publik yang dapat diakses masyarakat dan bagian private yang membutuhkan login.

Yayasan saat ini hanya menaungi PAUD dan TK, sehingga sistem tidak perlu dibuat terlalu kompleks seperti sistem universitas atau sekolah menengah besar.

Namun, arsitektur sistem harus dibuat scalable sehingga apabila suatu saat yayasan menambah jenjang pendidikan, jumlah siswa, guru, atau cabang sekolah, sistem masih dapat dikembangkan.

==================================================
B. TEKNOLOGI YANG SAYA RENCANAKAN
==================================================

Untuk tahap awal saya berencana menggunakan:

- Frontend: HTML, CSS, JavaScript
- Backend: Google Apps Script
- Database awal: Google Sheets
- File/document storage: Google Drive
- Hosting/deployment awal: Google Apps Script Web App
- Domain: menggunakan domain gratis/subdomain terlebih dahulu
- Spreadsheet digunakan sebagai database awal
- Apps Script digunakan sebagai backend/API/business logic
- Google Drive digunakan untuk menyimpan dokumen dan gambar

Saya ingin Anda menilai apakah pendekatan tersebut cocok untuk yayasan PAUD/TK.

Jangan langsung menganggap Google Sheets + Apps Script sebagai solusi terbaik.

Lakukan evaluasi objektif:

1. Kelebihan
2. Kekurangan
3. Risiko
4. Risiko keamanan
5. Risiko performa
6. Risiko concurrent access
7. Batasan Google Sheets
8. Batasan Apps Script
9. Batasan Google Drive
10. Apakah cocok untuk tahap MVP
11. Apakah cocok untuk production
12. Pada skala berapa sistem sebaiknya mulai dipindahkan ke database seperti MySQL/PostgreSQL/Supabase/Firebase atau teknologi lain
13. Bagaimana membuat arsitektur awal supaya nantinya mudah dimigrasikan.

Jika menurut Anda Google Sheets + Apps Script masih layak, jelaskan cara menggunakannya secara benar.

==================================================
C. TUJUAN WEBSITE
==================================================

Website memiliki dua bagian utama:

1. PUBLIC WEBSITE
2. PRIVATE PORTAL / DASHBOARD

--------------------------------------------------
1. PUBLIC WEBSITE
--------------------------------------------------

Masyarakat umum dapat mengakses:

- Beranda
- Profil Yayasan
- Sambutan Kepala Sekolah/Yayasan
- Visi dan Misi
- Struktur Organisasi
- Informasi Sekolah
- Program Pendidikan
- Fasilitas
- Galeri Foto
- Berita
- Pengumuman
- Agenda/Kegiatan
- Kontak
- Lokasi sekolah
- Informasi PPDB
- Persyaratan pendaftaran
- Jadwal pendaftaran
- Biaya pendidikan
- FAQ
- Formulir pendaftaran siswa baru
- Cek status pendaftaran

Saya juga terbuka terhadap rekomendasi fitur publik lainnya.

--------------------------------------------------
2. PRIVATE PORTAL
--------------------------------------------------

Saya membayangkan beberapa role:

A. SUPER ADMIN / PENGELOLA YAYASAN
B. ADMINISTRASI / TU
C. GURU
D. ORANG TUA / WALI MURID
E. CALON SISWA / PENDAFTAR PPDB

Jika diperlukan, tambahkan role lain.

==================================================
D. PORTAL SUPER ADMIN / YAYASAN
==================================================

Super Admin menjadi pengelola sistem.

Fitur yang dibutuhkan:

- Dashboard
- Manajemen user
- Manajemen role
- Manajemen hak akses
- Manajemen data yayasan
- Manajemen sekolah
- Manajemen guru
- Manajemen siswa
- Manajemen orang tua
- Manajemen kelas
- Manajemen tahun ajaran
- Manajemen mata pelajaran jika diperlukan
- Manajemen informasi website
- Manajemen berita
- Manajemen pengumuman
- Manajemen galeri
- Manajemen agenda
- Manajemen PPDB
- Pengaturan status pendaftaran
- Pengaturan periode pendaftaran
- Pengaturan biaya
- Monitoring aktivitas user
- Backup data
- Log aktivitas
- Pengaturan sistem

Jelaskan fitur mana yang benar-benar diperlukan untuk PAUD/TK dan mana yang sebaiknya ditunda.

==================================================
E. PORTAL ADMINISTRASI / TU
==================================================

Portal administrasi menjadi pusat pengelolaan data operasional sekolah.

Fitur:

1. Dashboard
2. Data siswa
3. Data orang tua/wali
4. Data guru
5. Data kelas
6. Data tahun ajaran
7. Data rombel
8. Data calon siswa
9. Data PPDB
10. Verifikasi pendaftaran
11. Validasi dokumen
12. Penerimaan siswa
13. Perubahan status calon siswa
14. Konversi calon siswa menjadi siswa aktif
15. Pengelolaan data siswa
16. Pengelolaan data kelas
17. Pengelolaan status siswa
18. Pengelolaan pembayaran/SPP
19. Rekap pembayaran
20. Cetak laporan
21. Pengumuman
22. Berita sekolah
23. Agenda sekolah
24. Manajemen dokumen

Buat workflow yang jelas dari:

CALON PENDAFTAR
→ SUBMIT FORM
→ DATA MASUK
→ VERIFIKASI ADMIN
→ PERBAIKAN DATA JIKA SALAH
→ VALID
→ DITERIMA / DITOLAK
→ DAFTAR ULANG
→ MENJADI SISWA
→ MASUK KELAS
→ ORANG TUA MENDAPAT AKUN

==================================================
F. PORTAL GURU
==================================================

Guru dapat login menggunakan akun masing-masing.

Fitur yang saya pertimbangkan:

- Dashboard
- Profil guru
- Daftar kelas yang diajar
- Daftar siswa
- Presensi siswa
- Penilaian/perkembangan siswa
- Catatan perkembangan siswa
- Catatan perilaku
- Catatan kegiatan
- Pengumuman
- Agenda
- Upload dokumen jika diperlukan
- Riwayat aktivitas

Karena jenjang hanya PAUD/TK, sistem akademik jangan dibuat seperti sistem SMA/universitas.

Fokus pada:

- perkembangan anak
- kehadiran
- catatan guru
- penilaian/perkembangan
- komunikasi sekolah dengan orang tua

Berikan rekomendasi struktur data perkembangan siswa yang cocok untuk PAUD/TK.

==================================================
G. PORTAL ORANG TUA / WALI MURID
==================================================

Orang tua memiliki akun khusus.

Setelah login, orang tua hanya boleh melihat data anak yang terhubung dengan akun mereka.

Dashboard harus menampilkan:

- Nama anak
- Foto anak
- NIS/NISN jika tersedia
- Kelas
- Tahun ajaran
- Status siswa
- Nama wali
- Informasi sekolah

Fitur:

1. Data diri anak
2. Data orang tua/wali
3. Perkembangan anak
4. Catatan guru
5. Kehadiran
6. Informasi kelas
7. Pengumuman
8. Agenda
9. Status pembayaran SPP
10. Riwayat pembayaran
11. Status tunggakan
12. Dokumen siswa jika diperlukan
13. Informasi sekolah
14. Notifikasi

Orang tua TIDAK boleh:

- melihat data siswa lain
- melihat data guru secara sensitif
- mengubah data akademik
- mengubah status pembayaran
- mengakses spreadsheet
- mengakses Google Drive secara langsung
- mengakses data internal sekolah

Jika perlu perubahan data, orang tua hanya dapat mengajukan perubahan kepada admin.

==================================================
H. PORTAL PPDB ONLINE
==================================================

Buat sistem PPDB yang terintegrasi dengan website.

Alur:

1. Admin membuka periode PPDB
2. Masyarakat melihat informasi PPDB
3. Calon orang tua mengisi formulir
4. Mengupload dokumen
5. Sistem memberikan nomor pendaftaran
6. Sistem menyimpan data
7. Orang tua mendapatkan informasi/status pendaftaran
8. Admin melakukan verifikasi
9. Admin menerima / menolak / meminta perbaikan
10. Orang tua melakukan perbaikan jika diminta
11. Admin melakukan validasi ulang
12. Jika diterima → status "DITERIMA"
13. Daftar ulang
14. Jika seluruh proses selesai → data dikonversi menjadi siswa aktif
15. Sistem membuat akun orang tua
16. Sistem menghubungkan orang tua dengan siswa

Buat status workflow secara detail, misalnya:

DRAFT
SUBMITTED
WAITING_VERIFICATION
NEEDS_REVISION
VERIFIED
ACCEPTED
REJECTED
RE_REGISTRATION
ACTIVE_STUDENT

Evaluasi apakah status tersebut sudah tepat dan tambahkan jika diperlukan.

==================================================
I. SISTEM PEMBAYARAN / SPP
==================================================

Saya ingin terdapat informasi pembayaran siswa.

Untuk tahap awal, jangan langsung membuat payment gateway.

Sistem cukup menyediakan:

- Data tagihan
- Periode pembayaran
- Nominal
- Status pembayaran
- Tanggal pembayaran
- Metode pembayaran
- Bukti pembayaran jika diperlukan
- Verifikasi pembayaran
- Riwayat pembayaran
- Tunggakan
- Rekap pembayaran

Jika orang tua melakukan pembayaran manual, buat workflow:

ORANG TUA
→ melakukan pembayaran
→ upload bukti
→ status MENUNGGU VERIFIKASI
→ ADMIN memverifikasi
→ status LUNAS / DITOLAK
→ riwayat pembayaran diperbarui

Jelaskan bagaimana struktur database pembayaran harus dibuat.

==================================================
J. SISTEM DATABASE
==================================================

Ini merupakan bagian yang sangat penting.

Saya ingin seluruh sistem terintegrasi.

Jangan membuat setiap portal mempunyai database sendiri.

Buat satu sumber data utama / Single Source of Truth.

Rancang struktur database minimal:

- users
- roles
- permissions
- students
- parents
- teachers
- schools
- classes
- academic_years
- enrollments
- ppdb_registrations
- ppdb_documents
- student_documents
- attendance
- student_development
- teacher_notes
- invoices
- payments
- announcements
- news
- events
- galleries
- activity_logs
- system_settings

Evaluasi apakah tabel tersebut sudah tepat.

Jika menggunakan Google Sheets:

Tentukan:

1. Nama sheet
2. Struktur kolom
3. Primary key
4. Foreign key
5. ID format
6. Relasi antar sheet
7. Validasi data
8. Status
9. Timestamp
10. Created_by
11. Updated_by
12. Soft delete jika diperlukan

Jangan menggunakan nama siswa sebagai primary key.

Gunakan ID unik.

Contoh:

STU-2026-00001
PAR-2026-00001
TCH-2026-00001
REG-2026-00001
PAY-2026-00001

Jelaskan struktur ID yang paling baik.

==================================================
K. ARSITEKTUR SISTEM
==================================================

Buat rancangan arsitektur:

USER
↓
FRONTEND
↓
API / BACKEND
↓
BUSINESS LOGIC
↓
DATABASE
↓
FILE STORAGE

Dalam versi awal:

Frontend
HTML + CSS + JavaScript

Backend
Google Apps Script

Database
Google Sheets

File Storage
Google Drive

Jelaskan bagaimana frontend berkomunikasi dengan Apps Script.

Jelaskan apakah menggunakan:

google.script.run

atau

Web App API / doGet / doPost

atau kombinasi keduanya.

Jelaskan kapan masing-masing digunakan.

==================================================
L. KEAMANAN
==================================================

Ini adalah bagian KRITIS.

Website akan menangani data anak, orang tua, guru, pembayaran, dan dokumen.

Saya ingin Anda membuat security architecture.

Bahas:

- Authentication
- Authorization
- Role-Based Access Control
- Session management
- Password security
- Password hashing
- Token
- CSRF
- XSS
- SQL Injection jika database berubah
- API security
- File upload security
- Google Drive access
- Data validation
- Rate limiting
- Audit log
- Backup
- Recovery
- Least privilege
- Data isolation antar orang tua
- Data isolation antar role
- Admin security
- Logout
- Session timeout
- Failed login protection

Jangan menyimpan password plaintext.

Jika Google Sheets digunakan sebagai database, jelaskan bagaimana keamanan password sebaiknya dilakukan.

Jika Apps Script tidak ideal untuk autentikasi custom, berikan alternatif seperti:

- Google Identity
- Firebase Authentication
- Supabase Auth
- atau sistem autentikasi lain

Bandingkan dan berikan rekomendasi.

==================================================
M. GOOGLE DRIVE
==================================================

Saya ingin Google Drive digunakan untuk:

- Foto siswa
- Foto guru
- Dokumen PPDB
- Bukti pembayaran
- Dokumen sekolah
- Galeri

Buat sistem folder yang rapi.

Contoh:

YAYASAN/
├── PPDB/
│   └── 2026/
├── SISWA/
│   ├── STU-2026-00001/
│   └── STU-2026-00002/
├── GURU/
├── PEMBAYARAN/
├── GALERI/
└── DOKUMEN_SEKOLAH/

Namun jangan langsung menerima struktur ini.

Evaluasi dan buat struktur folder terbaik.

Jelaskan juga:

- siapa yang boleh mengakses file
- apakah file dibuat public atau private
- bagaimana frontend mengambil file
- apakah URL Drive boleh langsung diberikan
- bagaimana mencegah file sensitif dapat diakses sembarang orang
- bagaimana menangani upload
- validasi MIME type
- ukuran file
- nama file
- duplicate file
- backup

==================================================
N. FRONTEND
==================================================

Buat rekomendasi teknologi frontend.

Pertimbangkan:

Option A:
HTML + CSS + Vanilla JavaScript

Option B:
Bootstrap + JavaScript

Option C:
Tailwind CSS + JavaScript

Option D:
React

Option E:
Vue

Karena saya masih mengembangkan sistem sendiri dan ingin mudah dipelajari serta murah, berikan rekomendasi paling realistis.

Website harus responsive:

Desktop
Tablet
Mobile

Buat desain UI/UX yang:

- profesional
- bersih
- modern
- ramah sekolah
- tidak terlalu ramai
- mudah digunakan guru
- mudah digunakan orang tua
- mudah digunakan admin

==================================================
O. BACKEND
==================================================

Jelaskan struktur Apps Script yang ideal.

Jangan membuat satu file Code.gs berisi ribuan baris.

Buat modular architecture.

Contoh:

Code.gs
Config.gs
Auth.gs
UserService.gs
StudentService.gs
ParentService.gs
TeacherService.gs
PPDBService.gs
PaymentService.gs
FileService.gs
NotificationService.gs
ReportService.gs
Utils.gs

Evaluasi struktur tersebut dan perbaiki jika diperlukan.

==================================================
P. API DESIGN
==================================================

Buat rancangan API/service endpoint.

Contoh:

login
logout
getCurrentUser
getStudent
getStudents
getParentChildren
getTeacherClasses
submitPPDB
uploadDocument
verifyPPDB
acceptPPDB
rejectPPDB
createPayment
verifyPayment
getPaymentStatus
getAnnouncements
getNews
getEvents

Tetapi jangan menerima contoh tersebut mentah-mentah.

Buat API contract yang lebih baik.

Untuk setiap endpoint/service jelaskan:

- Method
- Input
- Output
- Role yang boleh mengakses
- Validation
- Error response

==================================================
Q. WORKFLOW
==================================================

Buat workflow lengkap untuk:

1. Registrasi akun
2. Login
3. Logout
4. PPDB
5. Verifikasi PPDB
6. Penerimaan siswa
7. Daftar ulang
8. Konversi calon siswa menjadi siswa
9. Pembuatan akun orang tua
10. Guru login
11. Guru mengisi perkembangan siswa
12. Orang tua melihat perkembangan
13. Pembayaran SPP
14. Verifikasi pembayaran
15. Upload dokumen
16. Pengelolaan berita
17. Pengelolaan pengumuman
18. Pengelolaan galeri
19. Pengelolaan agenda
20. Perubahan data siswa
21. Backup
22. Restore
23. Penghapusan data
24. Deaktivasi akun

Gunakan format:

ACTOR
↓
ACTION
↓
SYSTEM PROCESS
↓
DATABASE
↓
RESULT

==================================================
R. PRD
==================================================

Buat Product Requirements Document lengkap.

Struktur:

1. Product Overview
2. Background
3. Problem Statement
4. Objectives
5. Target Users
6. User Roles
7. User Personas
8. Scope
9. Out of Scope
10. Functional Requirements
11. Non-Functional Requirements
12. Feature Priorities
13. User Stories
14. Acceptance Criteria
15. Business Rules
16. Security Requirements
17. Data Requirements
18. Integration Requirements
19. Reporting Requirements
20. Future Development

Gunakan prioritas:

P0 = wajib
P1 = penting
P2 = dapat ditunda
P3 = future

==================================================
S. SRD / SOFTWARE REQUIREMENTS DOCUMENT
==================================================

Buat SRD lengkap.

Minimal berisi:

1. System Overview
2. System Architecture
3. Functional Requirements
4. Non-functional Requirements
5. User Roles
6. Authentication
7. Authorization
8. Database Requirements
9. API Requirements
10. File Management
11. Security Requirements
12. Logging
13. Backup
14. Error Handling
15. Performance
16. Availability
17. Scalability
18. Browser Compatibility
19. Mobile Compatibility
20. Deployment
21. Maintenance
22. Migration Strategy

Setiap requirement diberi ID.

Contoh:

FR-AUTH-001
FR-PPDB-001
FR-STUDENT-001
FR-PAYMENT-001

==================================================
T. DATABASE DESIGN
==================================================

Buat:

1. ERD
2. Entity list
3. Relationship
4. Primary key
5. Foreign key
6. Cardinality
7. Data dictionary
8. Struktur Google Sheets

Gunakan konsep relational database meskipun database awal saya menggunakan Google Sheets.

Tujuannya agar nantinya dapat dimigrasikan ke MySQL/PostgreSQL/Supabase.

==================================================
U. USER ROLE MATRIX
==================================================

Buat tabel:

Feature | Super Admin | Admin/TU | Guru | Orang Tua | Pendaftar

Gunakan:

CRUD
View
Approve
Reject
Verify
No Access

Pastikan setiap role memiliki least privilege.

==================================================
V. DASHBOARD
==================================================

Rancang dashboard masing-masing role.

SUPER ADMIN:

- total siswa
- guru
- kelas
- PPDB
- pembayaran
- aktivitas sistem

ADMIN:

- siswa
- calon siswa
- PPDB menunggu verifikasi
- pembayaran menunggu verifikasi
- pengumuman
- tugas administrasi

GURU:

- kelas
- jumlah siswa
- presensi
- perkembangan siswa
- catatan

ORANG TUA:

- data anak
- kehadiran
- perkembangan
- pembayaran
- pengumuman

==================================================
W. NOTIFICATION SYSTEM
==================================================

Berikan rekomendasi notifikasi.

Contoh:

- PPDB berhasil
- PPDB perlu diperbaiki
- PPDB diterima
- PPDB ditolak
- pembayaran diterima
- pembayaran ditolak
- pengumuman sekolah
- perkembangan siswa diperbarui

Evaluasi apakah cukup menggunakan:

- notifikasi di website
- email
- WhatsApp

Untuk WhatsApp, jelaskan bahwa integrasi resmi membutuhkan API/provider dan jangan menggunakan metode ilegal/spam.

==================================================
X. LAPORAN
==================================================

Buat daftar laporan yang dibutuhkan.

Contoh:

- Daftar siswa
- Daftar guru
- Daftar kelas
- Rekap PPDB
- Rekap siswa diterima
- Rekap pembayaran
- Rekap tunggakan
- Rekap presensi
- Rekap perkembangan siswa
- Aktivitas admin

Jelaskan format export:

PDF
Excel
CSV

==================================================
Y. MVP
==================================================

Saya tidak ingin langsung membuat semua fitur.

Buat roadmap:

PHASE 0
Planning

PHASE 1
Public Website

PHASE 2
Authentication

PHASE 3
Database Core

PHASE 4
PPDB

PHASE 5
Admin Portal

PHASE 6
Teacher Portal

PHASE 7
Parent Portal

PHASE 8
Payment

PHASE 9
Reporting

PHASE 10
Security Hardening

PHASE 11
Testing

PHASE 12
Production

Tentukan fitur yang masuk setiap fase.

==================================================
Z. REKOMENDASI MIGRASI
==================================================

Buat strategi:

STAGE 1
Google Sheets + Apps Script + Drive

STAGE 2
Database cloud

STAGE 3
Backend production

STAGE 4
Scaling

Tentukan indikator kapan saya harus berpindah dari Google Sheets.

Contoh:

- jumlah siswa
- jumlah transaksi
- jumlah concurrent users
- ukuran database
- performa
- kebutuhan query
- keamanan
- kebutuhan audit

==================================================
AA. HAL YANG SAYA BUTUHKAN DARI ANDA
==================================================

Jangan langsung memberikan kode.

Pertama-tama lakukan ANALISIS.

Saya ingin output pertama berupa:

1. Evaluasi konsep saya
2. Masalah potensial
3. Kekurangan konsep
4. Risiko teknis
5. Risiko keamanan
6. Rekomendasi arsitektur
7. Rekomendasi teknologi
8. Rekomendasi database
9. Rekomendasi authentication
10. Rekomendasi storage
11. Struktur portal
12. Struktur fitur
13. Struktur database
14. Data flow
15. Workflow
16. PRD
17. SRD
18. Roadmap pengerjaan
19. MVP
20. Future development

==================================================
AB. ATURAN PENTING
==================================================

Jangan:

- langsung membuat kode
- menganggap semua ide saya benar
- membuat sistem terlalu kompleks
- menggunakan teknologi mahal tanpa alasan
- menggunakan database berbeda untuk setiap portal
- menyimpan password plaintext
- membuat data siswa dapat diakses secara publik
- memberikan akses langsung Google Sheets kepada user
- memberikan akses publik ke dokumen siswa
- membuat URL file sensitif dapat diakses siapa saja
- menggunakan nama siswa sebagai primary key
- mencampurkan business logic dengan UI
- membuat satu file backend terlalu besar
- membuat setiap fitur berdiri sendiri tanpa integrasi

Anda harus:

- berpikir sebagai system architect
- mempertimbangkan keamanan data anak
- menggunakan RBAC
- menggunakan unique ID
- menggunakan audit log
- menggunakan validation
- menggunakan error handling
- menggunakan backup
- menggunakan modular architecture
- menggunakan single source of truth
- membuat sistem scalable
- mempertimbangkan mobile
- mempertimbangkan migrasi database
- mempertimbangkan biaya
- mempertimbangkan kemampuan developer solo
- menjelaskan trade-off setiap keputusan

==================================================
AC. HASIL AKHIR
==================================================

Saya ingin Anda menghasilkan dokumen perencanaan yang dapat saya gunakan sebagai "blueprint" pembangunan website.

Urutan output:

PART 1 — Executive Summary

PART 2 — Problem Analysis

PART 3 — System Goals

PART 4 — User & Role Analysis

PART 5 — Portal Architecture

PART 6 — Feature Architecture

PART 7 — System Architecture

PART 8 — Technology Stack Recommendation

PART 9 — Database Architecture

PART 10 — Google Sheets Database Design

PART 11 — Google Drive Architecture

PART 12 — Authentication & Authorization

PART 13 — Security Architecture

PART 14 — API Architecture

PART 15 — Data Flow

PART 16 — Complete Workflow

PART 17 — ERD Description

PART 18 — User Role Matrix

PART 19 — PRD

PART 20 — SRD

PART 21 — UI/UX Structure

PART 22 — Dashboard Structure

PART 23 — Reporting System

PART 24 — Notification System

PART 25 — MVP

PART 26 — Development Roadmap

PART 27 — Testing Strategy

PART 28 — Deployment Strategy

PART 29 — Backup & Disaster Recovery

PART 30 — Migration Strategy

PART 31 — Risks & Mitigation

PART 32 — Final Technology Recommendation

==================================================
AD. CARA MENJAWAB
==================================================

Gunakan bahasa Indonesia.

Gunakan bahasa yang mudah dipahami developer pemula-menengah tetapi tetap profesional.

Jangan terlalu banyak menggunakan istilah teknis tanpa penjelasan.

Jika menggunakan istilah seperti:

API
REST
CRUD
RBAC
JWT
OAuth
Hashing
Session
Webhook
Endpoint
ERD
Foreign Key
Primary Key

jelaskan secara singkat.

Jika terdapat beberapa pilihan teknologi, buat perbandingan:

OPTION
KELEBIHAN
KEKURANGAN
BIAYA
TINGKAT KESULITAN
KEAMANAN
SCALABILITY
REKOMENDASI

Berikan keputusan akhir.

Jangan hanya mengatakan "tergantung".

Jika terdapat masalah pada konsep saya, katakan dengan jelas:

"Ini sebaiknya diubah karena..."

Jika ada fitur yang belum saya pikirkan tetapi penting, tambahkan dan jelaskan alasannya.

==================================================
AE. KONTEKS DEVELOPER
==================================================

Saya adalah developer yang masih membangun sistem secara mandiri.

Saya ingin:

- biaya serendah mungkin
- menggunakan teknologi yang dapat saya pelajari
- sistem mudah dirawat
- tidak terlalu kompleks
- dapat digunakan secara nyata
- dapat dikembangkan
- dapat dimigrasikan
- memiliki keamanan yang cukup baik
- dapat digunakan melalui smartphone
- tidak bergantung pada server mahal

Namun saya juga tidak ingin membuat sistem yang dari awal sudah salah secara arsitektur.

Karena itu, prioritaskan:

SIMPLICITY
+
SECURITY
+
MAINTAINABILITY
+
SCALABILITY
+
LOW COST

Jangan mengorbankan keamanan hanya demi murah.

==================================================
AF. TUGAS PERTAMA
==================================================

Sebelum membuat kode apa pun, lakukan analisis menyeluruh terhadap konsep ini.

Kemudian berikan rekomendasi:

"Jika saya berada di posisi Anda dan harus membangun sistem ini dari nol, inilah arsitektur yang akan saya pilih."

Jelaskan secara konkret:

Frontend menggunakan apa?
Backend menggunakan apa?
Database menggunakan apa?
Authentication menggunakan apa?
File storage menggunakan apa?
Hosting menggunakan apa?
API menggunakan apa?
Security menggunakan apa?
Deployment menggunakan apa?

Kemudian jelaskan:

"Mengapa pilihan tersebut paling masuk akal untuk yayasan PAUD/TK pada tahap awal?"

Setelah itu buat:

1. MASTER WORKFLOW
2. SYSTEM ARCHITECTURE
3. DATABASE ARCHITECTURE
4. PRD
5. SRD
6. DEVELOPMENT ROADMAP

Jangan membuat kode sampai saya memberikan instruksi berikutnya.