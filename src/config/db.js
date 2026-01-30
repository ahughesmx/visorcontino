const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:uZpgknjUTNogoJlyRcJDkRaDMhYMvLbZ@postgres-pebq.railway.internal:5432/railway',
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = pool;
