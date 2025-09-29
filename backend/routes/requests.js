const express = require('express');
const router = express.Router();
const { ResourceRequest } = require('../models/ResourceModels');
const User = require('../models/User');
const { VictimProfile } = require('../models/ProfileModels');
const Notification = require('../models/NotificationModel');
const auth = require('../middleware/auth');

// Middleware to check if user is a victim
const isVictim = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'victim') {
      return res.status(403).json({ msg: 'Access denied. Only victims can perform this action.' });
    }
    next();
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   POST api/requests
// @desc    Create a new resource request
// @access  Private (victims only)
router.post('/', auth, isVictim, async (req, res) => {
  try {
    console.log('Request body:', req.body);
    const { requestType, title, description, quantity, urgency, location, requiredBy } = req.body;

    // Create new request
    const newRequest = new ResourceRequest({
      userId: req.user.id,
      requestType,
      title,
      description,
      quantity,
      urgency,
      location,
      requiredBy: requiredBy || undefined
    });

    const request = await newRequest.save();

    // Emit socket event for real-time updates
    req.app.get('io').emit('newRequest', {
      requestId: request._id,
      requestType,
      urgency,
      location: location.coordinates
    });

    res.json(request);
  } catch (err) {
    console.error('Error creating request:', err);
    res.status(500).json({ 
      msg: 'Server error',
      error: err.message,
      details: err.errors || {}
    });
  }
});

// @route   GET api/requests
// @desc    Get all requests by current victim
// @access  Private (victims only)
router.get('/', auth, isVictim, async (req, res) => {
  try {
    const requests = await ResourceRequest.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/requests/map
// @desc    Get all requests for map display
// @access  Private
router.get('/map', auth, async (req, res) => {
  try {
    const requests = await ResourceRequest.find({ status: { $in: ['pending', 'matched'] } })
      .populate('userId', 'name role')
      .select('title requestType urgency location createdAt status')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/requests/view/:id
// @desc    Get request by ID for NGOs to view (read-only)
// @access  Private (authenticated users - victims and NGOs)
router.get('/view/:id', auth, async (req, res) => {
  try {
    const request = await ResourceRequest.findById(req.params.id)
      .populate('userId', 'name email role')
      .populate('matchedWith', 'title description');
    
    if (!request) {
      return res.status(404).json({ msg: 'Request not found' });
    }

    // Only show active requests (not cancelled or fulfilled)
    if (!['pending', 'matched', 'accepted'].includes(request.status)) {
      return res.status(404).json({ msg: 'Request not found' });
    }

    res.json(request);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Request not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   GET api/requests/:id
// @desc    Get request by ID
// @access  Private (victims, government, and NGOs)
router.get('/:id', auth, async (req, res) => {
  try {
    const request = await ResourceRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ msg: 'Request not found' });
    }

    // Get the user's role
    const user = await User.findById(req.user.id);
    
    // Allow access to the request owner, government users, and NGOs
    if (request.userId.toString() !== req.user.id && 
        (!user || (user.role !== 'government' && user.role !== 'ngo'))) {
      return res.status(403).json({ msg: 'Not authorized to view this request' });
    }

    res.json(request);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Request not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   GET api/requests/:id/government-messages
// @desc    Get government messages for a specific request
// @access  Private (victims, government, and NGOs)
router.get('/:id/government-messages', auth, async (req, res) => {
  try {
    const request = await ResourceRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ msg: 'Request not found' });
    }

    // Get the user's role
    const user = await User.findById(req.user.id);
    
    // Allow access to the request owner, government users, and NGOs
    if (request.userId.toString() !== req.user.id && 
        (!user || (user.role !== 'government' && user.role !== 'ngo'))) {
      return res.status(403).json({ msg: 'Not authorized to view this request' });
    }

    // Get government messages for this request
    const messages = await Notification.find({
      'metadata.requestId': req.params.id,
      type: { $in: ['emergency_contact', 'system_alert'] }
    })
    .populate('sender', 'name role')
    .sort({ createdAt: -1 });

    res.json(messages);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Request not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/requests/:id
// @desc    Update a request
// @access  Private (victims only)
router.put('/:id', auth, isVictim, async (req, res) => {
  try {
    const { requestType, title, description, quantity, urgency, location, requiredBy, status } = req.body;

    // Find the request
    let request = await ResourceRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ msg: 'Request not found' });
    }

    // Check if the request belongs to the current user
    if (request.userId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Check if request can be updated (not fulfilled or cancelled)
    if (request.status === 'fulfilled' || request.status === 'cancelled') {
      return res.status(400).json({ msg: `Request cannot be updated because it is ${request.status}` });
    }

    // Update fields
    if (requestType) request.requestType = requestType;
    if (title) request.title = title;
    if (description) request.description = description;
    if (quantity) request.quantity = quantity;
    if (urgency) request.urgency = urgency;
    if (location) request.location = location;
    if (requiredBy) request.requiredBy = requiredBy;
    if (status) request.status = status;

    await request.save();

    // Emit socket event for real-time updates
    req.app.get('io').emit('requestUpdated', {
      requestId: request._id,
      requestType: request.requestType,
      urgency: request.urgency,
      status: request.status
    });

    res.json(request);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Request not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/requests/:id
// @desc    Delete a request
// @access  Private (victims only)
router.delete('/:id', auth, isVictim, async (req, res) => {
  try {
    const request = await ResourceRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ msg: 'Request not found' });
    }

    // Check if the request belongs to the current user
    if (request.userId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Check if request can be deleted (not fulfilled)
    if (request.status === 'fulfilled') {
      return res.status(400).json({ msg: 'Fulfilled requests cannot be deleted' });
    }

    await request.remove();

    // Emit socket event for real-time updates
    req.app.get('io').emit('requestDeleted', {
      requestId: req.params.id
    });

    res.json({ msg: 'Request removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Request not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/requests/:id/cancel
// @desc    Cancel a request
// @access  Private (victims only)
router.put('/:id/cancel', auth, isVictim, async (req, res) => {
  try {
    const request = await ResourceRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ msg: 'Request not found' });
    }

    // Check if the request belongs to the current user
    if (request.userId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Check if request can be cancelled (not fulfilled or already cancelled)
    if (request.status === 'fulfilled') {
      return res.status(400).json({ msg: 'Fulfilled requests cannot be cancelled' });
    }

    if (request.status === 'cancelled') {
      return res.status(400).json({ msg: 'Request is already cancelled' });
    }

    request.status = 'cancelled';
    await request.save();

    // Notify matched NGOs if any
    if (request.matchedWith && request.matchedWith.length > 0) {
      for (const match of request.matchedWith) {
        // Create notification for each matched NGO
        // This would be implemented in the notification system
      }
    }

    // Emit socket event for real-time updates
    req.app.get('io').emit('requestCancelled', {
      requestId: request._id
    });

    res.json(request);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Request not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   GET api/requests/accepted-for-ngo
// @desc    Get requests where this NGO's offers have been accepted and need completion
// @access  Private (NGOs only)
router.get('/accepted-for-ngo', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'ngo') {
      return res.status(403).json({ msg: 'Access denied. Only NGOs can access this endpoint.' });
    }

    // Find requests where this NGO has accepted matches
    const requests = await ResourceRequest.find({
      'matchedWith.offeredBy': req.user.id,
      'matchedWith.status': 'accepted',
      status: { $in: ['matched', 'accepted'] }
    })
    .populate('requestedBy', 'name email')
    .populate({
      path: 'matchedWith.offeredBy',
      select: 'name email'
    })
    .sort({ createdAt: -1 });

    // Filter and format the requests to show only relevant match information
    const acceptedRequests = requests.map(request => {
      // Find the specific accepted match for this NGO
      const acceptedMatch = request.matchedWith.find(
        match => match.offeredBy.toString() === req.user.id && match.status === 'accepted'
      );

      return {
        _id: request._id,
        requestType: request.requestType,
        type: request.requestType,
        title: request.title,
        description: request.description,
        quantity: request.quantity,
        urgency: request.urgency,
        location: request.location,
        requiredBy: request.requiredBy,
        status: request.status,
        createdAt: request.createdAt,
        requestedBy: request.requestedBy,
        acceptedMatch: {
          offerId: acceptedMatch.offerId,
          status: acceptedMatch.status,
          matchedAt: acceptedMatch.matchedAt,
          acceptedAt: acceptedMatch.acceptedAt,
          offerTitle: acceptedMatch.offerTitle,
          offerDescription: acceptedMatch.offerDescription
        }
      };
    });

    res.json(acceptedRequests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;