const express = require('express');
const { supabase } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const router = express.Router();

/**
 * Authentication routes using Supabase Auth
 * Handles user registration, login, and session management
 */

// Apply auth-specific rate limiting
router.use(authLimiter);

// Sign up new user
router.post('/signup', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email and password are required' }
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: { message: 'Password must be at least 6 characters long' }
      });
    }

    // Create user with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: process.env.FRONTEND_URL
      }
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: { message: error.message }
      });
    }

    // Return success response
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          id: data.user?.id,
          email: data.user?.email,
          created_at: data.user?.created_at
        },
        session: data.session ? {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at
        } : null
      }
    });

  } catch (error) {
    next(error);
  }
});

// Sign in existing user
router.post('/signin', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email and password are required' }
      });
    }

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({
        success: false,
        error: { message: error.message }
      });
    }

    // Return success response
    res.json({
      success: true,
      message: 'Signed in successfully',
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          created_at: data.user.created_at
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// Sign out user
router.post('/signout', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Sign out with Supabase
      const { error } = await supabase.auth.signOut(token);
      
      if (error) {
        console.warn('Signout error:', error.message);
      }
    }

    res.json({
      success: true,
      message: 'Signed out successfully'
    });

  } catch (error) {
    next(error);
  }
});

// Get current user info
router.get('/user', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { message: 'Missing authorization header' }
      });
    }

    const token = authHeader.substring(7);
    
    // Get user from Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid or expired token' }
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
