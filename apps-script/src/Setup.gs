/**
 * @fileoverview Apps Script - Database setup runner.
 * Dijalankan SEKALI untuk menginisialisasi seluruh sheet di Google Sheets.
 *
 * CARA PAKAI:
 * 1. Set SPREADSHEET_ID di Config.gs
 * 2. Buka editor Apps Script
 * 3. Pilih fungsi `setupDatabase` lalu Run
 * 4. Cek log untuk hasil
 *
 * Fungsi ini idempotent: jika sheet sudah ada, dilewati.
 */

/**
 * Master setup: jalan inisialisasi sheet + seed data awal.
 */
function setupDatabase() {
  Logger.log('=== SIYAYASAN Database Setup ===');
  Logger.log('Spreadsheet: ' + SPREADSHEET_ID);

  if (SPREADSHEET_ID === 'PASTE_SPREADSHEET_ID_DISINI') {
    Logger.log('ERROR: Set SPREADSHEET_ID di Config.gs dulu.');
    return;
  }

  try {
    Logger.log('--- Membuat sheets ---');
    createAllSheets();

    Logger.log('--- Seeding roles ---');
    seedRoles();

    Logger.log('--- Seeding permissions ---');
    seedPermissions();

    Logger.log('--- Seeding role_permissions ---');
    seedRolePermissions();

    Logger.log('--- Seeding default admin user ---');
    seedDefaultUsers();

    Logger.log('--- Seeding id_counters ---');
    seedIdCounters();

    Logger.log('--- Seeding system_settings ---');
    seedSystemSettings();

    Logger.log('=== Setup selesai. Sheet siap digunakan. ===');
  } catch (e) {
    Logger.log('ERROR: ' + e.message + '\n' + e.stack);
  }
}

function createAllSheets() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var existingSheets = ss.getSheets().map(function (s) { return s.getName(); });

  Object.keys(SHEET_NAMES).forEach(function (key) {
    var name = SHEET_NAMES[key];
    if (existingSheets.indexOf(name) === -1) {
      var sheet = ss.insertSheet(name);
      Logger.log('  + Created sheet: ' + name);
      addSheetHeaders(sheet, name);
    } else {
      Logger.log('  = Skip (exists): ' + name);
    }
  });
}

function addSheetHeaders(sheet, name) {
  var headers = SHEET_HEADERS[name];
  if (headers && headers.length) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#F0F9FF')
      .setFontColor('#0C4A6E');
    sheet.setFrozenRows(1);
  }
}

function seedRoles() {
  var roles = [
    ['ROLE-001', 'super_admin', 'Super Admin', 'Akses penuh ke seluruh sistem', 'TRUE', '2026-01-01T00:00:00.000Z', 'system', 'FALSE'],
    ['ROLE-002', 'admin_tu', 'Admin Tata Usaha', 'Kelola data master & operasional', 'TRUE', '2026-01-01T00:00:00.000Z', 'system', 'FALSE'],
    ['ROLE-003', 'guru', 'Guru', 'Akses kelas yang diajar', 'TRUE', '2026-01-01T00:00:00.000Z', 'system', 'FALSE'],
    ['ROLE-004', 'orang_tua', 'Orang Tua', 'Lihat data anak sendiri', 'TRUE', '2026-01-01T00:00:00.000Z', 'system', 'FALSE'],
    ['ROLE-005', 'pendaftar', 'Pendaftar PPDB', 'Calon peserta didik baru', 'TRUE', '2026-01-01T00:00:00.000Z', 'system', 'FALSE']
  ];
  var sheet = getSheet(SHEET_NAMES.ROLES);
  if (sheet.getLastRow() > 1) { Logger.log('  = Roles sudah ada'); return; }
  sheet.getRange(2, 1, roles.length, roles[0].length).setValues(roles);
  Logger.log('  + Seeded ' + roles.length + ' roles');
}

function seedPermissions() {
  var perms = [
    // Users
    ['PERM-001', 'user.create', 'Buat user baru', 'user', 'TRUE'],
    ['PERM-002', 'user.read', 'Lihat data user', 'user', 'TRUE'],
    ['PERM-003', 'user.update', 'Edit data user', 'user', 'TRUE'],
    ['PERM-004', 'user.delete', 'Hapus user', 'user', 'TRUE'],
    // Students
    ['PERM-010', 'student.create', 'Tambah siswa', 'student', 'TRUE'],
    ['PERM-011', 'student.read', 'Lihat data siswa', 'student', 'TRUE'],
    ['PERM-012', 'student.update', 'Edit siswa', 'student', 'TRUE'],
    ['PERM-013', 'student.delete', 'Hapus siswa', 'student', 'TRUE'],
    // Teachers
    ['PERM-020', 'teacher.create', 'Tambah guru', 'teacher', 'TRUE'],
    ['PERM-021', 'teacher.read', 'Lihat guru', 'teacher', 'TRUE'],
    ['PERM-022', 'teacher.update', 'Edit guru', 'teacher', 'TRUE'],
    ['PERM-023', 'teacher.delete', 'Hapus guru', 'teacher', 'TRUE'],
    // Classes
    ['PERM-030', 'class.create', 'Buat kelas', 'class', 'TRUE'],
    ['PERM-031', 'class.read', 'Lihat kelas', 'class', 'TRUE'],
    ['PERM-032', 'class.update', 'Edit kelas', 'class', 'TRUE'],
    ['PERM-033', 'class.delete', 'Hapus kelas', 'class', 'TRUE'],
    // PPDB
    ['PERM-040', 'ppdb.create', 'Submit pendaftaran', 'ppdb', 'TRUE'],
    ['PERM-041', 'ppdb.read', 'Lihat PPDB', 'ppdb', 'TRUE'],
    ['PERM-042', 'ppdb.update', 'Edit PPDB', 'ppdb', 'TRUE'],
    ['PERM-043', 'ppdb.delete', 'Hapus PPDB', 'ppdb', 'TRUE'],
    ['PERM-044', 'ppdb.approve', 'Setujui/tolak PPDB', 'ppdb', 'TRUE'],
    // Attendance
    ['PERM-050', 'attendance.create', 'Input presensi', 'attendance', 'TRUE'],
    ['PERM-051', 'attendance.read', 'Lihat presensi', 'attendance', 'TRUE'],
    ['PERM-052', 'attendance.update', 'Edit presensi', 'attendance', 'TRUE'],
    // Development
    ['PERM-060', 'development.create', 'Buat catatan perkembangan', 'development', 'TRUE'],
    ['PERM-061', 'development.read', 'Lihat perkembangan', 'development', 'TRUE'],
    ['PERM-062', 'development.update', 'Edit perkembangan', 'development', 'TRUE'],
    // Payments
    ['PERM-070', 'payment.create', 'Buat tagihan', 'payment', 'TRUE'],
    ['PERM-071', 'payment.read', 'Lihat tagihan', 'payment', 'TRUE'],
    ['PERM-072', 'payment.update', 'Edit tagihan', 'payment', 'TRUE'],
    ['PERM-073', 'payment.delete', 'Hapus tagihan', 'payment', 'TRUE'],
    ['PERM-074', 'payment.verify', 'Verifikasi pembayaran', 'payment', 'TRUE'],
    ['PERM-075', 'payment.upload_proof', 'Upload bukti bayar', 'payment', 'TRUE'],
    ['PERM-076', 'payment.reject', 'Tolak pembayaran', 'payment', 'TRUE'],
    ['PERM-077', 'payment.report', 'Rekap pembayaran', 'payment', 'TRUE'],
    // Content
    ['PERM-080', 'content.create', 'Buat konten', 'content', 'TRUE'],
    ['PERM-081', 'content.read', 'Lihat konten', 'content', 'TRUE'],
    ['PERM-082', 'content.update', 'Edit konten', 'content', 'TRUE'],
    ['PERM-083', 'content.delete', 'Hapus konten', 'content', 'TRUE'],
    ['PERM-084', 'content.publish', 'Publish konten', 'content', 'TRUE'],
    // Reports
    ['PERM-090', 'report.read', 'Lihat laporan', 'report', 'TRUE'],
    ['PERM-091', 'report.generate', 'Generate laporan', 'report', 'TRUE'],
    ['PERM-092', 'report.export', 'Export laporan', 'report', 'TRUE'],
    // Audit
    ['PERM-100', 'audit.read', 'Lihat activity log', 'audit', 'TRUE'],
    // Backup
    ['PERM-110', 'backup.create', 'Buat backup', 'backup', 'TRUE'],
    ['PERM-111', 'backup.restore', 'Restore backup', 'backup', 'TRUE'],
    ['PERM-111a', 'backup.manage', 'Kelola backup', 'backup', 'TRUE'],
    // Settings
    ['PERM-120', 'settings.read', 'Lihat settings', 'settings', 'TRUE'],
    ['PERM-121', 'settings.update', 'Edit settings', 'settings', 'TRUE'],
    // Notification
    ['PERM-130', 'notification.read.own', 'Baca notifikasi sendiri', 'notification', 'TRUE']
  ];
  var sheet = getSheet(SHEET_NAMES.PERMISSIONS);
  if (sheet.getLastRow() > 1) { Logger.log('  = Permissions sudah ada'); return; }
  sheet.getRange(2, 1, perms.length, perms[0].length).setValues(perms);
  Logger.log('  + Seeded ' + perms.length + ' permissions');
}

function seedRolePermissions() {
  // Super admin = semua (ditangani di code)
  // Admin TU = semua kecuali backup.restore
  // Guru = student.read, attendance.*, development.*, class.read
  // Orang tua = student.read (own), attendance.read, development.read, payment.read
  // Pendaftar = ppdb.create, ppdb.read
  var map = {
'ROLE-002': ['PERM-001','PERM-002','PERM-003','PERM-010','PERM-011','PERM-012','PERM-013','PERM-020','PERM-021','PERM-022','PERM-023','PERM-030','PERM-031','PERM-032','PERM-033','PERM-040','PERM-041','PERM-042','PERM-044','PERM-050','PERM-051','PERM-052','PERM-060','PERM-061','PERM-062','PERM-070','PERM-071','PERM-072','PERM-073','PERM-074','PERM-075','PERM-076','PERM-077','PERM-080','PERM-081','PERM-082','PERM-083','PERM-084','PERM-090','PERM-091','PERM-092','PERM-100','PERM-110','PERM-111a','PERM-120','PERM-121'],
    'ROLE-003': ['PERM-011','PERM-021','PERM-031','PERM-050','PERM-051','PERM-052','PERM-060','PERM-061','PERM-062','PERM-081'],
    'ROLE-004': ['PERM-011','PERM-051','PERM-061','PERM-071','PERM-075','PERM-081','PERM-130'],
    'ROLE-005': ['PERM-040','PERM-041']
  };
  var sheet = getSheet(SHEET_NAMES.ROLE_PERMISSIONS);
  if (sheet.getLastRow() > 1) { Logger.log('  = Role permissions sudah ada'); return; }
  var rows = [];
  Object.keys(map).forEach(function (roleId) {
    map[roleId].forEach(function (permId) {
      rows.push(['RP-' + roleId + '-' + permId, roleId, permId, 'TRUE', nowIso(), 'system']);
    });
  });
  if (rows.length) {
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }
  Logger.log('  + Seeded ' + rows.length + ' role_permissions');
}

function seedDefaultUsers() {
  var sheet = getSheet(SHEET_NAMES.USERS);
  if (sheet.getLastRow() > 1) { Logger.log('  = Users sudah ada'); return; }
  var now = nowIso();
  var users = [
    ['USR-2026-00001', 'admin@yayasan.sch.id', 'Super Admin', hashPassword('admin123'), null, null, 'ROLE-001', 'active', '0', null, now, null, 'system', 'FALSE'],
    ['USR-2026-00002', 'tu@yayasan.sch.id', 'Admin TU', hashPassword('tu123456'), '081234567890', null, 'ROLE-002', 'active', '0', null, now, null, 'system', 'FALSE'],
    ['USR-2026-00003', 'guru@yayasan.sch.id', 'Bu Siti Guru', hashPassword('guru123'), '081234567891', 'TCH-2026-00001', 'ROLE-003', 'active', '0', null, now, null, 'system', 'FALSE'],
    ['USR-2026-00004', 'ortu@yayasan.sch.id', 'Bapak Andi', hashPassword('ortu123'), '081234567892', 'PAR-2026-00001', 'ROLE-004', 'active', '0', null, now, null, 'system', 'FALSE']
  ];
  sheet.getRange(2, 1, users.length, users[0].length).setValues(users);
  Logger.log('  + Seeded ' + users.length + ' default users');
}

function seedIdCounters() {
  var sheet = getSheet(SHEET_NAMES.ID_COUNTERS);
  if (sheet.getLastRow() > 1) { Logger.log('  = ID counters sudah ada'); return; }
  var year = new Date().getFullYear();
  var counters = [
    ['USR', year, 4, nowIso()],
    ['STU', year, 0, nowIso()],
    ['PAR', year, 1, nowIso()],
    ['TCH', year, 1, nowIso()],
    ['CLS', year, 0, nowIso()],
    ['REG', year, 0, nowIso()],
    ['INV', year, 0, nowIso()],
    ['PAY', year, 0, nowIso()],
    ['ANN', year, 0, nowIso()],
    ['NWS', year, 0, nowIso()],
    ['LOG', year, 1, nowIso()]
  ];
  sheet.getRange(2, 1, counters.length, counters[0].length).setValues(counters);
  Logger.log('  + Seeded ' + counters.length + ' id_counters');
}

function seedSystemSettings() {
  var sheet = getSheet(SHEET_NAMES.SYSTEM_SETTINGS);
  if (sheet.getLastRow() > 1) { Logger.log('  = System settings sudah ada'); return; }
  var settings = [
    ['SET-001', 'app_name', 'SIYAYASAN', 'string', 'Nama aplikasi', nowIso()],
    ['SET-002', 'app_version', APP_VERSION, 'string', 'Versi aplikasi', nowIso()],
    ['SET-003', 'timezone', TIMEZONE, 'string', 'Timezone yayasan', nowIso()],
    ['SET-004', 'ppdb_active_period_id', '', 'string', 'Periode PPDB aktif', nowIso()],
    ['SET-005', 'current_academic_year', '2026/2027', 'string', 'Tahun ajaran aktif', nowIso()],
    ['SET-006', 'ppdb_open_date', '2026-10-01', 'date', 'Tanggal buka PPDB', nowIso()],
    ['SET-007', 'ppdb_close_date', '2026-11-30', 'date', 'Tanggal tutup PPDB', nowIso()],
    ['SET-008', 'school_name', 'Yayasan Pendidikan Ulinnuha', 'string', 'Nama yayasan', nowIso()],
    ['SET-009', 'school_address', 'Jl. Pendidikan No. 1', 'string', 'Alamat yayasan', nowIso()],
    ['SET-010', 'school_phone', '021-1234567', 'string', 'Telepon yayasan', nowIso()],
    ['SET-011', 'school_email', 'info@yayasan.sch.id', 'string', 'Email yayasan', nowIso()]
  ];
  sheet.getRange(2, 1, settings.length, settings[0].length).setValues(settings);
  Logger.log('  + Seeded ' + settings.length + ' system settings');
}

/**
 * Definisi header untuk setiap sheet (harus sinkron dengan struktur data service).
 */
var SHEET_HEADERS = {
  config: ['key', 'value', 'description', 'updated_at'],
  id_counters: ['prefix', 'year', 'last_value', 'updated_at'],
  users: ['id', 'email', 'full_name', 'password_hash', 'phone', 'linked_entity_id', 'role_id', 'status', 'failed_login_count', 'locked_until', 'last_login', 'email_verified_at', 'created_by', 'is_deleted'],
  roles: ['id', 'code', 'name', 'description', 'is_active', 'created_at', 'created_by', 'is_deleted'],
  permissions: ['id', 'code', 'name', 'module', 'is_active'],
  role_permissions: ['id', 'role_id', 'permission_id', 'is_granted', 'granted_at', 'granted_by'],
  schools: ['id', 'code', 'name', 'level', 'address', 'phone', 'email', 'principal_name', 'status', 'created_at', 'created_by', 'is_deleted'],
  academic_years: ['id', 'name', 'start_date', 'end_date', 'is_active', 'created_at', 'created_by', 'is_deleted'],
  classes: ['id', 'name', 'school_id', 'grade_level', 'academic_year_id', 'homeroom_teacher_id', 'capacity', 'status', 'created_at', 'created_by', 'is_deleted'],
  students: ['id', 'nis', 'full_name', 'gender', 'birth_place', 'birth_date', 'address', 'religion', 'nationality', 'child_order', 'sibling_count', 'orphan_status', 'daily_language', 'special_characteristics', 'current_class_id', 'status', 'enrollment_date', 'entry_year', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  parents: ['id', 'full_name', 'nik', 'occupation', 'phone', 'email', 'address', 'user_id', 'status', 'created_at', 'created_by', 'is_deleted'],
  parent_student_relations: ['id', 'parent_id', 'student_id', 'relation', 'is_primary_contact', 'status', 'created_at', 'created_by'],
  teachers: ['id', 'nip', 'full_name', 'gender', 'birth_place', 'birth_date', 'phone', 'email', 'address', 'position', 'specialization', 'start_date', 'status', 'user_id', 'created_at', 'created_by', 'is_deleted'],
  teacher_class_assignments: ['id', 'teacher_id', 'class_id', 'subject', 'academic_year_id', 'status', 'created_at', 'created_by'],
  enrollments: ['id', 'student_id', 'class_id', 'academic_year_id', 'enrollment_date', 'status', 'created_at', 'created_by'],
  ppdb_periods: ['id', 'name', 'academic_year', 'open_date', 'close_date', 'status', 'quota', 'created_at', 'created_by', 'is_deleted'],
  ppdb_registrations: ['id', 'registration_number', 'form_type', 'child_name', 'child_gender', 'child_birth_place', 'child_birth_date', 'child_religion', 'child_nationality', 'child_order', 'sibling_count', 'orphan_status', 'daily_language', 'special_characteristics', 'father_name', 'father_nik', 'father_occupation', 'father_phone', 'father_email', 'mother_name', 'mother_nik', 'mother_occupation', 'mother_phone', 'mother_email', 'guardian_name', 'guardian_relation', 'guardian_phone', 'address', 'school_origin', 'desired_class', 'status', 'notes', 'submitted_at', 'verified_at', 'verified_by', 'converted_to_student_id', 'created_at', 'created_by', 'updated_at', 'is_deleted'],
  ppdb_documents: ['id', 'registration_id', 'document_type', 'file_id', 'file_name', 'uploaded_at', 'uploaded_by'],
  student_documents: ['id', 'student_id', 'document_type', 'file_id', 'file_name', 'uploaded_at', 'uploaded_by'],
  attendance: ['id', 'date', 'class_id', 'student_id', 'status', 'note', 'recorded_by', 'recorded_at', 'created_at', 'is_deleted'],
  student_development: ['id', 'student_id', 'semester', 'academic_year', 'nilai_agama', 'fisik_motorik', 'kognitif', 'bahasa', 'sosial_emosional', 'seni', 'teacher_note', 'recorded_by', 'recorded_date', 'created_at', 'updated_at', 'is_deleted'],
  teacher_notes: ['id', 'student_id', 'teacher_id', 'note', 'note_date', 'created_at', 'is_deleted'],
  invoices: ['id', 'invoice_number', 'student_id', 'class_id', 'item_name', 'invoice_type', 'amount', 'total_paid', 'due_date', 'period', 'status', 'notes', 'created_at', 'created_by', 'updated_at', 'is_deleted'],
  payments: ['id', 'payment_number', 'invoice_id', 'student_id', 'amount', 'method', 'payment_date', 'proof_url', 'note', 'status', 'verified_at', 'verified_by', 'submitted_at', 'submitted_by', 'is_deleted'],
  announcements: ['id', 'title', 'content', 'target_audience', 'is_pinned', 'status', 'published_at', 'expires_at', 'created_at', 'created_by', 'is_deleted'],
  news: ['id', 'title', 'slug', 'content', 'excerpt', 'cover_url', 'category', 'status', 'is_published', 'published_at', 'author_id', 'created_at', 'updated_at', 'is_deleted'],
  events: ['id', 'title', 'description', 'event_date', 'event_end_date', 'location', 'status', 'is_published', 'created_at', 'created_by', 'is_deleted'],
  galleries: ['id', 'title', 'description', 'image_url', 'album', 'status', 'created_at', 'created_by', 'is_deleted'],
  activity_logs: ['id', 'timestamp', 'user_id', 'action', 'module', 'entity_type', 'entity_id', 'description', 'ip_address', 'user_agent', 'old_values', 'new_values', 'status', 'error_message'],
  notifications: ['id', 'user_id', 'type', 'title', 'message', 'link', 'is_read', 'read_at', 'created_at'],
  system_settings: ['id', 'key', 'value', 'type', 'description', 'updated_at'],
  user_notification_preferences: ['id', 'user_id', 'notification_type', 'channel', 'is_enabled', 'updated_at'],
  migrations: ['id', 'name', 'executed_at', 'checksum']
};