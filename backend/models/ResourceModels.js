const mongoose = require('mongoose');

// Resource Request Schema - For victims to request resources
const resourceRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestType: {
    type: String,
    enum: ['food', 'shelter', 'medical', 'transport', 'other'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    default: 1
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'matched', 'fulfilled', 'cancelled'],
    default: 'pending'
  },
  requiredBy: {
    type: Date,
    default: () => new Date(+new Date() + 24*60*60*1000) // Default to 24 hours from now
  },
  matchedWith: [{
    resourceOfferId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ResourceOffer'
    },
    matchedAt: {
      type: Date,
      default: Date.now
    },
    matchedBy: {
      type: String,
      enum: ['system', 'manual'],
      default: 'system'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'fulfilled'],
      default: 'pending'
    }
  }],
  governmentNote: {
    type: String,
    default: ''
  },
  lastContactedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Resource Offer Schema - For NGOs to offer resources
const resourceOfferSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resourceType: {
    type: String,
    enum: ['food', 'shelter', 'medical', 'transport', 'other'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  availableFrom: {
    type: Date,
    default: Date.now
  },
  availableUntil: {
    type: Date,
    default: () => new Date(+new Date() + 7*24*60*60*1000) // Default to 7 days from now
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['available', 'partially_matched', 'fully_matched', 'fulfilled', 'expired'],
    default: 'available'
  },
  matchedWith: [{
    resourceRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ResourceRequest'
    },
    matchedAt: {
      type: Date,
      default: Date.now
    },
    matchedBy: {
      type: String,
      enum: ['system', 'manual'],
      default: 'system'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'fulfilled'],
      default: 'pending'
    },
    quantityAllocated: {
      type: Number,
      default: 1
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for geospatial queries
resourceRequestSchema.index({ location: '2dsphere' });
resourceOfferSchema.index({ location: '2dsphere' });

// Update the updatedAt field on save
resourceRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

resourceOfferSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create models
const ResourceRequest = mongoose.model('ResourceRequest', resourceRequestSchema);
const ResourceOffer = mongoose.model('ResourceOffer', resourceOfferSchema);

module.exports = { ResourceRequest, ResourceOffer };