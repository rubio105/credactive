# Overview

CIRY (Care & Intelligence Ready for You) is a B2B healthcare prevention platform specializing in AI-powered medical document analysis, patient-doctor communication, and preventive health monitoring. The platform leverages Google Gemini AI for medical analysis and document processing, with a strategic roadmap to migrate to proprietary ML models through Active Learning data collection.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions

The frontend is built with React, TypeScript, Vite, `shadcn/ui` (Radix UI + Tailwind CSS), TanStack Query, Wouter, and React Hook Form with Zod. Design emphasizes medical professionalism with color-coded health indicators, modern chat interfaces with avatars and typing indicators, and severity badges for medical reports.

**Key UI Features:**
- **User Guide Page** (`/guida`): Gradient hero header, 3-step timeline (Upload → AI Analysis → Chat), hover-animated feature cards
- **AI Prevention Chat**: AI assistant with blue shield icon, user avatars with initials, bubble messages
- **Patient Navigation**: Prevention-focused platform with integrated AI Chat Panel, medical reports section, and health monitoring dashboard
- **Emergency Alerts**: Priority display for EMERGENCY urgency alerts in Prevention Index card
- **Premium Subscription System**: €29.90/month via Stripe for enhanced features (unlimited AI tokens, medical document upload, personalized reports, 2 weekly televisits, exclusive webinars)
- **Multi-Factor Authentication (MFA/2FA)**: Available to all users via `/security` page
- **Prevention Index UI**: Circular health score display (0-100) with emerald-themed design
- **Role-Based Homepage Routing**: Admin → `/admin`, Doctors → `/doctor/patients`, Patients → AI Prevention integrated homepage

## Technical Implementations

### Frontend
React, TypeScript, Vite, `shadcn/ui` (Radix UI + Tailwind CSS), TanStack Query, Wouter, React Hook Form with Zod validation, PWA capabilities for mobile installation.

### Backend
Express.js, Node.js, TypeScript providing RESTful API. Authentication via Passport.js (local strategy with bcrypt) and persistent sessions. Drizzle ORM for type-safe PostgreSQL access. Security: rate limiting, Helmet.js, CORS, XSS protection, SQL injection prevention.

### Data Storage
PostgreSQL (Neon's serverless driver) managed by Drizzle ORM. Schema supports: users, subscriptions, medical reports, prevention documents, doctor notes, appointments, triage sessions, alerts, notifications, audit logs, and ML training data collection.

## Feature Specifications

### Medical Prevention System (Core Platform)

**AI-Powered Medical Analysis** (Powered by Google Gemini AI):
- **Medical Document Upload & Analysis**: PDF/image upload with automatic OCR and AI interpretation
- **Radiological Image Analysis**: Automatic detection and detailed analysis for X-Ray, MRI, CT/TAC, Ecografia, ECG, Ecocardiografia, Mammografia, PET, Scintigrafia
  - Enhanced prompts request specific measurements (cm/mm), detailed anatomical locations, severity scoring (1-10)
  - Minimum 5 findings per analysis for comprehensive assessment
  - Word-boundary detection to avoid false positives
- **Dual-Content System**: `patientSummary` (patient-friendly explanations) and `doctorSummary` (technical medical details)
- **Prevention Index**: AI-powered personal health scoring (0-100) calculated from medical report analysis
- **Contextual AI Conversations**: AI chat includes last 2 medical reports for personalized recommendations
- **Demographic-Aware AI**: Considers user's age and gender for tailored health advice

**Medical Alert System**:
- AI-powered triage creating alerts from medical assessments
- Urgency levels: EMERGENCY, HIGH, MEDIUM, LOW
- Automatic patient notifications and doctor assignment
- Patient confirmation and doctor follow-up workflows
- Complete admin interface at `/admin/alerts` with review dialogs

**Doctor-Patient Linking System**:
- Medical referral system for patient monitoring
- Doctors generate unique linking codes for patients
- View linked patients and create medical notes/reports
- **File Attachments**: Support for attached files (prescriptions, reports, advice)
- **Note Categories**: 
  - **Ricetta Medica** (Medical Prescriptions)
  - **Refertazione** (Medical Reports)
  - **Consiglio** (Medical Advice)
  - **Generico** (General Notes)
- Real-time web push notifications for new doctor notes

**Patient Documents Page** (`/documenti`):
- Centralized management for doctor connections
- View all medical notes from linked doctors
- Monitor medical alerts and their status
- Access linking codes and connection history

**RAG Knowledge Base System**:
- PostgreSQL + pgvector for semantic search
- Gemini text-embedding-004 for vector embeddings
- Enriches AI triage responses with scientific medical documents
- Admin interface for knowledge base management

**Enhanced Doctor Contact Flow**:
- AI prompts for "Contatta Medico Prohmed" with follow-up questions
- Intelligent session closure based on negative user responses
- Automatic conversation flow management

### Admin Features

**Admin Dashboard** (`/admin`):
- Comprehensive vertical sidebar with 12 sections:
  1. **Dashboard**: System overview and key metrics (admins redirected here on login)
  2. **Gestione Utenti**: User management (max 20 displayed at once for performance)
  3. **Abbonamenti**: Subscription management
  4. **Alert Medici**: Medical alert triage and review
  5. **Webinar Health**: Free webinar platform for prevention education
  6. **Feedback Utenti**: User feedback management with filtering
  7. **Email Templates**: Template management for transactional emails
  8. **AI Marketing**: Intelligent campaign management
  9. **Knowledge Base**: RAG system document management
  10. **Notifiche In-App**: In-app notification system management
  11. **Notifiche Push**: Web push notification broadcasts
  12. **Audit Log**: GDPR-compliant access tracking
  13. **Documentazione**: Platform documentation
- "Torna alla Dashboard" button on all pages
- Admin users excluded from AI Prevention/patient features

**User Management System**:
- Create/edit/delete all user types (Patient, Doctor, Admin, AI-only access)
- Role-based editing and permissions
- Search functionality across names and emails
- Display limited to 20 users max for performance

**Audit Log System**:
- GDPR-compliant tracking of all data access
- Filter by user, resource type, date range
- CSV export functionality
- Real-time monitoring (auto-refresh every 30s)

**Professional Registration Workflow**:
- **Doctor Registration**: Via contact request → admin approval
- **Patient Registration**: Admin-only user creation (public registration disabled)

### Communication & Notifications

**Email Notification Queue**:
- Intelligent scheduling for automated notifications
- Template-based system (Welcome, Password Reset, Corporate Invite, etc.)
- Integration with Brevo (Sendinblue) for transactional emails

**Push Notification System**:
- Web Push API for real-time browser notifications
- VAPID keys configured via Replit Secrets
- Endpoints: `/api/push/vapid-public-key`, `/api/push/subscribe`, `/api/push/unsubscribe`
- Doctor notes trigger automatic push to patients
- Admin broadcast capabilities at `/admin/push-notifications`

**In-App Notification System**:
- Real-time notification bell with unread count badge
- Auto-refresh every 30 seconds
- Notification types: doctor_note, admin_broadcast, new_report, alert, system
- Priority levels and custom icons
- Click-to-navigate functionality
- Mark as read / Mark all as read

### ML Training Data Collection System (Active Learning Infrastructure)

**Overview**: Infrastructure for gradual migration from Gemini AI to proprietary ML models over 12 months.

**Data Collection Architecture**:
- **Universal Interceptor**: Captures ALL platform interactions:
  - **AI Interactions (Gemini)**: Radiological analysis, medical triage, prevention chat, crossword generation
  - **Medical Data (non-AI)**: Doctor notes with attachments, medical report uploads, ECG uploads, document uploads
  - **Other Data**: User feedback, health assessments
  
**Technical Implementation**:
- **Database Schema** (`mlTrainingData` table):
  - Request metadata: type, model used, timestamps
  - Input data: text, prompts, image paths with SHA-256 hash
  - Output data: JSON responses, raw text
  - User context: demographics (age, gender), userId
  - Performance metrics: response time, token usage, confidence scores
  - Quality feedback: user feedback, doctor corrections, quality ratings
  - Training flags: `includedInTraining`, `exportedAt`

**Performance Optimizations**:
- **Async File Hashing**: Streaming hash calculation (non-blocking event loop)
- **Database Aggregates**: COUNT, GROUP BY for statistics (constant memory usage)
- **Query-Level Filtering**: WHERE clauses instead of in-memory processing

**API Endpoints**:
- `GET /api/ml/training/stats`: Analytics dashboard (total records, breakdown by type/model, feedback counts)
- `GET /api/ml/training/export`: Filtered JSON export for training pipelines
  - Filters: requestType, minQualityRating, excludeAlreadyIncluded
  - Future enhancement: streaming export for large datasets (>100k records)

**12-Month Migration Strategy**:
1. **Months 1-3**: Collect 500-1000 annotated medical cases with doctor feedback
2. **Months 4-6**: Train base proprietary model on collected data
3. **Months 7-9**: A/B testing (Gemini vs proprietary model) for quality validation
4. **Months 10-12**: Full migration to proprietary models, cost reduction

### Additional Features

- **Appointment Scheduling**: Calendar-based booking for doctor-patient consultations with email workflows
- **Patient Onboarding**: Collects health profile data for new patients (max 4 prompts)
- **Multi-Tenant B2B**: Clinic organizations with custom branding
- **User Feedback System**: Complete feedback management with category/status filtering

## System Design Choices

### Deployment Architecture

**Production Environment** (`ciry.app`):
- **Server**: Hetzner VPS with PM2 process manager
- **Server Path**: `/var/www/credactive` (NOT /var/www/ciry)
- **Database**: Neon PostgreSQL (serverless)
- **Web Server**: Nginx reverse proxy (ports 80/443) with Cloudflare SSL
- **Static Assets**: `/var/www/credactive/public/images/` served directly by Nginx
- **Build Systems**: Vite (frontend) + esbuild (backend)
- **Version Control**: GitHub

**Environment Configuration**:
- Environment variables loaded from `.env` via `ecosystem.config.cjs`
- **Critical**: `VITE_STRIPE_PUBLIC_KEY` must be set BEFORE build (Vite embeds at build time)
- Push notifications: `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` via Replit Secrets

**Deployment Workflow** (MANDATORY STEPS):
1. Push code to GitHub repository
2. SSH to server: `ssh root@157.180.21.147`
3. Pull changes: `cd /var/www/credactive && git pull`
4. **Load environment variables**: `export $(grep -v '^#' .env | xargs)` 
   - ⚠️ CRITICAL: Vite embeds `VITE_*` vars during build - must export first
5. Build: `npm run build`
6. Restart: `pm2 restart credactive`
7. **Purge Cloudflare Cache**: Dashboard → Caching → Purge Everything
   - ⚠️ MANDATORY: Without cache purge, users won't see updated frontend assets
8. Verify: `pm2 logs credactive --lines 30`

# External Dependencies

**Core Services**:
- **Stripe**: Payment processing and €29.90/month subscription management
- **Brevo (Sendinblue)**: Transactional emails and marketing campaigns
- **Neon Database**: Serverless PostgreSQL with pgvector extension
- **Google Gemini AI**: 
  - gemini-2.5-pro: Medical document analysis, conversational triage
  - gemini-2.5-flash: Lightweight tasks, embeddings (text-embedding-004)

**Strategic Note**: Platform is designed for gradual migration from Gemini to proprietary ML models. All Gemini interactions are captured via ML Training Data Collection system for future model training.
