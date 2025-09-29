const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Base admin authentication middleware
const adminAuth = async (req, res, next) => {
  // Get token from header
  const token = req.header('x-admin-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token is for admin
    if (!decoded.admin) {
      return res.status(403).json({ msg: 'Invalid token type' });
    }

    // Get admin data
    const admin = await Admin.findById(decoded.admin.id).select('-password');
    if (!admin) {
      return res.status(404).json({ msg: 'Admin not found' });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(403).json({ msg: 'Admin account is deactivated' });
    }

    // Check if admin is locked
    if (admin.isLocked) {
      return res.status(423).json({ msg: 'Admin account is temporarily locked' });
    }

    req.admin = decoded.admin;
    req.adminData = admin;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Permission-based middleware factory
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      // Admin auth should be called before this
      if (!req.adminData) {
        return res.status(500).json({ msg: 'Admin middleware not properly configured' });
      }

      // Check if admin has the required permission
      if (!req.adminData.hasPermission(permission)) {
        return res.status(403).json({ 
          msg: `Access denied. Required permission: ${permission}` 
        });
      }

      next();
    } catch (err) {
      console.error('Permission middleware error:', err);
      res.status(500).json({ msg: 'Server error' });
    }
  };
};

// Middleware to check multiple permissions (admin needs at least one)
const requireAnyPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      // Admin auth should be called before this
      if (!req.adminData) {
        return res.status(500).json({ msg: 'Admin middleware not properly configured' });
      }

      // Check if admin has at least one of the required permissions
      const hasPermission = permissions.some(permission => 
        req.adminData.hasPermission(permission)
      );

      if (!hasPermission) {
        return res.status(403).json({ 
          msg: `Access denied. Required permissions: ${permissions.join(' or ')}` 
        });
      }

      next();
    } catch (err) {
      console.error('Permission middleware error:', err);
      res.status(500).json({ msg: 'Server error' });
    }
  };
};

// Middleware to check all permissions (admin needs all of them)
const requireAllPermissions = (permissions) => {
  return async (req, res, next) => {
    try {
      // Admin auth should be called before this
      if (!req.adminData) {
        return res.status(500).json({ msg: 'Admin middleware not properly configured' });
      }

      // Check if admin has all required permissions
      const hasAllPermissions = permissions.every(permission => 
        req.adminData.hasPermission(permission)
      );

      if (!hasAllPermissions) {
        return res.status(403).json({ 
          msg: `Access denied. Required permissions: ${permissions.join(' and ')}` 
        });
      }

      next();
    } catch (err) {
      console.error('Permission middleware error:', err);
      res.status(500).json({ msg: 'Server error' });
    }
  };
};

// Super admin middleware (for system-critical operations)
const requireSuperAdmin = async (req, res, next) => {
  try {
    // Admin auth should be called before this
    if (!req.adminData) {
      return res.status(500).json({ msg: 'Admin middleware not properly configured' });
    }

    // Check if admin has system_settings permission (super admin level)
    if (!req.adminData.hasPermission('system_settings')) {
      return res.status(403).json({ 
        msg: 'Access denied. Super admin privileges required' 
      });
    }

    next();
  } catch (err) {
    console.error('Super admin middleware error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Rate limiting middleware for admin actions
const adminRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const adminId = req.admin?.id;
    if (!adminId) {
      return res.status(401).json({ msg: 'Admin authentication required' });
    }

    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old requests
    if (requests.has(adminId)) {
      const adminRequests = requests.get(adminId);
      const validRequests = adminRequests.filter(time => time > windowStart);
      requests.set(adminId, validRequests);
    }

    // Get current requests count
    const currentRequests = requests.get(adminId) || [];
    
    if (currentRequests.length >= maxRequests) {
      return res.status(429).json({ 
        msg: 'Too many requests. Please try again later.' 
      });
    }

    // Add current request
    currentRequests.push(now);
    requests.set(adminId, currentRequests);

    next();
  };
};

// Audit log middleware (logs admin actions)
const auditLog = (action) => {
  return async (req, res, next) => {
    // Store original res.json
    const originalJson = res.json;

    // Override res.json to capture response
    res.json = function(data) {
      // Log admin action (you can extend this to save to database)
      console.log(`AUDIT: Admin ${req.admin?.id} performed ${action} at ${new Date().toISOString()}`);
      console.log(`Request: ${req.method} ${req.originalUrl}`);
      console.log(`Response Status: ${res.statusCode}`);
      
      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
};

module.exports = {
  adminAuth,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireSuperAdmin,
  adminRateLimit,
  auditLog
};
