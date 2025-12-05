const ChatMessage = require('../models/chatMessage');
const User = require('../models/userModel');

// Get all chat messages for admin
const getAllMessages = async (req, res) => {
  try {
    const messages = await ChatMessage.find()
      .populate('userId', 'name email profileImageUrl')
      .sort({ sent_at: 1 });
    
    // Transform messages to include userId as string
    const transformedMessages = messages.map(msg => ({
      ...msg.toObject(),
      userId: msg.userId._id.toString(), // Convert ObjectId to string
      user: {
        name: msg.userId.name,
        email: msg.userId.email,
        profileImageUrl: msg.userId.profileImageUrl
      }
    }));
    
    res.status(200).json({
      success: true,
      messages: transformedMessages
    });
  } catch (error) {
    console.error('Get all messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
};

// Get messages for a specific user
const getUserMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const messages = await ChatMessage.find({ userId })
      .sort({ sent_at: 1 });
    
    res.status(200).json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Get user messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
};

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;
    
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });
    }

    const chatMessage = await ChatMessage.create({
      from: 'user',
      message: message.trim(),
      userId
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: chatMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};

// Admin sends a message
const adminSendMessage = async (req, res) => {
  try {
    const { message, userId } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const chatMessage = await ChatMessage.create({
      from: 'admin',
      message: message.trim(),
      userId
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: chatMessage
    });
  } catch (error) {
    console.error('Admin send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};

// Mark messages as read
const markAsRead = async (req, res) => {
  try {
    const { messageIds } = req.body;
    
    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({
        success: false,
        message: 'Message IDs are required'
      });
    }

    await ChatMessage.updateMany(
      { _id: { $in: messageIds }, from: 'user', read_at: null },
      { read_at: new Date() }
    );

    res.status(200).json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read'
    });
  }
};

// Get unread message count for admin
const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await ChatMessage.countDocuments({
      from: 'user',
      read_at: null
    });

    res.status(200).json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }
};

module.exports = {
  getAllMessages,
  getUserMessages,
  sendMessage,
  adminSendMessage,
  markAsRead,
  getUnreadCount
};
