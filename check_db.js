const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://postgres:uZpgknjUTNogoJlyRcJDkRaDMhYMvLbZ@junction.proxy.rlwy.net:41678/railway',
    ssl: {
        rejectUnauthorized: false
    }
});

async function check() {
    try {
        console.log('--- Stats ---');
        const stats = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'Pendiente' OR status IS NULL) as pendientes,
                COUNT(*) FILTER (WHERE status = 'Proceso') as proceso,
                COUNT(*) FILTER (WHERE status = 'Completada') as completada
            FROM solicitudes_contino
        `);
        console.table(stats.rows);

        console.log('\n--- Recent Leads Status ---');
        const leads = await pool.query(`
            SELECT id_registro, status, nombre_contacto, razon_social 
            FROM solicitudes_contino 
            ORDER BY id_registro DESC
            LIMIT 20
        `);
        leads.rows.forEach(r => {
            console.log(`ID: #${r.id_registro} | Status: ${r.status} | Contacto: ${r.nombre_contacto} | Empresa: ${r.razon_social}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
