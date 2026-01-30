const { Client } = require('pg');
const fs = require('fs');

const connectionString = 'postgresql://postgres:uZpgknjUTNogoJlyRcJDkRaDMhYMvLbZ@junction.proxy.rlwy.net:41678/railway';

async function analyze() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        const dataRes = await client.query("SELECT * FROM solicitudes_contino ORDER BY creado_en DESC LIMIT 10;");
        fs.writeFileSync('samples.json', JSON.stringify(dataRes.rows, null, 2));
        console.log('Samples saved');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}
analyze();
