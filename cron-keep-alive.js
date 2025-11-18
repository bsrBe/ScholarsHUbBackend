const cron = require('node-cron');
const axios = require('axios');

/**
 * Keep-alive cron job to prevent Render 15-minute downtime
 * Runs every 14 minutes and 30 seconds to ping the server
 */

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'https://your-backend-url.onrender.com';
const HEALTH_ENDPOINT = process.env.HEALTH_ENDPOINT || '/api/health';
const KEEP_ALIVE_TARGETS = (process.env.KEEP_ALIVE_TARGETS || `${BACKEND_URL}${HEALTH_ENDPOINT}`).split(',').map(url => url.trim()).filter(Boolean);
const PING_INTERVAL = '*/14 * * * *'; // Every 14 minutes

// Create a simple health check endpoint if it doesn't exist
const setupHealthEndpoint = (app) => {
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      message: 'Server is running'
    });
  });
};

// Keep-alive function
const keepServerAlive = async () => {
  for (const target of KEEP_ALIVE_TARGETS) {
    try {
      console.log(`🔄 Pinging ${target} at ${new Date().toISOString()}`);
      
      const response = await axios.get(target, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Keep-Alive-Cron/1.0'
        }
      });
      
      console.log(`✅ Ping successful (${response.status}) for ${target}`);
      return;
    } catch (error) {
      console.error(`❌ Ping failed for ${target}:`, error.message);
    }
  }
  
  console.error('❌ All keep-alive targets failed. Please verify BACKEND_URL/KEEP_ALIVE_TARGETS.');
};

// Schedule the cron job
const scheduleKeepAlive = () => {
  console.log('🚀 Starting keep-alive cron job (every 14 minutes)');
  
  // Run immediately on start
  keepServerAlive();
  
  // Schedule regular pings
  cron.schedule(PING_INTERVAL, keepServerAlive);
  
  // Additional ping at 30 seconds past the minute for extra safety
  cron.schedule('30 */14 * * *', keepServerAlive);
};

module.exports = {
  setupHealthEndpoint,
  keepServerAlive,
  scheduleKeepAlive
};
