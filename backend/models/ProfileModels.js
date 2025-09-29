const mongoose = require('mongoose');

// Victim profile schema
const victimProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  familySize: {
    type: Number,
    default: 1
  },
  specialNeeds: {
    type: Boolean,
    default: false
  },
  specialNeedsDetails: {
    type: String,
    default: ''
  },
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  }
});

// NGO profile schema
const ngoProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organizationName: {
    type: String,
    required: true
  },
  registrationNumber: {
    type: String,
    required: true
  },
  organizationType: {
    type: String,
    enum: ['international', 'national', 'local', 'other'],
    default: 'local'
  },
  website: String,
  resourceTypes: [{
    type: String,
    enum: ['food', 'shelter', 'medical', 'transport', 'other']
  }],
  verificationDocuments: [{
    documentType: String,
    documentUrl: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
});

// Volunteer profile schema
const volunteerProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skills: [String],
  availability: {
    type: String,
    enum: ['full-time', 'part-time', 'weekends', 'on-call'],
    default: 'part-time'
  },
  hasVehicle: {
    type: Boolean,
    default: false
  },
  vehicleType: String,
  identificationNumber: String,
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  }
});

// Government profile schema
const governmentProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: String,
    required: true
  },
  designation: {
    type: String,
    required: true
  },
  employeeId: {
    type: String,
    required: true
  },
  jurisdiction: {
    type: String,
    required: true
  },
  accessLevel: {
    type: String,
    enum: ['admin', 'coordinator', 'field-officer', 'viewer'],
    default: 'viewer'
  }
});

const VictimProfile = mongoose.model('VictimProfile', victimProfileSchema);
const NGOProfile = mongoose.model('NGOProfile', ngoProfileSchema);
const VolunteerProfile = mongoose.model('VolunteerProfile', volunteerProfileSchema);
const GovernmentProfile = mongoose.model('GovernmentProfile', governmentProfileSchema);

module.exports = {
  VictimProfile,
  NGOProfile,
  VolunteerProfile,
  GovernmentProfile
};