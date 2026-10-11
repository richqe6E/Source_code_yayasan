/**
 * @fileoverview Apps Script backend - Notification service.
 * Handle in-app notifications + email notifications (dan stub WA).
 *
 * @version 1.0
 * @date 2026-09-12
 */

var NotificationService = (function () {

  var MAX_IN_APP_RETENTION = 100;  // keep last N notif per user

  /**
   * Kirim notifikasi in-app ke seorang user.
   * @param {string} userId - Penerima
   * @param {Object} data - { type, title, message, link?, channel? }
   */
  function sendToUser(userId, data) {
    if (!userId || !data || !data.title) {
      return null;
    }

    var notifData = {
      id: generateId(ID_PREFIXES.NOTIFICATION),
      user_id: userId,
      type: data.type || NOTIFICATION_TYPES.SYSTEM,
      title: data.title,
      message: data.message || '',
      link: data.link || '',
      read_at: '',
      channel: data.channel || NOTIFICATION_CHANNELS.IN_APP,
      sent_at: nowIso(),
      status: 'sent'
    };

    var created = insertRow(SHEET_NAMES.NOTIFICATIONS, notifData, SYSTEM_USER_ID);

    // Trim notifikasi lama (keep last MAX_IN_APP_RETENTION per user)
    trimOldNotifications(userId);

    return created;
  }

  /**
   * Kirim notifikasi ke banyak user sekaligus.
   * @param {string[]} userIds
   * @param {Object} data
   */
  function sendToUsers(userIds, data) {
    var results = [];
    userIds.forEach(function (uid) {
      var r = sendToUser(uid, data);
      if (r) results.push(r);
    });
    return results;
  }

  /**
   * Kirim notifikasi ke semua orang tua.
   */
  function notifyAllParents(data) {
    var parents = findWhere(SHEET_NAMES.USERS, {
      linked_entity_type: 'parent',
      status: STATUS.USER_ACTIVE
    });
    var userIds = parents.map(function (p) { return p.id; });
    return sendToUsers(userIds, data);
  }

  /**
   * Kirim notifikasi ke semua guru.
   */
  function notifyAllTeachers(data) {
    var teachers = findWhere(SHEET_NAMES.USERS, {
      linked_entity_type: 'teacher',
      status: STATUS.USER_ACTIVE
    });
    var userIds = teachers.map(function (t) { return t.id; });
    return sendToUsers(userIds, data);
  }

  /**
   * List notifikasi untuk user yang sedang login.
   */
  function listMine(session, params) {
    if (!session || !session.user) {
      return errorResponse(ERROR_CODES.UNAUTHORIZED, 'Sesi tidak valid, silakan login ulang', {}, HTTP_STATUS.UNAUTHORIZED);
    }

    var items = findWhere(SHEET_NAMES.NOTIFICATIONS, { user_id: session.userId });
    if (params.unread_only === 'true') {
      items = items.filter(function (n) { return !n.read_at; });
    }
    items.sort(function (a, b) { return (b.sent_at || '').localeCompare(a.sent_at || ''); });

    var unreadCount = items.filter(function (n) { return !n.read_at; }).length;

    var page = parseInt(params.page) || 1;
    var pageSize = parseInt(params.pageSize) || 20;
    var total = items.length;
    var totalPages = Math.ceil(total / pageSize);
    var start = (page - 1) * pageSize;
    var paged = items.slice(start, start + pageSize);

    return successResponse({
      items: paged,
      unread_count: unreadCount,
      pagination: { page: page, pageSize: pageSize, total: total, totalPages: totalPages }
    });
  }

  /**
   * Mark single notification as read.
   */
  function markAsRead(session, notifId) {
    var notif = getById(SHEET_NAMES.NOTIFICATIONS, notifId);
    if (!notif) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Notifikasi tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }
    if (notif.user_id !== session.userId) {
      return errorResponse(ERROR_CODES.FORBIDDEN,
        'Bukan notifikasi Anda', {}, HTTP_STATUS.FORBIDDEN);
    }
    if (notif.read_at) return successResponse({ notification: notif });  // already read

    var updated = updateRow(SHEET_NAMES.NOTIFICATIONS, notifId, { read_at: nowIso() }, session.userId);
    return successResponse({ notification: updated });
  }

  /**
   * Mark all as read.
   */
  function markAllAsRead(session) {
    var items = findWhere(SHEET_NAMES.NOTIFICATIONS, { user_id: session.userId });
    var count = 0;
    items.forEach(function (n) {
      if (!n.read_at) {
        updateRow(SHEET_NAMES.NOTIFICATIONS, n.id, { read_at: nowIso() }, session.userId);
        count++;
      }
    });
    return successResponse({ marked_count: count });
  }

  /**
   * Send email notification.
   * NOTE: Ini delegate ke MailApp bawaan Apps Script.
   */
  function sendEmail(to, subject, body, options) {
    options = options || {};
    try {
      MailApp.sendEmail({
        to: to,
        subject: subject,
        htmlBody: body,
        name: options.fromName || 'SIYAYASAN',
        noReply: true
      });
      return { success: true };
    } catch (e) {
      console.error('sendEmail error:', e);
      return { success: false, error: e.message };
    }
  }

  /**
   * Send WA notification (stub - tergantung provider).
   * Untuk MVP, hanya catat di log. Production: integrasi Fonnte/WAHA.
   */
  function sendWhatsApp(phone, message) {
    var settings = getSystemSettings();
    if (!settings.enable_wa_notification || !settings.wa_gateway) {
      return { success: false, error: 'WA notification disabled' };
    }
    // TODO: Integrasi Fonnte/WAHA/Twilio
    console.log('WA stub: would send to', phone, ':', message);
    return { success: true, stub: true };
  }

  // --------------------------------------------------------------------------
  // INTERNAL HELPERS
  // --------------------------------------------------------------------------

  function trimOldNotifications(userId) {
    var all = findWhere(SHEET_NAMES.NOTIFICATIONS, { user_id: userId });
    if (all.length <= MAX_IN_APP_RETENTION) return;

    // Sort by sent_at desc
    all.sort(function (a, b) { return (b.sent_at || '').localeCompare(a.sent_at || ''); });

    var toDelete = all.slice(MAX_IN_APP_RETENTION);
    toDelete.forEach(function (n) {
      hardDeleteRow(SHEET_NAMES.NOTIFICATIONS, n.id);
    });
  }

  function getSystemSettings() {
    var settings = {};
    var all = getSheetData(SHEET_NAMES.SYSTEM_SETTINGS);
    all.forEach(function (s) {
      settings[s.key] = s.value;
    });
    return settings;
  }

  return {
    sendToUser: sendToUser,
    sendToUsers: sendToUsers,
    notifyAllParents: notifyAllParents,
    notifyAllTeachers: notifyAllTeachers,
    listMine: listMine,
    markAsRead: markAsRead,
    markAllAsRead: markAllAsRead,
    sendEmail: sendEmail,
    sendWhatsApp: sendWhatsApp
  };

})();

// Register handlers
NotificationHandlers.list = function (session, id, params) {
  return jsonResponse(NotificationService.listMine(session, params));
};
NotificationHandlers.markRead = function (session, id, params) {
  return jsonResponse(NotificationService.markAsRead(session, id));
};
NotificationHandlers.markAllRead = function (session, id, params) {
  return jsonResponse(NotificationService.markAllAsRead(session));
};