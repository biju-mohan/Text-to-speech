const express = require('express');
const router = express.Router();

/**
 * Health check routes for monitoring and debugging
 */

// Basic health check
router.get('/', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: require('../../package.json').version
  });
});

// Detailed health check with service status
router.get('/detailed', async (req, res) => {
  const health = {
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {}
  };

  try {
    // Check OpenAI API key
    health.services.openai = {
      status: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
      configured: !!process.env.OPENAI_API_KEY
    };

    // Check Supabase configuration
    health.services.supabase = {
      status: (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) ? 'configured' : 'missing',
      configured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
    };

    // Check file system (temp directory)
    const fs = require('fs');
    const path = require('path');
    const tempDir = path.join(__dirname, '../../temp');
    
    try {
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      health.services.filesystem = {
        status: 'ok',
        tempDirectory: tempDir
      };
    } catch (fsError) {
      health.services.filesystem = {
        status: 'error',
        error: fsError.message
      };
    }

    res.json(health);
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
