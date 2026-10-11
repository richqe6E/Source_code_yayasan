/**
 * @fileoverview Apps Script backend - File service.
 * Handle upload file ke Google Drive, generate share link / thumbnail.
 *
 * @version 1.0
 * @date 2026-09-12
 *
 * Catatan: Apps Script Web App tidak bisa terima file binary langsung via
 * doPost. File upload pattern:
 *   1. Frontend upload ke endpoint upload yang return Drive upload URL.
 *   2. Atau: frontend encode file ke base64 dan kirim di body POST.
 *   3. Simpan file_id Drive di sheet lalu serve via /api/v1/files/get?id=...
 */

var FileService = (function () {

  var ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  var ALLOWED_DOC_MIMES = ['application/pdf'];

  /**
   * Upload file (base64 encoded) ke Drive.
   * Body: { filename, mime_type, base64_data, category? }
   * category: 'ppdb' | 'siswa' | 'guru' | 'berita' | 'pengumuman' | 'galeri' | 'pembayaran'
   *
   * Return: { file_id, file_name, web_view_link, thumbnail_link }
   */
  function upload(session, data) {
    var isAuth = session && session.user;
    var isAdmin = Permissions.isSuperAdmin(session) || Permissions.isAdminTU(session);
    var isGuru = Permissions.isGuru(session);
    var isOrtu = Permissions.isOrangTua(session);
    var isPendaftar = Permissions.isPendaftar(session);
    if (!isAuth || (!isAdmin && !isGuru && !isOrtu && !isPendaftar)) {
      return errorResponse(ERROR_CODES.FORBIDDEN, 'Tidak punya akses', {}, HTTP_STATUS.FORBIDDEN);
    }

    var validation = validateRequired(data, ['filename', 'mime_type', 'base64_data']);
    if (!validation.valid) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Field wajib belum diisi',
        { missing: validation.missing }, HTTP_STATUS.BAD_REQUEST);
    }

    // Validasi mime type
    var mimeType = data.mime_type;
    var isImage = ALLOWED_IMAGE_MIMES.indexOf(mimeType) !== -1;
    var isDoc = ALLOWED_DOC_MIMES.indexOf(mimeType) !== -1;
    if (!isImage && !isDoc) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR,
        'Mime type tidak diizinkan: ' + mimeType, {}, HTTP_STATUS.BAD_REQUEST);
    }

    // Decode base64 → Blob
    var blob;
    try {
      var bytes = Utilities.base64Decode(data.base64_data);
      blob = Utilities.newBlob(bytes, mimeType, data.filename);
    } catch (e) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR,
        'base64_data tidak valid: ' + e.message, {}, HTTP_STATUS.BAD_REQUEST);
    }

    // Validasi ukuran
    var maxBytes = isImage ? SECURITY.maxPhotoUploadBytes : SECURITY.maxUploadBytes;
    if (blob.getBytes().length > maxBytes) {
      return errorResponse('FILE_TOO_LARGE',
        'Ukuran file melebihi batas (' + (maxBytes / 1024 / 1024) + ' MB)', {}, HTTP_STATUS.BAD_REQUEST);
    }

    // Tentukan folder tujuan
    var folder = getOrCreateSubfolder(data.category || 'umum');

    // Upload
    var file = folder.createFile(blob);
    file.setName(data.filename);

    // Set sharing: anyone with link can view (untuk MVP)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var fileId = file.getId();

    ActivityLogService.log({
      userId: session.userId,
      action: 'create',
      module: 'file',
      entityType: 'file',
      entityId: fileId,
      description: 'Upload file: ' + data.filename + ' (' + blob.getBytes().length + ' bytes)',
      newValues: {
        filename: data.filename,
        mime_type: mimeType,
        size: blob.getBytes().length,
        file_id: fileId
      }
    });

    return successResponse({
      file: {
        id: fileId,
        name: data.filename,
        mime_type: mimeType,
        size: blob.getBytes().length,
        web_view_link: 'https://drive.google.com/file/d/' + fileId + '/view',
        download_link: 'https://drive.google.com/uc?export=download&id=' + fileId,
        thumbnail_link: isImage ? 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w400' : null
      }
    });
  }

  /**
   * Get file metadata (cek akses).
   */
  function getFile(session, fileId) {
    var isAuth = session && session.user;
    var isAdmin = Permissions.isSuperAdmin(session) || Permissions.isAdminTU(session);
    var isGuru = Permissions.isGuru(session);
    var isOrtu = Permissions.isOrangTua(session);
    if (!isAuth || (!isAdmin && !isGuru && !isOrtu)) {
      return errorResponse(ERROR_CODES.FORBIDDEN, 'Tidak punya akses', {}, HTTP_STATUS.FORBIDDEN);
    }

    try {
      var file = DriveApp.getFileById(fileId);
      return successResponse({
        file: {
          id: fileId,
          name: file.getName(),
          mime_type: file.getMimeType(),
          size: file.getSize(),
          web_view_link: file.getUrl(),
          created_at: file.getDateCreated().toISOString()
        }
      });
    } catch (e) {
      return errorResponse(ERROR_CODES.NOT_FOUND,
        'File tidak ditemukan atau tidak punya akses', {}, HTTP_STATUS.NOT_FOUND);
    }
  }

  /**
   * Download file (return as base64).
   */
  function download(session, fileId) {
    var isAuth = session && session.user;
    var isAdmin = Permissions.isSuperAdmin(session) || Permissions.isAdminTU(session);
    var isGuru = Permissions.isGuru(session);
    var isOrtu = Permissions.isOrangTua(session);
    if (!isAuth || (!isAdmin && !isGuru && !isOrtu)) {
      return errorResponse(ERROR_CODES.FORBIDDEN, 'Tidak punya akses', {}, HTTP_STATUS.FORBIDDEN);
    }

    try {
      var file = DriveApp.getFileById(fileId);
      var blob = file.getBlob();
      var bytes = blob.getBytes();
      var base64 = Utilities.base64Encode(bytes);

      return successResponse({
        file: {
          id: fileId,
          name: file.getName(),
          mime_type: file.getMimeType(),
          base64_data: base64,
          size: bytes.length
        }
      });
    } catch (e) {
      return errorResponse(ERROR_CODES.NOT_FOUND,
        'File tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }
  }

  /**
   * Delete file (soft: move ke backup folder; hard: permanent delete).
   */
  function remove(session, fileId) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    try {
      var file = DriveApp.getFileById(fileId);
      var name = file.getName();

      // Untuk MVP: permanent delete. Production: pindahkan ke backup folder dulu.
      DriveApp.removeFile(file);

      ActivityLogService.log({
        userId: session.userId,
        action: 'delete',
        module: 'file',
        entityId: fileId,
        description: 'Hapus file: ' + name
      });

      return successResponse({ message: 'File dihapus' });
    } catch (e) {
      return errorResponse(ERROR_CODES.NOT_FOUND,
        'File tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  /**
   * Get atau create subfolder di bawah DRIVE_ROOT_FOLDER_ID.
   */
  function getOrCreateSubfolder(category) {
    var root = getDriveRootFolder();
    var folderName = DRIVE_SUBFOLDERS[category] || 'UMUM';

    var subfolders = root.getFoldersByName(folderName);
    if (subfolders.hasNext()) {
      return subfolders.next();
    }
    return root.createFolder(folderName);
  }

  return {
    upload: upload,
    getFile: getFile,
    download: download,
    remove: remove
  };

})();

// Register handlers
FileHandlers.upload = function (session, id, params, e) {
  return jsonResponse(FileService.upload(session, params));
};
FileHandlers.get = function (session, id, params) {
  return jsonResponse(FileService.getFile(session, params.file_id || id || params.id));
};
FileHandlers.download = function (session, id, params) {
  return jsonResponse(FileService.download(session, params.file_id || id || params.id));
};
FileHandlers.remove = function (session, id, params) {
  return jsonResponse(FileService.remove(session, params.file_id || id || params.id));
};
FileHandlers.notFound = function () {
  return jsonResponse(errorResponse('NOT_FOUND',
    'File action tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND));
};