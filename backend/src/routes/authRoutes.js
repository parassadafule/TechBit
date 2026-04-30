const express = require('express');
const passport = require('passport');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  googleAuth,
  googleCallback,
  githubAuth,
  githubCallback,
  logout,
  getCurrentUser,
  checkAuth,
} = require('../controllers/authController');
const { ensureAuthenticated } = require('../middleware/auth');

const router = express.Router();

router.get(
  '/google',
  authLimiter,
  passport.authenticate('google', { session: false, scope: ['profile', 'email'] }),
  googleAuth
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed`,
  }),
  googleCallback
);

router.get(
  '/github',
  authLimiter,
  passport.authenticate('github', { session: false, scope: ['user:email'] }),
  githubAuth
);

router.get(
  '/github/callback',
  passport.authenticate('github', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed`,
  }),
  githubCallback
);

router.post('/logout', ensureAuthenticated, logout);

router.get('/me', ensureAuthenticated, getCurrentUser);

router.get('/status', ensureAuthenticated, checkAuth);

module.exports = router;
