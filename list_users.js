const pool = require('./src/config/db');

const listUsers = async () => {
    try {
        const res = await pool.query('SELECT id, username, role, status FROM users');
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
};

listUsers();
