const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE: NIS STATUS & BUTTON VISIBILITY ===');

// 1. Periksa kode di api.js bahwa konversi menyimpan nis dan class_name ke ppdb_registrations
const apiContent = fs.readFileSync(path.join(__dirname, '../frontend/shared/js/api.js'), 'utf8');
assert(apiContent.includes("converted_nis: studentNis") || apiContent.includes("nis: studentNis"), 'api.js wajib menyimpan NIS ke ppdb_registrations');

// 2. Periksa ppdb/status.html bahwa tombol login tidak menggunakan class invisible text-primary-950
const statusContent = fs.readFileSync(path.join(__dirname, '../frontend/public/ppdb/status.html'), 'utf8');
assert(!statusContent.includes('text-primary-950'), 'status.html tidak boleh menggunakan class text-primary-950 yang tak terdefinisi');
assert(statusContent.includes('resolveStudentNis') || statusContent.includes('converted_nis') || statusContent.includes('student_nis'), 'status.html wajib memiliki penanganan NIS');

console.log('✅ Semua pengujian spesifikasi Task 1 valid!');
