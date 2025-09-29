const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/MessageModel');
const User = require('../models/User');

// @route   GET api/messages
// @desc    Get messages for current user (sent or received)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id },
        { recipient: req.user.id }
      ]
    })
    .populate('sender', 'name email role')
    .populate('recipient', 'name email role')
    .sort({ createdAt: -1 });

    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET api/messages/sent
// @desc    Get messages sent by current user
// @access  Private
router.get('/sent', auth, async (req, res) => {
  try {
    const messages = await Message.find({ sender: req.user.id })
      .populate('recipient', 'name email role')
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET api/messages/received
// @desc    Get messages received by current user
// @access  Private
router.get('/received', auth, async (req, res) => {
  try {
    const messages = await Message.find({ recipient: req.user.id })
      .populate('sender', 'name email role')
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/messages
// @desc    Send a message
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { recipientId, content, relatedResource } = req.body;

    // Validate recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ msg: 'Recipient not found' });
    }

    const message = new Message({
      sender: req.user.id,
      recipient: recipientId,
      content,
      relatedResource: relatedResource || {}
    });

    await message.save();

    // Populate the message before sending response
    await message.populate('sender', 'name email role');
    await message.populate('recipient', 'name email role');

    res.json(message);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT api/messages/:id/read
// @desc    Mark message as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ msg: 'Message not found' });
    }

    // Only recipient can mark message as read
    if (message.recipient.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await message.markAsRead();
    res.json(message);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   DELETE api/messages/:id
// @desc    Delete a message
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ msg: 'Message not found' });
    }

    // Only sender can delete message
    if (message.sender.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await Message.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Message deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
