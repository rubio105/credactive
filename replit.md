# Overview

This is a professional quiz and certification preparation platform branded as "IBI ACADEMY". The platform helps users prepare for professional certifications across multiple domains: Cybersecurity (CISSP, CISM, OSCP, CEH), Compliance & Governance (ISO 27001, GDPR, NIS2, DORA), Business & Innovation (Open Innovation, Bilancio e Controllo), and Leadership & Assessment (Insight Discovery personality tests). Users can take quizzes, track their progress, receive detailed reports, and subscribe to premium content for €90/year through Stripe.

The application is built as a full-stack TypeScript project with a React frontend and Express backend, using PostgreSQL for data persistence.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Technology Stack**: React with TypeScript, using Vite as the build tool and development server.

**UI Framework**: shadcn/ui component library built on Radix UI primitives, styled with Tailwind CSS. This provides a consistent, accessible component system with the "new-york" style variant.

**State Management**: TanStack Query (React Query) for server state management and data fetching. No global client state management library is used - component state and React Query handle all state needs.

**Routing**: Wouter for lightweight client-side routing, handling navigation between landing, home, quiz, dashboard, subscribe, and report pages.

**Forms**: React Hook Form with Zod validation resolvers for type-safe form handling.

**Path Aliases**: Configured to use `@/` for client source files and `@shared/` for shared types/schemas, making imports cleaner and more maintainable.

## Backend Architecture

**Framework**: Express.js server running on Node.js with TypeScript.

**API Design**: RESTful API with routes organized by feature (auth, quiz data, user progress, payments).

**Authentication**: Replit Auth using OpenID Connect (OIDC) with Passport.js strategy. Session management uses express-session with PostgreSQL session storage (connect-pg-simple).

**Database Access**: Drizzle ORM providing type-safe database queries. The schema is defined once in TypeScript and shared between frontend and backend through the `@shared/schema` module.

**Build Process**: Development uses tsx for running TypeScript directly. Production build uses esbuild to bundle the server and Vite to bundle the client, with both outputs placed in the dist directory.

**Request Flow**: Express middleware handles JSON parsing (with raw body capture for webhook verification), request logging, and authentication checks before routing to handlers.

## Data Storage

**Database**: PostgreSQL using Neon's serverless driver with WebSocket support for serverless environments.

**ORM**: Drizzle ORM with schema-first design. Schema definitions live in `shared/schema.ts` and are used to generate types and migration files.

**Schema Design**:
- Users table stores authentication data and Stripe customer information
- Categories and quizzes tables define the quiz structure hierarchy
- Questions table stores quiz content with JSONB for flexible option structures
- User progress tracked through userQuizAttempts and userProgress tables
- Quiz reports stored as JSONB for flexible report data structures
- Sessions table for secure session management

**Migrations**: Managed through drizzle-kit, with migration files generated in the migrations directory and applied via `db:push` script.

**Type Safety**: Full type safety from database to frontend through Drizzle's type inference and shared schema types.

## Authentication & Authorization

**Strategy**: Replit Auth provides the authentication layer, handling user identity through OIDC.

**Session Management**: Express-session with PostgreSQL backing for persistent sessions. Sessions configured with 1-week TTL, httpOnly cookies, and secure flags.

**User Flow**: Unauthenticated users see the landing page. After login via `/api/login`, users are redirected to the authenticated home page. The `isAuthenticated` middleware protects API routes.

**User Data**: After successful authentication, user profile is upserted in the database with data from OIDC claims (email, name, profile image).

**Frontend Auth Checks**: Custom `useAuth` hook wraps React Query to fetch current user, providing `isAuthenticated` and `isLoading` states throughout the app.

## External Dependencies

**Stripe Payment Integration**: 
- Stripe SDK for payment processing and subscription management
- Stripe Elements/Stripe.js for secure payment UI on the subscribe page
- Webhook handling for subscription lifecycle events
- Users linked to Stripe customers via stripeCustomerId and stripeSubscriptionId fields

**Replit Platform Services**:
- Replit Auth for authentication (OIDC)
- Replit-specific Vite plugins for development (cartographer for navigation, dev banner, runtime error overlay)
- Environment variables for Replit-specific configuration (REPL_ID, REPLIT_DOMAINS)

**Neon Database**:
- Serverless PostgreSQL with WebSocket support
- Connection via DATABASE_URL environment variable
- Used through @neondatabase/serverless package

**OpenAI Integration**:
- OpenAI GPT-4o model for AI-powered question generation
- Secure API key management via OPENAI_API_KEY environment variable
- Batch processing for efficient bulk question generation
- Context-aware question generation based on quiz topic and category

**UI Dependencies**:
- Radix UI primitives for accessible component foundations
- Lucide React for icon system
- Tailwind CSS for utility-first styling
- Custom font imports (Inter, JetBrains Mono, DM Sans, etc.)

**Development Tools**:
- TypeScript for type safety across the stack
- ESBuild for fast server bundling
- Vite for fast frontend development and building
- TSX for running TypeScript in development

## Quiz System Architecture

**Quiz Structure**: Hierarchical - Categories contain Quizzes which contain Questions. Questions support multiple choice with explanations.

**Quiz Taking Flow**: Questions are shuffled on quiz start. Timer tracks duration. Answers submitted together at completion. Results generated server-side with detailed reports.

**Report Generation**: Server-side report generator analyzes answers, identifies weak areas by category, provides recommendations, and stores comprehensive results for later review. Two types of reports:
- Standard quiz reports: Score-based with pass/fail status, weak areas, and study recommendations
- Insight Discovery reports: Personality assessment with color wheel visualization, dominant/secondary colors, strengths, development areas, working style, and communication style

**Quiz Categories**:
- **Cybersecurity**: Security Awareness, CISM, CISSP, AI Security, Threat Intelligence, SecOps
- **Ethical Hacking**: OSCP, CEH, GPEN, eJPT - Penetration Testing certifications
- **Compliance & Governance**: ISO 27001, GDPR, NIS2, DORA, Data Protection, Privacy
- **Business & Innovation**: Open Innovation, Bilancio e Controllo (Financial Management)
- **Assessment & Leadership**: Insight Discovery personality tests

**Premium Features**: Most categories and quizzes marked as premium, requiring active Stripe subscription (€90/year) for access.

**AI Question Generation**: Admin panel includes AI-powered question generation using OpenAI GPT-4o:
- Batch generation (1-1000 questions per quiz)
- Configurable difficulty levels (beginner, intermediate, advanced, expert)
- Background processing for large batches
- Automatic database persistence
- Context-aware generation based on quiz topic and certification standards
- Database populated with 250+ AI-generated questions across major quizzes

**Question Images**: Questions support optional images for visual learning:
- Image upload via admin panel (/api/admin/upload endpoint)
- Stored in public/question-images/ directory with multer
- Max 5MB files (jpeg, jpg, png, gif, webp formats)
- Displayed in quiz interface when imageUrl is present
- Useful for solution design, architecture diagrams, network topology questions
- Stock images available for quick testing

**Localization**: User language preference stored (it/en/es/fr) for future i18n support, though current implementation is primarily Italian.

## Recent Changes (October 2025)

- **Expanded Platform Scope**: Evolved from cybersecurity-only to multi-domain professional certification platform
- **New Compliance Categories**: Added NIS2 Directive and DORA Regulation with comprehensive quizzes
- **Business & Innovation**: Added Open Innovation and Bilancio e Controllo (Financial Management) categories
- **Ethical Hacking**: Added dedicated category for OSCP, CEH, GPEN, eJPT penetration testing certifications
- **Personality Assessment**: Implemented Insight Discovery with color wheel visualization (4-color system: Rosso Fuoco, Giallo Sole, Verde Terra, Blu Freddo)
- **Branding**: Updated to "Piattaforma #1 per Certificazioni Professionali" - broader positioning
- **Platform Updates**: €90/year subscription, IBI ACADEMY branding, professional stock images for all categories
- **AI Question Generation** (October 3, 2025): Integrated OpenAI GPT-4o for automated question generation
  - Admin panel now includes "AI" button for each quiz to generate questions in bulk
  - Configurable batch generation (1-1000 questions) with difficulty selection
  - Background processing with automatic database persistence
  - Service: server/aiQuestionGenerator.ts for batch OpenAI API calls
  - Endpoint: POST /api/admin/generate-questions for question generation
  - UI: AdminQuizzes component enhanced with AI generation dialog
  - Database populated with 434 questions: CISSP (171), ISO 27001 (129), GDPR (91), and other quizzes
- **Question Images Support** (October 3, 2025): Added image upload for visual questions
  - Upload endpoint: POST /api/admin/upload (admin only, max 5MB, jpeg/jpg/png/gif/webp)
  - Images stored in public/question-images/ directory
  - Admin panel enhanced with image upload UI in question creation/edit form
  - Quiz interface displays images when present (data-testid="question-image")
  - Stock images downloaded for architecture diagrams, network topology, security designs
  - Schema updated: correctAnswer stores single letter (A/B/C/D) for consistent scoring
  - Automated bulk generation: Successfully populated 434 questions across 16 quizzes using batch AI generation