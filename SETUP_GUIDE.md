# 🚀 SpeechMagic Setup Guide

Your Text-to-Speech Generator is **almost ready**! The server is running with placeholder credentials. Follow these steps to get it fully functional.

## ✅ Current Status

- ✅ **Server Running**: http://localhost:3001
- ✅ **Frontend Loaded**: HTML, CSS, and JavaScript ready
- ✅ **API Endpoints**: All routes configured and working
- ✅ **File System**: Temp directory created for audio storage
- ⚠️ **Need Real Credentials**: OpenAI and Supabase keys required

## 🔧 Step 1: Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-...`)
5. **Important**: Add billing info and credits to your OpenAI account

## 🗄️ Step 2: Set Up Supabase

1. Go to [Supabase](https://app.supabase.com)
2. Create a new project
3. Go to **Settings > API** and copy:
   - Project URL
   - `anon` `public` key
   - `service_role` `secret` key

4. Go to **SQL Editor** and run this SQL:

```sql
-- Create the audio_generations table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audio_generations_user_id ON audio_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_audio_generations_created_at ON audio_generations(created_at);

-- Enable Row Level Security
ALTER TABLE audio_generations ENABLE ROW LEVEL SECURITY;

-- Create policy for user access
CREATE POLICY "Users can only access their own generations" ON audio_generations
  FOR ALL USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON audio_generations TO authenticated;
```

## ⚙️ Step 3: Configure Application

**Option A: Interactive Setup (Recommended)**
```bash
npm run setup
```

**Option B: Manual Configuration**

Edit your `.env` file with real credentials:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-real-openai-key-here

# Supabase Configuration  
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-real-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-real-service-role-key

# App Configuration (keep as is)
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3001
RATE_LIMIT_REQUESTS=50
RATE_LIMIT_WINDOW_HOURS=1
MAX_FILE_SIZE_MB=10
AUDIO_STORAGE_PATH=./temp
```

Also update `public/js/app.js` lines 8-11:
```javascript
this.supabase = window.supabase.createClient(
    'https://your-project-id.supabase.co', // Your real Supabase URL
    'your-real-anon-key' // Your real anon key
);
```

## 🔄 Step 4: Restart Server

```bash
# Stop current server (Ctrl+C if running in foreground)
pkill -f "node server/index.js"

# Start with new credentials
npm run dev
```

## 🧪 Step 5: Test the Application

1. **Open Browser**: Go to http://localhost:3001
2. **Sign Up**: Create a test account
3. **Generate Audio**: 
   - Paste some text
   - Click "✨ Generate Audio"
   - Download the MP3 file

### Test Text Ideas:
```
Hello world! This is a test of the SpeechMagic text-to-speech generator. 

Welcome to the future of AI-powered audio generation. This system can convert any text into natural-sounding speech using advanced artificial intelligence.

The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet.
```

## 🔍 Troubleshooting

### Server Won't Start
```bash
# Check health status
curl http://localhost:3001/api/health/detailed

# Check logs
npm run dev
```

### OpenAI Errors
- ❌ `Invalid API key`: Check the key starts with `sk-`
- ❌ `Rate limit exceeded`: Add billing info to OpenAI account
- ❌ `Insufficient credits`: Add credits to OpenAI account

### Supabase Errors
- ❌ `supabaseUrl is required`: Check URL format in both `.env` and `app.js`
- ❌ `Invalid API key`: Check anon and service role keys
- ❌ `Permission denied`: Make sure SQL commands ran successfully

### Frontend Errors
- ❌ `Network error`: Check server is running on port 3001
- ❌ `Auth error`: Verify Supabase credentials in `app.js`
- ❌ `CORS error`: Check FRONTEND_URL matches your browser URL

## 📊 API Testing

Test individual endpoints:

```bash
# Health check
curl http://localhost:3001/api/health

# Auth test (will return 401 without token)
curl http://localhost:3001/api/auth/user

# TTS voices
curl http://localhost:3001/api/tts/voices
```

## 🎉 Success Indicators

You'll know it's working when:
- ✅ Server starts without errors
- ✅ Landing page loads with styling
- ✅ You can create an account
- ✅ Text input updates character counter
- ✅ Generate button shows loading state
- ✅ Audio player appears with generated speech
- ✅ MP3 download works
- ✅ Generation history shows previous attempts

## 🚀 Next Steps

Once everything works:

1. **Deploy to Railway**:
   - Connect GitHub repo
   - Set environment variables
   - Deploy automatically

2. **Customize**:
   - Add more voices
   - Implement speed controls
   - Add file management features

3. **Scale**:
   - Set up Redis for rate limiting
   - Implement cloud storage
   - Add monitoring

---

**Need Help?** Check the server logs and health endpoint for detailed error information.

**Working?** 🎉 Congratulations! You've built a full-stack Text-to-Speech Generator!
