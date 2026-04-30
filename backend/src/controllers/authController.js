const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const User = require('../models/User');

const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';

const sanitizeUser = (user) => {
  if (!user) {
    return null;
  }

  const source = typeof user.toObject === 'function'
    ? user.toObject({ virtuals: true, getters: true })
    : user;

  return {
    _id: source._id,
    username: source.username,
    email: source.email,
    avatarUrl: source.avatarUrl,
    oauthProvider: source.oauthProvider,
    bio: source.bio,
    location: source.location,
    website: source.website,
    interests: source.interests || [],
    goals: source.goals,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
    lastLoginAt: source.lastLoginAt,
  };
};

const buildFrontendUrl = (path = '') => {
  if (!path) {
    return `${FRONTEND_URL}/`;
  }

  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return `${FRONTEND_URL}/${normalizedPath}`;
};

const generateJwt = (user) => jwt.sign(
  {
    id: user._id.toString(),
    email: user.email,
    name: user.username,
    picture: user.avatarUrl,
  },
  JWT_SECRET,
  { expiresIn: JWT_EXPIRES_IN }
);

const finalizeOAuth = async (req, res, provider) => {
  try {
    const token = generateJwt(req.user);
    logger.info(`User logged in via ${provider} OAuth: ${req.user.email}`);
    return res.redirect(`${FRONTEND_URL}/dashboard?token=${encodeURIComponent(token)}`);
  } catch (error) {
    logger.error('Failed to finalize OAuth login', error);
    return res.redirect(buildFrontendUrl('login?error=auth_failed'));
  }
};

const googleAuth = (req, res, next) => {
  logger.info('Google OAuth initiated');
  next();
};

const googleCallback = (req, res) => {
  finalizeOAuth(req, res, 'google');
};

const githubAuth = (req, res, next) => {
  logger.info('GitHub OAuth initiated');
  next();
};

const githubCallback = (req, res) => {
  finalizeOAuth(req, res, 'github');
};

const logout = (req, res) => {
  logger.info(`User logged out: ${req.user?.email}`);
  return res.json({ message: 'Logged out successfully' });
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    logger.error('Error fetching current user:', error);
    return res.status(500).json({ error: 'Failed to fetch current user' });
  }
};

const checkAuth = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ authenticated: false, user: null });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(401).json({ authenticated: false, user: null });
    }

    return res.json({
      authenticated: true,
      user: sanitizeUser(user),
    });
  } catch (error) {
    logger.error('Error checking auth status:', error);
    return res.status(500).json({ error: 'Failed to check authentication status' });
  }
};

module.exports = {
  googleAuth,
  googleCallback,
  githubAuth,
  githubCallback,
  logout,
  getCurrentUser,
  checkAuth,
};
