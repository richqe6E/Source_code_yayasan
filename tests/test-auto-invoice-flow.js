const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE: AUTO FIRST MONTH SPP INVOICE ===');

const ppdbHtml = fs.readFileSync(path.join(__dirname, '../frontend/portal/admin/ppdb.html'), 'utf8');
assert(ppdbHtml.includes('cm-auto-spp'), 'admin/ppdb.html harus memiliki checkbox #cm-auto-spp');

const apiContent = fs.readFileSync(path.join(__dirname, '../frontend/shared/js/api.js'), 'utf8');

// Ambil blok action === 'convert'
const convertBlockMatch = apiContent.match(/if\s*\(\s*action\s*===\s*'convert'\s*\)\s*\{[\s\S]*?return\s*\{\s*success:\s*true,\s*data:\s*\{[\s\S]*?student_name:\s*studentName/);
assert(convertBlockMatch, 'Blok action convert harus ditemukan');
const convertBlock = convertBlockMatch[0];

assert(convertBlock.includes("invoices") && (convertBlock.includes("auto_spp") || convertBlock.includes("SPP Bulan")), 'blok convert di api.js wajib menerbitkan invoice SPP bulan pertama jika auto_spp aktif');

console.log('✅ Semua pengujian spesifikasi Task 6 valid!');
