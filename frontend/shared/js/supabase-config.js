/**
 * SIYAYASAN V2 - Supabase Configuration
 * Terkoneksi langsung ke database PostgreSQL & Storage Supabase
 */
(function () {
  'use strict';

  window.SIYAYASAN_SUPABASE = {
    url: 'https://hnkxrbmngmveoxipohtk.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua3hyYm1uZ212ZW94aXBvaHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MTQ5NTMsImV4cCI6MjEwNDQ5MDk1M30.S10JzbSvvEStbEJl4DFVBYniyoQkG6q7_PGg3cJI9Yo',
    storageBucket: 'siyayasan-uploads',
    get storageUrl() {
      return this.url + '/storage/v1/object/public/' + this.storageBucket + '/';
    }
  };
})();
