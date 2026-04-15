const logger = require('../utils/logger');

const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
const SESSION_COOKIE_NAME = 'connect.sid';

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
    bookmarks: source.bookmarks || [],
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

const finalizeOAuth = (req, res, provider) => {
  if (!req.user) {
    logger.warn(`OAuth callback invoked without authenticated user for ${provider}`);
    return res.redirect(buildFrontendUrl('login?error=auth_failed'));
  }

  const redirectUrl = buildFrontendUrl();

  const completeRedirect = () => {
    logger.info(`User redirected to frontend after ${provider} login: ${req.user.email}`);
    res.redirect(redirectUrl);
  };

  if (req.session && typeof req.session.save === 'function') {
    req.session.save((error) => {
      if (error) {
        logger.error('Failed to persist session during OAuth callback', error);
        return res.redirect(buildFrontendUrl('login?error=session'));
      }
      completeRedirect();
    });
    return;
  }

  completeRedirect();
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
  const userEmail = req.user?.email;
  req.logout((logoutError) => {
    if (logoutError) {
      logger.error('Error logging out:', logoutError);
      return res.status(500).json({ error: 'Error logging out' });
    }

    req.session?.destroy((sessionError) => {
      if (sessionError) {
        logger.error('Error destroying session:', sessionError);
      }

      res.clearCookie(SESSION_COOKIE_NAME, {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });

      logger.info(`User logged out: ${userEmail}`);
      return res.json({ message: 'Logged out successfully' });
    });
  });
};


const getCurrentUser = (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  return res.json({ user: sanitizeUser(req.user) });
};


const checkAuth = (req, res) => {
  const authenticated = req.isAuthenticated();

  return res.json({
    authenticated,
    user: authenticated ? sanitizeUser(req.user) : null,
  });
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
