const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      'request_created',
      'request_matched',
      'request_fulfilled',
      'offer_created',
      'offer_matched',
      'offer_accepted',
      'offer_rejected',
      'system_alert',
      'message',
      'emergency_dispatch',
      'emergency_contact'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedResource: {
    resourceType: {
      type: String,
      enum: ['request', 'offer']
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedResource.resourceType'
    }
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for faster queries
notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

// Method to mark notification as read
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = Date.now();
  return this.save();
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;