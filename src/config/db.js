const { Pool } = require('pg');
require('dotenv').config();

const isInternal = (process.env.DATABASE_URL || '').includes('railway.internal');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3, // Conservative limit for Railway starter tier
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: isInternal ? false : {
        rejectUnauthorized: false
    }
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

module.exports = pool;
