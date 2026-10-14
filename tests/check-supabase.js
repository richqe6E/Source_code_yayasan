const SUPABASE_URL = 'https://hnkxrbmngmveoxipohtk.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua3hyYm1uZ212ZW94aXBvaHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MTQ5NTMsImV4cCI6MjEwNDQ5MDk1M30.S10JzbSvvEStbEJl4DFVBYniyoQkG6q7_PGg3cJI9Yo';

const tables = [
  'users',
  'students',
  'teachers',
  'classes',
  'invoices',
  'payments',
  'ppdb_registrations',
  'ppdb_periods',
  'student_documents',
  'news',
  'announcements',
  'events',
  'galleries',
  'schools',
  'activity_logs',
  'contact_messages'
];

async function checkTables() {
  console.log('Testing live Supabase tables status:');
  for (const t of tables) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${t}?select=*&limit=1`, {
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        console.log(`✓ ${t}: OK (200), ${data.length} sample record`);
      } else {
        const text = await res.text();
        console.log(`✗ ${t}: FAILED (${res.status}): ${text}`);
      }
    } catch (e) {
      console.log(`✗ ${t}: ERROR: ${e.message}`);
    }
  }
}

checkTables();
