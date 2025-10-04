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
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  isPremium: boolean("is_premium").default(false),
  isAdmin: boolean("is_admin").default(false),
  language: varchar("language", { length: 2 }), // it, en, es, fr
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
  createdAt: timestamp("created_at").defaultNow(),
});

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
  createdAt: timestamp("created_at").defaultNow(),
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Live course sessions (dates)
export const liveCourseSessions = pgTable("live_course_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: uuid("course_id").notNull().references(() => liveCourses.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  capacity: integer("capacity").default(30),
  enrolled: integer("enrolled").default(0),
  status: varchar("status", { length: 20 }).default("available"), // available, full, completed, cancelled
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
  enrolledAt: timestamp("enrolled_at").defaultNow(),
});

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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  quizAttempts: many(userQuizAttempts),
  progress: many(userProgress),
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

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type Quiz = typeof quizzes.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type UserQuizAttempt = typeof userQuizAttempts.$inferSelect;
export type UserProgress = typeof userProgress.$inferSelect;
export type QuizReport = typeof quizReports.$inferSelect;
export type LiveCourse = typeof liveCourses.$inferSelect;
export type LiveCourseSession = typeof liveCourseSessions.$inferSelect;
export type LiveCourseEnrollment = typeof liveCourseEnrollments.$inferSelect;
export type ContentPage = typeof contentPages.$inferSelect;

// Insert schemas
export const insertCategorySchema = createInsertSchema(categories);
export const insertQuizSchema = createInsertSchema(quizzes);
export const insertQuestionSchema = createInsertSchema(questions);
export const insertUserQuizAttemptSchema = createInsertSchema(userQuizAttempts);
export const insertUserProgressSchema = createInsertSchema(userProgress);
export const insertQuizReportSchema = createInsertSchema(quizReports);
export const insertLiveCourseSchema = createInsertSchema(liveCourses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLiveCourseSessionSchema = createInsertSchema(liveCourseSessions).omit({ id: true, createdAt: true });
export const insertLiveCourseEnrollmentSchema = createInsertSchema(liveCourseEnrollments).omit({ id: true, enrolledAt: true });
export const insertContentPageSchema = createInsertSchema(contentPages).omit({ id: true, createdAt: true, updatedAt: true });
export const updateContentPageSchema = createInsertSchema(contentPages).pick({ 
  title: true, 
  content: true, 
  isPublished: true 
}).partial();

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type InsertUserQuizAttempt = z.infer<typeof insertUserQuizAttemptSchema>;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type InsertQuizReport = z.infer<typeof insertQuizReportSchema>;
export type InsertLiveCourse = z.infer<typeof insertLiveCourseSchema>;
export type InsertLiveCourseSession = z.infer<typeof insertLiveCourseSessionSchema>;
export type InsertLiveCourseEnrollment = z.infer<typeof insertLiveCourseEnrollmentSchema>;
export type InsertContentPage = z.infer<typeof insertContentPageSchema>;
export type UpdateContentPage = z.infer<typeof updateContentPageSchema>;
