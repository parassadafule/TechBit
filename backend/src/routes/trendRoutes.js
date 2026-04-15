const express = require('express');
const { ensureAuthenticated } = require('../middleware/auth');
const {
  getTrends,
  refreshTrends,
} = require('../controllers/trendController');

const router = express.Router();

router.use(ensureAuthenticated);

router.get('/refresh', refreshTrends);
router.get('/', getTrends);

module.exports = router;
