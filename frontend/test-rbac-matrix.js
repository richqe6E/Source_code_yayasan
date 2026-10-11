const http = require('http');
function call(path, params) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(params || {});
    const url = '/exec?path=' + encodeURIComponent(path);
    const req = http.request({ hostname: 'localhost', port: 3000, path: url, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } }, (res) => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => { try { resolve(JSON.parse(buf)); } catch (e) { resolve(buf); } });
    });
    req.on('error', reject);
    req.write(data); req.end();
  });
}
async function login(email, pwd) {
  const r = await call('api/v1/auth/login', { email, password: pwd });
  return r.data && r.data.token;
}
// Phase order: READ first (so they succeed against seed data), then CREATE (adds new), then UPDATE (mutates), then DELETE/ACTIVATE last (consumes IDs).
const paths = [
  // READ phase (no mutation)
  'ppdb/list',
  'users/list',
  'students/list','students/myChildren','students/get',
  'classes/list',
  'teachers/list',
  'attendance/roster','attendance/history','attendance/summary',
  'development/list',
  'invoices/list',
  'payments/list',
  'dashboard/index','logs/list','reports/generate',
  'backup/backups',
  'news/list','announcements/list','events/list','gallery/list',
  'parent/me','parent/update_profile',
  'auth/change_password',
  // CREATE phase
  'ppdb/approve','ppdb/reject','ppdb/convert',
  'users/create',
  'students/create',
  'classes/create',
  'teachers/create',
  'attendance/submit',
  'development/upsert',
  'invoices/create',
  'payments/submit',
  'backup/create','backup/restore',
  'news/create','announcements/create','events/create','gallery/create',
  // UPDATE phase (order matters: verify/reject BEFORE mark_paid, since mark_paid deletes pending payments)
  'users/update',
  'students/update',
  'classes/update',
  'teachers/update',
  'payments/verify','payments/reject',
  'invoices/mark_paid',
  'news/update',
  // DELETE/ACTIVATE phase (last; mutates state). Order: activate BEFORE delete so activate's target ID still exists.
  'users/activate','users/delete',
  'students/delete',
  'classes/delete',
  'teachers/activate','teachers/delete',
  'invoices/delete',
  'news/delete'
];

function expected(role, p) {
  const isAdmin = (role === 'ADM');
  const isGuru = (role === 'GUR');
  const isOrtu = (role === 'ORT');
  if (p.startsWith('ppdb/')) return isAdmin;
  if (p.startsWith('users/')) return isAdmin;
  if (p === 'students/list' || p === 'students/create' || p === 'students/update' || p === 'students/delete') return isAdmin;
  if (p === 'students/myChildren') return isOrtu;
  if (p === 'students/get') return true;
  if (p.startsWith('classes/')) {
    if (p === 'classes/list') return isAdmin || isGuru;
    return isAdmin;
  }
  if (p.startsWith('teachers/')) return isAdmin;
  if (p.startsWith('attendance/')) {
    if (p === 'attendance/history' || p === 'attendance/summary') return true;
    return isAdmin || isGuru;
  }
  if (p.startsWith('development/')) {
    if (p === 'development/list') return true;
    return isAdmin || isGuru;
  }
  if (p === 'invoices/list') return true;
  if (p === 'invoices/create' || p === 'invoices/mark_paid' || p === 'invoices/delete') return isAdmin;
  if (p === 'payments/list') return true;
  if (p === 'payments/summary' || p === 'payments/verify' || p === 'payments/reject') return isAdmin;
  if (p === 'payments/submit') return isOrtu;
  if (p === 'dashboard/index' || p === 'logs/list' || p === 'reports/generate') return isAdmin;
  if (p.startsWith('backup/')) return isAdmin;
  if (p.endsWith('/list') && (p.startsWith('news/') || p.startsWith('announcements/') || p.startsWith('events/') || p.startsWith('gallery/'))) return true;
  if (p.endsWith('/create') || p.endsWith('/update') || p.endsWith('/delete')) return isAdmin;
  if (p === 'parent/me' || p === 'parent/update_profile') return isOrtu;
  if (p === 'auth/change_password') return true;
  return isAdmin;
}

// Dynamically resolve live IDs from DB. Falls back to known seed values.
async function resolveIds(ADM) {
  const ids = {};
  const u = await call('api/v1/users/list', { token: ADM, per_page: 50 });
  if (u.success) {
    // pick any non-super_admin user (super_admin is USR-001, the only one safe to skip)
    const candidates = u.data.users.filter(x => x.role !== 'super_admin');
    ids.user = candidates.length ? candidates[0].id : (u.data.users[0] && u.data.users[0].id);
  }
  const s = await call('api/v1/students/list', { token: ADM, per_page: 50 });
  if (s.success) {
    const stu = s.data.students.find(x => x.id === 'STU-001') || s.data.students[0];
    ids.student = stu && stu.id;
  }
  const c = await call('api/v1/classes/list', { token: ADM, per_page: 50 });
  if (c.success) {
    const cls = c.data.classes.find(x => x.id === 'CLS-001') || c.data.classes[0];
    ids.cls = cls && cls.id;
    ids.clsTeacherId = cls && cls.teacher_id;
  }
  const t = await call('api/v1/teachers/list', { token: ADM, per_page: 50 });
  if (t.success) ids.teacher = t.data.teachers[0] && t.data.teachers[0].id;
  const inv = await call('api/v1/invoices/list', { token: ADM, per_page: 50 });
  if (inv.success) {
    const forStudent = inv.data.invoices.find(i => i.student_id === ids.student && i.status !== 'paid');
    const unpaid = inv.data.invoices.find(i => i.status !== 'paid');
    ids.invoice = (forStudent || unpaid || inv.data.invoices[0]) && (forStudent || unpaid || inv.data.invoices[0]).id;
  }
  const pay = await call('api/v1/payments/list', { token: ADM, per_page: 50 });
  if (pay.success) ids.payment = pay.data.payments[0] && pay.data.payments[0].id;
  const news = await call('api/v1/news/list', { token: ADM, per_page: 50 });
  if (news.success) ids.news = news.data.items[0] && news.data.items[0].id;
  const ann = await call('api/v1/announcements/list', { token: ADM, per_page: 50 });
  if (ann.success) ids.announcement = ann.data.items[0] && ann.data.items[0].id;
  const evt = await call('api/v1/events/list', { token: ADM, per_page: 50 });
  if (evt.success) ids.event = evt.data.items[0] && evt.data.items[0].id;
  const gal = await call('api/v1/gallery/list', { token: ADM, per_page: 50 });
  if (gal.success) ids.gallery = gal.data.items[0] && gal.data.items[0].id;
  const pp = await call('api/v1/ppdb/list', { token: ADM, per_page: 50 });
  if (pp.success) ids.ppdb = pp.data.items[0] && pp.data.items[0].id;
  return ids;
}

// DESTRUCTIVE IDs: re-resolved right before DELETE/ACTIVATE phase so we don't try to act on something already deleted by an earlier test.
const destructiveIds = {};
async function resolveDestructiveIds(ADM, ids) {
  // Use create-then-act for destructive ops to avoid relying on seed state.
  const u = await call('api/v1/users/create', { token: ADM, email: 'destr_user_' + Date.now() + '@x.com', full_name: 'Destr User' });
  if (u.success) destructiveIds.user = u.data.user.id;
  const t = await call('api/v1/teachers/create', { token: ADM, full_name: 'Destr Guru' });
  if (t.success) destructiveIds.teacher = t.data.teacher.id;
  const n = await call('api/v1/news/create', { token: ADM, title: 'Destr News ' + Date.now() });
  if (n.success) destructiveIds.news = n.data.item.id;
  const s = await call('api/v1/students/create', { token: ADM, full_name: 'Destr Siswa ' + Date.now(), gender: 'L', birth_date: '2020-01-01', birth_place: 'Samarinda' });
  if (s.success) destructiveIds.student = s.data.student.id;
  const c = await call('api/v1/classes/create', { token: ADM, name: 'Destr Kelas ' + Date.now(), level: 'PAUD' });
  if (c.success) destructiveIds.cls = c.data.class.id;
  const inv = await call('api/v1/invoices/create', { token: ADM, student_id: ids.student, amount: 50000 });
  if (inv.success) destructiveIds.invoice = inv.data.invoice.id;
}

function paramsFor(p, ids, role) {
  const x = {};
  // Destructive ops use freshly-created IDs (resolved before DELETE phase)
  if (p === 'students/get') x.id = ids.student;
  if (p === 'students/update') x.id = ids.student;
  if (p === 'students/delete') x.id = destructiveIds.student || ids.student;
  if (p === 'users/update' || p === 'users/activate') x.id = destructiveIds.user || ids.user;
  if (p === 'users/delete') x.id = destructiveIds.user || ids.user;
  if (p === 'ppdb/approve' || p === 'ppdb/reject' || p === 'ppdb/convert') x.id = ids.ppdb;
  if (p === 'classes/update') x.id = ids.cls;
  if (p === 'classes/delete') x.id = destructiveIds.cls || ids.cls;
  if (p === 'teachers/update' || p === 'teachers/activate') x.id = destructiveIds.teacher || ids.teacher;
  if (p === 'teachers/delete') x.id = destructiveIds.teacher || ids.teacher;
  if (p === 'payments/verify' || p === 'payments/reject') x.id = ids.payment;
  if (p === 'payments/submit') x.invoice_id = ids.invoice;
  if (p === 'invoices/mark_paid') x.id = ids.invoice;
  if (p === 'invoices/delete') x.id = destructiveIds.invoice || ids.invoice;
  if (p === 'invoices/create') { x.student_id = ids.student; x.amount = 100000; }
  if (p === 'students/create') x.full_name = 'Test Siswa ' + Date.now();
  if (p === 'classes/create') x.name = 'Test ' + Date.now();
  if (p === 'teachers/create') x.full_name = 'Test Guru ' + Date.now();
  if (p === 'users/create') x.email = 'testnew_' + Date.now() + '@x.com';
  if (p === 'attendance/roster' || p === 'attendance/submit') { x.date = '2026-09-14'; x.class_id = ids.cls; }
  if (p === 'attendance/submit') x.records = [{ student_id: ids.student, status: 'hadir' }];
  if (p === 'attendance/history') x.student_id = ids.student;
  if (p === 'development/upsert') x.student_id = ids.student;
  if (p === 'development/list') x.student_id = ids.student;
  if (p === 'reports/generate') x.report_type = 'students';
  if (p.endsWith('/create')) x.title = 'Test ' + Date.now();
  if (p === 'news/update' || p === 'news/delete') x.id = destructiveIds.news || ids.news;
  if (p === 'announcements/update' || p === 'events/update' || p === 'gallery/update') x.id = ids.news;
  if (p === 'auth/change_password') {
    const pwd = role === 'ADM' ? 'admin123' : role === 'GUR' ? 'guru123' : 'ortu123';
    x.old_password = pwd; x.new_password = pwd;
  }
  return x;
}

(async () => {
  const ADM = await login('admin@yayasan.sch.id', 'admin123');
  const GUR = await login('guru@yayasan.sch.id', 'guru123');
  const ORT = await login('ortu@yayasan.sch.id', 'ortu123');
  const ids = await resolveIds(ADM);
  await resolveDestructiveIds(ADM, ids);
  console.log('Resolved IDs:', JSON.stringify(ids));
  console.log('Destructive IDs:', JSON.stringify(destructiveIds));
  let ok = 0, bad = 0;
  const failures = [];
  for (const p of paths) {
    const ra = await call('api/v1/' + p, { ...paramsFor(p, ids, 'ADM'), token: ADM });
    const rg = await call('api/v1/' + p, { ...paramsFor(p, ids, 'GUR'), token: GUR });
    const ro = await call('api/v1/' + p, { ...paramsFor(p, ids, 'ORT'), token: ORT });
    const tests = [
      ['ADM', ra.success, expected('ADM', p)],
      ['GUR', rg.success, expected('GUR', p)],
      ['ORT', ro.success, expected('ORT', p)]
    ];
    for (const [who, got, want] of tests) {
      if (got === want) ok++;
      else { bad++; failures.push(p + ' ' + who + ' got=' + got + ' want=' + want + ' msg=' + (who==='ADM'?ra.message:who==='GUR'?rg.message:ro.message) + ' ADM_id=' + JSON.stringify(paramsFor(p, ids, 'ADM'))); }
    }
  }
  console.log('Total checks:', ok + bad, 'OK:', ok, 'BAD:', bad);
  if (bad > 0) {
    console.log('--- FAILURES ---');
    for (const f of failures) console.log(' ', f);
  }
})();