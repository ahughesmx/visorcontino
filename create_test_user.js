const pool = require('./src/config/db');
const bcrypt = require('bcrypt');

async function createTestUser() {
    try {
        const hash = await bcrypt.hash('test1234', 10);
        await pool.query(`
            INSERT INTO users (username, password_hash, full_name, role, status)
            VALUES ('testadmin', $1, 'Test Admin', 'admin', 'active')
            ON CONFLICT (username) 
            DO UPDATE SET password_hash = $1, role = 'admin', status = 'active'
        `, [hash]);
        console.log('✅ Test user "testadmin" created/updated.');
    } catch (err) {
        console.error('Error creating test user:', err);
    } finally {
        pool.end();
    }
}

createTestUser();
