async function test() {
  console.log('--- 1. Testing Unauthenticated Access to /admin ---');
  const res1 = await fetch('http://localhost:3000/admin', { redirect: 'manual' });
  console.log('Status:', res1.status, 'Location:', res1.headers.get('location'));

  console.log('\n--- 2. Testing Staff Login API ---');
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: '+919876543210', password: 'Desk@Pavilion2026' }),
  });
  console.log('Login Status:', loginRes.status);
  const cookieHeader = loginRes.headers.get('set-cookie');
  console.log('Set-Cookie received:', !!cookieHeader);
  const loginBody = await loginRes.json();
  console.log('User logged in:', loginBody);

  const sessionToken = cookieHeader?.split(';')[0];

  console.log('\n--- 3. Testing Authenticated /api/admin/now Endpoint ---');
  const nowRes = await fetch('http://localhost:3000/api/admin/now', {
    headers: { Cookie: sessionToken },
  });
  console.log('Now API Status:', nowRes.status);
  const nowData = await nowRes.json();
  console.log('Now API Ok:', nowData.ok);
  console.log('Current Time:', nowData.data.currentTimeFormatted);
  console.log('Current Slot:', nowData.data.currentSlotLabel);
  console.log('On Court Now:', nowData.data.onCourtNow.map(c => ({ court: c.courtName, free: c.isFree, player: c.customerName, status: c.paidStatus })));
  console.log('Next Up:', nowData.data.nextUp.map(c => ({ court: c.courtName, free: c.isFree, player: c.customerName })));
  console.log('To Collect:', nowData.data.toCollect);

  console.log('\n--- 4. Testing Authenticated /admin Page Render ---');
  const pageRes = await fetch('http://localhost:3000/admin', {
    headers: { Cookie: sessionToken },
  });
  console.log('Admin Page Status:', pageRes.status);
  const html = await pageRes.text();
  console.log('Contains "On Court Now":', html.includes('On Court Now'));
  console.log('Contains "Next Up":', html.includes('Next Up'));
  console.log('Contains "Later Today":', html.includes('Later Today'));
  console.log('Contains "To Collect":', html.includes('To Collect'));
  console.log('Contains "Suresh Kumar":', html.includes('Suresh Kumar'));
}

test().catch(console.error);
