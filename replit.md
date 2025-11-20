# Overview

CIRY (Care & Intelligence Ready for You) is a B2B healthcare prevention platform leveraging AI for medical document analysis, patient-doctor communication, and proactive health monitoring. Its core purpose is to enhance patient outcomes through early detection and personalized health management. The platform provides a REST API for integrations, offering comprehensive medical history, data storage, and AI-driven doctor recommendations. CIRY is transitioning to proprietary ML models using Active Learning, aiming to establish a significant market presence in B2B healthcare prevention with its robust, AI-powered solution.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
The frontend utilizes React, TypeScript, Vite, `shadcn/ui`, TanStack Query, Wouter, and React Hook Form with Zod. It features consistent internal navigation, role-based color theming (Patient: blue, Doctor: orange), a mobile-first approach with dedicated mobile navigation, and role-aware dashboards. The application incorporates a responsive view system with a 768px breakpoint, adapting automatically to different screen sizes.

## Technical Implementations

### Frontend
Built with React, TypeScript, Vite, `shadcn/ui`, TanStack Query, Wouter, React Hook Form with Zod, and PWA capabilities.

### Backend
Developed using Express.js, Node.js, and TypeScript, offering a RESTful API. It employs Passport.js for authentication and Drizzle ORM for type-safe PostgreSQL access, including security measures like rate limiting, Helmet.js, CORS, XSS protection, and SQL injection prevention.

### Data Storage
PostgreSQL, managed by Drizzle ORM, stores user profiles, subscriptions, medical records, appointments, alerts, notifications, audit logs, ML training data, and wearable device monitoring data.

## Feature Specifications

### Medical Prevention System
CIRY provides AI-powered medical analysis (OCR, radiological analysis, summaries, Prevention Index, contextual AI conversations), an AI-driven medical alert system with urgency levels, and a doctor-patient linking system. It includes a RAG knowledge base using PostgreSQL + pgvector, enhanced doctor contact flows, and AI-generated pre/post-visit patient reports.

### Admin Features
A comprehensive Admin Dashboard (`/admin`) facilitates user, subscription, medical alert, and system configuration management, alongside robust user management with role-based permissions and GDPR-compliant audit logging.

### Communication & Notifications
The platform integrates an email notification queue, real-time push and in-app notifications, and WhatsApp notifications for critical alerts and appointment reminders. It features voice-enabled AI chat using OpenAI Whisper and TTS, and a Teleconsulto system with doctor availability, smart slot picking, patient booking, automated notifications, and embedded Twilio Video calls for in-app video consultations.

**WhatsApp Notification System:**
- **OTP Verification**: Uses approved WhatsApp Content Template `HX229f5a04fd0510ce1b071852155d3e75` for sending verification codes
- **Fallback Mechanism**: If template fails, automatically falls back to free-form WhatsApp messages
- **Sandbox Support**: Development environment uses Twilio Sandbox WhatsApp number (`+14155238886`)
- **Security**: Rate-limited endpoint (`authLimiter`), Zod validation for phone numbers (international format), sanitized error messages
- **Robustness**: Messages sent BEFORE saving codes to database, preventing undelivered-but-valid codes
- **Notifications**: General WhatsApp notifications (appointments, alerts) use free-form messages via `sendWhatsAppMessage()`

### Appointment Management System
The Doctor appointments page (`/appointments`) includes tabs for managing booked, available, and completed appointments, a monthly calendar view, and weekly schedule management for recurring availability slots.

**Automatic Slot Generation from Recurring Availability:**
- **Doctor Configuration**: Doctors define recurring availability (e.g., "Every Monday 9:00-17:00, 60-minute slots") in `doctor_availability` table with:
  - Day of week (0=Sunday, 1=Monday, etc.)
  - Start/end time (HH:MM format)
  - Slot duration (30 or 60 minutes)
  - Appointment type (video/in-person/both)
  - Studio address (for in-person appointments)
- **Automatic Generation**: When patient views available appointments (`GET /api/appointments?status=available`):
  - Backend calls `generateSlotsFromAvailability()` to create individual slots for next 30 days
  - Divides availability windows into slot-duration intervals (e.g., 9:00-17:00 with 60min → 9:00-10:00, 10:00-11:00, ..., 16:00-17:00)
  - Uses `INSERT ... ON CONFLICT (doctor_id, start_time) DO NOTHING` for idempotent, race-safe generation
  - Inserts slots into `appointments` table with `status='available'`, `patient_id=NULL`
  - Skips slots in the past and enforces availability boundaries (no overflow slots beyond end_time)
  - Structured logging with correlation IDs for production diagnostics
- **Patient View**: Patients see:
  - Calendar with highlighted days (blue) when slots exist
  - Individual bookable time slots (e.g., "9:00 - 60 min") when clicking a day
  - All available slots from all doctors (not filtered by patient)
- **Patient Appointments Query**:
  - `GET /api/appointments` (no params) → returns all patient's booked/confirmed/completed appointments
  - `GET /api/appointments?status=available` → returns all available slots (all doctors)
  - `GET /api/appointments?status=confirmed` → returns only confirmed appointments

**Double-Booking Prevention:**
- **Database Transaction**: All teleconsult bookings use atomic transactions with `SELECT FOR UPDATE` row-level locking to prevent concurrent modifications
- **Race-Safe Overlap Detection**: Transaction filters out the target available slot by exact ISO timestamp comparison while detecting real conflicts (other appointments overlapping the requested time window)
- **Atomic Slot Conversion**: Single `UPDATE` statement converts `status='available'` to `'pending'` with `patient_id` within transaction, eliminating DELETE+INSERT race window
- **Physical Constraint**: Database `UNIQUE(doctor_id, start_time)` constraint provides secondary protection, preventing phantom inserts between SELECT and UPDATE
- **Comprehensive Error Handling**: 
  - Overlap conflicts (manual appointments) → HTTP 409 "Il dottore ha già un appuntamento"
  - Race conditions (concurrent bookings) → HTTP 409 "Slot già prenotato da altro paziente"
  - Constraint violations (23505) → HTTP 409 "Slot già prenotato da altro paziente"
- **Architect-Approved**: Production-ready solution with no race windows, eliminating all double-booking scenarios

### ML Training Data Collection System (Active Learning)
An architecture captures all platform interactions as `mlTrainingData` to train proprietary ML models, supporting a 12-month migration.

### Wearable Device Integration System
Includes a dashboard for trending BP/HR data, device management, Web Bluetooth API integration, anomaly detection, centralized notification services, and a background scheduler. Wearable data is integrated into AI conversation contexts.

### Patient Registration
Patients can register via doctor-provided referral links, automatically linking them to their doctor post-email verification. Registration requires privacy consents, and an invite-only mode can be configured.

**Role Assignment Logic**:
- Patients registering **with doctor referral code**: `aiOnlyAccess = false` (full patient access to all platform features)
- Patients registering **without referral code**: `aiOnlyAccess = true` (AI Prevention mode - restricted access)
- Current setting: `INVITE_ONLY_MODE = false` (registration enabled for all users)

### Twilio Video Integration (Embedded Video Calls)
CIRY features fully embedded video calls using Twilio Video, enabling in-app video consultations with a brandable UI. The backend provides secure access tokens, and the frontend `VideoCallRoom` component manages video/audio tracks and participant handling.

### AI Medical Report Generation (Teleconsult Reports)
Complete automated workflow for generating, editing, and distributing AI-powered medical reports from teleconsult video calls:

**Technical Workflow:**
1. **Auto-Recording**: Twilio Video automatically records all teleconsult calls (enabled via `recordParticipantsOnConnect: true`)
2. **Report Generation**: Doctor triggers AI report generation from completed appointments via `AIReportDialog` component
3. **Transcription**: Backend downloads Twilio recording via REST API, transcribes using OpenAI Whisper (whisper-1 model)
4. **AI Analysis**: Gemini AI (`gemini-2.5-pro`) generates **structured medical report** with THREE mandatory sections:
   - **Sintesi Diagnostica**: Visit reason, relevant medical history, clinical observations, diagnosis
   - **Proposta Terapeutica**: Pharmacological therapy (drugs, dosages, contraindications), non-pharmacological therapy (lifestyle changes), warnings
   - **Piano di Follow-up**: Diagnostic exams, scheduled visits, monitoring objectives
5. **Doctor Review**: Doctor edits AI-generated content in rich text editor before finalizing
6. **Distribution**: Final report saved to patient's `mlTrainingData` (dataType='teleconsult_report'), sent via email (Brevo) and WhatsApp (Twilio)

**Database Schema Extensions:**
- `appointments.recordingSid`: Twilio recording identifier
- `appointments.recordingUrl`: Public URL for audio file
- `appointments.transcription`: Full Whisper transcription text
- `appointments.aiGeneratedReport`: Raw AI output from Gemini
- `appointments.doctorEditedReport`: Final version after doctor review
- `appointments.reportStatus`: Workflow state (null → 'generated' → 'reviewed' → 'sent')
- `appointments.reportSentAt`: Distribution timestamp

**API Endpoints:**
- `POST /api/appointments/:id/generate-report`: Downloads recording, transcribes, generates AI report
- `GET /api/appointments/:id/report`: Retrieves existing report data
- `PUT /api/appointments/:id/report`: Saves doctor edits
- `POST /api/appointments/:id/report/send`: Finalizes and distributes report to patient
- `GET /api/appointments/teleconsult-reports`: Patient-facing endpoint for viewing received reports

**UI Components:**
- `AIReportDialog.tsx`: Doctor interface for generate/edit/send workflow with tabs for AI output vs transcription
- Patient Appointments page: Displays received teleconsult reports with detail dialog showing full content

**Critical Configuration:**
- Twilio API Keys must be from **US1 region** (IE1/Ireland keys fail authentication)
- Recording download requires `TWILIO_AUTH_TOKEN` in addition to API Key credentials
- All reports stored as `mlTrainingData` for Active Learning ML training pipeline
- Production email links use `https://ciry.app` (configured via `NODE_ENV=production` check in `getBaseUrl()`)
- Appointment confirmation emails include prominent reminder box encouraging patients to upload medical documents before visits

## System Design Choices

### Base URL Configuration
All backend-generated URLs (emails, invites, notifications, webhooks) are centralized through the `getBaseUrl()` helper function in `server/email.ts`. This ensures consistent URL generation across the entire backend:

**Priority Logic:**
1. `BASE_URL` environment variable (if explicitly set)
2. `https://ciry.app` when `NODE_ENV=production` (**production default**)
3. Auto-detected Replit domain in development
4. `http://localhost:5000` fallback

**Usage:**
- Email links (verification, password reset, invites)
- Stripe billing portal return URLs
- Live course session notifications
- WhatsApp document links
- Twilio Video webhook callbacks

All backend code imports and uses `getBaseUrl()` to guarantee production links always resolve to `https://ciry.app`.

### Security Audit
A comprehensive security review confirms robust authentication, input validation, SQL injection prevention, authorization (RBAC), and secure secrets management.

### Deployment Architecture
Production uses Hetzner VPS with PM2, Neon PostgreSQL, Nginx, and Cloudflare SSL. The system employs Vite for frontend builds and esbuild for backend. Deployment is managed via GitHub, a `deploy.sh` script, and health monitoring via `/api/health`.

# External Dependencies

-   **Stripe**: Payment processing for subscriptions.
-   **Brevo (Sendinblue)**: Transactional emails and marketing communications.
-   **Neon Database**: Serverless PostgreSQL with `pgvector` extension.
-   **AI Infrastructure**:
    -   **Primary**: Self-hosted Gemma Med via Ollama.
    -   **Fallback**: Google Gemini AI (`gemini-2.5-pro`, `gemini-2.5-flash`).
-   **Twilio**: WhatsApp messaging, OTP verification, and Twilio Video for embedded video calls.
-   **OpenAI**: Whisper (Speech-to-Text) and TTS (Text-to-Speech).