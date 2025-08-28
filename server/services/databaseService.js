const { createClient } = require('@supabase/supabase-js');

/**
 * Database service for managing TTS generations
 * Uses Supabase PostgreSQL database
 */

class DatabaseService {
  constructor() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase URL and Service Role Key are required');
    }

    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  /**
   * Save a new TTS generation record
   * @param {Object} generationData - Generation details
   * @returns {Promise<Object>} Created generation record
   */
  async saveGeneration(generationData) {
    try {
      const {
        userId,
        textContent,
        voiceType,
        speed,
        fileUrl,
        filename,
        fileSize,
        durationSeconds
      } = generationData;

      // Create text preview (first 100 characters)
      const textPreview = textContent.length > 100 
        ? textContent.slice(0, 100) + '...'
        : textContent;

      const { data, error } = await this.supabase
        .from('audio_generations')
        .insert([
          {
            user_id: userId,
            text_content: textContent,
            text_preview: textPreview,
            voice_type: voiceType,
            speed: speed,
            file_url: fileUrl,
            filename: filename,
            file_size: fileSize,
            duration_seconds: durationSeconds,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Database save error:', error);
        throw new Error(`Failed to save generation: ${error.message}`);
      }

      console.log(`Generation saved to database: ${data.id}`);
      return data;

    } catch (error) {
      console.error('Save generation error:', error);
      throw error;
    }
  }

  /**
   * Get user's generation history
   * @param {string} userId - User ID
   * @param {Object} options - Query options (limit, offset)
   * @returns {Promise<Array>} List of generations
   */
  async getUserGenerations(userId, options = {}) {
    try {
      const { limit = 10, offset = 0 } = options;

      const { data, error } = await this.supabase
        .from('audio_generations')
        .select(`
          id,
          text_preview,
          voice_type,
          speed,
          file_url,
          filename,
          file_size,
          duration_seconds,
          created_at
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Database query error:', error);
        throw new Error(`Failed to fetch generations: ${error.message}`);
      }

      return data || [];

    } catch (error) {
      console.error('Get generations error:', error);
      throw error;
    }
  }

  /**
   * Get a specific generation by ID
   * @param {string} generationId - Generation ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object|null>} Generation record or null
   */
  async getGeneration(generationId, userId) {
    try {
      const { data, error } = await this.supabase
        .from('audio_generations')
        .select('*')
        .eq('id', generationId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error('Database query error:', error);
        throw new Error(`Failed to fetch generation: ${error.message}`);
      }

      return data;

    } catch (error) {
      console.error('Get generation error:', error);
      throw error;
    }
  }

  /**
   * Delete a generation record
   * @param {string} generationId - Generation ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<boolean>} Success status
   */
  async deleteGeneration(generationId, userId) {
    try {
      const { error } = await this.supabase
        .from('audio_generations')
        .delete()
        .eq('id', generationId)
        .eq('user_id', userId);

      if (error) {
        console.error('Database delete error:', error);
        throw new Error(`Failed to delete generation: ${error.message}`);
      }

      console.log(`Generation deleted from database: ${generationId}`);
      return true;

    } catch (error) {
      console.error('Delete generation error:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User statistics
   */
  async getUserStats(userId) {
    try {
      const { data, error } = await this.supabase
        .from('audio_generations')
        .select('id, duration_seconds, file_size, created_at')
        .eq('user_id', userId);

      if (error) {
        console.error('Database stats error:', error);
        throw new Error(`Failed to fetch user stats: ${error.message}`);
      }

      const stats = {
        totalGenerations: data.length,
        totalDurationSeconds: data.reduce((sum, gen) => sum + (gen.duration_seconds || 0), 0),
        totalFileSizeBytes: data.reduce((sum, gen) => sum + (gen.file_size || 0), 0),
        firstGeneration: data.length > 0 ? Math.min(...data.map(g => new Date(g.created_at))) : null,
        lastGeneration: data.length > 0 ? Math.max(...data.map(g => new Date(g.created_at))) : null
      };

      return stats;

    } catch (error) {
      console.error('Get user stats error:', error);
      throw error;
    }
  }

  /**
   * Initialize database schema (for development)
   * This should be run manually in production via Supabase dashboard
   */
  async initializeSchema() {
    try {
      // Note: This is for reference. In production, run this SQL in Supabase SQL editor:
      const schemaSQL = `
        -- Create audio_generations table
        CREATE TABLE IF NOT EXISTS audio_generations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          text_content TEXT NOT NULL,
          text_preview TEXT NOT NULL,
          voice_type VARCHAR(50) NOT NULL DEFAULT 'nova',
          speed DECIMAL(3,2) NOT NULL DEFAULT 1.0,
          file_url TEXT NOT NULL,
          filename TEXT NOT NULL,
          file_size INTEGER,
          duration_seconds INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_audio_generations_user_id ON audio_generations(user_id);
        CREATE INDEX IF NOT EXISTS idx_audio_generations_created_at ON audio_generations(created_at);

        -- Enable Row Level Security
        ALTER TABLE audio_generations ENABLE ROW LEVEL SECURITY;

        -- Create RLS policy for users to only access their own data
        CREATE POLICY "Users can only access their own generations" ON audio_generations
          FOR ALL USING (auth.uid() = user_id);

        -- Grant access to authenticated users
        GRANT ALL ON audio_generations TO authenticated;
      `;

      console.log('Database schema SQL:');
      console.log(schemaSQL);
      console.log('\nPlease run this SQL in your Supabase SQL editor to set up the database.');

      return { success: true, message: 'Schema SQL generated' };

    } catch (error) {
      console.error('Schema initialization error:', error);
      throw error;
    }
  }
}

module.exports = DatabaseService;
