const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admin permissions required' });
  }
  next();
};

const requireModeratorOrAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'moderator')) {
    return res.status(403).json({ message: 'Access denied: Staff permissions required' });
  }
  next();
};

module.exports = {
  requireAdmin,
  requireModeratorOrAdmin
};
