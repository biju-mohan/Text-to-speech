# 🚂 Railway Deployment Guide

## 🎯 Quick Deployment Steps

### 1. 📋 Prerequisites
- ✅ Code pushed to GitHub: https://github.com/biju-mohan/Text-to-speech
- 🔑 OpenAI API key with credits
- 🗄️ Supabase project setup

### 2. 🚂 Deploy to Railway

#### **Step 1: Create Railway Account**
1. Go to [Railway.app](https://railway.app)
2. Click **"Start a New Project"**
3. **Sign in with GitHub** (enables GitHub integration)

#### **Step 2: Deploy from GitHub**
1. Click **"Deploy from GitHub repo"**
2. **Authorize Railway** to access your repositories
3. Select **`biju-mohan/Text-to-speech`**
4. Click **"Deploy Now"**

Railway will automatically:
- ✅ Detect Node.js from `package.json`
- ✅ Run `npm install`
- ✅ Start with `npm start`

### 3. ⚙️ Configure Environment Variables

In Railway dashboard → **Variables** tab, add:

```env
NODE_ENV=production
PORT=3001
OPENAI_API_KEY=sk-your-openai-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RATE_LIMIT_REQUESTS=50
RATE_LIMIT_WINDOW_HOURS=1
MAX_FILE_SIZE_MB=10
```

### 4. 🗄️ Set Up Supabase Database

**Create Project:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click **"New Project"**
3. Choose organization and project name
4. Generate a strong password
5. Select region closest to your users

**Run Database Setup:**
Go to **SQL Editor** and execute:

```sql
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audio_generations_user_id ON audio_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_audio_generations_created_at ON audio_generations(created_at);

-- Enable Row Level Security
ALTER TABLE audio_generations ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can only access their own generations" ON audio_generations
  FOR ALL USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON audio_generations TO authenticated;
```

**Get API Keys:**
Go to **Settings → API** and copy:
- **Project URL** (for SUPABASE_URL)
- **anon public key** (for SUPABASE_ANON_KEY)  
- **service_role secret key** (for SUPABASE_SERVICE_ROLE_KEY)

### 5. 🤖 Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create account
3. Click **"Create new secret key"**
4. Copy the key (starts with `sk-`)
5. **Important:** Add billing info and credits to your account

### 6. 🔧 Update Frontend Configuration

After getting your Supabase credentials, update the frontend:

**Edit `public/js/app.js` lines 10-11:**
```javascript
this.supabase = window.supabase.createClient(
    'https://your-actual-project-id.supabase.co', // Your real URL
    'eyJhbGci...' // Your real anon key
);
```

**Commit and push:**
```bash
git add public/js/app.js
git commit -m "Update Supabase configuration for production"
git push
```

Railway will automatically redeploy with the changes!

### 7. ✅ Test Your Deployment

1. **Get your Railway URL** (from Railway dashboard)
2. **Open in browser** - should show landing page
3. **Test health endpoint:**
   ```
   https://your-app.railway.app/api/health
   ```
4. **Create test account** and generate audio

## 🔍 Troubleshooting

### **Deployment Fails**
- Check Railway logs in dashboard
- Verify all environment variables are set
- Ensure `package.json` has correct start script

### **Frontend Loads but Features Don't Work**
- Check browser console for errors
- Verify Supabase URL/keys in `public/js/app.js`
- Test API endpoints individually

### **"OpenAI API Error"**
- Verify API key is correct (starts with `sk-`)
- Check you have credits in OpenAI account
- Ensure billing is set up

### **"Database Error"**
- Verify Supabase database setup SQL ran successfully
- Check service role key has correct permissions
- Test database connection in Supabase dashboard

### **"Authentication Failed"**
- Verify Supabase anon key is correct
- Check if user signup is enabled in Supabase
- Test auth endpoints with curl

## 🚀 Production Checklist

- ✅ Railway deployment successful
- ✅ Environment variables configured
- ✅ Supabase database created and configured
- ✅ OpenAI API key valid with credits
- ✅ Frontend Supabase config updated
- ✅ Health endpoint responding
- ✅ User signup working
- ✅ Audio generation working
- ✅ File download working

## 🎉 Success!

Your SpeechMagic Text-to-Speech Generator is now live!

**Share your app:**
- Railway URL: `https://your-app.railway.app`
- GitHub repo: https://github.com/biju-mohan/Text-to-speech

**Monitor your app:**
- Railway dashboard for deployment logs
- Supabase dashboard for database usage
- OpenAI dashboard for API usage

---

**🎵 Congratulations! Your Text-to-Speech Generator is live and ready to create beautiful audio! 🎉**
