const fs = require('fs');

const ppdbHtml = fs.readFileSync('frontend/public/ppdb.html', 'utf8');
const indexHtml = fs.readFileSync('frontend/public/index.html', 'utf8');
const apiJs = fs.readFileSync('frontend/shared/js/api.js', 'utf8');

console.log('=== VERIFIKASI LOGIKA VISIBILITAS KARTU FORMULIR PPDB ===\n');

let pass = 0;
let fail = 0;

function check(title, condition) {
  if (condition) {
    console.log(`✅ [PASS] ${title}`);
    pass++;
  } else {
    console.error(`❌ [FAIL] ${title}`);
    fail++;
  }
}

// 1. ppdb.html elements
check('ppdb.html memiliki container #ppdb-closed-card', ppdbHtml.includes('id="ppdb-closed-card"'));
check('ppdb.html memiliki section #formulir-pendaftaran', ppdbHtml.includes('id="formulir-pendaftaran"'));
check('ppdb.html memiliki anchor #jadwal-linimasa', ppdbHtml.includes('id="jadwal-linimasa"'));
check('ppdb.html memiliki tombol hero dinamis #hero-reg-btn', ppdbHtml.includes('id="hero-reg-btn"'));

// 2. Logic to hide form when closed
check('ppdb.html menyembunyikan formSection saat isClosed', ppdbHtml.includes("formSection.classList.add('hidden')"));
check('ppdb.html menampilkan closedCard saat isClosed', ppdbHtml.includes("closedCard.classList.remove('hidden')"));
check('ppdb.html mengarahkan hero button ke linimasa saat isClosed', ppdbHtml.includes("heroRegBtn.href = '#jadwal-linimasa'"));

// 3. Logic to show form when open
check('ppdb.html menampilkan formSection saat status Buka', ppdbHtml.includes("formSection.classList.remove('hidden')"));
check('ppdb.html menyembunyikan closedCard saat status Buka', ppdbHtml.includes("closedCard.classList.add('hidden')"));
check('ppdb.html mengarahkan hero button ke formulir saat status Buka', ppdbHtml.includes("heroRegBtn.href = '#formulir-pendaftaran'"));

// 4. Pre-render check to eliminate layout flicker
check('ppdb.html melakukan pre-render check dari localStorage siy_ppdb_status', ppdbHtml.includes("localStorage.getItem('siy_ppdb_status')"));

// 5. Submit protection
check('submitPpdbRegistration memeriksa apakah formSection tersembunyi', ppdbHtml.includes("formSection.classList.contains('hidden')"));

// 6. index.html sync
check('index.html memperbarui hero CTA saat PPDB dibuka', indexHtml.includes("heroBtn.href = 'ppdb.html#formulir-pendaftaran'"));
check('index.html memperbarui bottom CTA saat PPDB dibuka', indexHtml.includes("bottomBtn.href = 'ppdb.html#formulir-pendaftaran'"));

// 7. api.js caching
check('api.js menyimpan status PPDB ke localStorage saat period & update_period', apiJs.includes("localStorage.setItem('siy_ppdb_status', p.status)") && apiJs.includes("localStorage.setItem('siy_ppdb_status', params.status"));

console.log(`\nHasil: ${pass} Lulus, ${fail} Gagal.`);
if (fail > 0) process.exit(1);
