# Overview

CIRY (Care & Intelligence Ready for You) is a B2B platform focused on dual-domain education in health prevention and cybersecurity. It provides professional certification preparation, progress tracking, and AI-powered health prevention tools. The platform aims to be a leader by leveraging AI for content generation, comprehensive health prevention through conversational AI, and medical document analysis, with ambitions for market expansion and continuous AI innovation.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions

The frontend utilizes React, TypeScript, Vite, `shadcn/ui` (Radix UI + Tailwind CSS), TanStack Query, Wouter, and React Hook Form with Zod for a modern and consistent interface. Design elements include professional color wheel visualization, modern chat interfaces with avatars, bubble messages, typing indicators, and severity badges for medical reports. The UI supports role-based content display, smooth transitions, and hover effects. A mobile-first guide page includes circular icons, hover effects, expandable FAQs, and an admin-exclusive DLP guide.

**AI Prevention Chat Design**: AI assistant avatar displays a blue shield icon, user avatars show initials on a blue-indigo gradient.

**Patient Navigation**: Regular patients (non-aiOnlyAccess) access a prevention-only platform, excluding quiz/cybersecurity content. The homepage features an integrated AI Chat Panel, medical reports section, and prevention-focused banner. SEO metadata emphasizes "AI Prevenzione." AI-only access users are redirected to `/prevention`. The navbar is clean, with a logo and user menu (Premium badge removed from avatar area for cleaner UI). Patient dropdown includes AI Prevenzione, Sicurezza, Webinari, Documenti, and optional Corporate/Passa a Premium. Quiz-related sections and data are completely removed for regular patients.

**Token Limits System (Inverted Model)**:
- Regular Patients (prevention-only): Unlimited AI tokens, no limits enforced, no token UI displayed.
- aiOnlyAccess Users (quiz/cybersecurity): Token limits enforced (120 free, 1000 premium, unlimited premium_plus).
- Implementation: Frontend checks `user.aiOnlyAccess` to conditionally render token UI; backend returns `tokenLimit: -1` for regular patients, and triage skips token validation for them.

**Premium Subscription System**: A `/subscribe` page allows direct purchase of Premium (€29/month) via Stripe checkout, updating `user.isPremium` upon success. Premium benefits include 1000 monthly AI tokens, unlimited AI conversations, medical document upload, personalized reports, 2 weekly televisits, exclusive webinars, full platform access, and 24/7 medical contact.

**Multi-Factor Authentication (MFA/2FA)**: Available to all users via `/security` page with backend endpoints for enabling, verifying, and disabling MFA.

**Prevention Index UI**: A visual placeholder on `/prevention` displays a circular score (static 85/100) when no alerts are present, with an emerald-themed design.

**Role-Based Homepage Routing**: The home page (`/`) redirects users to their role-specific dashboard: Admin to `/admin`, Doctors to `/doctor/patients`, AI-only access to `/prevention`, and normal Patients to the integrated AI Prevention home page.

## Technical Implementations

### Frontend
Built with React, TypeScript, Vite, `shadcn/ui`, TanStack Query, Wouter, and React Hook Form with Zod, including PWA capabilities.

### Backend
Developed using Express.js, Node.js, and TypeScript, offering a RESTful API. Authentication uses Passport.js (local strategy with bcrypt) and persistent sessions. Drizzle ORM provides type-safe access to PostgreSQL. Security features include rate limiting, Helmet.js, CORS, XSS, and SQL injection prevention.

### Data Storage
PostgreSQL (Neon's serverless driver) managed by Drizzle ORM. The schema supports users, subscriptions, quizzes, progress, reports, courses, content, email templates, prevention documents, and audit logs.

## Feature Specifications

### Core Features
- **Comprehensive Quiz System**: Hierarchical, randomized, timed quizzes with detailed reports.
- **Insight Discovery Personality Reports**: 72-type assessment based on Jung/Hippocrates.
- **Premium Features**: Content access via Stripe subscription.
- **AI Question Generation**: Admin functionality using OpenAI GPT-4o for bulk, context-aware question generation.
- **Live Courses & Streaming**: Purchase and tracking of interactive live courses.
- **Content Management System (CMS)**: Manages static and dynamic content.
- **Internationalization**: Multi-language support with in-quiz language selection and real-time AI translation.
- **Database-Driven Subscription Plans**: Dynamic management with configurable limits and Stripe integration.
- **Analytics Dashboard**: Business intelligence metrics.
- **AI Email Marketing System**: Intelligent campaign management using OpenAI GPT-4o and Brevo.
- **SEO Optimization**: Dynamic meta tags and sitemap generation.
- **Admin Dashboard**: Streamlined analytics-only dashboard.
- **Corporate B2B Licensing System**: Enterprise solution for bulk license sales.
- **Leaderboard System**: Gamification features.
- **AI Conversational Assistant**: Context-aware AI coaching using OpenAI GPT-4o.
- **Interactive Crossword Game**: AI-generated medical crosswords using Gemini AI.
- **Health Score System**: AI-powered personal health scoring from medical report analysis.
- **Token Usage System**: Inverted tiered model; regular patients have unlimited tokens, `aiOnlyAccess` users have tiered limits.
- **Webinar Health System**: Free webinar platform for prevention education.
- **Professional Registration Workflow**: Doctor registration via contact request approval; public registration for personal access.
- **Job Queue System**: Asynchronous processing for heavy tasks like medical document analysis.
- **User Feedback System**: Allows user feedback submission with admin viewing.
- **Patient Onboarding System**: Collects health profile data.
- **Audit Log System**: GDPR-compliant access tracking.
- **Appointment Scheduling System**: Calendar-based booking for doctor-patient consultations with email workflow.
- **Multi-Tenant B2B Infrastructure**: Clinic organizations with custom branding and features.
- **Email Notification Queue**: Intelligent scheduling for automated notifications.
- **Push Notification System**: Web Push API for real-time browser notifications, including admin broadcasts.
- **Admin User Management**: Comprehensive system for managing all user types with role-based editing, search, and deletion.
- **Admin Feature Management**: Administration interfaces for Webinars, Email Templates, AI Marketing, and RAG Knowledge Base.
- **Role-specific Navigation**: Enhanced navigation for patients, doctors, and admins based on user roles.

### Medical Prevention System (Prohmed Partnership)
Powered by Google Gemini AI, offering medical document upload/analysis, an AI educational assistant, and a medical alert system. Features include a Prevention Index, Medical Reports, and Radiological Image Analysis with structured findings and AI confidence scoring. Enhanced with GDPR compliance, Prohmed branding, and role-based AI responses.
- **Role-Based AI Analysis**: Dual-content system with `patientSummary` and `doctorSummary`.
- **Medical Report Viewer Dialog**: 5-tab interface for various medical data.
- **Contextual AI Conversations**: AI chat includes the last 2 medical reports; new reports during triage trigger notifications and are immediately available to AI.
- **Demographic-Aware AI Responses**: AI considers user's age and gender for personalized recommendations.
- **Medical Alert System**: Triage-based system for urgent cases, creating alerts from AI assessment, notifying patients, assigning doctors, and enabling patient confirmation and doctor follow-up. Backend infrastructure is complete, with an admin UI placeholder.
- **Patient-Only AI Access System**: Dedicated access for Prohmed code-based authentication to AI prevention features.
- **AI-Only Access User Management**: Admin capability to create users with restricted access to AI Prevention.
- **Doctor-Patient Linking System**: Medical referral system for doctors to monitor patients, generate linking codes, view linked patients, and create medical notes/reports.
- **Patient Documents Page**: Centralized `/documenti` page for managing doctor connections, viewing medical notes, and monitoring medical alerts.
- **RAG Knowledge Base System**: PostgreSQL + pgvector for semantic search using Gemini text-embedding-004 to enrich AI triage responses with scientific documents.
- **Enhanced Doctor Contact Flow**: After AI messages prompt "Contatta Medico Prohmed," the conversation continues, with AI asking a follow-up question. If the user responds negatively (e.g., "no", "basta"), the session automatically closes.
- **Push Notifications for Medical Notes**: Doctors creating notes trigger real-time web push notifications for patients, directing them to the `/documenti` page.

## System Design Choices

### Deployment Architecture
Production runs on `ciry.app` using a Hetzner VPS with PM2, GitHub for version control, and Neon PostgreSQL. Build systems include esbuild (backend) and Vite (frontend).

# External Dependencies

*   **Stripe**: Payment processing and subscription management.
*   **Brevo (Sendinblue)**: Transactional email service and email marketing.
*   **Neon Database**: Serverless PostgreSQL.
*   **OpenAI**: GPT-4o and GPT-4o-mini for AI question generation, text-to-speech, and AI conversational assistance.
*   **Google Gemini AI**: Gemini-2.5-pro and Gemini-2.5-flash for medical document analysis, conversational triage, and crossword puzzle generation.