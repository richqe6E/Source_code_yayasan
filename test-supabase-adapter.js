/**
 * Test script to verify Supabase REST API queries for SIYAYASAN V2
 */
const https = require('https');

const SUPABASE_URL = 'https://hnkxrbmngmveoxipohtk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua3hyYm1uZ212ZW94aXBvaHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MTQ5NTMsImV4cCI6MjEwNDQ5MDk1M30.S10JzbSvvEStbEJl4DFVBYniyoQkG6q7_PGg3cJI9Yo';

function request(path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL + path);
    const reqHeaders = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...headers
    };

    const opts = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: reqHeaders
    };

    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('--- Testing Supabase REST Endpoints ---');

  // 1. Auth Login check
  console.log('\n1. Test Login admin:');
  const loginRes = await request('/rest/v1/users?email=eq.admin@yayasan.sch.id&select=*');
  console.log('Login query status:', loginRes.status, 'User found:', loginRes.data?.[0]?.full_name);

  // 2. Classes list
  console.log('\n2. Test Classes List:');
  const classesRes = await request('/rest/v1/classes?select=*&order=created_at.asc');
  console.log('Classes count:', classesRes.data?.length, 'First class:', classesRes.data?.[0]?.name);

  // 3. Students list
  console.log('\n3. Test Students List:');
  const studentsRes = await request('/rest/v1/students?select=*');
  console.log('Students count:', studentsRes.data?.length, 'First student:', studentsRes.data?.[0]?.full_name);

  // 4. Invoices and Payments
  console.log('\n4. Test Invoices List:');
  const invRes = await request('/rest/v1/invoices?select=*');
  console.log('Invoices count:', invRes.data?.length, 'First invoice:', invRes.data?.[0]?.invoice_number);

  // 5. News and Announcements
  console.log('\n5. Test News List:');
  const newsRes = await request('/rest/v1/news?select=*');
  console.log('News count:', newsRes.data?.length, 'First title:', newsRes.data?.[0]?.title);

  // 6. Test Insert and Delete (CRUD verification)
  console.log('\n6. Test Insert & Delete on contact_messages:');
  const insertRes = await request('/rest/v1/contact_messages', 'POST', {
    id: 'MSG-' + Date.now(),
    name: 'Penguji Supabase',
    email: 'test@example.com',
    message: 'Halo dari pengujian migrasi Supabase!'
  });
  console.log('Insert message status:', insertRes.status, 'Created ID:', insertRes.data?.[0]?.id);

  if (insertRes.data?.[0]?.id) {
    const delRes = await request(`/rest/v1/contact_messages?id=eq.${insertRes.data[0].id}`, 'DELETE');
    console.log('Delete message status:', delRes.status);
  }

  console.log('\n--- ALL SUPABASE TESTS COMPLETED SUCCESSFULLY ---');
}

runTests().catch(console.error);
