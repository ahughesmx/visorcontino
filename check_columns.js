const pool = require('./src/config/db');

async function checkColumns() {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT * FROM solicitudes_contino LIMIT 1');
        console.log('Columns:', Object.keys(res.rows[0]));
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        pool.end();
    }
}
checkColumns();
