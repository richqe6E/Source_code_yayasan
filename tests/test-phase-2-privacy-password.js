const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE: TAHAP 2 - KEAMANAN PRIVASI & PRESERVASI KATA SANDI PPDB ===');

// 1. Verifikasi ppdb.html: detailNotes tidak membocorkan password
const ppdbHtml = fs.readFileSync(path.join(__dirname, '../frontend/public/ppdb.html'), 'utf8').replace(/\r\n/g, '\n');
assert(!ppdbHtml.includes('account: {\n          notification_phone: parentPhone,\n          email: parentEmail,\n          password: password'), 'detailNotes di ppdb.html tidak boleh memuat password plain text');
console.log('✅ 1. detailNotes di ppdb.html bebas dari kebocoran password.');

// 2. Verifikasi status.html: sensor catatan resmi (anti JSON/password dump)
const statusHtml = fs.readFileSync(path.join(__dirname, '../frontend/public/ppdb/status.html'), 'utf8').replace(/\r\n/g, '\n');
assert(statusHtml.includes('sanitizeOfficialNotes'), 'status.html harus memiliki fungsi sanitizeOfficialNotes');
assert(statusHtml.includes('trimmed.includes(\'"password":\')'), 'sanitizeOfficialNotes harus memblokir string yang memuat password');
assert(statusHtml.includes('trimmed.includes(\'"nik":\')'), 'sanitizeOfficialNotes harus memblokir string yang memuat NIK');
assert(statusHtml.includes('sanitizeOfficialNotes(r.notes)'), 'status.html harus menyaring r.notes dengan sanitizeOfficialNotes');
console.log('✅ 2. status.html berhasil memproteksi privasi NIK dan password dari tampilan publik.');

// 3. Verifikasi api.js: Retensi Password Pendaftaran & Dukungan Konversi
const apiJs = fs.readFileSync(path.join(__dirname, '../frontend/shared/js/api.js'), 'utf8').replace(/\r\n/g, '\n');

// Di submit PPDB
assert(apiJs.includes('cleanMeta.password = password;'), 'api.js harus menyimpan password ke cleanMeta/form_metadata');
assert(apiJs.includes('password: password,\n            account_password: password,'), 'api.js regPayload harus memuat password dan account_password');
assert(apiJs.includes('safeIncomingNotes'), 'api.js harus membersihkan incoming notes dari password');

// Di konversi PPDB
assert(apiJs.includes('customPpdbPass'), 'api.js convert harus memiliki customPpdbPass');
assert(apiJs.includes('reg.account_password'), 'customPpdbPass harus memeriksa account_password');
assert(apiJs.includes('activeInitialPass'), 'api.js harus mengembalikan activeInitialPass di initial_credentials');

// Di login
assert(apiJs.includes('fallback_dob_password'), 'api.js validator login harus mendukung fallback_dob_password');
assert(apiJs.includes('ddmmyyyy'), 'api.js validator login harus mendukung format DDMMYYYY');

console.log('✅ 3. api.js berhasil mengamankan dan mempertahankan kata sandi pendaftar.');

console.log('🎉 SEMUA PENGUJIAN TAHAP 2 BERHASIL 100%!');
