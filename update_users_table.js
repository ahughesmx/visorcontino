const pool = require('./src/config/db');

async function updateUsersTable() {
    const client = await pool.connect();
    try {
        console.log('Updating users table schema...');

        await client.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
            ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
        `);

        console.log('✅ Users table updated successfully.');
    } catch (err) {
        console.error('❌ Error updating table:', err);
    } finally {
        client.release();
        pool.end();
    }
}

updateUsersTable();
