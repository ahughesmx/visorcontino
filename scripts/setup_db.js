const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:uZpgknjUTNogoJlyRcJDkRaDMhYMvLbZ@postgres-pebq.railway.internal:5432/railway',
    ssl: { rejectUnauthorized: false }
});

async function setup() {
    try {
        console.log('Cleaning up existing users table...');
        await pool.query('DROP TABLE IF EXISTS users CASCADE');

        console.log('Creating users table...');
        await pool.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                full_name TEXT,
                role TEXT DEFAULT 'agent' CHECK (role IN ('admin', 'agent')),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('Cleaning up existing session table...');
        await pool.query('DROP TABLE IF EXISTS "session" CASCADE');

        console.log('Creating session table...');
        await pool.query(`
            CREATE TABLE "session" (
              "sid" varchar NOT NULL COLLATE "default" PRIMARY KEY,
              "sess" json NOT NULL,
              "expire" timestamp(6) NOT NULL
            )
            WITH (OIDS=FALSE);
            
            CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
        `);

        // Check if admin exists
        const adminCheck = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
        if (adminCheck.rows.length === 0) {
            console.log('Creating default admin user...');
            const hash = await bcrypt.hash('contino2024', 10);
            await pool.query(
                'INSERT INTO users (username, password_hash, full_name, role) VALUES ($1, $2, $3, $4)',
                ['admin', hash, 'Administrador Sistema', 'admin']
            );
            console.log('Admin user created (admin / contino2024)');
        }

        console.log('Database setup complete.');
    } catch (err) {
        console.error('Error during setup:', err);
    } finally {
        await pool.end();
    }
}

setup();
