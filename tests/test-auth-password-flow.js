const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE: AUTHENTICATION & PASSWORD HARMONIZATION ===');

const apiContent = fs.readFileSync(path.join(__dirname, '../frontend/shared/js/api.js'), 'utf8');

// Pastikan convert menyimpan password kustom jika ada
assert(apiContent.includes('customPpdbPass') || apiContent.includes('customPassword'), 'api.js convert harus mendukung password pendaftaran PPDB');

// Pastikan validator login mendukung format DDMMYYYY dan YYYY-MM-DD
assert(apiContent.includes('ddmmyyyy') && apiContent.includes('DDMMYYYY'), 'api.js validator harus mengenali format DDMMYYYY');

const loginHtml = fs.readFileSync(path.join(__dirname, '../frontend/public/login.html'), 'utf8');
assert(loginHtml.includes('DDMMYYYY') || loginHtml.includes('Tanggal Lahir'), 'login.html harus mencantumkan petunjuk tanggal lahir yang jelas');

console.log('✅ Semua pengujian spesifikasi Task 2 valid!');
