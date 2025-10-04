# Overview

IBI ACADEMY is a professional online platform for quiz-based certification preparation across Cybersecurity, Compliance & Governance, Business & Innovation, and Leadership & Assessment domains. It offers quizzes, progress tracking, detailed reports, and premium content via a €90/year Stripe subscription. The platform aims to be the #1 destination for professional certifications, leveraging AI for massive question generation to offer over 1,000,000 questions.

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
-   **Authentication**: Replit Auth (OIDC) via Passport.js; express-session with PostgreSQL store.
-   **Database Access**: Drizzle ORM for type-safe queries, shared schema between frontend and backend.
-   **Build Process**: `tsx` for development, `esbuild` for production server bundle, `vite` for client bundle.

## Data Storage

-   **Database**: PostgreSQL (Neon's serverless driver).
-   **ORM**: Drizzle ORM with schema-first design (`shared/schema.ts`).
-   **Schema Design**: Tables for Users (auth, Stripe), Categories, Quizzes, Questions (JSONB for options), User progress, Reports (JSONB), Sessions, Live Courses, and Static Content Pages.
-   **Migrations**: Managed by drizzle-kit.
-   **Type Safety**: End-to-end type safety via Drizzle and shared schema.

## Authentication & Authorization

-   **Strategy**: Replit Auth handles OIDC.
-   **Session Management**: Persistent sessions via `express-session` with PostgreSQL (1-week TTL, httpOnly, secure cookies).
-   **User Flow**: Unauthenticated users see landing page, authenticated users access home page, `isAuthenticated` middleware protects API routes.
-   **User Data**: OIDC claims upserted to database post-auth.

## Quiz System

-   **Structure**: Hierarchical (Categories > Quizzes > Questions), supports multiple choice with explanations.
-   **Flow**: Shuffled questions, timed quizzes, server-side result generation with detailed reports.
-   **Reports**: Standard quiz reports (score, weak areas, recommendations) and Insight Discovery personality assessments.
-   **Categories**: Cybersecurity, Ethical Hacking, Compliance & Governance, Business & Innovation, Assessment & Leadership.
-   **Premium Features**: Most content requires an active Stripe subscription.
-   **AI Question Generation**: Admin panel feature using OpenAI GPT-4o for bulk, context-aware question generation (1-1000 questions, configurable difficulty). Supports background processing and automatic persistence.
-   **Question Images**: Supports optional image uploads (max 5MB) for visual questions, stored in `public/question-images/`.
-   **Live Courses**: Integrated system for purchasing one-time live courses via Stripe, with course details, sessions, and enrollment tracking.
-   **Content Management**: System for static content pages (e.g., Privacy Policy, Terms of Service) with rich text editing, HTML sanitization, and public API access.
-   **Language Selection**: Quiz interface includes always-visible language toggle (IT/EN) allowing users to choose quiz language regardless of profile settings. Useful for international certifications like CISSP, CISM that can be taken in multiple languages.

# External Dependencies

-   **Stripe**: Payment processing, subscription management, and secure payment UI (Stripe SDK, Stripe Elements).
-   **Replit Platform Services**: Replit Auth (OIDC), Replit-specific Vite plugins, environment variables.
-   **Neon Database**: Serverless PostgreSQL.
-   **OpenAI**: GPT-4o model for AI-powered question generation.
-   **UI Libraries**: Radix UI, Lucide React, Tailwind CSS.
-   **Development Tools**: TypeScript, ESBuild, Vite, TSX.

# Recent Changes (October 2025)

- **Category Image Upload & Display** (October 4, 2025): Complete system for category images
  - Admin Panel: Image upload field in category management (already existed)
  - QuizCard Component: Displays category image if available, falls back to gradient+icon
  - Error Handling: Automatic fallback if image fails to load
  - Type Safety: Normalizes empty/null imageUrl to undefined throughout the flow
  - Visual Design: Image cards show dark gradient overlay for text readability

- **Home Page Multi-Language Support** (October 4, 2025): Internationalization of home page
  - Created translations system for IT, EN, ES, FR languages
  - Home page content now displays in user's preferred language (set during registration)
  - Includes translations for: welcome message, stats labels, premium banner, category titles
  - Translation system in client/src/lib/translations.ts
  - Automatically uses user's language preference from profile

- **Live Courses Language Support** (October 4, 2025): Added language field to live courses
  - Database: Added `language` column to live_courses table (values: it, en, es)
  - Admin Panel: Language selector with flags (🇮🇹 Italiano, 🇬🇧 English, 🇪🇸 Español)
  - Frontend: Language badge displayed prominently in LiveCourseModal
  - Clear visibility: Language shown with instructor and duration in course details
  - Default: Italian (it) for new courses

- **Quiz Language Selector** (October 4, 2025): Enhanced language selection for quiz interface
  - Language toggle now always visible during quizzes (previously hidden for English users)
  - Clear labels showing "English" or "Italiano" with IT/EN badge
  - Users can switch quiz language independently from profile language preference
  - Essential for certifications (CISSP, CISM, OSCP, CEH) available in multiple languages
  - Toggle positioned in quiz header next to timer for easy access

- **Content Management System (CMS)** (October 4, 2025): Complete system for managing static pages
  - Database: contentPages table with slug, title, content (HTML), isPublished fields
  - Backend API: Public routes (/api/content-pages/:slug) with DOMPurify HTML sanitization
  - Admin Panel: "Pagine" tab with TipTap rich text editor (bold, italic, headings, lists, links, images)
  - Frontend: DynamicContentPage component for /privacy and /terms routes
  - Security: HTML sanitized with DOMPurify allowlist before database persistence
  - Initial seed data for Privacy Policy and Terms of Service

- **UI Consistency** (October 4, 2025): Added "Torna alla Home" button across all admin tabs for consistent navigation