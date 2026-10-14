/**
 * SIYAYASAN V2 - Shared Auth Helper
 * Handles authentication, role-based redirects (Admin & Siswa), and session security.
 */
(function () {
  'use strict';

  const TOKEN_KEY = 'siy_token';
  const USER_KEY = 'siy_user';

  function getToken() { return localStorage.getItem(TOKEN_KEY); }
  function getUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); }
    catch (e) { return null; }
  }
  function setSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function isLoggedIn() { return !!getToken(); }

  function logout() {
    clearSession();
    window.location.href = '/login.html';
  }

  /**
   * Mendapatkan URL tujuan redirect berdasarkan role pengguna
   */
  function getPortalRedirect(roleCode) {
    const role = (roleCode || '').toLowerCase();
    if (role === 'super_admin' || role === 'admin_tu' || role === 'admin' || role === 'kepala_sekolah' || role === 'staff') {
      return '/admin/dashboard.html';
    }
    if (role === 'siswa_aktif' || role === 'siswa' || role === 'calon_siswa' || role === 'pendaftar') {
      return '/siswa/dashboard.html';
    }
    return '/login.html';
  }

  /**
   * Guards a page: requires auth and (optionally) one of the given roles.
   * @param {string} [allowedRoles] comma-separated role codes, e.g. 'admin,siswa_aktif'
   */
  function requireAuth(allowedRoles) {
    if (!isLoggedIn()) {
      window.location.href = '/login.html';
      return false;
    }
    if (allowedRoles) {
      const user = getUser();
      if (!user) {
        clearSession();
        window.location.href = '/login.html';
        return false;
      }
      const allowed = allowedRoles.split(',').map(r => r.trim().toLowerCase());
      const rawRole = (user.role && user.role.code ? user.role.code : (user.role || '')).toLowerCase();
      
      // Normalized matching: 'admin' covers super_admin & admin_tu, 'siswa' covers siswa_aktif & calon_siswa
      let isAllowed = allowed.includes(rawRole);
      if (!isAllowed) {
        if (allowed.includes('admin') && (rawRole === 'super_admin' || rawRole === 'admin_tu')) {
          isAllowed = true;
        }
        if (allowed.includes('siswa') && (rawRole === 'siswa_aktif' || rawRole === 'calon_siswa')) {
          isAllowed = true;
        }
      }

      if (!isAllowed) {
        window.location.href = getPortalRedirect(rawRole);
        return false;
      }
    }
    return true;
  }

  // Expose to window
  window.getToken = getToken;
  window.getUser = getUser;
  window.getCurrentUser = getUser;
  window.setSession = setSession;
  window.clearSession = clearSession;
  window.isLoggedIn = isLoggedIn;
  window.logout = logout;
  window.getPortalRedirect = getPortalRedirect;
  window.requireAuth = requireAuth;
})();