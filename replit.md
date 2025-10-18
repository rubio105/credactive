# Overview

CIRY (Care & Intelligence Ready for You) is a B2B platform specializing in dual-domain education: health prevention and cybersecurity. It offers professional certification prep, progress tracking, and AI-powered health prevention tools, aiming to be a market leader through continuous AI innovation, content generation, comprehensive health prevention via conversational AI, and medical document analysis.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions

The frontend is built with React, TypeScript, Vite, `shadcn/ui` (Radix UI + Tailwind CSS), TanStack Query, Wouter, and React Hook Form with Zod, ensuring a modern and consistent interface. Key design elements include professional color schemes, modern chat interfaces with avatars and typing indicators, and severity badges for medical reports. The UI supports role-based content display, smooth transitions, and hover effects.

Specific UI features include:
- A redesigned User Guide Page (`/guida`) with a gradient hero header, a 3-step timeline for patients, and role-specific sections.
- AI Prevention Chat features an AI assistant avatar with a blue shield icon and user avatars with initials.
- Patient Navigation is streamlined, offering a prevention-only platform for regular patients, integrated AI Chat Panel on the homepage, and specific dropdown menus.
- Emergency alerts are prioritized for display in the Prevention Index card; other alerts are hidden.
- Token Limits System has an inverted model: unlimited AI tokens for regular patients, and tiered limits for `aiOnlyAccess` users.
- A Premium Subscription System allows direct purchase via Stripe, unlocking enhanced features.
- Multi-Factor Authentication (MFA/2FA) is available for all users.
- A visual Prevention Index UI displays a circular score.
- Role-Based Homepage Routing directs users to `/admin`, `/doctor/patients`, `/prevention`, or the integrated AI Prevention home page based on their role.

## Technical Implementations

### Frontend
Developed using React, TypeScript, Vite, `shadcn/ui`, TanStack Query, Wouter, and React Hook Form with Zod, with PWA capabilities.

### Backend
Built with Express.js, Node.js, and TypeScript, providing a RESTful API. Authentication uses Passport.js with a local strategy (bcrypt) and persistent sessions. Drizzle ORM provides type-safe access to PostgreSQL. Security measures include rate limiting, Helmet.js, CORS, XSS, and SQL injection prevention.

### Data Storage
PostgreSQL (Neon's serverless driver) managed by Drizzle ORM. The schema supports various entities including users, subscriptions, quizzes, medical reports, and prevention documents.

## Feature Specifications

### Core Features
- **Comprehensive Quiz System**: Randomized, timed quizzes with detailed reports.
- **Insight Discovery Personality Reports**: 72-type assessment.
- **Premium Features**: Content access via Stripe subscription.
- **AI Question Generation**: Admin functionality using OpenAI GPT-4o.
- **Live Courses & Streaming**: Purchase and tracking of interactive courses.
- **Content Management System (CMS)**: Manages static and dynamic content.
- **Internationalization**: Multi-language support with real-time AI translation.
- **Database-Driven Subscription Plans**: Dynamic management with Stripe integration.
- **AI Email Marketing System**: Intelligent campaign management using OpenAI GPT-4o and Brevo.
- **Admin Dashboard**: Comprehensive management interface with 12 sections.
- **Corporate B2B Licensing System**: Enterprise solution.
- **AI Conversational Assistant**: Context-aware AI coaching using OpenAI GPT-4o.
- **Interactive Crossword Game**: AI-generated medical crosswords using Gemini AI.
- **Health Score System**: AI-powered personal health scoring from medical report analysis.
- **Token Usage System**: Inverted tiered model based on user type.
- **Webinar Health System**: Free platform for prevention education.
- **Professional Registration Workflow**: Doctor registration via approval; patient registration is admin-only.
- **Job Queue System**: Asynchronous processing for heavy tasks.
- **User Feedback System**: Complete feedback management for admins.
- **Patient Onboarding System**: Collects health profile data.
- **Audit Log System**: GDPR-compliant access tracking.
- **Appointment Scheduling System**: Calendar-based booking with email workflow.
- **Multi-Tenant B2B Infrastructure**: For clinic organizations.
- **Email Notification Queue & Push Notification System**: Intelligent scheduling and real-time browser notifications.
- **In-App Notification System**: Real-time notification bell with unread count and specific functionalities for doctor notes.
- **Admin User Management**: Comprehensive system for managing all user types.
- **ML Training Data Collection System**: Infrastructure for collecting Gemini API call data to migrate to proprietary ML models.

### Medical Prevention System (Prohmed Partnership)
Powered by Google Gemini AI, offering medical document upload/analysis, an AI educational assistant, and a medical alert system. Features include:
- **Prevention Index, Medical Reports, and Radiological Image Analysis**: With structured findings and AI confidence scoring.
- **Gemini Vision Medical Image Analysis**: Automatic detection and AI analysis for various radiological images, providing detailed anatomical locations and severity scoring.
- **Medical Alert System**: Triage-based system for urgent cases, generating alerts, notifying patients, assigning doctors, and enabling follow-ups.
- **Patient-Only AI Access System**: Dedicated access via Prohmed code-based authentication.
- **Doctor-Patient Linking System**: Medical referral system for doctors to monitor patients, generate linking codes, and create medical notes/reports.
- **RAG Knowledge Base System**: PostgreSQL + pgvector for semantic search using Gemini text-embedding-004 to enrich AI triage responses.
- **Enhanced Doctor Contact Flow**: AI prompts for doctor contact, with intelligent session closure.
- **Push Notifications for Medical Notes**: Doctors' notes trigger real-time web push notifications to patients.

## System Design Choices

### Deployment Architecture
Production runs on `ciry.app` using a Hetzner VPS with PM2, GitHub for version control, and Neon PostgreSQL. Build systems include esbuild (backend) and Vite (frontend). Production configuration uses Nginx as a reverse proxy, serves static assets directly, and loads environment variables via PM2. Push notifications are fully active. The deployment workflow involves pushing to GitHub, pulling changes via SSH, loading environment variables, running `npm run build`, restarting PM2, and purging Cloudflare cache.

# External Dependencies

*   **Stripe**: Payment processing and subscription management.
*   **Brevo (Sendinblue)**: Transactional email service and email marketing.
*   **Neon Database**: Serverless PostgreSQL.
*   **OpenAI**: GPT-4o and GPT-4o-mini for AI question generation, text-to-speech, and conversational assistance.
*   **Google Gemini AI**: Gemini-2.5-pro and Gemini-2.5-flash for medical document analysis, conversational triage, and crossword puzzle generation.