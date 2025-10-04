import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import OpenAI from "openai";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./replitAuth";
import { insertUserQuizAttemptSchema, insertContentPageSchema, updateContentPageSchema } from "@shared/schema";
import { z } from "zod";
import { generateQuizReport, generateInsightDiscoveryReport } from "./reportGenerator";
import DOMPurify from "isomorphic-dompurify";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY. Please set this environment variable.');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Configure multer for image uploads
const uploadDir = path.join(process.cwd(), 'public', 'question-images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: multerStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Utility function to shuffle array (Fisher-Yates algorithm)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Serve uploaded images statically
  app.use('/question-images', express.static(uploadDir));

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Quiz data routes
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Get all quizzes
  app.get('/api/quizzes', async (req, res) => {
    try {
      const quizzes = await storage.getAllQuizzes();
      res.json(quizzes);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  app.get('/api/categories-with-quizzes', async (req, res) => {
    try {
      const categoriesWithQuizzes = await storage.getCategoriesWithQuizzes();
      res.json(categoriesWithQuizzes);
    } catch (error) {
      console.error("Error fetching categories with quizzes:", error);
      res.status(500).json({ message: "Failed to fetch categories with quizzes" });
    }
  });

  app.get('/api/categories/:categoryId/quizzes', async (req, res) => {
    try {
      const { categoryId } = req.params;
      const quizzes = await storage.getQuizzesByCategory(categoryId);
      res.json(quizzes);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  app.get('/api/quizzes/:quizId', isAuthenticated, async (req: any, res) => {
    try {
      const { quizId } = req.params;
      const user = await storage.getUser(req.user.claims.sub);
      
      const quiz = await storage.getQuizById(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // Check if user has premium access for premium quizzes
      if (quiz.isPremium && !user?.isPremium) {
        return res.status(403).json({ message: "Premium access required" });
      }

      const questions = await storage.getQuestionsByQuizId(quizId);
      // Randomize questions order for each quiz attempt
      const shuffledQuestions = shuffleArray(questions);
      res.json({ quiz, questions: shuffledQuestions });
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({ message: "Failed to fetch quiz" });
    }
  });

  // Quiz attempt submission
  app.post('/api/quiz-attempts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const attemptData = insertUserQuizAttemptSchema.parse({
        ...req.body,
        userId,
      });

      const attempt = await storage.createQuizAttempt(attemptData);
      
      // Update user progress
      const quiz = await storage.getQuizById(attempt.quizId);
      if (quiz) {
        await storage.updateUserProgress(userId, quiz.categoryId, attempt);
        
        // Generate quiz report
        const questions = await storage.getQuestionsByQuizId(attempt.quizId);
        
        // Check if this is an Insight Discovery personality test
        const isInsightDiscovery = quiz.title.toLowerCase().includes('insight discovery');
        
        if (isInsightDiscovery) {
          // Generate Insight Discovery personality report
          const insightProfile = generateInsightDiscoveryReport(attempt, questions);
          
          await storage.createQuizReport({
            attemptId: attempt.id,
            userId,
            quizId: attempt.quizId,
            reportData: insightProfile as any,
            weakAreas: [],
            strengths: insightProfile.strengths,
            recommendations: insightProfile.recommendations,
          });
        } else {
          // Generate standard quiz report
          const reportData = generateQuizReport(attempt, quiz, questions);
          
          await storage.createQuizReport({
            attemptId: attempt.id,
            userId,
            quizId: attempt.quizId,
            reportData: reportData as any,
            weakAreas: reportData.weakAreas as any,
            strengths: reportData.strengths as any,
            recommendations: reportData.recommendations,
          });
        }
      }

      res.json(attempt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating quiz attempt:", error);
      res.status(500).json({ message: "Failed to save quiz attempt" });
    }
  });

  // User dashboard data
  app.get('/api/user/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const [attempts, progress] = await Promise.all([
        storage.getUserQuizAttempts(userId, 10),
        storage.getUserProgress(userId),
      ]);

      // Calculate stats
      const totalQuizzes = attempts.length;
      const averageScore = attempts.length > 0 
        ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
        : 0;
      const totalTime = progress.reduce((sum, p) => sum + (p.totalTimeSpent || 0), 0);
      
      // Calculate current streak (simplified - count recent consecutive days)
      const currentStreak = 7; // Placeholder - would need more complex logic

      res.json({
        stats: {
          quizzesCompleted: totalQuizzes,
          averageScore,
          totalTime: Math.round(totalTime / 3600), // Convert to hours
          currentStreak,
        },
        recentAttempts: attempts,
        progress,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Update user language
  app.post('/api/user/language', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { language } = req.body;

      const validLanguages = ['it', 'en', 'es', 'fr'];
      if (!language || !validLanguages.includes(language)) {
        return res.status(400).json({ message: "Invalid language code" });
      }

      await storage.updateUserLanguage(userId, language);
      res.json({ success: true, language });
    } catch (error) {
      console.error("Error updating user language:", error);
      res.status(500).json({ message: "Failed to update language" });
    }
  });

  // Translate quiz questions to target language
  app.post('/api/translate-questions', isAuthenticated, async (req: any, res) => {
    try {
      const { questions, targetLanguage } = req.body;
      
      if (!questions || !Array.isArray(questions)) {
        return res.status(400).json({ message: "Invalid questions array" });
      }

      const validLanguages = ['it', 'es', 'fr'];
      if (!targetLanguage || !validLanguages.includes(targetLanguage)) {
        return res.status(400).json({ message: "Invalid target language" });
      }

      const languageNames: Record<string, string> = {
        'it': 'Italian',
        'es': 'Spanish',
        'fr': 'French'
      };

      // Prepare questions for translation
      const questionsToTranslate = questions.map((q: any) => ({
        id: q.id,
        question: q.question,
        options: q.options.map((opt: any) => opt.text)
      }));

      // Call OpenAI for translation
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a professional translator. Translate quiz questions and answers to ${languageNames[targetLanguage]}. Maintain technical accuracy and clarity.`
          },
          {
            role: "user",
            content: `Translate the following quiz questions to ${languageNames[targetLanguage]}. Return ONLY a JSON array with this structure:
[
  {
    "id": "question-id",
    "question": "translated question text",
    "options": ["option 1 translated", "option 2 translated", "option 3 translated", "option 4 translated"]
  }
]

Questions to translate:
${JSON.stringify(questionsToTranslate)}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 16000
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No translation received');
      }

      const parsed = JSON.parse(content);
      const translatedQuestions = Array.isArray(parsed) ? parsed : parsed.questions || [];

      res.json({ translatedQuestions });
    } catch (error) {
      console.error("Error translating questions:", error);
      res.status(500).json({ message: "Failed to translate questions" });
    }
  });

  // Get quiz report by attempt ID
  app.get('/api/quiz-reports/:attemptId', isAuthenticated, async (req: any, res) => {
    try {
      const { attemptId } = req.params;
      const report = await storage.getQuizReport(attemptId);
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      // Check if user owns this report
      if (report.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      res.json(report);
    } catch (error) {
      console.error("Error fetching quiz report:", error);
      res.status(500).json({ message: "Failed to fetch report" });
    }
  });

  // Stripe subscription endpoint
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    let user = await storage.getUser(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.stripeSubscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      
      if (subscription.status === 'active') {
        return res.json({
          subscriptionId: subscription.id,
          status: subscription.status,
          message: "User already has active subscription"
        });
      }
    }
    
    if (!user.email) {
      throw new Error('No user email on file');
    }

    try {
      let customerId = user.stripeCustomerId;
      
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        });
        customerId = customer.id;
      }

      // Create a one-time payment intent for €90 (annual subscription)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 9000, // €90 in cents
        currency: 'eur',
        customer: customerId,
        metadata: {
          userId: userId,
          type: 'premium_access',
        },
      });

      // Update user with Stripe customer ID
      await storage.updateUserStripeInfo(userId, customerId);
  
      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      return res.status(400).json({ error: { message: error.message } });
    }
  });

  // Handle successful payment webhook (simplified - in production use Stripe webhooks)
  app.post('/api/payment-success', isAuthenticated, async (req: any, res) => {
    try {
      const { paymentIntentId } = req.body;
      const userId = req.user.claims.sub;

      // Verify payment with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded' && paymentIntent.metadata.userId === userId) {
        // Update user to premium
        await storage.updateUserStripeInfo(userId, paymentIntent.customer as string, 'premium_lifetime');
        res.json({ success: true, message: "Premium access activated" });
      } else {
        res.status(400).json({ message: "Payment verification failed" });
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ message: "Failed to verify payment" });
    }
  });

  // ========== ADMIN ROUTES ==========
  
  // Configure multer for image uploads
  const uploadStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'attached_assets/stock_images');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });
  
  const upload = multer({ 
    storage: uploadStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'));
      }
    }
  });

  // Admin - Get all users
  app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Admin - Update user
  app.patch('/api/admin/users/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.updateUser(id, req.body);
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Admin - Delete user
  app.delete('/api/admin/users/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteUser(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Admin - Create category
  app.post('/api/admin/categories', isAdmin, async (req, res) => {
    try {
      const category = await storage.createCategory(req.body);
      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Admin - Update category
  app.patch('/api/admin/categories/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const category = await storage.updateCategory(id, req.body);
      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  // Admin - Delete category
  app.delete('/api/admin/categories/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCategory(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Admin - Create quiz
  app.post('/api/admin/quizzes', isAdmin, async (req, res) => {
    try {
      const quiz = await storage.createQuiz(req.body);
      res.json(quiz);
    } catch (error) {
      console.error("Error creating quiz:", error);
      res.status(500).json({ message: "Failed to create quiz" });
    }
  });

  // Admin - Update quiz
  app.patch('/api/admin/quizzes/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const quiz = await storage.updateQuiz(id, req.body);
      res.json(quiz);
    } catch (error) {
      console.error("Error updating quiz:", error);
      res.status(500).json({ message: "Failed to update quiz" });
    }
  });

  // Admin - Delete quiz
  app.delete('/api/admin/quizzes/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteQuiz(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting quiz:", error);
      res.status(500).json({ message: "Failed to delete quiz" });
    }
  });

  // Admin - Get question by ID
  app.get('/api/admin/questions/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const question = await storage.getQuestionById(id);
      res.json(question);
    } catch (error) {
      console.error("Error fetching question:", error);
      res.status(500).json({ message: "Failed to fetch question" });
    }
  });

  // Admin - Create question
  app.post('/api/admin/questions', isAdmin, async (req, res) => {
    try {
      const question = await storage.createQuestion(req.body);
      res.json(question);
    } catch (error) {
      console.error("Error creating question:", error);
      res.status(500).json({ message: "Failed to create question" });
    }
  });

  // Admin - Update question
  app.patch('/api/admin/questions/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const question = await storage.updateQuestion(id, req.body);
      res.json(question);
    } catch (error) {
      console.error("Error updating question:", error);
      res.status(500).json({ message: "Failed to update question" });
    }
  });

  // Admin - Delete question
  app.delete('/api/admin/questions/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteQuestion(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ message: "Failed to delete question" });
    }
  });

  // Admin - Upload image
  app.post('/api/admin/upload', isAdmin, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const imageUrl = `/question-images/${req.file.filename}`;
      res.json({ url: imageUrl, filename: req.file.filename });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Admin - Get pricing settings (simplified - could be database-backed)
  app.get('/api/admin/pricing', isAdmin, async (req, res) => {
    try {
      res.json({
        annualPrice: 9000, // €90 in cents
        currency: 'eur',
        features: ['All quizzes', 'Detailed reports', 'Progress tracking', 'Priority support']
      });
    } catch (error) {
      console.error("Error fetching pricing:", error);
      res.status(500).json({ message: "Failed to fetch pricing" });
    }
  });

  // Admin - Live Courses CRUD
  app.get('/api/admin/live-courses', isAdmin, async (req, res) => {
    try {
      const courses = await storage.getAllLiveCourses();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching live courses:", error);
      res.status(500).json({ message: "Failed to fetch live courses" });
    }
  });

  app.post('/api/admin/live-courses', isAdmin, async (req, res) => {
    try {
      console.log("Creating live course with data:", req.body);
      const course = await storage.createLiveCourse(req.body);
      console.log("Live course created successfully:", course);
      res.json(course);
    } catch (error) {
      console.error("Error creating live course:", error);
      res.status(500).json({ message: "Failed to create live course" });
    }
  });

  app.put('/api/admin/live-courses/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const course = await storage.updateLiveCourse(id, req.body);
      res.json(course);
    } catch (error) {
      console.error("Error updating live course:", error);
      res.status(500).json({ message: "Failed to update live course" });
    }
  });

  app.delete('/api/admin/live-courses/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteLiveCourse(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting live course:", error);
      res.status(500).json({ message: "Failed to delete live course" });
    }
  });

  // Admin - Live Course Sessions CRUD
  app.get('/api/admin/live-courses/:courseId/sessions', isAdmin, async (req, res) => {
    try {
      const { courseId } = req.params;
      const sessions = await storage.getSessionsByCourseId(courseId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.post('/api/admin/live-courses/:courseId/sessions', isAdmin, async (req, res) => {
    try {
      const { courseId } = req.params;
      const session = await storage.createLiveCourseSession({
        ...req.body,
        courseId
      });
      res.json(session);
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  app.put('/api/admin/live-course-sessions/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const session = await storage.updateLiveCourseSession(id, req.body);
      res.json(session);
    } catch (error) {
      console.error("Error updating session:", error);
      res.status(500).json({ message: "Failed to update session" });
    }
  });

  app.delete('/api/admin/live-course-sessions/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteLiveCourseSession(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting session:", error);
      res.status(500).json({ message: "Failed to delete session" });
    }
  });

  // Public - Get live course for quiz
  app.get('/api/live-courses/quiz/:quizId', async (req, res) => {
    try {
      const { quizId } = req.params;
      const course = await storage.getLiveCourseByQuizId(quizId);
      
      if (!course) {
        return res.status(404).json({ message: "No live course for this quiz" });
      }

      const sessions = await storage.getSessionsByCourseId(course.id);
      res.json({ ...course, sessions });
    } catch (error) {
      console.error("Error fetching live course:", error);
      res.status(500).json({ message: "Failed to fetch live course" });
    }
  });

  // Purchase live course - Create payment intent
  app.post('/api/live-courses/purchase', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { courseId, sessionId } = req.body;

      if (!courseId || !sessionId) {
        return res.status(400).json({ message: "Course ID and Session ID required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const course = await storage.getLiveCourseById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      const session = await storage.getSessionById(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Check session availability
      if (session.status !== 'available' || (session.enrolled || 0) >= (session.capacity || 30)) {
        return res.status(400).json({ message: "Session is full or unavailable" });
      }

      try {
        let customerId = user.stripeCustomerId;
        
        if (!customerId) {
          const customer = await stripe.customers.create({
            email: user.email || undefined,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          });
          customerId = customer.id;
          await storage.updateUserStripeCustomer(userId, customerId);
        }

        // Create payment intent for live course
        const paymentIntent = await stripe.paymentIntents.create({
          amount: course.price,
          currency: 'eur',
          customer: customerId,
          metadata: {
            userId: userId,
            courseId: course.id,
            sessionId: session.id,
            type: 'live_course'
          },
          description: `${course.title} - ${new Date(session.startDate).toLocaleDateString()}`,
        });

        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (stripeError) {
        console.error("Stripe error:", stripeError);
        res.status(500).json({ message: "Payment initialization failed" });
      }
    } catch (error) {
      console.error("Error purchasing course:", error);
      res.status(500).json({ message: "Failed to purchase course" });
    }
  });

  // Confirm live course enrollment after payment
  app.post('/api/live-courses/confirm-enrollment', isAuthenticated, async (req: any, res) => {
    try {
      const { paymentIntentId, courseId, sessionId } = req.body;
      const userId = req.user.claims.sub;

      // Verify payment with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded' && 
          paymentIntent.metadata.userId === userId &&
          paymentIntent.metadata.courseId === courseId &&
          paymentIntent.metadata.sessionId === sessionId) {
        
        // Create enrollment
        await storage.createLiveCourseEnrollment({
          userId,
          courseId,
          sessionId,
          stripePaymentIntentId: paymentIntentId,
          amountPaid: paymentIntent.amount,
          status: 'confirmed'
        });

        // Update session enrolled count
        const session = await storage.getSessionById(sessionId);
        if (session) {
          await storage.updateLiveCourseSession(sessionId, {
            enrolled: (session.enrolled || 0) + 1
          });
        }

        res.json({ success: true, message: "Enrollment confirmed" });
      } else {
        res.status(400).json({ message: "Payment verification failed" });
      }
    } catch (error) {
      console.error("Error confirming enrollment:", error);
      res.status(500).json({ message: "Failed to confirm enrollment" });
    }
  });

  // Download quiz report
  app.get('/api/quiz-reports/:attemptId/download', isAuthenticated, async (req: any, res) => {
    try {
      const { attemptId } = req.params;
      const report = await storage.getQuizReport(attemptId);
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      // Check if user owns this report
      if (report.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // HTML escape function to prevent XSS
      const escapeHtml = (text: string): string => {
        const map: { [key: string]: string } = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
      };

      // Get user info
      const user = await storage.getUserById(report.userId);
      const userName = escapeHtml(user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Utente' : 'Utente');

      // Format date
      const reportDate = report.createdAt 
        ? new Date(report.createdAt).toLocaleDateString('it-IT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : new Date().toLocaleDateString('it-IT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

      // Check if this is an Insight Discovery report
      const isInsightReport = 'dominantColor' in (report.reportData as any);

      // Create HTML content
      let htmlContent = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Report Quiz - IBI ACADEMY</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #3b82f6;
      margin: 0;
    }
    .meta-info {
      background: #f8fafc;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .score-summary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 12px;
      text-align: center;
      margin-bottom: 30px;
    }
    .score {
      font-size: 48px;
      font-weight: bold;
      margin: 10px 0;
    }
    .section {
      margin-bottom: 30px;
    }
    .section h2 {
      color: #1e293b;
      border-left: 4px solid #3b82f6;
      padding-left: 12px;
      margin-bottom: 15px;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    .stat-box {
      text-align: center;
      padding: 15px;
      background: #f8fafc;
      border-radius: 8px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #3b82f6;
    }
    .weak-area {
      background: #fef3c7;
      padding: 12px;
      border-left: 4px solid #f59e0b;
      margin-bottom: 10px;
      border-radius: 4px;
    }
    .strength {
      background: #d1fae5;
      padding: 12px;
      border-left: 4px solid #10b981;
      margin-bottom: 10px;
      border-radius: 4px;
    }
    .recommendation {
      background: #dbeafe;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #3b82f6;
    }
    .footer {
      margin-top: 50px;
      text-align: center;
      color: #64748b;
      font-size: 14px;
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎓 IBI ACADEMY</h1>
    <p>Report Quiz Dettagliato</p>
  </div>

  <div class="meta-info">
    <p><strong>Utente:</strong> ${userName}</p>
    <p><strong>Data:</strong> ${reportDate}</p>
  </div>
`;

      if (isInsightReport) {
        const data = report.reportData as any;
        htmlContent += `
  <div class="score-summary">
    <h2>Il Tuo Profilo Insight Discovery</h2>
    <p style="font-size: 20px; margin: 15px 0;">
      <strong>${escapeHtml(data.dominantColor.name)}</strong> (${escapeHtml(String(data.dominantColor.percentage))}%)
    </p>
    <p>con influenza <strong>${escapeHtml(data.secondaryColor.name)}</strong> (${escapeHtml(String(data.secondaryColor.percentage))}%)</p>
  </div>

  <div class="section">
    <h2>📊 Distribuzione Colori</h2>
    <div class="stats">
      ${data.colorScores.map((cs: any) => `
        <div class="stat-box">
          <div class="stat-value">${escapeHtml(String(cs.percentage))}%</div>
          <div>${escapeHtml(cs.name)}</div>
        </div>
      `).join('')}
    </div>
  </div>

  <div class="section">
    <h2>💼 Stile di Lavoro</h2>
    <p>${escapeHtml(data.workingStyle)}</p>
  </div>

  <div class="section">
    <h2>💬 Stile di Comunicazione</h2>
    <p>${escapeHtml(data.communicationStyle)}</p>
  </div>

  <div class="section">
    <h2>✨ Punti di Forza</h2>
    ${data.strengths.map((s: string) => `<div class="strength">✓ ${escapeHtml(s)}</div>`).join('')}
  </div>

  <div class="section">
    <h2>📈 Aree di Sviluppo</h2>
    ${data.developmentAreas.map((a: string) => `<div class="weak-area">→ ${escapeHtml(a)}</div>`).join('')}
  </div>

  <div class="section">
    <h2>💡 Raccomandazioni</h2>
    <div class="recommendation">
      ${escapeHtml(data.recommendations).replace(/\n/g, '<br>')}
    </div>
  </div>
`;
      } else {
        const data = report.reportData as any;
        const passStatus = data.passStatus === 'pass' ? 'SUPERATO ✓' : 'NON SUPERATO ✗';
        const passColor = data.passStatus === 'pass' ? '#10b981' : '#ef4444';
        
        htmlContent += `
  <div class="score-summary" style="background: linear-gradient(135deg, ${passColor} 0%, ${passColor}dd 100%);">
    <div class="score">${escapeHtml(String(data.score))}%</div>
    <h2>${passStatus}</h2>
    <p>${escapeHtml(String(data.correctAnswers))} corrette su ${escapeHtml(String(data.totalQuestions))} domande</p>
  </div>

  <div class="stats">
    <div class="stat-box">
      <div class="stat-value" style="color: #10b981;">${escapeHtml(String(data.correctAnswers))}</div>
      <div>Corrette</div>
    </div>
    <div class="stat-box">
      <div class="stat-value" style="color: #ef4444;">${escapeHtml(String(data.totalQuestions - data.correctAnswers))}</div>
      <div>Sbagliate</div>
    </div>
    <div class="stat-box">
      <div class="stat-value" style="color: #3b82f6;">${escapeHtml(String(Math.floor(data.timeSpent / 60)))}:${escapeHtml((data.timeSpent % 60).toString().padStart(2, '0'))}</div>
      <div>Tempo</div>
    </div>
  </div>

  ${data.weakAreas && data.weakAreas.length > 0 ? `
  <div class="section">
    <h2>📉 Aree da Migliorare</h2>
    ${data.weakAreas.map((area: any) => `
      <div class="weak-area">
        <strong>${escapeHtml(area.category)}</strong>: ${escapeHtml(String(area.wrongCount))} errori su ${escapeHtml(String(area.totalCount))} domande (${escapeHtml(String(area.percentage))}%)
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${data.strengths && data.strengths.length > 0 ? `
  <div class="section">
    <h2>✨ Punti di Forza</h2>
    ${data.strengths.map((s: string) => `<div class="strength">✓ ${escapeHtml(s)}</div>`).join('')}
  </div>
  ` : ''}

  <div class="section">
    <h2>💡 Raccomandazioni</h2>
    <div class="recommendation">
      ${escapeHtml(data.recommendations).replace(/\n/g, '<br>')}
    </div>
  </div>
`;
      }

      htmlContent += `
  <div class="footer">
    <p>Report generato da IBI ACADEMY - Piattaforma #1 per Certificazioni Professionali</p>
    <p>${reportDate}</p>
  </div>
</body>
</html>
`;

      // Set headers for download
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="report-quiz-${attemptId}.html"`);
      res.send(htmlContent);

    } catch (error) {
      console.error("Error downloading quiz report:", error);
      res.status(500).json({ message: "Failed to download report" });
    }
  });

  // Admin - Generate AI questions
  app.post('/api/admin/generate-questions', isAdmin, async (req, res) => {
    try {
      const { quizId, count, difficulty = 'intermediate' } = req.body;
      
      if (!quizId || !count) {
        return res.status(400).json({ message: "Quiz ID and count are required" });
      }

      const quiz = await storage.getQuizById(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // Import dynamically to avoid circular dependencies
      const { generateQuestionsInBatches } = await import('./aiQuestionGenerator');
      
      // Get category name for better context
      const categories = await storage.getCategories();
      const category = categories.find(c => c.id === quiz.categoryId);
      const categoryName = category?.name || 'General';
      
      res.json({ 
        message: "Question generation started", 
        quizId, 
        count,
        status: "processing"
      });

      // Generate questions in background
      generateQuestionsInBatches(quiz.title, categoryName, count, 20, difficulty)
        .then(async (questions) => {
          // Save all generated questions to database
          for (const q of questions) {
            // Find the correct answer and get its label (A, B, C, D)
            const correctIndex = q.options.findIndex(opt => opt.isCorrect);
            const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
            const correctAnswer = labels[correctIndex] || 'A';
            
            // Create options with labels
            const optionsWithLabels = q.options.map((opt, idx) => ({
              label: labels[idx],
              text: opt.text,
              isCorrect: opt.isCorrect
            }));
            
            await storage.createQuestion({
              quizId: quiz.id,
              question: q.question,
              options: optionsWithLabels as any,
              correctAnswer,
              explanation: q.explanation,
              imageUrl: '',
              category: categoryName,
              domain: null,
            });
          }
          console.log(`Successfully generated and saved ${questions.length} questions for ${quiz.title}`);
        })
        .catch((error) => {
          console.error("Error in background question generation:", error);
        });

    } catch (error) {
      console.error("Error generating questions:", error);
      res.status(500).json({ message: "Failed to generate questions" });
    }
  });

  // Content pages routes (public)
  app.get('/api/content-pages', async (req, res) => {
    try {
      const pages = await storage.getAllContentPages();
      res.json(pages.filter(p => p.isPublished));
    } catch (error) {
      console.error("Error fetching content pages:", error);
      res.status(500).json({ message: "Failed to fetch content pages" });
    }
  });
  
  app.get('/api/content-pages/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const page = await storage.getContentPageBySlug(slug);
      if (!page || !page.isPublished) {
        return res.status(404).json({ message: "Page not found" });
      }
      res.json(page);
    } catch (error) {
      console.error("Error fetching content page:", error);
      res.status(500).json({ message: "Failed to fetch content page" });
    }
  });
  
  // Admin content pages routes
  app.get('/api/admin/content-pages', isAdmin, async (req, res) => {
    try {
      const pages = await storage.getAllContentPages();
      res.json(pages);
    } catch (error) {
      console.error("Error fetching content pages:", error);
      res.status(500).json({ message: "Failed to fetch content pages" });
    }
  });
  
  app.post('/api/admin/content-pages', isAdmin, async (req, res) => {
    try {
      const validated = insertContentPageSchema.parse(req.body);
      
      // Sanitize HTML content before saving
      const sanitizedContent = DOMPurify.sanitize(validated.content, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre'],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel']
      });
      
      const page = await storage.createContentPage({
        ...validated,
        content: sanitizedContent
      });
      res.json(page);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating content page:", error);
      res.status(500).json({ message: "Failed to create content page" });
    }
  });
  
  app.patch('/api/admin/content-pages/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validated = updateContentPageSchema.parse(req.body);
      
      // Sanitize HTML content if present
      const updates = validated.content
        ? {
            ...validated,
            content: DOMPurify.sanitize(validated.content, {
              ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre'],
              ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel']
            })
          }
        : validated;
      
      const page = await storage.updateContentPage(id, updates);
      res.json(page);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating content page:", error);
      res.status(500).json({ message: "Failed to update content page" });
    }
  });
  
  app.delete('/api/admin/content-pages/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteContentPage(id);
      res.json({ message: "Content page deleted successfully" });
    } catch (error) {
      console.error("Error deleting content page:", error);
      res.status(500).json({ message: "Failed to delete content page" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
