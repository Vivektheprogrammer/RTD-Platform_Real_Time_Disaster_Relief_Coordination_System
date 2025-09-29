const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { VictimProfile, NGOProfile, VolunteerProfile, GovernmentProfile } = require('../models/ProfileModels');

// Middleware to validate token
const auth = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role, location, profileData } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      // If a previous attempt created the user but failed to create profile, attach profile now for government role
      if (role === 'government') {
        const existingGovProfile = await GovernmentProfile.findOne({ userId: user._id });
        if (!existingGovProfile) {
          const {
            agencyName,
            agencyType,
            jurisdictionLevel,
            identificationNumber
          } = (req.body.profileData || {});

          const profile = new GovernmentProfile({
            userId: user._id,
            department: agencyName,
            designation: agencyType,
            employeeId: identificationNumber,
            jurisdiction: jurisdictionLevel
          });
          await profile.save();

          const payload = { user: { id: user.id, role: user.role } };
          return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
            if (err) throw err;
            return res.json({ token });
          });
        }
      }
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
      phone,
      role,
      location: location || {
        type: 'Point',
        coordinates: [0, 0],
        address: ''
      },
      isVerified: role === 'victim' // Auto-verify victims, others need verification
    });

    await user.save();

    // Create profile based on role
    let profile;
    switch (role) {
      case 'victim':
        profile = new VictimProfile({
          userId: user._id,
          ...profileData
        });
        break;
      case 'ngo':
        profile = new NGOProfile({
          userId: user._id,
          ...profileData
        });
        break;
      case 'volunteer':
        profile = new VolunteerProfile({
          userId: user._id,
          ...profileData
        });
        break;
      case 'government': {
        const {
          agencyName,
          agencyType,
          jurisdictionLevel,
          identificationNumber
        } = profileData || {};

        profile = new GovernmentProfile({
          userId: user._id,
          department: agencyName,
          designation: agencyType,
          employeeId: identificationNumber,
          jurisdiction: jurisdictionLevel,
          // accessLevel defaults to 'viewer'
        });
        break;
      }
      default:
        return res.status(400).json({ msg: 'Invalid role' });
    }

    await profile.save();

    // Create and return JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check if user is verified (except victims who are auto-verified)
    if (!user.isVerified && user.role !== 'victim') {
      return res.status(401).json({ msg: 'Account pending verification' });
    }

    // Create and return JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/auth/user
// @desc    Get user data
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;