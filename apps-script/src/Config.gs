/**
 * @fileoverview Apps Script backend configuration.
 * Berisi semua konstanta global (ID spreadsheet, folder Drive, Firebase project, dll).
 * File ini HARUS di-edit setelah project Apps Script dibuat dan di-deploy.
 *
 * @version 1.0
 * @date 2026-09-12
 */

// ============================================================================
// SPREADSHEET ID (Database utama)
// ============================================================================
// Dapatkan dari URL Google Sheets: https://docs.google.com/spreadsheets/d/{ID}/edit
// GANTI DENGAN ID SPREADSHEET ANDA setelah setup database selesai
var SPREADSHEET_ID = 'PASTE_SPREADSHEET_ID_DISINI';

// ============================================================================
// DRIVE FOLDER IDs (File storage)
// ============================================================================
// Root folder untuk semua file yayasan
var DRIVE_ROOT_FOLDER_ID = 'PASTE_FOLDER_ID_DISINI';

// Subfolder (akan dibuat otomatis jika belum ada oleh FileService)
var DRIVE_SUBFOLDERS = {
  ppdb: 'PPDB',
  siswa: 'SISWA',
  guru: 'GURU',
  berita: 'BERITA',
  pengumuman: 'PENGUMUMAN',
  agenda: 'AGENDA',
  galeri: 'GALERI',
  pembayaran: 'PEMBAYARAN',
  dokumen_sekolah: 'DOKUMEN_SEKOLAH',
  template: 'TEMPLATE',
  backup: 'BACKUP'
};

// ============================================================================
// FIREBASE AUTH CONFIGURATION
// ============================================================================
// Setup di https://console.firebase.google.com/
// Project Settings > General > Your apps > Web app
var FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCycm1u8KJVwq6EEi8m4xAvLnZYrNo2WnU',
  authDomain: 'database-web-yayasan.firebaseapp.com',
  projectId: 'database-web-yayasan',
  storageBucket: 'database-web-yayasan.firebasestorage.app',
  messagingSenderId: '230986893319',
  appId: '1:230986893319:web:ca384b1731b21b94b782a2'
};

// Firebase Web API Key (untuk verify token dari frontend)
var FIREBASE_WEB_API_KEY = 'AIzaSyCycm1u8KJVwq6EEi8m4xAvLnZYrNo2WnU';

// ============================================================================
// APP SETTINGS
// ============================================================================
var APP_NAME = 'SIYAYASAN';
var APP_VERSION = '1.0.0';
var APP_ENV = 'production'; // 'development' | 'staging' | 'production'

// Timezone yayasan (sesuai system_settings.timezone)
var TIMEZONE = 'Asia/Jakarta';

// Locale
var LOCALE = 'id';

// ============================================================================
// SECURITY
// ============================================================================
var SECURITY = {
  // Token expire time (detik)
  tokenExpireSeconds: 30 * 60, // 30 menit

  // Absolute session expire (detik) - harus login ulang
  absoluteSessionExpireSeconds: 8 * 60 * 60, // 8 jam

  // Max gagal login sebelum lockout
  maxFailedLoginAttempts: 5,

  // Durasi lockout (detik)
  lockoutDurationSeconds: 30 * 60, // 30 menit

  // Min panjang password
  minPasswordLength: 8,

  // Max upload size (bytes)
  maxUploadBytes: 5 * 1024 * 1024, // 5 MB

  // Max upload foto (bytes)
  maxPhotoUploadBytes: 2 * 1024 * 1024, // 2 MB
};

// ============================================================================
// ALLOWED MIME TYPES
// ============================================================================
var ALLOWED_MIME_TYPES = {
  image: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ],
  document: [
    'application/pdf'
  ]
};

// ============================================================================
// API VERSIONING
// ============================================================================
var API_VERSION = 'v1';
var API_BASE_PATH = '/api/' + API_VERSION;

// ============================================================================
// ROLES
// ============================================================================
var ROLE_CODES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN_TU: 'admin_tu',
  GURU: 'guru',
  ORANG_TUA: 'orang_tua',
  PENDAFTAR: 'pendaftar'
};

// ============================================================================
// ENTITY PREFIXES (untuk ID generator)
// ============================================================================
var ID_PREFIXES = {
  USER: 'USR',
  STUDENT: 'STU',
  PARENT: 'PAR',
  TEACHER: 'TCH',
  SCHOOL: 'SCH',
  CLASS: 'CLS',
  ACADEMIC_YEAR: 'AY',
  ENROLLMENT: 'ENR',
  PPD_REGISTRATION: 'REG',
  PPD_DOCUMENT: 'REGDOC',
  STUDENT_DOCUMENT: 'STUDOC',
  ATTENDANCE: 'ATT',
  DEVELOPMENT: 'DEV',
  TEACHER_NOTE: 'NOTE',
  INVOICE: 'INV',
  PAYMENT: 'PAY',
  ANNOUNCEMENT: 'ANN',
  NEWS: 'NWS',
  EVENT: 'EVT',
  GALLERY: 'GAL',
  ACTIVITY_LOG: 'LOG',
  NOTIFICATION: 'NOTIF',
  PERMISSION: 'PERM',
  ROLE: 'ROLE',
  ROLE_PERMISSION: 'RP'
};

// ============================================================================
// SHEET NAMES (nama tab di Google Sheets)
// ============================================================================
var SHEET_NAMES = {
  CONFIG: 'config',
  ID_COUNTERS: 'id_counters',
  USERS: 'users',
  ROLES: 'roles',
  PERMISSIONS: 'permissions',
  ROLE_PERMISSIONS: 'role_permissions',
  SCHOOLS: 'schools',
  ACADEMIC_YEARS: 'academic_years',
  CLASSES: 'classes',
  STUDENTS: 'students',
  PARENTS: 'parents',
  PARENT_STUDENT_RELATIONS: 'parent_student_relations',
  TEACHERS: 'teachers',
  TEACHER_CLASS_ASSIGNMENTS: 'teacher_class_assignments',
  ENROLLMENTS: 'enrollments',
  PPDB_PERIODS: 'ppdb_periods',
  PPDB_REGISTRATIONS: 'ppdb_registrations',
  PPDB_DOCUMENTS: 'ppdb_documents',
  STUDENT_DOCUMENTS: 'student_documents',
  ATTENDANCE: 'attendance',
  STUDENT_DEVELOPMENT: 'student_development',
  TEACHER_NOTES: 'teacher_notes',
  INVOICES: 'invoices',
  PAYMENTS: 'payments',
  ANNOUNCEMENTS: 'announcements',
  NEWS: 'news',
  EVENTS: 'events',
  GALLERIES: 'galleries',
  ACTIVITY_LOGS: 'activity_logs',
  NOTIFICATIONS: 'notifications',
  SYSTEM_SETTINGS: 'system_settings',
  USER_NOTIFICATION_PREFERENCES: 'user_notification_preferences',
  MIGRATIONS: 'migrations'
};

// ============================================================================
// ENUMS (Status values yang sering dipakai)
// ============================================================================
var STATUS = {
  // User
  USER_ACTIVE: 'active',
  USER_INACTIVE: 'inactive',
  USER_SUSPENDED: 'suspended',
  USER_PENDING: 'pending_verification',

  // Student
  STUDENT_ACTIVE: 'active',
  STUDENT_GRADUATED: 'graduated',
  STUDENT_TRANSFER: 'transfer',
  STUDENT_DROPOUT: 'dropout',
  STUDENT_ALUMNI: 'alumni',

  // PPDB
  PPD_DRAFT: 'draft',
  PPD_SUBMITTED: 'submitted',
  PPD_WAITING_VERIFICATION: 'waiting_verification',
  PPD_NEEDS_REVISION: 'needs_revision',
  PPD_VERIFIED: 'verified',
  PPD_ACCEPTED: 'accepted',
  PPD_REJECTED: 'rejected',
  PPD_RE_REGISTRATION: 're_registration',
  PPD_ACTIVE_STUDENT: 'active_student',

  // Attendance
  ATT_HADIR: 'hadir',
  ATT_IZIN: 'izin',
  ATT_SAKIT: 'sakit',
  ATT_ALPHA: 'alpha',

  // Payment
  INV_UNPAID: 'unpaid',
  INV_PARTIAL: 'partial',
  INV_PAID: 'paid',
  INV_OVERDUE: 'overdue',
  INV_CANCELLED: 'cancelled',

  PAY_PENDING: 'menunggu_verifikasi',
  PAY_VERIFIED: 'verified',
  PAY_REJECTED: 'rejected',

  // Content
  CONTENT_DRAFT: 'draft',
  CONTENT_PUBLISHED: 'published',
  CONTENT_ARCHIVED: 'archived',
  CONTENT_CANCELLED: 'cancelled',

  // Invoice type
  INVOICE_SPP: 'spp',
  INVOICE_DAFTAR_ULANG: 'daftar_ulang',
  INVOICE_LAINNYA: 'lainnya',

  // Gender
  GENDER_L: 'L',
  GENDER_P: 'P',

  // Soft delete
  NOT_DELETED: 'FALSE',
  DELETED: 'TRUE'
};

var RELATION_TYPES = ['ayah', 'ibu', 'wali'];
var RELIGIONS = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya'];
var SCHOOL_LEVELS = ['PAUD', 'TK', 'SD', 'SMP', 'SMA', 'lainnya'];
var CLASS_LEVELS = ['PAUD', 'PAUD-A', 'PAUD-B', 'TK-A', 'TK-B', 'TK_A', 'TK_B', 'TPQ'];
var TEACHER_POSITIONS = ['guru_kelas', 'guru_pendamping', 'kepsek', 'staff'];
var DOCUMENT_TYPES = [
  'akta_kelahiran',
  'kartu_keluarga',
  'ktp_ortu',
  'foto_anak',
  'ijazah',
  'rapor',
  'surat_pernyataan',
  'surat_keterangan',
  'lainnya'
];

// ============================================================================
// NOTIFICATION
// ============================================================================
var NOTIFICATION_TYPES = {
  PPD: 'ppdb',
  PAYMENT: 'payment',
  ANNOUNCEMENT: 'announcement',
  DEVELOPMENT: 'development',
  ATTENDANCE: 'attendance',
  SYSTEM: 'system'
};

var NOTIFICATION_CHANNELS = {
  IN_APP: 'in_app',
  EMAIL: 'email',
  WHATSAPP: 'whatsapp'
};

// ============================================================================
// ACTIVITY LOG
// ============================================================================
var LOG_ACTIONS = [
  'login',
  'logout',
  'create',
  'read',
  'update',
  'delete',
  'verify',
  'approve',
  'reject',
  'export',
  'backup',
  'restore'
];

var LOG_STATUS = {
  SUCCESS: 'success',
  FAILED: 'failed'
};

// ============================================================================
// BACKUP
// ============================================================================
var BACKUP_CONFIG = {
  // Cron trigger: setiap hari Minggu jam 02:00 WIB
  dayOfWeek: ScriptApp.WeekDay.SUNDAY,
  hour: 2,
  minute: 0,

  // Retensi backup (bulan)
  retentionMonths: 3
};

// ============================================================================
// HTTP STATUS CODES (untuk response)
// ============================================================================
var HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// ============================================================================
// ERROR CODES
// ============================================================================
var ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  INSUFFICIENT_PERMISSION: 'INSUFFICIENT_PERMISSION'
};

// ============================================================================
// SYSTEM USER (untuk log yang dibuat oleh sistem, bukan user)
// ============================================================================
var SYSTEM_USER_ID = 'system';

// ============================================================================
// HELPER: Get spreadsheet
// ============================================================================
function getDatabase() {
  if (!SPREADSHEET_ID || SPREADSHEET_ID === 'PASTE_SPREADSHEET_ID_DISINI') {
    throw new Error('SPREADSHEET_ID belum dikonfigurasi di Config.gs');
  }
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getSheet(sheetName) {
  var db = getDatabase();
  var sheet = db.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Sheet "' + sheetName + '" tidak ditemukan');
  }
  return sheet;
}

function getDriveRootFolder() {
  if (!DRIVE_ROOT_FOLDER_ID || DRIVE_ROOT_FOLDER_ID === 'PASTE_FOLDER_ID_DISINI') {
    throw new Error('DRIVE_ROOT_FOLDER_ID belum dikonfigurasi di Config.gs');
  }
  return DriveApp.getFolderById(DRIVE_ROOT_FOLDER_ID);
}

// ============================================================================
// HELPER: Build API response
// ============================================================================
function buildResponse(success, data, error, meta) {
  return {
    success: success,
    data: data || null,
    error: error || null,
    meta: Object.assign({
      timestamp: new Date().toISOString(),
      request_id: Utilities.getUuid(),
      version: APP_VERSION
    }, meta || {})
  };
}

function successResponse(data, meta) {
  return buildResponse(true, data, null, meta);
}

function errorResponse(code, message, details, httpStatus) {
  return buildResponse(false, null, {
    code: code,
    message: message,
    details: details || {}
  }, {
    http_status: httpStatus || HTTP_STATUS.INTERNAL_ERROR
  });
}