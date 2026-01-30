const { Pool } = require('pg');
require('dotenv').config();

const isInternal = (process.env.DATABASE_URL || '').includes('railway.internal') ||
    'postgresql://postgres:uZpgknjUTNogoJlyRcJDkRaDMhYMvLbZ@postgres-pebq.railway.internal:5432/railway'.includes('railway.internal');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:uZpgknjUTNogoJlyRcJDkRaDMhYMvLbZ@postgres-pebq.railway.internal:5432/railway',
    ssl: isInternal ? false : {
        rejectUnauthorized: false
    }
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

module.exports = pool;
