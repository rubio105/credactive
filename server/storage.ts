import {
  users,
  categories,
  quizzes,
  questions,
  userQuizAttempts,
  userProgress,
  quizReports,
  liveCourses,
  liveCourseSessions,
  liveCourseEnrollments,
  contentPages,
  type User,
  type UpsertUser,
  type Category,
  type Quiz,
  type Question,
  type UserQuizAttempt,
  type UserProgress,
  type QuizReport,
  type LiveCourse,
  type LiveCourseSession,
  type LiveCourseEnrollment,
  type ContentPage,
  type InsertUserQuizAttempt,
  type InsertUserProgress,
  type InsertQuizReport,
  type InsertLiveCourse,
  type InsertLiveCourseSession,
  type InsertLiveCourseEnrollment,
  type InsertContentPage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";

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
  getCategoriesWithQuizzes(): Promise<Array<Category & { quizzes: Quiz[] }>>;
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
  createQuestion(question: Omit<Question, 'id' | 'createdAt'>): Promise<Question>;
  updateQuestion(id: string, updates: Partial<Question>): Promise<Question>;
  deleteQuestion(id: string): Promise<void>;
  
  // User progress operations
  createQuizAttempt(attempt: InsertUserQuizAttempt): Promise<UserQuizAttempt>;
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
  
  // Content page operations
  getAllContentPages(): Promise<ContentPage[]>;
  getContentPageBySlug(slug: string): Promise<ContentPage | undefined>;
  getContentPageById(id: string): Promise<ContentPage | undefined>;
  createContentPage(page: InsertContentPage): Promise<ContentPage>;
  updateContentPage(id: string, updates: Partial<ContentPage>): Promise<ContentPage>;
  deleteContentPage(id: string): Promise<void>;
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

  async getCategoriesWithQuizzes(): Promise<Array<Category & { quizzes: Quiz[] }>> {
    // Optimize with a single LEFT JOIN query instead of N+1 queries
    const rows = await db
      .select()
      .from(categories)
      .leftJoin(quizzes, eq(categories.id, quizzes.categoryId))
      .orderBy(categories.sortOrder, categories.name, quizzes.title);

    // Group quizzes by category
    const categoryMap = new Map<string, Category & { quizzes: Quiz[] }>();
    
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
        categoryMap.get(category.id)!.quizzes.push(quiz);
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

  // User progress operations
  async createQuizAttempt(attempt: InsertUserQuizAttempt): Promise<UserQuizAttempt> {
    const [created] = await db
      .insert(userQuizAttempts)
      .values(attempt)
      .returning();
    return created;
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
}

export const storage = new DatabaseStorage();
