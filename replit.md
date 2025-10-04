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

- **Live Course Enrollment UX** (October 4, 2025): Improved clarity of enrollment action
  - Added prominent "Iscriviti Ora" button for each session (previously entire card was clickable)
  - Larger price display (€XX.XX) and clearer session details
  - Better visual separation between session info and enrollment action
  - Improved discoverability of payment flow

- **Featured Categories System** (October 4, 2025): Category highlighting on home page
  - Database: Added `isFeatured` boolean field to categories table
  - Admin Panel: New "In Evidenza" column in table and toggle switch in edit dialog
  - Home Page: Separate "Categorie in Evidenza" section displaying only featured categories
  - Featured categories inherit images from category imageUrl field
  - Premium filtering works independently for both featured and regular quiz sections

- **CMS Page Placement System** (October 4, 2025): Dynamic page positioning in header/footer
  - Database: Added `placement` field to contentPages table (values: 'header', 'footer', 'none', default: 'footer')
  - Admin Panel: AdminContentPages displays placement column and selector for each page
  - Navigation Component: Fetches and displays published pages with placement='header' in top menu
  - Footer Component: Created new Footer component showing placement='footer' pages site-wide
  - Home Page: Footer added to display footer pages (Privacy, Terms, etc.)
  - Default: New content pages default to footer placement for visibility

- **Audio Explanations for Quiz Questions** (October 4, 2025): TTS audio support for question explanations
  - Database: Added `explanationAudioUrl` and `extendedExplanationAudioUrl` fields to questions table for storing audio file URLs
  - Backend API: POST endpoint `/api/admin/questions/:id/generate-audio` using OpenAI TTS API (tts-1 model)
  - Language-specific voices: Italian (nova), English (alloy), Spanish (shimmer)
  - Audio files stored in `public/audio-explanations/` directory with format `{questionId}-{language}.mp3`
  - Quiz Interface: "Ascolta" button appears in explanation card when audio is available
  - Admin Panel: Generate audio button for questions with explanations, language selector prompt (it/en/es)
  - Play button with green icon for questions that already have audio generated
  - **Extended Audio Explanations**: "Spiegazione Vocale" button in quiz interface generates amplified audio explanations using GPT-4o to expand written text, then converts to TTS audio
  - Extended audio stored in `public/audio-explanations/extended/` directory
  - Backend endpoint `/api/admin/questions/:id/generate-extended-audio` with language parameter

- **Quiz Interface Translation** (October 4, 2025): Language-specific UI labels in quiz interface
  - Quiz labels (Spiegazione/Explanation, Dominio/Domain, Corretto/Correct, Sbagliato/Incorrect) now translate based on quiz language toggle
  - Ensures complete language immersion for international certifications
  - Language toggle affects both question content and UI labels throughout quiz experience

- **Robust Question Option Normalization** (October 4, 2025): Critical fix for quiz option display issues
  - Enhanced backend normalization in `/api/quizzes/:quizId` endpoint to handle all option data formats
  - Prevents "[object Object]" display bugs by intelligently extracting text from nested structures
  - Handles strings, objects with language keys (it/en), arrays, and legacy formats
  - Ensures all options have consistent `{label, text, isCorrect}` structure before sending to frontend
  - Frontend `getCurrentQuestion()` safely handles translated options with fallback logic

- **Insight Discovery Report Bug Fix** (October 4, 2025): Fixed personality test report generation
  - Problem: Color counting was failing due to case-sensitivity issues (id: "a" vs answer: "A")
  - Solution: Case-insensitive matching for both `id` and `label` fields when finding selected options
  - Normalized color values to lowercase before counting (handles "Red", "red", "RED")
  - Fixed nullable `correctAnswer` field causing TypeScript errors
  - Now correctly generates personality profiles with dominant/secondary colors, strengths, development areas, and recommendations

- **Extended Audio Performance** (October 4, 2025): Improved audio generation speed and UX
  - Changed from GPT-4o to GPT-4o-mini for 3-4x faster text generation
  - Added informative toast messages during generation (15-30 second wait time)
  - Implemented 60-second timeout with specific error messaging
  - Success confirmation when audio is ready to play