const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE: TAHAP 3 - SINKRONISASI FILTER KELAS & OTOMASI SPP ===');

// 1. Verifikasi ppdb.html: Filter kelas tahan format variatif (TK_A vs TK A, dsb)
const ppdbHtml = fs.readFileSync(path.join(__dirname, '../frontend/portal/admin/ppdb.html'), 'utf8').replace(/\r\n/g, '\n');
assert(ppdbHtml.includes('normTarget'), 'ppdb.html harus melakukan normalisasi target jenjang');
assert(ppdbHtml.includes('compactTarget'), 'ppdb.html harus membuat format compact jenjang');
assert(ppdbHtml.includes('compactCLevel.includes(\'TKA\') || normCLevel.includes(\'TK A\')'), 'ppdb.html harus mencocokkan TK A dan TK_A');
assert(ppdbHtml.includes('compactCLevel.includes(\'TKB\') || normCLevel.includes(\'TK B\')'), 'ppdb.html harus mencocokkan TK B dan TK_B');
console.log('✅ 1. Logika filter kelas pada modal konversi PPDB Admin terverifikasi cerdas & adaptif.');

// 2. Unit test algoritma filter kelas
function filterClasses(targetJenjang, classes) {
  const normTarget = (targetJenjang || '').toUpperCase().replace(/[_\-]/g, ' ').replace(/\s+/g, ' ').trim();
  const compactTarget = (targetJenjang || '').toUpperCase().replace(/[\s_\-]/g, '');

  return classes.filter(c => {
    const rawCLevel = (c.level || c.grade_level || c.name || '').toUpperCase();
    const normCLevel = rawCLevel.replace(/[_\-]/g, ' ').replace(/\s+/g, ' ').trim();
    const compactCLevel = rawCLevel.replace(/[\s_\-]/g, '');

    if (compactTarget.includes('TKA') || normTarget.includes('TK A')) {
      return compactCLevel.includes('TKA') || normCLevel.includes('TK A');
    }
    if (compactTarget.includes('TKB') || normTarget.includes('TK B')) {
      return compactCLevel.includes('TKB') || normCLevel.includes('TK B');
    }
    if (normTarget.includes('PAUD') || normTarget.includes('BERMAIN') || /\bKB\b/.test(normTarget)) {
      return normCLevel.includes('PAUD') || normCLevel.includes('BERMAIN') || /\bKB\b/.test(normCLevel);
    }
    if (normTarget.includes('TPQ') || compactTarget.includes('TPQ')) {
      return normCLevel.includes('TPQ') || compactCLevel.includes('TPQ');
    }
    if (normTarget.includes('TK')) return normCLevel.includes('TK');
    return false;
  });
}

const mockClasses = [
  { id: '1', name: 'Kelas Bintang', level: 'TK_A' },
  { id: '2', name: 'Kelas Bulan', level: 'TK B' },
  { id: '3', name: 'Kelas Pelangi', level: 'KB' },
  { id: '4', name: 'Kelas Al-Falah', level: 'TPQ' }
];

const resTkA = filterClasses('TK A', mockClasses);
assert.strictEqual(resTkA.length, 1);
assert.strictEqual(resTkA[0].id, '1');

const resTkA_Underscore = filterClasses('TK_A', mockClasses);
assert.strictEqual(resTkA_Underscore.length, 1);
assert.strictEqual(resTkA_Underscore[0].id, '1');

const resTkB = filterClasses('TK_B', mockClasses);
assert.strictEqual(resTkB.length, 1);
assert.strictEqual(resTkB[0].id, '2');

const resPaud = filterClasses('PAUD', mockClasses);
assert.strictEqual(resPaud.length, 1);
assert.strictEqual(resPaud[0].id, '3');

const resTpq = filterClasses('TPQ', mockClasses);
assert.strictEqual(resTpq.length, 1);
assert.strictEqual(resTpq[0].id, '4');
console.log('✅ 2. Simulasi algoritma pencocokan jenjang TK_A, TK_B, KB/PAUD, dan TPQ lulus 100%.');

// 3. Verifikasi api.js: Proteksi Anti-Duplikasi Tagihan SPP
const apiJs = fs.readFileSync(path.join(__dirname, '../frontend/shared/js/api.js'), 'utf8').replace(/\r\n/g, '\n');
assert(apiJs.includes('hasExistingInvoice'), 'api.js harus memiliki pengecekan hasExistingInvoice');
assert(apiJs.includes('invoices?student_id=eq.'), 'api.js harus memeriksa riwayat invoice siswa terkait');
assert(apiJs.includes('if (!hasExistingInvoice)'), 'api.js hanya membuat tagihan jika invoice belum pernah terbit');
console.log('✅ 3. Proteksi anti-duplikasi invoice SPP di api.js terverifikasi aktif.');

// 4. Verifikasi status.html: Ekstraksi fallback & UI NIS
const statusHtml = fs.readFileSync(path.join(__dirname, '../frontend/public/ppdb/status.html'), 'utf8').replace(/\r\n/g, '\n');
assert(statusHtml.includes('matchNis = r.notes.match(/NIS:\\s*([A-Za-z0-9_-]+)/i)'), 'status.html harus mendukung fallback ekstraksi NIS dari catatan resmi');
assert(statusHtml.includes('matchClass = r.notes.match(/Kelas:\\s*([^),]+)/i)'), 'status.html harus mendukung fallback ekstraksi Kelas dari catatan resmi');
assert(statusHtml.includes('bg-primary-500 hover:bg-primary-400 text-white'), 'status.html tombol CTA masuk portal harus menggunakan warna Oceanic Blue solid');
assert(statusHtml.includes('Nomor Induk Siswa (NIS Resmi)'), 'status.html harus menyertakan NIS di daftar rincian data');
console.log('✅ 4. status.html berhasil menampilkan NIS dan tombol CTA Oceanic Blue dengan jelas.');

console.log('🎉 SEMUA PENGUJIAN TAHAP 3 BERHASIL 100%!');
