# Overview

CIRY (Care & Intelligence Ready for You) is a B2B healthcare prevention platform that uses AI for medical document analysis, patient-doctor communication, and proactive health monitoring. Its main goal is to improve patient outcomes through early detection and personalized health management. The platform provides a REST API for integrations, offering comprehensive medical history, data storage, and doctor recommendations. CIRY is currently transitioning from Google Gemini AI to proprietary ML models using Active Learning.

# Recent Changes

## November 14, 2025
- **Doctor Registration Privacy Consents**: Added all 6 privacy consent checkboxes to doctor registration form matching patient registration flow (privacy policy, health data processing, terms & conditions as mandatory; marketing, commercial, scientific as optional). Form includes VisualSecurityPolicy component and privacy/terms dialogs. Custom validation ensures all mandatory consents are accepted before submission.
- **Critical RBAC Security Implementation**: Fixed severe authorization vulnerabilities where patients could access doctor-only routes by manually entering URLs. Created `isDoctor` middleware (server/authSetup.ts) applied to all 19 `/api/doctor/*` backend endpoints. Extended `ProtectedRoute` component with `requireDoctor` prop for frontend protection, applied to all 5 `/doctor/*` routes. Patient registration now explicitly sets `isDoctor: false` to prevent role escalation. All changes architect-reviewed and validated.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
The frontend is a React, TypeScript, Vite application utilizing `shadcn/ui`, TanStack Query, Wouter, and React Hook Form with Zod. Design principles include consistent internal navigation, role-based color theming (Patient: blue, Doctor: orange), a mobile-first approach with dedicated mobile navigation and role-aware dashboards, and color-coded medical alerts. Features such as real-time badge systems, responsive design, and WhatsApp notifications are implemented to enhance user experience. Doctor dashboards are designed with a 6-card grid layout for intuitive access to critical workflows. Login pages include a guard to redirect authenticated users to their role-appropriate dashboard.

## Technical Implementations

### Frontend
Built with React, TypeScript, Vite, `shadcn/ui`, TanStack Query, Wouter, React Hook Form with Zod, and PWA capabilities.

### Backend
Developed using Express.js, Node.js, and TypeScript, providing a RESTful API. It uses Passport.js for authentication and Drizzle ORM for type-safe PostgreSQL access, with security measures like rate limiting, Helmet.js, CORS, XSS protection, and SQL injection prevention.

### Data Storage
PostgreSQL, managed by Drizzle ORM, stores comprehensive data including user profiles, subscriptions, medical records, appointments, alerts, notifications, audit logs, ML training data, and wearable device monitoring data.

## Feature Specifications

### Medical Prevention System
CIRY offers AI-powered medical analysis (PDF/image OCR, radiological analysis, dual-content summaries, Prevention Index, contextual AI conversations), an AI-driven medical alert system with urgency levels, and a doctor-patient linking system for monitoring and secure note-sharing. It includes a RAG knowledge base using PostgreSQL + pgvector for semantic search and AI response enrichment, enhanced doctor contact flows, and AI-generated pre/post-visit patient reports. Critical (EMERGENCY/HIGH) alerts trigger immediate push notifications to linked doctors.

### Admin Features
A comprehensive Admin Dashboard (`/admin`) facilitates the management of users, subscriptions, medical alerts, and system configurations. It includes a robust user management system with role-based permissions, GDPR-compliant audit logging, and a detailed login audit system.

### Communication & Notifications
The platform includes an email notification queue, real-time push and in-app notification systems, and WhatsApp notifications for critical alerts and appointment reminders with OTP verification. It integrates voice-enabled AI chat using OpenAI Whisper and TTS, and a comprehensive Teleconsulto (teleconsultation) system with doctor availability management, smart slot picking, patient booking flows, automated multi-channel notifications, and Jitsi video integration. An automated appointment reminder system sends notifications 24 hours prior to appointments.

### ML Training Data Collection System (Active Learning)
An architecture is in place to intercept all platform interactions, collecting detailed `mlTrainingData` for training proprietary ML models, with a 12-month migration strategy.

### Wearable Device Integration System
Includes a dashboard for trending BP/HR data, device management (CRUD), Web Bluetooth API integration for data transmission, inline anomaly detection, centralized notification services (WhatsApp, push), and a background scheduler for proactive health triggers. Wearable data is automatically integrated into AI conversation contexts.

### Patient Registration
Patients can register via doctor-provided referral links, which automatically link them to their doctor post-email verification. Registration requires acceptance of mandatory privacy consents.

## System Design Choices

### Security Audit
A comprehensive security review confirms robust authentication, input validation, SQL injection prevention, authorization, and secure secrets management.

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