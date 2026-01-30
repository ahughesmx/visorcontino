const http = require('http');

function request(path, method, data, cookie) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
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

async function runTest() {
    try {
        console.log('--- USER MANAGEMENT API TEST ---');

        // 1. Login
        console.log('\n1. Logging in as Admin...');
        const loginRes = await request('/api/auth/login', 'POST', JSON.stringify({ username: 'testadmin', password: 'test1234' }));
        if (loginRes.statusCode !== 200) {
            console.error('Login Failed', loginRes.body);
            return;
        }
        const sessionCookie = loginRes.headers['set-cookie'][0].split(';')[0];
        console.log('✅ Login Successful.');

        // 2. Create User
        console.log('\n2. Creating Test User...');
        const createData = JSON.stringify({
            username: 'api_test_user',
            password: 'password123',
            full_name: 'API Test User',
            role: 'agent'
        });
        const createRes = await request('/api/users', 'POST', createData, sessionCookie);
        if (createRes.statusCode !== 201 && createRes.statusCode !== 400) { // 400 if already exists
            console.error('Create User Failed:', createRes.statusCode, createRes.body);
        } else {
            console.log('✅ Create User result:', createRes.statusCode);
        }

        // 3. List Users
        console.log('\n3. Listing Users...');
        const listRes = await request('/api/users', 'GET', null, sessionCookie);
        const users = JSON.parse(listRes.body);
        const testUser = users.find(u => u.username === 'api_test_user');

        if (testUser) {
            console.log('✅ Test user found in list:', testUser.username, `(ID: ${testUser.id})`);
        } else {
            console.error('❌ Test user NOT found in list');
            return;
        }

        // 4. Update User
        console.log('\n4. Updating Test User...');
        const updateData = JSON.stringify({ full_name: 'API User Updated', role: 'agent' });
        const updateRes = await request(`/api/users/${testUser.id}`, 'PUT', updateData, sessionCookie);
        console.log('Update Status:', updateRes.statusCode);
        if (updateRes.statusCode === 200) {
            console.log('✅ Update Successful (Name changed to "API User Updated")');
        }

        // 5. Delete User
        console.log('\n5. Deleting Test User...');
        const deleteRes = await request(`/api/users/${testUser.id}`, 'DELETE', null, sessionCookie);
        console.log('Delete Status:', deleteRes.statusCode);

        // 6. Verify Deletion
        const verifyRes = await request('/api/users', 'GET', null, sessionCookie);
        const verifyUsers = JSON.parse(verifyRes.body);
        if (!verifyUsers.find(u => u.id === testUser.id)) {
            console.log('✅ User successfully verified as deleted.');
        } else {
            console.error('❌ User still exists in list!');
        }

        console.log('\n--- TEST COMPLETE ---');

    } catch (err) {
        console.error('Test Error:', err);
    }
}

runTest();
