const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { isAuthenticated } = require('../middleware/authMiddleware');

router.get('/', isAuthenticated, leadController.getLeads);
router.get('/:id', isAuthenticated, leadController.getLeadById);
router.put('/:id', isAuthenticated, leadController.updateLead);
router.get('/:id/history', isAuthenticated, leadController.getHistory);

module.exports = router;
