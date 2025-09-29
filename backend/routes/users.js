const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { VictimProfile, NGOProfile, VolunteerProfile, GovernmentProfile } = require('../models/ProfileModels');
const auth = require('../middleware/auth');

// @route   GET api/users/profile
// @desc    Get current user's profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Get profile based on role
    let profile;
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
      default:
        return res.status(400).json({ msg: 'Invalid role' });
    }

    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }

    res.json({ user, profile });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Update user fields
    const { name, phone, location } = req.body;
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (location) user.location = location;

    await user.save();

    // Update profile based on role
    const { profileData } = req.body;
    if (profileData) {
      let profile;
      switch (user.role) {
        case 'victim':
          profile = await VictimProfile.findOneAndUpdate(
            { userId: user._id },
            { $set: profileData },
            { new: true }
          );
          break;
        case 'ngo':
          profile = await NGOProfile.findOneAndUpdate(
            { userId: user._id },
            { $set: profileData },
            { new: true }
          );
          break;
        case 'volunteer':
          profile = await VolunteerProfile.findOneAndUpdate(
            { userId: user._id },
            { $set: profileData },
            { new: true }
          );
          break;
        case 'government':
          profile = await GovernmentProfile.findOneAndUpdate(
            { userId: user._id },
            { $set: profileData },
            { new: true }
          );
          break;
        default:
          return res.status(400).json({ msg: 'Invalid role' });
      }

      res.json({ user, profile });
    } else {
      res.json({ user });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/users/verify/:id
// @desc    Verify a user (for government/admin use)
// @access  Private (government only)
router.put('/verify/:id', auth, async (req, res) => {
  try {
    // Check if the requester is a government user
    const requester = await User.findById(req.user.id);
    if (requester.role !== 'government') {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    // Find and verify the user
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.isVerified = true;
    await user.save();

    res.json({ msg: 'User verified successfully', user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;