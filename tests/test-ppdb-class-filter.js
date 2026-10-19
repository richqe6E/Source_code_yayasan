const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE: PPDB CLASS SELECTION BY LEVEL ===');

const ppdbAdminContent = fs.readFileSync(path.join(__dirname, '../frontend/portal/admin/ppdb.html'), 'utf8');

// Pastikan ada logika pencocokan jenjang kelas
assert(ppdbAdminContent.includes('matchingClasses') && ppdbAdminContent.includes('optgroup'), 'admin/ppdb.html wajib memiliki filter jenjang dan optgroup untuk opsi rombel');

console.log('✅ Semua pengujian spesifikasi Task 3 valid!');
