const { Client } = require('pg');
const fs = require('fs');

const connectionString = 'postgresql://postgres:uZpgknjUTNogoJlyRcJDkRaDMhYMvLbZ@junction.proxy.rlwy.net:41678/railway';

async function analyze() {
    const client = new Client({ connectionString });
    try {
        await client.connect();

        const schemaRes = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'solicitudes_contino'
            ORDER BY ordinal_position;
        `);

        const dataRes = await client.query('SELECT * FROM solicitudes_contino ORDER BY created_at DESC LIMIT 5;');

        const output = {
            schema: schemaRes.rows,
            samples: dataRes.rows
        };

        fs.writeFileSync('analysis_results.json', JSON.stringify(output, null, 2));
        console.log('Analysis saved to analysis_results.json');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

analyze();
