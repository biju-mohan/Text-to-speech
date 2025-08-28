# Text-to-Speech Generator - MVP Scope

## 🎯 MVP Goal
**User can create account, paste text, and download beautiful AI-generated audio in under 30 seconds.**

## ✨ The Magic Moment
1. User signs up (10 seconds)
2. User pastes text and clicks "Generate" (5 seconds)
3. Backend processes with OpenAI TTS (10 seconds)
4. User downloads MP3 file (5 seconds)

**Total: 30 seconds from zero to audio file**

## 🛠 Tech Stack (Simplified)
- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL + Auth)
- **AI**: OpenAI Text-to-Speech API
- **Frontend**: Simple HTML/CSS/JS (no React for MVP)
- **Deployment**: Railway

## 🔥 Core MVP Features

### 1. Instant User Authentication
**Goal**: Get users generating audio ASAP
- **Sign Up**: Email + password only (no verification for MVP)
- **Sign In**: Persistent sessions
- **Auto-redirect**: After auth, straight to TTS interface
- **No user profile/settings** - just get them to the magic

```javascript
// Supabase Auth - 2 API calls total
POST /auth/signup { email, password }
POST /auth/signin { email, password }
```

### 2. One-Click Text-to-Speech
**Goal**: Minimize friction between text input and audio output
- **Single text area** - no character counter, just paste and go
- **One voice only** - Use OpenAI's "nova" (sounds great)
- **Fixed speed** - 1.0x (no options to confuse users)
- **Instant generation** - no preview, just generate and download

```javascript
// Single endpoint does everything
POST /api/generate-audio
Body: { text: "Hello world" }
Response: { downloadUrl: "https://...", filename: "audio_123.mp3" }
```

### 3. Magical Backend Processing
**Goal**: Handle everything server-side for smooth UX

```javascript
// Express endpoint that does the magic
app.post('/api/generate-audio', async (req, res) => {
  // 1. Validate user (JWT)
  // 2. Call OpenAI TTS API
  // 3. Save audio file (temp storage or Supabase Storage)
  // 4. Return download URL
  // Total time: ~8-12 seconds
});
```

## 📁 Minimal Database Schema

```sql
-- Users handled by Supabase Auth automatically

-- Audio generations (bare minimum)
CREATE TABLE audio_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  text_preview TEXT, -- First 50 chars for history
  file_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🎨 Ultra-Simple Frontend

### Single Page App Structure
```
index.html (landing + auth forms)
app.html (main TTS interface)
style.css (clean, minimal styling)
app.js (vanilla JS, no frameworks)
```

### Landing Page (`index.html`)
```html
<!-- Hero section -->
<h1>Turn Text into Speech in 30 Seconds</h1>
<p>Paste text, get beautiful AI audio. It's that simple.</p>

<!-- Auth forms (toggle between sign up/in) -->
<div id="auth-container">
  <form id="signup-form">
    <input type="email" placeholder="Email" required>
    <input type="password" placeholder="Password" required>
    <button>Sign Up & Start</button>
  </form>
</div>
```

### Main App (`app.html`)
```html
<!-- Simple header -->
<header>
  <h2>Text-to-Speech Generator</h2>
  <button id="logout">Logout</button>
</header>

<!-- The magic interface -->
<main>
  <textarea id="text-input" 
            placeholder="Paste your text here and click Generate..."
            rows="8"></textarea>
  
  <button id="generate-btn">✨ Generate Audio</button>
  
  <div id="result-section" style="display:none">
    <audio controls id="audio-player"></audio>
    <button id="download-btn">📥 Download MP3</button>
  </div>
  
  <div id="loading" style="display:none">
    Generating your audio... ⏳
  </div>
</main>
```

## 🔧 MVP API (3 Endpoints Total)

### 1. Authentication (Supabase handled)
```javascript
// Frontend uses Supabase client directly
const { user, error } = await supabase.auth.signUp({ email, password })
const { user, error } = await supabase.auth.signIn({ email, password })
```

### 2. Generate Audio (Core magic)
```javascript
POST /api/generate-audio
Headers: { Authorization: "Bearer <jwt>" }
Body: { text: "Your text here" }

Response: {
  success: true,
  audioUrl: "https://temp-storage.com/audio_123.mp3",
  filename: "speech_2024_01_15_hello_world.mp3",
  generationId: "uuid"
}
```

### 3. Health Check
```javascript
GET /api/health
Response: { status: "ok", timestamp: "2024-01-15T10:30:00Z" }
```

## ⚡ Backend Implementation Strategy

### Express Server Structure
```
server.js          // Main server file
├── routes/
│   ├── auth.js     // Supabase auth middleware
│   └── tts.js      // TTS generation logic
├── services/
│   ├── openai.js   // OpenAI TTS service
│   └── storage.js  // File storage (temp or Supabase)
└── middleware/
    └── auth.js     // JWT validation
```

### Core TTS Service
```javascript
// services/openai.js
async function generateSpeech(text) {
  const mp3 = await openai.audio.speech.create({
    model: "tts-1-hd",
    voice: "nova",
    input: text,
    response_format: "mp3"
  });
  
  return mp3; // Return audio buffer
}
```

### File Storage Strategy (MVP)
```javascript
// Option 1: Temporary files (simplest)
// - Save to /tmp directory
// - Serve via Express static
// - Auto-delete after 24 hours

// Option 2: Supabase Storage (better)
// - Upload to Supabase bucket
// - Return signed URL for download
// - 7-day expiration
```

## 🚀 30-Second User Journey

### Step 1: Landing (5 seconds)
- User visits site
- Sees clear value proposition
- Clicks "Sign Up & Start"

### Step 2: Auth (10 seconds)
- Types email/password
- Submits form
- Auto-redirected to main app

### Step 3: Generate (10 seconds)
- Pastes text in textarea
- Clicks "Generate Audio"
- Loading spinner shows
- Audio appears with download button

### Step 4: Download (5 seconds)
- Clicks download button
- MP3 file downloads instantly
- User has their audio file!

## 🔒 MVP Security (Minimal but Safe)

### Input Validation
```javascript
// Basic text validation
if (!text || text.length > 4000) {
  return res.status(400).json({ error: "Invalid text length" });
}

// Sanitize text (remove potentially harmful content)
const cleanText = text.replace(/<[^>]*>/g, ''); // Strip HTML
```

### Rate Limiting (Simple)
```javascript
// In-memory rate limiting (reset on server restart)
const userRequests = new Map();

function checkRateLimit(userId) {
  const now = Date.now();
  const userReqs = userRequests.get(userId) || [];
  
  // Allow 10 requests per hour
  const recentReqs = userReqs.filter(time => now - time < 3600000);
  
  if (recentReqs.length >= 10) {
    throw new Error("Rate limit exceeded");
  }
  
  recentReqs.push(now);
  userRequests.set(userId, recentReqs);
}
```

## 📦 Environment Variables (MVP)
```env
# OpenAI
OPENAI_API_KEY=sk-...

# Supabase
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# App
NODE_ENV=production
PORT=3001
```

## 🎯 MVP Success Criteria

### Technical Metrics
- ✅ Sign up to audio download in < 30 seconds
- ✅ Audio generation success rate > 90%
- ✅ Zero authentication issues
- ✅ Files download without corruption

### User Experience
- ✅ User can complete full flow without instructions
- ✅ Audio quality sounds professional
- ✅ No confusing options or settings
- ✅ Works on mobile browsers

## 🚫 Intentionally Excluded from MVP

### Features to Add Later
- Multiple voices (just use "nova")
- Speed controls (just use 1.0x)
- Audio preview (just download)
- Generation history (focus on current experience)
- User profiles/settings
- File management
- Advanced auth (email verification, password reset)
- Real-time progress updates
- Audio streaming

### UI/UX Polish
- Complex animations
- Dark mode
- Responsive design optimization
- Loading states beyond basic spinner
- Error handling beyond basic alerts

## 📈 Post-MVP Roadmap

### Week 1: MVP Launch
- Core functionality working
- Basic error handling
- Deployed to Railway

### Week 2: Polish
- Add generation history
- Improve error messages
- Basic responsive design

### Week 3: Features
- Multiple voice options
- Speed controls
- Audio preview

## 🔥 The MVP Magic

**This MVP focuses on one thing: getting from text to audio as fast as possible.**

No distractions, no complex features, just pure magic:
1. Text goes in
2. Beautiful audio comes out
3. User downloads and shares

The goal is to create that "wow" moment where users think "this is incredible" and want to try it again immediately.

---

**Development Time**: 3-5 days
**Launch Goal**: Working MVP that feels magical
**Success Metric**: Users complete the full flow and want to try again
