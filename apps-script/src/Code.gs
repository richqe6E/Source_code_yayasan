/**
 * @fileoverview Apps Script backend - Main entry point & API Router.
 * Handle doGet() dan doPost() sebagai REST API.
 *
 * @version 1.0
 * @date 2026-09-12
 */

// ============================================================================
// RESPONSE BUILDERS & CONSTANTS (Fallback Safe)
// ============================================================================

var HTTP_STATUS = typeof HTTP_STATUS !== 'undefined' ? HTTP_STATUS : {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

var ERROR_CODES = typeof ERROR_CODES !== 'undefined' ? ERROR_CODES : {
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

function buildResponse(success, data, error, meta) {
  return {
    success: success,
    data: data || null,
    error: error || null,
    meta: Object.assign({
      timestamp: new Date().toISOString(),
      request_id: Utilities.getUuid(),
      version: typeof APP_VERSION !== 'undefined' ? APP_VERSION : '1.0.0'
    }, meta || {})
  };
}

function successResponse(data, meta) {
  return buildResponse(true, data, null, meta);
}

function errorResponse(code, message, details, httpStatus) {
  return buildResponse(false, null, {
    code: code || 'INTERNAL_ERROR',
    message: message || 'Terjadi kesalahan internal',
    details: details || {}
  }, {
    http_status: httpStatus || 500
  });
}

// ============================================================================
// HTTP ENTRY POINTS
// ============================================================================

/**
 * Handle GET request.
 * Pattern URL: /api/v1/{module}/{action}?token=xxx&...
 *
 * @param {Object} e - event object {parameter, queryString, ...}
 * @returns {TextOutput} JSON response
 */
function doGet(e) {
  try {
    return handleRequest(e, 'GET');
  } catch (err) {
    var payload = errorResponse('INTERNAL_ERROR', err.message, { stack: err.stack }, 500);
    return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle POST request.
 *
 * @param {Object} e
 * @returns {TextOutput}
 */
function doPost(e) {
  try {
    return handleRequest(e, 'POST');
  } catch (err) {
    var payload = errorResponse('INTERNAL_ERROR', err.message, { stack: err.stack }, 500);
    return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================================
// REQUEST ROUTER
// ============================================================================

/**
 * Main request handler. Parse path, route ke service.
 */
function handleRequest(e, method) {
  // Parse path
  var path = (e && e.parameter && e.parameter.path) || (e && e.pathInfo) || '';
  path = '/' + String(path).replace(/^\/+/, '');

  // Skip jika path kosong
  if (path === '/' || path === '') {
    return jsonResponse(successResponse({
      app: APP_NAME,
      version: APP_VERSION,
      env: APP_ENV,
      api_version: API_VERSION,
      endpoints: 'See documentation'
    }));
  }

  // Routing
  var segments = path.split('/').filter(function (s) { return s; });
  // segments[0] = 'api', segments[1] = version, segments[2] = module, segments[3+] = action/id

  if (segments[0] !== 'api') {
    return jsonResponse(errorResponse(
      'NOT_FOUND', 'Endpoint tidak ditemukan', { path: path },
      HTTP_STATUS.NOT_FOUND
    ));
  }

  var version = segments[1] || API_VERSION;
  if (version !== API_VERSION) {
    return jsonResponse(errorResponse(
      'UNSUPPORTED_VERSION', 'API version tidak didukung: ' + version,
      { supported: API_VERSION },
      HTTP_STATUS.NOT_FOUND
    ));
  }

  var moduleName = segments[2] || '';
  var action = segments[3] || '';
  var id = segments[4] || null;

  // Build params from POST body atau query string
  var params = {};
  if (e && e.parameter) {
    Object.keys(e.parameter).forEach(function (k) {
      if (k !== 'path') params[k] = e.parameter[k];
    });
  }
  if (method === 'POST' && e && e.postData && e.postData.contents) {
    try {
      var body = JSON.parse(e.postData.contents);
      Object.assign(params, body);
    } catch (err) {
      return jsonResponse(errorResponse(
        ERROR_CODES.VALIDATION_ERROR, 'Invalid JSON body', {}, HTTP_STATUS.BAD_REQUEST
      ));
    }
  }

  // Route
  return routeRequest(moduleName, action, id, method, params, e);
}

/**
 * Route ke handler yang sesuai berdasarkan module + action.
 */
function routeRequest(moduleName, action, id, method, params, e) {
  var handler = null;

  // Auth module (special: no requireAuth untuk login/register)
  if (moduleName === 'auth') {
    handler = AuthHandlers[action] || AuthHandlers['notFound'];
    return handler(method, params, e);
  }

  // Cek apakah endpoint adalah public (tidak mewajibkan token)
  var isPublicEndpoint = false;
  if (moduleName === 'ppdb' && (action === 'submit' || action === 'register' || action === 'check_status' || action === 'periods' || action === 'formSchema')) {
    isPublicEndpoint = true;
  } else if (moduleName === 'news' && (action === 'list' || action === 'get')) {
    isPublicEndpoint = true;
  } else if ((moduleName === 'galleries' || moduleName === 'gallery') && action === 'list') {
    isPublicEndpoint = true;
  } else if (moduleName === 'events' && (action === 'list' || action === 'get')) {
    isPublicEndpoint = true;
  } else if (moduleName === 'announcements' && (action === 'list' || action === 'get')) {
    isPublicEndpoint = true;
  }

  // Verify token untuk endpoint non-public, atau enrich session jika token ada
  var session = null;
  if (!isPublicEndpoint) {
    var authResult = Permissions.requireAuth(params.token);
    if (authResult.error) return jsonResponse(authResult.error);
    session = authResult.session;
  } else if (params.token) {
    var authOpt = Permissions.requireAuth(params.token);
    if (!authOpt.error) session = authOpt.session;
  }

  // Route ke module
  switch (moduleName) {
    case 'users':
      handler = UserHandlers[action] || UserHandlers.list;
      return handler(session, id, params, e);

    case 'students':
      handler = StudentHandlers[action] || StudentHandlers.list;
      return handler(session, id, params, e);

    case 'parents':
      handler = ParentHandlers[action] || ParentHandlers.list;
      return handler(session, id, params, e);

    case 'parent':
      handler = ParentHandlers[action] || ParentHandlers.list;
      return handler(session, id, params, e);

    case 'teachers':
      handler = TeacherHandlers[action] || TeacherHandlers.list;
      return handler(session, id, params, e);

    case 'classes':
      handler = ClassHandlers[action] || ClassHandlers.list;
      return handler(session, id, params, e);

    case 'academic-years':
      handler = AcademicYearHandlers[action] || AcademicYearHandlers.list;
      return handler(session, id, params, e);

    case 'ppdb':
      handler = PPDbHandlers[action] || PPDbHandlers.list;
      return handler(session, id, params, e);

    case 'attendance':
      handler = AttendanceHandlers[action] || AttendanceHandlers.list;
      return handler(session, id, params, e);

    case 'development':
      handler = DevelopmentHandlers[action] || DevelopmentHandlers.list;
      return handler(session, id, params, e);

    case 'payments':
      handler = PaymentHandlers[action] || PaymentHandlers.list;
      return handler(session, id, params, e);

    case 'invoices':
      handler = InvoiceHandlers[action] || InvoiceHandlers.list;
      return handler(session, id, params, e);

    case 'announcements':
      handler = AnnouncementHandlers[action] || AnnouncementHandlers.list;
      return handler(session, id, params, e);

    case 'news':
      handler = NewsHandlers[action] || NewsHandlers.list;
      return handler(session, id, params, e);

    case 'events':
      handler = EventHandlers[action] || EventHandlers.list;
      return handler(session, id, params, e);

    case 'galleries':
      handler = GalleryHandlers[action] || GalleryHandlers.list;
      return handler(session, id, params, e);

    case 'gallery':
      handler = GalleryHandlers[action] || GalleryHandlers.list;
      return handler(session, id, params, e);

    case 'files':
      handler = FileHandlers[action] || FileHandlers.notFound;
      return handler(session, id, params, e);

    case 'notifications':
      handler = NotificationHandlers[action] || NotificationHandlers.list;
      return handler(session, id, params, e);

    case 'logs':
      handler = LogHandlers[action] || LogHandlers.list;
      return handler(session, id, params, e);

    case 'reports':
      handler = ReportHandlers[action] || ReportHandlers.list;
      return handler(session, id, params, e);

    case 'dashboard':
      handler = DashboardHandlers[action] || DashboardHandlers.index;
      return handler(session, id, params, e);

    case 'backup':
      handler = ReportHandlers[action] || ReportHandlers.backups;
      return handler(session, id, params, e);

    default:
      return jsonResponse(errorResponse(
        'NOT_FOUND', 'Module tidak dikenal: ' + moduleName,
        { module: moduleName },
        HTTP_STATUS.NOT_FOUND
      ));
  }
}

// ============================================================================
// HELPER
// ============================================================================

function jsonResponse(responseObj) {
  return ContentService
    .createTextOutput(JSON.stringify(responseObj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// AUTH HANDLERS
// ============================================================================

var AuthHandlers = {
  login: function (method, params, e) {
    if (method !== 'POST') {
      return jsonResponse(errorResponse('METHOD_NOT_ALLOWED', 'Gunakan POST', {}, 405));
    }
    var result = AuthService.login(params.email, params.password, e);
    return jsonResponse(result);
  },

  logout: function (method, params, e) {
    if (method !== 'POST') {
      return jsonResponse(errorResponse('METHOD_NOT_ALLOWED', 'Gunakan POST', {}, 405));
    }
    var result = AuthService.logout(params.userId, e);
    return jsonResponse(result);
  },

  me: function (method, params, e) {
    if (method !== 'GET') {
      return jsonResponse(errorResponse('METHOD_NOT_ALLOWED', 'Gunakan GET', {}, 405));
    }
    var result = AuthService.me(params.token);
    return jsonResponse(result);
  },

  change_password: function (method, params, e) {
    if (method !== 'POST') {
      return jsonResponse(errorResponse('METHOD_NOT_ALLOWED', 'Gunakan POST', {}, 405));
    }
    var result = AuthService.changePassword(params.token, params.old_password, params.new_password);
    return jsonResponse(result);
  },

  notFound: function () {
    return jsonResponse(errorResponse('NOT_FOUND', 'Auth action tidak ditemukan', {}, 404));
  }
};

// ============================================================================
// PLACEHOLDER HANDLERS (akan diisi di file services/*)
// ============================================================================
// Setiap module di-import lazy agar tidak error saat service belum dibuat

var UserHandlers = typeof UserHandlers !== 'undefined' ? UserHandlers : {};
var StudentHandlers = typeof StudentHandlers !== 'undefined' ? StudentHandlers : {};
var ParentHandlers = typeof ParentHandlers !== 'undefined' ? ParentHandlers : {};
var TeacherHandlers = typeof TeacherHandlers !== 'undefined' ? TeacherHandlers : {};
var ClassHandlers = typeof ClassHandlers !== 'undefined' ? ClassHandlers : {};
var AcademicYearHandlers = typeof AcademicYearHandlers !== 'undefined' ? AcademicYearHandlers : {};
var PPDbHandlers = typeof PPDbHandlers !== 'undefined' ? PPDbHandlers : {};
var AttendanceHandlers = typeof AttendanceHandlers !== 'undefined' ? AttendanceHandlers : {};
var DevelopmentHandlers = typeof DevelopmentHandlers !== 'undefined' ? DevelopmentHandlers : {};
var PaymentHandlers = typeof PaymentHandlers !== 'undefined' ? PaymentHandlers : {};
var InvoiceHandlers = typeof InvoiceHandlers !== 'undefined' ? InvoiceHandlers : {};
var AnnouncementHandlers = typeof AnnouncementHandlers !== 'undefined' ? AnnouncementHandlers : {};
var NewsHandlers = typeof NewsHandlers !== 'undefined' ? NewsHandlers : {};
var EventHandlers = typeof EventHandlers !== 'undefined' ? EventHandlers : {};
var GalleryHandlers = typeof GalleryHandlers !== 'undefined' ? GalleryHandlers : {};
var FileHandlers = typeof FileHandlers !== 'undefined' ? FileHandlers : {};
var NotificationHandlers = typeof NotificationHandlers !== 'undefined' ? NotificationHandlers : {};
var LogHandlers = typeof LogHandlers !== 'undefined' ? LogHandlers : {};
var ReportHandlers = typeof ReportHandlers !== 'undefined' ? ReportHandlers : {};
var DashboardHandlers = typeof DashboardHandlers !== 'undefined' ? DashboardHandlers : {};

// Default handler untuk setiap module (akan di-override di services/*)
function defaultListHandler() {
  return jsonResponse(errorResponse(
    'NOT_IMPLEMENTED',
    'Handler belum diimplementasikan. Lihat folder services/.',
    {},
    HTTP_STATUS.SERVICE_UNAVAILABLE
  ));
}

if (!UserHandlers.list) UserHandlers.list = defaultListHandler;
if (!StudentHandlers.list) StudentHandlers.list = defaultListHandler;
if (!ParentHandlers.list) ParentHandlers.list = defaultListHandler;
if (!TeacherHandlers.list) TeacherHandlers.list = defaultListHandler;
if (!ClassHandlers.list) ClassHandlers.list = defaultListHandler;
if (!AcademicYearHandlers.list) AcademicYearHandlers.list = defaultListHandler;
if (!PPDbHandlers.list) PPDbHandlers.list = defaultListHandler;
if (!AttendanceHandlers.list) AttendanceHandlers.list = defaultListHandler;
if (!DevelopmentHandlers.list) DevelopmentHandlers.list = defaultListHandler;
if (!PaymentHandlers.list) PaymentHandlers.list = defaultListHandler;
if (!InvoiceHandlers.list) InvoiceHandlers.list = defaultListHandler;
if (!AnnouncementHandlers.list) AnnouncementHandlers.list = defaultListHandler;
if (!NewsHandlers.list) NewsHandlers.list = defaultListHandler;
if (!EventHandlers.list) EventHandlers.list = defaultListHandler;
if (!GalleryHandlers.list) GalleryHandlers.list = defaultListHandler;
if (!NotificationHandlers.list) NotificationHandlers.list = defaultListHandler;
if (!LogHandlers.list) LogHandlers.list = defaultListHandler;
if (!ReportHandlers.list) ReportHandlers.list = defaultListHandler;
if (!DashboardHandlers.index) DashboardHandlers.index = defaultListHandler;

// ============================================================================
// TRIGGER SETUP (jalankan sekali setelah deploy)
// ============================================================================

/**
 * Setup time-based trigger untuk backup mingguan.
 * Jalankan manual: run setupTriggers()
 */
function setupTriggers() {
  // Hapus trigger lama
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }

  // Backup mingguan (Minggu 02:00)
  ScriptApp.newTrigger('runWeeklyBackup')
    .timeBased()
    .onWeekDay(BACKUP_CONFIG.dayOfWeek)
    .atHour(BACKUP_CONFIG.hour)
    .create();

  Logger.log('Triggers setup selesai');
}

function runWeeklyBackup() {
  Logger.log('Backup mingguan berjalan...');
  // Implementasi backup di BackupService (lihat services/BackupService.gs)
  // Untuk MVP, fungsi ini bisa di-stub dulu
}