# Overview

CIRY (Care & Intelligence Ready for You) is a B2B healthcare prevention platform that uses AI for medical document analysis, patient-doctor communication, and preventive health monitoring. It aims to improve patient outcomes through early detection and personalized health management, initially leveraging Google Gemini AI with a strategic plan to transition to proprietary ML models via Active Learning.

## External API Integration (ProhMed)

CIRY provides a REST API v1 for external app integration (e.g., ProhMed Android/iOS app). The API supports:
- **Medical History Context**: Apps can pass patient data (age, gender, allergies, chronic conditions, medications, surgeries) when creating triage sessions
- **Data Storage**: Triage sessions and medical history are stored on CIRY database, associated with external app's userId
- **Doctor Contact Flag**: API returns `requiresDoctorContact: true` when AI recommends medical consultation - external app intercepts this to redirect to booking/appointments
- **Authentication**: SHA-256 hashed API keys with scope-based permissions and rate limiting (120 req/min production default)
- **Production API Key**: `ciry_Ldv1ZgklZhJq9AERbZfuf0ic-14U1-DTLYNmwBq4tuM` (120 req/min, scopes: triage:read, triage:write)
- **Developer Documentation**: `docs/API_INTEGRATION_PROHMED.md` - Complete technical documentation for ProhMed developers including:
  - Architecture overview and data separation principles
  - Full API reference with TypeScript types
  - React Native and Flutter integration examples
  - Error handling patterns and best practices
  - Testing guides and cURL examples
  - FAQ and troubleshooting section

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions

The frontend uses React, TypeScript, Vite, `shadcn/ui` (Radix UI + Tailwind CSS), TanStack Query, Wouter, and React Hook Form with Zod. The design focuses on medical professionalism with features like color-coded health indicators, modern chat interfaces, and severity badges for medical reports. Key UI elements include:
- **Color-Coded Medical Alerts**: Sticky-positioned alerts with 4 urgency levels (EMERGENCY 🚨, HIGH ⚡, MEDIUM ℹ️, LOW ✓) using healthcare-appropriate colors (red, orange, yellow, green)
- **Role-Based Homepage Tabs**: Patients see "Prevenzione" + "I Tuoi Referti" tabs, Doctors see "I Tuoi Pazienti" + "Shortcuts Rapidi" tabs
- User guide, AI prevention chat, emergency alerts, premium subscription system, MFA, and role-based routing

## Technical Implementations

### Frontend
Built with React, TypeScript, Vite, `shadcn/ui`, TanStack Query, Wouter, React Hook Form with Zod, and PWA capabilities.

### Backend
Developed using Express.js, Node.js, and TypeScript, providing a RESTful API. It uses Passport.js for authentication (local strategy with bcrypt) and Drizzle ORM for type-safe PostgreSQL access. Security measures include rate limiting, Helmet.js, CORS, XSS protection, and SQL injection prevention.

### Data Storage
PostgreSQL, managed by Drizzle ORM, handles data for users, subscriptions, medical reports, prevention documents, doctor notes, appointments, triage sessions, alerts, notifications, audit logs, and ML training data.

## Feature Specifications

### Medical Prevention System
- **AI-Powered Medical Analysis**: Utilizes Google Gemini AI for PDF/image analysis (with OCR), radiological image analysis (X-Ray, MRI, CT, etc., with detailed prompts), dual-content summaries (patient and doctor), a Prevention Index score (0-100), contextual AI conversations using recent reports, and demographic-aware health advice.
- **Medical Alert System**: AI-driven triage generating alerts with urgency levels (EMERGENCY, HIGH, MEDIUM, LOW), automated notifications, doctor assignments, and an admin interface for alert review.
- **Doctor-Patient Linking System**: Enables doctors to monitor patients using unique linking codes, create categorized medical notes (prescriptions, reports, advice), and attach files. Patients receive real-time push notifications for new notes.
- **Patient Documents Page**: Centralized hub for patients to view doctor connections, medical notes, alerts, and access linking codes.
- **RAG Knowledge Base System**: Employs PostgreSQL + pgvector and Gemini text-embedding-004 for semantic search, enriching AI responses with scientific medical documents.
- **Enhanced Doctor Contact Flow**: AI-guided prompts for contacting doctors with intelligent session management.

### Admin Features
- **Admin Dashboard**: A comprehensive dashboard (`/admin`) with 12 sections including user management, subscriptions, medical alerts, webinars, feedback, email templates, AI marketing, knowledge base, and various notification management tools.
- **User Management System**: Allows creation, editing, and deletion of all user types (Patient, Doctor, Admin, AI-only), with role-based permissions and search functionality.
- **Audit Log System**: GDPR-compliant tracking of data access with filtering and export capabilities.
- **Professional Registration Workflow**: Doctors register via a contact request and admin approval, while patient registration is admin-only.

### Communication & Notifications
- **Email Notification Queue**: Intelligent scheduling for template-based transactional emails via Brevo (Sendinblue).
- **Push Notification System**: Real-time browser notifications using Web Push API, with VAPID keys managed via Replit Secrets. Triggers include doctor notes and admin broadcasts.
- **In-App Notification System**: Real-time notification bell with unread count, priority levels, custom icons, and click-to-navigate functionality.

### ML Training Data Collection System (Active Learning)
- **Data Collection Architecture**: A universal interceptor captures all platform interactions (AI, medical data, user feedback) to build a dataset for proprietary ML model training.
- **Database Schema**: `mlTrainingData` table stores request metadata, input/output data, user context, performance metrics, and quality feedback.
- **Performance Optimizations**: Includes async file hashing and query-level filtering.
- **API Endpoints**: For analytics dashboard (`/api/ml/training/stats`) and filtered JSON export (`/api/ml/training/export`).
- **12-Month Migration Strategy**: A phased approach to collect annotated data, train base models, conduct A/B testing, and fully migrate to proprietary ML models.

### Additional Features
- **Appointment Scheduling**: Calendar-based booking with email workflows.
- **Patient Onboarding**: Collects health profile data.
- **Multi-Tenant B2B**: Supports clinic organizations with custom branding.
- **User Feedback System**: Comprehensive management of user feedback.

## System Design Choices

### Deployment Architecture
- **Production Environment**: Hosted on Hetzner VPS (157.180.21.147) at `/var/www/credactive` with PM2 process manager, Neon PostgreSQL, Nginx reverse proxy, and Cloudflare SSL.
- **Build Systems**: Vite for frontend, esbuild for backend.
- **Version Control**: GitHub.
- **Environment Configuration**: Environment variables loaded from `.env` with critical `VITE_*` variables needing export before build.
- **Deployment Workflow**:
  ```bash
  # 1. On Replit: commit changes
  git add .
  git commit -m "description"
  git push
  
  # 2. On server (157.180.21.147)
  cd /var/www/credactive
  git pull
  rm -rf dist/
  export VITE_STRIPE_PUBLIC_KEY="pk_live_51QGqOLRoBZjvt9q7aJusgvh5IvdlNNKglLEAZABJamBBs8A24ILYZFMUQVBYARwj9FNw79wUy58rTbw1sKtWDHMi007yDdPpnx"
  npm run build
  pm2 restart credactive
  
  # 3. CRITICAL: Purge Cloudflare cache (ALWAYS after deploy)
  # Go to dash.cloudflare.com → ciry.app → Caching → Purge Everything
  # Or wait 30s then test with CTRL+SHIFT+R
  ```
- **Cache Management**: **ALWAYS purge Cloudflare cache after every deploy** or changes won't be visible to users. Users must use CTRL+SHIFT+R (hard refresh) to see updates immediately.

# External Dependencies

- **Stripe**: Payment processing for subscriptions.
- **Brevo (Sendinblue)**: Transactional emails and marketing.
- **Neon Database**: Serverless PostgreSQL with `pgvector` extension.
- **AI Infrastructure**:
  - **Primary (Production)**: Self-hosted **Gemma Med** via Ollama on Hetzner GPU server for GDPR-compliant medical inference
  - **Fallback (Cloud)**: Google Gemini AI (`gemini-2.5-pro`, `gemini-2.5-flash`) for high availability
  - **Strategy**: Automatic fallback system tries Gemma local first, uses Gemini cloud if unavailable
  - **Environment Variables**:
    - `USE_LOCAL_MODEL=true` - Enables local Gemma inference
    - `GEMMA_ENDPOINT=http://localhost:11434` - Ollama API endpoint
    - `GEMMA_MODEL=gemma2:9b-instruct` - Model name (gemma2, medllama2, meditron)
    - `GEMMA_TIMEOUT=60000` - Request timeout in milliseconds
    - `GEMINI_API_KEY` - Fallback cloud API key
  - **Tracking**: Each AI response includes `modelUsed` field for ML analytics