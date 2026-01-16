# Overview

CIRY (Care & Intelligence Ready for You) is a B2B healthcare prevention platform that uses AI for medical document analysis, patient-doctor communication, and proactive health monitoring. Its main goal is to improve patient outcomes through early detection and personalized health management. The platform offers a REST API for integrations, providing detailed medical history, data storage, and AI-driven doctor recommendations. CIRY is moving towards using proprietary ML models with Active Learning to become a leader in B2B healthcare prevention with its strong, AI-powered solution.

# User Preferences

Preferred communication style: Simple, everyday language.
Working environment: Production server (Hetzner VPS 157.180.21.147)
Deploy command: `cd /var/www/credactive && git pull origin main && npm run build && pm2 restart credactive`

# System Architecture

## UI/UX Decisions
The frontend uses React, TypeScript, Vite, `shadcn/ui`, TanStack Query, Wouter, and React Hook Form with Zod. It features consistent internal navigation, role-based color theming (Patient: blue, Doctor: orange), a mobile-first approach with dedicated mobile navigation, and role-aware dashboards. The application includes a responsive view system with a 768px breakpoint, adapting to different screen sizes.

## Technical Implementations

### Frontend
Built with React, TypeScript, Vite, `shadcn/ui`, TanStack Query, Wouter, React Hook Form with Zod, and PWA capabilities.

### Backend
Developed using Express.js, Node.js, and TypeScript, providing a RESTful API. It uses Passport.js for authentication and Drizzle ORM for type-safe PostgreSQL access, with security features like rate limiting, Helmet.js, CORS, XSS protection, and SQL injection prevention.

### Data Storage
PostgreSQL, managed by Drizzle ORM, stores user profiles, subscriptions, medical records, appointments, alerts, notifications, audit logs, ML training data, and wearable device monitoring data.

## Feature Specifications

### Medical Prevention System
CIRY offers AI-powered medical analysis (OCR, radiological analysis, summaries, Prevention Index, contextual AI conversations), an AI-driven medical alert system with urgency levels, and a doctor-patient linking system. It includes a RAG knowledge base using PostgreSQL + pgvector, enhanced doctor contact flows, and AI-generated pre/post-visit patient reports.

### Admin Features
A comprehensive Admin Dashboard (`/admin`) allows for user, subscription, medical alert, and system configuration management, along with robust user management with role-based permissions and GDPR-compliant audit logging.

### Communication & Notifications
The platform integrates an email notification queue, real-time push and in-app notifications, and WhatsApp notifications for critical alerts and appointment reminders. It features voice-enabled AI chat using OpenAI Whisper and TTS, and a Teleconsulto system with doctor availability, smart slot picking, patient booking, automated notifications, and embedded Twilio Video calls for in-app video consultations. WhatsApp notifications support OTP verification, a fallback mechanism for template failures, and free-form messages for general notifications, all with security measures like rate-limiting and Zod validation.

### Appointment Management System
The Doctor appointments page (`/appointments`) includes tabs for managing booked, available, and completed appointments, a monthly calendar view, and weekly schedule management for recurring availability slots. The system automatically generates slots from recurring doctor availability, ensuring double-booking prevention through atomic database transactions with `SELECT FOR UPDATE` and a `UNIQUE(doctor_id, start_time)` constraint.

### ML Training Data Collection System (Active Learning)
An architecture captures all platform interactions as `mlTrainingData` to train proprietary ML models, supporting a 12-month migration.

### Wearable Device Integration System
Includes a dashboard for trending BP/HR data, device management, Web Bluetooth API integration, anomaly detection, centralized notification services, and a background scheduler. Wearable data is integrated into AI conversation contexts.

### Patient Registration
Patients can register via doctor-provided referral links, automatically linking them to their doctor post-email verification. Registration requires privacy consents, and an invite-only mode can be configured. Role assignment logic differentiates access based on referral code usage.

### Twilio Video Integration (Embedded Video Calls)
CIRY features fully embedded video calls using Twilio Video, enabling in-app video consultations with a brandable UI. The backend provides secure access tokens, and the frontend `VideoCallRoom` component manages video/audio tracks and participant handling. It includes a mirrored self-view for local video tracks and ensures patients cannot join completed appointments.

### AI Medical Report Generation (Teleconsult Reports)
A complete automated workflow generates, edits, and distributes AI-powered medical reports from teleconsult video calls. This involves auto-recording Twilio calls, transcribing them using OpenAI Whisper, and AI analysis by Gemini AI to generate structured medical reports with mandatory sections (Sintesi Diagnostica, Proposta Terapeutica, Piano di Follow-up). Doctors review and edit these reports before final distribution via email and WhatsApp. Editable Prevention Reports allow doctors to create and share prevention plans with patients, including document attachments. All reports are stored as `mlTrainingData` for Active Learning.

### Prohmed Refertazione Massiva System
A dedicated medical report workflow for bulk document processing with strict role segregation:
- **Operators** (`/operatore/referti`): Upload PDF/image documents with patient info. Operators can only upload, not review.
- **Doctors** (`/refertatore/referti`): Review AI-generated draft reports, edit, and sign with OTP verification. Doctors can only review, not upload.
- **Admin** (`/admin/referti`): Manage all reports and assign operators to doctors.
- **AI Processing**: Documents are analyzed with OCR/text extraction, AI generates draft reports with structured sections.
- **OTP Signature**: Doctors sign reports via SMS or WhatsApp OTP (5-minute expiry, max 5 attempts).
- **PDF Generation**: Signed PDFs include Prohmed logo (`attached_assets/image_1768563399301.png`).
- **Audit Trail**: Complete logging in `report_activity_logs` table for compliance (upload, ai_processed, reviewed, edited, otp_sent, signed).
- **Database Tables**: `report_documents`, `report_signature_otps`, `report_activity_logs`.
- **User Roles**: `isReportOperator`, `isReportDoctor`, `assignedReportDoctorId` fields in users table.

## System Design Choices

### Base URL Configuration
All backend-generated URLs are centralized through the `getBaseUrl()` helper function, ensuring consistent URL generation across the backend with a priority logic that includes environment variables, production defaults, and development fallbacks.

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