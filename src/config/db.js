const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:uZpgknjUTNogoJlyRcJDkRaDMhYMvLbZ@junction.proxy.rlwy.net:41678/railway',
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = pool;
