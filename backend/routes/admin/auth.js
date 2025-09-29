const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../../models/Admin');
const User = require('../../models/User');
const { adminAuth, requirePermission } = require('../../middleware/adminAuth');

// @route   POST api/admin/auth/register-first
// @desc    Register the first admin user (only if no admins exist)
// @access  Public (but restricted to first admin only)
router.post('/register-first', async (req, res) => {
  try {
    // Check if any admin already exists
    const existingAdmin = await Admin.findOne();
    if (existingAdmin) {
      return res.status(403).json({ msg: 'Admin registration is closed. Contact existing admin.' });
    }

    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ msg: 'Please provide all required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters' });
    }

    // Check if email is already used by regular user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: 'Email already exists in user database' });
    }

    // Create first admin
    const admin = new Admin({
      name,
      email,
      password
    });

    await admin.save();

    // Create and return JWT token
    const payload = {
      admin: {
        id: admin.id,
        role: 'admin'
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ 
          token,
          admin: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            permissions: admin.permissions
          }
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/admin/auth/login
// @desc    Authenticate admin & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ msg: 'Please provide email and password' });
    }

    // Check if admin exists
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check if account is locked
    if (admin.isLocked) {
      return res.status(423).json({ msg: 'Account temporarily locked due to too many failed login attempts' });
    }

    // Check if account is active
    if (!admin.isActive) {
      return res.status(403).json({ msg: 'Account has been deactivated' });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      // Increment login attempts
      await admin.incLoginAttempts();
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Reset login attempts and update last login
    await admin.resetLoginAttempts();

    // Create and return JWT token
    const payload = {
      admin: {
        id: admin.id,
        role: 'admin'
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ 
          token,
          admin: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            permissions: admin.permissions
          }
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/admin/auth/me
// @desc    Get current admin data
// @access  Private (Admin)
router.get('/me', adminAuth, async (req, res) => {
  try {
    // This will be protected by admin middleware
    const admin = await Admin.findById(req.admin.id).select('-password');
    if (!admin) {
      return res.status(404).json({ msg: 'Admin not found' });
    }
    res.json(admin);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/admin/auth/create-admin
// @desc    Create new admin (only existing admin can do this)
// @access  Private (Admin with user_management permission)
router.post('/create-admin', adminAuth, requirePermission('user_management'), async (req, res) => {
  try {
    // This will be protected by admin middleware with permission check
    const { name, email, password, permissions } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ msg: 'Please provide all required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters' });
    }

    // Check if admin already exists
    let admin = await Admin.findOne({ email });
    if (admin) {
      return res.status(400).json({ msg: 'Admin already exists with this email' });
    }

    // Check if email is already used by regular user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: 'Email already exists in user database' });
    }

    // Create new admin
    admin = new Admin({
      name,
      email,
      password,
      permissions: permissions || [
        'user_management',
        'approve_users',
        'reject_users',
        'view_analytics',
        'manage_requests',
        'manage_offers'
      ], // Don't give system_settings by default
      createdBy: req.admin.id
    });

    await admin.save();

    res.json({
      msg: 'Admin created successfully',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/admin/auth/change-password
// @desc    Change admin password
// @access  Private (Admin)
router.put('/change-password', adminAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ msg: 'Please provide current and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ msg: 'New password must be at least 6 characters' });
    }

    // Get admin
    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({ msg: 'Admin not found' });
    }

    // Verify current password
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Current password is incorrect' });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    res.json({ msg: 'Password changed successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/admin/auth/me
// @desc    Get current admin
// @access  Private (Admin)
router.get('/me', adminAuth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password');
    res.json({ admin });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/admin/auth/profile
// @desc    Update admin profile
// @access  Private (Admin)
router.put('/profile', adminAuth, async (req, res) => {
  try {
    const { name, email } = req.body;
    
    // Validation
    if (!name || !email) {
      return res.status(400).json({ msg: 'Name and email are required' });
    }

    // Check if email is already taken by another admin
    const existingAdmin = await Admin.findOne({ 
      email: email.toLowerCase(),
      _id: { $ne: req.admin.id }
    });

    if (existingAdmin) {
      return res.status(400).json({ msg: 'Email is already taken' });
    }

    const admin = await Admin.findByIdAndUpdate(
      req.admin.id,
      { name, email: email.toLowerCase() },
      { new: true }
    ).select('-password');

    res.json({ admin, msg: 'Profile updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/admin/auth/change-password
// @desc    Change admin password
// @access  Private (Admin)
router.put('/change-password', adminAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ msg: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ msg: 'New password must be at least 6 characters' });
    }

    // Get admin with password
    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({ msg: 'Admin not found' });
    }

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    admin.lastPasswordChange = new Date();

    await admin.save();

    res.json({ msg: 'Password changed successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
