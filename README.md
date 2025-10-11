# CIRY - Care & Intelligence Ready for You

**B2B Platform for Health Prevention and Cybersecurity Education**

CIRY is a comprehensive platform integrating AI-powered health prevention tools with professional certification preparation. Built for healthcare professionals, patients, and corporate clients.

---

## 🚀 Features

### AI Prevention System (Prohmed Partnership)
- **Conversational AI Assistant**: Google Gemini-powered health education
- **Medical Document Analysis**: PDF/Image upload with PII anonymization
- **Radiological Image Analysis**: Visual markers on medical images
- **Demographic-Aware AI**: Personalized recommendations based on age/gender
- **Alert Follow-up System**: Intelligent symptom tracking with user confirmation
- **RAG Knowledge Base**: Semantic search over medical literature (pgvector)

### Education & Certification
- Quiz system with AI-generated questions (OpenAI GPT-4o)
- Live courses with WebSocket streaming
- Insight Discovery personality reports (72-type assessment)
- Corporate B2B licensing for enterprise

### Platform Capabilities
- Stripe subscription management
- Multi-language support (IT, EN, ES, FR)
- Admin analytics dashboard
- Email marketing automation (Brevo)
- Health score calculation
- Medical crossword puzzles

---

## 🛠️ Tech Stack

**Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, Wouter  
**Backend**: Express.js, Node.js, TypeScript, Passport.js  
**Database**: PostgreSQL (Neon serverless) with Drizzle ORM  
**AI**: Google Gemini 2.5 (medical), OpenAI GPT-4o (education)  
**Payments**: Stripe  
**Email**: Brevo (Sendinblue)  

---

## 📦 Installation

### Prerequisites
- Node.js 20+
- PostgreSQL database (Neon recommended)
- Stripe account
- Google Gemini API key
- Brevo API key (optional for emails)

### Setup

1. **Clone repository**
```bash
git clone https://github.com/your-org/ciry.git
cd ciry
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create `.env` file:
```env
# Database
DATABASE_URL=postgresql://user:password@host/database

# Production URL (CRITICAL for OAuth callbacks, emails)
BASE_URL=https://ciry.app

# AI Services
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key

# Payments
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLIC_KEY=pk_live_...

# Email (optional)
BREVO_API_KEY=your_brevo_api_key

# OAuth (if using Google login)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# Session
SESSION_SECRET=generate_random_secure_string_here
```

4. **Database setup**
```bash
# Push schema to database
npm run db:push

# For schema conflicts, force push:
npm run db:push --force
```

5. **Build application**
```bash
npm run build
```

---

## 🚢 Deployment (Production - ciry.app)

### Hetzner VPS with PM2

1. **Install PM2 globally**
```bash
npm install -g pm2
```

2. **Build for production**
```bash
npm run build
```

3. **Start with PM2**
```bash
pm2 start npm --name "ciry-app" -- start
pm2 save
pm2 startup
```

4. **Nginx reverse proxy** (recommended)
```nginx
server {
    listen 80;
    server_name ciry.app;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

5. **SSL with Certbot**
```bash
sudo certbot --nginx -d ciry.app
```

### Environment Variables (Production)

**CRITICAL**: Set `BASE_URL=https://ciry.app` for:
- OAuth callbacks
- Email links
- CORS configuration
- Stripe webhooks

---

## 🔐 Security

- Password hashing with bcrypt
- SQL injection prevention (parameterized queries)
- XSS protection with Helmet.js
- CORS configuration
- Rate limiting on AI endpoints
- Medical data anonymization (PII removal)
- Session management with secure cookies

---

## 📊 Database Schema

Key tables:
- `users` - User accounts with demographics (age, gender)
- `health_reports` - Medical documents with AI analysis
- `triage_sessions` - AI conversation sessions
- `triage_alerts` - Medical alerts with follow-up tracking
- `medical_knowledge` - RAG knowledge base with vector embeddings
- `quizzes` / `questions` - Education content
- `subscription_plans` - Stripe plans

---

## 🧪 Testing

### Manual Testing
Use test credentials:
- **Admin**: admin@ciry.app / AdminTest123!
- **User**: user@ciry.app / UserTest123!

### Development Mode
```bash
npm run dev
```

Access at: `http://localhost:5000`

---

## 📝 API Documentation

### AI Prevention Endpoints
- `POST /api/triage/start` - Start AI conversation
- `POST /api/triage/:sessionId/message` - Send message
- `GET /api/triage/pending-alert` - Get pending alerts
- `POST /api/triage/resolve-alert` - Resolve alert
- `POST /api/health-score/upload` - Upload medical document

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Local login
- `GET /api/auth/google` - Google OAuth

---

## 🤝 Contributing

This is a proprietary B2B platform. For access or partnership inquiries, contact the development team.

---

## 📄 License

Proprietary - All rights reserved

---

## 🆘 Support

For technical support or deployment assistance:
- Email: support@ciry.app
- Documentation: See `replit.md` for detailed architecture

---

**Production URL**: https://ciry.app  
**Version**: 1.0.0  
**Last Updated**: October 2025
