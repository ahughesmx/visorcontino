const { Client } = require('pg');
const fs = require('fs');

const connectionString = 'postgresql://postgres:uZpgknjUTNogoJlyRcJDkRaDMhYMvLbZ@junction.proxy.rlwy.net:41678/railway';

async function analyze() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        const schemaRes = await client.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'solicitudes_contino' ORDER BY ordinal_position;");
        fs.writeFileSync('schema.json', JSON.stringify(schemaRes.rows, null, 2));
        console.log('Schema saved');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}
analyze();
