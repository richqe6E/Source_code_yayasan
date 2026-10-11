/**
 * @fileoverview Apps Script backend - Auth & Activity Log Services.
 * Handles: login, logout, token verification, activity log writing.
 *
 * @version 1.0
 * @date 2026-09-12
 */

// ============================================================================
// AUTH SERVICE
// ============================================================================

var AuthService = (function () {

  /**
   * Login dengan email & password.
   * Verify password via Firebase Auth (recommended) atau local hash.
   *
   * @param {string} email
   * @param {string} password
   * @param {Object} e - event object (for IP/UA)
   * @returns {Object} response
   */
  function login(email, password, e) {
    // Validasi input
    if (!email || !password) {
      return errorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Email dan password wajib diisi',
        { missing: !email ? ['email'] : ['password'] },
        HTTP_STATUS.BAD_REQUEST
      );
    }

    email = String(email).toLowerCase().trim();

    // Cari user di database
    var user = findWhere(SHEET_NAMES.USERS, { email: email }, { includeDeleted: true })[0];

    if (!user) {
      logActivity({
        action: 'login',
        module: 'auth',
        description: 'Login gagal: user tidak ditemukan (' + email + ')',
        status: LOG_STATUS.FAILED,
        ipAddress: getClientIp(e),
        userAgent: getUserAgent(e),
        errorMessage: 'User not found'
      });
      return errorResponse(
        'INVALID_CREDENTIALS',
        'Email atau password salah',
        {},
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // Cek status user
    if (user.status !== STATUS.USER_ACTIVE) {
      logActivity({
        userId: user.id,
        action: 'login',
        module: 'auth',
        description: 'Login gagal: akun tidak aktif',
        status: LOG_STATUS.FAILED,
        ipAddress: getClientIp(e),
        userAgent: getUserAgent(e),
        errorMessage: 'Account not active: ' + user.status
      });
      return errorResponse(
        'ACCOUNT_INACTIVE',
        'Akun tidak aktif. Hubungi admin.',
        { status: user.status },
        HTTP_STATUS.FORBIDDEN
      );
    }

    // Cek lockout
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      logActivity({
        userId: user.id,
        action: 'login',
        module: 'auth',
        description: 'Login gagal: akun terkunci',
        status: LOG_STATUS.FAILED,
        ipAddress: getClientIp(e),
        userAgent: getUserAgent(e),
        errorMessage: 'Account locked until ' + user.locked_until
      });
      return errorResponse(
        ERROR_CODES.ACCOUNT_LOCKED,
        'Akun terkunci hingga ' + formatDateTimeId(user.locked_until),
        { locked_until: user.locked_until },
        HTTP_STATUS.FORBIDDEN
      );
    }

    // Verify password
    var passwordValid = false;

    if (APP_ENV === 'development' && password === 'dev123456') {
      // Dev shortcut (HAPUS di production)
      passwordValid = true;
    } else if (user.password_hash && user.password_hash.indexOf('$2') === 0) {
      // bcrypt format (Firebase Auth) — verifikasi via Firebase
      passwordValid = verifyPasswordViaFirebase(email, password);
    } else {
      // Legacy: hash lokal
      passwordValid = (hashPassword(password) === user.password_hash);
    }

    if (!passwordValid) {
      var failedCount = (parseInt(user.failed_login_count) || 0) + 1;
      var lockUntil = null;

      if (failedCount >= SECURITY.maxFailedLoginAttempts) {
        lockUntil = new Date(Date.now() + SECURITY.lockoutDurationSeconds * 1000).toISOString();
      }

      updateRow(SHEET_NAMES.USERS, user.id, {
        failed_login_count: failedCount,
        locked_until: lockUntil
      });

      logActivity({
        userId: user.id,
        action: 'login',
        module: 'auth',
        description: 'Login gagal: password salah (percobaan ke-' + failedCount + ')',
        status: LOG_STATUS.FAILED,
        ipAddress: getClientIp(e),
        userAgent: getUserAgent(e),
        errorMessage: 'Wrong password'
      });

      return errorResponse(
        'INVALID_CREDENTIALS',
        lockUntil
          ? 'Akun terkunci karena terlalu banyak percobaan gagal'
          : 'Email atau password salah',
        { failed_attempts: failedCount },
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // Login berhasil — reset failed count, update last_login
    updateRow(SHEET_NAMES.USERS, user.id, {
      failed_login_count: 0,
      locked_until: null,
      last_login: nowIso()
    });

    // Generate session token (signed JWT-like, simple)
    var token = generateSessionToken(user);

    // Get role & permissions
    var roleData = getUserRoleWithPermissions(user);

    logActivity({
      userId: user.id,
      action: 'login',
      module: 'auth',
      description: 'Login berhasil',
      status: LOG_STATUS.SUCCESS,
      ipAddress: getClientIp(e),
      userAgent: getUserAgent(e)
    });

    return successResponse({
      token: token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role: roleData.role,
        permissions: roleData.permissions,
        linked_entity_id: user.linked_entity_id,
        linked_entity_type: user.linked_entity_type
      }
    });
  }

  /**
   * Logout user. Hanya catat di activity log (token stateless, client hapus sendiri).
   *
   * @param {string} userId
   * @param {Object} e
   * @returns {Object}
   */
  function logout(userId, e) {
    if (!userId) {
      return errorResponse(ERROR_CODES.UNAUTHORIZED, 'User ID diperlukan', {}, HTTP_STATUS.UNAUTHORIZED);
    }

    logActivity({
      userId: userId,
      action: 'logout',
      module: 'auth',
      description: 'Logout',
      status: LOG_STATUS.SUCCESS,
      ipAddress: getClientIp(e),
      userAgent: getUserAgent(e)
    });

    return successResponse({ message: 'Logout berhasil' });
  }

  /**
   * Get current user info dari token.
   *
   * @param {string} token
   * @returns {Object}
   */
  function me(token) {
    var session = verifySessionToken(token);
    if (!session) {
      return errorResponse(ERROR_CODES.INVALID_TOKEN, 'Token tidak valid', {}, HTTP_STATUS.UNAUTHORIZED);
    }

    var user = getById(SHEET_NAMES.USERS, session.userId);
    if (!user || user.status !== STATUS.USER_ACTIVE) {
      return errorResponse(ERROR_CODES.UNAUTHORIZED, 'User tidak ditemukan / tidak aktif', {}, HTTP_STATUS.UNAUTHORIZED);
    }

    var roleData = getUserRoleWithPermissions(user);

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role: roleData.role,
        permissions: roleData.permissions,
        linked_entity_id: user.linked_entity_id,
        linked_entity_type: user.linked_entity_type
      }
    });
  }

  /**
   * Change password untuk user yang sedang login.
   * Memerlukan token aktif + password lama yang valid.
   */
  function changePassword(token, oldPassword, newPassword) {
    var session = verifySessionToken(token);
    if (!session) {
      return errorResponse(ERROR_CODES.INVALID_TOKEN, 'Token tidak valid', {}, HTTP_STATUS.UNAUTHORIZED);
    }

    if (!oldPassword || !newPassword) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR,
        'Password lama dan baru wajib diisi', {}, HTTP_STATUS.BAD_REQUEST);
    }

    if (String(newPassword).length < 8) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR,
        'Password baru minimal 8 karakter', {}, HTTP_STATUS.BAD_REQUEST);
    }

    var user = getById(SHEET_NAMES.USERS, session.userId);
    if (!user) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'User tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    var passwordValid = false;
    if (APP_ENV === 'development' && oldPassword === 'dev123456') {
      passwordValid = true;
    } else if (user.password_hash && user.password_hash.indexOf('$2') === 0) {
      passwordValid = verifyPasswordViaFirebase(user.email, oldPassword);
    } else {
      passwordValid = (hashPassword(oldPassword) === user.password_hash);
    }

    if (!passwordValid) {
      return errorResponse('INVALID_CREDENTIALS',
        'Password lama salah', {}, HTTP_STATUS.UNAUTHORIZED);
    }

    updateRow(SHEET_NAMES.USERS, user.id, {
      password_hash: hashPassword(newPassword)
    }, user.id);

    logActivity({
      userId: user.id,
      action: 'change_password',
      module: 'auth',
      description: 'User mengganti password'
    });

    return successResponse({ message: 'Password berhasil diganti' });
  }

  /**
   * Verify token dan return session info.
   *
   * @param {string} token
   * @returns {Object|null} {userId, role, permissions, expiresAt} atau null
   */
  function verifyToken(token) {
    var session = verifySessionToken(token);
    if (!session) return null;

    var user = getById(SHEET_NAMES.USERS, session.userId);
    if (!user || user.status !== STATUS.USER_ACTIVE) return null;

    // Cek absolute session timeout
    if (new Date(session.absoluteExpiry) < new Date()) {
      return null;
    }

    return {
      userId: user.id,
      user: user,
      expiresAt: session.expiresAt,
      absoluteExpiry: session.absoluteExpiry
    };
  }

  // --------------------------------------------------------------------------
  // INTERNAL HELPERS
  // --------------------------------------------------------------------------

  /**
   * Generate session token (signed).
   * Format: base64(userId + timestamp + signature)
   * Untuk MVP. Production: pakai JWT proper dengan library.
   */
  function generateSessionToken(user) {
    var now = Date.now();
    var expiresAt = new Date(now + SECURITY.tokenExpireSeconds * 1000).toISOString();
    var absoluteExpiry = new Date(now + SECURITY.absoluteSessionExpireSeconds * 1000).toISOString();

    var payload = JSON.stringify({
      userId: user.id,
      email: user.email,
      expiresAt: expiresAt,
      absoluteExpiry: absoluteExpiry,
      issuedAt: nowIso()
    });

    var signature = hashPassword(payload, FIREBASE_WEB_API_KEY);

    var token = Utilities.base64Encode(payload) + '.' + signature;
    return token;
  }

  /**
   * Verify session token.
   */
  function verifySessionToken(token) {
    if (!token) return null;

    var parts = token.split('.');
    if (parts.length !== 2) return null;

    try {
      var payload = Utilities.newBlob(Utilities.base64Decode(parts[0])).getDataAsString();
      var session = JSON.parse(payload);

      // Verify signature
      var expectedSig = hashPassword(payload, FIREBASE_WEB_API_KEY);
      if (parts[1] !== expectedSig) return null;

      // Cek expired
      if (new Date(session.expiresAt) < new Date()) return null;

      return session;
    } catch (e) {
      return null;
    }
  }

  /**
   * Get role & permissions untuk user.
   */
  function getUserRoleWithPermissions(user) {
    var role = getById(SHEET_NAMES.ROLES, user.role_id);

    if (!role) {
      return { role: null, permissions: [] };
    }

    // Super admin = semua permission
    if (role.code === ROLE_CODES.SUPER_ADMIN) {
      var allPerms = getSheetData(SHEET_NAMES.PERMISSIONS).map(function (p) {
        return p.code;
      });
      return {
        role: { code: role.code, name: role.name },
        permissions: ['*']
      };
    }

    // Get permissions dari role_permissions
    var rolePerms = findWhere(SHEET_NAMES.ROLE_PERMISSIONS, { role_id: role.id });
    var permIds = rolePerms.map(function (rp) { return rp.permission_id; });

    var permissions = getSheetData(SHEET_NAMES.PERMISSIONS)
      .filter(function (p) { return permIds.indexOf(p.id) !== -1; })
      .map(function (p) { return p.code; });

    return {
      role: { code: role.code, name: role.name },
      permissions: permissions
    };
  }

  /**
   * Verify password via Firebase Auth REST API.
   * Docs: https://firebase.google.com/docs/reference/rest/auth#section-sign-in-email-password
   */
  function verifyPasswordViaFirebase(email, password) {
    try {
      var url = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + FIREBASE_WEB_API_KEY;
      var payload = {
        email: email,
        password: password,
        returnSecureToken: true
      };

      var options = {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };

      var response = UrlFetchApp.fetch(url, options);
      var result = JSON.parse(response.getContentText());

      return !!result.idToken;
    } catch (e) {
      // Firebase call failed, fall back to local hash
      return false;
    }
  }

  // Public API
  return {
    login: login,
    logout: logout,
    me: me,
    changePassword: changePassword,
    verifyToken: verifyToken
  };

})();

// ============================================================================
// ACTIVITY LOG SERVICE
// ============================================================================

var ActivityLogService = (function () {

  /**
   * Tulis activity log entry.
   *
   * @param {Object} entry - {userId, action, module, entityType, entityId, description, ipAddress, userAgent, oldValues, newValues, status, errorMessage}
   * @returns {Object} created log entry
   */
  function log(entry) {
    try {
      var data = {
        timestamp: nowIso(),
        user_id: entry.userId || null,
        action: entry.action || 'read',
        module: entry.module || 'system',
        entity_type: entry.entityType || null,
        entity_id: entry.entityId || null,
        description: entry.description || '',
        ip_address: entry.ipAddress || 'unknown',
        user_agent: entry.userAgent || 'unknown',
        old_values: entry.oldValues ? safeJsonStringify(entry.oldValues) : '',
        new_values: entry.newValues ? safeJsonStringify(entry.newValues) : '',
        status: entry.status || LOG_STATUS.SUCCESS,
        error_message: entry.errorMessage || ''
      };

      data.id = generateId(ID_PREFIXES.ACTIVITY_LOG);

      // Don't trigger another log when inserting log itself (avoid infinite loop)
      insertRowNoLog(SHEET_NAMES.ACTIVITY_LOGS, data);
      return data;
    } catch (e) {
      // Logging shouldn't break main flow
      console.error('ActivityLog error:', e);
      return null;
    }
  }

  /**
   * Get logs dengan filter & pagination.
   *
   * @param {Object} filters - {userId, action, module, entityType, fromDate, toDate, page, pageSize}
   * @returns {Object}
   */
  function list(filters) {
    filters = filters || {};
    var page = filters.page || 1;
    var pageSize = filters.pageSize || 50;

    var data = getSheetData(SHEET_NAMES.ACTIVITY_LOGS, { includeDeleted: true });

    // Apply filters
    if (filters.userId) data = data.filter(function (r) { return r.user_id === filters.userId; });
    if (filters.action) data = data.filter(function (r) { return r.action === filters.action; });
    if (filters.module) data = data.filter(function (r) { return r.module === filters.module; });
    if (filters.entityType) data = data.filter(function (r) { return r.entity_type === filters.entityType; });
    if (filters.fromDate) data = data.filter(function (r) { return r.timestamp >= filters.fromDate; });
    if (filters.toDate) data = data.filter(function (r) { return r.timestamp <= filters.toDate; });

    // Sort by timestamp desc
    data.sort(function (a, b) {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    var total = data.length;
    var totalPages = Math.ceil(total / pageSize);
    var start = (page - 1) * pageSize;
    var items = data.slice(start, start + pageSize);

    return successResponse({
      items: items,
      pagination: {
        page: page,
        pageSize: pageSize,
        total: total,
        totalPages: totalPages
      }
    });
  }

  // Internal: insert tanpa trigger log (avoid infinite recursion)
  function insertRowNoLog(sheetName, data) {
    var sheet = getSheet(sheetName);
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    var row = headers.map(function (header) {
      if (header in data) return data[header];
      return '';
    });

    sheet.appendRow(row);
    return data;
  }

  return {
    log: log,
    list: list
  };

})();

// Helper global untuk backward compatibility
function logActivity(entry) {
  return ActivityLogService.log(entry);
}