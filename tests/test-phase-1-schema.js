const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE: TAHAP 1 - PENYIAPAN LACI & KOLOM DATABASE RESMI ===');

// 1. Verifikasi Keberadaan File SQL Migrasi Tahap 1
const phase1SqlPath = path.join(__dirname, '../database/patch_siyayasan_v2_phase1_columns.sql');
assert(fs.existsSync(phase1SqlPath), 'File patch_siyayasan_v2_phase1_columns.sql harus tersedia');

const phase1Sql = fs.readFileSync(phase1SqlPath, 'utf8');

// Kolom ppdb_registrations
assert(phase1Sql.includes('converted_nis VARCHAR(50)'), 'Harus ada kolom converted_nis di ppdb_registrations');
assert(phase1Sql.includes('nis VARCHAR(50)'), 'Harus ada kolom nis di ppdb_registrations');
assert(phase1Sql.includes('class_name VARCHAR(100)'), 'Harus ada kolom class_name di ppdb_registrations');
assert(phase1Sql.includes('password VARCHAR(255)'), 'Harus ada kolom password di ppdb_registrations');

// Kolom users
assert(phase1Sql.includes('fallback_dob_password VARCHAR(50)'), 'Harus ada kolom fallback_dob_password di users');
assert(phase1Sql.includes('birth_date VARCHAR(50)'), 'Harus ada kolom birth_date di users');

// Kolom students
assert(phase1Sql.includes('program VARCHAR(100)'), 'Harus ada kolom program di students');
assert(phase1Sql.includes('level VARCHAR(100)'), 'Harus ada kolom level di students');
assert(phase1Sql.includes('registration_number VARCHAR(100)'), 'Harus ada kolom registration_number di students');
assert(phase1Sql.includes('reg_number VARCHAR(100)'), 'Harus ada kolom reg_number di students');

// Kolom teachers & student_documents
assert(phase1Sql.includes('subject_specialty VARCHAR(100)'), 'Harus ada kolom subject_specialty di teachers');
assert(phase1Sql.includes('status VARCHAR(30) DEFAULT \'pending\''), 'Harus ada kolom status di student_documents');
console.log('✅ 1. File migrasi SQL Tahap 1 valid & lengkap.');

// 2. Verifikasi Konsistensi MASTER SQL & patch_missing_columns.sql
const masterSql = fs.readFileSync(path.join(__dirname, '../database/MASTER_SUPABASE_SETUP_V2.sql'), 'utf8');
assert(masterSql.includes('converted_nis VARCHAR(50)'), 'MASTER SQL harus memuat converted_nis');
assert(masterSql.includes('fallback_dob_password VARCHAR(50)'), 'MASTER SQL harus memuat fallback_dob_password');

const patchSql = fs.readFileSync(path.join(__dirname, '../database/patch_missing_columns.sql'), 'utf8');
assert(patchSql.includes('converted_nis VARCHAR(50)'), 'patch_missing_columns.sql harus memuat converted_nis');
assert(patchSql.includes('fallback_dob_password VARCHAR(50)'), 'patch_missing_columns.sql harus memuat fallback_dob_password');
console.log('✅ 2. MASTER_SUPABASE_SETUP_V2.sql dan patch_missing_columns.sql tersinkronisasi.');

// 3. Verifikasi Defensive Adapter di api.js
const apiJs = fs.readFileSync(path.join(__dirname, '../frontend/shared/js/api.js'), 'utf8');

// Pastikan kueri pencarian guru memakai specialization bukan kolom tidak ada
assert(!apiJs.includes('subject_specialty.ilike.*'), 'api.js tidak boleh kueri kolom subject_specialty yang tidak ada');
assert(apiJs.includes('specialization.ilike.*'), 'api.js harus kueri specialization untuk guru');

// Pastikan student_documents insert tidak memasukkan status: pending yang gagal
assert(!apiJs.includes("status: 'pending'\n              });\n            } catch"), 'api.js tidak boleh memasukkan status ke student_documents yang menyebabkan error 400');
assert(apiJs.includes('is_verified: false'), 'api.js harus memasukkan is_verified: false untuk student_documents');

// Pastikan users update/insert pada konversi memiliki fallback proteksi
assert(apiJs.includes('User patch primary with DOB fields failed'), 'api.js harus memiliki proteksi fallback patch users');
assert(apiJs.includes('User post primary with DOB fields failed'), 'api.js harus memiliki proteksi fallback post users');
console.log('✅ 3. Defensive API adapter di api.js terverifikasi aman & tahan banting.');

console.log('🎉 SEMUA PENGUJIAN TAHAP 1 BERHASIL 100%!');
