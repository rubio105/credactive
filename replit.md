# Overview

CREDACTIVE (formerly IBI ACADEMY) is a professional online platform designed for quiz-based certification preparation across various domains, including Cybersecurity, Compliance & Governance, Business & Innovation, and Leadership & Assessment. The platform offers quizzes, tracks user progress, generates detailed reports, and provides premium content accessible via a €90/year Stripe subscription. Features traditional email/password authentication with Brevo email service for password recovery and welcome emails. The strategic vision is to become the leading destination for professional certifications, utilizing AI for large-scale question generation to eventually offer over 1,000,000 questions.

# User Preferences

Preferred communication style: Simple, everyday language.

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
-   **Email Service**: Brevo for transactional emails (welcome emails, password reset with secure tokens).
-   **Database Access**: Drizzle ORM for type-safe queries, shared schema between frontend and backend.
-   **Build Process**: `tsx` for development, `esbuild` for production server bundle, `vite` for client bundle.

## Data Storage

-   **Database**: PostgreSQL (Neon's serverless driver).
-   **ORM**: Drizzle ORM with schema-first design (`shared/schema.ts`).
-   **Schema Design**: Tables for Users (email, hashed password, password reset tokens, Stripe data), Categories, Quizzes, Questions (JSONB for options), User progress, Reports (JSONB), Sessions, Live Courses, and Static Content Pages. Supports category images and audio explanations.
-   **Migrations**: Managed by drizzle-kit.
-   **Type Safety**: End-to-end type safety via Drizzle and shared schema.

## Authentication & Authorization

-   **Strategy**: Traditional email/password authentication using Passport.js Local Strategy with bcrypt for secure password hashing (10 rounds).
-   **Session Management**: Persistent sessions via `express-session` with PostgreSQL store (1-week TTL, httpOnly, secure cookies).
-   **User Flow**: Unauthenticated users see landing page with access to login/register pages; authenticated users access home page; `isAuthenticated` middleware protects API routes.
-   **Password Recovery**: Secure token-based password reset via Brevo email service (1-hour token expiration).
-   **Welcome Emails**: Automated welcome emails sent via Brevo upon successful registration.

## Key Features

-   **Quiz System**: Hierarchical structure (Categories > Quizzes > Questions), multiple choice with explanations. Supports shuffled questions, customizable quiz lengths (10, 20, 30, 50, 100, or all questions), timed quizzes, server-side result generation with detailed reports, and Insight Discovery personality assessments. Category filters available on landing and home pages. Includes categories like Cybersecurity, Ethical Hacking, Compliance & Governance, Business & Innovation, Assessment & Leadership.
-   **Premium Features**: Most content requires an active Stripe subscription.
-   **AI Question Generation**: Admin panel feature using OpenAI GPT-4o for bulk, context-aware question generation (1-1000 questions, configurable difficulty), with background processing and persistence. Supports **document-based generation** via PDF upload (max 600 pages, 50MB) - questions are generated from the document content using extracted text as context.
-   **Document Upload**: Quizzes can have optional PDF documents (max 600 pages) for AI question generation. Backend uses pdf-parse to extract and validate content, storing documents in `/public/quiz-documents/`.
-   **Question Media**: Supports optional image uploads for questions and audio explanations (TTS) for question and extended explanations, generated via OpenAI.
-   **Live Courses**: Integrated system for purchasing one-time live courses via Stripe, including course details, sessions, and enrollment tracking. Supports multi-language courses.
-   **Content Management System (CMS)**: Manages static content pages (e.g., Privacy Policy, Terms of Service) with rich text editing, HTML sanitization, and dynamic placement in site navigation (header/footer).
-   **Internationalization**: Multi-language support for home page, live courses, and a prominent in-quiz language selector (IT/EN/ES) allowing users to switch quiz language independently of profile settings, with dynamic audio language sync.
-   **UI/UX**: Utilizes `shadcn/ui` for a modern, consistent interface. Includes features like featured categories on the home page, improved live course enrollment UX, and consistent navigation within the admin panel.

# External Dependencies

-   **Stripe**: Payment processing, subscription management, and secure payment UI.
-   **Brevo (Sendinblue)**: Transactional email service for password reset and welcome emails.
-   **Replit Platform Services**: Replit-specific Vite plugins, environment variables.
-   **Neon Database**: Serverless PostgreSQL.
-   **OpenAI**: GPT-4o and GPT-4o-mini models for AI-powered question generation and text-to-speech (TTS) audio for explanations.
-   **Security Libraries**: bcryptjs for password hashing.
-   **UI Libraries**: Radix UI, Lucide React, Tailwind CSS.
-   **Development Tools**: TypeScript, ESBuild, Vite, TSX.