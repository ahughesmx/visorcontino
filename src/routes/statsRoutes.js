const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { isAuthenticated } = require('../middleware/authMiddleware');

router.get('/', isAuthenticated, statsController.getStats);
router.get('/trends', isAuthenticated, statsController.getTrends);

module.exports = router;
