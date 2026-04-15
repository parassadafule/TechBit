const express = require('express');
const { ensureAuthenticated } = require('../middleware/auth');
const { validate, validationRules } = require('../middleware/validator');
const {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} = require('../controllers/commentController');

const router = express.Router();

router.use(ensureAuthenticated);

router.get('/:postId', getComments);

router.post('/:postId', validationRules.createComment, validate, createComment);

router.put('/:id', updateComment);

router.delete('/:id', deleteComment);

module.exports = router;
