# Text-to-Speech Generator - Project Scope

## 🎯 Project Overview

A full-stack web application that converts text to natural-sounding speech using OpenAI's Text-to-Speech API. Users can create accounts, input text, select AI voices, and download high-quality MP3 audio files.

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **AI Service**: OpenAI Text-to-Speech API
- **Authentication**: Supabase Auth
- **Deployment**: Railway

### Frontend
- **Framework**: React
- **Styling**: CSS/Tailwind CSS (TBD)
- **HTTP Client**: Axios/Fetch API
- **State Management**: React useState/useContext (simple state)

## 📋 Core Features

### 1. User Authentication
- **Sign Up**: Users can create new accounts with email/password
- **Sign In**: Existing users can log into their accounts
- **Sign Out**: Users can securely log out
- **Protected Routes**: TTS features require authentication
- **User Sessions**: Maintain login state across browser sessions

### 2. Text-to-Speech Conversion
- **Text Input**: Large text area for users to paste/type content
- **Character Limit**: Display character count with reasonable limits (e.g., 4000 chars)
- **Voice Selection**: Dropdown/selector for different OpenAI TTS voices:
  - Alloy
  - Echo
  - Fable
  - Onyx
  - Nova
  - Shimmer
- **Speed Control**: Option to adjust speech speed (0.25x to 4.0x)
- **Preview**: Play generated audio in browser before download
- **Generate Button**: Convert text to speech with loading states

### 3. Audio Management
- **MP3 Generation**: Create high-quality MP3 files using OpenAI TTS
- **Audio Player**: Built-in player with play/pause/seek controls
- **Download**: Direct download of generated MP3 files
- **File Naming**: Auto-generate meaningful filenames (timestamp + first few words)

### 4. User Dashboard
- **Generation History**: List of previously generated audio files
- **Metadata Display**: Show text preview, voice used, date created
- **Re-download**: Access to previously generated files
- **Delete History**: Remove unwanted generations

### 5. Database Schema
```sql
-- Users table (handled by Supabase Auth)
-- audio_generations table
CREATE TABLE audio_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  text_content TEXT NOT NULL,
  voice_type VARCHAR(50) NOT NULL,
  speed DECIMAL(3,2) DEFAULT 1.0,
  file_url TEXT,
  file_size INTEGER,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔧 API Endpoints

### Authentication (Supabase handled)
- `POST /auth/signup` - Create new user account
- `POST /auth/signin` - User login
- `POST /auth/signout` - User logout
- `GET /auth/user` - Get current user info

### Text-to-Speech
- `POST /api/tts/generate` - Convert text to speech
  - Body: `{ text, voice, speed }`
  - Returns: `{ audioUrl, generationId, duration }`

### User Data
- `GET /api/generations` - Get user's TTS history
- `GET /api/generations/:id` - Get specific generation
- `DELETE /api/generations/:id` - Delete generation

### Health Check
- `GET /api/health` - API status check

## 🎨 User Interface

### Landing Page
- Hero section explaining the service
- Sign up/Sign in buttons
- Demo section (maybe with sample audio)

### Authentication Pages
- Clean sign up form (email, password, confirm password)
- Sign in form (email, password)
- Password reset functionality (Supabase handled)

### Main TTS Interface
- Large, clean text input area
- Voice selection dropdown with voice previews
- Speed adjustment slider
- Character counter
- Generate button with loading spinner
- Audio player section

### User Dashboard
- Navigation header with logout
- History table/cards showing:
  - Text preview (first 50 chars)
  - Voice used
  - Date created
  - Play/Download buttons
- Pagination for large histories

## 📱 User Experience Flow

1. **First Visit**: User lands on homepage, sees demo/explanation
2. **Sign Up**: User creates account via simple form
3. **Main Interface**: User sees text input, voice options, and generate button
4. **Text Input**: User pastes text, selects voice and speed
5. **Generation**: User clicks generate, sees loading state, then audio player
6. **Preview**: User can play audio in browser
7. **Download**: User downloads MP3 file
8. **History**: User can view past generations in dashboard

## 🔒 Security & Validation

### Input Validation
- Text length limits (4000 characters max)
- Sanitize text input to prevent XSS
- Validate voice selection against allowed options
- Speed range validation (0.25 - 4.0)

### Rate Limiting
- Limit TTS generations per user per hour (e.g., 50 requests)
- Implement cooldown between requests (e.g., 5 seconds)

### Authentication
- Use Supabase RLS (Row Level Security)
- Protect all TTS endpoints with auth middleware
- Validate JWT tokens on each request

## 🚀 Deployment Requirements

### Environment Variables
```env
# OpenAI
OPENAI_API_KEY=sk-...

# Supabase
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# App Config
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-domain.com

# Rate Limiting
REDIS_URL=redis://... (for Railway Redis addon)
```

### Railway Configuration
- Node.js backend service
- Automatic builds from GitHub
- Environment variable management
- Optional: Redis addon for rate limiting

## 📊 Success Metrics

### Technical Metrics
- API response time < 2 seconds for TTS generation
- 99% uptime
- Zero data breaches
- Successful audio file generation rate > 95%

### User Metrics
- User registration completion rate
- Average TTS generations per user
- User retention (users returning within 7 days)

## 🔮 Future Enhancements (Out of Scope)

### Phase 2 Features
- SSML (Speech Synthesis Markup Language) support
- Custom voice training
- Batch text processing
- Audio format options (WAV, OGG)
- Social sharing of generated audio
- Team/organization accounts
- API access for developers
- Mobile app (React Native)

### Advanced Features
- Real-time streaming TTS
- Voice cloning
- Multiple language support
- Audio effects and filters
- Subscription tiers with usage limits

## 📋 Development Phases

### Phase 1: Foundation (Week 1)
- Set up project structure
- Implement authentication with Supabase
- Create basic UI components
- Set up OpenAI TTS integration

### Phase 2: Core Features (Week 2)
- Implement TTS generation
- Add audio player and download
- Create user dashboard
- Add generation history

### Phase 3: Polish & Deploy (Week 3)
- Add error handling and validation
- Implement rate limiting
- UI/UX improvements
- Deploy to Railway
- Testing and bug fixes

## 🎯 Definition of Done

The project is complete when:
- [ ] Users can sign up and sign in securely
- [ ] Users can input text and generate speech with voice selection
- [ ] Generated audio plays in browser and can be downloaded
- [ ] Users can view their generation history
- [ ] All API endpoints work correctly with proper error handling
- [ ] Application is deployed and accessible on Railway
- [ ] Basic rate limiting is implemented
- [ ] Input validation prevents common security issues
- [ ] Documentation is complete and accurate

---

**Project Timeline**: 3 weeks
**Target Launch**: [Date TBD]
**Team Size**: 1 developer (learning project)
**Budget**: Free tier services (Supabase, OpenAI trial credits, Railway free tier)
