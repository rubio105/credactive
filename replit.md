# Overview

CIRY (Care & Intelligence Ready for You) is a B2B platform designed for dual-domain education in health prevention and cybersecurity. It offers professional certification preparation, progress tracking, and AI-powered health prevention tools. The platform aims to be a leader by leveraging AI for content generation, comprehensive health prevention through conversational AI, and medical document analysis. Its ambitions include market expansion in both education sectors and continuous AI innovation to enhance user learning and well-being.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions

The frontend uses React, TypeScript, Vite, `shadcn/ui` (Radix UI + Tailwind CSS), TanStack Query, Wouter, and React Hook Form with Zod for a modern and consistent interface. Design includes professional color wheel visualization for personality reports, modern chat interfaces with avatars, bubble-style messages, and typing indicators. Severity badges with icons and color-coding are used for medical reports. The UI supports role-based content display (patient vs. doctor) and features smooth transitions and hover effects. A comprehensive guide page (`/guida`) is mobile-first, using colored circular icons, hover effects, expandable FAQ accordions, and an admin-exclusive DLP implementation guide.

**Patient Navigation (October 2025 Update)**: Regular patients (non-aiOnlyAccess) experience a **prevention-only platform** with NO quiz/cybersecurity content. Home page displays AI Chat Panel integrated inline, medical reports section, and prevention-focused welcome banner. SEO metadata reflects "AI Prevenzione" focus. AI-only access users auto-redirect to `/prevention`. Clean navbar with logo and user menu only. Patient dropdown menu shows: AI Prevenzione, Abbonamento, separator, Sicurezza, Documenti, optional Corporate/Upgrade. **Completely removed** for regular patients: Dashboard, Webinar, Quiz, Classifica, Certificati, Analytics, Corsi sections, all quiz-related queries/data fetching.

## Technical Implementations

### Frontend
Built with React, TypeScript, Vite, `shadcn/ui`, TanStack Query, Wouter, and React Hook Form with Zod. It includes Progressive Web App (PWA) capabilities with a service worker for offline functionality.

### Backend
Developed using Express.js, Node.js, and TypeScript, providing a RESTful API. Authentication is handled by Passport.js (local strategy with bcrypt) with persistent sessions. Drizzle ORM provides type-safe access to PostgreSQL. Security measures include rate limiting, Helmet.js, CORS, XSS protection, and SQL injection prevention.

### Data Storage
PostgreSQL (Neon's serverless driver) is managed by Drizzle ORM. The schema supports various entities including users, subscriptions, quizzes, progress, reports, courses, content, email templates, prevention documents, and audit logs.

## Feature Specifications

### Core Features
- **Comprehensive Quiz System**: Hierarchical structure, randomized questions, timed quizzes, and detailed reports.
- **Insight Discovery Personality Reports**: 72-type assessment based on Jung/Hippocrates color theory.
- **Premium Features**: Content access via Stripe subscription.
- **AI Question Generation**: Admin functionality using OpenAI GPT-4o for bulk, context-aware question generation.
- **Live Courses & Streaming**: System for purchasing and tracking live courses with real-time interactive learning.
- **Content Management System (CMS)**: Manages static pages and dynamic navigation.
- **Internationalization**: Multi-language support with in-quiz language selection and real-time AI translation.
- **Database-Driven Subscription Plans**: Dynamic management with configurable limits and Stripe integration.
- **Analytics Dashboard**: Comprehensive business intelligence metrics.
- **AI Email Marketing System**: Intelligent campaign management using OpenAI GPT-4o and Brevo integration.
- **SEO Optimization**: Dynamic meta tags and sitemap generation.
- **Admin Dashboard**: Streamlined analytics-only dashboard.
- **Corporate B2B Licensing System**: Enterprise solution for bulk license sales and corporate accounts.
- **Leaderboard System**: Gamification features with global and corporate-exclusive leaderboards.
- **AI Conversational Assistant**: Context-aware AI coaching using OpenAI GPT-4o for scenario-based learning.
- **Interactive Crossword Game**: AI-generated medical crossword puzzles using Gemini AI.
- **Health Score System**: AI-powered personal health scoring based on medical report analysis.
- **Token Usage System**: Tiered monthly token limits for AI interactions.
- **Webinar Health System**: Free webinar platform for prevention education.
- **Professional Registration Workflow**: Doctor registration via contact request approval; public registration for personal access.
- **Job Queue System**: Asynchronous processing for heavy tasks like medical document analysis.
- **User Feedback System**: Allows users to submit feedback with type categorization and optional rating; admin can view all feedback.
- **Patient Onboarding System**: Collects health profile data from new patients.
- **Audit Log System**: GDPR-compliant access tracking for security and compliance.
- **Appointment Scheduling System**: Calendar-based booking for doctor-patient consultations with automated email workflow and conditional routing.
- **Multi-Tenant B2B Infrastructure**: Clinic organizations with custom branding, subscription tiers, and feature flags.
- **Email Notification Queue**: Intelligent scheduling for automated notifications.
- **Push Notification System**: Web Push API with VAPID for secure, real-time browser notifications, including admin broadcast capabilities.
- **Admin User Management**: Comprehensive system for creating and managing all user types (Patients, Doctors, Admins, AI-Only Access) with role-based editing, search, and deletion capabilities.
- **Admin Feature Management**: Full administration interfaces for Webinars, Email Templates (Brevo), AI Marketing (OpenAI GPT-4o), and RAG Knowledge Base management.
- **Role-specific Navigation**: Enhanced navigation for patients, doctors, and admins with dedicated pages and content based on user roles.

### Medical Prevention System (Prohmed Partnership)
Powered by Google Gemini AI, featuring medical document upload/analysis, an AI educational assistant, and a medical alert system. Includes advanced UI for Prevention Index, Medical Reports, and Radiological Image Analysis with structured findings and AI confidence scoring. Enhanced with GDPR-compliant privacy, Prohmed branding, and role-based AI responses.
- **Role-Based AI Analysis**: Dual-content system with `patientSummary` and `doctorSummary`.
- **Medical Report Viewer Dialog**: 5-tab interface for radiological images, summary, overview, prevention, and medical values.
- **Contextual AI Conversations**: AI chat automatically includes the last 2 medical reports in conversation context. When a new report is uploaded during an active triage session, the system creates an automatic notification message and the report becomes immediately available in subsequent AI responses.
- **Demographic-Aware AI Responses**: AI considers user's age and gender for personalized health recommendations.
- **Medical Alert System (Alert Medici)**:
  - **Purpose**: Triage-based medical alert system for urgent cases requiring doctor attention
  - **Database Schema**: `medicalAlerts` table with userId, severity (low/medium/high/critical), triageData (JSON), message, isConfirmed, confirmedAt, and doctor assignment
  - **API Endpoints**:
    - `POST /api/prevention/alert` - Create alert from AI triage assessment
    - `GET /api/alerts` - User retrieves their alerts
    - `POST /api/alerts/:id/confirm` - User confirms alert receipt
    - `GET /api/doctor/alerts` - Doctor retrieves assigned patient alerts
  - **Workflow**: AI triage creates alerts for concerning health indicators → Patient notified → Doctor assigned → Patient confirms receipt → Doctor can track follow-up
  - **Integration**: Connected to AI triage system, automatic severity assessment based on medical analysis
  - **Admin Interface**: View all alerts, severity distribution, confirmation rates, and doctor assignment status
  - **Status**: Backend infrastructure complete, admin UI placeholder ready for full alert management dashboard
- **Patient-Only AI Access System**: Dedicated access for Prohmed code-based authentication to AI prevention features.
- **AI-Only Access User Management**: Admin capability to create users with restricted access to only AI Prevention features.
- **Doctor-Patient Linking System**: Medical referral system for doctors to monitor patients, generate linking codes, view linked patients, and create medical notes/reports.
- **Patient Documents Page**: Centralized `/documenti` page for patients to manage doctor connections (via linking code input), view medical notes from linked doctors, and monitor medical alerts. Accessible via patient dropdown menu.
- **RAG Knowledge Base System**: PostgreSQL + pgvector for semantic search, using Gemini text-embedding-004 to generate embeddings for scientific documents, enriching AI triage responses.

## System Design Choices

### Deployment Architecture
Production runs on `ciry.app` using a Hetzner VPS with PM2. Version control via GitHub. Neon PostgreSQL for the database. Build systems: esbuild (backend) and Vite (frontend).

# External Dependencies

*   **Stripe**: Payment processing and subscription management.
*   **Brevo (Sendinblue)**: Transactional email service and email marketing.
*   **Neon Database**: Serverless PostgreSQL.
*   **OpenAI**: GPT-4o and GPT-4o-mini for AI question generation, text-to-speech, and AI conversational assistance.
*   **Google Gemini AI**: Gemini-2.5-pro and Gemini-2.5-flash for medical document analysis, conversational triage, and crossword puzzle generation.