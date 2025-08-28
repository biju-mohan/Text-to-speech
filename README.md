# 🎵 SpeechMagic - Text-to-Speech Generator

A full-stack web application that converts text to natural-sounding speech using OpenAI's Text-to-Speech API. Users can create accounts, input text, and download high-quality MP3 audio files.

## ✨ Features

- **User Authentication** - Secure signup/signin with Supabase Auth
- **Text-to-Speech** - High-quality audio generation using OpenAI TTS
- **Professional Voices** - Multiple AI voices including Nova (recommended)
- **Instant Download** - Download MP3 files immediately after generation
- **Generation History** - View and replay previous audio generations
- **Rate Limiting** - Prevents abuse with configurable limits
- **Responsive Design** - Works great on desktop and mobile

## 🛠 Tech Stack

### Backend
- **Node.js** + **Express.js** - Server framework
- **Supabase** - PostgreSQL database and authentication
- **OpenAI TTS API** - Text-to-speech generation
- **Security** - Helmet, CORS, rate limiting

### Frontend
- **Vanilla JavaScript** - No framework complexity
- **CSS Grid/Flexbox** - Modern responsive design
- **Supabase Client** - Real-time auth and data

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- OpenAI API account with credits
- Supabase account and project

### 1. Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd speechmagic-tts

# Install dependencies
npm install
```

### 2. Configuration

Run the interactive setup script:

```bash
node setup.js
```

This will:
- Create your `.env` file with API keys
- Update frontend configuration
- Show database setup instructions

**Or configure manually:**

1. Copy `env.example` to `.env`
2. Fill in your API keys and configuration
3. Update Supabase credentials in `public/js/app.js`

### 3. Database Setup

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **SQL Editor**
3. Run the SQL commands provided by the setup script

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

## 📊 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout
- `GET /api/auth/user` - Get current user info

### Text-to-Speech
- `POST /api/tts/generate-audio` - Convert text to speech
- `GET /api/tts/download/:filename` - Download audio file
- `GET /api/tts/generations` - Get user's generation history
- `DELETE /api/tts/generations/:id` - Delete generation

### Health Check
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed service status

## 🎭 Available Voices

- **Alloy** - Neutral voice
- **Echo** - Male voice  
- **Fable** - British accent
- **Onyx** - Deep male voice
- **Nova** - Professional female voice (recommended)
- **Shimmer** - Warm female voice

## 🔧 Configuration

### Environment Variables

```env
# OpenAI
OPENAI_API_KEY=sk-your-api-key

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# App Settings
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3001

# Rate Limiting
RATE_LIMIT_REQUESTS=50
RATE_LIMIT_WINDOW_HOURS=1
```

### Rate Limiting

- **API Endpoints**: 100 requests per 15 minutes per IP
- **TTS Generation**: 50 requests per hour per user (configurable)
- **Authentication**: 5 attempts per 15 minutes per IP

## 📁 Project Structure

```
speechmagic-tts/
├── server/
│   ├── index.js              # Main Express server
│   ├── routes/               # API route handlers
│   │   ├── auth.js          # Authentication routes
│   │   ├── tts.js           # Text-to-speech routes
│   │   └── health.js        # Health check routes
│   ├── services/            # Business logic
│   │   ├── openaiService.js # OpenAI TTS integration
│   │   └── databaseService.js # Database operations
│   └── middleware/          # Express middleware
│       ├── auth.js          # Authentication middleware
│       ├── rateLimiter.js   # Rate limiting
│       └── errorHandler.js  # Error handling
├── public/                  # Frontend static files
│   ├── index.html          # Main HTML file
│   ├── css/style.css       # Styling
│   └── js/app.js           # Frontend JavaScript
├── temp/                   # Temporary audio files
├── setup.js               # Interactive setup script
└── README.md              # This file
```

## 🔒 Security Features

- **JWT Authentication** - Secure session management
- **Row Level Security** - Database access control
- **Rate Limiting** - Prevents API abuse
- **Input Validation** - Sanitizes user input
- **CORS Protection** - Restricts cross-origin requests
- **Helmet Security** - Sets security headers

## 🚀 Deployment

### Railway (Recommended)

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on git push

### Manual Deployment

```bash
# Build for production
npm run start

# Set NODE_ENV=production
# Configure production database
# Set up file storage (consider cloud storage)
```

## 🐛 Troubleshooting

### Common Issues

**"OpenAI API key invalid"**
- Verify your API key starts with `sk-`
- Check your OpenAI account has sufficient credits

**"Supabase connection failed"**
- Verify your Supabase URL and keys
- Check database setup is complete

**"Audio generation failed"**
- Check OpenAI API status
- Verify rate limits haven't been exceeded
- Check server logs for detailed errors

### Debug Mode

Enable detailed logging:

```bash
NODE_ENV=development npm run dev
```

Check health endpoint:
```
GET /api/health/detailed
```

## 📈 Performance

- **Audio Generation**: ~10-15 seconds for typical text
- **File Size**: ~1MB per minute of audio
- **Concurrent Users**: Scales with rate limiting
- **Database**: Optimized with indexes on user_id and created_at

## 🔮 Future Enhancements

- **SSML Support** - Advanced speech markup
- **Multiple Formats** - WAV, OGG output options
- **Batch Processing** - Multiple text inputs
- **Voice Cloning** - Custom voice training
- **Real-time Streaming** - Live audio generation
- **Mobile App** - React Native version

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- [OpenAI](https://openai.com) - Text-to-Speech API
- [Supabase](https://supabase.com) - Database and authentication
- [Express.js](https://expressjs.com) - Web framework

## 📞 Support

- Check the [Issues](https://github.com/your-repo/issues) page
- Review the API documentation
- Test with the health check endpoint

---

**Built with ❤️ for learning backend API integration and creating magical user experiences.**
