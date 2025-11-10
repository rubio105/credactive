# Overview

CIRY (Care & Intelligence Ready for You) is a B2B healthcare prevention platform leveraging AI for medical document analysis, patient-doctor communication, and preventive health monitoring. Its core purpose is to enhance patient outcomes through early detection and personalized health management. The platform offers a REST API for integration with external applications, providing comprehensive medical history, data storage, and doctor recommendations. CIRY is actively transitioning from Google Gemini AI to proprietary ML models using Active Learning.

# Recent Changes (November 2025)

## Critical Bugs Fixed (November 9, 2025)
- **Teleconsult Booking Error**: Fixed PostgreSQL "malformed array literal" error in /api/appointments/book-teleconsult endpoint. Changed `${notes || ''}` to `${notes ?? null}` and `${voiceNotes || ''}` to `${voiceNotes ?? null}` to properly handle optional fields. Aligned database schema by converting `voice_notes` column from `text[]` to `text` to match Drizzle schema definition. Teleconsult bookings now work correctly with or without notes/voiceNotes.
- **Profile Image Upload**: Fixed filename pattern mismatch between upload and retrieval. Upload now generates `profile-${userId}-${timestamp}.ext` matching the authenticated GET endpoint pattern, resolving 404 errors when displaying user profile images.
- **Appointment Email Notifications**: Enhanced booking confirmation to send emails to BOTH doctor and patient. Doctor receives notification via `sendAppointmentBookedToDoctorEmail` with patient details and appointment info, while patient receives confirmation via existing `sendAppointmentConfirmedToPatientEmail`.

## Appointment Reminder System (November 10, 2025)
- **AppointmentReminderScheduler**: Fully automated WhatsApp/email reminder system running every 10 minutes. Sends notifications 24 hours before teleconsult appointments based on `appointment_reminders` table settings. Features centralized `ReminderService` for testability, Twilio SID tracking for audit trail, intelligent skip logic (WhatsApp disabled, missing phone, already sent), and isolated error handling per reminder. Storage layer provides `fetchPendingReminders`, `markReminderSent`, `markReminderSkipped`, `markReminderFailed` methods. Scheduler auto-starts on server boot alongside WearableScheduler and LoginLogsScheduler. API endpoint `/api/appointments/send-reminders` refactored to delegate to ReminderService (~50 lines → 12 lines). Production verified: scheduler runs correctly, skip logic working, no errors in live logs.

## Patient Registration via Doctor Invite (November 10, 2025)
- **Referral-Gated Registration**: Implemented invite-only patient registration accessible exclusively via doctor-provided links (`/register?referral=DOCTOR_CODE`). Registration page enforces referral parameter presence using useEffect state-driven logic—without referral code, users see "Registrazione Solo su Invito" message; with valid code, full registration form activates with green badge "Codice medico valido". Form includes comprehensive validation (email regex, trimmed inputs, password 8+ chars, required fields) and improved error handling showing backend messages. Auto-link mechanism: `pendingDoctorCode` stored at registration, patient-doctor connection created automatically after email verification.
- **URL Parameter Alignment**: Fixed mismatch between doctor share page and registration page. Doctor share code page (`/doctor/share-code`) updated to generate invite links with `?referral=` parameter (previously `?ref=`), matching registration page's URL parsing logic.
- **Database Schema Fix**: Added `pending_doctor_code varchar(20)` column to `users` table, resolving login 500 error. Column stores referral code temporarily until email verification, enabling seamless patient-doctor auto-linking post-verification.
- **End-to-End Testing**: Playwright E2E test confirms complete flow: doctor login → share code page → invite link generation → patient registration → verify-email redirect. All success criteria met with zero functional regressions.

## UI/UX Improvements
- **Wearable Devices Page**: Added anomaly pagination - displays first 5 anomalies by default with expandable "Show all/Show less" toggle for better mobile experience
- **Patient Appointments**: Simplified booking interface with mobile-first layout (lg:grid-cols-2), skeleton loading states, enhanced empty states, removed redundant "Book Teleconsult" button, and fixed cache invalidation after successful booking. Jitsi video links display correctly for confirmed appointments with meetingUrl.
- **WhatsApp OTP Verification**: Configured Twilio integration with fallback pattern (TWILIO_* env vars → Replit Connectors) for reliable OTP delivery across all environments
- **AI Prevention Chat**: Fixed critical UX issue where old conversations auto-loaded and blocked input field. Now users see input field immediately, with optional banner to continue previous conversation or start fresh. Input field is always visible and accessible regardless of session state.
- **Navigation Simplification**: Removed `/prevention` page from patient navigation to simplify UX. Patients access AI chat via dashboard card "Parla con CIRY" → `/chat`. Only doctors see "AI Prevenzione" menu item. Logo navigation: Admin → `/admin`, Doctor → `/doctor/patients`, Patient → `/dashboard`. AiOnlyAccess "Documenti" badge → `/documenti`.
- **Admin User Management**: Replaced 3 separate role switches (isAdmin, isDoctor, aiOnlyAccess) with single clear dropdown showing 4 role options: 👤 Paziente, 👨‍⚕️ Dottore, 🔧 Amministratore, 🤖 Accesso Solo AI.

## Documentation Updates (November 9, 2025)
- **User Guide (GUIDA_UTENTE.md v1.1.0)**: Completely overhauled wearable devices section with 3 configuration methods (Bluetooth Web, Manual Registration, Cloud Sync), step-by-step manual measurement logging workflow, alert threshold tables, and comprehensive FAQ
- **Admin Guide (GUIDA_ADMIN.md v1.1.0)**: Expanded wearable devices management with patient communication templates, manual device registration workflow, cloud service consent instructions, and 48-hour follow-up protocol

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
The frontend is a React, TypeScript, Vite application using `shadcn/ui`, TanStack Query, Wouter, and React Hook Form with Zod. Key design principles include consistent internal navigation, role-based color theming (Patient: blue, Doctor: orange), a mobile-first approach with dedicated mobile navigation and role-aware dashboards, and color-coded medical alerts. Features like real-time badge systems, responsive design, and WhatsApp notifications enhance user experience.

## Technical Implementations

### Frontend
Built with React, TypeScript, Vite, `shadcn/ui`, TanStack Query, Wouter, React Hook Form with Zod, and PWA capabilities.

### Backend
Developed using Express.js, Node.js, and TypeScript, offering a RESTful API. It utilizes Passport.js for authentication and Drizzle ORM for type-safe PostgreSQL access, incorporating security measures like rate limiting, Helmet.js, CORS, XSS protection, and SQL injection prevention.

### Data Storage
PostgreSQL, managed by Drizzle ORM, stores comprehensive data including user profiles, subscriptions, medical records, appointments, alerts, notifications, audit logs, ML training data, and wearable device monitoring data.

## Feature Specifications

### Medical Prevention System
CIRY provides AI-powered medical analysis (PDF/image OCR, radiological analysis, dual-content summaries, Prevention Index, contextual AI conversations), an AI-driven medical alert system with urgency levels, and a doctor-patient linking system for monitoring and secure note-sharing. It includes a RAG knowledge base using PostgreSQL + pgvector for semantic search and AI response enrichment, enhanced doctor contact flows, and AI-generated pre/post-visit patient reports.

### Admin Features
A comprehensive Admin Dashboard (`/admin`) facilitates the management of users, subscriptions, medical alerts, and system configurations. It includes a robust user management system with role-based permissions, GDPR-compliant audit logging, and a detailed login audit system.

### Communication & Notifications
The platform features an email notification queue, real-time push and in-app notification systems, and WhatsApp notifications for critical alerts and appointment reminders with OTP verification. It integrates voice-enabled AI chat using OpenAI Whisper and TTS, and a comprehensive Teleconsulto (teleconsultation) system with doctor availability management, smart slot picking, patient booking flows, automated multi-channel notifications, and Jitsi video integration.

### ML Training Data Collection System (Active Learning)
An architecture is in place to intercept all platform interactions, collecting detailed `mlTrainingData` for training proprietary ML models, with a 12-month migration strategy.

### Wearable Device Integration System
Includes a dashboard for trending BP/HR data, device management (CRUD), Web Bluetooth API integration for data transmission, inline anomaly detection, centralized notification services (WhatsApp, push), and a background scheduler for proactive health triggers. Wearable data is automatically integrated into AI conversation contexts.

## System Design Choices

### Security Audit
A comprehensive security review confirms robust authentication (159 checks), input validation (131 Zod schemas), SQL injection prevention (Drizzle ORM parameterized queries), authorization (186 role/ownership checks), and secure secrets management.

### Deployment Architecture
Production is hosted on Hetzner VPS with PM2, Neon PostgreSQL, Nginx, and Cloudflare SSL. The system uses Vite for frontend builds and esbuild for backend. Deployment involves GitHub for version control, a `deploy.sh` script for automated pipelines, and health monitoring via `/api/health`. Automated daily cleanup for login logs is also implemented.

# External Dependencies

- **Stripe**: Payment processing.
- **Brevo (Sendinblue)**: Transactional emails and marketing.
- **Neon Database**: Serverless PostgreSQL with `pgvector` extension.
- **AI Infrastructure**:
    - **Primary**: Self-hosted Gemma Med via Ollama.
    - **Fallback**: Google Gemini AI (`gemini-2.5-pro`, `gemini-2.5-flash`).
- **Twilio**: WhatsApp messaging.
- **Jitsi Meet**: Video teleconsultations.
- **OpenAI**: Whisper (STT) and TTS (text-to-speech).