const jwt = require('jsonwebtoken');

const extractTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
};

const ensureAuthenticated = (req, res, next) => {
  try {
    const token = extractTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = {
      _id: payload.id,
      email: payload.email,
      username: payload.name,
      avatarUrl: payload.picture,
    };
    req.authToken = token;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
};


const ensureNotAuthenticated = (req, res, next) => {
  const token = extractTokenFromRequest(req);
  if (!token) {
    return next();
  }
  return res.status(400).json({ error: 'Already authenticated' });
};


const ensureOwnership = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    const resource = req.resource; // Should be set by controller
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const resourceUserId = resource[resourceUserIdField]?.toString();
    const currentUserId = req.user._id.toString();

    if (resourceUserId !== currentUserId) {
      return res.status(403).json({ error: 'Forbidden. You do not own this resource.' });
    }

    next();
  };
};

module.exports = {
  ensureAuthenticated,
  ensureNotAuthenticated,
  ensureOwnership,
};
