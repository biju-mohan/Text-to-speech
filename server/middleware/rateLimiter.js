const rateLimit = require('express-rate-limit');

/**
 * Rate limiting middleware for API endpoints
 * Prevents abuse and ensures fair usage
 */

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for TTS generation
const ttsLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_HOURS || '1') * 60 * 60 * 1000, // Default 1 hour
  max: parseInt(process.env.RATE_LIMIT_REQUESTS || '50'), // Default 50 requests per hour
  message: {
    success: false,
    error: {
      message: 'TTS generation rate limit exceeded. Please try again later.',
      retryAfter: 'Check the Retry-After header for when you can try again.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
  // Removed custom keyGenerator to use default IP-based limiting
});

// Authentication rate limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  ttsLimiter,
  authLimiter
};
