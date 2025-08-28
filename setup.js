#!/usr/bin/env node

/**
 * SpeechMagic Setup Script
 * Helps configure the application for first-time setup
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('🎵 Welcome to SpeechMagic Setup!');
  console.log('This script will help you configure your Text-to-Speech Generator.\n');

  // Check if .env already exists
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const overwrite = await ask('⚠️  .env file already exists. Overwrite it? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled. Your existing .env file is preserved.');
      rl.close();
      return;
    }
  }

  console.log('\n📋 Let\'s collect your configuration...\n');

  // Collect configuration
  const config = {};

  // OpenAI Configuration
  console.log('🤖 OpenAI Configuration:');
  config.OPENAI_API_KEY = await ask('Enter your OpenAI API Key (starts with sk-): ');
  
  if (!config.OPENAI_API_KEY || !config.OPENAI_API_KEY.startsWith('sk-')) {
    console.log('⚠️  Warning: Invalid OpenAI API key format. Make sure it starts with "sk-"');
  }

  // Supabase Configuration
  console.log('\n🗄️  Supabase Configuration:');
  config.SUPABASE_URL = await ask('Enter your Supabase URL (https://xxx.supabase.co): ');
  config.SUPABASE_ANON_KEY = await ask('Enter your Supabase Anon Key: ');
  config.SUPABASE_SERVICE_ROLE_KEY = await ask('Enter your Supabase Service Role Key: ');

  // App Configuration
  console.log('\n⚙️  App Configuration:');
  const port = await ask('Enter port number (default: 3001): ');
  config.PORT = port || '3001';
  
  const nodeEnv = await ask('Environment (development/production) [development]: ');
  config.NODE_ENV = nodeEnv || 'development';
  
  config.FRONTEND_URL = `http://localhost:${config.PORT}`;
  
  // Rate Limiting
  console.log('\n🔒 Rate Limiting:');
  const rateLimit = await ask('Requests per hour per user (default: 50): ');
  config.RATE_LIMIT_REQUESTS = rateLimit || '50';
  config.RATE_LIMIT_WINDOW_HOURS = '1';
  
  // File Storage
  config.MAX_FILE_SIZE_MB = '10';
  config.AUDIO_STORAGE_PATH = './temp';

  // Generate .env content
  const envContent = Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  // Write .env file
  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ .env file created successfully!');

  // Update frontend Supabase configuration
  const appJsPath = path.join(__dirname, 'public', 'js', 'app.js');
  if (fs.existsSync(appJsPath)) {
    let appJsContent = fs.readFileSync(appJsPath, 'utf8');
    
    // Replace placeholder URLs
    appJsContent = appJsContent.replace(
      "'https://your-project.supabase.co'",
      `'${config.SUPABASE_URL}'`
    );
    appJsContent = appJsContent.replace(
      "'your-anon-key-here'",
      `'${config.SUPABASE_ANON_KEY}'`
    );
    
    fs.writeFileSync(appJsPath, appJsContent);
    console.log('✅ Frontend Supabase configuration updated!');
  }

  // Display database setup instructions
  console.log('\n📊 Database Setup Required:');
  console.log('1. Go to your Supabase dashboard: https://app.supabase.com');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Run this SQL to create the required table:\n');
  
  console.log('-- Create audio_generations table');
  console.log('CREATE TABLE IF NOT EXISTS audio_generations (');
  console.log('  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),');
  console.log('  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,');
  console.log('  text_content TEXT NOT NULL,');
  console.log('  text_preview TEXT NOT NULL,');
  console.log('  voice_type VARCHAR(50) NOT NULL DEFAULT \'nova\',');
  console.log('  speed DECIMAL(3,2) NOT NULL DEFAULT 1.0,');
  console.log('  file_url TEXT NOT NULL,');
  console.log('  filename TEXT NOT NULL,');
  console.log('  file_size INTEGER,');
  console.log('  duration_seconds INTEGER,');
  console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
  console.log('  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
  console.log(');');
  console.log('');
  console.log('-- Create indexes');
  console.log('CREATE INDEX IF NOT EXISTS idx_audio_generations_user_id ON audio_generations(user_id);');
  console.log('CREATE INDEX IF NOT EXISTS idx_audio_generations_created_at ON audio_generations(created_at);');
  console.log('');
  console.log('-- Enable Row Level Security');
  console.log('ALTER TABLE audio_generations ENABLE ROW LEVEL SECURITY;');
  console.log('');
  console.log('-- Create RLS policy');
  console.log('CREATE POLICY "Users can only access their own generations" ON audio_generations');
  console.log('  FOR ALL USING (auth.uid() = user_id);');
  console.log('');
  console.log('-- Grant access');
  console.log('GRANT ALL ON audio_generations TO authenticated;');

  console.log('\n🚀 Next Steps:');
  console.log('1. Run the SQL commands above in your Supabase dashboard');
  console.log('2. Start the development server: npm run dev');
  console.log('3. Open http://localhost:' + config.PORT + ' in your browser');
  console.log('4. Test the application by creating an account and generating audio');

  console.log('\n📝 Important Notes:');
  console.log('- Make sure your OpenAI account has sufficient credits');
  console.log('- Audio files are stored temporarily in the ./temp directory');
  console.log('- Check the health endpoint: http://localhost:' + config.PORT + '/api/health');

  console.log('\n🎉 Setup complete! Happy coding with SpeechMagic!');
  
  rl.close();
}

// Run setup
main().catch(error => {
  console.error('Setup failed:', error);
  rl.close();
  process.exit(1);
});
