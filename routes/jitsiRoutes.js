const express = require('express');
const router = express.Router();
const jitsiController = require('../controllers/jitsiController');

// Public route to get Jitsi configuration
router.get('/config', jitsiController.getConfig);

module.exports = router;
