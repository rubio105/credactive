import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  uuid,
  serial,
  unique,
  customType,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Custom type for pgvector embeddings
const vector = customType<{ data: number[]; driverData: string; config: { dimensions?: number } }>({
  dataType(config) {
    return `vector(${config?.dimensions ?? 768})`;
  },
  toDriver(value: number[]): string {
    return JSON.stringify(value);
  },
  fromDriver(value: string): number[] {
    return JSON.parse(value);
  },
});

// Session storage table for OIDC authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id", { length: 191 }).primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password"), // Hashed password for email/password auth (null for social login)
  authProvider: varchar("auth_provider", { length: 20 }).default("local"), // local, google, apple
  passwordResetToken: varchar("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  emailVerified: boolean("email_verified").default(false),
  verificationCode: varchar("verification_code", { length: 6 }),
  verificationCodeExpires: timestamp("verification_code_expires"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  dateOfBirth: timestamp("date_of_birth"),
  gender: varchar("gender", { length: 50 }), // male, female, other, prefer_not_to_say
  phone: varchar("phone", { length: 50 }),
  whatsappNumber: varchar("whatsapp_number", { length: 50 }), // WhatsApp number for notifications (format: +39xxxxxxxxxx)
  whatsappNotificationsEnabled: boolean("whatsapp_notifications_enabled").default(false), // User consent for WhatsApp notifications
  whatsappVerified: boolean("whatsapp_verified").default(false), // Whether WhatsApp number has been verified via OTP
  whatsappVerificationCode: varchar("whatsapp_verification_code", { length: 10 }), // 6-digit OTP code for WhatsApp verification
  whatsappVerificationExpiry: timestamp("whatsapp_verification_expiry"), // Expiration timestamp for OTP code (5 minutes)
  // Patient health profile
  heightCm: integer("height_cm"), // Height in centimeters
  weightKg: integer("weight_kg"), // Weight in kilograms
  smokingStatus: varchar("smoking_status", { length: 20 }), // non-smoker, former-smoker, occasional-smoker, regular-smoker
  physicalActivity: varchar("physical_activity", { length: 20 }), // sedentary, light, moderate, active, very-active
  userBio: text("user_bio"), // Free text "tell me about yourself" for prevention
  onboardingCompleted: boolean("onboarding_completed").default(false), // Tracks if initial onboarding popup was completed
  onboardingPromptCount: integer("onboarding_prompt_count").default(0), // Number of times onboarding popup has been shown
  profession: varchar("profession", { length: 100 }), // Deprecated - kept for backward compatibility
  education: varchar("education", { length: 100 }), // Deprecated - kept for backward compatibility
  company: varchar("company", { length: 200 }),
  specialization: varchar("specialization", { length: 150 }), // Medical specialization (replaces profession/education)
  addressStreet: varchar("address_street", { length: 200 }),
  addressCity: varchar("address_city", { length: 100 }),
  addressPostalCode: varchar("address_postal_code", { length: 20 }),
  addressProvince: varchar("address_province", { length: 100 }),
  addressCountry: varchar("address_country", { length: 100 }),
  newsletterConsent: boolean("newsletter_consent").default(false),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  currentPaymentIntentId: varchar("current_payment_intent_id"), // Track current pending payment intent for idempotency
  currentPaymentIntentStatus: varchar("current_payment_intent_status", { length: 50 }), // Status: requires_payment_method, processing, succeeded, canceled
  currentPaymentIntentCreatedAt: timestamp("current_payment_intent_created_at"), // For cleanup of old intents
  isPremium: boolean("is_premium").default(false),
  subscriptionTier: varchar("subscription_tier", { length: 20 }).default("free"), // free, premium, premium_plus
  isAdmin: boolean("is_admin").default(false),
  isDoctor: boolean("is_doctor").default(false), // Medical professional flag
  doctorCode: varchar("doctor_code", { length: 20 }).unique(), // Unique code for doctors to share with patients
  pendingDoctorCode: varchar("pending_doctor_code", { length: 20 }), // Temporary referral code until email verification
  aiOnlyAccess: boolean("ai_only_access").default(false), // User can access ONLY AI prevention, not quiz/courses
  language: varchar("language", { length: 2 }), // it, en, es, fr
  // MFA (Multi-Factor Authentication) fields
  mfaEnabled: boolean("mfa_enabled").default(false),
  mfaSecret: varchar("mfa_secret", { length: 255 }), // Base32 encoded secret for TOTP
  // Gamification fields
  nickname: varchar("nickname", { length: 50 }), // Display name for leaderboards
  totalPoints: integer("total_points").default(0),
  level: integer("level").default(1),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  lastActivityDate: timestamp("last_activity_date"),
  // Virtual wallet
  credits: integer("credits").default(0),
  // Corporate agreement fields
  companyName: varchar("company_name", { length: 200 }),
  corporateAgreementId: uuid("corporate_agreement_id"),
  // Coupon tracking
  couponCode: varchar("coupon_code", { length: 100 }),
  prohmedPromoCodeSent: boolean("prohmed_promo_code_sent").default(false), // Track if Prohmed promo code email was sent
  prohmedPromoCode: varchar("prohmed_promo_code", { length: 50 }), // Store the promo code sent to user
  // Login tracking for feedback popup
  loginCount: integer("login_count").default(0),
  feedbackSubmitted: boolean("feedback_submitted").default(false),
  // Privacy consent flags (GDPR compliance)
  privacyAccepted: boolean("privacy_accepted").default(false), // Mandatory: Privacy policy accepted
  healthDataConsent: boolean("health_data_consent").default(false), // Mandatory: Health data processing consent
  termsAccepted: boolean("terms_accepted").default(false), // Mandatory: Terms and conditions accepted
  marketingConsent: boolean("marketing_consent").default(false), // Optional: Receive product updates
  commercialConsent: boolean("commercial_consent").default(false), // Optional: Receive commercial info
  scientificConsent: boolean("scientific_consent").default(false), // Optional: Scientific/educational purposes
  // Privacy consent timestamps (track when each consent was accepted)
  privacyAcceptedAt: timestamp("privacy_accepted_at"),
  healthDataConsentAt: timestamp("health_data_consent_at"),
  termsAcceptedAt: timestamp("terms_accepted_at"),
  marketingConsentAt: timestamp("marketing_consent_at"),
  commercialConsentAt: timestamp("commercial_consent_at"),
  scientificConsentAt: timestamp("scientific_consent_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quiz categories
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 20 }),
  isPremium: boolean("is_premium").default(true),
  isFeatured: boolean("is_featured").default(false),
  isPinned: boolean("is_pinned").default(false), // Pinned categories always appear in first 12 on home
  sortOrder: integer("sort_order").default(0),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Quizzes
export const quizzes = pgTable("quizzes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: uuid("category_id").notNull().references(() => categories.id),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  duration: integer("duration").notNull(), // in minutes
  difficulty: varchar("difficulty", { length: 20 }).notNull(), // beginner, intermediate, advanced, expert
  isPremium: boolean("is_premium").default(true),
  isActive: boolean("is_active").default(true),
  maxQuestionsPerAttempt: integer("max_questions_per_attempt"), // Optional: limit number of questions shown per attempt (null = all questions)
  documentPdfUrl: text("document_pdf_url"), // Optional: PDF document for AI question generation
  visibilityType: varchar("visibility_type", { length: 20 }).default("public"), // public, corporate_exclusive
  // Gaming/Crossword features
  gamingEnabled: boolean("gaming_enabled").default(false), // Enable crossword puzzle gaming for this quiz
  crosswordSolutionsCount: integer("crossword_solutions_count"), // Number of solutions for AI-generated crossword
  createdAt: timestamp("created_at").defaultNow(),
});

// Quiz corporate access mapping
export const quizCorporateAccess = pgTable("quiz_corporate_access", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: uuid("quiz_id").notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
  corporateAgreementId: uuid("corporate_agreement_id").notNull().references(() => corporateAgreements.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueQuizAgreement: unique().on(table.quizId, table.corporateAgreementId),
}));

// Quiz questions
export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: uuid("quiz_id").notNull().references(() => quizzes.id),
  question: text("question").notNull(),
  imageUrl: text("image_url"), // Optional image for the question
  options: jsonb("options").notNull(), // Array of option objects {label, text, explanation}
  correctAnswer: text("correct_answer"), // Legacy: single correct answer (for backward compatibility)
  correctAnswers: jsonb("correct_answers"), // Array of correct answer labels for multiple-choice: ["A", "C"]
  explanation: text("explanation"),
  explanationAudioUrl: text("explanation_audio_url"), // TTS audio URL for the explanation
  category: varchar("category", { length: 100 }),
  domain: varchar("domain", { length: 200 }), // CISSP domain or topic hint
  language: varchar("language", { length: 5 }).default('it'), // Original language of the question (it, en, es, fr)
  createdAt: timestamp("created_at").defaultNow(),
});

// Quiz question generation jobs
export const quizGenerationJobs = pgTable("quiz_generation_jobs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: uuid("quiz_id").notNull().references(() => quizzes.id),
  requestedCount: integer("requested_count").notNull(), // Number of questions requested
  generatedCount: integer("generated_count").default(0), // Number successfully generated
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, processing, completed, failed
  error: text("error"), // Error message if failed
  difficulty: varchar("difficulty", { length: 20 }), // beginner, intermediate, advanced, expert
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// User quiz attempts
export const userQuizAttempts = pgTable("user_quiz_attempts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  quizId: uuid("quiz_id").notNull().references(() => quizzes.id),
  score: integer("score").notNull(), // percentage
  correctAnswers: integer("correct_answers").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  timeSpent: integer("time_spent").notNull(), // in seconds
  answers: jsonb("answers").notNull(), // Array of {questionId, answer, isCorrect}
  pointsEarned: integer("points_earned").default(0), // Points earned in this attempt
  completedAt: timestamp("completed_at").defaultNow(),
});

// User progress tracking
export const userProgress = pgTable("user_progress", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  categoryId: uuid("category_id").notNull().references(() => categories.id),
  quizzesCompleted: integer("quizzes_completed").default(0),
  averageScore: integer("average_score").default(0),
  totalTimeSpent: integer("total_time_spent").default(0), // in seconds
  lastAttemptAt: timestamp("last_attempt_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quiz reports
export const quizReports = pgTable("quiz_reports", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  attemptId: uuid("attempt_id").notNull().references(() => userQuizAttempts.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  quizId: uuid("quiz_id").notNull().references(() => quizzes.id),
  reportData: jsonb("report_data").notNull(), // Full report with analysis
  weakAreas: jsonb("weak_areas"), // Array of topics to improve
  strengths: jsonb("strengths"), // Array of strong topics
  recommendations: text("recommendations"),
  emailSent: boolean("email_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Live courses
export const liveCourses = pgTable("live_courses", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: uuid("quiz_id").notNull().references(() => quizzes.id),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  objectives: text("objectives"), // Course objectives (long description)
  programModules: jsonb("program_modules"), // Structured array: [{moduleTitle, hours, topics}]
  cosaInclude: jsonb("cosa_include"), // Array of included items (strings)
  instructor: varchar("instructor", { length: 200 }), // Course instructor/teacher
  duration: varchar("duration", { length: 100 }), // Course duration (e.g., "12 ore", "2 giorni")
  language: varchar("language", { length: 10 }).notNull().default('it'), // Course language: it, en, es
  price: integer("price").notNull(), // Price in cents (e.g., 9000 for €90)
  stripeProductId: varchar("stripe_product_id"),
  stripePriceId: varchar("stripe_price_id"),
  isActive: boolean("is_active").default(true),
  isWebinarHealth: boolean("is_webinar_health").default(false), // Flag to identify Webinar Health courses
  visibilityType: varchar("visibility_type", { length: 20 }).default("public"), // public, corporate_exclusive
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Live course corporate access mapping
export const liveCourseCorporateAccess = pgTable("live_course_corporate_access", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  liveCourseId: uuid("live_course_id").notNull().references(() => liveCourses.id, { onDelete: 'cascade' }),
  corporateAgreementId: uuid("corporate_agreement_id").notNull().references(() => corporateAgreements.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueCourseAgreement: unique().on(table.liveCourseId, table.corporateAgreementId),
}));

// Live course sessions (dates)
export const liveCourseSessions = pgTable("live_course_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: uuid("course_id").notNull().references(() => liveCourses.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  capacity: integer("capacity").default(30),
  enrolled: integer("enrolled").default(0),
  status: varchar("status", { length: 20 }).default("available"), // available, full, completed, cancelled
  streamingUrl: text("streaming_url"), // URL for live streaming/webinar (Zoom, Teams, Google Meet, etc.)
  createdAt: timestamp("created_at").defaultNow(),
});

// Live course enrollments
export const liveCourseEnrollments = pgTable("live_course_enrollments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  courseId: uuid("course_id").notNull().references(() => liveCourses.id),
  sessionId: uuid("session_id").notNull().references(() => liveCourseSessions.id),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  amountPaid: integer("amount_paid").notNull(), // Amount in cents
  status: varchar("status", { length: 20 }).default("pending"), // pending, confirmed, cancelled
  reminderSentAt: timestamp("reminder_sent_at"), // Track when 24h reminder was sent
  enrolledAt: timestamp("enrolled_at").defaultNow(),
});

// Live streaming sessions (active live sessions with video streaming)
export const liveStreamingSessions = pgTable("live_streaming_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: uuid("session_id").notNull().references(() => liveCourseSessions.id),
  streamUrl: text("stream_url").notNull(), // YouTube Live, Zoom, Google Meet, etc.
  title: text("title").notNull(), // Session title
  isActive: boolean("is_active").default(false),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Live streaming chat messages
export const liveStreamingMessages = pgTable("live_streaming_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  streamingSessionId: uuid("streaming_session_id").notNull().references(() => liveStreamingSessions.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id),
  userName: varchar("user_name", { length: 200 }).notNull(), // Cached for performance
  message: text("message").notNull(),
  isAdminMessage: boolean("is_admin_message").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Live streaming polls/quiz (interactive questions during live)
export const liveStreamingPolls = pgTable("live_streaming_polls", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  streamingSessionId: uuid("streaming_session_id").notNull().references(() => liveStreamingSessions.id, { onDelete: 'cascade' }),
  question: text("question").notNull(),
  options: jsonb("options").notNull(), // Array of {label: string, text: string}
  correctAnswer: varchar("correct_answer", { length: 10 }), // null for polls, set for quiz questions
  pollType: varchar("poll_type", { length: 20 }).default("poll"), // poll, quiz
  showResults: boolean("show_results").default(false), // Show results to participants
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Live streaming poll responses
export const liveStreamingPollResponses = pgTable("live_streaming_poll_responses", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  pollId: uuid("poll_id").notNull().references(() => liveStreamingPolls.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id),
  selectedOption: varchar("selected_option", { length: 10 }).notNull(),
  isCorrect: boolean("is_correct"), // Set if poll is a quiz question
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueUserPoll: unique().on(table.pollId, table.userId),
}));

// Content pages (CMS for static pages)
export const contentPages = pgTable("content_pages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar("slug", { length: 100 }).notNull().unique(), // e.g., "privacy", "terms", "about", "contact"
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(), // HTML content (sanitized)
  placement: varchar("placement", { length: 20 }).default("none"), // 'header', 'footer', 'none'
  isPublished: boolean("is_published").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// On-demand courses
export const onDemandCourses = pgTable("on_demand_courses", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  program: text("program"), // Course syllabus/program description
  categoryId: uuid("category_id").notNull().references(() => categories.id), // Required: link to quiz category
  instructor: varchar("instructor", { length: 200 }),
  difficulty: varchar("difficulty", { length: 20 }), // beginner, intermediate, advanced, expert
  duration: varchar("duration", { length: 100 }), // Total course duration estimate
  thumbnailUrl: text("thumbnail_url"), // Course thumbnail image
  isPremiumPlus: boolean("is_premium_plus").default(true), // Requires Premium Plus subscription
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  visibilityType: varchar("visibility_type", { length: 20 }).default("public"), // public, corporate_exclusive
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// On-demand course corporate access mapping
export const onDemandCourseCorporateAccess = pgTable("on_demand_course_corporate_access", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  onDemandCourseId: uuid("on_demand_course_id").notNull().references(() => onDemandCourses.id, { onDelete: 'cascade' }),
  corporateAgreementId: uuid("corporate_agreement_id").notNull().references(() => corporateAgreements.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueCourseAgreement: unique().on(table.onDemandCourseId, table.corporateAgreementId),
}));

// Course videos
export const courseVideos = pgTable("course_videos", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: uuid("course_id").notNull().references(() => onDemandCourses.id),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  videoUrl: text("video_url").notNull(), // URL to video (YouTube, Vimeo, or uploaded)
  duration: integer("duration"), // Duration in seconds
  sortOrder: integer("sort_order").notNull().default(0), // Order of video in course
  thumbnailUrl: text("thumbnail_url"),
  requiresQuiz: boolean("requires_quiz").default(true), // Must answer questions to unlock next video
  createdAt: timestamp("created_at").defaultNow(),
});

// Video quiz questions (to unlock next video)
export const videoQuestions = pgTable("video_questions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: uuid("video_id").notNull().references(() => courseVideos.id),
  question: text("question").notNull(),
  options: jsonb("options").notNull(), // Array of {label, text}
  correctAnswer: varchar("correct_answer", { length: 10 }).notNull(), // e.g., "A", "B", "C", "D"
  explanation: text("explanation"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Course quiz questions (at the end of the course, without video dependency)
export const courseQuestions = pgTable("course_questions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: uuid("course_id").notNull().references(() => onDemandCourses.id),
  question: text("question").notNull(),
  options: jsonb("options").notNull(), // Array of {label, text}
  correctAnswer: varchar("correct_answer", { length: 10 }).notNull(), // e.g., "A", "B", "C", "D"
  explanation: text("explanation"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// User video progress tracking
export const userVideoProgress = pgTable("user_video_progress", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  courseId: uuid("course_id").notNull().references(() => onDemandCourses.id),
  videoId: uuid("video_id").notNull().references(() => courseVideos.id),
  completed: boolean("completed").default(false),
  quizPassed: boolean("quiz_passed").default(false), // Passed the quiz to unlock next video
  watchedSeconds: integer("watched_seconds").default(0), // Track progress within video
  lastWatchedAt: timestamp("last_watched_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Badges - Available badges in the system
export const badges = pgTable("badges", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }), // Icon name or emoji
  color: varchar("color", { length: 20 }), // Badge color
  category: varchar("category", { length: 50 }), // quiz, streak, achievement, special
  requirement: text("requirement"), // Description of how to earn it
  points: integer("points").default(0), // Points awarded when earned
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// User badges - Badges earned by users
export const userBadges = pgTable("user_badges", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  badgeId: uuid("badge_id").notNull().references(() => badges.id),
  earnedAt: timestamp("earned_at").defaultNow(),
});

// Achievements - Available achievements in the system
export const achievements = pgTable("achievements", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }), // Icon name or emoji
  category: varchar("category", { length: 50 }), // completion, mastery, dedication, social
  tier: varchar("tier", { length: 20 }).default("bronze"), // bronze, silver, gold, platinum
  requirement: jsonb("requirement"), // {type, target, progress} e.g., {type: "quizzes_completed", target: 10}
  points: integer("points").default(0), // Points awarded when unlocked
  badgeId: uuid("badge_id").references(() => badges.id), // Optional linked badge
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// User achievements - Achievements earned by users
export const userAchievements = pgTable("user_achievements", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  achievementId: uuid("achievement_id").notNull().references(() => achievements.id),
  progress: integer("progress").default(0), // Current progress towards achievement
  isUnlocked: boolean("is_unlocked").default(false),
  unlockedAt: timestamp("unlocked_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Daily challenges
export const dailyChallenges = pgTable("daily_challenges", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(), // The date this challenge is for
  quizId: uuid("quiz_id").notNull().references(() => quizzes.id),
  categoryId: uuid("category_id").notNull().references(() => categories.id),
  questionCount: integer("question_count").default(5), // Number of questions in daily challenge
  points: integer("points").default(50), // Bonus points for completing
  expiresAt: timestamp("expires_at").notNull(), // When this challenge expires
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// User daily challenge completions
export const userDailyChallenges = pgTable("user_daily_challenges", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  challengeId: uuid("challenge_id").notNull().references(() => dailyChallenges.id),
  attemptId: uuid("attempt_id").references(() => userQuizAttempts.id), // Link to quiz attempt
  score: integer("score").notNull(), // Percentage score
  pointsEarned: integer("points_earned").default(0),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User certificates
export const userCertificates = pgTable("user_certificates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  categoryId: uuid("category_id").references(() => categories.id),
  quizId: uuid("quiz_id").references(() => quizzes.id),
  certificateType: varchar("certificate_type", { length: 50 }).notNull(), // quiz_completion, category_mastery, course_completion
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  score: integer("score"), // If applicable (e.g., quiz score)
  pdfUrl: text("pdf_url"), // URL to generated PDF certificate
  verificationCode: varchar("verification_code", { length: 50 }).unique(), // Unique code for verification
  isPublic: boolean("is_public").default(false), // If user wants to share publicly
  metadata: jsonb("metadata"), // Additional data (quiz details, stats, etc.)
  issuedAt: timestamp("issued_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Leaderboard entries (materialized view / cache table for performance)
export const leaderboard = pgTable("leaderboard", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  categoryId: uuid("category_id").references(() => categories.id), // null = global leaderboard
  rank: integer("rank").notNull(),
  points: integer("points").notNull(),
  quizzesCompleted: integer("quizzes_completed").default(0),
  averageScore: integer("average_score").default(0),
  period: varchar("period", { length: 20 }).default("all_time"), // all_time, monthly, weekly
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Activity log for tracking user actions and awarding points
export const activityLog = pgTable("activity_log", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  activityType: varchar("activity_type", { length: 50 }).notNull(), // quiz_completed, streak_maintained, badge_earned, etc.
  points: integer("points").default(0),
  metadata: jsonb("metadata"), // Additional context about the activity
  createdAt: timestamp("created_at").defaultNow(),
});

// Corporate agreements for company-wide premium access
export const corporateAgreements = pgTable("corporate_agreements", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: varchar("company_name", { length: 200 }).notNull(),
  emailDomain: varchar("email_domain", { length: 100 }), // e.g., "@company.com" (nullable for promo code only)
  promoCode: varchar("promo_code", { length: 50 }).unique(), // Alternative to email domain
  tier: varchar("tier", { length: 20 }).notNull().default("premium_plus"), // premium_plus
  isActive: boolean("is_active").default(true),
  maxUsers: integer("max_users"), // Optional limit on number of users
  currentUsers: integer("current_users").default(0), // Current number of users using this agreement
  notes: text("notes"), // Internal notes about the agreement
  // B2B fields
  adminUserId: varchar("admin_user_id").references(() => users.id), // Corporate admin user
  companyEmail: varchar("company_email", { length: 200 }),
  companyPhone: varchar("company_phone", { length: 50 }),
  vatNumber: varchar("vat_number", { length: 100 }), // Partita IVA
  billingAddress: text("billing_address"),
  contractStartDate: timestamp("contract_start_date"),
  contractEndDate: timestamp("contract_end_date"),
  licensesOwned: integer("licenses_owned").default(0), // Total licenses purchased
  licensesUsed: integer("licenses_used").default(0), // Licenses currently in use
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Corporate invites for onboarding employees
export const corporateInvites = pgTable("corporate_invites", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  corporateAgreementId: uuid("corporate_agreement_id").notNull().references(() => corporateAgreements.id),
  email: varchar("email", { length: 200 }).notNull(),
  invitedBy: varchar("invited_by").notNull().references(() => users.id), // Admin who sent invite
  status: varchar("status", { length: 20 }).default("pending"), // pending, accepted, expired
  token: varchar("token", { length: 100 }).unique().notNull(), // Unique invite token
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  // Course-specific invite fields (optional)
  targetCourseType: varchar("target_course_type", { length: 20 }), // 'live' | 'on_demand' | null
  targetCourseId: varchar("target_course_id", { length: 100 }), // Course ID if invite is for specific course
  targetCourseName: varchar("target_course_name", { length: 300 }), // Course name for email (avoids JOIN)
});

// Corporate license packages purchased by companies
export const corporateLicenses = pgTable("corporate_licenses", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  corporateAgreementId: uuid("corporate_agreement_id").notNull().references(() => corporateAgreements.id),
  packageType: varchar("package_type", { length: 50 }).notNull(), // small_10, medium_50, large_100, enterprise_500
  licenseCount: integer("license_count").notNull(), // Number of licenses in package
  pricePerLicense: integer("price_per_license").notNull(), // Price in cents
  totalPrice: integer("total_price").notNull(), // Total price in cents
  currency: varchar("currency", { length: 3 }).default("EUR"),
  billingInterval: varchar("billing_interval", { length: 20 }).default("year"), // month, year
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  stripeInvoiceId: varchar("stripe_invoice_id"),
  status: varchar("status", { length: 20 }).default("active"), // active, expired, cancelled
  purchasedAt: timestamp("purchased_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Corporate course assignments - courses available to all employees of a company
export const corporateCourseAssignments = pgTable("corporate_course_assignments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  corporateAgreementId: uuid("corporate_agreement_id").notNull().references(() => corporateAgreements.id, { onDelete: 'cascade' }),
  courseType: varchar("course_type", { length: 20 }).notNull(), // 'live' | 'on_demand'
  courseId: varchar("course_id", { length: 100 }).notNull(), // ID of the live course or quiz
  courseName: varchar("course_name", { length: 300 }).notNull(), // Name for display
  assignedBy: varchar("assigned_by").notNull().references(() => users.id), // Admin who assigned
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueCourseAssignment: unique().on(table.corporateAgreementId, table.courseType, table.courseId),
}));

// Application settings for API keys and configuration
export const settings = pgTable("settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key", { length: 100 }).unique().notNull(), // e.g., "OPENAI_API_KEY", "STRIPE_SECRET_KEY"
  value: text("value"), // The API key or configuration value
  description: text("description"), // Human-readable description
  category: varchar("category", { length: 50 }).default("api_keys"), // api_keys, general, etc.
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  quizAttempts: many(userQuizAttempts),
  progress: many(userProgress),
  badges: many(userBadges),
  achievements: many(userAchievements),
  certificates: many(userCertificates),
  dailyChallenges: many(userDailyChallenges),
  activityLog: many(activityLog),
  corporateAgreement: one(corporateAgreements, {
    fields: [users.corporateAgreementId],
    references: [corporateAgreements.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  quizzes: many(quizzes),
  userProgress: many(userProgress),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  category: one(categories, {
    fields: [quizzes.categoryId],
    references: [categories.id],
  }),
  questions: many(questions),
  attempts: many(userQuizAttempts),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [questions.quizId],
    references: [quizzes.id],
  }),
}));

export const userQuizAttemptsRelations = relations(userQuizAttempts, ({ one }) => ({
  user: one(users, {
    fields: [userQuizAttempts.userId],
    references: [users.id],
  }),
  quiz: one(quizzes, {
    fields: [userQuizAttempts.quizId],
    references: [quizzes.id],
  }),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [userProgress.categoryId],
    references: [categories.id],
  }),
}));

export const quizReportsRelations = relations(quizReports, ({ one }) => ({
  user: one(users, {
    fields: [quizReports.userId],
    references: [users.id],
  }),
  quiz: one(quizzes, {
    fields: [quizReports.quizId],
    references: [quizzes.id],
  }),
  attempt: one(userQuizAttempts, {
    fields: [quizReports.attemptId],
    references: [userQuizAttempts.id],
  }),
}));

export const liveCoursesRelations = relations(liveCourses, ({ one, many }) => ({
  quiz: one(quizzes, {
    fields: [liveCourses.quizId],
    references: [quizzes.id],
  }),
  sessions: many(liveCourseSessions),
  enrollments: many(liveCourseEnrollments),
}));

export const liveCourseSessionsRelations = relations(liveCourseSessions, ({ one, many }) => ({
  course: one(liveCourses, {
    fields: [liveCourseSessions.courseId],
    references: [liveCourses.id],
  }),
  enrollments: many(liveCourseEnrollments),
}));

export const liveCourseEnrollmentsRelations = relations(liveCourseEnrollments, ({ one }) => ({
  user: one(users, {
    fields: [liveCourseEnrollments.userId],
    references: [users.id],
  }),
  course: one(liveCourses, {
    fields: [liveCourseEnrollments.courseId],
    references: [liveCourses.id],
  }),
  session: one(liveCourseSessions, {
    fields: [liveCourseEnrollments.sessionId],
    references: [liveCourseSessions.id],
  }),
}));

export const onDemandCoursesRelations = relations(onDemandCourses, ({ one, many }) => ({
  category: one(categories, {
    fields: [onDemandCourses.categoryId],
    references: [categories.id],
  }),
  videos: many(courseVideos),
  questions: many(courseQuestions),
}));

export const courseVideosRelations = relations(courseVideos, ({ one, many }) => ({
  course: one(onDemandCourses, {
    fields: [courseVideos.courseId],
    references: [onDemandCourses.id],
  }),
  questions: many(videoQuestions),
  progress: many(userVideoProgress),
}));

export const videoQuestionsRelations = relations(videoQuestions, ({ one }) => ({
  video: one(courseVideos, {
    fields: [videoQuestions.videoId],
    references: [courseVideos.id],
  }),
}));

export const courseQuestionsRelations = relations(courseQuestions, ({ one }) => ({
  course: one(onDemandCourses, {
    fields: [courseQuestions.courseId],
    references: [onDemandCourses.id],
  }),
}));

export const userVideoProgressRelations = relations(userVideoProgress, ({ one }) => ({
  user: one(users, {
    fields: [userVideoProgress.userId],
    references: [users.id],
  }),
  course: one(onDemandCourses, {
    fields: [userVideoProgress.courseId],
    references: [onDemandCourses.id],
  }),
  video: one(courseVideos, {
    fields: [userVideoProgress.videoId],
    references: [courseVideos.id],
  }),
}));

export const badgesRelations = relations(badges, ({ many }) => ({
  userBadges: many(userBadges),
  achievements: many(achievements),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ one, many }) => ({
  badge: one(badges, {
    fields: [achievements.badgeId],
    references: [badges.id],
  }),
  userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
  achievement: one(achievements, {
    fields: [userAchievements.achievementId],
    references: [achievements.id],
  }),
}));

export const dailyChallengesRelations = relations(dailyChallenges, ({ one, many }) => ({
  quiz: one(quizzes, {
    fields: [dailyChallenges.quizId],
    references: [quizzes.id],
  }),
  category: one(categories, {
    fields: [dailyChallenges.categoryId],
    references: [categories.id],
  }),
  completions: many(userDailyChallenges),
}));

export const userDailyChallengesRelations = relations(userDailyChallenges, ({ one }) => ({
  user: one(users, {
    fields: [userDailyChallenges.userId],
    references: [users.id],
  }),
  challenge: one(dailyChallenges, {
    fields: [userDailyChallenges.challengeId],
    references: [dailyChallenges.id],
  }),
  attempt: one(userQuizAttempts, {
    fields: [userDailyChallenges.attemptId],
    references: [userQuizAttempts.id],
  }),
}));

export const userCertificatesRelations = relations(userCertificates, ({ one }) => ({
  user: one(users, {
    fields: [userCertificates.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [userCertificates.categoryId],
    references: [categories.id],
  }),
  quiz: one(quizzes, {
    fields: [userCertificates.quizId],
    references: [quizzes.id],
  }),
}));

export const leaderboardRelations = relations(leaderboard, ({ one }) => ({
  user: one(users, {
    fields: [leaderboard.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [leaderboard.categoryId],
    references: [categories.id],
  }),
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  user: one(users, {
    fields: [activityLog.userId],
    references: [users.id],
  }),
}));

export const corporateAgreementsRelations = relations(corporateAgreements, ({ one, many }) => ({
  users: many(users),
  admin: one(users, {
    fields: [corporateAgreements.adminUserId],
    references: [users.id],
  }),
  invites: many(corporateInvites),
  licenses: many(corporateLicenses),
  courseAssignments: many(corporateCourseAssignments),
}));

export const corporateInvitesRelations = relations(corporateInvites, ({ one }) => ({
  corporateAgreement: one(corporateAgreements, {
    fields: [corporateInvites.corporateAgreementId],
    references: [corporateAgreements.id],
  }),
  inviter: one(users, {
    fields: [corporateInvites.invitedBy],
    references: [users.id],
  }),
}));

export const corporateLicensesRelations = relations(corporateLicenses, ({ one }) => ({
  corporateAgreement: one(corporateAgreements, {
    fields: [corporateLicenses.corporateAgreementId],
    references: [corporateAgreements.id],
  }),
}));

export const corporateCourseAssignmentsRelations = relations(corporateCourseAssignments, ({ one }) => ({
  corporateAgreement: one(corporateAgreements, {
    fields: [corporateCourseAssignments.corporateAgreementId],
    references: [corporateAgreements.id],
  }),
  assignedByUser: one(users, {
    fields: [corporateCourseAssignments.assignedBy],
    references: [users.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type Quiz = typeof quizzes.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type QuizGenerationJob = typeof quizGenerationJobs.$inferSelect;
export type UserQuizAttempt = typeof userQuizAttempts.$inferSelect;
export type UserProgress = typeof userProgress.$inferSelect;
export type QuizReport = typeof quizReports.$inferSelect;
export type LiveCourse = typeof liveCourses.$inferSelect;
export type LiveCourseSession = typeof liveCourseSessions.$inferSelect;
export type LiveCourseEnrollment = typeof liveCourseEnrollments.$inferSelect;
export type LiveStreamingSession = typeof liveStreamingSessions.$inferSelect;
export type LiveStreamingMessage = typeof liveStreamingMessages.$inferSelect;
export type LiveStreamingPoll = typeof liveStreamingPolls.$inferSelect;
export type LiveStreamingPollResponse = typeof liveStreamingPollResponses.$inferSelect;
export type ContentPage = typeof contentPages.$inferSelect;
export type OnDemandCourse = typeof onDemandCourses.$inferSelect;
export type CourseVideo = typeof courseVideos.$inferSelect;
export type VideoQuestion = typeof videoQuestions.$inferSelect;
export type CourseQuestion = typeof courseQuestions.$inferSelect;
export type UserVideoProgress = typeof userVideoProgress.$inferSelect;
export type Badge = typeof badges.$inferSelect;
export type UserBadge = typeof userBadges.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type DailyChallenge = typeof dailyChallenges.$inferSelect;
export type UserDailyChallenge = typeof userDailyChallenges.$inferSelect;
export type UserCertificate = typeof userCertificates.$inferSelect;
export type Leaderboard = typeof leaderboard.$inferSelect;
export type ActivityLog = typeof activityLog.$inferSelect;
export type CorporateAgreement = typeof corporateAgreements.$inferSelect;
export type CorporateInvite = typeof corporateInvites.$inferSelect;
export type CorporateLicense = typeof corporateLicenses.$inferSelect;
export type Setting = typeof settings.$inferSelect;
export type QuizCorporateAccess = typeof quizCorporateAccess.$inferSelect;
export type LiveCourseCorporateAccess = typeof liveCourseCorporateAccess.$inferSelect;
export type OnDemandCourseCorporateAccess = typeof onDemandCourseCorporateAccess.$inferSelect;

// Insert schemas
export const insertCategorySchema = createInsertSchema(categories);
export const insertQuizSchema = createInsertSchema(quizzes);
export const insertQuestionSchema = createInsertSchema(questions);
export const insertQuizGenerationJobSchema = createInsertSchema(quizGenerationJobs).omit({ id: true, createdAt: true, completedAt: true });
export const insertUserQuizAttemptSchema = createInsertSchema(userQuizAttempts);
export const insertUserProgressSchema = createInsertSchema(userProgress);
export const insertQuizReportSchema = createInsertSchema(quizReports);
export const insertLiveCourseSchema = createInsertSchema(liveCourses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLiveCourseSessionSchema = createInsertSchema(liveCourseSessions).omit({ id: true, createdAt: true });
export const insertLiveCourseEnrollmentSchema = createInsertSchema(liveCourseEnrollments).omit({ id: true, enrolledAt: true });
export const insertLiveStreamingSessionSchema = createInsertSchema(liveStreamingSessions).omit({ id: true, createdAt: true });
export const insertLiveStreamingMessageSchema = createInsertSchema(liveStreamingMessages).omit({ id: true, createdAt: true });
export const insertLiveStreamingPollSchema = createInsertSchema(liveStreamingPolls).omit({ id: true, createdAt: true });
export const insertLiveStreamingPollResponseSchema = createInsertSchema(liveStreamingPollResponses).omit({ id: true, createdAt: true });
export const insertContentPageSchema = createInsertSchema(contentPages).omit({ id: true, createdAt: true, updatedAt: true });
export const updateContentPageSchema = createInsertSchema(contentPages).pick({ 
  title: true, 
  content: true, 
  isPublished: true 
}).partial();
export const insertOnDemandCourseSchema = createInsertSchema(onDemandCourses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCourseVideoSchema = createInsertSchema(courseVideos).omit({ id: true, createdAt: true });
export const insertVideoQuestionSchema = createInsertSchema(videoQuestions).omit({ id: true, createdAt: true });
export const insertCourseQuestionSchema = createInsertSchema(courseQuestions).omit({ id: true, createdAt: true });
export const insertUserVideoProgressSchema = createInsertSchema(userVideoProgress).omit({ id: true, lastWatchedAt: true, completedAt: true });
export const updateOnDemandCourseSchema = insertOnDemandCourseSchema.partial();
export const updateCourseVideoSchema = insertCourseVideoSchema.partial();
export const updateVideoQuestionSchema = insertVideoQuestionSchema.partial();
export const updateCourseQuestionSchema = insertCourseQuestionSchema.partial();
export const insertBadgeSchema = createInsertSchema(badges).omit({ id: true, createdAt: true });
export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({ id: true, earnedAt: true });
export const insertAchievementSchema = createInsertSchema(achievements).omit({ id: true, createdAt: true });
export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDailyChallengeSchema = createInsertSchema(dailyChallenges).omit({ id: true, createdAt: true });
export const insertUserDailyChallengeSchema = createInsertSchema(userDailyChallenges).omit({ id: true, createdAt: true, completedAt: true });
export const insertUserCertificateSchema = createInsertSchema(userCertificates).omit({ id: true, createdAt: true, issuedAt: true });
export const insertLeaderboardSchema = createInsertSchema(leaderboard).omit({ id: true, updatedAt: true });
export const insertActivityLogSchema = createInsertSchema(activityLog).omit({ id: true, createdAt: true });
export const insertCorporateAgreementSchema = createInsertSchema(corporateAgreements).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCorporateInviteSchema = createInsertSchema(corporateInvites).omit({ id: true, createdAt: true });
export const insertCorporateLicenseSchema = createInsertSchema(corporateLicenses).omit({ id: true });
export const insertCorporateCourseAssignmentSchema = createInsertSchema(corporateCourseAssignments).omit({ id: true, createdAt: true });
export const insertSettingSchema = createInsertSchema(settings).omit({ id: true, createdAt: true, updatedAt: true });
export const updateSettingSchema = insertSettingSchema.partial();
export const insertQuizCorporateAccessSchema = createInsertSchema(quizCorporateAccess).omit({ id: true, createdAt: true });
export const insertLiveCourseCorporateAccessSchema = createInsertSchema(liveCourseCorporateAccess).omit({ id: true, createdAt: true });
export const insertOnDemandCourseCorporateAccessSchema = createInsertSchema(onDemandCourseCorporateAccess).omit({ id: true, createdAt: true });

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type InsertQuizGenerationJob = z.infer<typeof insertQuizGenerationJobSchema>;
export type InsertUserQuizAttempt = z.infer<typeof insertUserQuizAttemptSchema>;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type InsertQuizReport = z.infer<typeof insertQuizReportSchema>;
export type InsertLiveCourse = z.infer<typeof insertLiveCourseSchema>;
export type InsertLiveCourseSession = z.infer<typeof insertLiveCourseSessionSchema>;
export type InsertLiveCourseEnrollment = z.infer<typeof insertLiveCourseEnrollmentSchema>;
export type InsertLiveStreamingSession = z.infer<typeof insertLiveStreamingSessionSchema>;
export type InsertLiveStreamingMessage = z.infer<typeof insertLiveStreamingMessageSchema>;
export type InsertLiveStreamingPoll = z.infer<typeof insertLiveStreamingPollSchema>;
export type InsertLiveStreamingPollResponse = z.infer<typeof insertLiveStreamingPollResponseSchema>;
export type InsertContentPage = z.infer<typeof insertContentPageSchema>;
export type UpdateContentPage = z.infer<typeof updateContentPageSchema>;
export type InsertOnDemandCourse = z.infer<typeof insertOnDemandCourseSchema>;
export type InsertCourseVideo = z.infer<typeof insertCourseVideoSchema>;
export type InsertVideoQuestion = z.infer<typeof insertVideoQuestionSchema>;
export type InsertCourseQuestion = z.infer<typeof insertCourseQuestionSchema>;
export type InsertUserVideoProgress = z.infer<typeof insertUserVideoProgressSchema>;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type InsertDailyChallenge = z.infer<typeof insertDailyChallengeSchema>;
export type InsertUserDailyChallenge = z.infer<typeof insertUserDailyChallengeSchema>;
export type InsertUserCertificate = z.infer<typeof insertUserCertificateSchema>;
export type InsertLeaderboard = z.infer<typeof insertLeaderboardSchema>;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type InsertCorporateAgreement = z.infer<typeof insertCorporateAgreementSchema>;
export type InsertCorporateInvite = z.infer<typeof insertCorporateInviteSchema>;
export type InsertCorporateLicense = z.infer<typeof insertCorporateLicenseSchema>;
export type InsertCorporateCourseAssignment = z.infer<typeof insertCorporateCourseAssignmentSchema>;
export type SelectCorporateCourseAssignment = typeof corporateCourseAssignments.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type UpdateSetting = z.infer<typeof updateSettingSchema>;

// Email Templates
export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 50 }).unique().notNull(), // welcome, verification, password_reset, etc.
  name: varchar("name", { length: 100 }).notNull(),
  subject: varchar("subject", { length: 200 }).notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  variables: text("variables").array(), // Available variables like {{firstName}}, {{verificationCode}}, etc.
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;

// Subscription Plans
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(), // e.g., "Premium", "Premium Plus"
  description: text("description"), // AI-formatted bullet points of features
  price: integer("price").notNull(), // Price in cents (e.g., 9000 for €90)
  currency: varchar("currency", { length: 3 }).default("EUR"), // EUR, USD, etc.
  interval: varchar("interval", { length: 20 }).default("year"), // month, year
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0), // For display ordering
  features: text("features").array(), // Array of feature strings for display
  stripeEnabled: boolean("stripe_enabled").default(false), // Show Stripe payment button
  stripeProductId: varchar("stripe_product_id"), // Stripe Product ID (optional)
  stripePriceId: varchar("stripe_price_id"), // Stripe Price ID (optional)
  // Usage limits (-1 = unlimited, null = unlimited)
  maxCoursesPerMonth: integer("max_courses_per_month"), // Max live courses per month, -1 for unlimited
  maxQuizGamingPerWeek: integer("max_quiz_gaming_per_week"), // Max crossword gaming per week, -1 for unlimited
  aiTokensPerMonth: integer("ai_tokens_per_month"), // Monthly AI token limit, -1 for unlimited
  doctorFreeTokenLimit: integer("doctor_free_token_limit"), // Token limit for doctors on Free plan (configurable by admin)
  includesWebinarHealth: boolean("includes_webinar_health").default(false), // Access to free health webinars
  includesProhmedSupport: boolean("includes_prohmed_support").default(false), // Full Prohmed assistance
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;

// Marketing Campaigns
export const marketingCampaigns = pgTable("marketing_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  subject: varchar("subject", { length: 200 }).notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  
  // Segmentation filters (JSON)
  targetFilters: jsonb("target_filters"), // {subscriptionTier: ["free"], profession: ["developer"], etc.}
  
  // Campaign metadata
  status: varchar("status", { length: 20 }).default("draft"), // draft, scheduled, sending, sent, failed
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  
  // Statistics
  recipientsCount: integer("recipients_count").default(0),
  sentCount: integer("sent_count").default(0),
  failedCount: integer("failed_count").default(0),
  openedCount: integer("opened_count").default(0),
  clickedCount: integer("clicked_count").default(0),
  
  createdBy: varchar("created_by"), // Admin user ID
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type MarketingCampaign = typeof marketingCampaigns.$inferSelect;
export const insertMarketingCampaignSchema = createInsertSchema(marketingCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertMarketingCampaign = z.infer<typeof insertMarketingCampaignSchema>;

// Marketing Templates (reusable email templates)
export const marketingTemplates = pgTable("marketing_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }), // promotion, course_recommendation, newsletter, etc.
  
  subject: varchar("subject", { length: 200 }).notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  
  // Variables available in template
  variables: text("variables").array(), // ["{{firstName}}", "{{courseName}}", etc.]
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type MarketingTemplate = typeof marketingTemplates.$inferSelect;
export const insertMarketingTemplateSchema = createInsertSchema(marketingTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertMarketingTemplate = z.infer<typeof insertMarketingTemplateSchema>;

// Campaign Recipients (track who received what)
export const campaignRecipients = pgTable("campaign_recipients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => marketingCampaigns.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  status: varchar("status", { length: 20 }).default("pending"), // pending, sent, failed, opened, clicked
  sentAt: timestamp("sent_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type CampaignRecipient = typeof campaignRecipients.$inferSelect;

// AI Scenario Conversations (post-answer interactive scenarios)
export const scenarioConversations = pgTable("scenario_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  questionId: uuid("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  quizId: uuid("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  
  // Context for AI to generate relevant scenarios
  scenarioType: varchar("scenario_type", { length: 50 }).notNull(), // business_case, personal_development
  category: varchar("category", { length: 100 }), // GDPR, ISO27001, Insight Discovery, etc.
  userAnswer: varchar("user_answer", { length: 10 }), // A, B, C, D
  wasCorrect: boolean("was_correct").notNull(),
  
  // Scenario metadata
  scenarioTitle: text("scenario_title"), // e.g., "Data Breach Response Scenario"
  scenarioContext: text("scenario_context"), // Initial scenario description
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type ScenarioConversation = typeof scenarioConversations.$inferSelect;
export const insertScenarioConversationSchema = createInsertSchema(scenarioConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertScenarioConversation = z.infer<typeof insertScenarioConversationSchema>;

// AI Scenario Messages (conversation messages)
export const scenarioMessages = pgTable("scenario_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => scenarioConversations.id, { onDelete: "cascade" }),
  
  role: varchar("role", { length: 20 }).notNull(), // user, assistant
  content: text("content").notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export type ScenarioMessage = typeof scenarioMessages.$inferSelect;
export const insertScenarioMessageSchema = createInsertSchema(scenarioMessages).omit({
  id: true,
  createdAt: true,
});
export type InsertScenarioMessage = z.infer<typeof insertScenarioMessageSchema>;

// User Feedback (rating and comments)
export const userFeedback = pgTable("user_feedback", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  message: text("message"), // Detailed feedback message
  category: varchar("category", { length: 50 }), // bug, feature_request, improvement, other
  page: varchar("page", { length: 100 }), // Which page user was on
  source: varchar("source", { length: 50 }), // popup, email, manual
  isResolved: boolean("is_resolved").default(false),
  adminNotes: text("admin_notes"), // Internal admin notes
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_feedback_user").on(table.userId),
  index("idx_feedback_category").on(table.category),
  index("idx_feedback_resolved").on(table.isResolved),
]);

export type UserFeedback = typeof userFeedback.$inferSelect;
export const insertUserFeedbackSchema = createInsertSchema(userFeedback).omit({
  id: true,
  createdAt: true,
  isResolved: true,
  adminNotes: true,
});
export type InsertUserFeedback = z.infer<typeof insertUserFeedbackSchema>;

// ========== MEDICAL PREVENTION SYSTEM ==========

// Prevention Documents (uploaded PDFs for AI analysis)
export const preventionDocuments = pgTable("prevention_documents", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  fileUrl: text("file_url").notNull(), // PDF file URL
  fileSize: integer("file_size"), // bytes
  uploadedById: varchar("uploaded_by_id").notNull().references(() => users.id),
  
  // AI Analysis Results (from Gemini)
  analysisStatus: varchar("analysis_status", { length: 20 }).default("pending"), // pending, processing, completed, failed
  extractedTopics: text("extracted_topics").array(), // Topics extracted by AI
  extractedKeywords: text("extracted_keywords").array(), // Keywords extracted by AI
  summary: text("summary"), // AI-generated summary (legacy)
  aiAnalysis: jsonb("ai_analysis"), // Extended AI analysis: {patientSummary, doctorSummary, diagnosis, prevention, severity}
  language: varchar("language", { length: 2 }), // it, en, es
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type PreventionDocument = typeof preventionDocuments.$inferSelect;
export const insertPreventionDocumentSchema = createInsertSchema(preventionDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPreventionDocument = z.infer<typeof insertPreventionDocumentSchema>;

// Prevention Topics (managed topics for quiz categorization)
export const preventionTopics = pgTable("prevention_topics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 20 }),
  isSensitive: boolean("is_sensitive").default(false), // Flag for sensitive topics requiring doctor referral
  createdAt: timestamp("created_at").defaultNow(),
});

export type PreventionTopic = typeof preventionTopics.$inferSelect;
export const insertPreventionTopicSchema = createInsertSchema(preventionTopics).omit({
  id: true,
  createdAt: true,
});
export type InsertPreventionTopic = z.infer<typeof insertPreventionTopicSchema>;

// Medical Triage Sessions (conversational AI triage "Chiedi a Prohmed")
export const triageSessions = pgTable("triage_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }), // Nullable for anonymous educational sessions
  
  // Session metadata
  title: varchar("title", { length: 200 }), // Auto-generated from first message
  status: varchar("status", { length: 20 }).default("active"), // active, closed, escalated
  userRole: varchar("user_role", { length: 20 }).default("patient"), // patient, doctor - determines response style
  
  // Medical flags
  isSensitive: boolean("is_sensitive").default(false),
  suggestDoctor: boolean("suggest_doctor").default(false),
  urgencyLevel: varchar("urgency_level", { length: 20 }).default("low"), // low, medium, high, emergency
  relatedTopics: text("related_topics").array(),
  
  // Context
  documentContext: text("document_context"), // Relevant prevention document excerpts
  
  // Medical history context (for external API integrations like ProhMed)
  medicalHistory: jsonb("medical_history"), // { age, gender, allergies[], chronicConditions[], currentMedications[], previousSurgeries[] }
  
  // Doctor-patient context (for doctor sessions)
  patientContext: jsonb("patient_context"), // { patientId, patientName } when doctor is asking about specific patient
  
  // Language preference (for external API integrations)
  language: varchar("language", { length: 5 }).default("it"), // it, en, fr, de, es
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  closedAt: timestamp("closed_at"),
});

export type TriageSession = typeof triageSessions.$inferSelect;
export const insertTriageSessionSchema = createInsertSchema(triageSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTriageSession = z.infer<typeof insertTriageSessionSchema>;

// Medical History schema for external API integrations (e.g., ProhMed)
export const medicalHistorySchema = z.object({
  age: z.number().int().min(0).max(150).optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  allergies: z.array(z.string()).optional(), // e.g., ["Penicillina", "Lattosio"]
  chronicConditions: z.array(z.string()).optional(), // e.g., ["Diabete tipo 2", "Ipertensione"]
  currentMedications: z.array(z.string()).optional(), // e.g., ["Metformina 500mg", "Ramipril 5mg"]
  previousSurgeries: z.array(z.string()).optional(), // e.g., ["Appendicectomia 2018", "Colecistectomia 2020"]
}).optional();
export type MedicalHistory = z.infer<typeof medicalHistorySchema>;

// Triage Messages (conversation messages)
export const triageMessages = pgTable("triage_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => triageSessions.id, { onDelete: "cascade" }),
  
  role: varchar("role", { length: 20 }).notNull(), // user, assistant
  content: text("content").notNull(),
  
  // AI response metadata (for assistant messages)
  aiUrgencyLevel: varchar("ai_urgency_level", { length: 20 }),
  aiSuggestDoctor: boolean("ai_suggest_doctor"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export type TriageMessage = typeof triageMessages.$inferSelect;
export const insertTriageMessageSchema = createInsertSchema(triageMessages).omit({
  id: true,
  createdAt: true,
});
export type InsertTriageMessage = z.infer<typeof insertTriageMessageSchema>;

// Triage Medical Alerts (flagged sensitive topics for admin review)
export const triageAlerts = pgTable("triage_alerts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => triageSessions.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  alertType: varchar("alert_type", { length: 50 }).notNull(), // sensitive_topic, high_urgency, emergency, doctor_suggested
  reason: text("reason").notNull(),
  urgencyLevel: varchar("urgency_level", { length: 20 }).notNull(),
  
  isReviewed: boolean("is_reviewed").default(false),
  reviewedById: varchar("reviewed_by_id").references(() => users.id),
  reviewNotes: text("review_notes"),
  reviewedAt: timestamp("reviewed_at"),
  
  // User follow-up tracking
  status: varchar("status", { length: 20 }).default("pending"), // pending, user_resolved, monitoring, closed
  userResolved: boolean("user_resolved").default(false),
  userResolvedAt: timestamp("user_resolved_at"),
  followupResponse: text("followup_response"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export type TriageAlert = typeof triageAlerts.$inferSelect;
export const insertTriageAlertSchema = createInsertSchema(triageAlerts).omit({
  id: true,
  createdAt: true,
});
export type InsertTriageAlert = z.infer<typeof insertTriageAlertSchema>;

// Prevention Assessments (initial health assessment with max 10 questions)
export const preventionAssessments = pgTable("prevention_assessments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Assessment metadata
  title: varchar("title", { length: 200 }).default("Assessment Prevenzione"),
  status: varchar("status", { length: 20 }).default("in_progress"), // in_progress, completed
  score: integer("score"), // Overall score (0-100)
  
  // User profile data used for assessment
  userAge: integer("user_age"),
  userGender: varchar("user_gender", { length: 50 }),
  userProfession: varchar("user_profession", { length: 100 }),
  
  // AI-generated insights
  riskLevel: varchar("risk_level", { length: 20 }), // low, moderate, high
  recommendations: text("recommendations").array(), // AI-generated recommendations
  reportPdfUrl: text("report_pdf_url"), // Generated PDF report URL
  
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type PreventionAssessment = typeof preventionAssessments.$inferSelect;
export const insertPreventionAssessmentSchema = createInsertSchema(preventionAssessments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPreventionAssessment = z.infer<typeof insertPreventionAssessmentSchema>;

// Prevention Assessment Questions (AI-generated personalized questions, max 10)
export const preventionAssessmentQuestions = pgTable("prevention_assessment_questions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  assessmentId: uuid("assessment_id").notNull().references(() => preventionAssessments.id, { onDelete: "cascade" }),
  
  questionText: text("question_text").notNull(),
  questionType: varchar("question_type", { length: 20 }).notNull(), // multiple_choice, yes_no, scale, text
  options: text("options").array(), // For multiple choice: ["Opzione 1", "Opzione 2", ...]
  orderIndex: integer("order_index").notNull(), // Display order (1-10)
  
  // AI context
  category: varchar("category", { length: 100 }), // lifestyle, symptoms, history, habits, nutrition, etc.
  importance: varchar("importance", { length: 20 }), // high, medium, low
  
  createdAt: timestamp("created_at").defaultNow(),
});

export type PreventionAssessmentQuestion = typeof preventionAssessmentQuestions.$inferSelect;
export const insertPreventionAssessmentQuestionSchema = createInsertSchema(preventionAssessmentQuestions).omit({
  id: true,
  createdAt: true,
});
export type InsertPreventionAssessmentQuestion = z.infer<typeof insertPreventionAssessmentQuestionSchema>;

// Prevention User Responses (user answers to assessment questions - saved for learning)
export const preventionUserResponses = pgTable("prevention_user_responses", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  assessmentId: uuid("assessment_id").notNull().references(() => preventionAssessments.id, { onDelete: "cascade" }),
  questionId: uuid("question_id").notNull().references(() => preventionAssessmentQuestions.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  answer: text("answer").notNull(), // User's answer
  answerType: varchar("answer_type", { length: 20 }).notNull(), // text, choice, scale_value
  
  // Learning/Analytics metadata
  isCorrect: boolean("is_correct"), // For validation if needed
  confidenceLevel: varchar("confidence_level", { length: 20 }), // high, medium, low (user's confidence)
  
  createdAt: timestamp("created_at").defaultNow(),
});

export type PreventionUserResponse = typeof preventionUserResponses.$inferSelect;
export const insertPreventionUserResponseSchema = createInsertSchema(preventionUserResponses).omit({
  id: true,
  createdAt: true,
});
export type InsertPreventionUserResponse = z.infer<typeof insertPreventionUserResponseSchema>;

// Prevention Index (engagement metric calculated from user activity)
export const preventionIndices = pgTable("prevention_indices", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  
  // Calculated score (0-100)
  score: integer("score").notNull().default(0),
  tier: varchar("tier", { length: 20 }).notNull().default("low"), // low (0-39), medium (40-69), high (70-100)
  
  // Detailed breakdown of metrics contributing to score
  breakdown: jsonb("breakdown").notNull().default({
    frequencyScore: 0,      // Consultation frequency (30 points max)
    depthScore: 0,           // Conversational depth (20 points max)
    documentScore: 0,        // Documents uploaded (20 points max)
    alertScore: 0,           // Critical alerts managed (15 points max)
    insightScore: 0,         // Health insights follow-up (15 points max)
  }),
  
  calculatedAt: timestamp("calculated_at").defaultNow(),
});

export type PreventionIndex = typeof preventionIndices.$inferSelect;
export const insertPreventionIndexSchema = createInsertSchema(preventionIndices).omit({
  id: true,
  calculatedAt: true,
});
export type InsertPreventionIndex = z.infer<typeof insertPreventionIndexSchema>;

// Health Risk Predictions (AI-powered predictive health analysis)
export const healthRiskPredictions = pgTable("health_risk_predictions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Risk identification
  riskType: varchar("risk_type", { length: 100 }).notNull(), // diabetes, cardiovascular, hypertension, obesity, etc.
  riskScore: integer("risk_score").notNull(), // 0-100 probability score
  riskLevel: varchar("risk_level", { length: 20 }).notNull(), // low, medium, high, critical
  
  // Prediction timeframe
  predictedTimeframe: varchar("predicted_timeframe", { length: 50 }).notNull(), // next_year, 1-3_years, 3-5_years, 5+_years
  
  // AI analysis details
  contributingFactors: text("contributing_factors").array(), // ["Sedentary lifestyle", "Family history", "High BMI"]
  recommendations: text("recommendations").array(), // ["Increase physical activity", "Regular blood sugar monitoring"]
  basedOnDocuments: text("based_on_documents").array(), // Array of document IDs analyzed
  aiAnalysis: text("ai_analysis").notNull(), // Detailed AI explanation
  
  // Model metadata
  modelUsed: varchar("model_used", { length: 50 }).default("gemini-2.5-pro"), // AI model identifier
  confidenceLevel: varchar("confidence_level", { length: 20 }).notNull(), // high, medium, low
  
  // Lifecycle
  isActive: boolean("is_active").default(true), // Active predictions shown to user
  expiresAt: timestamp("expires_at").notNull(), // Predictions expire after 6 months
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type HealthRiskPrediction = typeof healthRiskPredictions.$inferSelect;
export const insertHealthRiskPredictionSchema = createInsertSchema(healthRiskPredictions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertHealthRiskPrediction = z.infer<typeof insertHealthRiskPredictionSchema>;

// Prohmed Access Codes (telemedicine app access codes)
export const prohmedCodes = pgTable("prohmed_codes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 50 }).notNull().unique(), // Generated access code
  
  // User who earned/received the code (nullable until redeemed)
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  
  // How the code was earned
  source: varchar("source", { length: 50 }).notNull().default("admin_bulk"), // full_plus_subscription, crossword_winner, admin_bulk
  sourceDetails: text("source_details"), // Additional context
  
  // Code status
  status: varchar("status", { length: 20 }).default("active"), // active, redeemed, expired, revoked
  redeemedAt: timestamp("redeemed_at"),
  expiresAt: timestamp("expires_at"),
  
  // Code type
  accessType: varchar("access_type", { length: 50 }).default("individual"), // individual, family
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type ProhmedCode = typeof prohmedCodes.$inferSelect;
export const insertProhmedCodeSchema = createInsertSchema(prohmedCodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProhmedCode = z.infer<typeof insertProhmedCodeSchema>;

// ========== CROSSWORD GAME SYSTEM ==========

// Crossword Puzzles (AI-generated medical crosswords)
export const crosswordPuzzles = pgTable("crossword_puzzles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Quiz linking (optional - for quiz-specific crosswords)
  quizId: uuid("quiz_id").references(() => quizzes.id, { onDelete: "cascade" }),
  
  title: varchar("title", { length: 200 }).notNull(),
  topic: varchar("topic", { length: 100 }).notNull(), // Medical topic
  difficulty: varchar("difficulty", { length: 20 }).notNull(), // easy, medium, hard
  size: integer("size").default(15), // Grid size (15x15)
  
  // Puzzle data (generated by Gemini AI)
  cluesData: jsonb("clues_data").notNull(), // Array of clue objects
  gridData: jsonb("grid_data").notNull(), // 2D array of letters
  solutionHash: varchar("solution_hash", { length: 64 }), // For validation
  
  // Challenge tracking
  isWeeklyChallenge: boolean("is_weekly_challenge").default(false),
  weekNumber: integer("week_number"), // ISO week number
  weekYear: integer("week_year"), // Year for the week
  
  // Stats
  totalAttempts: integer("total_attempts").default(0),
  totalCompletions: integer("total_completions").default(0),
  
  isActive: boolean("is_active").default(true),
  createdById: varchar("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export type CrosswordPuzzle = typeof crosswordPuzzles.$inferSelect;
export const insertCrosswordPuzzleSchema = createInsertSchema(crosswordPuzzles).omit({
  id: true,
  createdAt: true,
});
export type InsertCrosswordPuzzle = z.infer<typeof insertCrosswordPuzzleSchema>;

// Crossword Attempts (user gameplay)
export const crosswordAttempts = pgTable("crossword_attempts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  puzzleId: uuid("puzzle_id").notNull().references(() => crosswordPuzzles.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Progress
  status: varchar("status", { length: 20 }).default("in_progress"), // in_progress, completed, abandoned
  progressData: jsonb("progress_data"), // User's current answers
  
  // Performance
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  timeSpent: integer("time_spent"), // seconds
  correctAnswers: integer("correct_answers").default(0),
  totalClues: integer("total_clues"),
  score: integer("score").default(0), // Calculated score
  
  // Hints used
  hintsUsed: integer("hints_used").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueUserPuzzle: unique().on(table.userId, table.puzzleId),
}));

export type CrosswordAttempt = typeof crosswordAttempts.$inferSelect;
export const insertCrosswordAttemptSchema = createInsertSchema(crosswordAttempts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCrosswordAttempt = z.infer<typeof insertCrosswordAttemptSchema>;

// Crossword Leaderboard (weekly rankings)
export const crosswordLeaderboard = pgTable("crossword_leaderboard", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  
  weekNumber: integer("week_number").notNull(),
  weekYear: integer("week_year").notNull(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Performance metrics
  totalScore: integer("total_score").default(0),
  puzzlesCompleted: integer("puzzles_completed").default(0),
  averageTime: integer("average_time"), // seconds
  perfectSolves: integer("perfect_solves").default(0), // Completed without hints
  
  // Ranking
  rank: integer("rank"),
  isWinner: boolean("is_winner").default(false), // Top N winners get Prohmed codes
  prohmedCodeId: uuid("prohmed_code_id").references(() => prohmedCodes.id),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueUserWeek: unique().on(table.userId, table.weekNumber, table.weekYear),
}));

export type CrosswordLeaderboard = typeof crosswordLeaderboard.$inferSelect;
export const insertCrosswordLeaderboardSchema = createInsertSchema(crosswordLeaderboard).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCrosswordLeaderboard = z.infer<typeof insertCrosswordLeaderboardSchema>;

// ========== HEALTH SCORE SYSTEM ==========

// User Health Reports (uploaded medical reports with anonymization)
export const userHealthReports = pgTable("user_health_reports", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // File metadata
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(), // pdf, image/jpeg, image/png
  fileSize: integer("file_size"), // bytes
  fileHash: varchar("file_hash", { length: 64 }), // SHA-256 for de-duplication
  filePath: text("file_path"), // Server file path
  
  // Report metadata
  reportType: varchar("report_type", { length: 100 }), // blood_test, radiology, cardiology, etc
  reportDate: timestamp("report_date"), // Date of the medical exam
  issuer: varchar("issuer", { length: 200 }), // Hospital/lab name (anonymized)
  
  // Extracted and anonymized content
  originalText: text("original_text"), // OCR extracted text (anonymized)
  anonymizedText: text("anonymized_text").notNull(), // PII removed
  removedPiiTypes: text("removed_pii_types").array(), // Types of PII found: name, cf, phone, etc
  
  // AI-extracted structured data
  extractedValues: jsonb("extracted_values"), // {glucose: 95, cholesterol: 180, ...}
  medicalKeywords: text("medical_keywords").array(), // Keywords for semantic search
  detectedLanguage: varchar("detected_language", { length: 5 }), // it, en, es
  
  // Radiological analysis (for X-ray, MRI, CT, Ultrasound images)
  radiologicalAnalysis: jsonb("radiological_analysis"), // {imageType, bodyPart, findings[], overallAssessment, recommendations[], confidence}
  
  // Context and analysis
  aiSummary: text("ai_summary"), // Brief summary by AI (legacy, kept for backward compatibility)
  aiAnalysis: jsonb("ai_analysis"), // Extended AI analysis: {patientSummary, doctorSummary, diagnosis, prevention, severity}
  healthImpact: varchar("health_impact", { length: 20 }), // positive, neutral, concerning, critical
  
  // Conversational context
  uploadedVia: varchar("uploaded_via", { length: 50 }).default("manual"), // manual, chat_request, triage
  triageSessionId: varchar("triage_session_id").references(() => triageSessions.id),
  
  // Privacy and consent
  isAnonymized: boolean("is_anonymized").default(true),
  userConsent: boolean("user_consent").default(false), // Consent for ML training
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UserHealthReport = typeof userHealthReports.$inferSelect;
export const insertUserHealthReportSchema = createInsertSchema(userHealthReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUserHealthReport = z.infer<typeof insertUserHealthReportSchema>;

// Health Score History (track user's health score over time)
export const healthScoreHistory = pgTable("health_score_history", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Score calculation
  overallScore: integer("overall_score").notNull(), // 0-100
  calculationMethod: varchar("calculation_method", { length: 50 }).default("rule_based"), // rule_based, ml_model, hybrid
  
  // Score components (weighted average)
  lifestyleScore: integer("lifestyle_score"), // 0-100
  labResultsScore: integer("lab_results_score"), // 0-100
  symptomScore: integer("symptom_score"), // 0-100
  riskFactorsScore: integer("risk_factors_score"), // 0-100
  
  // Contributing factors
  contributingReportIds: text("contributing_report_ids").array(), // UUIDs of reports used
  contributingAssessmentIds: text("contributing_assessment_ids").array(), // UUIDs of assessments used
  
  // AI insights
  scoreInsights: text("score_insights").array(), // Key insights from AI
  trendDirection: varchar("trend_direction", { length: 20 }), // improving, stable, declining
  
  // Metadata
  calculatedAt: timestamp("calculated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type HealthScoreHistory = typeof healthScoreHistory.$inferSelect;
export const insertHealthScoreHistorySchema = createInsertSchema(healthScoreHistory).omit({
  id: true,
  createdAt: true,
  calculatedAt: true,
});
export type InsertHealthScoreHistory = z.infer<typeof insertHealthScoreHistorySchema>;

// Health Insights (AI-generated personalized health insights and recommendations)
export const healthInsights = pgTable("health_insights", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Insight metadata
  insightType: varchar("insight_type", { length: 50 }).notNull(), // attention_area, strength, recommendation, warning
  category: varchar("category", { length: 100 }).notNull(), // cardiovascular, metabolic, lifestyle, mental_health
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high, urgent
  
  // Content
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  actionableSteps: text("actionable_steps").array(), // Steps user can take
  
  // Evidence
  basedOnReportIds: text("based_on_report_ids").array(), // Supporting reports
  basedOnAssessmentIds: text("based_on_assessment_ids").array(), // Supporting assessments
  confidence: integer("confidence"), // 0-100, AI confidence level
  
  // Status
  status: varchar("status", { length: 20 }).default("active"), // active, acknowledged, resolved, dismissed
  acknowledgedAt: timestamp("acknowledged_at"),
  resolvedAt: timestamp("resolved_at"),
  
  // Follow-up
  suggestedFollowUpDays: integer("suggested_follow_up_days"), // Days until recheck
  relatedPreventionTopics: text("related_prevention_topics").array(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type HealthInsight = typeof healthInsights.$inferSelect;
export const insertHealthInsightSchema = createInsertSchema(healthInsights).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertHealthInsight = z.infer<typeof insertHealthInsightSchema>;

// User Token Usage (for AI conversation limits)
export const userTokenUsage = pgTable("user_token_usage", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  monthYear: varchar("month_year", { length: 7 }).notNull(), // Format: YYYY-MM
  tokensUsed: integer("tokens_used").default(0).notNull(),
  messageCount: integer("message_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueUserMonth: unique().on(table.userId, table.monthYear),
}));

export type UserTokenUsage = typeof userTokenUsage.$inferSelect;
export const insertUserTokenUsageSchema = createInsertSchema(userTokenUsage).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUserTokenUsage = z.infer<typeof insertUserTokenUsageSchema>;

// Job Queue (for async processing of heavy tasks like document analysis)
export const jobQueue = pgTable("job_queue", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Job metadata
  jobType: varchar("job_type", { length: 50 }).notNull(), // medical_report_analysis, health_score_calculation
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, processing, completed, failed
  priority: integer("priority").default(5), // 1 (highest) to 10 (lowest)
  
  // Input/Output data
  inputData: jsonb("input_data").notNull(), // Job parameters (filePath, fileType, etc)
  outputData: jsonb("output_data"), // Job results
  
  // Progress tracking
  progress: integer("progress").default(0), // 0-100
  currentStep: varchar("current_step", { length: 100 }), // OCR, PII removal, AI analysis, etc
  
  // Error handling
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  
  // Timing
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_job_queue_status").on(table.status),
  index("idx_job_queue_user").on(table.userId),
  index("idx_job_queue_created").on(table.createdAt),
]);

export type JobQueue = typeof jobQueue.$inferSelect;
export const insertJobQueueSchema = createInsertSchema(jobQueue).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertJobQueue = z.infer<typeof insertJobQueueSchema>;

// Medical Knowledge Base (RAG - Scientific Documents)
export const medicalKnowledgeBase = pgTable("medical_knowledge_base", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Document metadata
  title: varchar("title", { length: 500 }).notNull(),
  documentType: varchar("document_type", { length: 50 }).notNull(), // guideline, study, protocol, article, review
  source: varchar("source", { length: 300 }), // Publisher, journal, institution
  authors: text("authors"), // Comma-separated or JSON
  publicationDate: timestamp("publication_date"),
  doi: varchar("doi", { length: 200 }), // Digital Object Identifier
  url: text("url"), // External link to full document
  
  // Content
  abstract: text("abstract"), // Summary/abstract
  fullContent: text("full_content"), // Full text content (if available)
  fileUrl: varchar("file_url", { length: 500 }), // S3/storage path to PDF
  
  // Classification
  medicalTopics: text("medical_topics").array(), // ["cardiology", "diabetes", "prevention"]
  keywords: text("keywords").array(), // Searchable keywords
  language: varchar("language", { length: 2 }).default("it"), // it, en, es
  
  // Metadata
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id),
  isActive: boolean("is_active").default(true), // Admin can deactivate
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_medical_kb_topics").on(table.medicalTopics),
  index("idx_medical_kb_type").on(table.documentType),
  index("idx_medical_kb_active").on(table.isActive),
]);

export type MedicalKnowledgeBase = typeof medicalKnowledgeBase.$inferSelect;
export const insertMedicalKnowledgeBaseSchema = createInsertSchema(medicalKnowledgeBase).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertMedicalKnowledgeBase = z.infer<typeof insertMedicalKnowledgeBaseSchema>;

// Medical Knowledge Chunks (for semantic search with vector embeddings)
export const medicalKnowledgeChunks = pgTable("medical_knowledge_chunks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Parent document reference
  documentId: uuid("document_id").notNull().references(() => medicalKnowledgeBase.id, { onDelete: "cascade" }),
  
  // Chunk data
  chunkIndex: integer("chunk_index").notNull(), // Order in document (0, 1, 2...)
  content: text("content").notNull(), // Text chunk (~500-1000 tokens)
  
  // Vector embedding for similarity search (using pgvector)
  embedding: vector("embedding", { dimensions: 768 }), // Gemini text-embedding-004 produces 768-dim vectors
  
  // Metadata for retrieval
  tokenCount: integer("token_count"), // Approximate token count
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_chunk_document").on(table.documentId),
  // Note: Vector similarity index (HNSW) will be created via SQL migration after push
]);

export type MedicalKnowledgeChunk = typeof medicalKnowledgeChunks.$inferSelect;
export const insertMedicalKnowledgeChunkSchema = createInsertSchema(medicalKnowledgeChunks).omit({
  id: true,
  createdAt: true,
});
export type InsertMedicalKnowledgeChunk = z.infer<typeof insertMedicalKnowledgeChunkSchema>;

// Professional Contact Requests (for doctor registration requests)
export const professionalContactRequests = pgTable("professional_contact_requests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  specialization: varchar("specialization", { length: 200 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, approved, rejected, contacted
  adminNotes: text("admin_notes"), // Internal notes for admin
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_professional_requests_status").on(table.status),
  index("idx_professional_requests_email").on(table.email),
]);

export type ProfessionalContactRequest = typeof professionalContactRequests.$inferSelect;
export const insertProfessionalContactRequestSchema = createInsertSchema(professionalContactRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProfessionalContactRequest = z.infer<typeof insertProfessionalContactRequestSchema>;

// Doctor-Patient Links (for doctor-patient relationship via doctor code)
export const doctorPatientLinks = pgTable("doctor_patient_links", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  doctorId: varchar("doctor_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  patientId: varchar("patient_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  doctorCode: varchar("doctor_code", { length: 20 }).notNull(), // The code used by patient to link
  linkedAt: timestamp("linked_at").defaultNow(),
}, (table) => [
  unique("unique_doctor_patient").on(table.doctorId, table.patientId),
  index("idx_doctor_patient_doctor").on(table.doctorId),
  index("idx_doctor_patient_patient").on(table.patientId),
  index("idx_doctor_patient_code").on(table.doctorCode),
]);

export type DoctorPatientLink = typeof doctorPatientLinks.$inferSelect;
export const insertDoctorPatientLinkSchema = createInsertSchema(doctorPatientLinks).omit({
  id: true,
  linkedAt: true,
});
export type InsertDoctorPatientLink = z.infer<typeof insertDoctorPatientLinkSchema>;

// Doctor Notes (medical notes sent by doctors to patients)
export const doctorNotes = pgTable("doctor_notes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  doctorId: varchar("doctor_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  patientId: varchar("patient_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  preventionDocumentId: uuid("prevention_document_id").references(() => preventionDocuments.id, { onDelete: 'set null' }), // Optional: link to specific document
  alertId: uuid("alert_id").references(() => triageAlerts.id, { onDelete: 'set null' }), // Optional: link to specific alert
  noteTitle: varchar("note_title", { length: 200 }),
  noteText: text("note_text").notNull(),
  isReport: boolean("is_report").default(false), // True if this is a formal medical report
  
  // Category for organizing notes
  category: varchar("category", { length: 50 }).default('Generico'), // 'Ricetta Medica', 'Refertazione', 'Consiglio', 'Generico'
  
  // File attachment support
  attachmentPath: text("attachment_path"), // Server file path
  attachmentName: varchar("attachment_name", { length: 255 }), // Original filename
  attachmentType: varchar("attachment_type", { length: 100 }), // MIME type
  attachmentSize: integer("attachment_size"), // File size in bytes
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_doctor_notes_doctor").on(table.doctorId),
  index("idx_doctor_notes_patient").on(table.patientId),
  index("idx_doctor_notes_document").on(table.preventionDocumentId),
  index("idx_doctor_notes_alert").on(table.alertId),
]);

export type DoctorNote = typeof doctorNotes.$inferSelect;
export const insertDoctorNoteSchema = createInsertSchema(doctorNotes).omit({
  id: true,
  createdAt: true,
});
export type InsertDoctorNote = z.infer<typeof insertDoctorNoteSchema>;

// Audit Logs (GDPR-compliant access tracking)
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: varchar("action", { length: 100 }).notNull(), // view_report, download_report, share_report, delete_report
  resourceType: varchar("resource_type", { length: 50 }).notNull(), // health_report, prevention_document, doctor_note
  resourceId: uuid("resource_id").notNull(), // ID of the accessed resource
  resourceOwnerId: varchar("resource_owner_id").references(() => users.id, { onDelete: 'set null' }), // Owner of the resource (for cross-user access tracking)
  ipAddress: varchar("ip_address", { length: 45 }), // IPv4 or IPv6
  userAgent: text("user_agent"),
  metadata: jsonb("metadata"), // Additional context: {documentType, doctorId, patientId, etc}
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_audit_user").on(table.userId),
  index("idx_audit_resource").on(table.resourceType, table.resourceId),
  index("idx_audit_owner").on(table.resourceOwnerId),
  index("idx_audit_created").on(table.createdAt),
]);

export type AuditLog = typeof auditLogs.$inferSelect;
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

// Login Logs (Track user authentication events)
export const loginLogs = pgTable("login_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'set null' }), // Nullable to track failed logins
  userEmail: varchar("user_email", { length: 255 }).notNull(),
  userName: varchar("user_name", { length: 255 }),
  userRole: varchar("user_role", { length: 50 }),
  success: boolean("success").notNull().default(true), // true = successful login, false = failed attempt
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  failureReason: text("failure_reason"), // Why login failed (wrong password, account locked, etc.)
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_login_user").on(table.userId),
  index("idx_login_email").on(table.userEmail),
  index("idx_login_created").on(table.createdAt),
  index("idx_login_success").on(table.success),
]);

export type LoginLog = typeof loginLogs.$inferSelect;
export const insertLoginLogSchema = createInsertSchema(loginLogs).omit({
  id: true,
  createdAt: true,
});
export type InsertLoginLog = z.infer<typeof insertLoginLogSchema>;

// Appointments (Calendar system for doctor-patient appointments)
export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  doctorId: varchar("doctor_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  patientId: varchar("patient_id").references(() => users.id, { onDelete: 'cascade' }), // Nullable if slot not yet booked
  
  // Appointment details
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  title: varchar("title", { length: 200 }),
  description: text("description"),
  notes: text("notes"), // Patient notes when booking
  voiceNotes: text("voice_notes"), // Voice notes from patient
  type: varchar("type", { length: 50 }).default("consultation"), // consultation, follow_up, screening, emergency
  appointmentType: varchar("appointment_type", { length: 20 }).default("video"), // video, in_person, both
  status: varchar("status", { length: 20 }).default("available"), // available, booked, confirmed, completed, cancelled, no_show
  
  // Online meeting details
  meetingUrl: text("meeting_url"), // Video call link (Google Meet, Zoom, etc)
  meetingPlatform: varchar("meeting_platform", { length: 50 }), // google_meet, zoom, teams
  
  // Legacy Jitsi video room fields (keep for backwards compatibility)
  videoRoomUrl: text("video_room_url"), // Legacy Jitsi room URL
  videoRoomId: varchar("video_room_id", { length: 255 }), // Legacy Jitsi room ID
  
  // In-person appointment details
  studioAddress: text("studio_address"), // Physical address for in-person appointments
  
  // Patient contact
  patientPhone: varchar("patient_phone", { length: 50 }), // Patient phone for appointment
  
  // Patient context (demographics, onboarding, AI conversation summary)
  patientContext: jsonb("patient_context"), // Structured JSON with patient info, onboarding data, and AI motivation
  patientSessionId: uuid("patient_session_id"), // Link to triage session that triggered booking
  
  // Notifications
  reminderSentAt: timestamp("reminder_sent_at"),
  confirmationSentAt: timestamp("confirmation_sent_at"),
  whatsappConfirmationSent: boolean("whatsapp_confirmation_sent").default(false), // WhatsApp confirmation sent
  
  // Cancellation tracking
  cancelledBy: varchar("cancelled_by"), // doctor_id or patient_id
  cancellationReason: text("cancellation_reason"),
  cancelledAt: timestamp("cancelled_at"),
  
  // Slot lineage tracking (links to doctor_schedule_rules or doctor_schedule_exceptions)
  originType: varchar("origin_type", { length: 20 }), // rule, exception, manual, legacy
  originId: uuid("origin_id"), // Points to doctorScheduleRules.id or doctorScheduleExceptions.id
  originVersion: integer("origin_version"), // Tracks version of rule/exception at expansion time
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_appointments_doctor").on(table.doctorId),
  index("idx_appointments_patient").on(table.patientId),
  index("idx_appointments_time").on(table.startTime),
  index("idx_appointments_status").on(table.status),
  index("idx_appointments_origin").on(table.originType, table.originId),
  // Partial index for available slots only (performance optimization)
  index("idx_appointments_available").on(table.doctorId, table.startTime).where(sql`status = 'available'`),
  // Composite unique to prevent duplicate slots for same doctor+time
  unique("unique_doctor_time").on(table.doctorId, table.startTime),
]);

export type Appointment = typeof appointments.$inferSelect;
export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

// Appointment Attachments (documents uploaded by patients when booking)
export const appointmentAttachments = pgTable("appointment_attachments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  appointmentId: uuid("appointment_id").notNull().references(() => appointments.id, { onDelete: 'cascade' }),
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id, { onDelete: 'cascade' }), // Patient who uploaded
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(), // Path to stored file
  fileSize: integer("file_size"), // Size in bytes
  fileType: varchar("file_type", { length: 100 }), // MIME type
  description: text("description"), // Optional description from patient
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_attachment_appointment").on(table.appointmentId),
  index("idx_attachment_uploader").on(table.uploadedBy),
]);

export type AppointmentAttachment = typeof appointmentAttachments.$inferSelect;
export const insertAppointmentAttachmentSchema = createInsertSchema(appointmentAttachments).omit({
  id: true,
  createdAt: true,
});
export type InsertAppointmentAttachment = z.infer<typeof insertAppointmentAttachmentSchema>;

// Clinic Organizations (Multi-tenant B2B for hospitals/clinics)
export const clinicOrganizations = pgTable("clinic_organizations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(), // URL-friendly identifier
  
  // Branding
  logoUrl: text("logo_url"),
  primaryColor: varchar("primary_color", { length: 7 }), // Hex color #RRGGBB
  secondaryColor: varchar("secondary_color", { length: 7 }),
  customDomain: varchar("custom_domain", { length: 255 }), // e.g., health.clinic-name.com
  
  // Contact information
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  website: text("website"),
  
  // Subscription & limits
  subscriptionTier: varchar("subscription_tier", { length: 50 }).default("basic"), // basic, professional, enterprise
  maxDoctors: integer("max_doctors").default(5),
  maxPatients: integer("max_patients").default(100),
  
  // Features enabled
  featuresEnabled: jsonb("features_enabled"), // {appointments: true, aiAnalysis: true, etc}
  
  // Admin contact
  adminUserId: varchar("admin_user_id").references(() => users.id, { onDelete: 'set null' }), // Primary admin
  
  // Billing
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  
  // Status
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_clinic_slug").on(table.slug),
  index("idx_clinic_active").on(table.isActive),
  index("idx_clinic_admin").on(table.adminUserId),
]);

export type ClinicOrganization = typeof clinicOrganizations.$inferSelect;
export const insertClinicOrganizationSchema = createInsertSchema(clinicOrganizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertClinicOrganization = z.infer<typeof insertClinicOrganizationSchema>;

// Email Notifications (Queue for intelligent email notifications)
export const emailNotifications = pgTable("email_notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Email details
  recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 300 }).notNull(),
  body: text("body").notNull(), // HTML or plain text
  templateId: varchar("template_id", { length: 100 }), // Brevo template ID
  
  // Notification type
  type: varchar("type", { length: 50 }).notNull(), // alert_urgent, screening_reminder, new_report, appointment_reminder, welcome, password_reset
  priority: varchar("priority", { length: 20 }).default("normal"), // low, normal, high, urgent
  
  // Scheduling
  scheduledFor: timestamp("scheduled_for"), // When to send (null = send immediately)
  
  // Status tracking
  status: varchar("status", { length: 20 }).default("pending"), // pending, sent, failed, cancelled
  sentAt: timestamp("sent_at"),
  failureReason: text("failure_reason"),
  retryCount: integer("retry_count").default(0),
  
  // Context & metadata
  relatedResourceType: varchar("related_resource_type", { length: 50 }), // appointment, report, alert
  relatedResourceId: uuid("related_resource_id"),
  metadata: jsonb("metadata"), // Additional data for email personalization
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_email_user").on(table.userId),
  index("idx_email_status").on(table.status),
  index("idx_email_type").on(table.type),
  index("idx_email_scheduled").on(table.scheduledFor),
  index("idx_email_created").on(table.createdAt),
]);

export type EmailNotification = typeof emailNotifications.$inferSelect;
export const insertEmailNotificationSchema = createInsertSchema(emailNotifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertEmailNotification = z.infer<typeof insertEmailNotificationSchema>;

// Push Notification Subscriptions
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Push subscription data from browser
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(), // Public key
  auth: text("auth").notNull(), // Auth secret
  
  // Device/browser info
  userAgent: text("user_agent"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_push_user").on(table.userId),
]);

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({
  id: true,
  createdAt: true,
});
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;

// In-App Notifications (Bell icon notifications)
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Notification content
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // doctor_note, admin_broadcast, new_report, alert, system
  
  // State
  read: boolean("read").default(false).notNull(),
  readAt: timestamp("read_at"),
  
  // Related resource (optional)
  relatedResourceType: varchar("related_resource_type", { length: 50 }), // doctor_note, health_report, alert
  relatedResourceId: uuid("related_resource_id"),
  relatedUrl: varchar("related_url", { length: 500 }), // URL to navigate when clicked (e.g., /documenti, /prevention)
  
  // Metadata
  iconType: varchar("icon_type", { length: 50 }), // stethoscope, file, alert, info
  priority: varchar("priority", { length: 20 }).default("normal"), // low, normal, high, urgent
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_notification_user").on(table.userId),
  index("idx_notification_read").on(table.read),
  index("idx_notification_type").on(table.type),
  index("idx_notification_created").on(table.createdAt),
]);

export type Notification = typeof notifications.$inferSelect;
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// ========== ML TRAINING DATA COLLECTION ==========

// ML Training Data (for building custom models - COLLECTS ALL PLATFORM DATA)
// Intercepts ALL AI interactions: Gemini, OpenAI, medical notes, documents, conversations
export const mlTrainingData = pgTable("ml_training_data", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Request metadata - ALL interaction types
  requestType: varchar("request_type", { length: 100 }).notNull(), 
  // AI Interactions: 'radiological_analysis', 'medical_triage', 'prevention_chat', 'crossword_generation',
  // 'conversational_assistant', 'email_marketing', 'ai_translation'
  // Medical Data: 'doctor_note', 'medical_report', 'ecg_upload', 'document_upload'
  // Other: 'user_feedback', 'health_assessment'
  
  modelUsed: varchar("model_used", { length: 50 }).notNull(), 
  // Models: 'gemini-2.5-pro', 'gemini-2.5-flash', 'gpt-4o', 'gpt-4o-mini', 'tts-1', 'manual' (for non-AI data)
  
  // Input data
  inputImagePath: text("input_image_path"), // Path to stored image (for radiological analysis)
  inputImageHash: varchar("input_image_hash", { length: 64 }), // SHA-256 of image for de-duplication
  inputText: text("input_text"), // Text input (for triage, chat, etc.)
  inputPrompt: text("input_prompt").notNull(), // Full prompt sent to Gemini
  
  // Output data
  outputJson: jsonb("output_json").notNull(), // Full Gemini response (JSON parsed)
  outputRaw: text("output_raw"), // Raw text response from Gemini
  
  // User context
  userId: varchar("user_id").references(() => users.id, { onDelete: 'set null' }),
  userAge: integer("user_age"),
  userGender: varchar("user_gender", { length: 10 }),
  
  // Performance metrics
  responseTimeMs: integer("response_time_ms"), // Time taken to get response from Gemini
  tokensUsed: integer("tokens_used"), // Estimated tokens consumed
  confidenceScore: integer("confidence_score"), // AI confidence (0-100)
  
  // Quality feedback (for supervised learning)
  userFeedback: varchar("user_feedback", { length: 20 }), // 'positive', 'negative', 'corrected', null
  doctorCorrectionJson: jsonb("doctor_correction_json"), // If doctor corrected the AI response
  doctorNotes: text("doctor_notes"), // Doctor's comments on the analysis
  
  // Training flags
  includedInTraining: boolean("included_in_training").default(false), // Whether this data has been used for training
  qualityRating: integer("quality_rating"), // 1-5 stars rating for dataset curation
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  exportedAt: timestamp("exported_at"), // When data was exported for training
}, (table) => [
  index("idx_ml_training_request_type").on(table.requestType),
  index("idx_ml_training_model").on(table.modelUsed),
  index("idx_ml_training_created").on(table.createdAt),
  index("idx_ml_training_feedback").on(table.userFeedback),
  index("idx_ml_training_included").on(table.includedInTraining),
]);

export type MLTrainingData = typeof mlTrainingData.$inferSelect;
export const insertMLTrainingDataSchema = createInsertSchema(mlTrainingData).omit({
  id: true,
  createdAt: true,
});
export type InsertMLTrainingData = z.infer<typeof insertMLTrainingDataSchema>;

// ========== EXTERNAL API KEYS ==========

// API Keys for external app integrations (triage API, etc.)
export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // API key metadata
  name: varchar("name", { length: 200 }).notNull(), // Descriptive name (e.g., "Mobile App Prod")
  keyHash: varchar("key_hash", { length: 255 }).notNull().unique(), // SHA-256 hash of the API key
  keyPrefix: varchar("key_prefix", { length: 20 }).notNull(), // First 8 chars for display (e.g., "ciry_abc")
  
  // Permissions and scopes
  scopes: jsonb("scopes").notNull(), // Array of allowed endpoints: ["triage", "reports", "users"]
  active: boolean("active").default(true).notNull(),
  
  // Usage tracking
  lastUsedAt: timestamp("last_used_at"),
  requestCount: integer("request_count").default(0),
  
  // Rate limiting
  rateLimitPerMinute: integer("rate_limit_per_minute").default(60), // Max requests per minute
  
  // Owner
  createdBy: varchar("created_by").references(() => users.id, { onDelete: 'set null' }), // Admin who created the key
  
  // Metadata
  expiresAt: timestamp("expires_at"), // Optional expiry date
  createdAt: timestamp("created_at").defaultNow(),
  revokedAt: timestamp("revoked_at"),
}, (table) => [
  index("idx_api_key_hash").on(table.keyHash),
  index("idx_api_key_active").on(table.active),
  index("idx_api_key_created_by").on(table.createdBy),
]);

export type ApiKey = typeof apiKeys.$inferSelect;
export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
  requestCount: true,
  lastUsedAt: true,
  revokedAt: true,
});
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;

// ========== TELECONSULTO SYSTEM ==========

// Doctor availability slots for teleconsultation booking (LEGACY - migrating to doctor_schedule_rules)
export const doctorAvailability = pgTable("doctor_availability", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  doctorId: varchar("doctor_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: varchar("start_time", { length: 5 }).notNull(), // HH:MM format (e.g., "09:00")
  endTime: varchar("end_time", { length: 5 }).notNull(), // HH:MM format (e.g., "17:00")
  slotDuration: integer("slot_duration").default(30).notNull(), // minutes: 30 or 60
  appointmentType: varchar("appointment_type", { length: 20 }).default('both'), // video, in_person, both
  studioAddress: text("studio_address"), // Physical address for in-person appointments
  isActive: boolean("is_active").default(true).notNull(),
  legacyMigrated: boolean("legacy_migrated").default(false), // Track if migrated to new doctor_schedule_rules system
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_doctor_availability_doctor").on(table.doctorId),
  index("idx_doctor_availability_active").on(table.isActive),
]);

export type DoctorAvailability = typeof doctorAvailability.$inferSelect;
export const insertDoctorAvailabilitySchema = createInsertSchema(doctorAvailability).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDoctorAvailability = z.infer<typeof insertDoctorAvailabilitySchema>;

// Advanced doctor scheduling rules (supports weekly, biweekly, monthly, custom recurrence patterns)
export const doctorScheduleRules = pgTable("doctor_schedule_rules", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  doctorId: varchar("doctor_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Recurrence pattern
  frequency: varchar("frequency", { length: 20 }).notNull(), // weekly, biweekly, monthly, custom
  interval: integer("interval").default(1).notNull(), // every N weeks/months (must be > 0)
  byWeekDay: jsonb("by_week_day"), // Array[0-6] for weekly patterns: [1,3,5] = Mon,Wed,Fri
  byMonthDay: jsonb("by_month_day"), // Array[1-31] for monthly patterns: [1,15] = 1st & 15th
  bySetPos: integer("by_set_pos"), // 1=first, -1=last (for "first Monday of month")
  
  // Time slots
  startTime: varchar("start_time", { length: 5 }).notNull(), // HH:MM format
  endTime: varchar("end_time", { length: 5 }).notNull(), // HH:MM format (must be > startTime)
  slotDuration: integer("slot_duration").default(30).notNull(), // minutes (15, 30, 45, 60)
  
  // Appointment details
  appointmentType: varchar("appointment_type", { length: 20 }).default('both'), // video, in_person, both
  studioAddress: text("studio_address"),
  
  // Rule validity
  startDate: timestamp("start_date").notNull(), // When rule becomes active
  endDate: timestamp("end_date"), // When rule expires (nullable = indefinite)
  timezone: varchar("timezone", { length: 50 }).default('Europe/Rome').notNull(),
  
  // Expansion tracking
  lastExpandedAt: timestamp("last_expanded_at"), // Last time slots were generated from this rule
  lastExpandedVersion: integer("last_expanded_version").default(1), // Increment on rule update
  
  // Status
  isActive: boolean("is_active").default(true).notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_schedule_rules_doctor").on(table.doctorId),
  index("idx_schedule_rules_active").on(table.isActive),
  index("idx_schedule_rules_frequency").on(table.frequency),
  index("idx_schedule_rules_doctor_active").on(table.doctorId, table.isActive),
  // Partial index for active rules only
  index("idx_schedule_rules_doctor_active_partial").on(table.doctorId).where(sql`is_active = true`),
]);

export type DoctorScheduleRule = typeof doctorScheduleRules.$inferSelect;
export const insertDoctorScheduleRuleSchema = createInsertSchema(doctorScheduleRules).omit({
  id: true,
  lastExpandedAt: true,
  lastExpandedVersion: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Validate JSONB arrays contain only integers
  byWeekDay: z.array(z.number().int().min(0).max(6)).optional(),
  byMonthDay: z.array(z.number().int().min(1).max(31)).optional(),
  // Validate interval is positive
  interval: z.number().int().min(1),
  // Validate time format HH:MM
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Must be HH:MM format"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Must be HH:MM format"),
});
export type InsertDoctorScheduleRule = z.infer<typeof insertDoctorScheduleRuleSchema>;

// Doctor schedule exceptions (block dates, modify hours, one-time slots)
export const doctorScheduleExceptions = pgTable("doctor_schedule_exceptions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  doctorId: varchar("doctor_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Optional: link to rule being overridden (nullable for standalone exceptions)
  recurringRuleId: uuid("recurring_rule_id").references(() => doctorScheduleRules.id, { onDelete: 'cascade' }),
  
  // Exception details
  exceptionDate: timestamp("exception_date").notNull(), // Specific date affected (date only, ignore time)
  exceptionType: varchar("exception_type", { length: 20 }).notNull(), // block, modify, one_time_slot
  
  // Modified time (for modify/one_time_slot types, nullable for block type)
  startTime: varchar("start_time", { length: 5 }), // HH:MM format
  endTime: varchar("end_time", { length: 5 }), // HH:MM format
  slotDuration: integer("slot_duration"), // minutes
  appointmentType: varchar("appointment_type", { length: 20 }), // video, in_person, both
  studioAddress: text("studio_address"),
  
  // Reason
  reason: text("reason"), // vacation, holiday, conference, emergency, etc.
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_schedule_exceptions_doctor").on(table.doctorId),
  index("idx_schedule_exceptions_date").on(table.exceptionDate),
  index("idx_schedule_exceptions_rule").on(table.recurringRuleId),
  // Composite index for efficient lookups of doctor's exceptions on specific dates
  index("idx_schedule_exceptions_doctor_date").on(table.doctorId, table.exceptionDate),
]);

export type DoctorScheduleException = typeof doctorScheduleExceptions.$inferSelect;
export const insertDoctorScheduleExceptionSchema = createInsertSchema(doctorScheduleExceptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Validate time format HH:MM if provided
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Must be HH:MM format").optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Must be HH:MM format").optional(),
});
export type InsertDoctorScheduleException = z.infer<typeof insertDoctorScheduleExceptionSchema>;

// Appointment reminders for automated notifications
export const appointmentReminders = pgTable("appointment_reminders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  appointmentId: uuid("appointment_id").notNull().references(() => appointments.id, { onDelete: 'cascade' }),
  reminderType: varchar("reminder_type", { length: 20 }).notNull(), // confirmation, reminder_24h, reminder_2h
  scheduledFor: timestamp("scheduled_for").notNull(),
  sentAt: timestamp("sent_at"),
  status: varchar("status", { length: 20 }).default('pending').notNull(), // pending, sent, failed, skipped
  channel: varchar("channel", { length: 20 }).notNull(), // email, whatsapp, both
  errorMessage: text("error_message"),
  twilioSid: text("twilio_sid"), // WhatsApp/SMS message SID from Twilio for traceability
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_appointment_reminders_appointment").on(table.appointmentId),
  index("idx_appointment_reminders_status").on(table.status),
  index("idx_appointment_reminders_scheduled").on(table.scheduledFor),
  unique("unique_reminder_per_appointment").on(table.appointmentId, table.reminderType), // Prevent duplicate reminders
]);

export type AppointmentReminder = typeof appointmentReminders.$inferSelect;
export const insertAppointmentReminderSchema = createInsertSchema(appointmentReminders).omit({
  id: true,
  createdAt: true,
  sentAt: true,
});
export type InsertAppointmentReminder = z.infer<typeof insertAppointmentReminderSchema>;

// ========== WEARABLE INTEGRATION ==========

// Registered wearable devices (blood pressure monitors, etc.)
export const wearableDevices = pgTable("wearable_devices", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  deviceType: varchar("device_type", { length: 50 }).notNull(), // blood_pressure, glucose, heart_rate, etc.
  manufacturer: varchar("manufacturer", { length: 100 }), // Omron, Withings, Apple, etc.
  model: varchar("model", { length: 100 }),
  deviceId: varchar("device_id", { length: 255 }).notNull(), // Unique device identifier from manufacturer
  apiToken: varchar("api_token", { length: 500 }), // OAuth token for device API
  isActive: boolean("is_active").default(true).notNull(),
  lastSyncAt: timestamp("last_sync_at"),
  metadata: jsonb("metadata"), // Additional device-specific data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wearable_devices_user").on(table.userId),
  index("idx_wearable_devices_type").on(table.deviceType),
  unique("unique_device_id").on(table.deviceId, table.userId),
]);

export type WearableDevice = typeof wearableDevices.$inferSelect;
export const insertWearableDeviceSchema = createInsertSchema(wearableDevices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSyncAt: true,
});
export type InsertWearableDevice = z.infer<typeof insertWearableDeviceSchema>;

// Blood pressure readings from wearable devices
export const bloodPressureReadings = pgTable("blood_pressure_readings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  deviceId: uuid("device_id").references(() => wearableDevices.id, { onDelete: 'set null' }),
  systolic: integer("systolic").notNull(), // mmHg (es. 120)
  diastolic: integer("diastolic").notNull(), // mmHg (es. 80)
  heartRate: integer("heart_rate"), // bpm (es. 72)
  measurementTime: timestamp("measurement_time").notNull(), // Timestamp from device
  notes: text("notes"), // Optional user notes about context (e.g., "after exercise")
  isAnomalous: boolean("is_anomalous").default(false), // Flagged by AI if outside normal range
  aiAnalysis: text("ai_analysis"), // AI-generated insights about the reading
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_blood_pressure_user").on(table.userId),
  index("idx_blood_pressure_device").on(table.deviceId),
  index("idx_blood_pressure_time").on(table.measurementTime),
  index("idx_blood_pressure_anomalous").on(table.isAnomalous),
]);

export type BloodPressureReading = typeof bloodPressureReadings.$inferSelect;
export const insertBloodPressureReadingSchema = createInsertSchema(bloodPressureReadings).omit({
  id: true,
  createdAt: true,
  isAnomalous: true,
  aiAnalysis: true,
});
export type InsertBloodPressureReading = z.infer<typeof insertBloodPressureReadingSchema>;

// ========== PROACTIVE HEALTH TRIGGERS ==========

// Configuration for proactive health monitoring triggers
export const proactiveHealthTriggers = pgTable("proactive_health_triggers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  triggerType: varchar("trigger_type", { length: 50 }).notNull(), // periodic_checkup, wearable_anomaly, inactivity, missed_medication, custom
  condition: jsonb("condition").notNull(), // Trigger rules (e.g., {type: "blood_pressure_high", threshold: 140})
  action: jsonb("action").notNull(), // Action to take (e.g., {type: "notification", channels: ["email", "whatsapp"]})
  targetAudience: varchar("target_audience", { length: 50 }).default('all'), // all, premium, specific_users
  isActive: boolean("is_active").default(true).notNull(),
  frequency: varchar("frequency", { length: 50 }), // daily, weekly, monthly (for periodic triggers)
  lastTriggeredAt: timestamp("last_triggered_at"),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: 'set null' }), // Admin who created
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_health_triggers_type").on(table.triggerType),
  index("idx_health_triggers_active").on(table.isActive),
]);

export type ProactiveHealthTrigger = typeof proactiveHealthTriggers.$inferSelect;
export const insertProactiveHealthTriggerSchema = createInsertSchema(proactiveHealthTriggers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastTriggeredAt: true,
});
export type InsertProactiveHealthTrigger = z.infer<typeof insertProactiveHealthTriggerSchema>;

// Log of proactive notifications sent to users
export const proactiveNotifications = pgTable("proactive_notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  triggerId: uuid("trigger_id").references(() => proactiveHealthTriggers.id, { onDelete: 'set null' }),
  notificationType: varchar("notification_type", { length: 50 }).notNull(), // checkup_reminder, anomaly_alert, medication_reminder, etc.
  channel: varchar("channel", { length: 20 }).notNull(), // email, whatsapp, push, sms
  subject: varchar("subject", { length: 500 }),
  message: text("message").notNull(),
  metadata: jsonb("metadata"), // Additional context (e.g., blood pressure reading that triggered alert)
  status: varchar("status", { length: 20 }).default('sent').notNull(), // sent, failed, clicked, dismissed
  sentAt: timestamp("sent_at").defaultNow(),
  clickedAt: timestamp("clicked_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_proactive_notif_user").on(table.userId),
  index("idx_proactive_notif_trigger").on(table.triggerId),
  index("idx_proactive_notif_type").on(table.notificationType),
  index("idx_proactive_notif_sent").on(table.sentAt),
]);

export type ProactiveNotification = typeof proactiveNotifications.$inferSelect;
export const insertProactiveNotificationSchema = createInsertSchema(proactiveNotifications).omit({
  id: true,
  createdAt: true,
  sentAt: true,
  clickedAt: true,
});
export type InsertProactiveNotification = z.infer<typeof insertProactiveNotificationSchema>;

// Daily wearable reports generated by doctors for AI context integration
export const wearableDailyReports = pgTable("wearable_daily_reports", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  doctorId: varchar("doctor_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  startDate: timestamp("start_date").notNull(), // Report period start
  endDate: timestamp("end_date").notNull(), // Report period end
  reportData: jsonb("report_data").notNull(), // Aggregated stats: {avgSystolic, avgDiastolic, avgHeartRate, anomalyCount, readings, etc.}
  aiContextText: text("ai_context_text").notNull(), // Formatted text ready for AI context injection
  notes: text("notes"), // Optional doctor notes
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_wearable_reports_patient").on(table.patientId),
  index("idx_wearable_reports_doctor").on(table.doctorId),
  index("idx_wearable_reports_created").on(table.createdAt),
]);

export type WearableDailyReport = typeof wearableDailyReports.$inferSelect;
export const insertWearableDailyReportSchema = createInsertSchema(wearableDailyReports).omit({
  id: true,
  createdAt: true,
});
export type InsertWearableDailyReport = z.infer<typeof insertWearableDailyReportSchema>;

// ========== ACCOUNT DELETION REQUESTS ==========

// Track account deletion requests with OTP verification
export const accountDeletionRequests = pgTable("account_deletion_requests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  reason: varchar("reason", { length: 100 }).notNull(), // non_uso_app, non_credo_tecnologia, preferisco_altro, costi_alti, altro
  otherReason: text("other_reason"), // Free text if reason is "altro"
  otpHash: varchar("otp_hash", { length: 255 }).notNull(), // Bcrypt hashed OTP code
  expiresAt: timestamp("expires_at").notNull(), // OTP expires after 10 minutes
  attemptCount: integer("attempt_count").default(0).notNull(), // Track verification attempts
  channel: varchar("channel", { length: 20 }).default('email').notNull(), // email or sms
  completedAt: timestamp("completed_at"), // Set when deletion is completed
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_deletion_user").on(table.userId),
  index("idx_deletion_expires").on(table.expiresAt),
]);

export type AccountDeletionRequest = typeof accountDeletionRequests.$inferSelect;
export const insertAccountDeletionRequestSchema = createInsertSchema(accountDeletionRequests).omit({
  id: true,
  createdAt: true,
  completedAt: true,
  attemptCount: true,
});
export type InsertAccountDeletionRequest = z.infer<typeof insertAccountDeletionRequestSchema>;

// Extended types for API responses
export type QuizWithCount = Quiz & { questionCount: number; crosswordId?: string };

// ========== EXAMS RECOMMENDATION DTO ==========

// Exam recommendation schema (on-demand API response, not persisted)
export const examRecommendationItemSchema = z.object({
  name: z.string(),
  frequency: z.string(), // "Annualmente", "Ogni 6 mesi", "Una tantum"
  reason: z.string(),
  urgency: z.enum(['low', 'medium', 'high']),
});

export const examCategorySchema = z.object({
  category: z.string(), // "Esami del sangue", "Controlli cardiaci", etc.
  exams: z.array(examRecommendationItemSchema),
});

export const examsRecommendationResponseSchema = z.object({
  recommendations: z.array(examCategorySchema),
  summary: z.string(), // Riepilogo generale personalizzato
});

export type ExamRecommendationItem = z.infer<typeof examRecommendationItemSchema>;
export type ExamCategory = z.infer<typeof examCategorySchema>;
export type ExamsRecommendationResponse = z.infer<typeof examsRecommendationResponseSchema>;
