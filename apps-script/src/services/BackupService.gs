/**
 * @fileoverview Backup service - STUB.
 *
 * Service aktif ada di [services/ReportService.gs](services/ReportService.gs)
 * yang mendeklarasikan `var BackupService = (function () { ... })();`
 * dan handler `ReportHandlers.backup` / `.backups` / `.create` / `.restore`.
 *
 * File ini dulu berisi duplikat IIFE dengan bug:
 *   - `this.BackupService = BackupService;` di akhir IIFE tidak menulis
 *     ke global karena `this` di function expression bukan global.
 *   - `logActivity(null, null, 'backup', 'system', null, 'create', {...})`
 *     salah shape — logActivity menerima satu object, bukan 7 param.
 *
 * Setelah [services/ReportService.gs](services/ReportService.gs) yang menang
 * di scope Apps Script, file ini dinonaktifkan supaya tidak menimpa handler
 * ReportHandlers. Tidak mendefinisikan ulang variable global.
 *
 * @version 1.0
 * @date 2026-09-13
 */

var BackupService_DISABLED = true;