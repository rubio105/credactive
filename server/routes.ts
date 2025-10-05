import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import OpenAI from "openai";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./authSetup";
import { insertUserQuizAttemptSchema, insertContentPageSchema, updateContentPageSchema } from "@shared/schema";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import passport from "passport";
import { sendPasswordResetEmail, sendWelcomeEmail } from "./email";
import { z } from "zod";
import { generateQuizReport, generateInsightDiscoveryReport } from "./reportGenerator";
import DOMPurify from "isomorphic-dompurify";
import { 
  authLimiter, 
  registrationLimiter, 
  passwordResetLimiter, 
  aiGenerationLimiter 
} from "./rateLimits";

// Dynamic import for pdf-parse (CommonJS module)
// Note: pdf-parse doesn't have a .default export in ESM context

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

// Configure multer for PDF uploads
const pdfUploadDir = path.join(process.cwd(), 'public', 'quiz-documents');
if (!fs.existsSync(pdfUploadDir)) {
  fs.mkdirSync(pdfUploadDir, { recursive: true });
}

const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pdfUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '.pdf');
  }
});

const uploadPdf = multer({
  storage: pdfStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for large PDFs
  fileFilter: (req, file, cb) => {
    const extname = path.extname(file.originalname).toLowerCase() === '.pdf';
    const mimetype = file.mimetype === 'application/pdf';
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
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
  
  // Serve uploaded PDFs statically
  app.use('/quiz-documents', express.static(pdfUploadDir));

  // Auth routes
  app.post('/api/auth/register', registrationLimiter, async (req, res) => {
    try {
      const { 
        email, 
        password, 
        firstName, 
        lastName, 
        dateOfBirth,
        gender,
        phone,
        profession,
        education,
        company,
        addressStreet,
        addressCity,
        addressPostalCode,
        addressProvince,
        addressCountry,
        language,
        newsletterConsent
      } = req.body;

      // Validate required fields
      if (!email || !password || !firstName || !lastName || !dateOfBirth || 
          !gender || !profession || !education || !addressStreet || 
          !addressCity || !addressPostalCode || !addressProvince || !addressCountry) {
        return res.status(400).json({ message: "Tutti i campi obbligatori devono essere compilati" });
      }

      const existingUser = await storage.getUserByEmail(email.toLowerCase());
      if (existingUser) {
        return res.status(400).json({ message: "Email già registrata" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await storage.createUser({
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        phone: phone || null,
        profession,
        education,
        company: company || null,
        addressStreet,
        addressCity,
        addressPostalCode,
        addressProvince,
        addressCountry,
        language: language || 'it',
        newsletterConsent: newsletterConsent || false,
        emailVerified: true,
      });

      // Send welcome email (async, don't block response)
      sendWelcomeEmail(user.email, user.firstName || undefined).catch(err => 
        console.error("Failed to send welcome email:", err)
      );

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Errore durante il login" });
        }
        res.json(user);
      });
    } catch (error) {
      console.error("Error during registration:", error);
      res.status(500).json({ message: "Errore durante la registrazione" });
    }
  });

  app.post('/api/auth/login', authLimiter, (req, res, next) => {
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email:', req.body.email);
    console.log('Password provided:', !!req.body.password);
    
    passport.authenticate('local', (err: any, user: any, info: any) => {
      console.log('Passport authenticate callback:');
      console.log('- Error:', err);
      console.log('- User:', user ? `${user.email} (id: ${user.id})` : null);
      console.log('- Info:', info);
      
      if (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: "Errore durante il login" });
      }
      if (!user) {
        console.log('Login failed - no user returned');
        return res.status(401).json({ message: info?.message || "Email o password non corretti" });
      }
      req.login(user, (err) => {
        if (err) {
          console.error('Session login error:', err);
          return res.status(500).json({ message: "Errore durante il login" });
        }
        console.log('Login successful!');
        res.json(user);
      });
    })(req, res, next);
  });

  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Errore durante il logout" });
      }
      res.json({ message: "Logout effettuato con successo" });
    });
  });


  app.post('/api/auth/forgot-password', passwordResetLimiter, async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email obbligatoria" });
      }

      const user = await storage.getUserByEmail(email.toLowerCase());
      
      if (!user) {
        return res.json({ message: "Se l'email esiste, riceverai le istruzioni per il reset" });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour

      await storage.setPasswordResetToken(user.id, resetToken, resetExpires);

      await sendPasswordResetEmail(user.email, resetToken);

      res.json({ message: "Se l'email esiste, riceverai le istruzioni per il reset" });
    } catch (error) {
      console.error("Error during forgot password:", error);
      res.status(500).json({ message: "Errore durante il reset della password" });
    }
  });

  app.post('/api/auth/reset-password', passwordResetLimiter, async (req, res) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ message: "Token e password sono obbligatori" });
      }

      const user = await storage.getUserByResetToken(token);

      if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
        return res.status(400).json({ message: "Token non valido o scaduto" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      await storage.updateUserPassword(user.id, hashedPassword);
      await storage.clearPasswordResetToken(user.id);

      res.json({ message: "Password aggiornata con successo" });
    } catch (error) {
      console.error("Error during password reset:", error);
      res.status(500).json({ message: "Errore durante il reset della password" });
    }
  });

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

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
      const userId = req.user?.claims?.sub || req.user?.id;
      const user = userId ? await storage.getUser(userId) : null;
      
      const quiz = await storage.getQuizById(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // Check if user has premium access for premium quizzes
      if (quiz.isPremium && !user?.isPremium) {
        return res.status(403).json({ message: "Premium access required" });
      }

      const questions = await storage.getQuestionsByQuizId(quizId);
      
      // Normalize question options to ensure {label, text} format
      const normalizedQuestions = questions.map(q => {
        const options = Array.isArray(q.options) ? q.options : [];
        const normalizedOptions = options.map((opt: any, idx: number) => {
          const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
          const label = labels[idx] || String.fromCharCode(65 + idx);
          
          let text = '';
          
          // If option is already an object
          if (opt && typeof opt === 'object' && !Array.isArray(opt)) {
            // Extract text as a string, handling nested objects or arrays
            if (typeof opt.text === 'string') {
              text = opt.text;
            } else if (opt.text && typeof opt.text === 'object') {
              // Handle nested objects (e.g., {it: '...', en: '...'})
              // Prefer 'it', 'en', 'value' keys, or just stringify first value
              text = opt.text.it || opt.text.en || opt.text.value || 
                     Object.values(opt.text)[0] || '';
              if (typeof text !== 'string') {
                text = String(text);
              }
            } else if (opt.text !== null && opt.text !== undefined) {
              text = String(opt.text);
            } else if (opt.value && typeof opt.value === 'string') {
              text = opt.value;
            } else {
              text = '';
            }
            
            // Use opt.label, opt.id (uppercase if lowercase), or generated label
            let finalLabel = label;
            if (opt.label) {
              finalLabel = opt.label;
            } else if (opt.id) {
              // Convert lowercase id to uppercase (a -> A)
              finalLabel = typeof opt.id === 'string' ? opt.id.toUpperCase() : String(opt.id);
            }
            
            return {
              label: finalLabel,
              text,
              isCorrect: opt.isCorrect ?? false
            };
          }
          
          // If option is a string, convert to {label, text} format
          if (typeof opt === 'string') {
            return {
              label,
              text: opt,
              isCorrect: false
            };
          }
          
          // If option is array, join elements
          if (Array.isArray(opt)) {
            return {
              label,
              text: opt.join(', '),
              isCorrect: false
            };
          }
          
          // Fallback for unexpected formats
          return {
            label,
            text: opt !== null && opt !== undefined ? String(opt) : '',
            isCorrect: false
          };
        });
        
        return {
          ...q,
          options: normalizedOptions
        };
      });
      
      // Randomize questions order for each quiz attempt
      const shuffledQuestions = shuffleArray(normalizedQuestions);
      
      // Limit questions if maxQuestionsPerAttempt is set
      const limitedQuestions = quiz.maxQuestionsPerAttempt && quiz.maxQuestionsPerAttempt > 0
        ? shuffledQuestions.slice(0, quiz.maxQuestionsPerAttempt)
        : shuffledQuestions;
      
      res.json({ quiz, questions: limitedQuestions });
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({ message: "Failed to fetch quiz" });
    }
  });

  // Quiz attempt submission
  app.post('/api/quiz-attempts', isAuthenticated, async (req: any, res) => {
    try {
      console.log('[Quiz Submission] Starting quiz submission...');
      const userId = req.user?.claims?.sub || req.user?.id;
      console.log('[Quiz Submission] User ID:', userId);
      
      const attemptData = insertUserQuizAttemptSchema.parse({
        ...req.body,
        userId,
      });
      console.log('[Quiz Submission] Attempt data parsed, quiz ID:', attemptData.quizId);

      const attempt = await storage.createQuizAttempt(attemptData);
      console.log('[Quiz Submission] Attempt created with ID:', attempt.id);
      
      // Update user progress
      const quiz = await storage.getQuizById(attempt.quizId);
      console.log('[Quiz Submission] Quiz fetched:', quiz?.title);
      
      if (quiz) {
        await storage.updateUserProgress(userId, quiz.categoryId, attempt);
        console.log('[Quiz Submission] User progress updated');
        
        // Generate quiz report
        const questions = await storage.getQuestionsByQuizId(attempt.quizId);
        console.log('[Quiz Submission] Questions fetched:', questions.length);
        
        // Check if this is an Insight Discovery personality test
        const isInsightDiscovery = quiz.title.toLowerCase().includes('insight discovery');
        console.log('[Quiz Submission] Is Insight Discovery:', isInsightDiscovery);
        
        if (isInsightDiscovery) {
          console.log('[Quiz Submission] Generating Insight Discovery report...');
          // Generate Insight Discovery personality report
          const insightProfile = generateInsightDiscoveryReport(attempt, questions);
          console.log('[Quiz Submission] Insight profile generated:', {
            dominantColor: insightProfile.dominantColor.color,
            secondaryColor: insightProfile.secondaryColor.color
          });
          
          await storage.createQuizReport({
            attemptId: attempt.id,
            userId,
            quizId: attempt.quizId,
            reportData: insightProfile as any,
            weakAreas: [],
            strengths: insightProfile.strengths,
            recommendations: insightProfile.recommendations,
          });
          console.log('[Quiz Submission] Insight Discovery report saved successfully');
        } else {
          console.log('[Quiz Submission] Generating standard quiz report...');
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
          console.log('[Quiz Submission] Standard report saved successfully');
        }
      }

      console.log('[Quiz Submission] Sending response to client');
      res.json(attempt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('[Quiz Submission] Zod validation error:', error.errors);
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error('[Quiz Submission] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error
      });
      res.status(500).json({ message: "Failed to save quiz attempt" });
    }
  });

  // User dashboard data
  app.get('/api/user/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      
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
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

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
  app.post('/api/translate-questions', isAuthenticated, aiGenerationLimiter, async (req: any, res) => {
    try {
      const { questions, targetLanguage, quizTitle } = req.body;
      
      if (!questions || !Array.isArray(questions)) {
        return res.status(400).json({ message: "Invalid questions array" });
      }

      const validLanguages = ['it', 'en', 'es', 'fr'];
      if (!targetLanguage || !validLanguages.includes(targetLanguage)) {
        return res.status(400).json({ message: "Invalid target language" });
      }

      const languageNames: Record<string, string> = {
        'it': 'Italian',
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French'
      };

      // Prepare questions for translation
      const questionsToTranslate = questions.map((q: any) => ({
        id: q.id,
        question: q.question,
        options: q.options.map((opt: any) => opt.text)
      }));

      // Build translation content with quiz title if provided
      let translationContent = '';
      if (quizTitle) {
        translationContent = `Translate the following quiz title and questions to ${languageNames[targetLanguage]}. Return ONLY a JSON object with this structure:
{
  "quizTitle": "translated quiz title",
  "questions": [
    {
      "id": "question-id",
      "question": "translated question text",
      "options": ["option 1 translated", "option 2 translated", "option 3 translated", "option 4 translated"]
    }
  ]
}

Quiz Title: ${quizTitle}

Questions to translate:
${JSON.stringify(questionsToTranslate)}`;
      } else {
        translationContent = `Translate the following quiz questions to ${languageNames[targetLanguage]}. Return ONLY a JSON object with this structure:
{
  "questions": [
    {
      "id": "question-id",
      "question": "translated question text",
      "options": ["option 1 translated", "option 2 translated", "option 3 translated", "option 4 translated"]
    }
  ]
}

Questions to translate:
${JSON.stringify(questionsToTranslate)}`;
      }

      // Call OpenAI for translation
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a professional translator. Translate quiz content to ${languageNames[targetLanguage]}. Maintain technical accuracy and clarity.`
          },
          {
            role: "user",
            content: translationContent
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
      const translatedQuizTitle = parsed.quizTitle || '';

      res.json({ translatedQuestions, translatedQuizTitle });
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
      const userId = req.user?.claims?.sub || req.user?.id;
      if (report.userId !== userId) {
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
    const userId = req.user?.claims?.sub || req.user?.id;
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
      const userId = req.user?.claims?.sub || req.user?.id;

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

  // Admin - Create user
  app.post('/api/admin/users', isAdmin, async (req, res) => {
    try {
      const { email, password, firstName, lastName, isPremium, isAdmin: isUserAdmin } = req.body;

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({ message: "Email e password sono obbligatori" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email.toLowerCase());
      if (existingUser) {
        return res.status(400).json({ message: "Un utente con questa email esiste già" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName: firstName || '',
        lastName: lastName || '',
        isPremium: isPremium || false,
        isAdmin: isUserAdmin || false,
        emailVerified: true, // Admin-created users are automatically verified
      });

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
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
      
      // Filter allowed fields for update (exclude id, createdAt)
      const { id: _id, createdAt, ...allowedUpdates } = req.body;
      
      const quiz = await storage.updateQuiz(id, allowedUpdates);
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

  // Admin - Get all questions (must be before :id route)
  app.get('/api/admin/questions', isAdmin, async (req, res) => {
    try {
      const questions = await storage.getAllQuestions();
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
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

  // Admin - Upload PDF document for quiz
  app.post('/api/admin/upload-pdf', isAdmin, uploadPdf.single('pdf'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Read and parse the PDF to validate page count
      const pdfBuffer = fs.readFileSync(req.file.path);
      const pdfParse = (await import('pdf-parse')) as any;
      const pdfData = await pdfParse(pdfBuffer);
      
      // Validate max 600 pages
      if (pdfData.numpages > 600) {
        // Delete the file if it exceeds the limit
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ 
          message: `PDF troppo grande: ${pdfData.numpages} pagine. Massimo consentito: 600 pagine.` 
        });
      }
      
      const pdfUrl = `/quiz-documents/${req.file.filename}`;
      res.json({ 
        url: pdfUrl, 
        filename: req.file.filename,
        pages: pdfData.numpages,
        text: pdfData.text // Include extracted text for AI generation
      });
    } catch (error) {
      console.error("Error uploading PDF:", error);
      // Clean up file on error
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: "Failed to upload PDF" });
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
      const userId = req.user?.claims?.sub || req.user?.id;
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
      const userId = req.user?.claims?.sub || req.user?.id;

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
      const userId = req.user?.claims?.sub || req.user?.id;
      if (report.userId !== userId) {
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
  <title>Report Quiz - CREDACTIVE ACADEMY</title>
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
    <h1>🎓 CREDACTIVE ACADEMY</h1>
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
    <p>Report generato da CREDACTIVE ACADEMY - Piattaforma #1 per Certificazioni Professionali</p>
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
  app.post('/api/admin/generate-questions', isAdmin, aiGenerationLimiter, async (req, res) => {
    console.log('=== GENERATE QUESTIONS ROUTE CALLED ===');
    console.log('User:', req.user);
    console.log('Request body:', req.body);
    try {
      const { quizId, count, difficulty = 'intermediate' } = req.body;
      
      if (!quizId || !count) {
        return res.status(400).json({ message: "Quiz ID and count are required" });
      }

      const quiz = await storage.getQuizById(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // Create generation job
      const job = await storage.createGenerationJob({
        quizId: quiz.id,
        requestedCount: count,
        generatedCount: 0,
        status: 'pending',
        difficulty,
        error: null,
      });

      // Import dynamically to avoid circular dependencies
      const { generateQuestionsInBatches } = await import('./aiQuestionGenerator');
      
      // Get category name for better context
      const categories = await storage.getCategories();
      const category = categories.find(c => c.id === quiz.categoryId);
      const categoryName = category?.name || 'General';
      
      // Extract PDF document text if available
      let documentContext: string | undefined;
      if (quiz.documentPdfUrl) {
        try {
          const pdfPath = path.join(process.cwd(), 'public', quiz.documentPdfUrl.replace(/^\//, ''));
          if (fs.existsSync(pdfPath)) {
            const pdfBuffer = fs.readFileSync(pdfPath);
            const pdfParse = (await import('pdf-parse')) as any;
            const pdfData = await pdfParse(pdfBuffer);
            documentContext = pdfData.text;
            console.log(`Loaded PDF context: ${pdfData.numpages} pages, ${pdfData.text.length} characters`);
          }
        } catch (error) {
          console.error('Error reading PDF for context:', error);
        }
      }
      
      // Return job info immediately
      res.json({ 
        message: "Question generation started", 
        jobId: job.id,
        quizId, 
        count,
        status: "pending",
        documentBased: !!documentContext
      });

      // Update job status to processing
      await storage.updateGenerationJob(job.id, { status: 'processing' });

      // Get user language preference (handle both Replit OIDC and local auth)
      const userId = (req.user as any)?.claims?.sub || (req.user as any)?.id;
      const user = userId ? await storage.getUser(userId) : null;
      const userLanguage = user?.language || 'it';

      // Generate questions in background (using batch size of 15 for better token distribution)
      generateQuestionsInBatches(quiz.title, categoryName, count, 15, difficulty, documentContext, userLanguage)
        .then(async (questions) => {
          // CRITICAL: Limit to exactly the requested count to prevent over-generation
          const questionsToSave = questions.slice(0, count);
          
          // Save all generated questions to database
          let savedCount = 0;
          for (const q of questionsToSave) {
            try {
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
                correctAnswers: null,
                explanation: q.explanation,
                explanationAudioUrl: null,
                imageUrl: '',
                category: categoryName,
                domain: null,
                language: userLanguage, // Save the language used for generation
              });
              savedCount++;
            } catch (error) {
              console.error('Error saving question:', error);
            }
          }
          
          // Update job as completed
          await storage.updateGenerationJob(job.id, {
            status: 'completed',
            generatedCount: savedCount,
            completedAt: new Date(),
          });
          
          console.log(`Successfully generated and saved ${savedCount} questions for ${quiz.title}`);
        })
        .catch(async (error) => {
          console.error("Error in background question generation:", error);
          
          // Update job as failed
          await storage.updateGenerationJob(job.id, {
            status: 'failed',
            error: error.message || 'Unknown error',
            completedAt: new Date(),
          });
        });

    } catch (error) {
      console.error("Error generating questions:", error);
      res.status(500).json({ message: "Failed to generate questions" });
    }
  });

  // Admin - Get generation job status
  app.get('/api/admin/generation-jobs/:jobId', isAdmin, async (req, res) => {
    try {
      const { jobId } = req.params;
      const job = await storage.getGenerationJobById(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      res.json(job);
    } catch (error) {
      console.error("Error fetching generation job:", error);
      res.status(500).json({ message: "Failed to fetch generation job" });
    }
  });

  // Admin - Get all generation jobs for a quiz
  app.get('/api/admin/quizzes/:quizId/generation-jobs', isAdmin, async (req, res) => {
    try {
      const { quizId } = req.params;
      const jobs = await storage.getGenerationJobsByQuizId(quizId);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching generation jobs:", error);
      res.status(500).json({ message: "Failed to fetch generation jobs" });
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

  // Generate TTS audio for question explanation
  app.post('/api/admin/questions/:id/generate-audio', isAdmin, aiGenerationLimiter, async (req, res) => {
    try {
      const { id } = req.params;
      const { language = 'it' } = req.body;
      
      // Get the question
      const question = await storage.getQuestionById(id);
      if (!question || !question.explanation) {
        return res.status(404).json({ message: "Question or explanation not found" });
      }

      // Initialize OpenAI
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      // Choose voice based on language
      const voiceMap: { [key: string]: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' } = {
        it: 'nova',   // Italian - female voice
        en: 'alloy',  // English - neutral voice
        es: 'shimmer' // Spanish - female voice
      };
      
      const voice = voiceMap[language] || 'alloy';

      // Generate TTS audio
      const mp3Response = await openai.audio.speech.create({
        model: "tts-1",
        voice: voice,
        input: question.explanation,
        speed: 1.0,
      });

      // Convert response to buffer
      const buffer = Buffer.from(await mp3Response.arrayBuffer());
      
      // Save audio file
      const filename = `${id}-${language}.mp3`;
      const filepath = path.join(process.cwd(), 'public', 'audio-explanations', filename);
      await fs.promises.writeFile(filepath, buffer);
      
      // Update question with audio URL
      const audioUrl = `/audio-explanations/${filename}`;
      await storage.updateQuestion(id, { explanationAudioUrl: audioUrl });
      
      res.json({ 
        message: "Audio generated successfully",
        audioUrl 
      });
    } catch (error) {
      console.error("Error generating audio:", error);
      res.status(500).json({ message: "Failed to generate audio" });
    }
  });

  // Generate extended TTS audio explanation (amplified version)
  app.post('/api/questions/:id/extended-audio', isAuthenticated, aiGenerationLimiter, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { language = 'it', userAnswer, isCorrect, isFirstAudio = false } = req.body;
      
      // Get user's first name from either Replit OIDC or local auth
      const userId = req.user?.claims?.sub || req.user?.id;
      const user = userId ? await storage.getUser(userId) : null;
      const userName = user?.firstName || req.user?.claims?.first_name || 'studente';
      
      // Use name ALWAYS on first audio invocation, never after
      const useUserName = isFirstAudio;
      
      console.log(`[Extended Audio] Starting generation for question ${id}, language: ${language}, isCorrect: ${isCorrect}`);
      
      // Get the question from database
      const question = await storage.getQuestionById(id);
      if (!question || !question.explanation) {
        console.log(`[Extended Audio] Question or explanation not found for ${id}`);
        return res.status(404).json({ message: "Question or explanation not found" });
      }

      console.log(`[Extended Audio] Question found: ${question.question}`);
      
      // Normalize options (handle multiple formats)
      const normalizeOptions = (opts: any[]): Array<{label: string; text: string; isCorrect?: boolean}> => {
        return opts.map((opt, index) => {
          const label = String.fromCharCode(65 + index); // A, B, C, D...
          
          if (typeof opt === 'string') {
            return { label, text: opt, isCorrect: false };
          }
          
          if (typeof opt === 'object' && opt !== null) {
            const text = opt.text || opt.label || opt.id || String(opt);
            return {
              label: opt.label || opt.id || label,
              text,
              isCorrect: opt.isCorrect || false
            };
          }
          
          return { label, text: String(opt), isCorrect: false };
        });
      };
      
      const normalizedOptions = normalizeOptions(question.options as any[]);
      
      // Find the correct option from database
      const correctOption = normalizedOptions.find((opt) => 
        opt.isCorrect || opt.label?.toLowerCase() === question.correctAnswer?.toLowerCase()
      );
      
      if (!correctOption) {
        console.error(`[Extended Audio] Could not find correct answer in options`);
        return res.status(500).json({ message: "Question data incomplete" });
      }
      
      console.log(`[Extended Audio] Correct answer: ${correctOption.text}`);
      
      // Initialize OpenAI
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      // Create personalized explanation based on whether user answered correctly
      const greeting = useUserName ? userName : '';
      
      const promptMap: { [key: string]: string } = isCorrect ? {
        // CORRECT ANSWER - Congratulate and explain why it's right
        it: `Sei un formatore esperto. L'utente ${greeting ? greeting + ' ' : ''}ha risposto CORRETTAMENTE a questa domanda:

Domanda: ${question.question}
Risposta corretta: ${correctOption.label}) ${correctOption.text}

Spiegazione base: ${question.explanation}

Genera una spiegazione vocale incoraggiante di 2-3 frasi complete che:
1. ${greeting ? `Inizia con "Bravo ${greeting}!" o "Ottimo ${greeting}!"` : 'Inizia con "Bravo!" o "Risposta corretta!"'}
2. Conferma che ha risposto bene
3. Approfondisce perché "${correctOption.text}" è la risposta giusta

Usa un tono positivo e pedagogico. IMPORTANTE: Termina con un punto. Solo italiano.

Spiegazione vocale:`,
        en: `You are an expert trainer. The user ${greeting ? greeting + ' ' : ''}answered this question CORRECTLY:

Question: ${question.question}
Correct answer: ${correctOption.label}) ${correctOption.text}

Base explanation: ${question.explanation}

Generate an encouraging 2-3 complete sentence audio explanation that:
1. ${greeting ? `Starts with "Great job ${greeting}!" or "Well done ${greeting}!"` : 'Starts with "Correct!" or "Well done!"'}
2. Confirms they answered correctly
3. Explains in depth why "${correctOption.text}" is the right answer

Use a positive and pedagogical tone. IMPORTANT: End with a period. English only.

Audio explanation:`,
        es: `Eres un formador experto. El usuario ${greeting ? greeting + ' ' : ''}respondió CORRECTAMENTE esta pregunta:

Pregunta: ${question.question}
Respuesta correcta: ${correctOption.label}) ${correctOption.text}

Explicación base: ${question.explanation}

Genera una explicación de audio alentadora de 2-3 frases completas que:
1. ${greeting ? `Comienza con "¡Muy bien ${greeting}!" o "¡Excelente ${greeting}!"` : 'Comienza con "¡Correcto!" o "¡Muy bien!"'}
2. Confirma que respondió correctamente
3. Explica en profundidad por qué "${correctOption.text}" es la respuesta correcta

Usa un tono positivo y pedagógico. IMPORTANTE: Termina con un punto. Solo español.

Explicación de audio:`
      } : {
        // WRONG ANSWER - Indicate correct answer and explain
        it: `Sei un formatore esperto. L'utente ${greeting ? greeting + ' ' : ''}ha risposto SBAGLIATO a questa domanda:

Domanda: ${question.question}
Risposta corretta: ${correctOption.label}) ${correctOption.text}

Spiegazione base: ${question.explanation}

Genera una spiegazione vocale costruttiva di 2-3 frasi complete che:
1. ${greeting ? `Inizia con "${greeting}, la risposta corretta è la ${correctOption.label}."` : 'Inizia con "La risposta corretta è la ' + correctOption.label + '."'}
2. Spiega perché "${correctOption.text}" è la risposta giusta
3. Aiuta a comprendere il concetto

Usa un tono pedagogico e costruttivo (NON punitivo). IMPORTANTE: Termina con un punto. Solo italiano.

Spiegazione vocale:`,
        en: `You are an expert trainer. The user ${greeting ? greeting + ' ' : ''}answered this question INCORRECTLY:

Question: ${question.question}
Correct answer: ${correctOption.label}) ${correctOption.text}

Base explanation: ${question.explanation}

Generate a constructive 2-3 complete sentence audio explanation that:
1. ${greeting ? `Starts with "${greeting}, the correct answer is ${correctOption.label}."` : 'Starts with "The correct answer is ' + correctOption.label + '."'}
2. Explains why "${correctOption.text}" is the right answer
3. Helps understand the concept

Use a pedagogical and constructive tone (NOT punitive). IMPORTANT: End with a period. English only.

Audio explanation:`,
        es: `Eres un formador experto. El usuario ${greeting ? greeting + ' ' : ''}respondió INCORRECTAMENTE esta pregunta:

Pregunta: ${question.question}
Respuesta correcta: ${correctOption.label}) ${correctOption.text}

Explicación base: ${question.explanation}

Genera una explicación de audio constructiva de 2-3 frases completas que:
1. ${greeting ? `Comienza con "${greeting}, la respuesta correcta es la ${correctOption.label}."` : 'Comienza con "La respuesta correcta es la ' + correctOption.label + '."'}
2. Explica por qué "${correctOption.text}" es la respuesta correcta
3. Ayuda a comprender el concepto

Usa un tono pedagógico y constructivo (NO punitivo). IMPORTANTE: Termina con un punto. Solo español.

Explicación de audio:`
      };
      
      const prompt = promptMap[language] || promptMap['en'];
      
      console.log(`[Extended Audio] Generating extended explanation with GPT-4o-mini...`);
      const gptStartTime = Date.now();
      
      // Generate extended explanation using gpt-4o-mini for faster response (up to ~30 seconds of audio)
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 120, // Allow longer explanations with complete sentences, ~30 seconds of audio
      });
      
      const gptDuration = Date.now() - gptStartTime;
      console.log(`[Extended Audio] GPT completed in ${gptDuration}ms`);
      
      const extendedExplanation = completion.choices[0]?.message?.content || question.explanation;
      console.log(`[Extended Audio] Extended explanation length: ${extendedExplanation.length}`);
      
      // Choose voice based on language
      const voiceMap: { [key: string]: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' } = {
        it: 'nova',   // Italian - female voice
        en: 'alloy',  // English - neutral voice
        es: 'shimmer' // Spanish - female voice
      };
      
      const voice = voiceMap[language] || 'alloy';

      console.log(`[Extended Audio] Generating TTS with voice: ${voice}...`);
      const ttsStartTime = Date.now();
      
      // Generate TTS audio from extended explanation
      const mp3Response = await openai.audio.speech.create({
        model: "tts-1",
        voice: voice,
        input: extendedExplanation,
        speed: 1.0,
      });

      const ttsDuration = Date.now() - ttsStartTime;
      console.log(`[Extended Audio] TTS completed in ${ttsDuration}ms`);

      // Convert response to buffer
      const buffer = Buffer.from(await mp3Response.arrayBuffer());
      
      console.log(`[Extended Audio] Total generation time: ${Date.now() - gptStartTime}ms, buffer size: ${buffer.length} bytes`);
      
      // Return audio directly as response
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    } catch (error: any) {
      console.error("[Extended Audio] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
        response: error.response?.data
      });
      res.status(500).json({ 
        message: "Failed to generate extended audio",
        error: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
