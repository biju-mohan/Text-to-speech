const express = require('express');
const path = require('path');
const fs = require('fs');
const { authenticateUser } = require('../middleware/auth');
const { ttsLimiter } = require('../middleware/rateLimiter');
const OpenAIService = require('../services/openaiService');
const DatabaseService = require('../services/databaseService');

const router = express.Router();

// Initialize services
const openaiService = new OpenAIService();
const dbService = new DatabaseService();

/**
 * TTS Generation and Management Routes
 */

// Generate audio from text (main MVP endpoint)
router.post('/generate-audio', authenticateUser, ttsLimiter, async (req, res, next) => {
  try {
    const { text, voice = 'nova', speed = 1.0 } = req.body;
    const userId = req.user.id;

    // Validate text input
    const validation = openaiService.validateText(text);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: { 
          message: 'Invalid text input',
          details: validation.errors
        }
      });
    }

    console.log(`TTS request from user ${userId}: ${text.length} characters`);

    // Generate unique filename
    const filename = openaiService.generateFilename(text, userId);
    
    try {
      // Generate speech using OpenAI
      const audioBuffer = await openaiService.generateSpeech(text, voice, speed);
      
      // Save audio file
      const filePath = await openaiService.saveAudioFile(audioBuffer, filename);
      const fileSize = audioBuffer.length;
      const estimatedDuration = openaiService.estimateDuration(text, speed);
      
      // Create public URL for the file
      const audioUrl = `/api/tts/download/${filename}.mp3`;
      
      // Save generation record to database
      const generationRecord = await dbService.saveGeneration({
        userId,
        textContent: text,
        voiceType: voice,
        speed,
        fileUrl: audioUrl,
        filename: `${filename}.mp3`,
        fileSize,
        durationSeconds: estimatedDuration
      });

      console.log(`TTS generation complete: ${filename}.mp3`);

      // Return success response
      res.json({
        success: true,
        message: 'Audio generated successfully',
        data: {
          audioUrl,
          filename: `${filename}.mp3`,
          generationId: generationRecord.id,
          duration: estimatedDuration,
          fileSize,
          characterCount: text.length,
          voice,
          speed
        }
      });

    } catch (ttsError) {
      console.error('TTS generation error:', ttsError);
      
      // Return appropriate error based on the issue
      if (ttsError.message.includes('rate limit')) {
        return res.status(429).json({
          success: false,
          error: { message: 'OpenAI rate limit exceeded. Please try again later.' }
        });
      } else if (ttsError.message.includes('API key')) {
        return res.status(503).json({
          success: false,
          error: { message: 'TTS service temporarily unavailable' }
        });
      } else {
        return res.status(500).json({
          success: false,
          error: { message: 'Failed to generate audio. Please try again.' }
        });
      }
    }

  } catch (error) {
    next(error);
  }
});

// Download generated audio file
router.get('/download/:filename', (req, res, next) => {
  try {
    const { filename } = req.params;
    
    // Security: validate filename to prevent directory traversal
    if (!filename || filename.includes('..') || !filename.endsWith('.mp3')) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid filename' }
      });
    }

    const filePath = path.join(__dirname, '../../temp', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: { message: 'Audio file not found' }
      });
    }

    // Set appropriate headers for audio download
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: { message: 'Error streaming audio file' }
        });
      }
    });

  } catch (error) {
    next(error);
  }
});

// Get user's generation history
router.get('/generations', authenticateUser, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 10, offset = 0 } = req.query;

    const generations = await dbService.getUserGenerations(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        generations,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: generations.length
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// Get specific generation details
router.get('/generations/:id', authenticateUser, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const generation = await dbService.getGeneration(id, userId);

    if (!generation) {
      return res.status(404).json({
        success: false,
        error: { message: 'Generation not found' }
      });
    }

    res.json({
      success: true,
      data: { generation }
    });

  } catch (error) {
    next(error);
  }
});

// Delete generation and its file
router.delete('/generations/:id', authenticateUser, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get generation details first
    const generation = await dbService.getGeneration(id, userId);

    if (!generation) {
      return res.status(404).json({
        success: false,
        error: { message: 'Generation not found' }
      });
    }

    // Delete file if it exists
    if (generation.filename) {
      const filePath = path.join(__dirname, '../../temp', generation.filename);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted file: ${filePath}`);
        }
      } catch (fileError) {
        console.warn('Failed to delete file:', fileError);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete from database
    await dbService.deleteGeneration(id, userId);

    res.json({
      success: true,
      message: 'Generation deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

// Get available voices
router.get('/voices', (req, res) => {
  res.json({
    success: true,
    data: {
      voices: [
        { id: 'alloy', name: 'Alloy', description: 'Neutral voice' },
        { id: 'echo', name: 'Echo', description: 'Male voice' },
        { id: 'fable', name: 'Fable', description: 'British accent' },
        { id: 'onyx', name: 'Onyx', description: 'Deep male voice' },
        { id: 'nova', name: 'Nova', description: 'Professional female voice (recommended)' },
        { id: 'shimmer', name: 'Shimmer', description: 'Warm female voice' }
      ],
      defaultVoice: 'nova'
    }
  });
});

module.exports = router;
