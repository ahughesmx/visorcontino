const pool = require('../config/db');
const socketConfig = require('../config/socket');

async function listenToDatabase() {
    try {
        // Create a dedicated client for listening
        // Note: Using pool.connect() gets a client from the pool.
        // We must ensure we don't release it back if we want to keep listening, 
        // OR we use a separate client instance. 
        // For simplicity with 'pg', we can use a pool client and just not release it,
        // effectively dedicating it to this listener.
        const client = await pool.connect();

        await client.query('LISTEN new_lead_channel');
        console.log('📡 Database Listener Connected: Listening for new leads...');

        client.on('notification', (msg) => {
            if (msg.channel === 'new_lead_channel') {
                try {
                    const payload = JSON.parse(msg.payload);
                    console.log(`🔔 New Lead Detected from DB: ID ${payload.id_registro}`);

                    const io = socketConfig.getIO();
                    if (io) {
                        io.emit('new_lead', payload);
                        // Also emit 'lead_updated' with stats triggered on frontend? 
                        // Actually 'new_lead' is specific. Frontend should handle it.
                    }
                } catch (e) {
                    console.error('Error parsing notification payload:', e);
                }
            }
        });

        client.on('error', (err) => {
            console.error('Database Listener Error:', err);
            // Reconnection logic could go here if needed
        });

    } catch (err) {
        console.error('Failed to start Database Listener:', err);
    }
}

module.exports = { listenToDatabase };
