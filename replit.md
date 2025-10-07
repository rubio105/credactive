# Overview

CREDACTIVE ACADEMY is a professional online platform designed for quiz-based certification preparation across various domains, including Cybersecurity, Compliance & Governance, Business & Innovation, and Leadership & Assessment. The platform offers quizzes, tracks user progress, generates detailed reports, and provides premium content accessible via a €90/year Stripe subscription. Features traditional email/password authentication with Brevo email service for password recovery and welcome emails. The strategic vision is to become the leading destination for professional certifications, utilizing AI for large-scale question generation to eventually offer over 1,000,000 questions.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes (October 2025)

-   **Email Verification System**: Implemented complete email verification system with 6-digit codes (15-minute expiry), secure endpoints with rate limiting and Zod validation, and auto-login after verification.
-   **Dashboard Bug Fix**: Fixed critical null-safety issue where dashboard would crash when leaderboardPosition was undefined. Added proper checks and fallbacks for new users without gamification data.

# Known Issues

-   **In-Quiz Language Selector**: The language selector (IT/EN/ES) translates UI elements but does not currently translate questions and answers during quiz execution due to a React state synchronization issue. The translation API backend works correctly - this is a frontend rendering issue that requires further investigation.
-   **Brevo Email Delivery**: BREVO_API_KEY is configured but returns 401 errors. Email verification codes are generated correctly and stored in the database, but external email delivery may fail. Users can still verify accounts by retrieving codes from server logs or database during testing.

# Admin Access

-   **Admin User**: v.pepoli@prohmed.ai (password: test123) - Full admin and premium privileges

# System Architecture

## Frontend

-   **Technology Stack**: React with TypeScript, Vite, shadcn/ui (Radix UI + Tailwind CSS) for UI.
-   **State Management**: TanStack Query for server state; local component state for UI.
-   **Routing**: Wouter for client-side navigation.
-   **Forms**: React Hook Form with Zod validation.
-   **Path Aliases**: `@/` for client, `@shared/` for shared types/schemas.

## Backend

-   **Framework**: Express.js with Node.js and TypeScript.
-   **API Design**: RESTful, organized by feature.
-   **Authentication**: Email/password authentication via Passport.js Local Strategy with bcrypt for password hashing; `express-session` with PostgreSQL store (httpOnly, secure cookies, 1-week TTL).
-   **Email Service**: Brevo for transactional emails (welcome emails, password reset with secure tokens, email verification with 6-digit codes).
-   **Database Access**: Drizzle ORM for type-safe queries, shared schema between frontend and backend.
-   **Security Measures**: 
    -   Rate limiting on critical endpoints (5 login attempts/15min, 3 registration/hour, 3 password resets/hour, 20 AI requests/hour)
    -   Helmet.js security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
    -   CORS configured for Replit domains with credentials support
    -   XSS protection via DOMPurify for user-generated content
    -   SQL injection prevention through Drizzle ORM parameterized queries
-   **Build Process**: `tsx` for development, `esbuild` for production server bundle, `vite` for client bundle.

## Data Storage

-   **Database**: PostgreSQL (Neon's serverless driver).
-   **ORM**: Drizzle ORM with schema-first design (`shared/schema.ts`).
-   **Schema Design**: Tables for Users (email, hashed password, email verification codes and expiry, password reset tokens, Stripe data), Categories, Quizzes, Questions (JSONB for options), Quiz Generation Jobs (tracks AI generation status and progress), User progress, Reports (JSONB), Sessions, Live Courses, Static Content Pages, and **Settings** (for API keys and configuration). Supports category images and audio explanations.
-   **Migrations**: Managed by drizzle-kit.
-   **Type Safety**: End-to-end type safety via Drizzle and shared schema.

## Configuration Management

-   **API Keys Storage**: Secure database-backed API key management system allowing admins to store and manage all service credentials (OpenAI, Stripe, Brevo, Gemini, Anthropic) via the Admin Panel "API" tab.
-   **Dynamic Key Loading**: All services (Stripe, OpenAI, Brevo) use lazy initialization with `getApiKey()` helper that loads credentials from database first, then falls back to environment variables.
-   **Cache Layer**: 5-minute TTL cache (`server/config.ts`) minimizes database queries while supporting immediate key rotation via `clearApiKeyCache()`.
-   **Instance Management**: Service instances (Stripe, OpenAI, Brevo) are automatically reset when API keys are updated through admin panel, ensuring new credentials take effect immediately without server restart.
-   **Zero-Downtime Deployment**: Application starts successfully without requiring any API keys in environment variables - keys can be configured post-deployment via admin interface.

## Authentication & Authorization

-   **Strategy**: Dual authentication system - traditional email/password via Passport.js Local Strategy with bcrypt hashing (10 rounds), plus direct Google OAuth 2.0 integration via passport-google-oauth20.
-   **Social Login**: Direct Google OAuth integration (no intermediate Replit Auth screen) using dynamic callback URLs that work across all deployment domains. Apple login removed per user preference.
-   **Session Management**: Persistent sessions via `express-session` with PostgreSQL store when available, falling back to in-memory store (1-week TTL, httpOnly, secure cookies).
-   **User Flow**: Unauthenticated users see landing page with access to login/register pages; authenticated users access home page; `isAuthenticated` middleware protects API routes.
-   **Email Verification**: New user registrations require email verification via 6-digit code (15-minute expiry). Users receive verification code via Brevo email, must enter code at `/verify-email` page before account activation. Endpoints protected with rate limiting and Zod validation to prevent brute force attacks. Auto-login after successful verification.
-   **Password Recovery**: Secure token-based password reset via Brevo email service (1-hour token expiration) for email/password accounts.
-   **Welcome Emails**: Automated welcome emails sent via Brevo upon successful email verification.

## Key Features

-   **Quiz System**: Hierarchical structure (Categories > Quizzes > Questions), multiple choice with explanations. Supports shuffled questions, **admin-controlled question rotation** via dropdown menu (10, 20, 30, 40, 50, 60, 70, 80, 90, 100 questions, or all), ensuring different random questions per attempt from the total pool. Timed quizzes, server-side result generation with detailed reports, and Insight Discovery personality assessments. Category filters available on landing and home pages. Includes categories like Cybersecurity, Ethical Hacking, Compliance & Governance, Business & Innovation, Assessment & Leadership.
-   **Premium Features**: Most content requires an active Stripe subscription.
-   **AI Question Generation with Job Tracking**: Admin panel feature using OpenAI GPT-4o for bulk, context-aware question generation (1-1000 questions, configurable difficulty). Features **real-time generation tracking** via `quiz_generation_jobs` table with status monitoring (pending → processing → completed/failed), automatic polling for status updates every 3 seconds, and admin notifications on completion. Supports **document-based exclusive generation** via PDF upload (max 600 pages, 50MB) - when a PDF is uploaded, AI generates questions **ONLY** from the document content, ensuring all questions are directly traceable to the source material. **Accurate Question Count**: Backend enforces exact question count limit (`questions.slice(0, count)`) to prevent AI over-generation.
-   **Document Upload**: Quizzes can have optional PDF documents (max 600 pages) for AI question generation. Backend uses pdf-parse to extract and validate content, storing documents in `/public/quiz-documents/`.
-   **Question Media**: Supports optional image uploads for questions and audio explanations (TTS) for question and extended explanations, generated via OpenAI. **Personalized TTS**: Extended audio explanations automatically greet the user by their first name on the first invocation within each quiz session, creating a more engaging learning experience.
-   **Live Courses**: Integrated system for purchasing one-time live courses via Stripe, including course details, sessions, and enrollment tracking. Supports multi-language courses.
-   **Content Management System (CMS)**: Manages static content pages (e.g., Privacy Policy, Terms of Service) with rich text editing, HTML sanitization, and dynamic placement in site navigation (header/footer).
-   **Internationalization**: Multi-language support for home page, live courses, and a prominent in-quiz language selector (IT/EN/ES) allowing users to switch quiz language independently of profile settings, with dynamic audio language sync.
-   **UI/UX**: Utilizes `shadcn/ui` for a modern, consistent interface. Includes features like featured categories on the home page, improved live course enrollment UX, and consistent navigation within the admin panel.
-   **Admin Panel Enhancements**: Comprehensive user management showing all registration data (demographics, contact info, consents including newsletter opt-in). Quiz rotation control allowing admins to limit questions per attempt. Tab-based admin interface at `/admin` for managing users, categories, quizzes, questions, live courses, content pages, and settings.

# External Dependencies

-   **Stripe**: Payment processing, subscription management, and secure payment UI.
-   **Brevo (Sendinblue)**: Transactional email service for password reset and welcome emails.
-   **Replit Platform Services**: Replit-specific Vite plugins, environment variables.
-   **Neon Database**: Serverless PostgreSQL.
-   **OpenAI**: GPT-4o and GPT-4o-mini models for AI-powered question generation and text-to-speech (TTS) audio for explanations.
-   **Security Libraries**: bcryptjs for password hashing, Helmet.js for HTTP headers, express-rate-limit for abuse prevention, CORS for cross-origin control, DOMPurify for XSS protection.
-   **UI Libraries**: Radix UI, Lucide React, Tailwind CSS.
-   **Development Tools**: TypeScript, ESBuild, Vite, TSX.