const { Client } = require('pg');

const connectionString = 'postgresql://postgres:uZpgknjUTNogoJlyRcJDkRaDMhYMvLbZ@junction.proxy.rlwy.net:41678/railway';

async function migrate() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log('Connected to database');

        console.log('Updating schema...');
        await client.query(`
            ALTER TABLE solicitudes_contino 
            ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pendiente',
            ADD COLUMN IF NOT EXISTS prioridad INTEGER DEFAULT 2,
            ADD COLUMN IF NOT EXISTS agente_asignado VARCHAR(100);
        `);
        console.log('Schema updated successfully');

    } catch (err) {
        console.error('Error during migration:', err);
    } finally {
        await client.end();
    }
}

migrate();
