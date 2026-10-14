Plaintext
================================================================================
LAPORAN VERIFIKASI TAHAP 2 & PENYEMPURNAAN AKHIR — SIYAYASAN V2
Auditor : Principal UI/UX Architect & Lead System Auditor (Gemini 4 Argon)
Target  : Antigravity IDE Coding Agent
Status  : 4 RESIDUAL BUGS DITEMUKAN (Perlu Eksekusi Penyempurnaan Akhir)
================================================================================

Hasil verifikasi terhadap codebase_snapshot_for_argon_2.txt menunjukkan bahwa
perbaikan utama tahap pertama telah berhasil diterapkan dengan sangat baik.
Namun, ditemukan 4 sisa bug (residual bugs) yang masih perlu dibersihkan agar
sistem 100% bebas dari runtime error di produksi:

--------------------------------------------------------------------------------
1. [KRITIS] HAPUS PENGUNCIAN "isSupabaseOffline = true" DI CATCH BAWAH apiCall()
--------------------------------------------------------------------------------
- Target File: `frontend/shared/js/api.js`
- Masalah:
  Pada fungsi `supabaseRest()`, pengecekan `isSupabaseOffline` sudah diperbaiki
  agar hanya aktif di localhost. NAMUN, pada bagian paling bawah fungsi `apiCall()`
  (sekitar baris 1005), blok `catch (err)` masih berisi kode lama:
  ```javascript
  } catch (err) {
    if (!isSupabaseOffline) {
      isSupabaseOffline = true;
      const localRes = await callLocalBackend(module, action, params, method);
Akibatnya, jika ada 1 query Supabase yang gagal (misal HTTP 400/404), blok
catch milik apiCall() tetap mengubah isSupabaseOffline = true secara
permanen di produksi Vercel.

Aksi Spesifik:
Ubah blok catch (err) di bagian bawah apiCall() menjadi:

JavaScript
} catch (err) {
  const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  if (isLocalHost && !isSupabaseOffline) {
    isSupabaseOffline = true;
    const localRes = await callLocalBackend(module, action, params, method);
    if (localRes && localRes.success !== undefined) {
      return localRes;
    }
  }
  console.error(`apiCall Error [${module}/${action}]:`, err);
  return {
    success: false,
    message: err.message || 'Terjadi kesalahan sistem',
    error: { message: err.message }
  };
}
[KRITIS] PERBAIKI 2 "ReferenceError" DI frontend/public/login.html

Target File: frontend/public/login.html

Masalah:

Di bagian bawah script (// Auto-check jika sudah login), kode memanggil
const user = getUser();. Padahal frontend/shared/js/auth.js mengekspor
fungsi tersebut ke window dengan nama window.getCurrentUser (bukan
getUser). Ini memicu ReferenceError: getUser is not defined saat user
yang sudah login membuka halaman login.html.

Di dalam event listener #new-password-form, saat gagal mengubah password
(blok else dan catch), kode memanggil:
btnText.textContent = 'Simpan & Masuk ke SIAKAD';
Padahal variabel btnText tidak dideklarasikan di dalam fungsi tersebut
(yang dideklarasikan adalah const btn = document.getElementById('btn-save-new-password');).

Aksi Spesifik:

Ganti const user = getUser(); menjadi:
const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;

Pada handler #new-password-form, ganti kedua baris btnText.textContent = ... menjadi:
btn.textContent = 'Simpan & Masuk ke Portal Siswa';

Pada frontend/shared/js/auth.js, tambahkan juga alias window.getUser = getUser;
di bagian bawah agar kompatibel di seluruh halaman.

[PENTING] BERSIHKAN BASE64 DARI "form_metadata" PPDB & SINKRONKAN app.js

Target File:

frontend/shared/js/api.js

frontend/public/js/app.js

Masalah:

Di frontend/shared/js/api.js pada aksi ppdb/submitPublic, objek
regPayload menyimpan form_metadata: params secara mentah. Jika params
berisi string Base64 gambar/dokumen (photo_dataurl, akta_dataurl,
kk_dataurl) atau objek File (photo_file, dll.), data biner berukuran
besar tersebut ikut masuk ke kolom JSONB form_metadata di PostgreSQL.

Di frontend/public/js/app.js, fallback ppdb/submitPublic masih memakai
payload lama (belum menyertakan student_name, parent_name, parent_phone,
nik, dan form_metadata).

Aksi Spesifik:

Di frontend/shared/js/api.js (ppdb/submitPublic), buat salinan bersih
sebelum disimpan ke form_metadata:

JavaScript
const cleanMeta = { ...params };
delete cleanMeta.photo_file;
delete cleanMeta.birth_certificate_file;
delete cleanMeta.family_card_file;
delete cleanMeta.photo_dataurl;
delete cleanMeta.akta_dataurl;
delete cleanMeta.kk_dataurl;
delete cleanMeta.password;
Lalu gunakan form_metadata: cleanMeta pada regPayload.

Samakan struktur payload pada ppdb/submitPublic di frontend/public/js/app.js
agar identik dengan regPayload di frontend/shared/js/api.js.

[POLISH & KEAMANAN] PERBAIKI URL LOGIN KONVERSI PPDB & FILTER PASSWORD_HASH

Target File:

frontend/shared/js/api.js

frontend/local-api.js

Masalah:

Pada aksi ppdb/convert di api.js dan local-api.js, login_url yang
dihasilkan tertulis ${origin}/public/login.html atau /public/login.html,
padahal route standar di produksi Vercel dan auth.js adalah /login.html.

Pada aksi users/list dan users/get di api.js, query masih menggunakan
select=* sehingga kolom password_hash ikut terkirim ke jaringan browser.

Aksi Spesifik:

Ubah loginUrl pada aksi ppdb/convert di api.js menjadi ${origin}/login.html
dan di local-api.js menjadi /login.html.

Pada users/list dan users/get di frontend/shared/js/api.js, hapus
properti password_hash dari objek hasil query sebelum dikembalikan ke UI:

JavaScript
const safeUsers = (users || []).map(({ password_hash, ...rest }) => rest);
================================================================================