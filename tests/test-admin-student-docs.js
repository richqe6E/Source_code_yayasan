const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE: ADMIN STUDENT DOCUMENTS PREVIEW ===');

const studentsHtml = fs.readFileSync(path.join(__dirname, '../frontend/portal/admin/students.html'), 'utf8');

// Pastikan ada container berkas dokumen siswa di dalam modal
assert(studentsHtml.includes('student-documents-preview'), 'admin/students.html harus memiliki panel #student-documents-preview');
assert(studentsHtml.includes('loadStudentDocuments'), 'admin/students.html harus memiliki fungsi loadStudentDocuments');

console.log('✅ Semua pengujian spesifikasi Task 5 valid!');
