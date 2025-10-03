import {
  users,
  categories,
  quizzes,
  questions,
  userQuizAttempts,
  userProgress,
  quizReports,
  type User,
  type UpsertUser,
  type Category,
  type Quiz,
  type Question,
  type UserQuizAttempt,
  type UserProgress,
  type QuizReport,
  type InsertUserQuizAttempt,
  type InsertUserProgress,
  type InsertQuizReport,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User>;
  updateUserLanguage(userId: string, language: string): Promise<User>;
  
  // Admin User operations
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Quiz operations
  getCategories(): Promise<Category[]>;
  getCategoriesWithQuizzes(): Promise<Array<Category & { quizzes: Quiz[] }>>;
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

  // Quiz operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.sortOrder, categories.name);
  }

  async getCategoriesWithQuizzes(): Promise<Array<Category & { quizzes: Quiz[] }>> {
    const allCategories = await db.select().from(categories).orderBy(categories.sortOrder, categories.name);
    const result = [];

    for (const category of allCategories) {
      const categoryQuizzes = await db
        .select()
        .from(quizzes)
        .where(eq(quizzes.categoryId, category.id))
        .orderBy(quizzes.title);
      
      result.push({
        ...category,
        quizzes: categoryQuizzes
      });
    }

    return result;
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

  async getUserQuizAttempts(userId: string, limit = 10): Promise<UserQuizAttempt[]> {
    return await db
      .select()
      .from(userQuizAttempts)
      .where(eq(userQuizAttempts.userId, userId))
      .orderBy(desc(userQuizAttempts.completedAt))
      .limit(limit);
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
}

export const storage = new DatabaseStorage();
