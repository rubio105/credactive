# Overview

CIRY (Care & Intelligence Ready for You) is a B2B healthcare prevention platform that uses AI for medical document analysis, patient-doctor communication, and proactive health monitoring. Its main goal is to improve patient outcomes through early detection and personalized health management. The platform offers a REST API for integrations, providing comprehensive medical history, data storage, and doctor recommendations. CIRY is transitioning from Google Gemini AI to proprietary ML models using Active Learning, aiming to secure a significant market share in B2B healthcare prevention with its robust, AI-powered solution.

# Recent Changes

## November 15, 2025
- **Alert Consolidation**: Removed "Alert Pazienti" section from doctor home dashboard (`DoctorDashboard.tsx` component). Medical alerts are now exclusively shown in the dedicated `/doctor/alerts` page, eliminating redundancy and providing a focused alert management interface.
- **Patient Quick Actions Restructuring**: Simplified patient AI quick actions in prevention page (`SuggestedActions.tsx`):
  - Removed "Come sta la mia salute?" button
  - Added "🔬 Quali esami devo fare?" - Opens dialog with AI exam recommendations based on age, lifestyle, and medical history
  - Made "📄 Analizza il mio referto" always visible - Opens dialog that checks report age (warns if >3 months old) and provides detailed AI analysis
  - Added "🛡️ Percorso di prevenzione" - Moved from "Strumenti Avanzati" section to main quick actions
  - Kept "🏥 Prenota una visita" button
- **Strumenti Avanzati Simplification**: Reduced "Strumenti Avanzati" section in prevention page to only show "Carica Documenti" button, removing duplicate "Percorso di Prevenzione" button (now in quick actions)
- **Auto-close Pending Conversations**: Modified `startTriageMutation` in prevention page to automatically close any pending active session before starting a new conversation, eliminating multiple confirmation dialogs and providing seamless conversation flow

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
The frontend uses React, TypeScript, Vite, `shadcn/ui`, TanStack Query, Wouter, and React Hook Form with Zod. It features consistent internal navigation, role-based color theming (Patient: blue, Doctor: orange), a mobile-first approach with dedicated mobile navigation, and role-aware dashboards. The application includes a responsive view system with a 768px breakpoint, automatically adapting to screen size.

## Technical Implementations

### Frontend
Built using React, TypeScript, Vite, `shadcn/ui`, TanStack Query, Wouter, React Hook Form with Zod, and PWA capabilities.

### Backend
Developed with Express.js, Node.js, and TypeScript, providing a RESTful API. It uses Passport.js for authentication and Drizzle ORM for type-safe PostgreSQL access, with security measures including rate limiting, Helmet.js, CORS, XSS protection, and SQL injection prevention.

### Data Storage
PostgreSQL, managed by Drizzle ORM, stores user profiles, subscriptions, medical records, appointments, alerts, notifications, audit logs, ML training data, and wearable device monitoring data.

## Feature Specifications

### Medical Prevention System
CIRY offers AI-powered medical analysis (OCR, radiological analysis, summaries, Prevention Index, contextual AI conversations), an AI-driven medical alert system with urgency levels, and a doctor-patient linking system. It includes a RAG knowledge base using PostgreSQL + pgvector, enhanced doctor contact flows, and AI-generated pre/post-visit patient reports.

### Admin Features
A comprehensive Admin Dashboard (`/admin`) allows management of users, subscriptions, medical alerts, and system configurations, including robust user management with role-based permissions and GDPR-compliant audit logging.

### Communication & Notifications
The platform integrates an email notification queue, real-time push and in-app notifications, and WhatsApp notifications for critical alerts and appointment reminders. It features voice-enabled AI chat using OpenAI Whisper and TTS, and a Teleconsulto system with doctor availability, smart slot picking, patient booking, automated notifications, and **embedded Twilio Video calls** for in-app video consultations.

### Appointment Management System
Doctor appointments page (`/appointments`) includes 5 tabs:
- **Prenotate**: List of booked appointments with patient details, status badges, and action buttons (confirm, cancel, complete, no-show)
- **Disponibili**: Available appointment slots created by doctor
- **Completate**: Historical completed appointments
- **Calendario**: Monthly calendar view (CalendarView component) showing all appointments with 8 color-coded statuses (available, pending, booked, confirmed, completed, cancelled, no_show, rescheduled), includes interactive legend, loading/empty states, and click handlers to open appointment details
- **Disponibilità**: Weekly schedule management for creating recurring availability slots

**Known Limitation**: Calendar click currently opens basic status dialog; future enhancement needed for full appointment detail view with all actions.

### ML Training Data Collection System (Active Learning)
An architecture captures all platform interactions as `mlTrainingData` to train proprietary ML models, supporting a 12-month migration.

### Wearable Device Integration System
Includes a dashboard for trending BP/HR data, device management, Web Bluetooth API integration, anomaly detection, centralized notification services, and a background scheduler. Wearable data is integrated into AI conversation contexts.

### Patient Registration
Patients can register via doctor-provided referral links, automatically linking them to their doctor post-email verification. Registration requires privacy consents, and an invite-only mode can be configured.

### Twilio Video Integration (Embedded Video Calls)
CIRY now features **fully embedded video calls** using Twilio Video, replacing external Jitsi redirects. This enables:
- **In-app video consultations**: Patients and doctors connect directly within CIRY without external windows
- **Mobile-ready architecture**: Video calls embedded in the app for future mobile deployment
- **Brandable UI**: Custom CIRY-branded video interface with role-based colors (blue for patients, orange for doctors)
- **Backend**: POST `/api/video/token` endpoint generates secure Twilio Video access tokens for authenticated users
- **Frontend**: `VideoCallRoom` component manages video/audio tracks, participant handling, and responsive controls
- **Patient flow**: `/teleconsulto` page → "Entra in Chiamata" button → embedded video room
- **Doctor flow**: `/doctor/appointments` page → "Entra in Chiamata" button → embedded video room with doctor branding

## System Design Choices

### Security Audit
A comprehensive security review confirms robust authentication, input validation, SQL injection prevention, authorization (RBAC), and secure secrets management.

### Deployment Architecture
Production is on Hetzner VPS with PM2, Neon PostgreSQL, Nginx, and Cloudflare SSL. The system uses Vite for frontend builds and esbuild for backend. Deployment involves GitHub, a `deploy.sh` script, and health monitoring via `/api/health`.

# External Dependencies

-   **Stripe**: Payment processing for subscriptions.
-   **Brevo (Sendinblue)**: Transactional emails and marketing communications.
-   **Neon Database**: Serverless PostgreSQL with `pgvector` extension.
-   **AI Infrastructure**:
    -   **Primary**: Self-hosted Gemma Med via Ollama.
    -   **Fallback**: Google Gemini AI (`gemini-2.5-pro`, `gemini-2.5-flash`).
-   **Twilio**: WhatsApp messaging, OTP verification, and **Twilio Video** for embedded video calls.
-   **OpenAI**: Whisper (Speech-to-Text) and TTS (Text-to-Speech).