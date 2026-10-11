/**
 * @fileoverview Apps Script backend - User service.
 * Handle manajemen user oleh super admin / admin TU:
 * list, create, update, deactivate, reset password, change role.
 *
 * @version 1.0
 * @date 2026-09-12
 */

var UserService = (function () {

  /**
   * List semua user.
   */
  function list(session, params) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var users = getSheetData(SHEET_NAMES.USERS);

    if (params.role_id) {
      users = users.filter(function (u) { return u.role_id === params.role_id; });
    } else if (params.role) {
      var rObj = findWhere(SHEET_NAMES.ROLES, { code: params.role })[0];
      var targetRoleId = rObj ? rObj.id : params.role;
      users = users.filter(function (u) { return u.role_id === targetRoleId; });
    }
    if (params.status) users = users.filter(function (u) { return u.status === params.status; });
    if (params.search) {
      var q = String(params.search).toLowerCase();
      users = users.filter(function (u) {
        return (u.email && u.email.toLowerCase().indexOf(q) !== -1) ||
               (u.full_name && u.full_name.toLowerCase().indexOf(q) !== -1) ||
               (u.phone && String(u.phone).toLowerCase().indexOf(q) !== -1);
      });
    }

    var page = parseInt(params.page) || 1;
    var pageSize = parseInt(params.pageSize) || 50;
    var total = users.length;
    var totalPages = Math.ceil(total / pageSize);
    var start = (page - 1) * pageSize;
    var items = users.slice(start, start + pageSize);

    // Enrich: tambahkan role info & strip password_hash
    var enriched = items.map(function (u) {
      var role = u.role_id ? getById(SHEET_NAMES.ROLES, u.role_id) : null;
      var safeUser = Object.assign({}, u);
      delete safeUser.password_hash;
      return Object.assign({}, safeUser, {
        role_code: role ? role.code : '',
        role_name: role ? role.name : ''
      });
    });

    ActivityLogService.log({
      userId: session.userId,
      action: 'read',
      module: 'user',
      description: 'List ' + items.length + ' user'
    });

    return successResponse({
      items: enriched,
      pagination: { page: page, pageSize: pageSize, total: total, totalPages: totalPages }
    });
  }

  /**
   * Get user detail.
   */
  // Hindari nama `getById` agar tidak membayungi helper global Utils.getById(sheet, id).
  function getUser(session, userId) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;
    var user = getById(SHEET_NAMES.USERS, userId);
    if (!user) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'User tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    var role = user.role_id ? getById(SHEET_NAMES.ROLES, user.role_id) : null;
    var safeUser = Object.assign({}, user);
    delete safeUser.password_hash;

    return successResponse({
      user: Object.assign({}, safeUser, {
        role_code: role ? role.code : '',
        role_name: role ? role.name : ''
      })
    });
  }

  /**
   * Create user baru.
   */
  function create(session, data) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    // Auto-resolve role jika dikirim sebagai code
    if (!data.role_id && data.role) {
      var rObj = findWhere(SHEET_NAMES.ROLES, { code: data.role })[0];
      if (rObj) data.role_id = rObj.id;
    }
    if (data.is_active !== undefined && !data.status) {
      data.status = (data.is_active === true || data.is_active === 'true' || data.is_active === 'TRUE')
        ? STATUS.USER_ACTIVE
        : STATUS.USER_INACTIVE;
    }

    var validation = validateRequired(data, ['email', 'full_name', 'role_id']);
    if (!validation.valid) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Field wajib belum diisi',
        { missing: validation.missing }, HTTP_STATUS.BAD_REQUEST);
    }
    if (!isValidEmail(data.email)) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Format email tidak valid', {}, HTTP_STATUS.BAD_REQUEST);
    }

    var emailLower = String(data.email).toLowerCase().trim();

    // Cek duplikat
    var existing = findWhere(SHEET_NAMES.USERS, { email: emailLower });
    if (existing.length > 0) {
      return errorResponse('DUPLICATE_ENTRY',
        'Email sudah terdaftar', {}, HTTP_STATUS.CONFLICT);
    }

    var role = getById(SHEET_NAMES.ROLES, data.role_id);
    if (!role) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Role tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    var tempPassword = data.password || randomString(12);
    if (tempPassword.length < SECURITY.minPasswordLength) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR,
        'Password minimal ' + SECURITY.minPasswordLength + ' karakter', {}, HTTP_STATUS.BAD_REQUEST);
    }

    var userData = {
      id: generateId(ID_PREFIXES.USER),
      email: emailLower,
      password_hash: hashPassword(tempPassword),
      full_name: data.full_name,
      phone: data.phone || '',
      role_id: data.role_id,
      status: data.status || STATUS.USER_ACTIVE,
      linked_entity_id: data.linked_entity_id || '',
      linked_entity_type: data.linked_entity_type || 'none',
      last_login: '',
      failed_login_count: '0',
      locked_until: '',
      email_verified: data.email_verified ? 'TRUE' : 'FALSE'
    };

    var created = insertRow(SHEET_NAMES.USERS, userData, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'create',
      module: 'user',
      entityType: 'user',
      entityId: created.id,
      description: 'Buat user baru: ' + created.email + ' (' + role.name + ')',
      newValues: { email: created.email, role: role.code }
    });

    // TODO: kirim email welcome + temp password ke user.created.email

    var responseUser = Object.assign({}, created);
    delete responseUser.password_hash;

    return successResponse({
      user: responseUser,
      temp_password: tempPassword,  // ditampilkan sekali untuk diberikan ke user
      message: 'User berhasil dibuat. Temp password: ' + tempPassword
    });
  }

  /**
   * Update user (profile, role, status).
   */
  function update(session, userId, data) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var existing = getById(SHEET_NAMES.USERS, userId);
    if (!existing) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'User tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    // Hapus field sistem yang tidak boleh diubah via update
    var protectedFields = ['id', 'password_hash', 'created_at', 'created_by', 'failed_login_count'];
    protectedFields.forEach(function (f) { delete data[f]; });

    if (!data.role_id && data.role) {
      var rObj = findWhere(SHEET_NAMES.ROLES, { code: data.role })[0];
      if (rObj) data.role_id = rObj.id;
    }
    if (data.is_active !== undefined && !data.status) {
      data.status = (data.is_active === true || data.is_active === 'true' || data.is_active === 'TRUE')
        ? STATUS.USER_ACTIVE
        : STATUS.USER_INACTIVE;
    }

    if (data.email && data.email !== existing.email) {
      data.email = String(data.email).toLowerCase();
      if (!isValidEmail(data.email)) {
        return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Format email tidak valid', {}, HTTP_STATUS.BAD_REQUEST);
      }
      var dup = findWhere(SHEET_NAMES.USERS, { email: data.email });
      var conflict = dup.filter(function (u) { return u.id !== userId; });
      if (conflict.length > 0) {
        return errorResponse('DUPLICATE_ENTRY', 'Email sudah dipakai user lain', {}, HTTP_STATUS.CONFLICT);
      }
    }

    var updated = updateRow(SHEET_NAMES.USERS, userId, data, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'update',
      module: 'user',
      entityId: userId,
      description: 'Update user: ' + existing.email,
      oldValues: existing,
      newValues: updated
    });

    var responseUser = Object.assign({}, updated);
    delete responseUser.password_hash;

    return successResponse({ user: responseUser });
  }

  /**
   * Reset password user (admin set new temp password).
   */
  function resetPassword(session, userId) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var existing = getById(SHEET_NAMES.USERS, userId);
    if (!existing) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'User tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    var newPassword = randomString(12);
    updateRow(SHEET_NAMES.USERS, userId, {
      password_hash: hashPassword(newPassword),
      failed_login_count: '0',
      locked_until: ''
    }, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'update',
      module: 'user',
      entityId: userId,
      description: 'Reset password user: ' + existing.email
    });

    // TODO: kirim email notifikasi reset password

    return successResponse({
      temp_password: newPassword,
      message: 'Password berhasil direset. Temp password: ' + newPassword
    });
  }

  /**
   * Deactivate user (soft - tidak hapus).
   */
  function deactivate(session, userId) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var existing = getById(SHEET_NAMES.USERS, userId);
    if (!existing) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'User tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    if (existing.id === session.userId) {
      return errorResponse('INVALID_STATE',
        'Tidak bisa menonaktifkan akun Anda sendiri', {}, HTTP_STATUS.FORBIDDEN);
    }

    var updated = updateRow(SHEET_NAMES.USERS, userId, { status: STATUS.USER_INACTIVE }, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'update',
      module: 'user',
      entityId: userId,
      description: 'Nonaktifkan user: ' + existing.email
    });

    return successResponse({ user: updated });
  }

  /**
   * Activate user.
   */
  function activate(session, userId) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var existing = getById(SHEET_NAMES.USERS, userId);
    if (!existing) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'User tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    var updated = updateRow(SHEET_NAMES.USERS, userId, { status: STATUS.USER_ACTIVE }, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'update',
      module: 'user',
      entityId: userId,
      description: 'Aktifkan user: ' + existing.email
    });

    return successResponse({ user: updated });
  }

  /**
   * Soft delete user.
   */
  function remove(session, userId) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var existing = getById(SHEET_NAMES.USERS, userId);
    if (!existing) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'User tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    if (existing.id === session.userId) {
      return errorResponse('INVALID_STATE',
        'Tidak bisa menghapus akun Anda sendiri', {}, HTTP_STATUS.FORBIDDEN);
    }

    softDeleteRow(SHEET_NAMES.USERS, userId, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'delete',
      module: 'user',
      entityId: userId,
      description: 'Soft delete user: ' + existing.email
    });

    return successResponse({ message: 'User berhasil dihapus' });
  }

  return {
    list: list,
    getById: getUser,
    create: create,
    update: update,
    resetPassword: resetPassword,
    deactivate: deactivate,
    activate: activate,
    remove: remove
  };

})();

// Register handlers
UserHandlers.list = function (session, id, params) {
  return jsonResponse(UserService.list(session, params));
};
UserHandlers.get = function (session, id, params) {
  return jsonResponse(UserService.getById(session, id || params.id));
};
UserHandlers.create = function (session, id, params) {
  return jsonResponse(UserService.create(session, params));
};
UserHandlers.update = function (session, id, params) {
  return jsonResponse(UserService.update(session, id || params.id, params));
};
UserHandlers.resetPassword = function (session, id, params) {
  return jsonResponse(UserService.resetPassword(session, id || params.id));
};
UserHandlers.deactivate = function (session, id, params) {
  return jsonResponse(UserService.deactivate(session, id || params.id));
};
UserHandlers.activate = function (session, id, params) {
  return jsonResponse(UserService.activate(session, id || params.id));
};
UserHandlers.delete = function (session, id, params) {
  return jsonResponse(UserService.remove(session, id || params.id));
};