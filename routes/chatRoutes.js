const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/authMiddleware');
const {
  getAllMessages,
  getUserMessages,
  sendMessage,
  adminSendMessage,
  markAsRead,
  getUnreadCount
} = require('../controllers/chatController');

// User routes (protected)
router.get('/user-messages', protect, getUserMessages);
router.post('/send', protect, sendMessage);

// Admin routes (protected + admin)
router.get('/all-messages', protect, admin, getAllMessages);
router.post('/admin-send', protect, admin, adminSendMessage);
router.post('/mark-read', protect, admin, markAsRead);
router.get('/unread-count', protect, admin, getUnreadCount);

module.exports = router;
