# Overview

CREDACTIVE ACADEMY is an online platform for professional certification preparation, offering quizzes, progress tracking, reports, and premium content via a Stripe subscription. The platform aims to be a leader in professional certifications, planning to leverage AI for generating over 1,000,000 quiz questions across various domains like Cybersecurity, Compliance & Governance, Business & Innovation, and Leadership & Assessment.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend

The frontend uses React with TypeScript, Vite, shadcn/ui (Radix UI + Tailwind CSS) for UI, TanStack Query for server state, Wouter for routing, and React Hook Form with Zod for forms. It provides a modern, consistent interface with features like professional color wheel visualization for personality reports.

## Backend

The backend is built with Express.js, Node.js, and TypeScript, featuring a RESTful API. Authentication uses Passport.js (local strategy with bcrypt and Google OAuth 2.0) with persistent sessions. Brevo handles transactional emails. Drizzle ORM provides type-safe database access to PostgreSQL. Security measures include rate limiting, Helmet.js, CORS, XSS protection, and SQL injection prevention. The build process uses `tsx` for development and `esbuild`/`vite` for production.

## Data Storage

PostgreSQL (Neon's serverless driver) is the database, managed by Drizzle ORM with a schema-first design. The schema includes tables for Users (with Stripe data), Categories, Quizzes, Questions (JSONB for options), Quiz Generation Jobs, User progress, Reports (JSONB), Sessions, Live Courses, Static Content Pages, Email Templates, and Settings. It supports category images and audio explanations, ensuring end-to-end type safety.

## Key Features

-   **Quiz System**: Hierarchical structure with categories, quizzes, and questions, featuring multiple choice with explanations, randomized question order, admin-controlled question rotation, timed quizzes, and detailed server-side reports.
-   **Insight Discovery Personality Reports**: A 72-type personality assessment system based on Jung/Hippocrates color theory, offering granular classification, an advanced 72-segment SVG color wheel visualization, team value analysis, communication obstacle identification, opposite type analysis, and comprehensive professional reports.
-   **Premium Features**: Most content is accessible via an active Stripe subscription.
-   **AI Question Generation with Job Tracking**: Admin panel functionality using OpenAI GPT-4o for bulk, context-aware question generation, including document-based generation from PDF uploads, with real-time tracking.
-   **Question Media**: Support for image uploads and AI-generated text-to-speech audio explanations.
-   **Live Courses**: System for purchasing and tracking one-time live courses.
-   **Live Streaming Sessions**: Real-time interactive learning via WebSockets, supporting embedded external video (YouTube, Zoom, Google Meet), real-time chat with persistence, interactive polls, and comprehensive admin controls.
-   **Content Management System (CMS)**: Manages static content pages with rich text editing and dynamic navigation placement.
-   **Internationalization**: Multi-language support with an in-quiz language selector (IT/EN/ES) offering real-time AI-powered translation via OpenAI GPT-4o.
-   **Email Template Management**: Database-backed system for admin customization of transactional emails with dynamic variable substitution, preview, and intelligent fallbacks.
-   **Configuration Management**: Secure database-backed API key management with caching and automatic instance reset for zero-downtime deployment.
-   **Subscription Plans Management**: Admin panel for creating and managing subscription plans with AI-powered descriptions and Stripe integration.
-   **User Data Management**: CSV export/import for bulk user operations, including validation and error reporting.
-   **Analytics Dashboard**: Comprehensive business intelligence displaying onboarding, revenue, coupon tracking, user verification, engagement, newsletter, and authentication metrics.
-   **AI Email Marketing System**: Intelligent email campaign management using OpenAI GPT-4o for personalized content generation, smart course recommendations, audience segmentation, real-time HTML preview, and Brevo integration for bulk sending.
-   **SEO Optimization**: Comprehensive search engine optimization including dynamic meta tags, landing page optimization, sitemap generation, Open Graph tags, Twitter cards, and canonical URLs.
-   **Admin Panel**: Comprehensive interface for user management, quiz rotation control, content, settings, and analytics, with 13-tab navigation.
-   **Corporate B2B Licensing System**: Enterprise solution for bulk license sales, corporate accounts, professional dashboards for company admins, email-based invitation system (single and bulk CSV), atomic license management, and team analytics.
-   **Company-Wide Course Assignments**: Corporate admins can assign courses to their entire company. All current and future employees automatically receive access to assigned courses upon joining. Features dedicated management UI tab with add/remove functionality and automatic activity logging.
-   **Bulk Corporate Invitations**: Multi-employee onboarding via CSV upload or textarea input. Supports sending invitations to multiple email addresses simultaneously with individual success/error tracking and optional course-specific targeting.
-   **Leaderboard System with Nicknames**: Gamification features including optional user nicknames, global leaderboards, corporate-exclusive team leaderboards, and credit preservation.
-   **Corporate Content Visibility System**: Granular access control for quizzes and courses, allowing 'public' or 'corporate_exclusive' visibility, managed via dedicated mapping tables and admin UI controls, with content filtering based on user type.
-   **AI Conversational Assistant for Post-Quiz Scenarios**: Context-aware AI coaching system using OpenAI GPT-4o for scenario-based learning after quiz responses. Features business case simulations (GDPR, ISO27001, CISSP certifications) and personal development coaching (stress management based on Insight Discovery personality profiles). Includes conversation persistence, auto-resume after page reload, explicit close control, and complete lifecycle management through dedicated database tables (scenario_conversations, scenario_messages).

# External Dependencies

-   **Stripe**: Payment processing and subscription management.
-   **Brevo (Sendinblue)**: Transactional email service.
-   **Neon Database**: Serverless PostgreSQL.
-   **OpenAI**: GPT-4o and GPT-4o-mini for AI question generation and text-to-speech.