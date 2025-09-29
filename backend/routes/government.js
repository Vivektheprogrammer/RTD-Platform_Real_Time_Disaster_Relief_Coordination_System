const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { GovernmentProfile } = require('../models/ProfileModels');
const { ResourceRequest } = require('../models/ResourceModels');
const Notification = require('../models/NotificationModel');
const auth = require('../middleware/auth');

// All routes require authenticated government user
router.use(auth);
router.use(auth.requireRole('government'));

// GET /api/government/me - current government user profile
router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    const profile = await GovernmentProfile.findOne({ userId: req.user.id });
    res.json({ user, profile });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// PUT /api/government/me/profile - update government profile
router.put('/me/profile', async (req, res) => {
  try {
    const updates = req.body || {};
    const profile = await GovernmentProfile.findOneAndUpdate(
      { userId: req.user.id },
      { $set: updates },
      { new: true, upsert: true }
    );
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// GET /api/government/overview - basic counts and metrics
router.get('/overview', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ isDeleted: { $ne: true } });
    const verifiedUsers = await User.countDocuments({ isVerified: true, isDeleted: { $ne: true } });
    const pendingVerifications = await User.countDocuments({ isVerified: false, isRejected: { $ne: true }, role: { $in: ['ngo', 'volunteer', 'government'] } });
    res.json({ totalUsers, verifiedUsers, pendingVerifications });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// GET /api/government/requests - get all requests for government management
router.get('/requests', async (req, res) => {
  try {
    const requests = await ResourceRequest.find({ status: { $in: ['pending', 'matched', 'accepted'] } })
      .populate('userId', 'name email role')
      .select('title requestType urgency location createdAt status governmentNote lastContactedAt')
      .sort({ urgency: -1, createdAt: -1 });
    
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// GET /api/government/messages - get government messages for a specific request
router.get('/messages/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    
    // Get all notifications related to this request from government
    const messages = await Notification.find({
      'metadata.requestId': requestId,
      type: { $in: ['emergency_contact', 'system_alert'] },
      sender: req.user.id
    })
    .populate('sender', 'name role')
    .sort({ createdAt: -1 });
    
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Government broadcasts
// POST /api/government/alerts/emergency - broadcast emergency alert to all users
router.post('/alerts/emergency', async (req, res) => {
  try {
    const { title, message, priority } = req.body || {};
    const users = await User.find({ isDeleted: { $ne: true } }).select('_id');
    const notifications = users.map(u => ({
      recipient: u._id,
      sender: req.user.id,
      type: 'system_alert',
      title: title || 'Emergency Alert',
      message: message || 'Emergency alert has been issued by authorities.',
      priority: priority || 'urgent'
    }));
    const savedNotifications = await Notification.insertMany(notifications);
    // Emit both a general notification and a specific system_alert event
    req.app.get('io').emit('notification', { type: 'system_alert' });
    req.app.get('io').emit('system_alert', { alerts: savedNotifications });
    res.json({ success: true, count: notifications.length });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// POST /api/government/announcements - broadcast general safety announcement
router.post('/announcements', async (req, res) => {
  try {
    const { title, message } = req.body || {};
    const users = await User.find({ isDeleted: { $ne: true } }).select('_id');
    const notifications = users.map(u => ({
      recipient: u._id,
      sender: req.user.id,
      type: 'system_alert',
      title: title || 'Safety Announcement',
      message: message || 'Please follow safety instructions from authorities.',
      priority: 'medium'
    }));
    const savedNotifications = await Notification.insertMany(notifications);
    // Emit both a general notification and a specific system_alert event
    req.app.get('io').emit('notification', { type: 'system_alert' });
    req.app.get('io').emit('system_alert', { alerts: savedNotifications });
    res.json({ success: true, count: notifications.length });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// POST /api/government/emergency/send-help - alert nearby emergency services
router.post('/emergency/send-help', async (req, res) => {
  try {
    const { requestId, location, emergencyType, details } = req.body || {};
    
    if (!requestId || !location) {
      return res.status(400).json({ msg: 'Request ID and location are required' });
    }
    
    // 1. Find nearby emergency services based on location
    // This would typically involve geospatial queries to find services near the incident
    // For demonstration, we'll simulate this with a notification
    
    // 2. Create emergency dispatch record
    const emergencyDispatch = {
      requestId,
      location,
      emergencyType: emergencyType || 'general',
      details: details || 'Emergency assistance needed',
      dispatchedBy: req.user.id,
      dispatchTime: new Date(),
      status: 'dispatched'
    };
    
    // 3. Notify emergency services (would connect to external emergency service APIs)
    // For demonstration, we'll create notifications for system users with emergency roles
    const emergencyUsers = await User.find({ 
      role: { $in: ['emergency_services', 'government'] },
      isDeleted: { $ne: true }
    }).select('_id');
    
    const notifications = emergencyUsers.map(u => ({
      recipient: u._id,
      sender: req.user.id,
      type: 'emergency_dispatch',
      title: 'EMERGENCY: Assistance Required',
      message: `Emergency assistance needed at ${location}. Type: ${emergencyType || 'General emergency'}. Details: ${details || 'No additional details'}`,
      priority: 'urgent',
      metadata: { requestId, location }
    }));
    
    await Notification.insertMany(notifications);
    
    // 4. Send real-time alert via websockets
    req.app.get('io').emit('emergency_alert', { 
      type: 'emergency_dispatch',
      location,
      emergencyType,
      requestId
    });
    
    res.json({ 
      success: true, 
      message: 'Emergency services have been alerted',
      notifiedServices: emergencyUsers.length,
      dispatch: emergencyDispatch
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// POST /api/government/emergency/contact - contact requestor about their emergency
router.post('/emergency/contact', auth, async (req, res) => {
  try {
    const { requestId, message, contactMethod } = req.body || {};
    
    if (!requestId || !message) {
      return res.status(400).json({ msg: 'Request ID and message are required' });
    }
    
    // Find the request owner to send them a notification
    const request = await ResourceRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ msg: 'Request not found' });
    }
    
    // Create a notification for the request owner
    const notification = new Notification({
      recipient: request.userId,
      sender: req.user.id,
      type: 'emergency_contact',
      title: 'Emergency Response Team Contact',
      message: message,
      priority: 'high',
      metadata: { 
        requestId,
        contactMethod: contactMethod || 'in_app'
      }
    });
    
    await notification.save();
    
    // Send real-time notification
    req.app.get('io').emit('notification', { 
      type: 'emergency_contact',
      recipientId: request.userId,
      requestId
    });
    
    // Update the request with contact information
    await ResourceRequest.findByIdAndUpdate(
      requestId,
      { 
        $set: { 
          governmentNote: message,
          lastContactedAt: new Date()
        }
      }
    );
    
    res.json({ 
      success: true, 
      message: 'Contact message sent successfully',
      notification: notification._id
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;


