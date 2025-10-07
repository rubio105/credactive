# Overview

CREDACTIVE ACADEMY is a professional online platform for quiz-based certification preparation across Cybersecurity, Compliance & Governance, Business & Innovation, and Leadership & Assessment. It offers quizzes, tracks progress, generates reports, and provides premium content via a €90/year Stripe subscription. The platform aims to be a leading destination for professional certifications, leveraging AI for large-scale question generation to eventually offer over 1,000,000 questions.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend

-   **Technology Stack**: React with TypeScript, Vite, shadcn/ui (Radix UI + Tailwind CSS) for UI.
-   **State Management**: TanStack Query for server state; local component state for UI.
-   **Routing**: Wouter for client-side navigation.
-   **Forms**: React Hook Form with Zod validation.
-   **UI/UX**: Utilizes `shadcn/ui` for a modern, consistent interface with features like featured categories, improved live course enrollment UX, and consistent admin panel navigation. Includes professional color wheel visualization for Insight Discovery personality reports.

## Backend

-   **Framework**: Express.js with Node.js and TypeScript.
-   **API Design**: RESTful, organized by feature.
-   **Authentication**: Email/password via Passport.js Local Strategy (bcrypt) and Google OAuth 2.0. Persistent sessions via `express-session` with PostgreSQL store. Email verification with 6-digit codes and secure password recovery.
-   **Email Service Integration**: Brevo for transactional emails (welcome, password reset, verification).
-   **Database Access**: Drizzle ORM for type-safe queries, shared schema.
-   **Security Measures**: Rate limiting on critical endpoints, Helmet.js security headers, CORS for Replit domains, XSS protection via DOMPurify, SQL injection prevention via Drizzle ORM.
-   **Build Process**: `tsx` for development, `esbuild` for production server bundle, `vite` for client bundle.

## Data Storage

-   **Database**: PostgreSQL (Neon's serverless driver).
-   **ORM**: Drizzle ORM with schema-first design.
-   **Schema Design**: Tables for Users (including Stripe data), Categories, Quizzes, Questions (JSONB for options), Quiz Generation Jobs, User progress, Reports (JSONB), Sessions, Live Courses, Static Content Pages, Email Templates, and Settings. Supports category images and audio explanations.
-   **Type Safety**: End-to-end type safety via Drizzle and shared schema.

## Key Features

-   **Quiz System**: Hierarchical structure (Categories > Quizzes > Questions), multiple choice with explanations. Supports shuffled questions, admin-controlled question rotation (10-100 questions or all), timed quizzes, server-side result generation with detailed reports.
-   **Insight Discovery Personality Reports**: Professional 72-type personality assessment system with enhanced features:
    - **Methodological Foundation**: Detailed introduction explaining Jung/Hippocrates color theory origins (5th century BC temperaments)
    - **72-Type Granular Classification**: Precise profiling system (vs. basic 4-color) with descriptive type names (e.g., "9 Leader Visionario", "23 Comunicatore Energico")
    - **Advanced Color Wheel Visualization**: 72-segment SVG wheel with 5° granularity, opacity-based percentage representation
    - **Team Value Analysis**: 5 key contributions the individual brings to team dynamics
    - **Communication Obstacles**: 6 potential barriers to effective communication based on color profile
    - **Opposite Type Analysis**: Describes complementary opposite personality with differences and collaboration strategies
    - **Comprehensive Sections**: Strengths, development areas, working style, communication patterns, leadership analysis, stress management, decision-making, all in formal Italian suitable for professional/consulting contexts
-   **Premium Features**: Most content requires an active Stripe subscription.
-   **AI Question Generation with Job Tracking**: Admin panel feature using OpenAI GPT-4o for bulk, context-aware question generation (1-1000 questions, configurable difficulty). Includes real-time generation tracking, and document-based exclusive generation via PDF upload (questions generated only from document content).
-   **Document Upload**: Quizzes can have optional PDF documents for AI question generation.
-   **Question Media**: Supports image uploads for questions and AI-generated text-to-speech (TTS) audio explanations (including personalized greetings).
-   **Live Courses**: System for purchasing one-time live courses via Stripe, including details, sessions, and enrollment tracking.
-   **Content Management System (CMS)**: Manages static content pages with rich text editing and dynamic placement in site navigation.
-   **Internationalization**: Multi-language support for home page, live courses, and an in-quiz language selector (IT/EN/ES) with dynamic audio language sync.
-   **Email Template Management**: Database-backed system for admin customization of transactional emails (welcome, verification, password reset) with dynamic variable substitution, preview mode, and intelligent fallback to hardcoded templates.
-   **Configuration Management**: Secure database-backed API key management for services (OpenAI, Stripe, Brevo) with dynamic loading, 5-minute TTL cache, and automatic instance reset on key updates for zero-downtime deployment.
-   **Admin Panel**: Comprehensive user management, quiz rotation control, and tab-based interface for managing content and settings.

# External Dependencies

-   **Stripe**: Payment processing, subscription management.
-   **Brevo (Sendinblue)**: Transactional email service.
-   **Neon Database**: Serverless PostgreSQL.
-   **OpenAI**: GPT-4o and GPT-4o-mini for AI question generation and text-to-speech (TTS).