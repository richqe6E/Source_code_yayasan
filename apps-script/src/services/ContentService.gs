/**
 * @fileoverview Apps Script backend - Content services.
 * Announcement, News, Event, Gallery - pattern CRUD seragam untuk konten publik.
 *
 * @version 1.0
 * @date 2026-09-12
 */

// ============================================================================
// ANNOUNCEMENT SERVICE
// ============================================================================

var AnnouncementService = (function () {

  /**
   * List announcements.
   * - target_audience: 'all' | 'parents' | 'teachers' | 'admin'
   */
  function list(session, params) {
    var items = getSheetData(SHEET_NAMES.ANNOUNCEMENTS);

    // Pengunjung publik / non-admin hanya melihat yang dipublikasikan atau dipin
    var isAdmin = session && (session.user && (session.user.role === ROLE_CODES.SUPER_ADMIN || session.user.role === ROLE_CODES.ADMIN_TU));
    if (!isAdmin) {
      items = items.filter(function (a) { return a.status === 'published' || a.status === 'pinned'; });
    } else if (params.status) {
      items = items.filter(function (a) { return a.status === params.status; });
    }

    if (params.target_audience) {
      items = items.filter(function (a) {
        return a.target_audience === params.target_audience ||
               a.target_audience === 'all';
      });
    }
    if (params.school_id) items = items.filter(function (a) { return a.school_id === params.school_id; });

    // Sort: pinned first, lalu published_at desc
    items.sort(function (a, b) {
      if (a.is_pinned === 'TRUE' && b.is_pinned !== 'TRUE') return -1;
      if (a.is_pinned !== 'TRUE' && b.is_pinned === 'TRUE') return 1;
      return (b.published_at || '').localeCompare(a.published_at || '');
    });

    var page = parseInt(params.page) || 1;
    var pageSize = parseInt(params.pageSize) || 20;
    var total = items.length;
    var totalPages = Math.ceil(total / pageSize);
    var start = (page - 1) * pageSize;
    var paged = items.slice(start, start + pageSize);

    return successResponse({
      items: paged,
      pagination: { page: page, pageSize: pageSize, total: total, totalPages: totalPages }
    });
  }

  // Hindari nama `getById` agar tidak membayangi helper global.
  function getAnnouncement(session, annId) {
    var ann = getById(SHEET_NAMES.ANNOUNCEMENTS, annId);
    if (!ann) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Pengumuman tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }
    return successResponse({ announcement: ann });
  }

  function create(session, data) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;
    var validation = validateRequired(data, ['title', 'content']);
    if (!validation.valid) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Field wajib belum diisi',
        { missing: validation.missing }, HTTP_STATUS.BAD_REQUEST);
    }

    var annData = {
      id: generateId(ID_PREFIXES.ANNOUNCEMENT),
      title: data.title,
      content: data.content,
      target_audience: data.target_audience || 'all',
      school_id: data.school_id || '',
      is_pinned: data.is_pinned ? 'TRUE' : 'FALSE',
      published_at: data.published_at || nowIso(),
      expires_at: data.expires_at || '',
      status: data.status || STATUS.CONTENT_PUBLISHED
    };

    var created = insertRow(SHEET_NAMES.ANNOUNCEMENTS, annData, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'create',
      module: 'announcement',
      entityType: 'announcement',
      entityId: created.id,
      description: 'Buat pengumuman: ' + created.title
    });

    return successResponse({ announcement: created });
  }

  function update(session, annId, data) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;
    var existing = getById(SHEET_NAMES.ANNOUNCEMENTS, annId);
    if (!existing) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Pengumuman tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    if (data.is_pinned !== undefined) data.is_pinned = data.is_pinned ? 'TRUE' : 'FALSE';
    var updated = updateRow(SHEET_NAMES.ANNOUNCEMENTS, annId, data, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'update',
      module: 'announcement',
      entityId: annId,
      description: 'Update pengumuman: ' + existing.title
    });

    return successResponse({ announcement: updated });
  }

  function remove(session, annId) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;
    var existing = getById(SHEET_NAMES.ANNOUNCEMENTS, annId);
    if (!existing) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Pengumuman tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }
    softDeleteRow(SHEET_NAMES.ANNOUNCEMENTS, annId, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'delete',
      module: 'announcement',
      entityId: annId,
      description: 'Hapus pengumuman: ' + existing.title
    });

    return successResponse({ message: 'Pengumuman dihapus' });
  }

  return {
    list: list,
    getById: getAnnouncement,
    create: create,
    update: update,
    remove: remove
  };

})();

AnnouncementHandlers.list = function (session, id, params) {
  return jsonResponse(AnnouncementService.list(session, params));
};
AnnouncementHandlers.get = function (session, id, params) {
  return jsonResponse(AnnouncementService.getById(session, id));
};
AnnouncementHandlers.create = function (session, id, params) {
  return jsonResponse(AnnouncementService.create(session, params));
};
AnnouncementHandlers.update = function (session, id, params) {
  return jsonResponse(AnnouncementService.update(session, id || params.id, params));
};
AnnouncementHandlers.remove = function (session, id, params) {
  return jsonResponse(AnnouncementService.remove(session, id || params.id));
};


// ============================================================================
// NEWS SERVICE
// ============================================================================

var NewsService = (function () {

  function list(session, params) {
    if (session && !Permissions.hasPermission(session, 'news.read')) {
      return errorResponse(ERROR_CODES.FORBIDDEN, 'Tidak punya akses', {}, HTTP_STATUS.FORBIDDEN);
    }

    var items = getSheetData(SHEET_NAMES.NEWS)
      .filter(function (n) { return n.status === 'published' && n.is_deleted !== 'TRUE'; });

    if (params.category) items = items.filter(function (n) { return n.category === params.category; });
    if (params.search) {
      var q = String(params.search).toLowerCase();
      items = items.filter(function (n) {
        return (n.title && n.title.toLowerCase().indexOf(q) !== -1) ||
               (n.content && n.content.toLowerCase().indexOf(q) !== -1);
      });
    }

    items.sort(function (a, b) { return (b.published_at || '').localeCompare(a.published_at || ''); });

    var page = parseInt(params.page) || 1;
    var pageSize = parseInt(params.pageSize) || 12;
    var total = items.length;
    var totalPages = Math.ceil(total / pageSize);
    var start = (page - 1) * pageSize;
    var paged = items.slice(start, start + pageSize);

    return successResponse({
      items: paged,
      pagination: { page: page, pageSize: pageSize, total: total, totalPages: totalPages }
    });
  }

  function getBySlug(session, slug) {
    var items = getSheetData(SHEET_NAMES.NEWS).filter(function (n) { return n.slug === slug; });
    var news = items[0];
    if (!news) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Berita tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }
    if (news.status !== 'published') {
      return errorResponse(ERROR_CODES.FORBIDDEN, 'Berita belum dipublikasi', {}, HTTP_STATUS.FORBIDDEN);
    }

    // Increment view count (best effort)
    updateRow(SHEET_NAMES.NEWS, news.id, {
      view_count: String((parseInt(news.view_count) || 0) + 1)
    }, SYSTEM_USER_ID);

    return successResponse({ news: news });
  }

  function create(session, data) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;
    var validation = validateRequired(data, ['title', 'content']);
    if (!validation.valid) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Field wajib belum diisi',
        { missing: validation.missing }, HTTP_STATUS.BAD_REQUEST);
    }

    var slug = data.slug || generateSlug(data.title);

    var newsData = {
      id: generateId(ID_PREFIXES.NEWS),
      title: data.title,
      slug: slug,
      content: data.content,
      excerpt: data.excerpt || (data.content.substring(0, 200) + '...'),
      featured_image_file_id: data.featured_image_file_id || '',
      category: data.category || 'umum',
      tags: data.tags || '',
      author_id: session.userId,
      view_count: '0',
      published_at: data.published_at || nowIso(),
      status: data.status || STATUS.CONTENT_PUBLISHED
    };

    var created = insertRow(SHEET_NAMES.NEWS, newsData, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'create',
      module: 'news',
      entityType: 'news',
      entityId: created.id,
      description: 'Buat berita: ' + created.title
    });

    return successResponse({ news: created });
  }

  function update(session, newsId, data) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;
    var existing = getById(SHEET_NAMES.NEWS, newsId);
    if (!existing) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Berita tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }
    var updated = updateRow(SHEET_NAMES.NEWS, newsId, data, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'update',
      module: 'news',
      entityId: newsId,
      description: 'Update berita: ' + existing.title
    });

    return successResponse({ news: updated });
  }

  // NOTE: jangan bernama `getById` karena akan membayangi (shadow) helper
  // global `getById(sheet, id)` dari Utils.gs. Jika dibayangi, panggilan
  // `getById(SHEET, id)` di bawah ini akan memanggil dirinya sendiri →
  // infinite recursion (Maximum call stack size exceeded).
  function getNews(session, newsId) {
    if (!newsId) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Berita tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }
    // Use global getById() helper. Note: local function shadows globals,
    // so we capture into a local alias first.
    var _getById = getById;
    var existing = _getById(SHEET_NAMES.NEWS, newsId);
    if (!existing) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Berita tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }
    return successResponse({ news: existing });
  }

  function remove(session, newsId) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;
    var existing = getById(SHEET_NAMES.NEWS, newsId);
    if (!existing) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Berita tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }
    softDeleteRow(SHEET_NAMES.NEWS, newsId, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'delete',
      module: 'news',
      entityId: newsId,
      description: 'Hapus berita: ' + existing.title
    });

    return successResponse({ message: 'Berita dihapus' });
  }

  function generateSlug(title) {
    return String(title).toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 80);
  }

  return {
    list: list,
    getBySlug: getBySlug,
    getById: getNews,
    create: create,
    update: update,
    remove: remove
  };

})();

NewsHandlers.list = function (session, id, params) {
  return jsonResponse(NewsService.list(session, params));
};
NewsHandlers.get = function (session, id, params) {
  if (params.slug) return jsonResponse(NewsService.getBySlug(session, params.slug));
  // Frontend mengirim id via body/query, bukan path. Fallback ke params.id agar get-by-id bekerja.
  return jsonResponse(NewsService.getById(session, id || params.id));
};
NewsHandlers.create = function (session, id, params) {
  return jsonResponse(NewsService.create(session, params));
};
NewsHandlers.update = function (session, id, params) {
  return jsonResponse(NewsService.update(session, id || params.id, params));
};
NewsHandlers.remove = function (session, id, params) {
  return jsonResponse(NewsService.remove(session, id || params.id));
};


// ============================================================================
// EVENT SERVICE
// ============================================================================

var EventService = (function () {

  function list(session, params) {
    if (session && !Permissions.hasPermission(session, 'event.read')) {
      return errorResponse(ERROR_CODES.FORBIDDEN, 'Tidak punya akses', {}, HTTP_STATUS.FORBIDDEN);
    }

    var items = getSheetData(SHEET_NAMES.EVENTS)
      .filter(function (e) { return e.status === 'published' || e.status === 'scheduled'; });

    if (params.target_audience) {
      items = items.filter(function (e) {
        return e.target_audience === params.target_audience || e.target_audience === 'all';
      });
    }
    if (params.from_date) items = items.filter(function (e) { return e.event_date >= params.from_date; });
    if (params.to_date) items = items.filter(function (e) { return e.event_date <= params.to_date; });

    // Upcoming first
    items.sort(function (a, b) { return (a.event_date || '').localeCompare(b.event_date || ''); });

    return successResponse({ items: items });
  }

  function create(session, data) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;
    var validation = validateRequired(data, ['title', 'event_date']);
    if (!validation.valid) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Field wajib belum diisi',
        { missing: validation.missing }, HTTP_STATUS.BAD_REQUEST);
    }
    if (!isValidDate(data.event_date)) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR,
        'Format event_date harus YYYY-MM-DD', {}, HTTP_STATUS.BAD_REQUEST);
    }

    var eventData = {
      id: generateId(ID_PREFIXES.EVENT),
      title: data.title,
      description: data.description || '',
      event_date: data.event_date,
      start_time: data.start_time || '',
      end_time: data.end_time || '',
      location: data.location || '',
      image_file_id: data.image_file_id || '',
      target_audience: data.target_audience || 'all',
      status: data.status || 'scheduled'
    };

    var created = insertRow(SHEET_NAMES.EVENTS, eventData, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'create',
      module: 'event',
      entityType: 'event',
      entityId: created.id,
      description: 'Buat agenda: ' + created.title
    });

    return successResponse({ event: created });
  }

  function update(session, eventId, data) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;
    var existing = getById(SHEET_NAMES.EVENTS, eventId);
    if (!existing) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Agenda tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }
    var updated = updateRow(SHEET_NAMES.EVENTS, eventId, data, session.userId);
    ActivityLogService.log({
      userId: session.userId,
      action: 'update',
      module: 'event',
      entityId: eventId,
      description: 'Update agenda: ' + existing.title
    });
    return successResponse({ event: updated });
  }

  function remove(session, eventId) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;
    var existing = getById(SHEET_NAMES.EVENTS, eventId);
    if (!existing) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Agenda tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }
    softDeleteRow(SHEET_NAMES.EVENTS, eventId, session.userId);
    ActivityLogService.log({
      userId: session.userId,
      action: 'delete',
      module: 'event',
      entityId: eventId,
      description: 'Hapus agenda: ' + existing.title
    });
    return successResponse({ message: 'Agenda dihapus' });
  }

  return {
    list: list,
    create: create,
    update: update,
    remove: remove
  };

})();

EventHandlers.list = function (session, id, params) {
  return jsonResponse(EventService.list(session, params));
};
EventHandlers.create = function (session, id, params) {
  return jsonResponse(EventService.create(session, params));
};
EventHandlers.update = function (session, id, params) {
  return jsonResponse(EventService.update(session, id || params.id, params));
};
EventHandlers.remove = function (session, id, params) {
  return jsonResponse(EventService.remove(session, id || params.id));
};


// ============================================================================
// GALLERY SERVICE
// ============================================================================

var GalleryService = (function () {

  function list(session, params) {
    if (session && !Permissions.hasPermission(session, 'gallery.read')) {
      return errorResponse(ERROR_CODES.FORBIDDEN, 'Tidak punya akses', {}, HTTP_STATUS.FORBIDDEN);
    }

    var items = getSheetData(SHEET_NAMES.GALLERIES)
      .filter(function (g) { return g.status === 'published'; });

    if (params.category) items = items.filter(function (g) { return g.category === params.category; });
    if (params.is_featured) items = items.filter(function (g) { return g.is_featured === params.is_featured; });

    items.sort(function (a, b) {
      var da = parseInt(a.display_order || 999);
      var db = parseInt(b.display_order || 999);
      if (da !== db) return da - db;
      return (b.created_at || '').localeCompare(a.created_at || '');
    });

    return successResponse({ items: items });
  }

  function create(session, data) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;
    var validation = validateRequired(data, ['title', 'file_id']);
    if (!validation.valid) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Field wajib belum diisi',
        { missing: validation.missing }, HTTP_STATUS.BAD_REQUEST);
    }

    var galleryData = {
      id: generateId(ID_PREFIXES.GALLERY),
      title: data.title,
      description: data.description || '',
      file_id: data.file_id,
      file_type: data.file_type || 'image',
      mime_type: data.mime_type || '',
      thumbnail_file_id: data.thumbnail_file_id || data.file_id,
      category: data.category || 'umum',
      is_featured: data.is_featured ? 'TRUE' : 'FALSE',
      display_order: data.display_order || '999',
      status: data.status || 'published'
    };

    var created = insertRow(SHEET_NAMES.GALLERIES, galleryData, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'create',
      module: 'gallery',
      entityType: 'gallery',
      entityId: created.id,
      description: 'Upload ke galeri: ' + created.title
    });

    return successResponse({ gallery: created });
  }

  function update(session, galleryId, data) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;
    var existing = getById(SHEET_NAMES.GALLERIES, galleryId);
    if (!existing) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Galeri tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }
    if (data.is_featured !== undefined) data.is_featured = data.is_featured ? 'TRUE' : 'FALSE';
    var updated = updateRow(SHEET_NAMES.GALLERIES, galleryId, data, session.userId);
    ActivityLogService.log({
      userId: session.userId,
      action: 'update',
      module: 'gallery',
      entityId: galleryId,
      description: 'Update galeri: ' + existing.title
    });
    return successResponse({ gallery: updated });
  }

  function remove(session, galleryId) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;
    var existing = getById(SHEET_NAMES.GALLERIES, galleryId);
    if (!existing) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Galeri tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }
    softDeleteRow(SHEET_NAMES.GALLERIES, galleryId, session.userId);
    ActivityLogService.log({
      userId: session.userId,
      action: 'delete',
      module: 'gallery',
      entityId: galleryId,
      description: 'Hapus galeri: ' + existing.title
    });
    return successResponse({ message: 'Galeri dihapus' });
  }

  return {
    list: list,
    create: create,
    update: update,
    remove: remove
  };

})();

GalleryHandlers.list = function (session, id, params) {
  return jsonResponse(GalleryService.list(session, params));
};
GalleryHandlers.create = function (session, id, params) {
  return jsonResponse(GalleryService.create(session, params));
};
GalleryHandlers.update = function (session, id, params) {
  return jsonResponse(GalleryService.update(session, id || params.id, params));
};
GalleryHandlers.remove = function (session, id, params) {
  return jsonResponse(GalleryService.remove(session, id || params.id));
};