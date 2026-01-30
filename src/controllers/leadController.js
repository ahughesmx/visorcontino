const pool = require('../config/db');
const socketConfig = require('../config/socket');

const getLeads = async (req, res) => {
    try {
        const { search, type, turnado, limit = 50, offset = 0, sortBy = 'creado_en', sortOrder = 'DESC' } = req.query;

        // Validation for sorting
        const allowedSortFields = ['id_registro', 'status', 'razon_social', 'creado_en', 'nombre_contacto'];
        const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'creado_en';
        const validSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        let query = 'SELECT * FROM solicitudes_contino WHERE 1=1';
        const params = [];

        // Filter by agent if not admin
        if (req.session.role !== 'admin') {
            params.push(req.session.username); // Assuming username stores the agent name used in assignment
            query += ` AND agente_asignado = $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (razon_social ILIKE $${params.length} OR nombre_contacto ILIKE $${params.length} OR resumen ILIKE $${params.length})`;
        }

        if (type) {
            params.push(`%${type}%`);
            query += ` AND tipo_solicitud ILIKE $${params.length}`;
        }

        if (turnado !== undefined) {
            query += ` AND turnado = ${turnado === 'true'}`;
        }

        // Filter by agent if not admin
        const countParams = [];
        let countQuery = 'SELECT COUNT(*) FROM solicitudes_contino WHERE 1=1';

        if (req.session.role !== 'admin') {
            countParams.push(req.session.username);
            countQuery += ` AND agente_asignado = $${countParams.length}`;
        }

        if (search) {
            countParams.push(`%${search}%`);
            countQuery += ` AND (razon_social ILIKE $${countParams.length} OR nombre_contacto ILIKE $${countParams.length} OR resumen ILIKE $${countParams.length})`;
        }

        if (type) {
            countParams.push(`%${type}%`);
            countQuery += ` AND tipo_solicitud ILIKE $${countParams.length}`;
        }

        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        // Then get paginated and sorted data
        query += ` ORDER BY ${validSortBy} ${validSortOrder} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);
        res.json({
            data: result.rows,
            total,
            page: Math.floor(offset / limit) + 1,
            limit: parseInt(limit),
            sortBy: validSortBy,
            sortOrder: validSortOrder
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getLeadById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM solicitudes_contino WHERE id_registro = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Lead not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const updateLead = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, prioridad, agente_asignado } = req.body;

        // Get current state before update
        const currentResult = await pool.query('SELECT * FROM solicitudes_contino WHERE id_registro = $1', [id]);
        if (currentResult.rows.length === 0) return res.status(404).json({ error: 'Lead not found' });
        const oldLead = currentResult.rows[0];

        // Perform update
        const result = await pool.query(
            'UPDATE solicitudes_contino SET status = COALESCE($1, status), prioridad = COALESCE($2, prioridad), agente_asignado = COALESCE($3, agente_asignado) WHERE id_registro = $4 RETURNING *',
            [status, prioridad, agente_asignado, id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Lead not found' });
        const newLead = result.rows[0];

        // Track changes
        const userId = req.session.userId; // Provided by isAuthenticated middleware
        const changes = [];

        if (status && status !== oldLead.status) {
            changes.push({ action: 'STATUS_CHANGE', prev: oldLead.status, new: status });
        }
        if (prioridad && prioridad !== oldLead.prioridad) {
            changes.push({ action: 'PRIORITY_CHANGE', prev: oldLead.prioridad, new: prioridad });
        }
        if (agente_asignado && agente_asignado !== oldLead.agente_asignado) {
            changes.push({ action: 'ASSIGNMENT_CHANGE', prev: oldLead.agente_asignado, new: agente_asignado });
        }

        // Insert history records
        for (const change of changes) {
            await pool.query(
                'INSERT INTO lead_history (lead_id, user_id, action, previous_value, new_value) VALUES ($1, $2, $3, $4, $5)',
                [id, userId, change.action, change.prev, change.new]
            );
        }

        // Emit real-time event
        try {
            const io = socketConfig.getIO();
            io.emit('lead_updated', result.rows[0]);
        } catch (socketError) {
            console.error('Socket emit error:', socketError);
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT lh.*, u.username 
             FROM lead_history lh 
             LEFT JOIN users u ON lh.user_id = u.id 
             WHERE lh.lead_id = $1 
             ORDER BY lh.created_at DESC`,
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { getLeads, getLeadById, updateLead, getHistory };
