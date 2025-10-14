# Overview

CIRY (Care & Intelligence Ready for You) is a B2B platform focused on integrating health prevention and cybersecurity education. It offers professional certification preparation, including quizzes and progress tracking, alongside AI-powered health prevention tools. The platform aims to be a leader in dual-domain education, leveraging AI for generating vast numbers of quiz questions and providing comprehensive health prevention through conversational AI and medical document analysis. Key ambitions include expanding market reach in both cybersecurity and health education, and continuously innovating with AI to enhance user learning and well-being.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend

The frontend uses React with TypeScript, Vite, shadcn/ui (Radix UI + Tailwind CSS), TanStack Query, Wouter for routing, and React Hook Form with Zod. It provides a modern, consistent interface with features like a professional color wheel visualization for personality reports.

## Backend

The backend is built with Express.js, Node.js, and TypeScript, providing a RESTful API. Authentication uses Passport.js (local strategy with bcrypt) with persistent sessions. Drizzle ORM provides type-safe database access to PostgreSQL. Security measures include rate limiting, Helmet.js, CORS, XSS protection, and SQL injection prevention.

## Data Storage

PostgreSQL (Neon's serverless driver) is the database, managed by Drizzle ORM. The schema supports various features including Users (with Stripe data), Subscription Plans, Quizzes, Questions, User Progress, Reports, Live Courses, Static Content, Email Templates, Settings, Prevention Documents, Prevention Topics, Triage Sessions, Prohmed Codes, and Crossword Puzzles.

## Key Features

*   **Comprehensive Quiz System**: Hierarchical structure, randomized questions, timed quizzes, and detailed reports.
*   **Insight Discovery Personality Reports**: A 72-type assessment system based on Jung/Hippocrates color theory.
*   **Premium Features**: Content access via Stripe subscription.
*   **AI Question Generation**: Admin functionality using OpenAI GPT-4o for bulk, context-aware question generation from documents.
*   **Live Courses & Streaming**: System for purchasing and tracking live courses with real-time interactive learning via WebSockets.
*   **Content Management System (CMS)**: Manages static content pages and dynamic navigation.
*   **Internationalization**: Multi-language support with in-quiz language selection and real-time AI translation via OpenAI GPT-4o.
*   **Database-Driven Subscription Plans**: Dynamic subscription management with configurable limits and Stripe integration.
*   **Analytics Dashboard**: Comprehensive business intelligence metrics.
*   **AI Email Marketing System**: Intelligent campaign management using OpenAI GPT-4o and Brevo integration.
*   **SEO Optimization**: Dynamic meta tags and sitemap generation.
*   **Admin Panel**: User management, quiz rotation, content, settings, and analytics.
*   **Corporate B2B Licensing System**: Enterprise solution for bulk license sales, corporate accounts, and course assignments.
*   **Leaderboard System**: Gamification features with global and corporate-exclusive leaderboards.
*   **AI Conversational Assistant**: Context-aware AI coaching using OpenAI GPT-4o for scenario-based learning.
*   **Medical Prevention System (Prohmed Partnership)**: Comprehensive health prevention module powered by Google Gemini AI, featuring medical document upload/analysis, an AI educational assistant ("AI Prohmed - Impara la Prevenzione"), and a medical alert system. Includes advanced UI for Prevention Index, Medical Reports, and Radiological Image Analysis with structured findings and AI confidence scoring. Enhanced with GDPR-compliant privacy disclaimers detailing anonymization algorithms, professional Prohmed branding on all reports, and role-based AI responses (doctor vs. patient) for personalized medical communication. Interactive radiological image viewer displays findings with visual markers on medical images.
    *   **Role-Based AI Analysis**: Dual-content system generating differentiated medical summaries. `aiAnalysis` field (JSONB) contains `patientSummary` (simplified language), `doctorSummary` (medical terminology), `diagnosis`, `prevention` advice, and `severity` assessment (normal/moderate/urgent). UI automatically displays appropriate version based on user.isDoctor flag with color-coded severity badges.
    *   **Medical Report Viewer Dialog**: Comprehensive dialog system (`MedicalReportViewerDialog`) with 5-tab interface: Radiological Images (with visual markers), Riepilogo (role-aware summary), Panoramica (overview/diagnosis), Prevenzione (prevention advice), and Valori Medici (medical values). Severity badges with icons displayed in both card and dialog views.
    *   **Contextual AI Conversations**: AI chat automatically includes last 2 medical reports in conversation context, enabling intelligent responses to queries like "Raccontami l'ultimo referto". System passes patient/doctor summaries, diagnosis, and prevention data to enhance personalized health education.
    *   **Example Scenarios UI**: Patient AI interface features 4 pre-defined conversation starters including "Raccontami l'ultimo referto", hypertension prevention, cholesterol management, and age-appropriate screening recommendations.
    *   **Recent Documents Home Display**: Home page shows 3 most recent medical documents with "View All" link to full repository in prevention section, providing quick access to latest health data without cluttering the interface.
    *   **Demographic-Aware AI Responses**: AI system considers user's age (calculated from date of birth) and gender for personalized health recommendations. For patients (non-doctors), AI adapts screening schedules (mammography, prostate, colonoscopy), risk factor assessment, and prevention strategies based on demographic profile. Age-specific considerations include pediatric vs adult vs elderly evaluations, while gender-specific factors include menopause, andropause, and gender-related health concerns.
    *   **Alert Follow-up System**: Intelligent medical alert tracking with user confirmation workflow. When AI detects concerning symptoms, system creates alerts with status tracking (pending → monitoring → user_resolved). Users receive contextual welcome messages asking about alert resolution. "Yes, resolved" closes the alert; "No" keeps it in monitoring status and prompts AI conversation. Alerts persist across sessions until user confirms resolution, with response history tracking (userResolved, userResolvedAt, followupResponse fields).
*   **Interactive Crossword Game**: AI-generated medical crossword puzzles using Gemini AI, integrated with quizzes, leaderboards, and daily generation limits.
*   **Health Score System**: AI-powered personal health scoring based on medical report analysis (PDF and images), PII anonymization, and conversational AI.
*   **Token Usage System**: Tiered monthly token limits for AI interactions with database tracking and UI indicators.
*   **Webinar Health System**: Free webinar platform for prevention education with expert speakers, automated reminders, and admin management.
*   **Patient-Only AI Access System**: Dedicated access for Prohmed code-based authentication, allowing patients to interact with AI prevention features and view medical reports.
*   **AI-Only Access User Management**: Admin capability to create dedicated AI-only users (aiOnlyAccess flag) who can access ONLY the AI Prevention features, with restricted navigation hiding all quiz/course/analytics sections for focused medical consultation use cases.
*   **Professional Registration Workflow**: Doctor registration requires contact request approval (medici@ciry.app). Public registration page shows two access types: "Accesso Professionale" (contact request form: name, email, phone, specialization) and "Accesso Personale" (full registration). Admin panel includes "Richieste Professionali" section to approve/reject professional contact requests. Approved requests require manual doctor account creation by admin with subsequent email notification to complete onboarding.
*   **Doctor-Patient Linking System**: Comprehensive medical referral system enabling doctors to monitor and report on their patients' health data. Doctors receive unique 8-character alphanumeric codes (auto-generated, copyable) for patient linking. Patients can link to doctors via code entry with validation (10-patient limit per doctor enforced). Doctor dashboard displays linked patients with management capabilities (view/unlink), consolidated alert monitoring across all patients with severity indicators and timestamps, and refertazione capabilities to create medical notes/reports sent directly to patient document folders. Backend provides role-based API endpoints (/api/doctor/*) with isDoctor authentication guards, storage methods for code generation, patient linking/unlinking, alert retrieval, and note creation. Database schema includes doctorPatientLinks table (doctorId, patientId, linkedAt) and doctorNotes table (doctorId, patientId, title, content, attachments). TypeScript type safety ensured via Express.User augmentation (server/global.d.ts) extending interface with User schema fields. UI segregation hides courses and prevention index from doctor home view, replacing with clinical dashboard featuring patient list, alert triage panel, and refertazione dialog with file attachment support.
*   **Job Queue System**: Asynchronous processing infrastructure for heavy tasks like medical document analysis (OCR, PII removal, radiological imaging analysis) with progress tracking and retry logic.
*   **RAG Knowledge Base System**: PostgreSQL + pgvector-based semantic search for medical AI specialization. Gemini text-embedding-004 (768 dimensions) generates embeddings for scientific documents chunked at 500 tokens with 50-token overlap. HNSW indexing enables fast similarity search, enriching AI triage responses with evidence-based medical context automatically retrieved from uploaded scientific literature.

## Deployment Architecture

The production environment runs on **ciry.app** using a Hetzner VPS with PM2 process manager. Version control is managed through GitHub. The database is Neon PostgreSQL (serverless). Build systems are esbuild (backend) and Vite (frontend).

**Production Independence**: Platform uses BASE_URL environment variable for all URL construction (emails, OAuth callbacks, CORS), ensuring complete deployment flexibility across any hosting provider.

# External Dependencies

*   **Stripe**: Payment processing and subscription management.
*   **Brevo (Sendinblue)**: Transactional email service.
*   **Neon Database**: Serverless PostgreSQL.
*   **OpenAI**: GPT-4o and GPT-4o-mini for AI question generation and text-to-speech.
*   **Google Gemini AI**: Gemini-2.5-pro and Gemini-2.5-flash for medical document analysis, conversational triage, and crossword puzzle generation.