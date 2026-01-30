const bcrypt = require('bcrypt');
const pool = require('../config/db');

const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.role = user.role;
        req.session.fullName = user.full_name;

        res.json({
            message: 'Inicio de sesión exitoso',
            user: {
                username: user.username,
                role: user.role,
                fullName: user.full_name
            }
        });
    } catch (err) {
        console.error('Error in login:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

const logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Error al cerrar sesión' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Sesión cerrada correctamente' });
    });
};

const checkAuth = (req, res) => {
    if (req.session && req.session.userId) {
        res.json({
            authenticated: true,
            user: {
                username: req.session.username,
                role: req.session.role,
                fullName: req.session.fullName
            }
        });
    } else {
        res.json({ authenticated: false });
    }
};

module.exports = { login, logout, checkAuth };
