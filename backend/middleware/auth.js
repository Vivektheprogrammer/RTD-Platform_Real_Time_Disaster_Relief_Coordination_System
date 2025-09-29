const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Role-based access control for user roles
module.exports.requireRole = function(requiredRoles) {
  return function(req, res, next) {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ msg: 'Authentication required' });
    }
    const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    if (!rolesArray.includes(req.user.role)) {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    next();
  };
};