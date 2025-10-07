import {
  users,
  categories,
  quizzes,
  questions,
  quizGenerationJobs,
  userQuizAttempts,
  userProgress,
  quizReports,
  liveCourses,
  liveCourseSessions,
  liveCourseEnrollments,
  contentPages,
  onDemandCourses,
  courseVideos,
  videoQuestions,
  courseQuestions,
  userVideoProgress,
  badges,
  userBadges,
  achievements,
  userAchievements,
  dailyChallenges,
  userDailyChallenges,
  userCertificates,
  leaderboard,
  activityLog,
  corporateAgreements,
  emailTemplates,
  subscriptionPlans,
  type User,
  type UpsertUser,
  type Category,
  type Quiz,
  type Question,
  type QuizGenerationJob,
  type UserQuizAttempt,
  type UserProgress,
  type QuizReport,
  type LiveCourse,
  type LiveCourseSession,
  type LiveCourseEnrollment,
  type ContentPage,
  type OnDemandCourse,
  type CourseVideo,
  type VideoQuestion,
  type CourseQuestion,
  type UserVideoProgress,
  type Badge,
  type UserBadge,
  type Achievement,
  type UserAchievement,
  type DailyChallenge,
  type UserDailyChallenge,
  type UserCertificate,
  type Leaderboard,
  type ActivityLog,
  type CorporateAgreement,
  type EmailTemplate,
  type InsertUserQuizAttempt,
  type InsertUserProgress,
  type InsertQuizReport,
  type InsertQuizGenerationJob,
  type InsertLiveCourse,
  type InsertLiveCourseSession,
  type InsertLiveCourseEnrollment,
  type InsertContentPage,
  type InsertOnDemandCourse,
  type InsertCourseVideo,
  type InsertVideoQuestion,
  type InsertCourseQuestion,
  type InsertUserVideoProgress,
  type InsertBadge,
  type InsertUserBadge,
  type InsertAchievement,
  type InsertUserAchievement,
  type InsertDailyChallenge,
  type InsertUserDailyChallenge,
  type InsertUserCertificate,
  type InsertLeaderboard,
  type InsertActivityLog,
  type InsertCorporateAgreement,
  type InsertEmailTemplate,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  type QuizWithCount,
  type Setting,
  type InsertSetting,
  settings,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, gte } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  createUser(user: Partial<User>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User>;
  updateUserStripeCustomer(userId: string, stripeCustomerId: string): Promise<User>;
  updateUserLanguage(userId: string, language: string): Promise<User>;
  setPasswordResetToken(userId: string, token: string, expires: Date): Promise<void>;
  updateUserPassword(userId: string, password: string): Promise<void>;
  clearPasswordResetToken(userId: string): Promise<void>;
  
  // Admin User operations
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Quiz operations
  getCategories(): Promise<Category[]>;
  getCategoriesWithQuizzes(): Promise<Array<Category & { quizzes: QuizWithCount[] }>>;
  getAllQuizzes(): Promise<Quiz[]>;
  getQuizzesByCategory(categoryId: string): Promise<Quiz[]>;
  getQuizById(id: string): Promise<Quiz | undefined>;
  getQuestionsByQuizId(quizId: string): Promise<Question[]>;
  getQuestionById(id: string): Promise<Question | undefined>;
  
  // Admin Category operations
  createCategory(category: Omit<Category, 'id' | 'createdAt'>): Promise<Category>;
  updateCategory(id: string, updates: Partial<Category>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
  
  // Admin Quiz operations
  createQuiz(quiz: Omit<Quiz, 'id' | 'createdAt'>): Promise<Quiz>;
  updateQuiz(id: string, updates: Partial<Quiz>): Promise<Quiz>;
  deleteQuiz(id: string): Promise<void>;
  
  // Admin Question operations
  getAllQuestions(): Promise<Question[]>;
  createQuestion(question: Omit<Question, 'id' | 'createdAt'>): Promise<Question>;
  updateQuestion(id: string, updates: Partial<Question>): Promise<Question>;
  deleteQuestion(id: string): Promise<void>;
  
  // Quiz generation job operations
  createGenerationJob(job: InsertQuizGenerationJob): Promise<QuizGenerationJob>;
  updateGenerationJob(id: string, updates: Partial<QuizGenerationJob>): Promise<QuizGenerationJob>;
  getGenerationJobById(id: string): Promise<QuizGenerationJob | undefined>;
  getGenerationJobsByQuizId(quizId: string): Promise<QuizGenerationJob[]>;
  
  // User progress operations
  createQuizAttempt(attempt: InsertUserQuizAttempt): Promise<UserQuizAttempt>;
  getQuizAttemptById(attemptId: string): Promise<UserQuizAttempt | undefined>;
  getUserQuizAttempts(userId: string, limit?: number): Promise<UserQuizAttempt[]>;
  getUserProgress(userId: string): Promise<UserProgress[]>;
  updateUserProgress(userId: string, categoryId: string, attempt: UserQuizAttempt): Promise<void>;
  
  // Report operations
  createQuizReport(report: InsertQuizReport): Promise<QuizReport>;
  getQuizReport(attemptId: string): Promise<QuizReport | undefined>;
  getUserReports(userId: string, limit?: number): Promise<QuizReport[]>;
  
  // Live course operations
  createLiveCourse(course: InsertLiveCourse): Promise<LiveCourse>;
  updateLiveCourse(id: string, updates: Partial<LiveCourse>): Promise<LiveCourse>;
  deleteLiveCourse(id: string): Promise<void>;
  getLiveCourseById(id: string): Promise<LiveCourse | undefined>;
  getLiveCourseByQuizId(quizId: string): Promise<LiveCourse | undefined>;
  getAllLiveCourses(): Promise<LiveCourse[]>;
  
  // Live course session operations
  createLiveCourseSession(session: InsertLiveCourseSession): Promise<LiveCourseSession>;
  updateLiveCourseSession(id: string, updates: Partial<LiveCourseSession>): Promise<LiveCourseSession>;
  deleteLiveCourseSession(id: string): Promise<void>;
  getSessionsByCourseId(courseId: string): Promise<LiveCourseSession[]>;
  getSessionById(id: string): Promise<LiveCourseSession | undefined>;
  
  // Live course enrollment operations
  createLiveCourseEnrollment(enrollment: InsertLiveCourseEnrollment): Promise<LiveCourseEnrollment>;
  updateLiveCourseEnrollment(id: string, updates: Partial<LiveCourseEnrollment>): Promise<LiveCourseEnrollment>;
  getUserEnrollments(userId: string): Promise<LiveCourseEnrollment[]>;
  
  // On-demand course operations
  createOnDemandCourse(course: InsertOnDemandCourse): Promise<OnDemandCourse>;
  updateOnDemandCourse(id: string, updates: Partial<OnDemandCourse>): Promise<OnDemandCourse>;
  deleteOnDemandCourse(id: string): Promise<void>;
  getOnDemandCourseById(id: string): Promise<OnDemandCourse | undefined>;
  getAllOnDemandCourses(includeInactive?: boolean): Promise<OnDemandCourse[]>;
  
  // Course video operations
  createCourseVideo(video: InsertCourseVideo): Promise<CourseVideo>;
  updateCourseVideo(id: string, updates: Partial<CourseVideo>): Promise<CourseVideo>;
  deleteCourseVideo(id: string): Promise<void>;
  getVideosByCourseId(courseId: string): Promise<CourseVideo[]>;
  getCourseVideoById(id: string): Promise<CourseVideo | undefined>;
  
  // Video question operations
  createVideoQuestion(question: InsertVideoQuestion): Promise<VideoQuestion>;
  updateVideoQuestion(id: string, updates: Partial<VideoQuestion>): Promise<VideoQuestion>;
  deleteVideoQuestion(id: string): Promise<void>;
  getQuestionsByVideoId(videoId: string): Promise<VideoQuestion[]>;
  
  // Course question operations (at course level, not video level)
  createCourseQuestion(question: InsertCourseQuestion): Promise<CourseQuestion>;
  updateCourseQuestion(id: string, updates: Partial<CourseQuestion>): Promise<CourseQuestion>;
  deleteCourseQuestion(id: string): Promise<void>;
  getQuestionsByCourseId(courseId: string): Promise<CourseQuestion[]>;
  
  // User video progress operations
  upsertUserVideoProgress(progress: InsertUserVideoProgress): Promise<UserVideoProgress>;
  getUserVideoProgress(userId: string, courseId: string): Promise<UserVideoProgress[]>;
  getUserCourseProgress(userId: string, courseId: string): Promise<{completed: number; total: number}>;
  
  // Content page operations
  getAllContentPages(): Promise<ContentPage[]>;
  getContentPageBySlug(slug: string): Promise<ContentPage | undefined>;
  getContentPageById(id: string): Promise<ContentPage | undefined>;
  createContentPage(page: InsertContentPage): Promise<ContentPage>;
  updateContentPage(id: string, updates: Partial<ContentPage>): Promise<ContentPage>;
  deleteContentPage(id: string): Promise<void>;
  
  // Gamification - Badge operations
  getAllBadges(): Promise<Badge[]>;
  getBadgeById(id: string): Promise<Badge | undefined>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  updateBadge(id: string, updates: Partial<Badge>): Promise<Badge>;
  deleteBadge(id: string): Promise<void>;
  getUserBadges(userId: string): Promise<(UserBadge & { badge: Badge })[]>;
  awardBadge(userId: string, badgeId: string): Promise<UserBadge>;
  
  // Gamification - Achievement operations
  getAllAchievements(): Promise<Achievement[]>;
  getAchievementById(id: string): Promise<Achievement | undefined>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  updateAchievement(id: string, updates: Partial<Achievement>): Promise<Achievement>;
  deleteAchievement(id: string): Promise<void>;
  getUserAchievements(userId: string): Promise<(UserAchievement & { achievement: Achievement })[]>;
  
  // Gamification - Daily challenge operations
  getTodayDailyChallenge(): Promise<DailyChallenge | undefined>;
  createDailyChallenge(challenge: InsertDailyChallenge): Promise<DailyChallenge>;
  getUserDailyChallengeStatus(userId: string, challengeId: string): Promise<UserDailyChallenge | undefined>;
  completeDailyChallenge(userChallenge: InsertUserDailyChallenge): Promise<UserDailyChallenge>;
  
  // Gamification - Certificate operations
  getUserCertificates(userId: string): Promise<UserCertificate[]>;
  getCertificateById(id: string): Promise<UserCertificate | undefined>;
  getCertificateByVerificationCode(code: string): Promise<UserCertificate | undefined>;
  createCertificate(certificate: InsertUserCertificate): Promise<UserCertificate>;
  updateCertificate(id: string, updates: Partial<UserCertificate>): Promise<UserCertificate>;
  
  // Gamification - Leaderboard operations
  getGlobalLeaderboard(limit?: number, period?: string): Promise<(Leaderboard & { user: User })[]>;
  getCategoryLeaderboard(categoryId: string, limit?: number, period?: string): Promise<(Leaderboard & { user: User })[]>;
  getUserLeaderboardPosition(userId: string, categoryId?: string, period?: string): Promise<Leaderboard | undefined>;
  
  // Gamification - Activity log operations
  getUserActivityLog(userId: string, limit?: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  
  // Corporate agreement operations
  getCorporateAgreementByEmailDomain(emailDomain: string): Promise<CorporateAgreement | undefined>;
  getCorporateAgreementByPromoCode(promoCode: string): Promise<CorporateAgreement | undefined>;
  getCorporateAgreementById(id: string): Promise<CorporateAgreement | undefined>;
  getAllCorporateAgreements(): Promise<CorporateAgreement[]>;
  createCorporateAgreement(agreement: InsertCorporateAgreement): Promise<CorporateAgreement>;
  updateCorporateAgreement(id: string, updates: Partial<CorporateAgreement>): Promise<CorporateAgreement>;
  deleteCorporateAgreement(id: string): Promise<void>;
  incrementCorporateAgreementUsers(id: string): Promise<boolean>;
  decrementCorporateAgreementUsers(id: string): Promise<void>;
  getUsersByCorporateAgreement(agreementId: string): Promise<User[]>;
  
  // Settings operations
  getSetting(key: string): Promise<Setting | undefined>;
  getAllSettings(): Promise<Setting[]>;
  upsertSetting(key: string, value: string, description?: string, category?: string): Promise<Setting>;
  deleteSetting(key: string): Promise<void>;
  
  // Email template operations
  getAllEmailTemplates(): Promise<EmailTemplate[]>;
  getEmailTemplateByCode(code: string): Promise<EmailTemplate | undefined>;
  getEmailTemplateById(id: string): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate>;
  deleteEmailTemplate(id: string): Promise<void>;

  // Subscription plan operations
  getAllSubscriptionPlans(includeInactive?: boolean): Promise<SubscriptionPlan[]>;
  getSubscriptionPlanById(id: string): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(id: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan>;
  deleteSubscriptionPlan(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId,
        stripeSubscriptionId,
        isPremium: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserStripeCustomer(userId: string, stripeCustomerId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        stripeCustomerId,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserLanguage(userId: string, language: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        language,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Admin User operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.passwordResetToken, token));
    return user;
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData as any)
      .returning();
    return user;
  }

  async setPasswordResetToken(userId: string, token: string, expires: Date): Promise<void> {
    await db
      .update(users)
      .set({
        passwordResetToken: token,
        passwordResetExpires: expires,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async updateUserPassword(userId: string, password: string): Promise<void> {
    await db
      .update(users)
      .set({
        password,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async clearPasswordResetToken(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        passwordResetToken: null,
        passwordResetExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // Quiz operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.sortOrder, categories.name);
  }

  async getCategoriesWithQuizzes(): Promise<Array<Category & { quizzes: QuizWithCount[] }>> {
    // Optimize with a single LEFT JOIN query instead of N+1 queries
    const rows = await db
      .select()
      .from(categories)
      .leftJoin(quizzes, eq(categories.id, quizzes.categoryId))
      .orderBy(categories.sortOrder, categories.name, quizzes.title);

    // Get question counts for all quizzes in one query
    const questionCounts = await db
      .select({
        quizId: questions.quizId,
        count: sql<number>`cast(count(${questions.id}) as integer)`,
      })
      .from(questions)
      .groupBy(questions.quizId);

    // Create a map of quiz ID to question count
    const countMap = new Map<string, number>();
    for (const { quizId, count } of questionCounts) {
      countMap.set(quizId, count);
    }

    // Group quizzes by category
    const categoryMap = new Map<string, Category & { quizzes: QuizWithCount[] }>();
    
    for (const row of rows) {
      const category = row.categories;
      const quiz = row.quizzes;
      
      if (!categoryMap.has(category.id)) {
        categoryMap.set(category.id, {
          ...category,
          quizzes: []
        });
      }
      
      if (quiz) {
        // Add question count to quiz
        const quizWithCount = {
          ...quiz,
          questionCount: countMap.get(quiz.id) || 0
        };
        categoryMap.get(category.id)!.quizzes.push(quizWithCount);
      }
    }

    return Array.from(categoryMap.values());
  }

  async getAllQuizzes(): Promise<Quiz[]> {
    return await db
      .select()
      .from(quizzes)
      .orderBy(quizzes.title);
  }

  async getQuizzesByCategory(categoryId: string): Promise<Quiz[]> {
    return await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.categoryId, categoryId))
      .orderBy(quizzes.title);
  }

  async getQuizById(id: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz;
  }

  async getQuestionsByQuizId(quizId: string): Promise<Question[]> {
    return await db
      .select()
      .from(questions)
      .where(eq(questions.quizId, quizId))
      .orderBy(sql`RANDOM()`); // Randomize question order
  }

  async getAllQuestions(): Promise<Question[]> {
    return await db
      .select()
      .from(questions)
      .orderBy(questions.quizId);
  }

  async getQuestionById(id: string): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question;
  }

  // Admin Category operations
  async createCategory(categoryData: Omit<Category, 'id' | 'createdAt'>): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(categoryData)
      .returning();
    return category;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    const [category] = await db
      .update(categories)
      .set(updates)
      .where(eq(categories.id, id))
      .returning();
    return category;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Admin Quiz operations
  async createQuiz(quizData: Omit<Quiz, 'id' | 'createdAt'>): Promise<Quiz> {
    const [quiz] = await db
      .insert(quizzes)
      .values(quizData)
      .returning();
    return quiz;
  }

  async updateQuiz(id: string, updates: Partial<Quiz>): Promise<Quiz> {
    const [quiz] = await db
      .update(quizzes)
      .set(updates)
      .where(eq(quizzes.id, id))
      .returning();
    return quiz;
  }

  async deleteQuiz(id: string): Promise<void> {
    // Delete in correct order to avoid foreign key constraint violations
    
    // 1. Delete quiz reports (references userQuizAttempts)
    const attempts = await db
      .select({ id: userQuizAttempts.id })
      .from(userQuizAttempts)
      .where(eq(userQuizAttempts.quizId, id));
    
    const attemptIds = attempts.map(a => a.id);
    if (attemptIds.length > 0) {
      await db.delete(quizReports).where(
        sql`${quizReports.attemptId} IN (${sql.join(attemptIds.map(id => sql`${id}`), sql`, `)})`
      );
    }
    
    // 2. Delete user quiz attempts
    await db.delete(userQuizAttempts).where(eq(userQuizAttempts.quizId, id));
    
    // 3. Delete quiz generation jobs
    await db.delete(quizGenerationJobs).where(eq(quizGenerationJobs.quizId, id));
    
    // 4. Delete questions
    await db.delete(questions).where(eq(questions.quizId, id));
    
    // 5. Delete live course related data
    const courses = await db
      .select({ id: liveCourses.id })
      .from(liveCourses)
      .where(eq(liveCourses.quizId, id));
    
    const courseIds = courses.map(c => c.id);
    if (courseIds.length > 0) {
      // Delete enrollments first
      await db.delete(liveCourseEnrollments).where(
        sql`${liveCourseEnrollments.courseId} IN (${sql.join(courseIds.map(id => sql`${id}`), sql`, `)})`
      );
      
      // Delete sessions
      await db.delete(liveCourseSessions).where(
        sql`${liveCourseSessions.courseId} IN (${sql.join(courseIds.map(id => sql`${id}`), sql`, `)})`
      );
      
      // Delete courses
      await db.delete(liveCourses).where(eq(liveCourses.quizId, id));
    }
    
    // 6. Finally delete the quiz itself
    await db.delete(quizzes).where(eq(quizzes.id, id));
  }

  // Admin Question operations
  async createQuestion(questionData: Omit<Question, 'id' | 'createdAt'>): Promise<Question> {
    const [question] = await db
      .insert(questions)
      .values(questionData)
      .returning();
    return question;
  }

  async updateQuestion(id: string, updates: Partial<Question>): Promise<Question> {
    const [question] = await db
      .update(questions)
      .set(updates)
      .where(eq(questions.id, id))
      .returning();
    return question;
  }

  async deleteQuestion(id: string): Promise<void> {
    await db.delete(questions).where(eq(questions.id, id));
  }

  // Quiz generation job operations
  async createGenerationJob(jobData: InsertQuizGenerationJob): Promise<QuizGenerationJob> {
    const [job] = await db
      .insert(quizGenerationJobs)
      .values(jobData)
      .returning();
    return job;
  }

  async updateGenerationJob(id: string, updates: Partial<QuizGenerationJob>): Promise<QuizGenerationJob> {
    const [job] = await db
      .update(quizGenerationJobs)
      .set(updates)
      .where(eq(quizGenerationJobs.id, id))
      .returning();
    return job;
  }

  async getGenerationJobById(id: string): Promise<QuizGenerationJob | undefined> {
    const [job] = await db
      .select()
      .from(quizGenerationJobs)
      .where(eq(quizGenerationJobs.id, id));
    return job;
  }

  async getGenerationJobsByQuizId(quizId: string): Promise<QuizGenerationJob[]> {
    return await db
      .select()
      .from(quizGenerationJobs)
      .where(eq(quizGenerationJobs.quizId, quizId))
      .orderBy(desc(quizGenerationJobs.createdAt));
  }

  // User progress operations
  async createQuizAttempt(attempt: InsertUserQuizAttempt): Promise<UserQuizAttempt> {
    const [created] = await db
      .insert(userQuizAttempts)
      .values(attempt)
      .returning();
    return created;
  }

  async getQuizAttemptById(attemptId: string): Promise<UserQuizAttempt | undefined> {
    const [attempt] = await db
      .select()
      .from(userQuizAttempts)
      .where(eq(userQuizAttempts.id, attemptId));
    return attempt;
  }

  async getUserQuizAttempts(userId: string, limit = 10): Promise<(UserQuizAttempt & { quizTitle: string })[]> {
    const results = await db
      .select({
        id: userQuizAttempts.id,
        userId: userQuizAttempts.userId,
        quizId: userQuizAttempts.quizId,
        answers: userQuizAttempts.answers,
        score: userQuizAttempts.score,
        correctAnswers: userQuizAttempts.correctAnswers,
        totalQuestions: userQuizAttempts.totalQuestions,
        timeSpent: userQuizAttempts.timeSpent,
        pointsEarned: userQuizAttempts.pointsEarned,
        completedAt: userQuizAttempts.completedAt,
        quizTitle: quizzes.title,
      })
      .from(userQuizAttempts)
      .leftJoin(quizzes, eq(userQuizAttempts.quizId, quizzes.id))
      .where(eq(userQuizAttempts.userId, userId))
      .orderBy(desc(userQuizAttempts.completedAt))
      .limit(limit);
    
    return results.map(r => ({
      ...r,
      quizTitle: r.quizTitle || 'Quiz Sconosciuto'
    }));
  }

  async getUserProgress(userId: string): Promise<UserProgress[]> {
    return await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));
  }

  async updateUserProgress(userId: string, categoryId: string, attempt: UserQuizAttempt): Promise<void> {
    // Check if user progress exists for this category
    const [existing] = await db
      .select()
      .from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.categoryId, categoryId)));

    if (existing) {
      // Update existing progress
      const newQuizzesCompleted = (existing.quizzesCompleted || 0) + 1;
      const newTotalTime = (existing.totalTimeSpent || 0) + attempt.timeSpent;
      const newAverageScore = Math.round(
        (((existing.averageScore || 0) * (existing.quizzesCompleted || 0)) + attempt.score) / newQuizzesCompleted
      );

      await db
        .update(userProgress)
        .set({
          quizzesCompleted: newQuizzesCompleted,
          averageScore: newAverageScore,
          totalTimeSpent: newTotalTime,
          lastAttemptAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userProgress.id, existing.id));
    } else {
      // Create new progress record
      await db
        .insert(userProgress)
        .values({
          userId,
          categoryId,
          quizzesCompleted: 1,
          averageScore: attempt.score,
          totalTimeSpent: attempt.timeSpent,
          lastAttemptAt: new Date(),
        });
    }
  }

  // Report operations
  async createQuizReport(reportData: InsertQuizReport): Promise<QuizReport> {
    const [report] = await db
      .insert(quizReports)
      .values(reportData)
      .returning();
    return report;
  }

  async getQuizReport(attemptId: string): Promise<QuizReport | undefined> {
    const [report] = await db
      .select()
      .from(quizReports)
      .where(eq(quizReports.attemptId, attemptId));
    return report;
  }

  async getUserReports(userId: string, limit = 10): Promise<QuizReport[]> {
    return await db
      .select()
      .from(quizReports)
      .where(eq(quizReports.userId, userId))
      .orderBy(desc(quizReports.createdAt))
      .limit(limit);
  }

  // Live course operations
  async createLiveCourse(course: InsertLiveCourse): Promise<LiveCourse> {
    const [created] = await db
      .insert(liveCourses)
      .values(course)
      .returning();
    return created;
  }

  async updateLiveCourse(id: string, updates: Partial<LiveCourse>): Promise<LiveCourse> {
    const [updated] = await db
      .update(liveCourses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(liveCourses.id, id))
      .returning();
    return updated;
  }

  async deleteLiveCourse(id: string): Promise<void> {
    await db.delete(liveCourses).where(eq(liveCourses.id, id));
  }

  async getLiveCourseById(id: string): Promise<LiveCourse | undefined> {
    const [course] = await db
      .select()
      .from(liveCourses)
      .where(eq(liveCourses.id, id));
    return course;
  }

  async getLiveCourseByQuizId(quizId: string): Promise<LiveCourse | undefined> {
    const [course] = await db
      .select()
      .from(liveCourses)
      .where(and(eq(liveCourses.quizId, quizId), eq(liveCourses.isActive, true)));
    return course;
  }

  async getAllLiveCourses(): Promise<LiveCourse[]> {
    return await db
      .select()
      .from(liveCourses)
      .where(eq(liveCourses.isActive, true));
  }

  // Live course session operations
  async createLiveCourseSession(session: InsertLiveCourseSession): Promise<LiveCourseSession> {
    const [created] = await db
      .insert(liveCourseSessions)
      .values(session)
      .returning();
    return created;
  }

  async updateLiveCourseSession(id: string, updates: Partial<LiveCourseSession>): Promise<LiveCourseSession> {
    const [updated] = await db
      .update(liveCourseSessions)
      .set(updates)
      .where(eq(liveCourseSessions.id, id))
      .returning();
    return updated;
  }

  async deleteLiveCourseSession(id: string): Promise<void> {
    await db.delete(liveCourseSessions).where(eq(liveCourseSessions.id, id));
  }

  async getSessionsByCourseId(courseId: string): Promise<LiveCourseSession[]> {
    return await db
      .select()
      .from(liveCourseSessions)
      .where(eq(liveCourseSessions.courseId, courseId))
      .orderBy(liveCourseSessions.startDate);
  }

  async getSessionById(id: string): Promise<LiveCourseSession | undefined> {
    const [session] = await db
      .select()
      .from(liveCourseSessions)
      .where(eq(liveCourseSessions.id, id));
    return session;
  }

  // Live course enrollment operations
  async createLiveCourseEnrollment(enrollment: InsertLiveCourseEnrollment): Promise<LiveCourseEnrollment> {
    const [created] = await db
      .insert(liveCourseEnrollments)
      .values(enrollment)
      .returning();
    return created;
  }

  async updateLiveCourseEnrollment(id: string, updates: Partial<LiveCourseEnrollment>): Promise<LiveCourseEnrollment> {
    const [updated] = await db
      .update(liveCourseEnrollments)
      .set(updates)
      .where(eq(liveCourseEnrollments.id, id))
      .returning();
    return updated;
  }

  async getUserEnrollments(userId: string): Promise<LiveCourseEnrollment[]> {
    return await db
      .select()
      .from(liveCourseEnrollments)
      .where(eq(liveCourseEnrollments.userId, userId))
      .orderBy(desc(liveCourseEnrollments.enrolledAt));
  }

  // On-demand course operations
  async createOnDemandCourse(course: InsertOnDemandCourse): Promise<OnDemandCourse> {
    const [created] = await db
      .insert(onDemandCourses)
      .values(course)
      .returning();
    return created;
  }

  async updateOnDemandCourse(id: string, updates: Partial<OnDemandCourse>): Promise<OnDemandCourse> {
    const [updated] = await db
      .update(onDemandCourses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(onDemandCourses.id, id))
      .returning();
    return updated;
  }

  async deleteOnDemandCourse(id: string): Promise<void> {
    await db.delete(onDemandCourses).where(eq(onDemandCourses.id, id));
  }

  async getOnDemandCourseById(id: string): Promise<OnDemandCourse | undefined> {
    const [course] = await db
      .select()
      .from(onDemandCourses)
      .where(eq(onDemandCourses.id, id));
    return course;
  }

  async getAllOnDemandCourses(includeInactive: boolean = false): Promise<OnDemandCourse[]> {
    if (includeInactive) {
      return await db
        .select()
        .from(onDemandCourses)
        .orderBy(onDemandCourses.sortOrder);
    }
    return await db
      .select()
      .from(onDemandCourses)
      .where(eq(onDemandCourses.isActive, true))
      .orderBy(onDemandCourses.sortOrder);
  }

  // Course video operations
  async createCourseVideo(video: InsertCourseVideo): Promise<CourseVideo> {
    const [created] = await db
      .insert(courseVideos)
      .values(video)
      .returning();
    return created;
  }

  async updateCourseVideo(id: string, updates: Partial<CourseVideo>): Promise<CourseVideo> {
    const [updated] = await db
      .update(courseVideos)
      .set(updates)
      .where(eq(courseVideos.id, id))
      .returning();
    return updated;
  }

  async deleteCourseVideo(id: string): Promise<void> {
    await db.delete(courseVideos).where(eq(courseVideos.id, id));
  }

  async getVideosByCourseId(courseId: string): Promise<CourseVideo[]> {
    return await db
      .select()
      .from(courseVideos)
      .where(eq(courseVideos.courseId, courseId))
      .orderBy(courseVideos.sortOrder);
  }

  async getCourseVideoById(id: string): Promise<CourseVideo | undefined> {
    const [video] = await db
      .select()
      .from(courseVideos)
      .where(eq(courseVideos.id, id));
    return video;
  }

  // Video question operations
  async createVideoQuestion(question: InsertVideoQuestion): Promise<VideoQuestion> {
    const [created] = await db
      .insert(videoQuestions)
      .values(question)
      .returning();
    return created;
  }

  async updateVideoQuestion(id: string, updates: Partial<VideoQuestion>): Promise<VideoQuestion> {
    const [updated] = await db
      .update(videoQuestions)
      .set(updates)
      .where(eq(videoQuestions.id, id))
      .returning();
    return updated;
  }

  async deleteVideoQuestion(id: string): Promise<void> {
    await db.delete(videoQuestions).where(eq(videoQuestions.id, id));
  }

  async getQuestionsByVideoId(videoId: string): Promise<VideoQuestion[]> {
    return await db
      .select()
      .from(videoQuestions)
      .where(eq(videoQuestions.videoId, videoId))
      .orderBy(videoQuestions.sortOrder);
  }

  // Course question operations (at course level, not video level)
  async createCourseQuestion(question: InsertCourseQuestion): Promise<CourseQuestion> {
    const [created] = await db
      .insert(courseQuestions)
      .values(question)
      .returning();
    return created;
  }

  async updateCourseQuestion(id: string, updates: Partial<CourseQuestion>): Promise<CourseQuestion> {
    const [updated] = await db
      .update(courseQuestions)
      .set(updates)
      .where(eq(courseQuestions.id, id))
      .returning();
    return updated;
  }

  async deleteCourseQuestion(id: string): Promise<void> {
    await db.delete(courseQuestions).where(eq(courseQuestions.id, id));
  }

  async getQuestionsByCourseId(courseId: string): Promise<CourseQuestion[]> {
    return await db
      .select()
      .from(courseQuestions)
      .where(eq(courseQuestions.courseId, courseId))
      .orderBy(courseQuestions.sortOrder);
  }

  // User video progress operations
  async upsertUserVideoProgress(progress: InsertUserVideoProgress): Promise<UserVideoProgress> {
    const [upserted] = await db
      .insert(userVideoProgress)
      .values(progress)
      .onConflictDoUpdate({
        target: [userVideoProgress.userId, userVideoProgress.videoId],
        set: {
          ...progress,
          lastWatchedAt: new Date(),
        },
      })
      .returning();
    return upserted;
  }

  async getUserVideoProgress(userId: string, courseId: string): Promise<UserVideoProgress[]> {
    return await db
      .select()
      .from(userVideoProgress)
      .where(
        and(
          eq(userVideoProgress.userId, userId),
          eq(userVideoProgress.courseId, courseId)
        )
      );
  }

  async getUserCourseProgress(userId: string, courseId: string): Promise<{completed: number; total: number}> {
    const [result] = await db
      .select({
        completed: sql<number>`count(*) filter (where ${userVideoProgress.completed} = true)`,
        total: sql<number>`count(*)`
      })
      .from(userVideoProgress)
      .where(
        and(
          eq(userVideoProgress.userId, userId),
          eq(userVideoProgress.courseId, courseId)
        )
      );
    return result || { completed: 0, total: 0 };
  }
  
  // Content page operations
  async getAllContentPages(): Promise<ContentPage[]> {
    return await db
      .select()
      .from(contentPages)
      .orderBy(contentPages.slug);
  }
  
  async getContentPageBySlug(slug: string): Promise<ContentPage | undefined> {
    const [page] = await db
      .select()
      .from(contentPages)
      .where(eq(contentPages.slug, slug));
    return page;
  }
  
  async getContentPageById(id: string): Promise<ContentPage | undefined> {
    const [page] = await db
      .select()
      .from(contentPages)
      .where(eq(contentPages.id, id));
    return page;
  }
  
  async createContentPage(page: InsertContentPage): Promise<ContentPage> {
    const [created] = await db
      .insert(contentPages)
      .values(page)
      .returning();
    return created;
  }
  
  async updateContentPage(id: string, updates: Partial<ContentPage>): Promise<ContentPage> {
    const [updated] = await db
      .update(contentPages)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contentPages.id, id))
      .returning();
    return updated;
  }
  
  async deleteContentPage(id: string): Promise<void> {
    await db.delete(contentPages).where(eq(contentPages.id, id));
  }
  
  // Gamification - Badge operations
  async getAllBadges(): Promise<Badge[]> {
    return await db.select().from(badges).orderBy(badges.sortOrder, badges.name);
  }
  
  async getBadgeById(id: string): Promise<Badge | undefined> {
    const [badge] = await db.select().from(badges).where(eq(badges.id, id));
    return badge;
  }
  
  async createBadge(badge: InsertBadge): Promise<Badge> {
    const [created] = await db.insert(badges).values(badge).returning();
    return created;
  }
  
  async updateBadge(id: string, updates: Partial<Badge>): Promise<Badge> {
    const [updated] = await db
      .update(badges)
      .set(updates)
      .where(eq(badges.id, id))
      .returning();
    return updated;
  }
  
  async deleteBadge(id: string): Promise<void> {
    await db.delete(badges).where(eq(badges.id, id));
  }
  
  async getUserBadges(userId: string): Promise<(UserBadge & { badge: Badge })[]> {
    const results = await db
      .select({
        id: userBadges.id,
        userId: userBadges.userId,
        badgeId: userBadges.badgeId,
        earnedAt: userBadges.earnedAt,
        badge: badges,
      })
      .from(userBadges)
      .leftJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, userId))
      .orderBy(desc(userBadges.earnedAt));
    
    return results.filter(r => r.badge !== null) as (UserBadge & { badge: Badge })[];
  }
  
  async awardBadge(userId: string, badgeId: string): Promise<UserBadge> {
    const [created] = await db
      .insert(userBadges)
      .values({ userId, badgeId })
      .returning();
    return created;
  }
  
  // Gamification - Achievement operations
  async getAllAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements).orderBy(achievements.sortOrder, achievements.name);
  }
  
  async getAchievementById(id: string): Promise<Achievement | undefined> {
    const [achievement] = await db.select().from(achievements).where(eq(achievements.id, id));
    return achievement;
  }
  
  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const [created] = await db.insert(achievements).values(achievement).returning();
    return created;
  }
  
  async updateAchievement(id: string, updates: Partial<Achievement>): Promise<Achievement> {
    const [updated] = await db
      .update(achievements)
      .set(updates)
      .where(eq(achievements.id, id))
      .returning();
    return updated;
  }
  
  async deleteAchievement(id: string): Promise<void> {
    await db.delete(achievements).where(eq(achievements.id, id));
  }
  
  async getUserAchievements(userId: string): Promise<(UserAchievement & { achievement: Achievement })[]> {
    const results = await db
      .select({
        id: userAchievements.id,
        userId: userAchievements.userId,
        achievementId: userAchievements.achievementId,
        progress: userAchievements.progress,
        isUnlocked: userAchievements.isUnlocked,
        unlockedAt: userAchievements.unlockedAt,
        createdAt: userAchievements.createdAt,
        updatedAt: userAchievements.updatedAt,
        achievement: achievements,
      })
      .from(userAchievements)
      .leftJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId))
      .orderBy(desc(userAchievements.unlockedAt), userAchievements.progress);
    
    return results.filter(r => r.achievement !== null) as (UserAchievement & { achievement: Achievement })[];
  }
  
  // Gamification - Daily challenge operations
  async getTodayDailyChallenge(): Promise<DailyChallenge | undefined> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [challenge] = await db
      .select()
      .from(dailyChallenges)
      .where(
        and(
          eq(dailyChallenges.isActive, true),
          gte(dailyChallenges.date, today)
        )
      )
      .orderBy(dailyChallenges.date)
      .limit(1);
    
    return challenge;
  }
  
  async createDailyChallenge(challenge: InsertDailyChallenge): Promise<DailyChallenge> {
    const [created] = await db
      .insert(dailyChallenges)
      .values(challenge)
      .returning();
    return created;
  }
  
  async getUserDailyChallengeStatus(userId: string, challengeId: string): Promise<UserDailyChallenge | undefined> {
    const [status] = await db
      .select()
      .from(userDailyChallenges)
      .where(
        and(
          eq(userDailyChallenges.userId, userId),
          eq(userDailyChallenges.challengeId, challengeId)
        )
      );
    
    return status;
  }
  
  async completeDailyChallenge(userChallenge: InsertUserDailyChallenge): Promise<UserDailyChallenge> {
    const [created] = await db
      .insert(userDailyChallenges)
      .values(userChallenge)
      .returning();
    return created;
  }
  
  // Gamification - Certificate operations
  async getUserCertificates(userId: string): Promise<UserCertificate[]> {
    return await db
      .select()
      .from(userCertificates)
      .where(eq(userCertificates.userId, userId))
      .orderBy(desc(userCertificates.issuedAt));
  }
  
  async getCertificateById(id: string): Promise<UserCertificate | undefined> {
    const [certificate] = await db
      .select()
      .from(userCertificates)
      .where(eq(userCertificates.id, id));
    return certificate;
  }
  
  async getCertificateByVerificationCode(code: string): Promise<UserCertificate | undefined> {
    const [certificate] = await db
      .select()
      .from(userCertificates)
      .where(eq(userCertificates.verificationCode, code));
    return certificate;
  }
  
  async createCertificate(certificate: InsertUserCertificate): Promise<UserCertificate> {
    const [created] = await db
      .insert(userCertificates)
      .values(certificate)
      .returning();
    return created;
  }
  
  async updateCertificate(id: string, updates: Partial<UserCertificate>): Promise<UserCertificate> {
    const [updated] = await db
      .update(userCertificates)
      .set(updates)
      .where(eq(userCertificates.id, id))
      .returning();
    return updated;
  }
  
  // Gamification - Leaderboard operations
  async getGlobalLeaderboard(limit = 50, period = 'all_time'): Promise<(Leaderboard & { user: User })[]> {
    const results = await db
      .select({
        id: leaderboard.id,
        userId: leaderboard.userId,
        categoryId: leaderboard.categoryId,
        rank: leaderboard.rank,
        points: leaderboard.points,
        quizzesCompleted: leaderboard.quizzesCompleted,
        averageScore: leaderboard.averageScore,
        period: leaderboard.period,
        updatedAt: leaderboard.updatedAt,
        user: users,
      })
      .from(leaderboard)
      .leftJoin(users, eq(leaderboard.userId, users.id))
      .where(
        and(
          sql`${leaderboard.categoryId} IS NULL`,
          eq(leaderboard.period, period)
        )
      )
      .orderBy(leaderboard.rank)
      .limit(limit);
    
    return results.filter(r => r.user !== null) as (Leaderboard & { user: User })[];
  }
  
  async getCategoryLeaderboard(categoryId: string, limit = 50, period = 'all_time'): Promise<(Leaderboard & { user: User })[]> {
    const results = await db
      .select({
        id: leaderboard.id,
        userId: leaderboard.userId,
        categoryId: leaderboard.categoryId,
        rank: leaderboard.rank,
        points: leaderboard.points,
        quizzesCompleted: leaderboard.quizzesCompleted,
        averageScore: leaderboard.averageScore,
        period: leaderboard.period,
        updatedAt: leaderboard.updatedAt,
        user: users,
      })
      .from(leaderboard)
      .leftJoin(users, eq(leaderboard.userId, users.id))
      .where(
        and(
          eq(leaderboard.categoryId, categoryId),
          eq(leaderboard.period, period)
        )
      )
      .orderBy(leaderboard.rank)
      .limit(limit);
    
    return results.filter(r => r.user !== null) as (Leaderboard & { user: User })[];
  }
  
  async getUserLeaderboardPosition(userId: string, categoryId?: string, period = 'all_time'): Promise<Leaderboard | undefined> {
    const [position] = await db
      .select()
      .from(leaderboard)
      .where(
        and(
          eq(leaderboard.userId, userId),
          categoryId ? eq(leaderboard.categoryId, categoryId) : sql`${leaderboard.categoryId} IS NULL`,
          eq(leaderboard.period, period)
        )
      );
    
    return position;
  }
  
  // Gamification - Activity log operations
  async getUserActivityLog(userId: string, limit = 50): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLog)
      .where(eq(activityLog.userId, userId))
      .orderBy(desc(activityLog.createdAt))
      .limit(limit);
  }
  
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [created] = await db.insert(activityLog).values(log).returning();
    return created;
  }
  
  // Corporate agreement operations
  async getCorporateAgreementByEmailDomain(emailDomain: string): Promise<CorporateAgreement | undefined> {
    const [agreement] = await db
      .select()
      .from(corporateAgreements)
      .where(eq(corporateAgreements.emailDomain, emailDomain));
    return agreement;
  }
  
  async getCorporateAgreementByPromoCode(promoCode: string): Promise<CorporateAgreement | undefined> {
    const [agreement] = await db
      .select()
      .from(corporateAgreements)
      .where(eq(corporateAgreements.promoCode, promoCode));
    return agreement;
  }
  
  async getCorporateAgreementById(id: string): Promise<CorporateAgreement | undefined> {
    const [agreement] = await db
      .select()
      .from(corporateAgreements)
      .where(eq(corporateAgreements.id, id));
    return agreement;
  }
  
  async getAllCorporateAgreements(): Promise<CorporateAgreement[]> {
    return await db.select().from(corporateAgreements).orderBy(desc(corporateAgreements.createdAt));
  }
  
  async createCorporateAgreement(agreement: InsertCorporateAgreement): Promise<CorporateAgreement> {
    const [created] = await db.insert(corporateAgreements).values(agreement).returning();
    return created;
  }
  
  async updateCorporateAgreement(id: string, updates: Partial<CorporateAgreement>): Promise<CorporateAgreement> {
    const [updated] = await db
      .update(corporateAgreements)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(corporateAgreements.id, id))
      .returning();
    return updated;
  }
  
  async deleteCorporateAgreement(id: string): Promise<void> {
    await db.delete(corporateAgreements).where(eq(corporateAgreements.id, id));
  }
  
  async incrementCorporateAgreementUsers(id: string): Promise<boolean> {
    // Atomic increment with maxUsers enforcement
    const result = await db
      .update(corporateAgreements)
      .set({ 
        currentUsers: sql`${corporateAgreements.currentUsers} + 1`,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(corporateAgreements.id, id),
          // Only increment if below max (or no max set)
          sql`(${corporateAgreements.maxUsers} IS NULL OR ${corporateAgreements.currentUsers} < ${corporateAgreements.maxUsers})`
        )
      )
      .returning();
    
    // Return true if update succeeded (row was updated)
    return result.length > 0;
  }
  
  async decrementCorporateAgreementUsers(id: string): Promise<void> {
    await db
      .update(corporateAgreements)
      .set({ 
        currentUsers: sql`GREATEST(0, ${corporateAgreements.currentUsers} - 1)`,
        updatedAt: new Date()
      })
      .where(eq(corporateAgreements.id, id));
  }
  
  async getUsersByCorporateAgreement(agreementId: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.corporateAgreementId, agreementId))
      .orderBy(desc(users.createdAt));
  }
  
  // Settings operations
  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key));
    return setting;
  }
  
  async getAllSettings(): Promise<Setting[]> {
    return await db.select().from(settings).orderBy(settings.category, settings.key);
  }
  
  async upsertSetting(key: string, value: string, description?: string, category?: string): Promise<Setting> {
    const [setting] = await db
      .insert(settings)
      .values({
        key,
        value,
        description,
        category,
      })
      .onConflictDoUpdate({
        target: settings.key,
        set: {
          value,
          description,
          category,
          updatedAt: new Date(),
        },
      })
      .returning();
    return setting;
  }
  
  async deleteSetting(key: string): Promise<void> {
    await db.delete(settings).where(eq(settings.key, key));
  }

  // Analytics operations
  async getUserAnalyticsByCategory(userId: string, categoryId: string): Promise<{
    totalAttempts: number;
    averageScore: number;
    bestScore: number;
    recentScores: number[];
    timeSpent: number;
    weakTopics: string[];
    strongTopics: string[];
  } | null> {
    // Get all attempts for quizzes in this category
    const attempts = await db
      .select({
        score: userQuizAttempts.score,
        timeSpent: userQuizAttempts.timeSpent,
        completedAt: userQuizAttempts.completedAt,
      })
      .from(userQuizAttempts)
      .leftJoin(quizzes, eq(userQuizAttempts.quizId, quizzes.id))
      .where(and(
        eq(userQuizAttempts.userId, userId),
        eq(quizzes.categoryId, categoryId)
      ))
      .orderBy(desc(userQuizAttempts.completedAt))
      .limit(20);

    if (attempts.length === 0) {
      return null;
    }

    // Get reports for weak/strong topics
    const reports = await db
      .select({
        weakAreas: quizReports.weakAreas,
        strengths: quizReports.strengths,
      })
      .from(quizReports)
      .leftJoin(userQuizAttempts, eq(quizReports.attemptId, userQuizAttempts.id))
      .leftJoin(quizzes, eq(userQuizAttempts.quizId, quizzes.id))
      .where(and(
        eq(quizReports.userId, userId),
        eq(quizzes.categoryId, categoryId)
      ))
      .orderBy(desc(quizReports.createdAt))
      .limit(5);

    const scores = attempts.map(a => a.score);
    const totalTimeSpent = attempts.reduce((sum, a) => sum + a.timeSpent, 0);

    // Aggregate weak and strong topics
    const weakTopicsMap = new Map<string, number>();
    const strongTopicsSet = new Set<string>();

    reports.forEach(r => {
      const weak = r.weakAreas as any[];
      const strong = r.strengths as string[];
      
      if (weak) {
        weak.forEach(w => {
          const count = weakTopicsMap.get(w.category) || 0;
          weakTopicsMap.set(w.category, count + 1);
        });
      }
      
      if (strong) {
        strong.forEach(s => strongTopicsSet.add(s));
      }
    });

    const weakTopics = Array.from(weakTopicsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);

    const strongTopics = Array.from(strongTopicsSet).slice(0, 5);

    return {
      totalAttempts: attempts.length,
      averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      bestScore: Math.max(...scores),
      recentScores: scores.slice(0, 10),
      timeSpent: totalTimeSpent,
      weakTopics,
      strongTopics,
    };
  }

  async getCategoryBenchmark(categoryId: string): Promise<{
    averageScore: number;
    totalAttempts: number;
    topPerformers: number;
  }> {
    // Get aggregate stats for all users in this category
    const stats = await db
      .select({
        avgScore: sql<number>`AVG(${userQuizAttempts.score})::int`,
        totalAttempts: sql<number>`COUNT(*)::int`,
        topPerformers: sql<number>`COUNT(DISTINCT CASE WHEN ${userQuizAttempts.score} >= 90 THEN ${userQuizAttempts.userId} END)::int`,
      })
      .from(userQuizAttempts)
      .leftJoin(quizzes, eq(userQuizAttempts.quizId, quizzes.id))
      .where(eq(quizzes.categoryId, categoryId));

    return {
      averageScore: stats[0]?.avgScore || 0,
      totalAttempts: stats[0]?.totalAttempts || 0,
      topPerformers: stats[0]?.topPerformers || 0,
    };
  }

  async getUserPerformanceTrend(userId: string, days: number = 30): Promise<Array<{
    date: string;
    averageScore: number;
    attemptsCount: number;
  }>> {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    const attempts = await db
      .select({
        completedAt: userQuizAttempts.completedAt,
        score: userQuizAttempts.score,
      })
      .from(userQuizAttempts)
      .where(and(
        eq(userQuizAttempts.userId, userId),
        sql`${userQuizAttempts.completedAt} >= ${dateThreshold}`
      ))
      .orderBy(userQuizAttempts.completedAt);

    // Group by date
    const grouped = new Map<string, { scores: number[]; count: number }>();
    
    attempts.forEach(a => {
      if (!a.completedAt) return;
      const date = a.completedAt.toISOString().split('T')[0];
      const existing = grouped.get(date) || { scores: [], count: 0 };
      existing.scores.push(a.score);
      existing.count++;
      grouped.set(date, existing);
    });

    return Array.from(grouped.entries()).map(([date, data]) => ({
      date,
      averageScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.count),
      attemptsCount: data.count,
    }));
  }

  // Email template operations
  async getAllEmailTemplates(): Promise<EmailTemplate[]> {
    return await db.select().from(emailTemplates).orderBy(emailTemplates.name);
  }

  async getEmailTemplateByCode(code: string): Promise<EmailTemplate | undefined> {
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.code, code));
    return template;
  }

  async getEmailTemplateById(id: string): Promise<EmailTemplate | undefined> {
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, id));
    return template;
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const [newTemplate] = await db
      .insert(emailTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  async updateEmailTemplate(id: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate> {
    const [updated] = await db
      .update(emailTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emailTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteEmailTemplate(id: string): Promise<void> {
    await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
  }

  // Subscription plan operations
  async getAllSubscriptionPlans(includeInactive: boolean = false): Promise<SubscriptionPlan[]> {
    if (includeInactive) {
      return await db.select().from(subscriptionPlans).orderBy(subscriptionPlans.sortOrder);
    }
    return await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(subscriptionPlans.sortOrder);
  }

  async getSubscriptionPlanById(id: string): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, id));
    return plan;
  }

  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [newPlan] = await db
      .insert(subscriptionPlans)
      .values(plan)
      .returning();
    return newPlan;
  }

  async updateSubscriptionPlan(id: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const [updated] = await db
      .update(subscriptionPlans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(subscriptionPlans.id, id))
      .returning();
    return updated;
  }

  async deleteSubscriptionPlan(id: string): Promise<void> {
    await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, id));
  }
}

export const storage = new DatabaseStorage();
