/**
 * @fileoverview Apps Script backend Utilities & Helpers.
 * Berisi fungsi-fungsi pembantu: ID generator, validasi, format tanggal, dll.
 *
 * @version 1.0
 * @date 2026-09-12
 */

// ============================================================================
// ID GENERATOR
// ============================================================================

/**
 * Generate ID unik dengan format PREFIX-YYYY-NNNNN
 * Sequence number auto-increment per tahun per prefix.
 *
 * @param {string} prefix - Salah satu dari ID_PREFIXES
 * @returns {string} Generated ID, e.g. "STU-2026-00001"
 */
function generateId(prefix) {
  if (!prefix) {
    throw new Error('Prefix diperlukan untuk generateId()');
  }

  var lock = LockService.getDocumentLock() || LockService.getScriptLock();
  if (lock) {
    lock.waitLock(10000);
  }
  try {
    var year = new Date().getFullYear();
    var key = prefix + '-' + year;

    var sheet = getSheet(SHEET_NAMES.ID_COUNTERS);
    var data = sheet.getDataRange().getValues();

    var rowIndex = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        rowIndex = i + 1; // +1 karena array 0-indexed, sheet 1-indexed
        break;
      }
    }

    var lastNumber = 0;
    if (rowIndex > 0) {
      lastNumber = parseInt(data[rowIndex - 1][1]) || 0;
    } else {
      // Belum ada row untuk prefix ini, buat baru
      sheet.appendRow([key, 0, new Date().toISOString()]);
      rowIndex = sheet.getLastRow();
    }

    var nextNumber = lastNumber + 1;
    sheet.getRange(rowIndex, 2).setValue(nextNumber);
    sheet.getRange(rowIndex, 3).setValue(new Date().toISOString());

    var padded = String(nextNumber).padStart(5, '0');
    return prefix + '-' + year + '-' + padded;
  } finally {
    if (lock) {
      try {
        lock.releaseLock();
      } catch (e) {}
    }
  }
}

/**
 * Batch generate multiple IDs sekaligus (lebih efisien)
 *
 * @param {string} prefix
 * @param {number} count - Jumlah ID yang di-generate
 * @returns {string[]} Array of generated IDs
 */
function generateIds(prefix, count) {
  var ids = [];
  for (var i = 0; i < count; i++) {
    ids.push(generateId(prefix));
  }
  return ids;
}

// ============================================================================
// DATE & TIME HELPERS
// ============================================================================

/**
 * Get current ISO 8601 timestamp UTC
 *
 * @returns {string} e.g. "2026-09-12T10:00:00Z"
 */
function nowIso() {
  return new Date().toISOString();
}

/**
 * Get current date only (no time)
 *
 * @returns {string} e.g. "2026-09-12"
 */
function todayDate() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Format Date object ke ISO 8601
 *
 * Hanya menerima Date instance atau ISO string. Number / boolean / object
 * dikembalikan sebagai string kosong supaya tidak terjadi konversi
 * `new Date(1).toISOString()` yang menghasilkan epoch date keliru.
 *
 * @param {Date|string|*} date
 * @returns {string}
 */
function toIso(date) {
  if (date === null || date === undefined || date === '') return '';
  if (date instanceof Date) return date.toISOString();
  if (typeof date === 'string') return date;
  return '';
}

/**
 * Parse ISO 8601 string ke Date object
 *
 * @param {string} iso
 * @returns {Date}
 */
function fromIso(iso) {
  if (!iso) return null;
  return new Date(iso);
}

/**
 * Format tanggal untuk display (Bahasa Indonesia)
 *
 * @param {string|Date} date
 * @returns {string} e.g. "12 September 2026"
 */
function formatDateId(date) {
  if (!date) return '';
  var d = (date instanceof Date) ? date : new Date(date);
  var months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
}

/**
 * Format datetime untuk display
 *
 * @param {string|Date} datetime
 * @returns {string} e.g. "12 September 2026 pukul 10:00"
 */
function formatDateTimeId(datetime) {
  if (!datetime) return '';
  var d = (datetime instanceof Date) ? datetime : new Date(datetime);
  var datePart = formatDateId(d);
  var hour = String(d.getHours()).padStart(2, '0');
  var minute = String(d.getMinutes()).padStart(2, '0');
  return datePart + ' pukul ' + hour + ':' + minute;
}

/**
 * Format currency (Rupiah)
 *
 * @param {number} amount
 * @returns {string} e.g. "Rp 250.000"
 */
function formatRupiah(amount) {
  if (amount === null || amount === undefined || amount === '') return 'Rp 0';
  return 'Rp ' + Number(amount).toLocaleString('id-ID');
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validasi email format
 *
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  if (!email) return false;
  var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Validasi nomor HP Indonesia (08xx atau +62xx)
 *
 * @param {string} phone
 * @returns {boolean}
 */
function isValidPhoneId(phone) {
  if (!phone) return false;
  var cleaned = String(phone).replace(/[\s\-]/g, '');
  return /^(\+62|62|0)8[1-9][0-9]{7,10}$/.test(cleaned);
}

/**
 * Validasi NIK (16 digit)
 *
 * @param {string} nik
 * @returns {boolean}
 */
function isValidNik(nik) {
  if (!nik) return false;
  return /^[0-9]{16}$/.test(String(nik).trim());
}

/**
 * Validasi ISO date string
 *
 * @param {string} dateStr
 * @returns {boolean}
 */
function isValidDate(dateStr) {
  if (!dateStr) return false;
  var re = /^\d{4}-\d{2}-\d{2}$/;
  if (!re.test(dateStr)) return false;
  var d = new Date(dateStr);
  return d instanceof Date && !isNaN(d);
}

/**
 * Validasi ISO datetime string
 *
 * @param {string} datetimeStr
 * @returns {boolean}
 */
function isValidDateTime(datetimeStr) {
  if (!datetimeStr) return false;
  var re = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
  if (!re.test(datetimeStr)) return false;
  var d = new Date(datetimeStr);
  return d instanceof Date && !isNaN(d);
}

/**
 * Validasi ID format (PREFIX-YYYY-NNNNN)
 *
 * @param {string} id
 * @returns {boolean}
 */
function isValidId(id) {
  if (!id) return false;
  return /^[A-Z]+-\d{4}-\d{5}$/.test(id);
}

/**
 * Sanitize string untuk mencegah XSS
 * NOTE: Apps Script sudah otomatis handle, tapi tambahan defense
 *
 * @param {string} str
 * @returns {string}
 */
function sanitize(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate required fields ada di object
 *
 * @param {Object} data
 * @param {string[]} requiredFields
 * @returns {Object} {valid: boolean, missing: string[]}
 */
function validateRequired(data, requiredFields) {
  var missing = [];
  for (var i = 0; i < requiredFields.length; i++) {
    var field = requiredFields[i];
    var value = data[field];
    if (value === null || value === undefined || value === '' ||
        (Array.isArray(value) && value.length === 0)) {
      missing.push(field);
    }
  }
  return {
    valid: missing.length === 0,
    missing: missing
  };
}

/**
 * Validate enum value
 *
 * @param {string} value
 * @param {string[]} allowedValues
 * @returns {boolean}
 */
function isValidEnum(value, allowedValues) {
  return allowedValues.indexOf(value) !== -1;
}

// ============================================================================
// SHEET HELPERS
// ============================================================================

/**
 * Get all data dari sheet sebagai array of objects
 *
 * @param {string} sheetName
 * @param {Object} options - {includeDeleted: boolean}
 * @returns {Object[]}
 */
function getSheetData(sheetName, options) {
  options = options || {};
  var sheet = getSheet(sheetName);
  var range = sheet.getDataRange();
  var values = range.getValues();

  if (values.length < 2) return [];

  var headers = values[0];
  var result = [];

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var obj = {};

    // Skip baris kosong (semua kolom kosong)
    var isEmptyRow = row.every(function (cell) {
      return cell === '' || cell === null;
    });
    if (isEmptyRow) continue;

    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = toIso(row[j]);
    }

    // Skip deleted rows kecuali includeDeleted
    if (!options.includeDeleted && obj.is_deleted === 'TRUE') {
      continue;
    }

    result.push(obj);
  }

  return result;
}

/**
 * Get single row by ID
 *
 * @param {string} sheetName
 * @param {string} id
 * @returns {Object|null}
 */
function getById(sheetName, id) {
  var data = getSheetData(sheetName, { includeDeleted: true });
  for (var i = 0; i < data.length; i++) {
    if (data[i].id === id) {
      return data[i];
    }
  }
  return null;
}

/**
 * Find rows by criteria
 *
 * @param {string} sheetName
 * @param {Object} criteria - Key-value pairs to match
 * @param {Object} options - {includeDeleted: boolean, limit: number}
 * @returns {Object[]}
 */
function findWhere(sheetName, criteria, options) {
  options = options || {};
  var data = getSheetData(sheetName, options);
  var keys = Object.keys(criteria);

  return data.filter(function (row) {
    return keys.every(function (key) {
      return row[key] === criteria[key];
    });
  }).slice(0, options.limit || data.length);
}

/**
 * Insert new row ke sheet
 *
 * @param {string} sheetName
 * @param {Object} data - Data row baru
 * @param {string} userId - User yang membuat
 * @returns {Object} inserted row
 */
function insertRow(sheetName, data, userId) {
  var sheet = getSheet(sheetName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  var row = headers.map(function (header) {
    if (header === 'created_at') return nowIso();
    if (header === 'created_by') return userId || SYSTEM_USER_ID;
    if (header === 'updated_at') return nowIso();
    if (header === 'updated_by') return userId || SYSTEM_USER_ID;
    if (header === 'is_deleted') return STATUS.NOT_DELETED;
    if (header in data) return data[header];
    return '';
  });

  sheet.appendRow(row);
  SpreadsheetApp.flush();

  var inserted = {};
  for (var i = 0; i < headers.length; i++) {
    inserted[headers[i]] = row[i];
  }
  return inserted;
}

/**
 * Update existing row by ID
 *
 * @param {string} sheetName
 * @param {string} id
 * @param {Object} updates - Fields to update
 * @param {string} userId
 * @returns {Object|null} updated row
 */
function updateRow(sheetName, id, updates, userId) {
  var sheet = getSheet(sheetName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      var row = data[i];

      // Apply updates
      for (var j = 0; j < headers.length; j++) {
        var header = headers[j];
        if (header === 'id') continue;
        if (header === 'created_at') continue;
        if (header === 'created_by') continue;

        if (header === 'updated_at') {
          row[j] = nowIso();
        } else if (header === 'updated_by') {
          row[j] = userId || SYSTEM_USER_ID;
        } else if (header in updates) {
          row[j] = updates[header];
        }
      }

      // Write back
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([row]);
      // Force flush agar penulisan langsung terbaca oleh request berikutnya
      // (tanpa flush, GAS menunda eksekusi dan nilai terbaca stale di call berikutnya).
      SpreadsheetApp.flush();

      var updated = {};
      for (var k = 0; k < headers.length; k++) {
        updated[headers[k]] = row[k];
      }
      return updated;
    }
  }
  return null;
}

/**
 * Soft delete row by ID
 *
 * @param {string} sheetName
 * @param {string} id
 * @param {string} userId
 * @returns {boolean}
 */
function softDeleteRow(sheetName, id, userId) {
  return updateRow(sheetName, id, { is_deleted: STATUS.DELETED }, userId) !== null;
}

/**
 * Hard delete row by ID (PERMANENT, use carefully)
 *
 * @param {string} sheetName
 * @param {string} id
 * @returns {boolean}
 */
function hardDeleteRow(sheetName, id) {
  var sheet = getSheet(sheetName);
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

// ============================================================================
// JSON UTILS
// ============================================================================

/**
 * Safe JSON parse
 *
 * @param {string} str
 * @param {*} fallback
 * @returns {*}
 */
function safeJsonParse(str, fallback) {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}

/**
 * Safe JSON stringify
 *
 * @param {*} obj
 * @returns {string}
 */
function safeJsonStringify(obj) {
  if (obj === null || obj === undefined) return '';
  try {
    return JSON.stringify(obj);
  } catch (e) {
    return '';
  }
}

// ============================================================================
// MISC
// ============================================================================

/**
 * Generate random string (untuk temporary password, dll)
 *
 * @param {number} length
 * @returns {string}
 */
function randomString(length) {
  length = length || 12;
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  var result = '';
  for (var i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate UUID
 *
 * @returns {string}
 */
function uuid() {
  return Utilities.getUuid();
}

/**
 * Sleep / delay (ms)
 *
 * @param {number} ms
 */
function sleep(ms) {
  Utilities.sleep(ms);
}

/**
 * Hash password dengan SHA-256 + salt (untuk Apps Script)
 * CATATAN: Untuk production, lebih baik pakai Firebase Auth.
 * Fungsi ini hanya untuk legacy/password sementara.
 *
 * @param {string} password
 * @param {string} salt
 * @returns {string}
 */
function hashPassword(password, salt) {
  if (!salt) salt = APP_NAME + '_default_salt_change_me';
  var raw = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password + salt
  );
  return raw.map(function (byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('');
}

/**
 * Get client IP dari request (jika ada)
 * NOTE: Apps Script tidak expose IP langsung, jadi default unknown
 *
 * @param {Object} e - event object
 * @returns {string}
 */
function getClientIp(e) {
  return (e && e.parameter && e.parameter._ip) || 'unknown';
}

/**
 * Get User Agent dari request
 *
 * @param {Object} e - event object
 * @returns {string}
 */
function getUserAgent(e) {
  return (e && e.parameter && e.parameter._ua) || 'unknown';
}