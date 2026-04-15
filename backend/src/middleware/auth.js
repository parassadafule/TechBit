
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized. Please log in.' });
};


const ensureNotAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated()) {
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
