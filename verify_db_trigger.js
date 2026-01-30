const io = require('socket.io-client');
const pool = require('./src/config/db');

async function verifyDBTrigger() {
    console.log('--- DB TRIGGER REAL-TIME TEST ---');

    // 1. Connect to Socket
    console.log('1. Connecting to Socket.io...');
    const socket = io('http://localhost:3001');

    socket.on('connect', async () => {
        console.log('✅ Connected to WebSocket.');

        // 2. Perform DB Insert
        console.log('2. Inserting test record directly into DB...');
        try {
            const client = await pool.connect();
            const res = await client.query(`
                INSERT INTO solicitudes_contino (lead_origen, nombre_contacto, telefono)
                VALUES ('TEST_BOT_TRIGGER', 'Test Bot User', '5551234567')
                RETURNING id_registro;
            `);
            const newId = res.rows[0].id_registro;
            console.log(`✅ Inserted ID: ${newId}. Waiting for event...`);
            client.release();
        } catch (err) {
            console.error('❌ DB Insert Failed:', err);
            socket.disconnect();
            process.exit(1);
        }
    });

    socket.on('new_lead', (data) => {
        console.log('✅ EVENT RECEIVED: new_lead');
        console.log('   Lead ID:', data.id_registro);
        console.log('   Origin:', data.lead_origen);

        if (data.lead_origen === 'TEST_BOT_TRIGGER') {
            console.log('--- TEST PASSED ---');
            // Cleanup
            pool.query('DELETE FROM solicitudes_contino WHERE lead_origen = $1', ['TEST_BOT_TRIGGER']).then(() => {
                socket.disconnect();
                pool.end();
                process.exit(0);
            });
        }
    });

    // Timeout
    setTimeout(() => {
        console.error('❌ TIMEOUT: Event not received.');
        socket.disconnect();
        pool.end();
        process.exit(1);
    }, 5000);
}

verifyDBTrigger();
