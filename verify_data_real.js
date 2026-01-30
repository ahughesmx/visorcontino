const http = require('http');

function checkUsersAPI() {
    console.log('--- Verifying Real User Data from API (Native HTTP) ---');

    http.get('http://localhost:3001/api/users', (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            if (res.statusCode === 200) {
                try {
                    const users = JSON.parse(data);
                    console.log('✅ API /api/users Responded Correctly (200 OK)');
                    console.log(`✅ Found ${users.length} users in database.`);

                    console.log('\n--- Real User Data Preview ---');
                    users.forEach(u => {
                        console.log(`- User: ${u.username} | Role: ${u.role} | ID: ${u.id} | Status: ${u.status}`);
                    });

                    const testUser = users.find(u => u.username === 'testadmin');
                    if (testUser) {
                        console.log('\n✅ "testadmin" user found in response. CRUD Read is working.');
                    } else {
                        console.log('\n❌ "testadmin" user NOT found.');
                    }
                } catch (e) {
                    console.error('❌ Error parsing JSON:', e.message);
                }
            } else {
                console.error(`❌ API Error: Status Code ${res.statusCode}`);
            }
        });

    }).on('error', (err) => {
        console.error('❌ Connection Error:', err.message);
    });
}

checkUsersAPI();
