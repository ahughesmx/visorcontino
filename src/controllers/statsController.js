const pool = require('../config/db');

const getStats = async (req, res) => {
    try {
        const isAdmin = req.session.role === 'admin';
        const agentName = req.session.username;
        const params = isAdmin ? [] : [agentName];
        const whereClause = isAdmin ? '' : 'WHERE agente_asignado = $1';
        const andClause = isAdmin ? '' : 'AND agente_asignado = $1';
        // Note: For existing WHERE clauses, we use AND. For queries without WHERE, we use WHERE.
        // Actually, let's just build queries conditionally to be safe.

        let totalQuery = 'SELECT COUNT(*) FROM solicitudes_contino';
        if (!isAdmin) totalQuery += ' WHERE agente_asignado = $1';

        let byTypeQuery = 'SELECT tipo_solicitud, COUNT(*) FROM solicitudes_contino';
        if (!isAdmin) byTypeQuery += ' WHERE agente_asignado = $1';
        byTypeQuery += ' GROUP BY tipo_solicitud';

        let byStatusQuery = 'SELECT status, COUNT(*) FROM solicitudes_contino';
        if (!isAdmin) byStatusQuery += ' WHERE agente_asignado = $1';
        byStatusQuery += ' GROUP BY status';

        let byAgentQuery = "SELECT agente_asignado, COUNT(*) FROM solicitudes_contino WHERE agente_asignado IS NOT NULL AND agente_asignado != ''";
        if (!isAdmin) byAgentQuery += ' AND agente_asignado = $1';
        byAgentQuery += ' GROUP BY agente_asignado';

        let pendingQuery = "SELECT COUNT(*) FROM solicitudes_contino WHERE (status = 'Pendiente' OR status IS NULL)";
        if (!isAdmin) pendingQuery += ' AND agente_asignado = $1';

        let completedQuery = "SELECT COUNT(*) FROM solicitudes_contino WHERE status = 'Completada'";
        if (!isAdmin) completedQuery += ' AND agente_asignado = $1';

        const totalResult = await pool.query(totalQuery, params);
        const byType = await pool.query(byTypeQuery, params);
        const byStatus = await pool.query(byStatusQuery, params);
        const byAgent = await pool.query(byAgentQuery, params);
        const pendingResult = await pool.query(pendingQuery, params);
        const completedResult = await pool.query(completedQuery, params);

        const total = parseInt(totalResult.rows[0].count);
        const pending = parseInt(pendingResult.rows[0].count);
        const completed = parseInt(completedResult.rows[0].count);

        const responseRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;

        res.json({
            total,
            byType: byType.rows,
            byStatus: byStatus.rows,
            byAgent: byAgent.rows,
            pending,
            responseRate
        });
    } catch (err) {
        console.error('Error in getStats:', err);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
};

const getTrends = async (req, res) => {
    try {
        const isAdmin = req.session.role === 'admin';
        const agentName = req.session.username;
        const params = [];

        if (!isAdmin) {
            params.push(agentName);
        }

        // Definitive fix for the "Double Shift" timezone bug
        const query = `
            WITH series AS (
                SELECT (timezone('America/Mexico_City', now())::date - i) as d
                FROM generate_series(0, 6) i
            )
            SELECT 
                to_char(s.d, 'YYYY-MM-DD') as date, 
                COUNT(sc.id_registro) as count 
            FROM series s
            LEFT JOIN solicitudes_contino sc ON (sc.creado_en AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City')::date = s.d
            ${!isAdmin ? 'AND sc.agente_asignado = $1' : ''}
            GROUP BY s.d
            ORDER BY s.d ASC
        `;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error in getTrends:', err);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
};

module.exports = { getStats, getTrends };
