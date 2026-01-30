const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated, requireAdmin } = require('../middleware/authMiddleware');

// Public route for dropdowns (all authenticated users can see active agents)
router.get('/agents', isAuthenticated, userController.getActiveAgents);

// Admin/Supervisor only routes
router.get('/', isAuthenticated, requireAdmin, userController.getUsers);
router.post('/', isAuthenticated, requireAdmin, userController.createUser);
router.put('/:id', isAuthenticated, requireAdmin, userController.updateUser);
router.delete('/:id', isAuthenticated, requireAdmin, userController.deleteUser);

// Password change (admin or self)
router.put('/:id/password', isAuthenticated, userController.changePassword);

module.exports = router;
