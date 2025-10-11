# Overview

CIRY (Care & Intelligence Ready for You) is a B2B platform focused on integrating health prevention and cybersecurity education. It offers professional certification preparation, including quizzes and progress tracking, alongside AI-powered health prevention tools. The platform aims to be a leader in dual-domain education, leveraging AI for generating vast numbers of quiz questions and providing comprehensive health prevention through conversational AI and medical document analysis. Key ambitions include expanding market reach in both cybersecurity and health education, and continuously innovating with AI to enhance user learning and well-being.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend

The frontend uses React with TypeScript, Vite, shadcn/ui (Radix UI + Tailwind CSS), TanStack Query, Wouter for routing, and React Hook Form with Zod. It provides a modern, consistent interface with features like a professional color wheel visualization for personality reports.

## Backend

The backend is built with Express.js, Node.js, and TypeScript, providing a RESTful API. Authentication uses Passport.js (local strategy with bcrypt and Google OAuth 2.0) with persistent sessions. Drizzle ORM provides type-safe database access to PostgreSQL. Security measures include rate limiting, Helmet.js, CORS, XSS protection, and SQL injection prevention.

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
*   **Medical Prevention System (Prohmed Partnership)**: Comprehensive health prevention module powered by Google Gemini AI, featuring medical document upload/analysis, an AI educational assistant ("AI Prohmed - Impara la Prevenzione"), and a medical alert system. Includes advanced UI for Prevention Index, Medical Reports, and Radiological Image Analysis with structured findings and AI confidence scoring.
*   **Interactive Crossword Game**: AI-generated medical crossword puzzles using Gemini AI, integrated with quizzes, leaderboards, and daily generation limits.
*   **Health Score System**: AI-powered personal health scoring based on medical report analysis (PDF and images), PII anonymization, and conversational AI.
*   **Token Usage System**: Tiered monthly token limits for AI interactions with database tracking and UI indicators.
*   **Webinar Health System**: Free webinar platform for prevention education with expert speakers, automated reminders, and admin management.
*   **Patient-Only AI Access System**: Dedicated access for Prohmed code-based authentication, allowing patients to interact with AI prevention features and view medical reports.
*   **Job Queue System**: Asynchronous processing infrastructure for heavy tasks like medical document analysis (OCR, PII removal, radiological imaging analysis) with progress tracking and retry logic.

## Deployment Architecture

The production environment runs on ciry.app using a Hetzner VPS with PM2. Development is on Replit. Version control is GitHub. The database is Neon PostgreSQL. Build systems are esbuild (backend) and Vite (frontend).

# External Dependencies

*   **Stripe**: Payment processing and subscription management.
*   **Brevo (Sendinblue)**: Transactional email service.
*   **Neon Database**: Serverless PostgreSQL.
*   **OpenAI**: GPT-4o and GPT-4o-mini for AI question generation and text-to-speech.
*   **Google Gemini AI**: Gemini-2.5-pro and Gemini-2.5-flash for medical document analysis, conversational triage, and crossword puzzle generation.