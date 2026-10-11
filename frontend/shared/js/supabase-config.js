/**
 * SIYAYASAN V2 - Supabase Configuration
 * Terkoneksi langsung ke database PostgreSQL & Storage Supabase
 */
(function () {
  'use strict';

  window.SIYAYASAN_SUPABASE = {
    url: 'https://hzrjtvmveqygparjjnom.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6cmp0dm12ZXF5Z3Bhcmpqbm9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzNzkyNTUsImV4cCI6MjEwNDk1NTI1NX0.-aVm6RoQy2_wnmlVV7v_zcL0SXvTenVBsSRYiVj_gQE',
    storageBucket: 'siyayasan-uploads',
    get storageUrl() {
      return this.url + '/storage/v1/object/public/' + this.storageBucket + '/';
    }
  };
})();
