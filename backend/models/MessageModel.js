const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  relatedResource: {
    resourceType: {
      type: String,
      enum: ['request', 'offer']
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId
      // We'll handle population manually in the routes
    }
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
messageSchema.index({ sender: 1, recipient: 1 });
messageSchema.index({ createdAt: -1 });

// Method to mark message as read
messageSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = Date.now();
  return this.save();
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;