const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Base user schema with common fields
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['victim', 'ngo', 'volunteer', 'government'],
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    },
    address: {
      type: String,
      default: ''
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  // Admin management fields
  isRejected: {
    type: Boolean,
    default: false
  },
  rejectionReason: {
    type: String
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  approvedAt: {
    type: Date
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  rejectedAt: {
    type: Date
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  suspendedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  suspendedAt: {
    type: Date
  },
  suspendedUntil: {
    type: Date
  },
  suspensionReason: {
    type: String
  },
  unsuspendedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  unsuspendedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  deletedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Fields specific to each role
  profileData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

// Create index for geospatial queries
userSchema.index({ location: '2dsphere' });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;