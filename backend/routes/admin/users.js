const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const { VictimProfile, NGOProfile, VolunteerProfile, GovernmentProfile } = require('../../models/ProfileModels');
const { adminAuth, requirePermission, auditLog } = require('../../middleware/adminAuth');

// Apply admin authentication to all routes
router.use(adminAuth);

// @route   GET api/admin/users
// @desc    Get all users with pagination and filtering
// @access  Private (Admin with user_management permission)
router.get('/', 
  requirePermission('user_management'),
  auditLog('view_users'),
  async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        role, 
        isVerified, 
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Build filter object
      const filter = {};
      if (role) filter.role = role;
      if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute queries
      const skip = (page - 1) * limit;
      const users = await User.find(filter)
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      const totalUsers = await User.countDocuments(filter);
      const totalPages = Math.ceil(totalUsers / limit);

      res.json({
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalUsers,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET api/admin/users/:id
// @desc    Get specific user with profile data
// @access  Private (Admin with user_management permission)
router.get('/:id', 
  requirePermission('user_management'),
  auditLog('view_user_details'),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select('-password');
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      // Get profile based on role
      let profile = null;
      switch (user.role) {
        case 'victim':
          profile = await VictimProfile.findOne({ userId: user._id });
          break;
        case 'ngo':
          profile = await NGOProfile.findOne({ userId: user._id });
          break;
        case 'volunteer':
          profile = await VolunteerProfile.findOne({ userId: user._id });
          break;
        case 'government':
          profile = await GovernmentProfile.findOne({ userId: user._id });
          break;
      }

      res.json({
        user,
        profile
      });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'User not found' });
      }
      res.status(500).send('Server error');
    }
  }
);

// @route   PUT api/admin/users/:id/approve
// @desc    Approve user registration
// @access  Private (Admin with approve_users permission)
router.put('/:id/approve', 
  requirePermission('approve_users'),
  auditLog('approve_user'),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      if (user.isVerified) {
        return res.status(400).json({ msg: 'User is already verified' });
      }

      // Update user verification status
      user.isVerified = true;
      user.approvedBy = req.admin.id;
      user.approvedAt = new Date();
      
      await user.save();

      res.json({ 
        msg: 'User approved successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified
        }
      });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'User not found' });
      }
      res.status(500).send('Server error');
    }
  }
);

// @route   PUT api/admin/users/:id/reject
// @desc    Reject user registration
// @access  Private (Admin with reject_users permission)
router.put('/:id/reject', 
  requirePermission('reject_users'),
  auditLog('reject_user'),
  async (req, res) => {
    try {
      const { rejectionReason } = req.body;
      
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      if (user.isVerified) {
        return res.status(400).json({ msg: 'Cannot reject verified user' });
      }

      // Update user with rejection info
      user.isRejected = true;
      user.rejectedBy = req.admin.id;
      user.rejectedAt = new Date();
      user.rejectionReason = rejectionReason || 'No reason provided';
      
      await user.save();

      res.json({ 
        msg: 'User rejected successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isRejected: user.isRejected,
          rejectionReason: user.rejectionReason
        }
      });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'User not found' });
      }
      res.status(500).send('Server error');
    }
  }
);

// @route   PUT api/admin/users/:id/suspend
// @desc    Suspend user account
// @access  Private (Admin with user_management permission)
router.put('/:id/suspend', 
  requirePermission('user_management'),
  auditLog('suspend_user'),
  async (req, res) => {
    try {
      const { suspensionReason, suspensionDuration } = req.body;
      
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      // Calculate suspension end date
      const suspendedUntil = suspensionDuration ? 
        new Date(Date.now() + (suspensionDuration * 24 * 60 * 60 * 1000)) : 
        null; // Permanent if no duration provided

      user.isSuspended = true;
      user.suspendedBy = req.admin.id;
      user.suspendedAt = new Date();
      user.suspendedUntil = suspendedUntil;
      user.suspensionReason = suspensionReason || 'No reason provided';
      
      await user.save();

      res.json({ 
        msg: 'User suspended successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isSuspended: user.isSuspended,
          suspendedUntil: user.suspendedUntil,
          suspensionReason: user.suspensionReason
        }
      });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'User not found' });
      }
      res.status(500).send('Server error');
    }
  }
);

// @route   PUT api/admin/users/:id/unsuspend
// @desc    Unsuspend user account
// @access  Private (Admin with user_management permission)
router.put('/:id/unsuspend', 
  requirePermission('user_management'),
  auditLog('unsuspend_user'),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      if (!user.isSuspended) {
        return res.status(400).json({ msg: 'User is not suspended' });
      }

      user.isSuspended = false;
      user.suspendedUntil = null;
      user.suspensionReason = null;
      user.unsuspendedBy = req.admin.id;
      user.unsuspendedAt = new Date();
      
      await user.save();

      res.json({ 
        msg: 'User unsuspended successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isSuspended: user.isSuspended
        }
      });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'User not found' });
      }
      res.status(500).send('Server error');
    }
  }
);

// @route   DELETE api/admin/users/:id
// @desc    Delete user account (soft delete)
// @access  Private (Admin with user_management permission)
router.delete('/:id', 
  requirePermission('user_management'),
  auditLog('delete_user'),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      // Soft delete - mark as deleted but keep in database
      user.isDeleted = true;
      user.deletedBy = req.admin.id;
      user.deletedAt = new Date();
      
      await user.save();

      res.json({ msg: 'User deleted successfully' });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'User not found' });
      }
      res.status(500).send('Server error');
    }
  }
);

// @route   GET api/admin/users/pending/approval
// @desc    Get users pending approval
// @access  Private (Admin with approve_users permission)
router.get('/pending/approval', 
  requirePermission('approve_users'),
  auditLog('view_pending_users'),
  async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      
      const skip = (page - 1) * limit;
      const pendingUsers = await User.find({ 
        isVerified: false,
        isRejected: { $ne: true },
        role: { $ne: 'victim' } // Victims are auto-verified
      })
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const totalPending = await User.countDocuments({ 
        isVerified: false,
        isRejected: { $ne: true },
        role: { $ne: 'victim' }
      });

      const totalPages = Math.ceil(totalPending / limit);

      res.json({
        users: pendingUsers,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalUsers: totalPending,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   PUT api/admin/users/bulk/approve
// @desc    Bulk approve multiple users
// @access  Private (Admin with approve_users permission)
router.put('/bulk/approve', 
  requirePermission('approve_users'),
  auditLog('bulk_approve_users'),
  async (req, res) => {
    try {
      const { userIds } = req.body;
      
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ msg: 'Please provide user IDs array' });
      }

      const result = await User.updateMany(
        { 
          _id: { $in: userIds },
          isVerified: false,
          isRejected: { $ne: true }
        },
        { 
          $set: {
            isVerified: true,
            approvedBy: req.admin.id,
            approvedAt: new Date()
          }
        }
      );

      res.json({ 
        msg: `Successfully approved ${result.modifiedCount} users`,
        modifiedCount: result.modifiedCount
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
