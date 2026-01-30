const pool = require('./src/config/db');

async function setupTriggers() {
    const client = await pool.connect();
    try {
        console.log('Creating notification function...');
        await client.query(`
            CREATE OR REPLACE FUNCTION notify_new_lead()
            RETURNS trigger AS $$
            BEGIN
                PERFORM pg_notify('new_lead_channel', row_to_json(NEW)::text);
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        console.log('Creating trigger...');
        // Drop trigger if exists to avoid errors on re-run
        await client.query(`DROP TRIGGER IF EXISTS trigger_new_lead ON solicitudes_contino;`);

        await client.query(`
            CREATE TRIGGER trigger_new_lead
            AFTER INSERT ON solicitudes_contino
            FOR EACH ROW
            EXECUTE FUNCTION notify_new_lead();
        `);

        console.log('✅ Database triggers set up successfully.');
    } catch (err) {
        console.error('❌ Error setting up triggers:', err);
    } finally {
        client.release();
        pool.end(); // Close pool to exit script
    }
}

setupTriggers();
