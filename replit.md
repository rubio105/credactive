# Overview

CIRY (Care & Intelligence Ready for You) is a B2B platform integrating health prevention and cybersecurity education. It offers professional certification prep with quizzes, progress tracking, and AI-powered health prevention tools. The platform aims to be a leader in dual-domain education, leveraging AI for content generation and comprehensive health prevention through conversational AI and medical document analysis. Ambitions include market expansion in both education sectors and continuous AI innovation to enhance user learning and well-being.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions

The frontend utilizes React, TypeScript, Vite, `shadcn/ui` (Radix UI + Tailwind CSS), TanStack Query, Wouter, and React Hook Form with Zod, ensuring a modern and consistent interface. Design elements include a professional color wheel visualization for personality reports, modern chat interfaces with avatar circles, bubble-style messages, typing indicators, and large input fields. Severity badges with icons and color-coding are used for medical reports. The UI is designed for role-based content display (patient vs. doctor) and features smooth transitions and hover effects.

The platform now features a comprehensive guide page (/guida) with modern, mobile-first responsive design. Cards use colored circular icons (blue, purple, orange) for visual hierarchy, with hover effects and smooth transitions. The guide includes practical examples with colored left borders, expandable FAQ accordions, and an admin-exclusive DLP (Data Loss Prevention) implementation guide with GDPR compliance checklist.

## Technical Implementations

### Frontend
Built with React, TypeScript, Vite, `shadcn/ui`, TanStack Query, Wouter, and React Hook Form with Zod. Implements Progressive Web App (PWA) capabilities with service worker for offline functionality and manifest.json for installable experience.

### Backend
Developed using Express.js, Node.js, and TypeScript, providing a RESTful API. Authentication is handled by Passport.js (local strategy with bcrypt) with persistent sessions. Drizzle ORM provides type-safe access to PostgreSQL. Security measures include rate limiting, Helmet.js, CORS, XSS protection, and SQL injection prevention.

### Data Storage
PostgreSQL (Neon's serverless driver) is managed by Drizzle ORM. The schema supports users (with health profiles), subscriptions, quizzes, progress tracking, reports, live courses, static content, email templates, settings, prevention documents, topics, triage, Prohmed codes, crosswords, audit logs, appointments, clinic organizations, and email notifications.

## Feature Specifications

### Core Features
*   **Comprehensive Quiz System**: Hierarchical structure, randomized questions, timed quizzes, and detailed reports.
*   **Insight Discovery Personality Reports**: 72-type assessment based on Jung/Hippocrates color theory.
*   **Premium Features**: Content access via Stripe subscription.
*   **AI Question Generation**: Admin functionality using OpenAI GPT-4o for bulk, context-aware question generation.
*   **Live Courses & Streaming**: System for purchasing and tracking live courses with real-time interactive learning.
*   **Content Management System (CMS)**: Manages static pages and dynamic navigation.
*   **Internationalization**: Multi-language support with in-quiz language selection and real-time AI translation.
*   **Database-Driven Subscription Plans**: Dynamic management with configurable limits and Stripe integration.
*   **Analytics Dashboard**: Comprehensive business intelligence metrics.
*   **AI Email Marketing System**: Intelligent campaign management using OpenAI GPT-4o and Brevo integration.
*   **SEO Optimization**: Dynamic meta tags and sitemap generation.
*   **Admin Dashboard**: Streamlined analytics-only dashboard.
*   **Corporate B2B Licensing System**: Enterprise solution for bulk license sales and corporate accounts.
*   **Leaderboard System**: Gamification features with global and corporate-exclusive leaderboards.
*   **AI Conversational Assistant**: Context-aware AI coaching using OpenAI GPT-4o for scenario-based learning.
*   **Interactive Crossword Game**: AI-generated medical crossword puzzles using Gemini AI.
*   **Health Score System**: AI-powered personal health scoring based on medical report analysis.
*   **Token Usage System**: Tiered monthly token limits for AI interactions.
*   **Webinar Health System**: Free webinar platform for prevention education.
*   **Professional Registration Workflow**: Doctor registration via contact request approval; public registration for personal access.
*   **Job Queue System**: Asynchronous processing for heavy tasks like medical document analysis.
*   **User Feedback System**: Intelligent collection and management of feedback.
*   **Patient Onboarding System**: Collects health profile data from new patients.
*   **Audit Log System**: GDPR-compliant access tracking for security and compliance.
*   **Appointment Scheduling System**: Complete calendar-based booking system for doctor-patient consultations with automated email workflow. Patients select dates and request visits via calendar UI, doctors manage availability slots and confirm/reject bookings, integrated Brevo email notifications (booking alerts to doctors, confirmation/cancellation to patients). Admin toggle control via settings panel. Features include patient notes, video meeting URLs, cancellation reasons, and status tracking (available/booked/confirmed/completed/cancelled).
*   **Multi-Tenant B2B Infrastructure**: Clinic organizations with custom branding, subscription tiers, and feature flags.
*   **Email Notification Queue**: Intelligent scheduling for automated notifications.

### Medical Prevention System (Prohmed Partnership)
Powered by Google Gemini AI, featuring medical document upload/analysis, an AI educational assistant ("AI Prohmed - Impara la Prevenzione"), and a medical alert system. Includes advanced UI for Prevention Index, Medical Reports, and Radiological Image Analysis with structured findings and AI confidence scoring. Enhanced with GDPR-compliant privacy disclaimers, Prohmed branding on reports, and role-based AI responses.

*   **Role-Based AI Analysis**: Dual-content system with `patientSummary` (simplified) and `doctorSummary` (medical terminology), diagnosis, prevention advice, and severity assessment.
*   **Medical Report Viewer Dialog**: 5-tab interface for radiological images, summary, overview, prevention, and medical values.
*   **Contextual AI Conversations**: AI chat includes the last 2 medical reports in conversation context for personalized health education.
*   **Demographic-Aware AI Responses**: AI considers user's age and gender for personalized health recommendations and screening schedules.
*   **Alert Follow-up System**: Intelligent medical alert tracking with user confirmation workflow.
*   **Patient-Only AI Access System**: Dedicated access for Prohmed code-based authentication to AI prevention features.
*   **AI-Only Access User Management**: Admin capability to create users with restricted access to only AI Prevention features.
*   **Doctor-Patient Linking System**: Medical referral system for doctors to monitor patients, generate 8-character linking codes, view linked patients, and create medical notes/reports integrated into patient document folders. Doctor UI hides non-medical elements.
*   **RAG Knowledge Base System**: PostgreSQL + pgvector for semantic search, using Gemini text-embedding-004 to generate embeddings for scientific documents, enriching AI triage responses with evidence-based medical context.

## System Design Choices

### Deployment Architecture
Production runs on `ciry.app` using a Hetzner VPS with PM2. Version control via GitHub. Neon PostgreSQL for the database. Build systems: esbuild (backend) and Vite (frontend). Production independence is ensured via BASE_URL environment variable.

# External Dependencies

*   **Stripe**: Payment processing and subscription management.
*   **Brevo (Sendinblue)**: Transactional email service.
*   **Neon Database**: Serverless PostgreSQL.
*   **OpenAI**: GPT-4o and GPT-4o-mini for AI question generation, text-to-speech, and AI conversational assistance.
*   **Google Gemini AI**: Gemini-2.5-pro and Gemini-2.5-flash for medical document analysis, conversational triage, and crossword puzzle generation.