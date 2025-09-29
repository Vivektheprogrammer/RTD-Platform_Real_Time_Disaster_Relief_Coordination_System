const express = require('express');
const router = express.Router();
const { ResourceRequest, ResourceOffer } = require('../models/ResourceModels');
const User = require('../models/User');
const Notification = require('../models/NotificationModel');
const auth = require('../middleware/auth');

// @route   GET api/matching/requests/:requestId/matches
// @desc    Find potential matches for a specific request
// @access  Private (victims only)
router.get('/requests/:requestId/matches', auth, async (req, res) => {
  try {
    // Verify the request exists and belongs to the user
    const request = await ResourceRequest.findById(req.params.requestId);
    if (!request) {
      return res.status(404).json({ msg: 'Request not found' });
    }

    if (request.userId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Find potential matches based on resource type and location
    const potentialMatches = await ResourceOffer.find({
      resourceType: request.requestType,
      status: { $in: ['available', 'partially_matched'] },
      quantity: { $gt: 0 },
      availableUntil: { $gt: new Date() },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: request.location.coordinates
          },
          $maxDistance: 50000 // 50km radius
        }
      }
    }).populate('userId', 'name');

    res.json(potentialMatches);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/matching/offers/:offerId/matches
// @desc    Find potential matches for a specific offer
// @access  Private (NGOs only)
router.get('/offers/:offerId/matches', auth, async (req, res) => {
  try {
    // Verify the offer exists and belongs to the user
    const offer = await ResourceOffer.findById(req.params.offerId);
    if (!offer) {
      return res.status(404).json({ msg: 'Offer not found' });
    }

    if (offer.userId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Find potential matches based on resource type and location
    const potentialMatches = await ResourceRequest.find({
      requestType: offer.resourceType,
      status: { $in: ['pending', 'matched'] },
      requiredBy: { $gt: new Date() },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: offer.location.coordinates
          },
          $maxDistance: 50000 // 50km radius
        }
      }
    }).populate('userId', 'name');

    res.json(potentialMatches);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/matching/requests/:requestId/match/:offerId
// @desc    Match a request with an offer
// @access  Private (victims only)
router.post('/requests/:requestId/match/:offerId', auth, async (req, res) => {
  try {
    // Verify the request exists and belongs to the user
    const request = await ResourceRequest.findById(req.params.requestId);
    if (!request) {
      return res.status(404).json({ msg: 'Request not found' });
    }

    if (request.userId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Verify the offer exists and is available
    const offer = await ResourceOffer.findById(req.params.offerId);
    if (!offer) {
      return res.status(404).json({ msg: 'Offer not found' });
    }

    if (offer.status === 'expired' || offer.status === 'fulfilled') {
      return res.status(400).json({ msg: `Offer is ${offer.status} and cannot be matched` });
    }

    // Check if the request and offer are already matched
    const alreadyMatched = request.matchedWith.some(
      match => match.resourceOfferId.toString() === req.params.offerId
    );

    if (alreadyMatched) {
      return res.status(400).json({ msg: 'Request is already matched with this offer' });
    }

    // Add the match to the request
    request.matchedWith.push({
      resourceOfferId: offer._id,
      matchedBy: 'manual',
      status: 'pending'
    });

    // Update request status if it was pending
    if (request.status === 'pending') {
      request.status = 'matched';
    }

    await request.save();

    // Add the match to the offer
    offer.matchedWith.push({
      resourceRequestId: request._id,
      matchedBy: 'manual',
      status: 'pending',
      quantityAllocated: Math.min(request.quantity, offer.quantity)
    });

    // Update offer status if it was available
    if (offer.status === 'available') {
      offer.status = 'partially_matched';
    }

    await offer.save();

    // Create notification for the NGO
    const ngoUser = await User.findById(offer.userId);
    const newNotification = new Notification({
      recipient: ngoUser._id,
      sender: req.user.id,
      type: 'request_matched',
      title: 'New Request Match',
      message: `Your offer "${offer.title}" has been matched with a request for ${request.requestType}`,
      relatedResource: {
        resourceType: 'offer',
        resourceId: offer._id
      },
      priority: request.urgency === 'critical' ? 'urgent' : 'high'
    });

    await newNotification.save();

    // Emit socket events for real-time updates
    req.app.get('io').emit('requestMatched', {
      requestId: request._id,
      offerId: offer._id
    });

    req.app.get('io').to(ngoUser._id.toString()).emit('notification', {
      notification: newNotification
    });

    res.json({ request, offer });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/matching/offers/:offerId/match/:requestId
// @desc    Match an offer with a request
// @access  Private (NGOs only)
router.post('/offers/:offerId/match/:requestId', auth, async (req, res) => {
  try {
    // Verify the offer exists and belongs to the user
    const offer = await ResourceOffer.findById(req.params.offerId);
    if (!offer) {
      return res.status(404).json({ msg: 'Offer not found' });
    }

    if (offer.userId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Verify the request exists and is pending or matched
    const request = await ResourceRequest.findById(req.params.requestId);
    if (!request) {
      return res.status(404).json({ msg: 'Request not found' });
    }

    if (request.status === 'fulfilled' || request.status === 'cancelled') {
      return res.status(400).json({ msg: `Request is ${request.status} and cannot be matched` });
    }

    // Check if the offer and request are already matched
    const alreadyMatched = offer.matchedWith.some(
      match => match.resourceRequestId.toString() === req.params.requestId
    );

    if (alreadyMatched) {
      return res.status(400).json({ msg: 'Offer is already matched with this request' });
    }

    // Add the match to the offer
    const quantityAllocated = Math.min(request.quantity, offer.quantity);
    offer.matchedWith.push({
      resourceRequestId: request._id,
      matchedBy: 'manual',
      status: 'pending',
      quantityAllocated
    });

    // Update offer status
    if (offer.status === 'available') {
      offer.status = 'partially_matched';
    }

    await offer.save();

    // Add the match to the request
    request.matchedWith.push({
      resourceOfferId: offer._id,
      matchedBy: 'manual',
      status: 'pending'
    });

    // Update request status if it was pending
    if (request.status === 'pending') {
      request.status = 'matched';
    }

    await request.save();

    // Create notification for the victim
    const victimUser = await User.findById(request.userId);
    const newNotification = new Notification({
      recipient: victimUser._id,
      sender: req.user.id,
      type: 'offer_matched',
      title: 'New Offer Match',
      message: `Your request "${request.title}" has been matched with an offer for ${offer.resourceType}`,
      relatedResource: {
        resourceType: 'request',
        resourceId: request._id
      },
      priority: 'high'
    });

    await newNotification.save();

    // Emit socket events for real-time updates
    req.app.get('io').emit('offerMatched', {
      offerId: offer._id,
      requestId: request._id
    });

    req.app.get('io').to(victimUser._id.toString()).emit('notification', {
      notification: newNotification
    });

    res.json({ offer, request });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/matching/requests/:requestId/accept/:offerId
// @desc    Accept an offer for a request
// @access  Private (victims only)
router.put('/requests/:requestId/accept/:offerId', auth, async (req, res) => {
  try {
    // Verify the request exists and belongs to the user
    const request = await ResourceRequest.findById(req.params.requestId);
    if (!request) {
      return res.status(404).json({ msg: 'Request not found' });
    }

    if (request.userId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Find the match in the request
    const matchIndex = request.matchedWith.findIndex(
      match => match.resourceOfferId.toString() === req.params.offerId
    );

    if (matchIndex === -1) {
      return res.status(404).json({ msg: 'Match not found' });
    }

    // Update the match status
    request.matchedWith[matchIndex].status = 'accepted';
    await request.save();

    // Update the corresponding match in the offer
    const offer = await ResourceOffer.findById(req.params.offerId);
    if (!offer) {
      return res.status(404).json({ msg: 'Offer not found' });
    }

    const offerMatchIndex = offer.matchedWith.findIndex(
      match => match.resourceRequestId.toString() === req.params.requestId
    );

    if (offerMatchIndex !== -1) {
      offer.matchedWith[offerMatchIndex].status = 'accepted';
      await offer.save();
    }

    // Create notification for the NGO
    const ngoUser = await User.findById(offer.userId);
    const newNotification = new Notification({
      recipient: ngoUser._id,
      sender: req.user.id,
      type: 'offer_accepted',
      title: 'Offer Accepted',
      message: `Your offer "${offer.title}" has been accepted for a request for ${request.requestType}`,
      relatedResource: {
        resourceType: 'offer',
        resourceId: offer._id
      },
      priority: 'high'
    });

    await newNotification.save();

    // Emit socket events for real-time updates
    req.app.get('io').emit('matchAccepted', {
      requestId: request._id,
      offerId: offer._id
    });

    req.app.get('io').to(ngoUser._id.toString()).emit('notification', {
      notification: newNotification
    });

    res.json({ request, offer });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/matching/requests/:requestId/reject/:offerId
// @desc    Reject an offer for a request
// @access  Private (victims only)
router.put('/requests/:requestId/reject/:offerId', auth, async (req, res) => {
  try {
    // Implementation similar to accept but with 'rejected' status
    // ...
    res.json({ msg: 'Match rejected' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/matching/requests/:requestId/fulfill/:offerId
// @desc    Mark a request as fulfilled by an offer
// @access  Private (victims only)
router.put('/requests/:requestId/fulfill/:offerId', auth, async (req, res) => {
  try {
    // Implementation for marking a request as fulfilled
    // ...
    res.json({ msg: 'Request fulfilled' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;