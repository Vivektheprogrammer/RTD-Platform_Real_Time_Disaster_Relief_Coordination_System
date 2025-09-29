const express = require('express');
const router = express.Router();
const { ResourceOffer } = require('../models/ResourceModels');
const User = require('../models/User');
const { NGOProfile } = require('../models/ProfileModels');
const Notification = require('../models/NotificationModel');
const auth = require('../middleware/auth');

// Middleware to check if user is an NGO
const isNGO = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'ngo') {
      return res.status(403).json({ msg: 'Access denied. Only NGOs can perform this action.' });
    }
    next();
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   POST api/offers
// @desc    Create a new resource offer
// @access  Private (NGOs only)
router.post('/', auth, isNGO, async (req, res) => {
  try {
    console.log('Received offer data:', req.body);
    const { 
      type, 
      resourceType, 
      title, 
      description, 
      quantity, 
      availableFrom, 
      availableUntil, 
      expiresIn,
      location,
      additionalInfo 
    } = req.body;

    // Handle different data formats from frontend
    const offerType = type || resourceType || 'other';
    const offerTitle = title || description || 'Resource Offer';
    
    // Calculate expiration date if expiresIn is provided (in days)
    let calculatedAvailableUntil = availableUntil;
    if (expiresIn && !availableUntil) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + parseInt(expiresIn));
      calculatedAvailableUntil = expirationDate;
    }

    // Create new offer
    const newOffer = new ResourceOffer({
      userId: req.user.id,
      resourceType: offerType,
      title: offerTitle,
      description: description || additionalInfo || '',
      quantity: parseInt(quantity) || 1,
      location,
      availableFrom: availableFrom || new Date(),
      availableUntil: calculatedAvailableUntil || undefined
    });

    const offer = await newOffer.save();
    console.log('Offer created successfully:', offer._id);

    // Emit socket event for real-time updates
    req.app.get('io').emit('newOffer', {
      offerId: offer._id,
      resourceType: offerType,
      quantity: parseInt(quantity) || 1,
      location: location.coordinates
    });

    res.json({ success: true, data: offer });
  } catch (err) {
    console.error('Error creating offer:', err);
    console.error('Request body was:', req.body);
    
    // Check if it's a validation error
    if (err.name === 'ValidationError') {
      const errors = {};
      Object.keys(err.errors).forEach(key => {
        errors[key] = err.errors[key].message;
      });
      return res.status(400).json({ 
        msg: 'Validation failed', 
        errors 
      });
    }
    
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   GET api/offers
// @desc    Get all offers by current NGO
// @access  Private (NGOs only)
router.get('/', auth, isNGO, async (req, res) => {
  try {
    const offers = await ResourceOffer.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(offers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/offers/map
// @desc    Get all offers for map display
// @access  Private
router.get('/map', auth, async (req, res) => {
  try {
    const offers = await ResourceOffer.find({ status: { $in: ['pending', 'matched'] } })
      .populate('userId', 'name role')
      .select('title resourceType quantity description location createdAt status validUntil')
      .sort({ createdAt: -1 });

    res.json(offers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/offers/:id
// @desc    Get offer by ID
// @access  Private (NGOs only)
router.get('/:id', auth, isNGO, async (req, res) => {
  try {
    const offer = await ResourceOffer.findById(req.params.id);
    
    if (!offer) {
      return res.status(404).json({ msg: 'Offer not found' });
    }

    // Check if the offer belongs to the current user
    if (offer.userId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    res.json(offer);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Offer not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/offers/:id
// @desc    Update an offer
// @access  Private (NGOs only)
router.put('/:id', auth, isNGO, async (req, res) => {
  try {
    const { resourceType, title, description, quantity, availableFrom, availableUntil, location, status } = req.body;

    // Find the offer
    let offer = await ResourceOffer.findById(req.params.id);
    
    if (!offer) {
      return res.status(404).json({ msg: 'Offer not found' });
    }

    // Check if the offer belongs to the current user
    if (offer.userId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Check if offer can be updated (not fulfilled or expired)
    if (offer.status === 'fulfilled' || offer.status === 'expired') {
      return res.status(400).json({ msg: `Offer cannot be updated because it is ${offer.status}` });
    }

    // Update fields
    if (resourceType) offer.resourceType = resourceType;
    if (title) offer.title = title;
    if (description) offer.description = description;
    if (quantity) offer.quantity = quantity;
    if (availableFrom) offer.availableFrom = availableFrom;
    if (availableUntil) offer.availableUntil = availableUntil;
    if (location) offer.location = location;
    if (status) offer.status = status;

    await offer.save();

    // Emit socket event for real-time updates
    req.app.get('io').emit('offerUpdated', {
      offerId: offer._id,
      resourceType: offer.resourceType,
      quantity: offer.quantity,
      status: offer.status
    });

    res.json(offer);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Offer not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/offers/:id
// @desc    Delete an offer
// @access  Private (NGOs only)
router.delete('/:id', auth, isNGO, async (req, res) => {
  try {
    const offer = await ResourceOffer.findById(req.params.id);
    
    if (!offer) {
      return res.status(404).json({ msg: 'Offer not found' });
    }

    // Check if the offer belongs to the current user
    if (offer.userId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Check if offer can be deleted (not fulfilled)
    if (offer.status === 'fulfilled') {
      return res.status(400).json({ msg: 'Fulfilled offers cannot be deleted' });
    }

    await offer.remove();

    // Emit socket event for real-time updates
    req.app.get('io').emit('offerDeleted', {
      offerId: req.params.id
    });

    res.json({ msg: 'Offer removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Offer not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/offers/:id/expire
// @desc    Mark an offer as expired
// @access  Private (NGOs only)
router.put('/:id/expire', auth, isNGO, async (req, res) => {
  try {
    const offer = await ResourceOffer.findById(req.params.id);
    
    if (!offer) {
      return res.status(404).json({ msg: 'Offer not found' });
    }

    // Check if the offer belongs to the current user
    if (offer.userId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Check if offer can be expired (not fulfilled or already expired)
    if (offer.status === 'fulfilled') {
      return res.status(400).json({ msg: 'Fulfilled offers cannot be expired' });
    }

    if (offer.status === 'expired') {
      return res.status(400).json({ msg: 'Offer is already expired' });
    }

    offer.status = 'expired';
    await offer.save();

    // Notify matched victims if any
    if (offer.matchedWith && offer.matchedWith.length > 0) {
      for (const match of offer.matchedWith) {
        // Create notification for each matched victim
        // This would be implemented in the notification system
      }
    }

    // Emit socket event for real-time updates
    req.app.get('io').emit('offerExpired', {
      offerId: offer._id
    });

    res.json(offer);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Offer not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/offers/:id/fulfill
// @desc    Mark an offer as fulfilled (help given)
// @access  Private (NGOs only)
router.put('/:id/fulfill', auth, isNGO, async (req, res) => {
  try {
    const offer = await ResourceOffer.findById(req.params.id);
    
    if (!offer) {
      return res.status(404).json({ msg: 'Offer not found' });
    }

    // Check if user owns this offer
    if (offer.offeredBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Check if offer can be fulfilled (must be matched)
    if (offer.status !== 'matched') {
      return res.status(400).json({ msg: 'Only matched offers can be fulfilled' });
    }

    if (offer.matchedWith.length === 0) {
      return res.status(400).json({ msg: 'No matched requests to fulfill' });
    }

    // Mark offer as fulfilled
    offer.status = 'fulfilled';
    offer.fulfilledAt = new Date();
    await offer.save();

    // Mark all matched requests as fulfilled
    const { ResourceRequest } = require('../models/ResourceModels');
    for (const match of offer.matchedWith) {
      if (match.status === 'accepted') {
        const request = await ResourceRequest.findById(match.requestId);
        if (request) {
          request.status = 'fulfilled';
          request.fulfilledAt = new Date();
          
          // Update the specific match in the request's matchedWith array
          const requestMatch = request.matchedWith.find(m => 
            m.offerId.toString() === offer._id.toString() && m.status === 'accepted'
          );
          if (requestMatch) {
            requestMatch.status = 'fulfilled';
            requestMatch.fulfilledAt = new Date();
          }
          
          await request.save();

          // Create notification for the victim
          const notification = new Notification({
            recipient: request.requestedBy,
            type: 'help_received',
            title: 'Help Received!',
            message: `You have received help for your ${request.resourceType} request from ${offer.offeredBy}`,
            data: {
              requestId: request._id,
              offerId: offer._id,
              helpType: request.resourceType
            }
          });
          await notification.save();

          // Emit socket event for real-time updates
          req.app.get('io').to(`user_${request.requestedBy}`).emit('helpReceived', {
            requestId: request._id,
            offerId: offer._id,
            helpType: request.resourceType,
            notification
          });
        }
      }
    }

    // Emit socket event for NGO dashboard update
    req.app.get('io').to(`ngo_${req.user.id}`).emit('offerFulfilled', {
      offerId: offer._id,
      offer: offer
    });

    res.json({
      msg: 'Help successfully provided! Recipients have been notified.',
      offer: offer,
      fulfilledRequests: offer.matchedWith.filter(m => m.status === 'accepted').length
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Offer not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;