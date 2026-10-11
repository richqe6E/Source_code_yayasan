/**
 * @fileoverview Apps Script backend - Logs handler.
 * Expose activity logs ke audit endpoint.
 *
 * @version 1.0
 * @date 2026-09-12
 */

LogHandlers.list = function (session, id, params) {
  var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
  if (deny) return jsonResponse(deny);

  var filters = {
    userId: params.user_id,
    action: params.action,
    module: params.module,
    entityType: params.entity_type,
    fromDate: params.from_date,
    toDate: params.to_date,
    page: parseInt(params.page) || 1,
    pageSize: parseInt(params.pageSize) || 100
  };

  return jsonResponse(ActivityLogService.list(filters));
};