const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

/**
 * OpenAI Text-to-Speech service
 * Handles audio generation using OpenAI's TTS API
 */

class OpenAIService {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Available voices (from OpenAI TTS documentation)
    this.availableVoices = [
      'alloy',
      'echo', 
      'fable',
      'onyx',
      'nova',
      'shimmer'
    ];

    // Default voice for MVP (professional female voice)
    this.defaultVoice = 'nova';
  }

  /**
   * Generate speech from text using OpenAI TTS
   * @param {string} text - Text to convert to speech
   * @param {string} voice - Voice to use (default: nova)
   * @param {number} speed - Speech speed (0.25 to 4.0, default: 1.0)
   * @returns {Promise<Buffer>} Audio data as Buffer
   */
  async generateSpeech(text, voice = this.defaultVoice, speed = 1.0) {
    try {
      // Validate inputs
      if (!text || typeof text !== 'string') {
        throw new Error('Text is required and must be a string');
      }

      if (text.length > 4096) {
        throw new Error('Text must be 4096 characters or less');
      }

      if (!this.availableVoices.includes(voice)) {
        console.warn(`Invalid voice '${voice}', using default voice '${this.defaultVoice}'`);
        voice = this.defaultVoice;
      }

      if (speed < 0.25 || speed > 4.0) {
        console.warn(`Invalid speed '${speed}', using default speed 1.0`);
        speed = 1.0;
      }

      console.log(`Generating speech: ${text.length} characters, voice: ${voice}, speed: ${speed}`);

      // Generate speech with OpenAI
      const mp3 = await this.openai.audio.speech.create({
        model: 'tts-1-hd', // High quality model
        voice: voice,
        input: text,
        response_format: 'mp3',
        speed: speed
      });

      // Convert response to buffer
      const buffer = Buffer.from(await mp3.arrayBuffer());
      
      console.log(`Speech generated successfully: ${buffer.length} bytes`);
      return buffer;

    } catch (error) {
      console.error('OpenAI TTS error:', error);
      
      // Handle specific OpenAI errors
      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key');
      } else if (error.status === 429) {
        throw new Error('OpenAI rate limit exceeded. Please try again later.');
      } else if (error.status === 500) {
        throw new Error('OpenAI service temporarily unavailable');
      } else {
        throw new Error(`TTS generation failed: ${error.message}`);
      }
    }
  }

  /**
   * Save audio buffer to file
   * @param {Buffer} audioBuffer - Audio data
   * @param {string} filename - Filename (without extension)
   * @returns {Promise<string>} Full file path
   */
  async saveAudioFile(audioBuffer, filename) {
    try {
      const tempDir = path.join(__dirname, '../../temp');
      
      // Ensure temp directory exists
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const filePath = path.join(tempDir, `${filename}.mp3`);
      
      // Write buffer to file
      await fs.promises.writeFile(filePath, audioBuffer);
      
      console.log(`Audio file saved: ${filePath}`);
      return filePath;

    } catch (error) {
      console.error('File save error:', error);
      throw new Error(`Failed to save audio file: ${error.message}`);
    }
  }

  /**
   * Generate a unique filename for audio files
   * @param {string} text - Original text (for preview)
   * @param {string} userId - User ID
   * @returns {string} Unique filename
   */
  generateFilename(text, userId = 'anonymous') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const textPreview = text
      .slice(0, 30)
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toLowerCase();
    
    return `speech_${timestamp}_${textPreview}_${userId.slice(0, 8)}`;
  }

  /**
   * Get estimated audio duration (rough calculation)
   * @param {string} text - Text content
   * @param {number} speed - Speech speed
   * @returns {number} Estimated duration in seconds
   */
  estimateDuration(text, speed = 1.0) {
    // Rough estimate: ~150 words per minute at normal speed
    const wordsPerMinute = 150 * speed;
    const wordCount = text.split(/\s+/).length;
    const durationMinutes = wordCount / wordsPerMinute;
    return Math.ceil(durationMinutes * 60);
  }

  /**
   * Validate text content for TTS
   * @param {string} text - Text to validate
   * @returns {Object} Validation result
   */
  validateText(text) {
    const errors = [];
    
    if (!text || typeof text !== 'string') {
      errors.push('Text is required and must be a string');
    } else {
      if (text.trim().length === 0) {
        errors.push('Text cannot be empty');
      }
      
      if (text.length > 4096) {
        errors.push('Text must be 4096 characters or less');
      }
      
      if (text.length < 1) {
        errors.push('Text must be at least 1 character long');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      characterCount: text ? text.length : 0,
      wordCount: text ? text.split(/\s+/).length : 0
    };
  }
}

module.exports = OpenAIService;
