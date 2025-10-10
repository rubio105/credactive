# Overview

CIRY (Care & Intelligence Ready for You) is a B2B platform that integrates health prevention and cybersecurity education. It offers professional certification prep (quizzes, progress tracking, premium content via Stripe) and AI-powered health prevention. The platform aims to be a leader in dual-domain education, utilizing AI to generate over 1,000,000 quiz questions across Cybersecurity, Compliance & Governance, and providing comprehensive health prevention through conversational AI and medical document analysis.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend

The frontend uses React with TypeScript, Vite, shadcn/ui (Radix UI + Tailwind CSS), TanStack Query for server state, Wouter for routing, and React Hook Form with Zod for forms. It provides a modern, consistent interface with features like a professional color wheel visualization for personality reports.

## Backend

The backend is built with Express.js, Node.js, and TypeScript, featuring a RESTful API. Authentication uses Passport.js (local strategy with bcrypt and Google OAuth 2.0) with persistent sessions. Drizzle ORM provides type-safe database access to PostgreSQL. Security measures include rate limiting, Helmet.js, CORS, XSS protection, and SQL injection prevention.

## Data Storage

PostgreSQL (Neon's serverless driver) is the database, managed by Drizzle ORM. The schema includes tables for Users (with Stripe data), Categories, Quizzes, Questions, Quiz Generation Jobs, User progress, Reports, Sessions, Live Courses, Static Content Pages, Email Templates, Settings, Prevention Documents, Prevention Topics, Triage Sessions/Messages/Alerts, Prohmed Codes, and Crossword Puzzles/Attempts/Leaderboard. It supports category images, audio explanations, and Gemini AI integration.

## Key Features

-   **Quiz System**: Hierarchical structure with categories, quizzes, and questions, randomized order, admin controls, timed quizzes, and detailed reports.
-   **Insight Discovery Personality Reports**: A 72-type personality assessment system based on Jung/Hippocrates color theory, offering granular classification and comprehensive professional reports.
-   **Premium Features**: Content accessible via Stripe subscription.
-   **AI Question Generation**: Admin functionality using OpenAI GPT-4o for bulk, context-aware question generation, including document-based generation from PDF uploads.
-   **Live Courses & Streaming**: System for purchasing and tracking one-time live courses and real-time interactive learning via WebSockets with chat, polls, and admin controls.
-   **Content Management System (CMS)**: Manages static content pages with rich text editing and dynamic navigation.
-   **Internationalization**: Multi-language support with in-quiz language selector (IT/EN/ES) offering real-time AI-powered translation via OpenAI GPT-4o.
-   **Email Template & Configuration Management**: Database-backed systems for admin customization of transactional emails and secure API key management.
-   **Subscription Plans & User Data Management**: Admin panel for managing subscription plans with AI-powered descriptions and Stripe integration, and CSV export/import for bulk user operations.
-   **Analytics Dashboard**: Comprehensive business intelligence displaying key metrics.
-   **AI Email Marketing System**: Intelligent email campaign management using OpenAI GPT-4o for personalized content generation and Brevo integration.
-   **SEO Optimization**: Comprehensive search engine optimization including dynamic meta tags and sitemap generation.
-   **Admin Panel**: Comprehensive interface for user management, quiz rotation, content, settings, and analytics.
-   **Corporate B2B Licensing System**: Enterprise solution for bulk license sales, corporate accounts, professional dashboards, and email-based invitation system.
-   **Company-Wide Course Assignments**: Corporate admins can assign courses to their entire company.
-   **Leaderboard System**: Gamification features including optional user nicknames, global and corporate-exclusive leaderboards.
-   **Corporate Content Visibility System**: Granular access control for quizzes and courses based on user type.
-   **AI Conversational Assistant**: Context-aware AI coaching system using OpenAI GPT-4o for scenario-based learning after quiz responses and personal development coaching.
-   **Admin Documentation System**: In-platform documentation covering technical aspects, server commands, and user guides.
-   **Medical Prevention System (Prohmed Partnership)**: Comprehensive health prevention module powered by Google Gemini AI, featuring medical document upload/analysis, prevention topic taxonomy, AI-powered educational prevention assistant ("AI Prohmed - Impara la Prevenzione") publicly accessible, medical alert system, and Prohmed telemedicine app access code generation.
-   **Interactive Crossword Game**: AI-generated medical crossword puzzles using Gemini AI, with difficulty levels, weekly challenges, leaderboard, and gamification rewards.
-   **Prohmed Code Management System**: Admin bulk code generation system for Prohmed telemedicine access with status tracking and distribution management.
-   **Health Score System**: AI-powered personal health scoring system featuring medical report upload/analysis (PDF and images), Gemini Vision OCR, automatic PII anonymization, structured medical data extraction, health score calculation, AI-generated personalized health insights, and conversational AI integration.
-   **Token Usage System**: Implemented tiered monthly token limits for AI interactions (FREE, PREMIUM, PREMIUM_PLUS) with a dual-check system and database tracking. UI elements show token usage and upgrade CTAs.

## Deployment Architecture

-   **Development Environment**: Replit with auto-reload.
-   **Version Control**: GitHub.
-   **Production Server**: Hetzner VPS with PM2.
-   **Database**: Neon PostgreSQL.
-   **Build System**: esbuild (backend) + Vite (frontend).
-   **Deployment Workflow**: Manual Git-based workflow.

# External Dependencies

-   **Stripe**: Payment processing and subscription management.
-   **Brevo (Sendinblue)**: Transactional email service.
-   **Neon Database**: Serverless PostgreSQL.
-   **OpenAI**: GPT-4o and GPT-4o-mini for AI question generation and text-to-speech.
-   **Google Gemini AI**: Gemini-2.5-pro and Gemini-2.5-flash for medical document analysis, conversational triage, and crossword puzzle generation.