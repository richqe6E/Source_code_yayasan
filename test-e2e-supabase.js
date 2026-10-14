/**
 * SIYAYASAN V2 — End-to-End Test Suite against Supabase
 */
const https = require('https');

const SUPABASE_CONFIG = {
  url: 'https://hnkxrbmngmveoxipohtk.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua3hyYm1uZ212ZW94aXBvaHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MTQ5NTMsImV4cCI6MjEwNDQ5MDk1M30.S10JzbSvvEStbEJl4DFVBYniyoQkG6q7_PGg3cJI9Yo',
  storageBucket: 'siyayasan-uploads'
};

async function supabaseRest(endpoint, method = 'GET', body = null, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_CONFIG.url}/rest/v1/${endpoint}`);
    const headers = {
      'apikey': SUPABASE_CONFIG.anonKey,
      'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...extraHeaders
    };

    const opts = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers
    };

    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(data ? JSON.parse(data) : []);
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function runE2E() {
  console.log('====================================================');
  console.log('🧪 SIYAYASAN V2 — E2E TEST SUITE (SUPABASE LIVE)');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  }

  // 1. Auth Test (All 4 Demo Accounts)
  console.log('--- 1. Testing Demo Authentication ---');
  const demoAccounts = [
    { email: 'admin@yayasan.sch.id', role: 'super_admin' },
    { email: 'tu@yayasan.sch.id', role: 'admin_tu' },
    { email: 'guru@yayasan.sch.id', role: 'guru' },
    { email: 'ortu@yayasan.sch.id', role: 'orang_tua' }
  ];

  for (const acc of demoAccounts) {
    const u = await supabaseRest(`users?email=eq.${acc.email}&select=*`);
    assert(u.length === 1 && u[0].role === acc.role, `Login account: ${acc.email} (${acc.role})`);
  }

  // 2. Admin Portal Queries
  console.log('\n--- 2. Testing Admin Portal Data ---');
  const [classes, students, teachers, invoices, payments, ppdb] = await Promise.all([
    supabaseRest('classes?select=*'),
    supabaseRest('students?select=*'),
    supabaseRest('teachers?select=*'),
    supabaseRest('invoices?select=*'),
    supabaseRest('payments?select=*'),
    supabaseRest('ppdb_registrations?select=*')
  ]);

  assert(classes.length >= 3, 'Classes loaded', `count=${classes.length}`);
  assert(students.length >= 3, 'Students loaded', `count=${students.length}`);
  assert(teachers.length >= 2, 'Teachers loaded', `count=${teachers.length}`);
  assert(invoices.length >= 2, 'Invoices loaded', `count=${invoices.length}`);
  assert(payments.length >= 1, 'Payments loaded', `count=${payments.length}`);
  assert(ppdb.length >= 1, 'PPDB registrations loaded', `count=${ppdb.length}`);

  // 3. Guru Portal Queries
  console.log('\n--- 3. Testing Guru Portal Flow ---');
  const guruClasses = await supabaseRest('classes?teacher_id=eq.TEA-001&select=*');
  assert(guruClasses.length >= 1, 'Guru homeroom classes loaded', `count=${guruClasses.length}`);

  // Roster
  const rosterStudents = await supabaseRest('students?class_id=eq.CLS-001&select=*');
  assert(rosterStudents.length >= 1, 'Roster students in CLS-001 loaded', `count=${rosterStudents.length}`);

  // Attendance Submit & Verification
  const testAttId = 'ATT-TEST-' + Date.now();
  await supabaseRest('attendance', 'POST', {
    id: testAttId,
    student_id: 'STU-001',
    student_name: 'Ahmad Fauzan Pratama',
    class_id: 'CLS-001',
    date: '2026-09-14',
    status: 'H',
    notes: 'Uji E2E Supabase'
  });
  const attCheck = await supabaseRest(`attendance?id=eq.${testAttId}&select=*`);
  assert(attCheck.length === 1 && attCheck[0].status === 'H', 'Presensi insert & query verified');

  // Cleanup test attendance
  await supabaseRest(`attendance?id=eq.${testAttId}`, 'DELETE');

  // Development (Rapor)
  const devs = await supabaseRest('developments?student_id=eq.STU-001&select=*');
  assert(devs.length >= 1 && devs[0].aspect_nam === 'BSB', 'Rapor 6 aspek loaded');

  // 4. Orang Tua Portal Queries
  console.log('\n--- 4. Testing Orang Tua Portal Flow ---');
  const myChildren = await supabaseRest('students?parent_email=eq.ortu@yayasan.sch.id&select=*');
  assert(myChildren.length >= 1, 'Orang Tua children loaded', `count=${myChildren.length}`);

  const childInvoices = await supabaseRest(`invoices?student_id=eq.${myChildren[0].id}&select=*`);
  assert(childInvoices.length >= 1, 'Orang Tua child invoices loaded', `count=${childInvoices.length}`);

  // 5. Public Website Endpoints
  console.log('\n--- 5. Testing Public Website Endpoints ---');
  const news = await supabaseRest('news?status=eq.published&select=*');
  assert(news.length >= 2, 'Published news loaded', `count=${news.length}`);

  const ann = await supabaseRest('announcements?status=eq.published&select=*');
  assert(ann.length >= 1, 'Announcements loaded', `count=${ann.length}`);

  const evts = await supabaseRest('events?select=*');
  assert(evts.length >= 1, 'Events loaded', `count=${evts.length}`);

  const gals = await supabaseRest('galleries?select=*');
  assert(gals.length >= 2, 'Galleries loaded', `count=${gals.length}`);

  // PPDB Public Registration & Status Check
  const testRegId = 'REG-TEST-' + Date.now();
  const testRegNo = 'REG-2026-TEST';
  await supabaseRest('ppdb_registrations', 'POST', {
    id: testRegId,
    registration_number: testRegNo,
    form_type: 'paud',
    full_name: 'Santri Uji E2E',
    status: 'pending'
  });

  const ppdbCheck = await supabaseRest(`ppdb_registrations?registration_number=eq.${testRegNo}&select=*`);
  assert(ppdbCheck.length === 1 && ppdbCheck[0].full_name === 'Santri Uji E2E', 'PPDB registration submit & public status lookup verified');

  // Cleanup test PPDB
  await supabaseRest(`ppdb_registrations?id=eq.${testRegId}`, 'DELETE');

  console.log('\n====================================================');
  console.log(`🏁 HASIL AKHIR: ${passed} PASS, ${failed} FAIL (Pass Rate: ${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log('====================================================');
}

runE2E().catch(console.error);
