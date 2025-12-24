const express = require('express');
const router = express.Router();
const { 
  submitRegistration, 
  getRegistrations, 
  sendPolishedEmail 
} = require('../controllers/duolingoController');
const { protect, admin } = require('../middlewares/authMiddleware');

// User routes
router.post('/register', protect, submitRegistration);

// Admin routes
router.get('/registrations', protect, admin, getRegistrations);
router.put('/status/:id', protect, admin, require('../controllers/duolingoController').updateStatus);
router.post('/send-email', protect, admin, sendPolishedEmail);

module.exports = router;
