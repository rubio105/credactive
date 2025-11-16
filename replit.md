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

### Appointment Management System
The Doctor appointments page (`/appointments`) includes tabs for managing booked, available, and completed appointments, a monthly calendar view, and weekly schedule management for recurring availability slots.

### ML Training Data Collection System (Active Learning)
An architecture captures all platform interactions as `mlTrainingData` to train proprietary ML models, supporting a 12-month migration.

### Wearable Device Integration System
Includes a dashboard for trending BP/HR data, device management, Web Bluetooth API integration, anomaly detection, centralized notification services, and a background scheduler. Wearable data is integrated into AI conversation contexts.

### Patient Registration
Patients can register via doctor-provided referral links, automatically linking them to their doctor post-email verification. Registration requires privacy consents, and an invite-only mode can be configured.

### Twilio Video Integration (Embedded Video Calls)
CIRY features fully embedded video calls using Twilio Video, enabling in-app video consultations with a brandable UI. The backend provides secure access tokens, and the frontend `VideoCallRoom` component manages video/audio tracks and participant handling.

## System Design Choices

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