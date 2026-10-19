const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE: TEACHER QUERY & HOMEROOM DROPDOWN ===');

const apiContent = fs.readFileSync(path.join(__dirname, '../frontend/shared/js/api.js'), 'utf8');

// Ambil potongan kode module === 'teachers'
const teacherBlockMatch = apiContent.match(/if\s*\(\s*module\s*===\s*'teachers'\s*\)\s*\{[\s\S]*?return\s*\{\s*success:\s*true,\s*data:\s*mapped\s*\};/);
assert(teacherBlockMatch, 'Blok modul teachers harus ada');
const teacherBlock = teacherBlockMatch[0];

// Pastikan query teachers di api.js memeriksa kolom status=eq.active (bukan is_active=eq.)
assert(!teacherBlock.includes("&is_active=eq."), 'teachers query tidak boleh query kolom is_active di Supabase');
assert(teacherBlock.includes("&status=eq.active") || teacherBlock.includes("&status=eq."), 'teachers query harus query status=active');

const classesContent = fs.readFileSync(path.join(__dirname, '../frontend/portal/admin/classes.html'), 'utf8');
assert(classesContent.includes('loadTeachersOptions'), 'classes.html harus memiliki fungsi pemuat opsi guru');

console.log('✅ Semua pengujian spesifikasi Task 4 valid!');
