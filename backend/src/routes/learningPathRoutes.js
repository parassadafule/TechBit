const express = require('express');
const { ensureAuthenticated } = require('../middleware/auth');
const {
  generateLearningPathDraft,
  createLearningPath,
  getLearningPath,
  completeLearningPathStep,
  updateLearningPathFeedback,
  deleteLearningPath,
} = require('../controllers/learningPathController');

const router = express.Router();

router.use(ensureAuthenticated);

router.post('/generate', generateLearningPathDraft);
router.post('/', createLearningPath);
router.get('/', getLearningPath);
router.patch('/:id/complete', completeLearningPathStep);
router.patch('/:id/feedback', updateLearningPathFeedback);
router.delete('/:id', deleteLearningPath);

module.exports = router;
