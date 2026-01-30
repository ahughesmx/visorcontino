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
            res.on('end', () => resolve({ statusCode: res.statusCode, body: body }));
        });

        req.on('error', (e) => reject(e));
        if (data) req.write(data);
        req.end();
    });
}

function login() {
    return request('/api/auth/login', 'POST', JSON.stringify({ username: 'admin', password: 'contino2024' }));
}

async function runTest() {
    try {
        console.log('1. Login...');
        const loginRes = await request('/api/auth/login', 'POST', JSON.stringify({ username: 'admin', password: 'contino2024' }));
        if (loginRes.statusCode !== 200) {
            console.error('Login Failed', loginRes.body);
            return;
        }

        // Extract session cookie strictly
        const rawCookies = loginRes.headers?.['set-cookie'] || []; // This might fail if headers are not returned in the simple request function above. 
        // Wait, my simple request wrapper didn't return headers. I need to fix that.
    } catch (err) {
        console.error(err);
    }
}
