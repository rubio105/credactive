# Overview

CIRY (Care & Intelligence Ready for You) is a B2B healthcare prevention platform leveraging AI for medical document analysis, patient-doctor communication, and proactive health monitoring. Its core purpose is to enhance patient outcomes through early detection and personalized health management. The platform provides a REST API for integrations, offering comprehensive medical history, data storage, and doctor recommendations. CIRY is transitioning from Google Gemini AI to proprietary ML models using Active Learning. The project aims to capture a significant market share in the B2B healthcare prevention sector by providing a robust, AI-powered solution that improves efficiency and patient care.

# Recent Changes

## November 14, 2025
- **Doctor Alerts Fix**: Corrected API endpoint in `doctor-alerts.tsx` from `/api/alerts` to `/api/doctor/alerts` to resolve 403 authorization errors
- **Health Reports Display**: Added "Referti AI" section to documents page (`/documenti`) showing AI-analyzed health reports with:
  - Report metadata (filename, type, date, issuer)
  - AI-generated summary preview
  - Urgency badges based on radiological findings
  - List of urgent/attention findings from radiological analysis
  - PDF download functionality via `/api/health-score/reports/:id/pdf`
  - Backward compatibility for legacy data formats
- **API Endpoint Standardization**: Updated health reports query endpoint from non-existent `/api/health-score/reports/my` to standard `/api/health-score/reports` in both `documenti.tsx` and `patient-ai.tsx`
- **Type Safety**: Created shared `HealthReport` type in `client/src/types/healthReport.ts` with helper functions for date formatting and urgency level calculation, including defensive checks for legacy data formats
- **Navigation Improvements**:
  - **Desktop Menu Visibility**: Central navigation menu (Dashboard, Pazienti, Appuntamenti, Referti, etc.) now displays ONLY on home routes:
    * Patients: visible only on `/dashboard`
    * Doctors: visible only on `/doctor-patients`
    * Other pages: menu hidden to avoid duplication with DesktopNavigation
  - **Mobile Back Buttons**: Removed all "Torna indietro" buttons in mobile view (<768px) by updating `BackButton.tsx` to use `useViewMode` hook
  - **Path Corrections**: Fixed all doctor routes from `/doctor/...` to `/doctor-...` format (e.g., `/doctor-patients`, `/doctor-appointments`, `/doctor-reports`, `/doctor-alerts`)
- **Admin Interface Isolation**:
  - **DesktopNavigation**: Admin users no longer see patient/doctor navigation tabs (Home, Impostazioni, Guida, Sicurezza, Dispositivi)
  - **BottomNavigation**: Admin users no longer see mobile bottom navigation in viewport < 768px
  - **AdminLayout**: Complete design refresh with:
    * Blue-indigo gradient header with Shield icon
    * Modern sidebar with backdrop blur and shadow-xl
    * Active state: gradient blue-indigo with white side indicator
    * Smooth hover transitions with color-changing icons
    * Logout button with rotation animation on hover
    * Content area with subtle gradient background and max-width for readability
    * Improved back button styling with blue hover state
  - **Result**: Admins now have a completely isolated experience using only AdminLayout with dedicated sidebar, no patient/doctor navigation elements visible
- **Notifications Bug Fix**: Fixed critical bug where notifications remained unread after marking them as read
  - **Root Cause**: Frontend components used incorrect field name `isRead` instead of `read` from database schema
  - **Files Fixed**:
    * `client/src/pages/notifiche.tsx`: Changed all occurrences from `isRead` to `read`
    * `client/src/hooks/useNotificationBadge.ts`: Changed interface and filter logic from `isRead` to `read`
  - **Impact**: Notification badge and notification list now correctly update when user marks notifications as read
  - **Technical**: All components now align with `shared/schema.ts` where notifications table defines `read: boolean` field
- **Email Links Configuration**: Password reset emails use `BASE_URL` environment variable for link generation
  - **Production Setup**: `BASE_URL=https://ciry.app` must be set on Hetzner VPS for correct email links
  - **Fallback Logic**: `getBaseUrl()` in `server/email.ts` prioritizes BASE_URL > REPLIT_DOMAINS > localhost:5000
  - **Note**: Since production is on Hetzner VPS (not Replit), REPLIT_DOMAINS doesn't apply, so BASE_URL is required

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
The frontend is built with React, TypeScript, Vite, `shadcn/ui`, TanStack Query, Wouter, and React Hook Form with Zod. Key design principles include consistent internal navigation, role-based color theming (Patient: blue, Doctor: orange), a mobile-first approach with dedicated mobile navigation, and role-aware dashboards. Features such as real-time badge systems, responsive design, and color-coded medical alerts enhance user experience. Doctor dashboards utilize a 6-card grid layout. Login pages redirect authenticated users to their appropriate dashboard.

### Responsive View System
The application features an automatic responsive view system managed by `ViewModeContext` with a 768px breakpoint. It dynamically adapts to screen size, displaying a horizontal navigation bar for desktop (>= 768px) and a dedicated mobile navigation for smaller screens (< 768px). The system automatically switches views upon window resizing, and there is no manual view mode selector for simplified user experience. The effective mode is synchronized to the `data-view-mode` attribute on the HTML element for conditional styling.

## Technical Implementations

### Frontend
Built using React, TypeScript, Vite, `shadcn/ui`, TanStack Query, Wouter, React Hook Form with Zod, and PWA capabilities.

### Backend
Developed with Express.js, Node.js, and TypeScript, offering a RESTful API. It employs Passport.js for authentication and Drizzle ORM for type-safe PostgreSQL access, with robust security measures including rate limiting, Helmet.js, CORS, XSS protection, and SQL injection prevention.

### Data Storage
PostgreSQL, managed by Drizzle ORM, stores comprehensive data including user profiles, subscriptions, medical records, appointments, alerts, notifications, audit logs, ML training data, and wearable device monitoring data.

## Feature Specifications

### Medical Prevention System
CIRY provides AI-powered medical analysis (OCR for PDFs/images, radiological analysis, dual-content summaries, Prevention Index, contextual AI conversations), an AI-driven medical alert system with urgency levels, and a doctor-patient linking system for monitoring and secure note-sharing. It includes a RAG knowledge base utilizing PostgreSQL + pgvector, enhanced doctor contact flows, and AI-generated pre/post-visit patient reports. Critical alerts trigger immediate push notifications to linked doctors.

### Admin Features
A comprehensive Admin Dashboard (`/admin`) allows management of users, subscriptions, medical alerts, and system configurations. It includes a robust user management system with role-based permissions, GDPR-compliant audit logging, and a detailed login audit system.

### Communication & Notifications
The platform integrates an email notification queue, real-time push and in-app notification systems, and WhatsApp notifications for critical alerts and appointment reminders with OTP verification. It features voice-enabled AI chat using OpenAI Whisper and TTS, and a comprehensive Teleconsulto (teleconsultation) system with doctor availability management, smart slot picking, patient booking flows, automated multi-channel notifications, and Jitsi video integration. An automated appointment reminder system sends notifications 24 hours prior.

### ML Training Data Collection System (Active Learning)
An architecture is in place to intercept all platform interactions, collecting detailed `mlTrainingData` for training proprietary ML models, supporting a 12-month migration strategy.

### Wearable Device Integration System
Includes a dashboard for trending BP/HR data, device management (CRUD), Web Bluetooth API integration for data transmission, inline anomaly detection, centralized notification services, and a background scheduler for proactive health triggers. Wearable data is automatically integrated into AI conversation contexts.

### Patient Registration
Patients can register via doctor-provided referral links, which automatically link them to their doctor post-email verification. Registration requires acceptance of mandatory privacy consents, and an invite-only mode can be configured by admins, defaulting to requiring doctor codes.

## System Design Choices

### Security Audit
A comprehensive security review confirms robust authentication, input validation, SQL injection prevention, authorization (with critical RBAC implementation), and secure secrets management.

### Deployment Architecture
Production is hosted on Hetzner VPS with PM2, Neon PostgreSQL, Nginx, and Cloudflare SSL. The system uses Vite for frontend builds and esbuild for backend. Deployment involves GitHub for version control, a `deploy.sh` script for automated pipelines, and health monitoring via `/api/health`. Automated daily cleanup for login logs is also implemented.

# External Dependencies

-   **Stripe**: Payment processing for subscriptions.
-   **Brevo (Sendinblue)**: Transactional emails and marketing communications.
-   **Neon Database**: Serverless PostgreSQL with `pgvector` extension for vector embeddings.
-   **AI Infrastructure**:
    -   **Primary**: Self-hosted Gemma Med via Ollama.
    -   **Fallback**: Google Gemini AI (`gemini-2.5-pro`, `gemini-2.5-flash`).
-   **Twilio**: WhatsApp messaging and OTP verification.
-   **Jitsi Meet**: Video teleconsultations.
-   **OpenAI**: Whisper (Speech-to-Text) and TTS (Text-to-Speech).