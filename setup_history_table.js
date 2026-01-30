const pool = require('./src/config/db');

async function setupHistoryTable() {
    const client = await pool.connect();
    try {
        console.log('Creating lead_history table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS lead_history (
                id SERIAL PRIMARY KEY,
                lead_id INTEGER NOT NULL REFERENCES solicitudes_contino(id_registro),
                user_id INTEGER REFERENCES users(id),
                action VARCHAR(50) NOT NULL,
                previous_value TEXT,
                new_value TEXT,
                comment TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('✅ lead_history table created successfully.');
    } catch (err) {
        console.error('❌ Error creating table:', err);
    } finally {
        client.release();
        pool.end();
    }
}

setupHistoryTable();
