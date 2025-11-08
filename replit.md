# Overview

CIRY (Care & Intelligence Ready for You) is a B2B healthcare prevention platform leveraging AI for medical document analysis, patient-doctor communication, and preventive health monitoring. Its core purpose is to improve patient outcomes through early detection and personalized health management, initially using Google Gemini AI with a strategic plan to transition to proprietary ML models via Active Learning. The platform also includes a REST API for external app integration (e.g., ProhMed) to support features like medical history context, data storage, and doctor contact recommendations.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions

The frontend is built with React, TypeScript, Vite, `shadcn/ui` (Radix UI + Tailwind CSS), TanStack Query, Wouter, and React Hook Form with Zod. The design emphasizes medical professionalism through:
- **Color-Coded Medical Alerts**: Four urgency levels (EMERGENCY, HIGH, MEDIUM, LOW) using healthcare-appropriate colors.
- **Role-Based Homepage Tabs**: Distinct tabs for Patients ("Prevenzione", "I Tuoi Referti", "Appuntamenti") and Doctors ("I Tuoi Pazienti", "Shortcuts Rapidi").
- **Responsive Design**: Adapts for mobile and desktop views, including abbreviated labels and stacked tabs on smaller screens.
- **WhatsApp Notifications**: User-configurable notifications for critical alerts.
- **Navigation Improvements**: Enhanced user flows with features like back buttons and clear UI labels.
- Additional features include a user guide, AI prevention chat, emergency alerts, premium subscription system, MFA, and role-based routing.

## Technical Implementations

### Frontend
Built with React, TypeScript, Vite, `shadcn/ui`, TanStack Query, Wouter, React Hook Form with Zod, and PWA capabilities.

### Backend
Developed using Express.js, Node.js, and TypeScript, providing a RESTful API. It uses Passport.js for authentication (local strategy with bcrypt) and Drizzle ORM for type-safe PostgreSQL access. Security measures include rate limiting, Helmet.js, CORS, XSS protection, and SQL injection prevention.

### Data Storage
PostgreSQL, managed by Drizzle ORM, stores data for users, subscriptions, medical reports, prevention documents, doctor notes, appointments, triage sessions, alerts, notifications, audit logs, ML training data, and wearable device monitoring (devices, blood pressure readings, proactive health triggers, notifications).

## Feature Specifications

### Medical Prevention System
- **AI-Powered Medical Analysis**: Utilizes AI for PDF/image analysis (with OCR), radiological image analysis, dual-content summaries, a Prevention Index score, contextual AI conversations, and demographic-aware health advice.
- **Medical Alert System**: AI-driven triage generating alerts with urgency levels, automated notifications, and doctor assignments.
- **Doctor-Patient Linking System**: Enables doctors to monitor patients using linking codes, create categorized medical notes, and attach files, with real-time patient notifications.
- **Patient Documents Page**: A centralized hub for patients to view doctor connections, medical notes, and alerts.
- **RAG Knowledge Base System**: Employs PostgreSQL + pgvector and Gemini text-embedding-004 for semantic search, enriching AI responses with scientific medical documents.
- **Enhanced Doctor Contact Flow**: AI-guided prompts for doctor contact.

### Admin Features
- **Admin Dashboard**: A comprehensive dashboard (`/admin`) for managing users, subscriptions, medical alerts, webinars, feedback, email templates, AI marketing, knowledge base, and notifications.
- **User Management System**: Allows creation, editing, and deletion of all user types with role-based permissions.
- **Audit Log System**: GDPR-compliant tracking of data access with filtering and export capabilities.
- **Professional Registration Workflow**: Doctors register via contact request and admin approval; patient registration is admin-only.

### Communication & Notifications
- **Email Notification Queue**: Intelligent scheduling for transactional emails.
- **Push Notification System**: Real-time browser notifications with auto-cleanup of stale subscriptions, detailed logging, and success metrics.
- **In-App Notification System**: Real-time notification bell with unread count, priority levels, and custom icons.
- **WhatsApp Notifications**: Automated messaging for critical alerts and appointment reminders via Twilio, with user consent and admin control.
- **Voice-Enabled AI Chat**: Accessibility features via Web Speech API for speech-to-text and text-to-speech, with interactive controls.
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
- **Database Schema**: Four tables support continuous health monitoring: `wearableDevices`, `bloodPressureReadings`, `proactiveHealthTriggers`, and `proactiveNotifications`.
- **API Endpoints**: For device management, blood pressure ingestion (with inline anomaly detection), readings history, and anomaly detection.
- **Security Features**: Device ownership validation and support for manual readings.
- **Anomaly Detection**: Inline algorithm flags blood pressure readings with severity levels.
- **Extensible Architecture**: Supports multiple device types.

### Additional Features
- **Appointment Scheduling**: Calendar-based booking.
- **Patient Onboarding**: Collects health profile data.
- **Multi-Tenant B2B**: Supports clinic organizations with custom branding.
- **User Feedback System**: Management of user feedback.

## System Design Choices

### Deployment Architecture
- **Production Environment**: Hosted on Hetzner VPS with PM2, Neon PostgreSQL, Nginx, and Cloudflare SSL.
- **Build Systems**: Vite for frontend, esbuild for backend.
- **Version Control**: GitHub.
- **Deployment Workflow**: Involves committing changes, pulling to the server, rebuilding, restarting PM2, and critically, purging Cloudflare cache.

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