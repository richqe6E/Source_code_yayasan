const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE: CONTENT & AGE CONSISTENCY ===');

const profilHtml = fs.readFileSync(path.join(__dirname, '../frontend/public/profil.html'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../frontend/public/index.html'), 'utf8');

// Pastikan profil.html tidak memiliki pill rounded-full Perjalanan Sejak 2010
assert(!profilHtml.includes('Perjalanan Sejak 2010</span>\n          </span>') && !profilHtml.includes('rounded-full bg-primary-50'), 'profil.html kicker tidak boleh menggunakan pill rounded-full');

// Pastikan profil.html memisahkan rentang usia secara konsisten
assert(/2\s*[-–]\s*4\s*Tahun/i.test(profilHtml), 'profil.html wajib menyebut PAUD 2–4 tahun');
assert(/4\s*[-–]\s*6\s*Tahun/i.test(profilHtml), 'profil.html wajib menyebut TK 4–6 tahun');
assert(/5\s*[-–]\s*12\s*Tahun/i.test(profilHtml), 'profil.html wajib menyebut TPQ 5–12 tahun');

console.log('✅ Semua pengujian spesifikasi Task 7 valid!');
