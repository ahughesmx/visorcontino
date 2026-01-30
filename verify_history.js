const http = require('http');

// Helper to make API requests
function request(path, method, data, cookie) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (data) options.headers['Content-Length'] = data.length;
        if (cookie) options.headers['Cookie'] = cookie;

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: body }));
        });
        req.on('error', (e) => reject(e));
        if (data) req.write(data);
        req.end();
    });
}

async function verifyHistory() {
    console.log('--- LEAD HISTORY TEST ---');

    // 1. Authenticate
    console.log('1. Authenticating...');
    const loginRes = await request('/api/auth/login', 'POST', JSON.stringify({ username: 'admin', password: 'contino2024' }));
    if (loginRes.statusCode !== 200) {
        console.error('❌ Login Failed');
        return;
    }
    const cookie = loginRes.headers['set-cookie'][0].split(';')[0];
    console.log('✅ Authenticated.');

    // 2. Update Lead (Change Status)
    const targetLeadId = 496; // Or any existing ID, leveraging the one from previous test if available, or just use one. 
    // Let's use parameters to find one or just assume 370 exists from manual tests
    // Actually best to pick a known ID. I'll use 370 or fetch first one.

    // Fetch leads to get a valid ID
    console.log('2. Fetching a lead...');
    const leadsRes = await request('/api/leads?limit=1', 'GET', null, cookie);
    const leadsData = JSON.parse(leadsRes.body);
    if (!leadsData.data || leadsData.data.length === 0) {
        console.error('❌ No leads found to test.');
        return;
    }
    const lead = leadsData.data[0];
    const leadId = lead.id_registro;
    console.log(`   Using Lead ID: ${leadId} (Current Status: ${lead.status})`);

    const newStatus = lead.status === 'Pendiente' ? 'Proceso' : 'Pendiente';

    console.log(`3. Updating Lead status to ${newStatus}...`);
    await request(`/api/leads/${leadId}`, 'PUT', JSON.stringify({ status: newStatus }), cookie);

    // 3. Fetch History
    console.log('4. Fetching History...');
    const historyRes = await request(`/api/leads/${leadId}/history`, 'GET', null, cookie);

    if (historyRes.statusCode !== 200) {
        console.error('❌ Failed to fetch history:', historyRes.statusCode);
        return;
    }

    const history = JSON.parse(historyRes.body);
    console.log(`   History Items Found: ${history.length}`);

    // 4. Validate
    const latestEvent = history[0];
    if (latestEvent && latestEvent.action === 'STATUS_CHANGE' && latestEvent.new_value === newStatus) {
        console.log('✅ History record found matching the update.');
        console.log('--- TEST PASSED ---');
        process.exit(0);
    } else {
        console.error('❌ Expected history record not found at top of list.');
        console.log('Latest Event:', latestEvent);
        process.exit(1);
    }
}

verifyHistory();
