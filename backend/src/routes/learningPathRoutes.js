const express = require('express');
const { ensureAuthenticated } = require('../middleware/auth');
const {
  createLearningPath,
  getLearningPath,
  completeLearningPathStep,
  updateLearningPathFeedback,
} = require('../controllers/learningPathController');

const router = express.Router();

router.use(ensureAuthenticated);

router.post('/', createLearningPath);
router.get('/', getLearningPath);
router.patch('/:id/complete', completeLearningPathStep);
router.patch('/:id/feedback', updateLearningPathFeedback);

module.exports = router;
