const express = require('express');
const { ensureAuthenticated } = require('../middleware/auth');
const { getFeed } = require('../controllers/feedController');

const router = express.Router();

router.use(ensureAuthenticated);

router.get('/', getFeed);

module.exports = router;
