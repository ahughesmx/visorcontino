const pool = require('../config/db');
const bcrypt = require('bcrypt');

// Get all users (admin only)
const getUsers = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, username, full_name, phone, role, status, created_at FROM users ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Create new user (admin only)
const createUser = async (req, res) => {
    const { username, password, full_name, phone, role, status } = req.body;

    // Validation
    if (!username || !password || !role) {
        return res.status(400).json({ error: 'Username, password y role son requeridos' });
    }

    if (!['admin', 'supervisor', 'agent'].includes(role)) {
        return res.status(400).json({ error: 'Role inválido' });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    try {
        // Check if username already exists
        const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'El nombre de usuario ya existe' });
        }

        // Hash password
        const hash = await bcrypt.hash(password, 10);

        // Insert user
        const result = await pool.query(
            'INSERT INTO users (username, password_hash, full_name, phone, role, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, full_name, phone, role, status, created_at',
            [username, hash, full_name, phone, role, status || 'active']
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ error: 'Error creando usuario' });
    }
};

// Update user (admin only) - updates password if provided
const updateUser = async (req, res) => {
    const { id } = req.params;
    const { username, full_name, phone, role, status, password } = req.body;

    if (role && !['admin', 'supervisor', 'agent'].includes(role)) {
        return res.status(400).json({ error: 'Role inválido' });
    }

    try {
        let hash = null;
        if (password && password.trim() !== '') {
            if (password.length < 8) {
                return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
            }
            hash = await bcrypt.hash(password, 10);
        }

        const result = await pool.query(
            'UPDATE users SET username = COALESCE($1, username), full_name = COALESCE($2, full_name), phone = COALESCE($3, phone), role = COALESCE($4, role), status = COALESCE($5, status), password_hash = COALESCE($6, password_hash) WHERE id = $7 RETURNING id, username, full_name, phone, role, status',
            [username, full_name, phone, role, status, hash, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ error: 'Error actualizando usuario' });
    }
};

// Delete user (admin only) - soft delete by setting status to inactive
const deleteUser = async (req, res) => {
    const { id } = req.params;

    // Prevent self-delete
    if (parseInt(id) === req.session.userId) {
        return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
    }

    try {
        const result = await pool.query(
            'UPDATE users SET status = $1 WHERE id = $2 RETURNING id',
            ['inactive', id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ message: 'Usuario desactivado exitosamente' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ error: 'Error eliminando usuario' });
    }
};

// Change password (admin or self)
const changePassword = async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;
    const currentUserId = req.session.userId;
    const currentUserRole = req.session.userRole;

    // Check permissions: admin can change any password, others can only change their own
    const isAdmin = currentUserRole === 'admin';
    const isSelf = parseInt(id) === currentUserId;

    if (!isAdmin && !isSelf) {
        return res.status(403).json({ error: 'No tienes permiso para cambiar esta contraseña' });
    }

    // Validate password
    if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    try {
        // Hash new password
        const hash = await bcrypt.hash(newPassword, 10);

        // Update
        const result = await pool.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id',
            [hash, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ message: 'Contraseña actualizada exitosamente' });
    } catch (err) {
        console.error('Error changing password:', err);
        res.status(500).json({ error: 'Error cambiando contraseña' });
    }
};

// Get active agents (for dropdowns) - available to all authenticated users
const getActiveAgents = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT username FROM users WHERE status = 'active' ORDER BY username ASC"
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching agents:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    changePassword,
    getActiveAgents
};
