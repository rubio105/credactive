# Overview

CIRY (Care & Intelligence Ready for You) is a B2B healthcare prevention platform that uses AI for medical document analysis, patient-doctor communication, and preventive health monitoring. Its primary goal is to improve patient outcomes through early detection and personalized health management. The platform integrates with external applications via a REST API to provide comprehensive medical history context, data storage, and doctor recommendations. CIRY aims to transition from using Google Gemini AI to proprietary ML models through Active Learning.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions

The frontend is built with React, TypeScript, Vite, `shadcn/ui` (Radix UI + Tailwind CSS), TanStack Query, Wouter, and React Hook Form with Zod. The design prioritizes medical professionalism through:
- **Consistent Internal Navigation**: Uses wouter's `setLocation` for all internal routing (login, navigation, AdminLayout, dashboard, quiz, BackButton), avoiding `window.location.href` and `window.history.back()` to maintain SPA performance. Only `useLogout` retains `window.location.assign()` for full session reset.
- **Role-Based Color Theming**: Automatic theme switching based on user role via `useRoleTheme` hook and CSS `data-role` attribute on body element:
  - **Patient Theme**: Blue primary color (HSL 217, 91%, 60%), blue gradient backgrounds
  - **Doctor Theme**: Orange primary color (HSL 34, 88%, 55%), orange gradient backgrounds
  - Implementation uses CSS variable overrides with `[data-role="doctor"]` selector for dynamic theming without React context overhead.
- **Mobile-First Architecture**: Complete redesign with mobile-optimized navigation and role-aware dashboards.
  - **BottomNavigation Component**: Fixed bottom tab bar (mobile only <768px) with 5 role-specific tabs and real-time badge counts for notifications/alerts (60s refetch interval).
  - **Patient Tabs**: Home (Dashboard), CIRY (AI Chat), Medici (Doctors/Documents), Prenotazioni (Appointments), Notifiche (Notifications).
  - **Doctor Tabs**: Home (Dashboard), CIRY (AI Chat), Alert (Medical Alerts), Pazienti (Patients), Agenda (Calendar).
  - **AvatarMenu Component**: Simplified dropdown menu with user header (name/email) and logout option only.
- **Role-Based Dashboards**: Smart routing at `/` based on user role (isDoctor/isAdmin).
  - **PatientDashboard**: Personalized greeting, prevention score card with progress bar, next appointment countdown, quick action buttons (Start AI Chat, View Reports, Book Appointment).
  - **DoctorDashboard**: Mobile-first optimized layout with orange gradient background (`from-orange-50`), responsive grid (1 column mobile, 2 columns desktop), horizontal service cards with leading icons, professional greeting, stats cards (Total Patients, Active Alerts, Today Appointments), urgent alerts table, quick actions (View Patients, Create Report, Manage Availability).
- **Unified Mobile Pages**: New mobile-optimized pages for streamlined navigation.
  - **MediciPage** (`/medici`): Separate sections for connected doctors list (`/api/patient/doctors`) and medical documents (`/api/patient/notes`) with individual queries, loading states, and empty states.
  - **NotifichePage** (`/notifiche`): Notification center with filters (All/Unread) and mark-as-read functionality.
  - **DoctorAlertsPage** (`/doctor/alerts`): Medical alerts dashboard with urgency filters and patient navigation.
- **Patient UX Simplification (Nov 2025)**: Streamlined patient experience removing non-essential UI elements:
  - **Prevention/CIRY Page**: Removed "Parla con CIRY" voice trigger button, hidden archive toggle (unused), eliminated prevention index card and query, patient alerts hidden (doctors-only feature). Medical documents remain in dedicated "Cronologia Medica" section with filters and pagination.
  - **Navigation Menu**: Removed all role-specific navigation links from avatar dropdown, retaining only user header and logout for cleaner UX.
- **Color-Coded Medical Alerts**: Four urgency levels (EMERGENCY, HIGH, MEDIUM, LOW) using healthcare-appropriate colors.
- **Real-Time Badge System**: Notification and alert counts with TanStack Query auto-refetch every 60 seconds.
- **Responsive Design**: Adaptive layouts with mobile-first approach (<768px bottom tabs, ≥768px desktop sidebar/navigation).
- **WhatsApp Notifications**: User-configurable notifications for critical alerts and appointment reminders.
- Additional features include a user guide, AI prevention chat, emergency alerts, premium subscription system, MFA, and comprehensive role-based routing.

## Technical Implementations

### Frontend
Built with React, TypeScript, Vite, `shadcn/ui`, TanStack Query, Wouter, React Hook Form with Zod, and PWA capabilities.

### Backend
Developed using Express.js, Node.js, and TypeScript, providing a RESTful API. It uses Passport.js for authentication (local strategy with bcrypt) and Drizzle ORM for type-safe PostgreSQL access. Security measures include rate limiting, Helmet.js, CORS, XSS protection, and SQL injection prevention.

### Data Storage
PostgreSQL, managed by Drizzle ORM, stores data for users, subscriptions, medical reports, prevention documents, doctor notes, appointments, triage sessions, alerts, notifications, audit logs, login logs, ML training data, and wearable device monitoring (devices, blood pressure readings, proactive health triggers, notifications).

## Feature Specifications

### Medical Prevention System
- **AI-Powered Medical Analysis**: Utilizes AI for PDF/image analysis (with OCR), radiological image analysis, dual-content summaries, a Prevention Index score, contextual AI conversations, and demographic-aware health advice.
- **Medical Alert System**: AI-driven triage generating alerts with urgency levels, automated notifications, and doctor assignments.
- **Doctor-Patient Linking System**: Enables doctors to monitor patients using linking codes, create categorized medical notes, and attach files, with real-time patient notifications.
- **Patient Documents Page**: A centralized hub for patients to view doctor connections, medical notes, and alerts.
- **RAG Knowledge Base System**: Employs PostgreSQL + pgvector and Gemini text-embedding-004 for semantic search, enriching AI responses with scientific medical documents.
- **Enhanced Doctor Contact Flow**: AI-guided prompts for doctor contact.
- **Pre-Visit Patient Reports**: Comprehensive patient summaries generated by Gemini AI with one-click access for doctors.
- **Post-Visit Prevention Reports**: Personalized prevention recommendations generated by Gemini AI and saved as doctor notes.

### Admin Features
- **Admin Dashboard**: A comprehensive dashboard (`/admin`) for managing users, subscriptions, medical alerts, webinars, feedback, email templates, AI marketing, knowledge base, and notifications.
- **User Management System**: Allows creation, editing, and deletion of all user types with role-based permissions.
- **Audit Log System**: GDPR-compliant tracking of data access with filtering and export capabilities.
- **Login Audit System**: Comprehensive authentication tracking system recording all login attempts (successful and failed) with detailed metadata and an admin interface for filtering and export.
- **Professional Registration Workflow**: Doctors register via contact request and admin approval; patient registration is admin-only.

### Communication & Notifications
- **Email Notification Queue**: Intelligent scheduling for transactional emails.
- **Push Notification System**: Real-time browser notifications with auto-cleanup of stale subscriptions, detailed logging, and success metrics.
- **In-App Notification System**: Real-time notification bell with unread count, priority levels, and custom icons.
- **WhatsApp Notifications**: Automated messaging for critical alerts and appointment reminders via Twilio, with user consent and admin control.
- **Voice-Enabled AI Chat**: Integrates OpenAI Whisper (STT) and TTS for speech-to-text and text-to-speech, replacing Web Speech API.
- **Teleconsulto System**: A complete video consultation platform with automated booking and reminders:
    - **Doctor Availability Management**: CRUD operations for recurring weekly slots and appointment types.
    - **Smart Slot Picker**: Real-time availability display to prevent double-booking.
    - **Patient Booking Flow**: Comprehensive form for doctor selection, slot booking, and voice input for notes.
    - **Automated Notifications**: WhatsApp and email reminders.
    - **Video Meeting Integration**: Jitsi video room auto-generation.

### ML Training Data Collection System (Active Learning)
- **Data Collection Architecture**: A universal interceptor captures all platform interactions to build a dataset for proprietary ML model training.
- **Database Schema**: `mlTrainingData` table stores request metadata, input/output data, user context, performance metrics, and quality feedback.
- **12-Month Migration Strategy**: A phased approach to collect annotated data, train base models, and migrate to proprietary ML models.

### Wearable Device Integration System
- **Dashboard Frontend** (`/wearable`): Interactive recharts LineCharts for BP/HR trends, date range filtering, anomaly alerts table, device stats cards.
- **Device Management UI**: Full CRUD operations for wearable devices with registration and deletion capabilities.
- **Web Bluetooth API Integration**: Client-side device pairing and data transmission for BP monitors using Web Bluetooth API.
- **Anomaly Detection**: Inline algorithm for blood pressure and heart rate, with activity-aware thresholds for heart rate.
- **Centralized Notification Service**: Integrated WhatsApp via Twilio and push notifications for high/low severity anomalies, with debouncing and user consent.
- **Background Scheduler**: Daily trend analysis detects consecutive elevated readings and creates proactive health trigger jobs.
- **Admin Proactive Triggers UI** (`/admin/proactive-triggers`): Complete admin interface for managing proactive health triggers with JSON-based condition/action configuration.
- **AI Conversation Context Integration**: Automatic wearable report integration in AI triage conversations, providing formatted wearable data to Gemma and Gemini models.
- **Security**: Device ownership validation and admin-only trigger management.

### Additional Features
- **Studio Address Integration**: System for in-person appointments including studioAddress field in availability and appointments, conditional UI, and email notifications.
- **Appointment Scheduling**: Calendar-based booking.
- **Patient Onboarding**: Collects health profile data.
- **Multi-Tenant B2B**: Supports clinic organizations with custom branding.
- **User Feedback System**: Management of user feedback.

## System Design Choices

### Security Audit (Nov 2025)
Comprehensive security review completed:
- **Authentication**: 159 middleware `isAuthenticated` checks across all protected routes
- **Input Validation**: 131 Zod schema validations (`safeParse`/schema usage) for request body/params
- **SQL Injection Prevention**: Drizzle ORM with parameterized queries (24 `sql` tag uses, all safe)
- **Authorization**: 186 `req.user` role/ownership checks
- **XSS Protection**: 4 `dangerouslySetInnerHTML` uses (admin-only pages: AdminEmailTemplates, AdminMarketing, DynamicContentPage, chart.tsx)
- **Secrets Management**: No hardcoded secrets, correct usage of environment variables
- **Future Enhancement**: Consider DOMPurify sanitization for admin HTML content rendering

### Deployment Architecture
- **Production Environment**: Hosted on Hetzner VPS with PM2, Neon PostgreSQL, Nginx, and Cloudflare SSL.
- **Build Systems**: Vite for frontend, esbuild for backend.
- **Version Control**: GitHub.
- **Deployment Workflow**: Involves committing changes, pulling to the server, rebuilding, restarting PM2, and purging Cloudflare cache.
- **Health Monitoring**: `/api/health` endpoint provides system status (uptime, timestamp, environment).
- **Automated Deploy**: `deploy.sh` script handles full deployment pipeline (backup, build, migration, restart, health check).
- **Login Logs Retention**: Automated daily cleanup of login logs older than 10 days via `LoginLogsScheduler`.

# External Dependencies

- **Stripe**: Payment processing for subscriptions.
- **Brevo (Sendinblue)**: Transactional emails and marketing.
- **Neon Database**: Serverless PostgreSQL with `pgvector` extension.
- **AI Infrastructure**:
    - **Primary (Production)**: Self-hosted Gemma Med via Ollama on Hetzner GPU server.
    - **Fallback (Cloud)**: Google Gemini AI (`gemini-2.5-pro`, `gemini-2.5-flash`).
    - **Strategy**: Automatic fallback to Gemini if the local Gemma model is unavailable.
- **Twilio**: For WhatsApp messaging capabilities.
- **Jitsi Meet**: For video teleconsultations.
- **OpenAI**: Whisper (Speech-to-Text) and TTS (Text-to-Speech) for voice functionalities.