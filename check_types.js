const { Client } = require('pg');

const connectionString = 'postgresql://postgres:uZpgknjUTNogoJlyRcJDkRaDMhYMvLbZ@junction.proxy.rlwy.net:41678/railway';

async function check() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        const res = await client.query('SELECT tipo_solicitud, COUNT(*) FROM solicitudes_contino GROUP BY tipo_solicitud');
        console.log('Results:');
        res.rows.forEach(row => {
            console.log(`Type: [${row.tipo_solicitud}] - Count: ${row.count}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
check();
