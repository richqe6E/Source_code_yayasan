/**
 * @fileoverview Apps Script backend - Permissions / RBAC middleware.
 * Fungsi untuk cek permission user sebelum izinkan aksi.
 *
 * @version 1.0
 * @date 2026-09-12
 */

// ============================================================================
// PERMISSIONS SERVICE
// ============================================================================

var Permissions = (function () {

  /**
   * Cek apakah user punya permission tertentu.
   *
   * @param {Object} session - session dari AuthService.verifyToken
   * @param {string} permissionCode - e.g. "student.create"
   * @returns {boolean}
   */
  function hasPermission(session, permissionCode) {
    if (!session || !session.user) return false;

    // Super admin bypass semua cek
    var role = session.user.role_id ? getById(SHEET_NAMES.ROLES, session.user.role_id) : null;
    if (role && role.code === ROLE_CODES.SUPER_ADMIN) return true;

    // Get role permissions (cached per session)
    var rolePerms = getUserPermissionCodes(session.user);

    return rolePerms.indexOf('*') !== -1 || rolePerms.indexOf(permissionCode) !== -1;
  }

  /**
   * Cek multiple permissions (semua harus ada / AND)
   *
   * @param {Object} session
   * @param {string[]} permissionCodes
   * @returns {boolean}
   */
  function hasAllPermissions(session, permissionCodes) {
    if (!session) return false;
    for (var i = 0; i < permissionCodes.length; i++) {
      if (!hasPermission(session, permissionCodes[i])) return false;
    }
    return true;
  }

  /**
   * Cek apakah user punya SALAH SATU dari permissions (OR)
   */
  function hasAnyPermission(session, permissionCodes) {
    if (!session) return false;
    for (var i = 0; i < permissionCodes.length; i++) {
      if (hasPermission(session, permissionCodes[i])) return true;
    }
    return false;
  }

  /**
   * Cek role user (bukan permission granular).
   */
  function hasRole(session, roleCode) {
    if (!session || !session.user) return false;
    var role = getById(SHEET_NAMES.ROLES, session.user.role_id);
    return role && role.code === roleCode;
  }

  function isSuperAdmin(session) {
    return hasRole(session, ROLE_CODES.SUPER_ADMIN);
  }

  function isAdminTU(session) {
    return hasRole(session, ROLE_CODES.ADMIN_TU);
  }

  function isGuru(session) {
    return hasRole(session, ROLE_CODES.GURU);
  }

  function isOrangTua(session) {
    return hasRole(session, ROLE_CODES.ORANG_TUA);
  }

  function isPendaftar(session) {
    return hasRole(session, ROLE_CODES.PENDAFTAR);
  }

  /**
   * Get list of permission codes untuk user (cached per session)
   */
  function getUserPermissionCodes(user) {
    if (!user || !user.role_id) return [];

    // Cache key di session
    if (user._cached_perms) return user._cached_perms;

    var rolePerms = findWhere(SHEET_NAMES.ROLE_PERMISSIONS, { role_id: user.role_id });
    var permIds = rolePerms.map(function (rp) { return rp.permission_id; });

    var permissions = getSheetData(SHEET_NAMES.PERMISSIONS)
      .filter(function (p) { return permIds.indexOf(p.id) !== -1; })
      .map(function (p) { return p.code; });

    user._cached_perms = permissions;
    return permissions;
  }

  // --------------------------------------------------------------------------
  // MIDDLEWARE WRAPPER
  // --------------------------------------------------------------------------

  /**
   * Wrap handler dengan permission requirement.
   * Auto log ke activity log jika gagal.
   *
   * @param {Object} session
   * @param {string|string[]} requiredPermissions
   * @param {Function} handler - Function yang dijalankan jika authorized
   * @returns {Object}
   */
  function requirePermission(session, requiredPermissions, handler) {
    var perms = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

    if (!hasAllPermissions(session, perms)) {
      ActivityLogService.log({
        userId: session && session.userId,
        action: 'read',
        module: 'permission',
        description: 'Akses ditolak: permission tidak cukup (' + perms.join(',') + ')',
        status: LOG_STATUS.FAILED,
        errorMessage: 'Insufficient permissions'
      });

      return errorResponse(
        ERROR_CODES.FORBIDDEN,
        'Anda tidak memiliki akses untuk aksi ini',
        { required: perms },
        HTTP_STATUS.FORBIDDEN
      );
    }

    return handler();
  }

  /**
   * Require authentication (token valid).
   */
  function requireAuth(token) {
    var session = AuthService.verifyToken(token);
    if (!session) {
      return { session: null, error: errorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'Silakan login terlebih dahulu',
        {},
        HTTP_STATUS.UNAUTHORIZED
      )};
    }
    return { session: session, error: null };
  }

  /**
   * Role-based access guard (mirror of local-api.js rbacDeny).
   * Return errorResponse jika role user TIDAK termasuk whitelist.
   * Super admin bypass. Return null jika diizinkan.
   *
   * @param {Object} session - session.user.role_id harus valid
   * @param {string[]} allowedRoles - daftar role_code yang diizinkan
   * @returns {Object|null} errorResponse (403/401) atau null
   */
  function rbacDeny(session, allowedRoles) {
    if (!session || !session.user) {
      return errorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'Sesi tidak valid, silakan login ulang',
        {},
        HTTP_STATUS.UNAUTHORIZED
      );
    }
    if (isSuperAdmin(session)) return null;
    if (!allowedRoles || !allowedRoles.length) {
      return errorResponse(
        ERROR_CODES.FORBIDDEN,
        'Tidak ada role yang diizinkan untuk aksi ini',
        {},
        HTTP_STATUS.FORBIDDEN
      );
    }
    for (var i = 0; i < allowedRoles.length; i++) {
      if (hasRole(session, allowedRoles[i])) return null;
    }
    return errorResponse(
      ERROR_CODES.FORBIDDEN,
      'Anda tidak memiliki akses untuk aksi ini',
      { allowed: allowedRoles },
      HTTP_STATUS.FORBIDDEN
    );
  }

  // --------------------------------------------------------------------------
  // DATA ISOLATION CHECKS
  // --------------------------------------------------------------------------

  /**
   * Cek apakah user boleh akses data student tertentu.
   * - Orang tua: hanya anaknya sendiri
   * - Guru: hanya siswa di kelas yang diajar
   * - Admin TU/Super Admin: semua
   */
  function canAccessStudent(session, studentId) {
    if (!session) return false;

    if (isSuperAdmin(session) || isAdminTU(session)) return true;

    if (isGuru(session)) {
      var teacher = getById(SHEET_NAMES.TEACHERS, session.user.linked_entity_id);
      if (!teacher) return false;

      // Get classes yang diajar guru ini
      var classAssignments = findWhere(SHEET_NAMES.TEACHER_CLASS_ASSIGNMENTS, {
        teacher_id: teacher.id,
        status: 'active'
      });
      var classIds = classAssignments.map(function (ca) { return ca.class_id; });

      // Cek apakah student ada di salah satu kelas tersebut
      var student = getById(SHEET_NAMES.STUDENTS, studentId);
      if (!student) return false;

      return classIds.indexOf(student.current_class_id) !== -1;
    }

    if (isOrangTua(session)) {
      var parent = getById(SHEET_NAMES.PARENTS, session.user.linked_entity_id);
      if (!parent) return false;

      var relations = findWhere(SHEET_NAMES.PARENT_STUDENT_RELATIONS, {
        parent_id: parent.id,
        student_id: studentId
      });
      return relations.length > 0;
    }

    return false;
  }

  /**
   * Filter list of student IDs yang boleh diakses user.
   */
  function filterAccessibleStudentIds(session, studentIds) {
    if (!session || !studentIds || studentIds.length === 0) return [];

    if (isSuperAdmin(session) || isAdminTU(session)) {
      return studentIds;
    }

    if (isGuru(session)) {
      var teacher = getById(SHEET_NAMES.TEACHERS, session.user.linked_entity_id);
      if (!teacher) return [];

      var classAssignments = findWhere(SHEET_NAMES.TEACHER_CLASS_ASSIGNMENTS, {
        teacher_id: teacher.id,
        status: 'active'
      });
      var classIds = classAssignments.map(function (ca) { return ca.class_id; });

      return studentIds.filter(function (sid) {
        var student = getById(SHEET_NAMES.STUDENTS, sid);
        return student && classIds.indexOf(student.current_class_id) !== -1;
      });
    }

    if (isOrangTua(session)) {
      var parent = getById(SHEET_NAMES.PARENTS, session.user.linked_entity_id);
      if (!parent) return [];

      var relations = findWhere(SHEET_NAMES.PARENT_STUDENT_RELATIONS, {
        parent_id: parent.id
      });
      var allowedIds = relations.map(function (r) { return r.student_id; });

      return studentIds.filter(function (sid) {
        return allowedIds.indexOf(sid) !== -1;
      });
    }

    return [];
  }

  return {
    hasPermission: hasPermission,
    hasAllPermissions: hasAllPermissions,
    hasAnyPermission: hasAnyPermission,
    hasRole: hasRole,
    isSuperAdmin: isSuperAdmin,
    isAdminTU: isAdminTU,
    isGuru: isGuru,
    isOrangTua: isOrangTua,
    isPendaftar: isPendaftar,
    getUserPermissionCodes: getUserPermissionCodes,
    requirePermission: requirePermission,
    requireAuth: requireAuth,
    rbacDeny: rbacDeny,
    canAccessStudent: canAccessStudent,
    filterAccessibleStudentIds: filterAccessibleStudentIds
  };

})();