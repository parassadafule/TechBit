const { body, param, query, validationResult } = require('express-validator');


const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};


const sanitizeInput = (value) => {
  if (typeof value === 'string') {
    return value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/[<>]/g, '')
      .trim();
  }
  return value;
};


const validationRules = {
  updateProfile: [
    body('bio')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Bio too long')
      .customSanitizer(sanitizeInput),
    body('location')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Location too long')
      .customSanitizer(sanitizeInput),
    body('website')
      .optional({ nullable: true })
      .custom((value) => {
        if (!value || !String(value).trim()) return true;
        return /^https?:\/\//i.test(String(value).trim());
      })
      .withMessage('Website must be a valid URL starting with http:// or https://')
      .customSanitizer(sanitizeInput),
    body('interests')
      .optional()
      .isArray()
      .withMessage('Interests must be an array'),
    body('interests.*')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 50 })
      .customSanitizer(sanitizeInput),
    body('goals.skillLevel')
      .optional()
      .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
      .withMessage('Invalid skill level'),
    body('goals.career')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 100 })
      .customSanitizer(sanitizeInput),
  ],

  createPost: [
    body('title')
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 500 })
      .withMessage('Title too long')
      .customSanitizer(sanitizeInput),
    body('content')
      .notEmpty()
      .withMessage('Content is required')
      .isLength({ max: 50000 })
      .withMessage('Content too long'),
    body('blogUrl')
      .optional()
      .isURL()
      .withMessage('Invalid URL'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('tags.*')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 30 })
      .customSanitizer(sanitizeInput),
    body('type')
      .notEmpty()
      .isIn(['blog', 'repo', 'video', 'podcast'])
      .withMessage('Invalid post type'),
  ],

  uploadPost: [
    body('url')
      .notEmpty()
      .withMessage('URL is required')
      .isURL()
      .withMessage('Invalid URL'),
    body('type')
      .notEmpty()
      .isIn(['blog', 'repo', 'video', 'podcast'])
      .withMessage('Invalid post type'),
  ],

  createComment: [
    body('text')
      .notEmpty()
      .withMessage('Comment text is required')
      .isLength({ max: 2000 })
      .withMessage('Comment too long')
      .customSanitizer(sanitizeInput),
    param('postId')
      .isMongoId()
      .withMessage('Invalid post ID'),
  ],

  search: [
    query('q')
      .optional({ nullable: true, checkFalsy: true })
      .isString()
      .trim()
      .isLength({ max: 200 })
      .customSanitizer(sanitizeInput),
    query('tags')
      .optional({ nullable: true, checkFalsy: true })
      .isString()
      .customSanitizer(sanitizeInput),
    query('type')
      .optional({ nullable: true, checkFalsy: true })
      .isIn(['blog', 'repo', 'video', 'podcast'])
      .withMessage('Invalid post type'),
    query('page')
      .optional({ nullable: true, checkFalsy: true })
      .isInt({ min: 1 })
      .withMessage('Invalid page number'),
    query('limit')
      .optional({ nullable: true, checkFalsy: true })
      .isInt({ min: 1, max: 100 })
      .withMessage('Invalid limit'),
  ],

  aiQuery: [
    body('query')
      .notEmpty()
      .withMessage('Query is required')
      .isLength({ max: 500 })
      .withMessage('Query too long')
      .customSanitizer(sanitizeInput),
  ],

  summarize: [
    body('content')
      .optional()
      .isString()
      .isLength({ max: 50000 })
      .withMessage('Content too long'),
    body('url')
      .optional()
      .isURL()
      .withMessage('Invalid URL'),
    body('type')
      .optional()
      .isIn(['blog', 'repo', 'video', 'podcast'])
      .withMessage('Invalid type'),
  ],

  summarizeMultimodal: [
    body('inputs')
      .isArray({ min: 1 })
      .withMessage('inputs must be a non-empty array'),
    body('inputs.*.content')
      .optional()
      .isString()
      .isLength({ max: 50000 })
      .withMessage('Input content too long'),
    body('inputs.*.url')
      .optional()
      .isURL()
      .withMessage('Invalid input URL'),
    body('inputs.*.type')
      .optional()
      .isIn(['blog', 'repo', 'video', 'podcast', 'audio', 'code'])
      .withMessage('Invalid input type'),
    body('inputs.*.modality')
      .optional()
      .isIn(['text', 'blog', 'repo', 'video', 'podcast', 'audio', 'code'])
      .withMessage('Invalid modality'),
    body('focus')
      .optional()
      .isString()
      .isLength({ max: 200 })
      .customSanitizer(sanitizeInput),
  ],

  mongoId: [
    param('id')
      .isMongoId()
      .withMessage('Invalid ID'),
  ],
};

module.exports = {
  validate,
  validationRules,
  sanitizeInput,
};
