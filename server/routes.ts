import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, type WebSocket } from "ws";
import Stripe from "stripe";
import OpenAI from "openai";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createRequire } from "module";
import { storage } from "./storage";
import { db } from "./db";
import { liveCourseSessions, liveCourses, liveStreamingSessions } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { getApiKey, clearApiKeyCache } from "./config";
import { setupAuth, isAuthenticated, isAdmin } from "./authSetup";
import { clearOpenAIInstance } from "./aiQuestionGenerator";
import { generateScenario, generateScenarioResponse } from "./aiScenarioGenerator";
import { analyzePreventionDocument, generateTriageResponse, generateCrosswordPuzzle, generateAssessmentQuestions, extractTextFromMedicalReport, anonymizeMedicalText, generateGeminiContent } from "./gemini";
import { clearBrevoInstance } from "./email";
import { 
  insertUserQuizAttemptSchema, 
  insertContentPageSchema, 
  updateContentPageSchema,
  insertOnDemandCourseSchema,
  insertCourseVideoSchema,
  insertVideoQuestionSchema,
  insertCourseQuestionSchema,
  updateOnDemandCourseSchema,
  updateCourseVideoSchema,
  updateVideoQuestionSchema,
  updateCourseQuestionSchema,
  insertCorporateAgreementSchema,
  insertPreventionDocumentSchema,
  insertTriageSessionSchema,
  insertProhmedCodeSchema,
  insertCrosswordPuzzleSchema,
  insertPreventionAssessmentSchema,
  insertPreventionAssessmentQuestionSchema,
  insertPreventionUserResponseSchema
} from "@shared/schema";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import passport from "passport";
import { sendPasswordResetEmail, sendWelcomeEmail, sendVerificationCodeEmail, sendCorporateInviteEmail, sendPremiumUpgradeEmail, sendTemplateEmail } from "./email";
import { z } from "zod";
import { generateQuizReport, generateInsightDiscoveryReport } from "./reportGenerator";
import { generateAssessmentPDFBuffer } from "./assessmentPDFGenerator";
import DOMPurify from "isomorphic-dompurify";
import { 
  authLimiter, 
  registrationLimiter, 
  passwordResetLimiter, 
  aiGenerationLimiter 
} from "./rateLimits";
import { registerGamificationRoutes } from "./gamificationRoutes";
import { processQuizCompletion } from "./gamification";

// pdf-parse (CommonJS module) - use createRequire for compatibility
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// Stripe instance - initialized lazily to support database-stored keys
let stripeInstance: Stripe | null = null;

async function getStripe(): Promise<Stripe> {
  if (stripeInstance) {
    return stripeInstance;
  }

  const stripeKey = await getApiKey('STRIPE_SECRET_KEY');
  if (!stripeKey) {
    throw new Error('Stripe secret key not configured. Please add STRIPE_SECRET_KEY in the Admin API panel or environment variables.');
  }

  stripeInstance = new Stripe(stripeKey);
  return stripeInstance;
}

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

// Configure multer for profile images
const profileImageDir = path.join(process.cwd(), 'public', 'profile-images');
if (!fs.existsSync(profileImageDir)) {
  fs.mkdirSync(profileImageDir, { recursive: true });
}

const profileImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profileImageDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadProfileImage = multer({
  storage: profileImageStorage,
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

// Configure multer for medical reports (PDF + images)
const medicalReportsDir = path.join(process.cwd(), 'public', 'medical-reports');
if (!fs.existsSync(medicalReportsDir)) {
  fs.mkdirSync(medicalReportsDir, { recursive: true });
}

const medicalReportStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, medicalReportsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'medical-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadMedicalReport = multer({
  storage: medicalReportStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for medical reports
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /pdf|jpeg|jpg|png/;
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const allowedMimetypes = /application\/pdf|image\/jpeg|image\/jpg|image\/png/;
    const mimetype = allowedMimetypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF and images (JPEG, JPG, PNG) are allowed for medical reports!'));
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

// Calculate readiness score for certification (0-100)
function calculateReadinessScore(
  analytics: {
    totalAttempts: number;
    averageScore: number;
    bestScore: number;
    recentScores: number[];
  },
  benchmark: {
    averageScore: number;
    totalAttempts: number;
  }
): number {
  // Factors that contribute to readiness:
  // 1. Performance (50%): average score
  // 2. Consistency (25%): standard deviation of recent scores
  // 3. Volume (15%): number of attempts
  // 4. Trend (10%): improvement over time

  // Performance score (0-50)
  const performanceScore = (analytics.averageScore / 100) * 50;

  // Consistency score (0-25): Lower std dev = higher score
  const stdDev = analytics.recentScores.length > 1
    ? Math.sqrt(
        analytics.recentScores.reduce((sum, score) => 
          sum + Math.pow(score - analytics.averageScore, 2), 0
        ) / analytics.recentScores.length
      )
    : 0;
  const consistencyScore = Math.max(0, 25 - (stdDev / 4));

  // Volume score (0-15): More practice = better readiness
  const volumeScore = Math.min(15, (analytics.totalAttempts / 20) * 15);

  // Trend score (0-10): Recent scores better than average = positive trend
  const recentAvg = analytics.recentScores.slice(0, 5).reduce((a, b) => a + b, 0) / Math.min(5, analytics.recentScores.length);
  const trendScore = recentAvg > analytics.averageScore ? 10 : 5;

  const totalScore = performanceScore + consistencyScore + volumeScore + trendScore;

  // Bonus: If performing above benchmark, add up to 10 points
  const benchmarkBonus = analytics.averageScore > benchmark.averageScore
    ? Math.min(10, ((analytics.averageScore - benchmark.averageScore) / 10))
    : 0;

  return Math.min(100, Math.round(totalScore + benchmarkBonus));
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
        promoCode,
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

      // Check for corporate agreement based on email domain
      const emailDomain = '@' + email.toLowerCase().split('@')[1];
      let corporateAgreement = await storage.getCorporateAgreementByEmailDomain(emailDomain);
      
      // If no email domain match and promo code provided, check promo code
      if (!corporateAgreement && promoCode) {
        corporateAgreement = await storage.getCorporateAgreementByPromoCode(promoCode.toUpperCase());
      }
      
      let subscriptionTier = 'free';
      let isPremium = false;
      let companyName = company || null;
      let corporateAgreementId = null;
      let agreementReserved = false;

      // If corporate agreement exists and is active, try to reserve a slot atomically
      if (corporateAgreement && corporateAgreement.isActive) {
        const reserved = await storage.incrementCorporateAgreementUsers(corporateAgreement.id);
        
        if (reserved) {
          // Successfully reserved a slot - assign premium access
          subscriptionTier = corporateAgreement.tier;
          isPremium = true;
          companyName = corporateAgreement.companyName;
          corporateAgreementId = corporateAgreement.id;
          agreementReserved = true;
        }
        // If reservation failed (maxUsers reached), user will be created as free tier
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Generate 6-digit verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
      
      let user;
      try {
        user = await storage.createUser({
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
          emailVerified: false,
          verificationCode,
          verificationCodeExpires,
          subscriptionTier,
          isPremium,
          companyName,
          corporateAgreementId,
        });
      } catch (error) {
        // If user creation failed but we reserved a slot, release it
        if (agreementReserved && corporateAgreementId) {
          await storage.decrementCorporateAgreementUsers(corporateAgreementId);
        }
        throw error;
      }

      // Send verification code email (async, don't block response)
      sendVerificationCodeEmail(user.email, verificationCode, user.firstName || undefined).catch(err => 
        console.error("Failed to send verification code email:", err)
      );

      // Return success response without auto-login (user must verify email first)
      res.json({ 
        success: true,
        message: "Registrazione completata! Controlla la tua email per il codice di verifica.",
        email: user.email,
        requiresVerification: true
      });
    } catch (error) {
      console.error("Error during registration:", error);
      res.status(500).json({ message: "Errore durante la registrazione" });
    }
  });

  // Verify email with code
  app.post('/api/auth/verify-email', authLimiter, async (req, res) => {
    try {
      // Validate request body
      const verifySchema = z.object({
        email: z.string().email("Email non valida"),
        code: z.string().length(6, "Il codice deve essere di 6 cifre").regex(/^\d+$/, "Il codice deve contenere solo numeri"),
      });

      const validation = verifySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: validation.error.errors[0].message });
      }

      const { email, code } = validation.data;
      const user = await storage.getUserByEmail(email.toLowerCase());
      if (!user) {
        return res.status(404).json({ message: "Utente non trovato" });
      }

      if (user.emailVerified) {
        return res.status(400).json({ message: "Email già verificata" });
      }

      if (!user.verificationCode || !user.verificationCodeExpires) {
        return res.status(400).json({ message: "Nessun codice di verifica trovato. Richiedi un nuovo codice." });
      }

      // Check if code is expired
      if (new Date() > user.verificationCodeExpires) {
        return res.status(400).json({ message: "Il codice di verifica è scaduto. Richiedi un nuovo codice." });
      }

      // Check if code matches
      if (user.verificationCode !== code) {
        return res.status(400).json({ message: "Codice di verifica non valido" });
      }

      // Verify email and clear verification code
      await storage.updateUser(user.id, {
        emailVerified: true,
        verificationCode: null,
        verificationCodeExpires: null,
      });

      // Send welcome email after successful verification
      sendWelcomeEmail(user.email, user.firstName || undefined).catch(err => 
        console.error("Failed to send welcome email:", err)
      );

      // Auto-login user after verification
      const verifiedUser = await storage.getUser(user.id);
      req.login(verifiedUser!, (err) => {
        if (err) {
          return res.status(500).json({ message: "Verifica completata ma errore durante il login" });
        }
        res.json({ 
          success: true, 
          message: "Email verificata con successo!",
          user: verifiedUser
        });
      });
    } catch (error) {
      console.error("Error verifying email:", error);
      res.status(500).json({ message: "Errore durante la verifica dell'email" });
    }
  });

  // Resend verification code
  app.post('/api/auth/resend-verification', authLimiter, async (req, res) => {
    try {
      // Validate request body
      const resendSchema = z.object({
        email: z.string().email("Email non valida"),
      });

      const validation = resendSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: validation.error.errors[0].message });
      }

      const { email } = validation.data;
      const user = await storage.getUserByEmail(email.toLowerCase());
      if (!user) {
        return res.status(404).json({ message: "Utente non trovato" });
      }

      if (user.emailVerified) {
        return res.status(400).json({ message: "Email già verificata" });
      }

      // Generate new verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

      // Update user with new code
      await storage.updateUser(user.id, {
        verificationCode,
        verificationCodeExpires,
      });

      // Send new verification code email
      sendVerificationCodeEmail(user.email, verificationCode, user.firstName || undefined).catch(err => 
        console.error("Failed to send verification code email:", err)
      );

      res.json({ 
        success: true, 
        message: "Nuovo codice di verifica inviato! Controlla la tua email." 
      });
    } catch (error) {
      console.error("Error resending verification code:", error);
      res.status(500).json({ message: "Errore durante l'invio del codice" });
    }
  });

  app.post('/api/auth/login', (req, res, next) => {
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

  // Test-only authentication endpoint (only available in development and test)
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    app.post('/api/auth/test-login', async (req, res) => {
      try {
        const { email } = req.body;
        if (!email) {
          return res.status(400).json({ message: "Email is required" });
        }

        const user = await storage.getUserByEmail(email.toLowerCase());
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Log the user in by setting up the session
        req.login(user, (err) => {
          if (err) {
            return res.status(500).json({ message: "Login failed" });
          }
          const { password, passwordResetToken, verificationCode, ...safeUser } = user;
          res.json({ user: safeUser });
        });
      } catch (error) {
        console.error("Test login error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });
  }

  app.post('/api/auth/forgot-password', passwordResetLimiter, async (req, res) => {
    try {
      const { email } = req.body;
      console.log('[FORGOT-PASSWORD] Request received for email:', email);

      if (!email) {
        return res.status(400).json({ message: "Email obbligatoria" });
      }

      const user = await storage.getUserByEmail(email.toLowerCase());
      
      if (!user) {
        console.log('[FORGOT-PASSWORD] User not found for email:', email);
        return res.json({ message: "Se l'email esiste, riceverai le istruzioni per il reset" });
      }

      // Check if user registered with Google OAuth
      if (user.authProvider === 'google') {
        console.log('[FORGOT-PASSWORD] User registered with Google, cannot reset password');
        return res.status(400).json({ 
          message: "Questo account è stato creato con Google. Accedi usando il pulsante 'Continua con Google'." 
        });
      }

      console.log('[FORGOT-PASSWORD] User found, generating reset token...');
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour

      await storage.setPasswordResetToken(user.id, resetToken, resetExpires);
      console.log('[FORGOT-PASSWORD] Reset token saved to database');

      console.log('[FORGOT-PASSWORD] Sending password reset email to:', user.email);
      await sendPasswordResetEmail(user.email, resetToken);
      console.log('[FORGOT-PASSWORD] Password reset email sent successfully!');

      res.json({ message: "Se l'email esiste, riceverai le istruzioni per il reset" });
    } catch (error) {
      console.error("[FORGOT-PASSWORD] Error during forgot password:", error);
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

  app.get('/api/categories-with-quizzes', async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const categoriesWithQuizzes = await storage.getCategoriesWithQuizzes(userId);
      res.json(categoriesWithQuizzes);
    } catch (error) {
      console.error("Error fetching categories with quizzes:", error);
      res.status(500).json({ message: "Failed to fetch categories with quizzes" });
    }
  });

  app.get('/api/categories/:categoryId/quizzes', async (req: any, res) => {
    try {
      const { categoryId } = req.params;
      const userId = req.user?.claims?.sub || req.user?.id;
      const quizzes = await storage.getQuizzesByCategory(categoryId, userId);
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
        
        // Process gamification rewards (points, badges, achievements)
        console.log('[Quiz Submission] Processing gamification rewards...');
        try {
          const gamificationResults = await processQuizCompletion(
            userId, 
            attempt, 
            quiz.duration, 
            quiz.difficulty
          );
          console.log('[Quiz Submission] Gamification results:', {
            pointsEarned: gamificationResults.pointsEarned,
            creditsEarned: gamificationResults.creditsEarned,
            newLevel: gamificationResults.newLevel,
            newBadges: gamificationResults.newBadges.length,
            newAchievements: gamificationResults.newAchievements.length,
            streakData: gamificationResults.streakData,
          });
          
          // Include credits and points in response
          console.log('[Quiz Submission] Sending response to client');
          return res.json({ 
            ...attempt, 
            creditsEarned: gamificationResults.creditsEarned, 
            pointsEarned: gamificationResults.pointsEarned 
          });
        } catch (gamificationError) {
          console.error('[Quiz Submission] Error processing gamification:', gamificationError);
          // Don't fail the quiz submission if gamification fails
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

  // Get user token usage (GET /api/user/token-usage) - Shows monthly token limits
  app.get('/api/user/token-usage', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get or create token usage for current month
      const tokenUsage = await storage.getOrCreateTokenUsage(userId);

      // Define token limits based on subscription tier
      const TOKEN_LIMITS = {
        free: 30,
        premium: 1000, // High limit for premium
        premium_plus: -1, // Unlimited (-1 means no limit)
      };

      const userTier = user.subscriptionTier || 'free';
      const limit = TOKEN_LIMITS[userTier as keyof typeof TOKEN_LIMITS] || TOKEN_LIMITS.free;

      res.json({
        tokensUsed: tokenUsage.tokensUsed,
        tokenLimit: limit,
        messageCount: tokenUsage.messageCount,
        tier: userTier,
        hasUnlimitedTokens: limit === -1,
        tokensRemaining: limit === -1 ? -1 : Math.max(0, limit - tokenUsage.tokensUsed),
      });
    } catch (error) {
      console.error("Error fetching token usage:", error);
      res.status(500).json({ message: "Failed to fetch token usage" });
    }
  });

  // Analytics endpoints
  app.get('/api/analytics/category/:categoryId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const { categoryId } = req.params;

      const analytics = await storage.getUserAnalyticsByCategory(userId, categoryId);
      
      // Get benchmark data (always retrieve, even when no attempts)
      const benchmark = await storage.getCategoryBenchmark(categoryId);

      if (!analytics) {
        // Return default values with benchmark and 0 readiness score
        return res.json({
          totalAttempts: 0,
          averageScore: 0,
          bestScore: 0,
          recentScores: [],
          timeSpent: 0,
          weakTopics: [],
          strongTopics: [],
          readinessScore: 0,
          benchmark,
        });
      }

      // Calculate readiness score (0-100)
      const readinessScore = calculateReadinessScore(analytics, benchmark);

      res.json({
        ...analytics,
        readinessScore,
        benchmark,
      });
    } catch (error) {
      console.error("Error fetching category analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get('/api/analytics/performance-trend', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const days = parseInt(req.query.days as string) || 30;

      const trend = await storage.getUserPerformanceTrend(userId, days);
      res.json(trend);
    } catch (error) {
      console.error("Error fetching performance trend:", error);
      res.status(500).json({ message: "Failed to fetch performance trend" });
    }
  });

  app.get('/api/analytics/overall', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;

      // Get all categories
      const categories = await storage.getCategories();

      // Get analytics for each category
      const categoryAnalytics = await Promise.all(
        categories.map(async (category) => {
          const analytics = await storage.getUserAnalyticsByCategory(userId, category.id);
          const benchmark = await storage.getCategoryBenchmark(category.id);
          
          return {
            categoryId: category.id,
            categoryName: category.name,
            analytics,
            readinessScore: analytics ? calculateReadinessScore(analytics, benchmark) : 0,
          };
        })
      );

      res.json(categoryAnalytics);
    } catch (error) {
      console.error("Error fetching overall analytics:", error);
      res.status(500).json({ message: "Failed to fetch overall analytics" });
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
      const apiKey = await getApiKey('OPENAI_API_KEY');
      if (!apiKey) {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }
      const openai = new OpenAI({ apiKey });
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
    const { tier } = req.body;
    let user = await storage.getUser(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.stripeSubscriptionId) {
      const subscription = await (await getStripe()).subscriptions.retrieve(user.stripeSubscriptionId);
      
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
        const customer = await (await getStripe()).customers.create({
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        });
        customerId = customer.id;
      }

      // Determine amount and tier based on request
      const selectedTier = tier === 'premium_plus' ? 'premium_plus' : 'premium';
      const amount = selectedTier === 'premium_plus' ? 14900 : 9900; // €149 or €99 in cents

      // Create a one-time payment intent
      const paymentIntent = await (await getStripe()).paymentIntents.create({
        amount,
        currency: 'eur',
        customer: customerId,
        metadata: {
          userId: userId,
          type: 'subscription',
          tier: selectedTier,
        },
      });

      // Update user with Stripe customer ID
      await storage.updateUserStripeInfo(userId, customerId);
  
      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        tier: selectedTier,
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
      const paymentIntent = await (await getStripe()).paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded' && paymentIntent.metadata.userId === userId) {
        // Update user to the appropriate tier
        const tier = paymentIntent.metadata.tier || 'premium';
        await storage.updateUserStripeInfo(userId, paymentIntent.customer as string, tier);
        
        // Get updated user and send premium upgrade email
        const user = await storage.getUser(userId);
        if (user && user.email) {
          sendPremiumUpgradeEmail(user.email, user.firstName || undefined, tier).catch(err => 
            console.error("Failed to send premium upgrade email:", err)
          );
        }
        
        res.json({ success: true, message: `${tier === 'premium_plus' ? 'Premium Plus' : 'Premium'} access activated` });
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

  // Admin - Export users to CSV
  app.get('/api/admin/users/export/csv', isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Define CSV headers (all user fields from registration)
      const headers = [
        'ID', 'Email', 'First Name', 'Last Name', 'Date of Birth', 'Gender', 
        'Phone', 'Profession', 'Education', 'Company',
        'Address Street', 'Address City', 'Address Postal Code', 'Address Province', 'Address Country',
        'Newsletter Consent', 'Auth Provider', 'Email Verified', 'Is Premium', 'Subscription Tier',
        'Is Admin', 'Language', 'Total Points', 'Level', 'Current Streak', 'Longest Streak',
        'Credits', 'Company Name', 'Coupon Code', 'Stripe Customer ID', 'Stripe Subscription ID',
        'Created At', 'Updated At'
      ];
      
      // Convert users to CSV rows
      const csvRows = users.map(user => [
        user.id,
        user.email,
        user.firstName || '',
        user.lastName || '',
        user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
        user.gender || '',
        user.phone || '',
        user.profession || '',
        user.education || '',
        user.company || '',
        user.addressStreet || '',
        user.addressCity || '',
        user.addressPostalCode || '',
        user.addressProvince || '',
        user.addressCountry || '',
        user.newsletterConsent ? 'Yes' : 'No',
        user.authProvider || 'local',
        user.emailVerified ? 'Yes' : 'No',
        user.isPremium ? 'Yes' : 'No',
        user.subscriptionTier || 'free',
        user.isAdmin ? 'Yes' : 'No',
        user.language || '',
        user.totalPoints || 0,
        user.level || 1,
        user.currentStreak || 0,
        user.longestStreak || 0,
        user.credits || 0,
        user.companyName || '',
        user.couponCode || '',
        user.stripeCustomerId || '',
        user.stripeSubscriptionId || '',
        user.createdAt ? new Date(user.createdAt).toISOString() : '',
        user.updatedAt ? new Date(user.updatedAt).toISOString() : ''
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','));
      
      // Combine headers and rows
      const csv = [headers.join(','), ...csvRows].join('\n');
      
      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="users_export_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send('\uFEFF' + csv); // UTF-8 BOM for Excel compatibility
    } catch (error) {
      console.error("Error exporting users:", error);
      res.status(500).json({ message: "Failed to export users" });
    }
  });

  // Admin - Import users from CSV
  app.post('/api/admin/users/import/csv', isAdmin, async (req, res) => {
    try {
      const { csvData } = req.body;
      
      if (!csvData || !csvData.trim()) {
        return res.status(400).json({ message: "CSV data is required" });
      }
      
      // Parse CSV
      const lines = csvData.trim().split('\n');
      if (lines.length < 2) {
        return res.status(400).json({ message: "CSV must contain headers and at least one data row" });
      }
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const imported = [];
      const errors = [];
      
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].match(/("([^"]|"")*"|[^,]+)/g)?.map(v => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"')) || [];
          
          if (values.length === 0) continue; // Skip empty lines
          
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          
          // Check if user already exists
          const existingUser = await storage.getUserByEmail(row.Email?.toLowerCase());
          if (existingUser) {
            errors.push({ row: i + 1, email: row.Email, error: 'User already exists' });
            continue;
          }
          
          // Create user with default password (should be changed on first login)
          const hashedPassword = await bcrypt.hash('ChangeMe123!', 10);
          
          const newUser = await storage.createUser({
            email: row.Email?.toLowerCase(),
            password: hashedPassword,
            firstName: row['First Name'],
            lastName: row['Last Name'],
            dateOfBirth: row['Date of Birth'] ? new Date(row['Date of Birth']) : undefined,
            gender: row.Gender,
            phone: row.Phone,
            profession: row.Profession,
            education: row.Education,
            company: row.Company,
            addressStreet: row['Address Street'],
            addressCity: row['Address City'],
            addressPostalCode: row['Address Postal Code'],
            addressProvince: row['Address Province'],
            addressCountry: row['Address Country'],
            newsletterConsent: row['Newsletter Consent']?.toLowerCase() === 'yes',
            emailVerified: row['Email Verified']?.toLowerCase() === 'yes',
            isPremium: row['Is Premium']?.toLowerCase() === 'yes',
            subscriptionTier: row['Subscription Tier'] || 'free',
            isAdmin: row['Is Admin']?.toLowerCase() === 'yes',
            language: row.Language,
            companyName: row['Company Name'],
            couponCode: row['Coupon Code'],
            authProvider: 'local',
          });
          
          imported.push(newUser.email);
        } catch (rowError: any) {
          errors.push({ row: i + 1, error: rowError.message });
        }
      }
      
      res.json({
        success: true,
        imported: imported.length,
        errors: errors.length,
        importedUsers: imported,
        errorDetails: errors
      });
    } catch (error) {
      console.error("Error importing users:", error);
      res.status(500).json({ message: "Failed to import users" });
    }
  });

  // Admin - Get analytics/metrics
  app.get('/api/admin/analytics', isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const now = new Date();
      
      // Calculate date ranges
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      
      // Onboarding metrics
      const totalUsers = users.length;
      const newUsersLast7Days = users.filter(u => new Date(u.createdAt) >= last7Days).length;
      const newUsersLast30Days = users.filter(u => new Date(u.createdAt) >= last30Days).length;
      const newUsersThisMonth = users.filter(u => new Date(u.createdAt) >= thisMonth).length;
      const newUsersLastMonth = users.filter(u => {
        const created = new Date(u.createdAt);
        return created >= lastMonth && created <= lastMonthEnd;
      }).length;
      
      // Premium/subscription metrics
      const premiumUsers = users.filter(u => u.isPremium).length;
      const freeUsers = totalUsers - premiumUsers;
      const conversionRate = totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(2) : '0.00';
      
      // Subscription tier breakdown
      const tierBreakdown = users.reduce((acc: any, user) => {
        const tier = user.subscriptionTier || 'free';
        acc[tier] = (acc[tier] || 0) + 1;
        return acc;
      }, {});
      
      // Coupon usage
      const usersWithCoupon = users.filter(u => u.couponCode && u.couponCode.trim() !== '').length;
      const couponBreakdown = users.reduce((acc: any, user) => {
        if (user.couponCode && user.couponCode.trim() !== '') {
          acc[user.couponCode] = (acc[user.couponCode] || 0) + 1;
        }
        return acc;
      }, {});
      
      // Revenue estimation (based on subscription tiers)
      // Assuming premium = €90/year, premium_plus = €149/year
      const estimatedAnnualRevenue = users.reduce((total, user) => {
        if (user.subscriptionTier === 'premium') return total + 90;
        if (user.subscriptionTier === 'premium_plus') return total + 149;
        return total;
      }, 0);
      
      const estimatedMonthlyRevenue = (estimatedAnnualRevenue / 12).toFixed(2);
      
      // Email verification status
      const verifiedUsers = users.filter(u => u.emailVerified).length;
      const unverifiedUsers = totalUsers - verifiedUsers;
      
      // Auth provider breakdown
      const authProviderBreakdown = users.reduce((acc: any, user) => {
        const provider = user.authProvider || 'local';
        acc[provider] = (acc[provider] || 0) + 1;
        return acc;
      }, {});
      
      // Gamification stats
      const totalPoints = users.reduce((sum, u) => sum + (u.totalPoints || 0), 0);
      const avgPoints = totalUsers > 0 ? (totalPoints / totalUsers).toFixed(0) : '0';
      const activeUsers = users.filter(u => (u.totalPoints || 0) > 0).length;
      
      // Newsletter subscribers
      const newsletterSubscribers = users.filter(u => u.newsletterConsent).length;
      
      res.json({
        onboarding: {
          totalUsers,
          newUsersLast7Days,
          newUsersLast30Days,
          newUsersThisMonth,
          newUsersLastMonth,
          growth: newUsersLastMonth > 0 
            ? (((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100).toFixed(1) + '%'
            : 'N/A'
        },
        revenue: {
          estimatedAnnualRevenue,
          estimatedMonthlyRevenue,
          premiumUsers,
          freeUsers,
          conversionRate: conversionRate + '%',
          tierBreakdown
        },
        coupons: {
          usersWithCoupon,
          totalUsers,
          couponUsageRate: totalUsers > 0 ? ((usersWithCoupon / totalUsers) * 100).toFixed(2) + '%' : '0%',
          couponBreakdown
        },
        verification: {
          verifiedUsers,
          unverifiedUsers,
          verificationRate: totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(2) + '%' : '0%'
        },
        authProviders: authProviderBreakdown,
        engagement: {
          totalPoints,
          avgPoints,
          activeUsers,
          activityRate: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(2) + '%' : '0%'
        },
        newsletter: {
          subscribers: newsletterSubscribers,
          subscriptionRate: totalUsers > 0 ? ((newsletterSubscribers / totalUsers) * 100).toFixed(2) + '%' : '0%'
        }
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Admin - Send prevention invite email
  app.post('/api/admin/send-prevention-invite', isAdmin, async (req, res) => {
    try {
      const { email, firstName } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email è obbligatoria" });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Formato email non valido" });
      }

      const { sendPreventionInviteEmail } = await import("./email");
      await sendPreventionInviteEmail(email, firstName);

      res.json({
        message: `Invito alla prevenzione inviato con successo a ${email}`,
        email,
      });
    } catch (error) {
      console.error("Error sending prevention invite:", error);
      res.status(500).json({ message: "Errore durante l'invio dell'invito" });
    }
  });

  // Admin - Send marketing email to newsletter subscribers
  app.post('/api/admin/send-marketing-email', isAdmin, async (req, res) => {
    try {
      const { subject, htmlContent, textContent, targetFilters } = req.body;

      if (!subject || !htmlContent) {
        return res.status(400).json({ message: "Subject e contenuto HTML sono obbligatori" });
      }

      // Get all users with newsletter consent
      const users = await storage.getAllUsers();
      let filtered = users.filter(user => user.newsletterConsent);

      // Apply target filters if provided
      if (targetFilters) {
        // Filter by profession
        if (targetFilters.profession && targetFilters.profession.length > 0) {
          filtered = filtered.filter(u => 
            targetFilters.profession.includes(u.profession)
          );
        }
        
        // Filter by subscription tier
        if (targetFilters.subscriptionTier && targetFilters.subscriptionTier.length > 0) {
          filtered = filtered.filter(u => 
            targetFilters.subscriptionTier.includes(u.subscriptionTier)
          );
        }
        
        // Filter by language
        if (targetFilters.language && targetFilters.language.length > 0) {
          filtered = filtered.filter(u => 
            targetFilters.language.includes(u.language)
          );
        }
        
        // Filter by premium status
        if (targetFilters.isPremium !== undefined) {
          filtered = filtered.filter(u => u.isPremium === targetFilters.isPremium);
        }
      }

      if (filtered.length === 0) {
        return res.json({ 
          message: "Nessun utente trovato con i filtri specificati", 
          sent: 0, 
          failed: 0 
        });
      }

      // Personalize content for each user
      console.log(`[Marketing] Personalizing email for ${filtered.length} users`);
      if (htmlContent) {
        console.log(`[Marketing] Template contains placeholders:`, {
          hasFirstName: htmlContent.includes('{{firstName}}'),
          hasLastName: htmlContent.includes('{{lastName}}'),
          hasProfession: htmlContent.includes('{{profession}}')
        });
      }
      
      const recipients = filtered.map(user => {
        let personalizedHtml = htmlContent;
        let personalizedText = textContent || '';
        
        // Replace placeholders with user data
        personalizedHtml = personalizedHtml.replace(/\{\{firstName\}\}/g, user.firstName || 'Cliente');
        personalizedHtml = personalizedHtml.replace(/\{\{lastName\}\}/g, user.lastName || '');
        personalizedHtml = personalizedHtml.replace(/\{\{profession\}\}/g, user.profession || '');
        
        personalizedText = personalizedText.replace(/\{\{firstName\}\}/g, user.firstName || 'Cliente');
        personalizedText = personalizedText.replace(/\{\{lastName\}\}/g, user.lastName || '');
        personalizedText = personalizedText.replace(/\{\{profession\}\}/g, user.profession || '');
        
        console.log(`[Marketing] Personalized for ${user.email}:`, {
          hasPlaceholders: personalizedHtml.includes('{{'),
          firstName: user.firstName,
          profession: user.profession
        });
        
        return {
          email: user.email,
          firstName: user.firstName || undefined,
          htmlContent: personalizedHtml,
          textContent: personalizedText
        };
      });

      const { sendBulkMarketingEmail } = await import("./email");
      const result = await sendBulkMarketingEmail(
        recipients,
        subject
      );

      res.json({
        message: `Email marketing inviata a ${result.sent} utenti (target: ${filtered.length})`,
        ...result,
        totalSubscribers: filtered.length
      });
    } catch (error) {
      console.error("Error sending marketing email:", error);
      res.status(500).json({ message: "Errore durante l'invio delle email" });
    }
  });


  // Get target audience preview (apply filters)
  app.post('/api/admin/marketing/preview-audience', isAdmin, async (req, res) => {
    try {
      const { targetFilters } = req.body;
      
      const users = await storage.getAllUsers();
      let filtered = users.filter(u => u.newsletterConsent);
      
      if (targetFilters) {
        // Apply subscription tier filter
        if (targetFilters.subscriptionTier && targetFilters.subscriptionTier.length > 0) {
          filtered = filtered.filter(u => targetFilters.subscriptionTier.includes(u.subscriptionTier));
        }
        
        // Apply profession filter
        if (targetFilters.profession && targetFilters.profession.length > 0) {
          filtered = filtered.filter(u => u.profession && targetFilters.profession.includes(u.profession));
        }
        
        // Apply language filter
        if (targetFilters.language && targetFilters.language.length > 0) {
          filtered = filtered.filter(u => u.language && targetFilters.language.includes(u.language));
        }
        
        // Apply coupon filter
        if (targetFilters.couponCode && targetFilters.couponCode.length > 0) {
          filtered = filtered.filter(u => u.couponCode && targetFilters.couponCode.includes(u.couponCode));
        }
        
        // Apply premium filter
        if (targetFilters.isPremium !== undefined) {
          filtered = filtered.filter(u => u.isPremium === targetFilters.isPremium);
        }
      }
      
      res.json({
        count: filtered.length,
        users: filtered.slice(0, 50).map(u => ({
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          profession: u.profession,
          subscriptionTier: u.subscriptionTier
        }))
      });
    } catch (error) {
      console.error("Error previewing audience:", error);
      res.status(500).json({ message: "Failed to preview audience" });
    }
  });

  // AI Email Generator - Generate email with course recommendations
  app.post('/api/admin/marketing/ai-generate', isAdmin, async (req, res) => {
    try {
      const { profession, purpose, tone } = req.body;
      
      // Get relevant courses/categories (admin override for full visibility)
      const categories = await storage.getCategories();
      const quizzes = await storage.getAllQuizzes(undefined, true);
      
      // Build course context for AI
      const courseContext = {
        categories: categories.map((c: any) => ({ name: c.name, description: c.description })),
        quizzes: quizzes.map((q: any) => ({ 
          title: q.title, 
          description: q.description,
          difficulty: q.difficulty
        }))
      };
      
      // Get OpenAI instance
      const apiKey = await getApiKey('OPENAI_API_KEY');
      if (!apiKey) {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }
      const openai = new OpenAI({ apiKey });
      
      const prompt = `Crea un'email marketing professionale in italiano per CIRY.

TARGET: ${profession || 'Tutti i professionisti'}
SCOPO: ${purpose || 'Promozione corsi'}
TONO: ${tone || 'Professionale e coinvolgente'}

CORSI DISPONIBILI:
${JSON.stringify(courseContext, null, 2)}

ISTRUZIONI:
1. Scrivi un'email HTML accattivante e professionale
2. Suggerisci i corsi/certificazioni più rilevanti per ${profession || 'il target'}
3. IMPORTANTE: Usa questi placeholder per personalizzazione (saranno sostituiti con dati reali):
   - {{firstName}} per il nome
   - {{lastName}} per il cognome  
   - {{profession}} per la professione dell'utente
4. Includi un chiaro call-to-action
5. Mantieni un tono ${tone || 'professionale'}
6. Evidenzia i benefici specifici per la loro professione
7. Formato HTML con stile inline (no CSS esterni)
8. OBBLIGATORIO: Includi sempre un header/logo all'inizio dell'email con il testo "CIRY" in stile professionale e visibile (es. con testo grande, grassetto, colori brand come blu scuro/arancione)

STRUTTURA RICHIESTA:
- Oggetto email (max 60 caratteri)
- Corpo email in HTML con sezioni: 
  * HEADER con logo/branding "CIRY" (testo stilizzato professionale con background o bordo elegante)
  * Saluto personalizzato con {{firstName}}
  * Introduzione value proposition menzionando {{profession}} se rilevante
  * Corsi raccomandati con descrizione e benefici
  * Call to action chiaro
  * Firma

ESEMPIO HEADER HTML:
<div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; text-align: center; margin-bottom: 30px;">
  <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 1px;">CIRY</h1>
  <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 14px;">Formazione Professionale per l'Eccellenza</p>
</div>

ESEMPIO USO PLACEHOLDER:
"Ciao {{firstName}}, come {{profession}} sappiamo quanto sia importante..."

Restituisci SOLO un JSON con:
{
  "subject": "Oggetto email",
  "htmlContent": "HTML dell'email con HEADER LOGO obbligatorio + placeholder {{firstName}}, {{lastName}}, {{profession}}",
  "textContent": "Versione testo con placeholder",
  "recommendedCourses": ["Nome corso 1", "Nome corso 2"]
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "Sei un esperto email marketer per piattaforme di formazione professionale. Crei email coinvolgenti, personalizzate e ad alto tasso di conversione." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });
      
      const result = JSON.parse(completion.choices[0].message.content || "{}");
      res.json(result);
    } catch (error) {
      console.error("Error generating AI email:", error);
      res.status(500).json({ message: "Failed to generate email" });
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

  // Admin - Generate crossword puzzle for quiz (Gaming feature)
  app.post('/api/admin/quizzes/:quizId/generate-crossword', isAdmin, async (req, res) => {
    try {
      const user = req.user as any;
      const { quizId } = req.params;
      const { solutionsCount, difficulty } = req.body;

      // Get quiz details
      const quiz = await storage.getQuizById(quizId);
      if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found' });
      }

      // Use quiz difficulty if not provided
      const crosswordDifficulty = difficulty || quiz.difficulty;
      
      // Map quiz difficulty to crossword difficulty format
      let difficultyLevel: 'easy' | 'medium' | 'hard' = 'medium';
      if (crosswordDifficulty === 'beginner') difficultyLevel = 'easy';
      else if (crosswordDifficulty === 'intermediate') difficultyLevel = 'medium';
      else if (['advanced', 'expert'].includes(crosswordDifficulty)) difficultyLevel = 'hard';

      // Generate crossword with Gemini AI using quiz title as topic
      const crosswordData = await generateCrosswordPuzzle(quiz.title, difficultyLevel);

      // Create crossword puzzle linked to the quiz
      const puzzle = await storage.createCrosswordPuzzle({
        quizId,
        title: `${quiz.title} - Cruciverba`,
        topic: quiz.title,
        difficulty: difficultyLevel,
        cluesData: crosswordData.clues,
        gridData: crosswordData.grid,
        isWeeklyChallenge: false,
        weekNumber: null,
        weekYear: null,
        createdById: user.id,
        isActive: true,
      });

      // Update quiz to enable gaming and set solutions count
      await storage.updateQuiz(quizId, {
        gamingEnabled: true,
        crosswordSolutionsCount: solutionsCount || crosswordData.clues.length,
      });

      res.json({ puzzle, quiz: { ...quiz, gamingEnabled: true, crosswordSolutionsCount: solutionsCount || crosswordData.clues.length } });
    } catch (error: any) {
      console.error('Generate quiz crossword error:', error);
      res.status(500).json({ message: error.message || 'Failed to generate crossword for quiz' });
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

  // User - Upload profile image
  app.post('/api/user/upload-profile-image', isAuthenticated, uploadProfileImage.single('image'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const imageUrl = `/profile-images/${req.file.filename}`;
      
      // Update user's profile image URL
      await storage.updateUser(userId, {
        profileImageUrl: imageUrl
      });

      res.json({ url: imageUrl, filename: req.file.filename });
    } catch (error) {
      console.error("Error uploading profile image:", error);
      // Clean up file on error
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: "Failed to upload profile image" });
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
      const courses = await storage.getAllLiveCourses(undefined, true);
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

  // Admin - Get all active streaming sessions
  app.get('/api/admin/active-streaming-sessions', isAdmin, async (req, res) => {
    try {
      const activeSessions = await db
        .select()
        .from(liveStreamingSessions)
        .where(eq(liveStreamingSessions.isActive, true))
        .orderBy(desc(liveStreamingSessions.createdAt));
      
      res.json(activeSessions);
    } catch (error) {
      console.error("Error fetching active streaming sessions:", error);
      res.status(500).json({ message: "Failed to fetch active sessions" });
    }
  });

  // Admin - Get all live course sessions with course details
  app.get('/api/admin/live-course-sessions', isAdmin, async (req, res) => {
    try {
      const sessions = await db
        .select({
          id: liveCourseSessions.id,
          liveCourseId: liveCourseSessions.courseId,
          startDate: liveCourseSessions.startDate,
          endDate: liveCourseSessions.endDate,
          capacity: liveCourseSessions.capacity,
          enrolled: liveCourseSessions.enrolled,
          status: liveCourseSessions.status,
          course: {
            title: liveCourses.title
          }
        })
        .from(liveCourseSessions)
        .leftJoin(liveCourses, eq(liveCourseSessions.courseId, liveCourses.id))
        .orderBy(desc(liveCourseSessions.startDate));
      
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching all sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.post('/api/admin/live-courses/:courseId/sessions', isAdmin, async (req, res) => {
    try {
      const { courseId } = req.params;
      const { startDate, endDate, ...rest } = req.body;
      
      const session = await storage.createLiveCourseSession({
        ...rest,
        courseId,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
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
      const { startDate, endDate, ...rest } = req.body;
      
      const updates: any = { ...rest };
      if (startDate) updates.startDate = new Date(startDate);
      if (endDate) updates.endDate = new Date(endDate);
      
      const session = await storage.updateLiveCourseSession(id, updates);
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
          const customer = await (await getStripe()).customers.create({
            email: user.email || undefined,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          });
          customerId = customer.id;
          await storage.updateUserStripeCustomer(userId, customerId);
        }

        // Create payment intent for live course
        const paymentIntent = await (await getStripe()).paymentIntents.create({
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
      const paymentIntent = await (await getStripe()).paymentIntents.retrieve(paymentIntentId);
      
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

  // Get live course session details
  app.get('/api/live-course-sessions/:sessionId', isAuthenticated, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getSessionById(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Get course details
      const course = await storage.getLiveCourseById(session.courseId);
      
      res.json({
        ...session,
        course
      });
    } catch (error) {
      console.error("Error fetching session:", error);
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });

  // Check if user is enrolled in a live course session
  app.get('/api/live-courses/check-enrollment/:sessionId', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.claims?.sub || req.user?.id;

      const session = await storage.getSessionById(sessionId);
      if (!session) {
        return res.json(false);
      }

      const enrollment = await storage.getLiveCourseEnrollment(session.courseId, userId);
      res.json(!!enrollment || req.user?.isAdmin);
    } catch (error) {
      console.error("Error checking enrollment:", error);
      res.status(500).json({ message: "Failed to check enrollment" });
    }
  });

  // Get chat history for streaming session
  app.get('/api/live-streaming/chat/:streamingSessionId', isAuthenticated, async (req: any, res) => {
    try {
      const { streamingSessionId } = req.params;
      const userId = req.user?.claims?.sub || req.user?.id;

      // Verify streaming session exists
      const streamingSession = await storage.getLiveStreamingSessionById(streamingSessionId);
      if (!streamingSession) {
        return res.status(404).json({ message: "Streaming session not found" });
      }

      // Verify user enrollment in the live course
      const liveCourseSession = await storage.getSessionById(streamingSession.sessionId);
      if (!liveCourseSession) {
        return res.status(404).json({ message: "Live course session not found" });
      }

      const enrollment = await storage.getLiveCourseEnrollment(liveCourseSession.courseId, userId);
      if (!enrollment && !req.user?.isAdmin) {
        return res.status(403).json({ message: "You must be enrolled to view chat" });
      }

      const messages = await storage.getStreamingMessages(streamingSessionId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat:", error);
      res.status(500).json({ message: "Failed to fetch chat" });
    }
  });

  // Send chat message in streaming session
  app.post('/api/live-streaming/chat/send', isAuthenticated, async (req: any, res) => {
    try {
      const { streamingSessionId, message } = req.body;
      const userId = req.user?.claims?.sub || req.user?.id;

      if (!message || message.trim().length === 0) {
        return res.status(400).json({ message: "Message cannot be empty" });
      }

      // Verify streaming session exists and user is enrolled
      const streamingSession = await storage.getLiveStreamingSessionById(streamingSessionId);
      if (!streamingSession) {
        return res.status(404).json({ message: "Streaming session not found" });
      }

      const liveCourseSession = await storage.getSessionById(streamingSession.sessionId);
      if (!liveCourseSession) {
        return res.status(404).json({ message: "Live course session not found" });
      }

      const enrollment = await storage.getLiveCourseEnrollment(liveCourseSession.courseId, userId);
      if (!enrollment && !req.user?.isAdmin) {
        return res.status(403).json({ message: "You must be enrolled to send messages" });
      }

      // Create message
      const chatMessage = await storage.createStreamingMessage({
        streamingSessionId,
        userId,
        message: message.trim()
      });

      // Broadcast to all connected clients
      broadcastToSession(streamingSession.sessionId, {
        type: 'chat',
        message: chatMessage
      });

      res.json(chatMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Get active polls for streaming session
  app.get('/api/live-streaming/polls/:streamingSessionId', isAuthenticated, async (req: any, res) => {
    try {
      const { streamingSessionId } = req.params;
      const userId = req.user?.claims?.sub || req.user?.id;

      const polls = await storage.getActivePolls(streamingSessionId);
      
      // Enrich polls with stats and user responses
      const pollsWithData = await Promise.all(polls.map(async (poll) => {
        const stats = await storage.getPollStats(poll.id);
        const userResponse = await storage.getUserPollResponse(poll.id, userId);
        
        return {
          ...poll,
          responses: stats,
          totalVotes: stats.reduce((sum, r) => sum + r.count, 0),
          userResponse: userResponse?.selectedOption
        };
      }));

      res.json(pollsWithData);
    } catch (error) {
      console.error("Error fetching polls:", error);
      res.status(500).json({ message: "Failed to fetch polls" });
    }
  });

  // Vote on a poll
  app.post('/api/live-streaming/poll/vote', isAuthenticated, async (req: any, res) => {
    try {
      const { pollId, option } = req.body;
      const userId = req.user?.claims?.sub || req.user?.id;

      if (!option) {
        return res.status(400).json({ message: "Option is required" });
      }

      // Check if user already voted
      const existingResponse = await storage.getUserPollResponse(pollId, userId);
      if (existingResponse) {
        return res.status(400).json({ message: "You have already voted on this poll" });
      }

      // Create response
      await storage.createPollResponse({
        pollId,
        userId,
        selectedOption: option
      });

      // Get updated stats and broadcast
      const poll = await storage.getLiveStreamingPollById(pollId);
      if (poll) {
        const stats = await storage.getPollStats(pollId);
        const streamingSession = await storage.getLiveStreamingSessionById(poll.streamingSessionId);
        
        if (streamingSession) {
          broadcastToSession(streamingSession.sessionId, {
            type: 'poll_updated',
            poll,
            stats
          });
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error voting on poll:", error);
      res.status(500).json({ message: "Failed to vote on poll" });
    }
  });

  // ====================
  // ON-DEMAND COURSES
  // ====================

  // Admin - On-Demand Courses CRUD
  app.get('/api/admin/on-demand-courses', isAdmin, async (req, res) => {
    try {
      const courses = await storage.getAllOnDemandCourses(true, undefined, true); // Include inactive courses, admin override
      res.json(courses);
    } catch (error) {
      console.error("Error fetching on-demand courses:", error);
      res.status(500).json({ message: "Failed to fetch on-demand courses" });
    }
  });

  app.post('/api/admin/on-demand-courses', isAdmin, async (req, res) => {
    try {
      const validatedData = insertOnDemandCourseSchema.parse(req.body);
      const course = await storage.createOnDemandCourse(validatedData);
      res.json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating on-demand course:", error);
      res.status(500).json({ message: "Failed to create on-demand course" });
    }
  });

  app.put('/api/admin/on-demand-courses/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const existing = await storage.getOnDemandCourseById(id);
      if (!existing) {
        return res.status(404).json({ message: "Course not found" });
      }
      const validatedData = updateOnDemandCourseSchema.parse(req.body);
      const course = await storage.updateOnDemandCourse(id, validatedData);
      res.json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error updating on-demand course:", error);
      res.status(500).json({ message: "Failed to update on-demand course" });
    }
  });

  app.delete('/api/admin/on-demand-courses/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const existing = await storage.getOnDemandCourseById(id);
      if (!existing) {
        return res.status(404).json({ message: "Course not found" });
      }
      await storage.deleteOnDemandCourse(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting on-demand course:", error);
      res.status(500).json({ message: "Failed to delete on-demand course" });
    }
  });

  // Admin - Course Videos CRUD
  app.get('/api/admin/on-demand-courses/:courseId/videos', isAdmin, async (req, res) => {
    try {
      const { courseId } = req.params;
      const videos = await storage.getVideosByCourseId(courseId);
      res.json(videos);
    } catch (error) {
      console.error("Error fetching course videos:", error);
      res.status(500).json({ message: "Failed to fetch course videos" });
    }
  });

  app.post('/api/admin/on-demand-courses/:courseId/videos', isAdmin, async (req, res) => {
    try {
      const { courseId } = req.params;
      const validatedData = insertCourseVideoSchema.parse({
        ...req.body,
        courseId
      });
      const video = await storage.createCourseVideo(validatedData);
      res.json(video);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating course video:", error);
      res.status(500).json({ message: "Failed to create course video" });
    }
  });

  app.put('/api/admin/course-videos/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const existing = await storage.getCourseVideoById(id);
      if (!existing) {
        return res.status(404).json({ message: "Video not found" });
      }
      const validatedData = updateCourseVideoSchema.parse(req.body);
      const video = await storage.updateCourseVideo(id, validatedData);
      res.json(video);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error updating course video:", error);
      res.status(500).json({ message: "Failed to update course video" });
    }
  });

  app.delete('/api/admin/course-videos/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const existing = await storage.getCourseVideoById(id);
      if (!existing) {
        return res.status(404).json({ message: "Video not found" });
      }
      await storage.deleteCourseVideo(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting course video:", error);
      res.status(500).json({ message: "Failed to delete course video" });
    }
  });

  // Admin - Video Questions CRUD
  app.get('/api/admin/course-videos/:videoId/questions', isAdmin, async (req, res) => {
    try {
      const { videoId } = req.params;
      const questions = await storage.getQuestionsByVideoId(videoId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching video questions:", error);
      res.status(500).json({ message: "Failed to fetch video questions" });
    }
  });

  app.post('/api/admin/course-videos/:videoId/questions', isAdmin, async (req, res) => {
    try {
      const { videoId } = req.params;
      const validatedData = insertVideoQuestionSchema.parse({
        ...req.body,
        videoId
      });
      const question = await storage.createVideoQuestion(validatedData);
      res.json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating video question:", error);
      res.status(500).json({ message: "Failed to create video question" });
    }
  });

  app.put('/api/admin/video-questions/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateVideoQuestionSchema.parse(req.body);
      const question = await storage.updateVideoQuestion(id, validatedData);
      res.json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error updating video question:", error);
      res.status(500).json({ message: "Failed to update video question" });
    }
  });

  app.delete('/api/admin/video-questions/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      // Note: No getVideoQuestionById method exists - questions are fetched by video ID  
      // If needed, add defensive delete handling in storage layer
      await storage.deleteVideoQuestion(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting video question:", error);
      res.status(500).json({ message: "Failed to delete video question" });
    }
  });

  // Admin - Course Questions CRUD (at course level, not video level)
  app.get('/api/admin/on-demand-courses/:courseId/questions', isAdmin, async (req, res) => {
    try {
      const { courseId } = req.params;
      const questions = await storage.getQuestionsByCourseId(courseId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching course questions:", error);
      res.status(500).json({ message: "Failed to fetch course questions" });
    }
  });

  app.post('/api/admin/on-demand-courses/:courseId/questions', isAdmin, async (req, res) => {
    try {
      const { courseId } = req.params;
      const validatedData = insertCourseQuestionSchema.parse({
        ...req.body,
        courseId
      });
      const question = await storage.createCourseQuestion(validatedData);
      res.json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating course question:", error);
      res.status(500).json({ message: "Failed to create course question" });
    }
  });

  app.put('/api/admin/course-questions/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateCourseQuestionSchema.parse(req.body);
      const question = await storage.updateCourseQuestion(id, validatedData);
      res.json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error updating course question:", error);
      res.status(500).json({ message: "Failed to update course question" });
    }
  });

  app.delete('/api/admin/course-questions/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCourseQuestion(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting course question:", error);
      res.status(500).json({ message: "Failed to delete course question" });
    }
  });

  // Public - Get all on-demand courses (Premium Plus users only)
  app.get('/api/on-demand-courses', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const userId = user?.claims?.sub || user?.id;
      const dbUser = await storage.getUserById(userId);
      
      // Check if user has Premium Plus subscription
      if (dbUser?.subscriptionTier !== 'premium_plus') {
        return res.status(403).json({ message: "Premium Plus subscription required" });
      }

      const courses = await storage.getAllOnDemandCourses(false, userId);
      res.json(courses);
    } catch (error) {
      console.error("Error fetching on-demand courses:", error);
      res.status(500).json({ message: "Failed to fetch on-demand courses" });
    }
  });

  // Public - Get single on-demand course with videos
  app.get('/api/on-demand-courses/:courseId', isAuthenticated, async (req: any, res) => {
    try {
      const { courseId } = req.params;
      const user = req.user;
      const userId = user?.claims?.sub || user?.id;
      const dbUser = await storage.getUserById(userId);
      
      // Check if user has Premium Plus subscription
      if (dbUser?.subscriptionTier !== 'premium_plus') {
        return res.status(403).json({ message: "Premium Plus subscription required" });
      }

      const course = await storage.getOnDemandCourseById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      const videos = await storage.getVideosByCourseId(courseId);
      const progress = await storage.getUserVideoProgress(userId, courseId);
      
      res.json({ course, videos, progress });
    } catch (error) {
      console.error("Error fetching on-demand course:", error);
      res.status(500).json({ message: "Failed to fetch on-demand course" });
    }
  });

  // Public - Get video with questions
  app.get('/api/course-videos/:videoId', isAuthenticated, async (req: any, res) => {
    try {
      const { videoId } = req.params;
      const user = req.user;
      const userId = user?.claims?.sub || user?.id;
      const dbUser = await storage.getUserById(userId);
      
      // Check if user has Premium Plus subscription
      if (dbUser?.subscriptionTier !== 'premium_plus') {
        return res.status(403).json({ message: "Premium Plus subscription required" });
      }

      const video = await storage.getCourseVideoById(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      const questions = await storage.getQuestionsByVideoId(videoId);
      res.json({ video, questions });
    } catch (error) {
      console.error("Error fetching video:", error);
      res.status(500).json({ message: "Failed to fetch video" });
    }
  });

  // Public - Submit video quiz and update progress
  app.post('/api/course-videos/:videoId/submit-quiz', isAuthenticated, async (req: any, res) => {
    try {
      const { videoId } = req.params;
      const { answers } = req.body; // Array of {questionId, answer}
      const user = req.user;
      const userId = user?.claims?.sub || user?.id;

      const video = await storage.getCourseVideoById(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      const questions = await storage.getQuestionsByVideoId(videoId);
      
      // Check answers
      let correct = 0;
      for (const answer of answers) {
        const question = questions.find(q => q.id === answer.questionId);
        if (question && question.correctAnswer === answer.answer) {
          correct++;
        }
      }

      const passed = correct === questions.length; // All correct to pass
      
      // Update progress
      await storage.upsertUserVideoProgress({
        userId,
        courseId: video.courseId,
        videoId,
        completed: passed,
        quizPassed: passed,
        watchedSeconds: 0
      });

      res.json({ passed, correct, total: questions.length });
    } catch (error) {
      console.error("Error submitting video quiz:", error);
      res.status(500).json({ message: "Failed to submit video quiz" });
    }
  });

  // Public - Update video watch progress
  app.post('/api/course-videos/:videoId/progress', isAuthenticated, async (req: any, res) => {
    try {
      const { videoId } = req.params;
      const { watchedSeconds } = req.body;
      const user = req.user;
      const userId = user?.claims?.sub || user?.id;

      const video = await storage.getCourseVideoById(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      await storage.upsertUserVideoProgress({
        userId,
        courseId: video.courseId,
        videoId,
        watchedSeconds
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating video progress:", error);
      res.status(500).json({ message: "Failed to update video progress" });
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
  <title>Report Quiz - CIRY</title>
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
    <h1>🎓 CIRY</h1>
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
    <p>Report generato da CIRY - Piattaforma #1 per Certificazioni Professionali</p>
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

  // Corporate agreements management
  app.get('/api/admin/corporate-agreements', isAdmin, async (req, res) => {
    try {
      const agreements = await storage.getAllCorporateAgreements();
      res.json(agreements);
    } catch (error) {
      console.error("Error fetching corporate agreements:", error);
      res.status(500).json({ message: "Failed to fetch corporate agreements" });
    }
  });

  app.post('/api/admin/corporate-agreements', isAdmin, async (req, res) => {
    try {
      const { adminEmail, ...rest } = req.body;
      let adminUserId = null;

      // Se è fornita un'email admin, cerchiamo o creiamo l'utente
      if (adminEmail && adminEmail.trim()) {
        const existingUser = await storage.getUserByEmail(adminEmail.trim());
        
        if (existingUser) {
          // Utente già esiste, usiamo il suo ID
          adminUserId = existingUser.id;
        } else {
          // Creiamo un nuovo utente admin aziendale
          const bcrypt = await import('bcryptjs');
          const tempPassword = Math.random().toString(36).slice(-12); // Password temporanea
          const hashedPassword = await bcrypt.hash(tempPassword, 10);
          
          const newUser = await storage.createUser({
            email: adminEmail.trim(),
            password: hashedPassword,
            firstName: rest.companyName || 'Admin',
            lastName: 'Corporate',
            isPremium: true, // Admin corporate ha accesso premium
            emailVerified: false, // Dovrà verificare l'email
            totalPoints: 0,
            level: 1,
            credits: 0,
            language: 'it'
          });
          
          adminUserId = newUser.id;
          
          // TODO: Inviare email con credenziali temporanee
          console.log(`Created corporate admin user: ${adminEmail} with temp password: ${tempPassword}`);
        }
      }

      const validated = insertCorporateAgreementSchema.parse({
        ...rest,
        adminUserId
      });
      
      const agreement = await storage.createCorporateAgreement(validated);
      res.json(agreement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating corporate agreement:", error);
      res.status(500).json({ message: "Failed to create corporate agreement" });
    }
  });

  app.patch('/api/admin/corporate-agreements/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const agreement = await storage.updateCorporateAgreement(id, req.body);
      res.json(agreement);
    } catch (error) {
      console.error("Error updating corporate agreement:", error);
      res.status(500).json({ message: "Failed to update corporate agreement" });
    }
  });

  app.delete('/api/admin/corporate-agreements/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCorporateAgreement(id);
      res.json({ message: "Corporate agreement deleted successfully" });
    } catch (error) {
      console.error("Error deleting corporate agreement:", error);
      res.status(500).json({ message: "Failed to delete corporate agreement" });
    }
  });

  app.get('/api/admin/corporate-agreements/:id/users', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const users = await storage.getUsersByCorporateAgreement(id);
      res.json(users);
    } catch (error) {
      console.error("Error fetching corporate agreement users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Settings management (API Keys and configuration)
  app.get('/api/admin/settings', isAdmin, async (req, res) => {
    try {
      const settings = await storage.getAllSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.post('/api/admin/settings', isAdmin, async (req, res) => {
    try {
      const { subscriptionPrice, currency } = req.body;
      
      // Save both settings
      await storage.upsertSetting('subscriptionPrice', subscriptionPrice.toString(), 'Annual subscription price', 'billing');
      await storage.upsertSetting('currency', currency, 'Subscription currency', 'billing');
      
      res.json({ 
        success: true,
        subscriptionPrice,
        currency
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      res.status(500).json({ message: "Failed to save settings" });
    }
  });

  app.put('/api/admin/settings/:key', isAdmin, async (req, res) => {
    try {
      const { key } = req.params;
      const { value, description, category } = req.body;
      const setting = await storage.upsertSetting(key, value, description, category);
      
      // Clear cache for this key and reset service instances
      clearApiKeyCache(key);
      
      // Reset service instances to use new credentials
      if (key === 'STRIPE_SECRET_KEY') {
        stripeInstance = null;
        console.log('[Config] Stripe instance reset after key update');
      }
      if (key === 'OPENAI_API_KEY') {
        clearOpenAIInstance();
        console.log('[Config] OpenAI instance reset after key update');
      }
      if (key === 'BREVO_API_KEY' || key === 'BREVO_SENDER_EMAIL') {
        clearBrevoInstance();
        console.log('[Config] Brevo instance reset after key update');
      }
      
      res.json(setting);
    } catch (error) {
      console.error("Error upserting setting:", error);
      res.status(500).json({ message: "Failed to save setting" });
    }
  });

  app.delete('/api/admin/settings/:key', isAdmin, async (req, res) => {
    try {
      const { key } = req.params;
      await storage.deleteSetting(key);
      
      // Clear cache for this key and reset service instances
      clearApiKeyCache(key);
      
      // Reset service instances when keys are deleted
      if (key === 'STRIPE_SECRET_KEY') {
        stripeInstance = null;
        console.log('[Config] Stripe instance reset after key deletion');
      }
      if (key === 'OPENAI_API_KEY') {
        clearOpenAIInstance();
        console.log('[Config] OpenAI instance reset after key deletion');
      }
      if (key === 'BREVO_API_KEY' || key === 'BREVO_SENDER_EMAIL') {
        clearBrevoInstance();
        console.log('[Config] Brevo instance reset after key deletion');
      }
      
      res.json({ message: "Setting deleted successfully" });
    } catch (error) {
      console.error("Error deleting setting:", error);
      res.status(500).json({ message: "Failed to delete setting" });
    }
  });

  // Subscription plans management routes
  app.get('/api/admin/subscription-plans', isAdmin, async (req, res) => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const plans = await storage.getAllSubscriptionPlans(includeInactive);
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  app.post('/api/admin/subscription-plans', isAdmin, async (req, res) => {
    try {
      const plan = await storage.createSubscriptionPlan(req.body);
      res.json(plan);
    } catch (error) {
      console.error("Error creating subscription plan:", error);
      res.status(500).json({ message: "Failed to create subscription plan" });
    }
  });

  app.post('/api/admin/subscription-plans/format-description', isAdmin, async (req, res) => {
    try {
      const { description } = req.body;
      
      if (!description || !description.trim()) {
        return res.status(400).json({ message: "Description is required" });
      }

      const apiKey = await getApiKey('OPENAI_API_KEY');
      if (!apiKey) {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }
      const openai = new OpenAI({ apiKey });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Sei un assistente che formatta descrizioni di piani di abbonamento. Ricevi una descrizione testuale di servizi inclusi in un piano abbonamento e la trasformi in una lista ordinata di punti chiari e concisi. Ogni punto deve essere una frase breve che descrive una singola funzionalità o servizio."
          },
          {
            role: "user",
            content: `Formatta questa descrizione in una lista di punti (array di stringhe). Ogni punto deve essere chiaro e conciso:\n\n${description}`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "formatted_features",
            schema: {
              type: "object",
              properties: {
                features: {
                  type: "array",
                  items: { type: "string" },
                  description: "Lista di funzionalità formattate"
                }
              },
              required: ["features"],
              additionalProperties: false
            },
            strict: true
          }
        }
      });

      const result = JSON.parse(completion.choices[0].message.content || '{"features": []}');
      res.json({ features: result.features });
    } catch (error) {
      console.error("Error formatting description:", error);
      res.status(500).json({ message: "Failed to format description" });
    }
  });

  app.patch('/api/admin/subscription-plans/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const plan = await storage.updateSubscriptionPlan(id, req.body);
      res.json(plan);
    } catch (error) {
      console.error("Error updating subscription plan:", error);
      res.status(500).json({ message: "Failed to update subscription plan" });
    }
  });

  app.delete('/api/admin/subscription-plans/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSubscriptionPlan(id);
      res.json({ message: "Subscription plan deleted successfully" });
    } catch (error) {
      console.error("Error deleting subscription plan:", error);
      res.status(500).json({ message: "Failed to delete subscription plan" });
    }
  });

  // Email template management routes
  app.get('/api/admin/email-templates', isAdmin, async (req, res) => {
    try {
      const templates = await storage.getAllEmailTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching email templates:", error);
      res.status(500).json({ message: "Failed to fetch email templates" });
    }
  });

  app.get('/api/admin/email-templates/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const template = await storage.getEmailTemplateById(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching email template:", error);
      res.status(500).json({ message: "Failed to fetch email template" });
    }
  });

  app.post('/api/admin/email-templates', isAdmin, async (req, res) => {
    try {
      const template = await storage.createEmailTemplate(req.body);
      res.json(template);
    } catch (error) {
      console.error("Error creating email template:", error);
      res.status(500).json({ message: "Failed to create email template" });
    }
  });

  app.patch('/api/admin/email-templates/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const template = await storage.updateEmailTemplate(id, req.body);
      res.json(template);
    } catch (error) {
      console.error("Error updating email template:", error);
      res.status(500).json({ message: "Failed to update email template" });
    }
  });

  app.delete('/api/admin/email-templates/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEmailTemplate(id);
      res.json({ message: "Template deleted successfully" });
    } catch (error) {
      console.error("Error deleting email template:", error);
      res.status(500).json({ message: "Failed to delete email template" });
    }
  });

  // Test send email template
  app.post('/api/admin/email-templates/:id/test', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { testEmail, variables } = req.body;
      
      const template = await storage.getEmailTemplateById(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      const { sendTemplateEmail } = await import("./email");
      await sendTemplateEmail(template.code, testEmail, variables || {});
      
      res.json({ message: "Test email sent successfully" });
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({ message: "Failed to send test email" });
    }
  });

  // Initialize default email templates
  app.post('/api/admin/email-templates/init-defaults', isAdmin, async (req, res) => {
    try {
      const defaultTemplates = [
        {
          code: 'welcome',
          name: 'Email di Benvenuto',
          subject: '🎉 Benvenuto su CIRY Academy!',
          description: 'Email inviata dopo la verifica dell\'account',
          variables: ['firstName', 'email'],
          htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
    .content { background: white; padding: 40px 30px; }
    .footer { background: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #eee; }
    .highlight { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Email Verificata!</h1>
    </div>
    <div class="content">
      <div style="font-size: 18px;">🎉 Ciao <strong>{{firstName}}</strong>,</div>
      <p>Benvenuto su <span class="highlight">CIRY</span>!</p>
      <p>La tua email è stata verificata con successo. Ora puoi accedere alla nostra piattaforma e iniziare il tuo percorso di eccellenza professionale.</p>
      <div style="background: #f0f7ff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0;"><strong>💡 Prossimi Passi:</strong></p>
        <ul style="margin: 10px 0;">
          <li>Esplora le nostre categorie di quiz</li>
          <li>Completa il tuo primo quiz di valutazione</li>
          <li>Scopri i corsi disponibili</li>
        </ul>
      </div>
      <p>Se hai domande, il nostro team è sempre disponibile.</p>
      <p style="margin-top: 30px;">A presto,<br><strong>Il Team CIRY</strong></p>
    </div>
    <div class="footer">
      <p style="color: #999; font-size: 12px;">© ${new Date().getFullYear()} CIRY. Tutti i diritti riservati.</p>
      <p style="color: #999; font-size: 11px;">Email inviata a {{email}}</p>
    </div>
  </div>
</body>
</html>`,
          textContent: `Benvenuto su CIRY Academy!\n\nCiao {{firstName}},\n\nLa tua email è stata verificata con successo. Ora puoi accedere alla piattaforma e iniziare il tuo percorso di preparazione professionale.\n\nA presto,\nIl Team CIRY`,
          isActive: true,
        },
        {
          code: 'verification',
          name: 'Codice di Verifica Email',
          subject: '🔐 Il tuo codice di verifica CIRY',
          description: 'Email con codice di verifica a 6 cifre',
          variables: ['firstName', 'verificationCode'],
          htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
    .content { background: white; padding: 40px 30px; }
    .code-box { background: #f0f7ff; border: 2px dashed #667eea; border-radius: 8px; padding: 30px; margin: 30px 0; text-align: center; }
    .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #667eea; font-family: monospace; }
    .footer { background: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Verifica la tua Email</h1>
    </div>
    <div class="content">
      <p style="font-size: 18px;">Ciao <strong>{{firstName}}</strong>,</p>
      <p>Grazie per esserti registrato su CIRY Academy!</p>
      <p>Utilizza il codice qui sotto per verificare il tuo account:</p>
      <div class="code-box">
        <div class="code">{{verificationCode}}</div>
      </div>
      <p>⏰ <strong>Importante:</strong> Questo codice è valido per 15 minuti.</p>
      <p>Se non hai richiesto questa verifica, ignora questa email.</p>
      <p style="margin-top: 30px;">A presto,<br><strong>Il Team CIRY</strong></p>
    </div>
    <div class="footer">
      <p style="color: #999; font-size: 12px;">© ${new Date().getFullYear()} CIRY.</p>
    </div>
  </div>
</body>
</html>`,
          textContent: `Verifica la tua email CIRY\n\nCiao {{firstName}},\n\nIl tuo codice di verifica è: {{verificationCode}}\n\nQuesto codice è valido per 15 minuti.\n\nIl Team CIRY`,
          isActive: true,
        },
        {
          code: 'password_reset',
          name: 'Reset Password',
          subject: '🔑 Reset della tua password CIRY',
          description: 'Email per il reset della password',
          variables: ['firstName', 'resetLink'],
          htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
    .content { background: white; padding: 40px 30px; }
    .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { background: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔑 Reset Password</h1>
    </div>
    <div class="content">
      <p style="font-size: 18px;">Ciao <strong>{{firstName}}</strong>,</p>
      <p>Hai richiesto il reset della tua password per CIRY Academy.</p>
      <p>Clicca sul pulsante qui sotto per reimpostare la tua password:</p>
      <div style="text-align: center;">
        <a href="{{resetLink}}" class="button">Reimposta Password</a>
      </div>
      <p>⏰ <strong>Importante:</strong> Questo link è valido per 1 ora.</p>
      <p>Se non hai richiesto questo reset, ignora questa email e la tua password rimarrà invariata.</p>
      <p style="margin-top: 30px;">A presto,<br><strong>Il Team CIRY</strong></p>
    </div>
    <div class="footer">
      <p style="color: #999; font-size: 12px;">© ${new Date().getFullYear()} CIRY.</p>
    </div>
  </div>
</body>
</html>`,
          textContent: `Reset Password CIRY\n\nCiao {{firstName}},\n\nHai richiesto il reset della password.\n\nClicca su questo link per reimpostare la password:\n{{resetLink}}\n\nQuesto link è valido per 1 ora.\n\nIl Team CIRY`,
          isActive: true,
        },
      ];

      const created = [];
      for (const template of defaultTemplates) {
        // Check if template already exists
        const existing = await storage.getEmailTemplateByCode(template.code);
        if (!existing) {
          const newTemplate = await storage.createEmailTemplate(template);
          created.push(newTemplate);
        }
      }

      res.json({ 
        message: `${created.length} template(s) initialized successfully`,
        templates: created
      });
    } catch (error) {
      console.error("Error initializing default templates:", error);
      res.status(500).json({ message: "Failed to initialize default templates" });
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
      const apiKey = await getApiKey('OPENAI_API_KEY');
      if (!apiKey) {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }
      const openai = new OpenAI({ apiKey });
      
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
      const apiKey = await getApiKey('OPENAI_API_KEY');
      if (!apiKey) {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }
      const openai = new OpenAI({ apiKey });
      
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

  // Sitemap.xml endpoint for SEO
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      const quizzes = await storage.getAllQuizzes(); // Only public quizzes in sitemap
      const staticPages = await storage.getAllContentPages();
      
      const baseUrl = 'https://credactive.academy';
      const now = new Date().toISOString().split('T')[0];
      
      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/home</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
      
      // Add all quiz pages
      for (const quiz of quizzes) {
        sitemap += `
  <url>
    <loc>${baseUrl}/quiz/${quiz.id}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      }
      
      // Add static content pages
      for (const page of staticPages) {
        if (page.slug) {
          sitemap += `
  <url>
    <loc>${baseUrl}/page/${page.slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
        }
      }
      
      sitemap += `
</urlset>`;
      
      res.header('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Sitemap generation error:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // ===== CORPORATE B2B ROUTES =====
  
  // Corporate registration (admin only - for creating new corporate accounts)
  app.post('/api/corporate/register', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertCorporateAgreementSchema.parse(req.body);
      
      // Server-side tier validation
      const validTiers = ['starter', 'premium', 'premium_plus', 'enterprise'];
      const tier = validatedData.tier && validTiers.includes(validatedData.tier) 
        ? validatedData.tier 
        : 'starter';
      
      // Enforce license limits per tier
      const tierLimits: Record<string, number> = {
        starter: 5,
        premium: 25,
        premium_plus: 100,
        enterprise: 500
      };
      
      const maxLicenses = tierLimits[tier];
      const licensesOwned = Math.min(validatedData.licensesOwned || 5, maxLicenses);
      
      const agreement = await storage.createCorporateAgreement({
        ...validatedData,
        tier,
        licensesOwned,
        isActive: false, // Requires admin activation
        licensesUsed: 0,
        currentUsers: 0
      });
      
      res.json(agreement);
    } catch (error: any) {
      console.error('Corporate registration error:', error);
      res.status(400).json({ 
        message: error.message || 'Failed to create corporate account' 
      });
    }
  });
  
  // Get corporate dashboard data (requires authentication)
  app.get('/api/corporate/dashboard', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Check if user is corporate admin
      const agreement = await storage.getCorporateAgreementByAdminUserId(userId);
      if (!agreement) {
        return res.status(403).json({ message: 'Not a corporate administrator' });
      }
      
      // Get team members
      const teamMembers = await storage.getUsersByCorporateAgreement(agreement.id);
      
      // Get invites
      const invites = await storage.getCorporateInvitesByAgreement(agreement.id);
      
      // Get licenses
      const licenses = await storage.getCorporateLicensesByAgreement(agreement.id);
      
      // Calculate team metrics
      const totalPoints = teamMembers.reduce((sum, member) => sum + (member.points || 0), 0);
      const avgPoints = teamMembers.length > 0 ? Math.round(totalPoints / teamMembers.length) : 0;
      
      const verifiedMembers = teamMembers.filter(m => m.isVerified).length;
      const activeMembers = teamMembers.filter(m => (m.points || 0) > 0).length;
      
      // Count quiz attempts
      const quizAttempts = await Promise.all(
        teamMembers.map(member => storage.getUserQuizAttempts(member.id))
      );
      const totalAttempts = quizAttempts.reduce((sum, attempts) => sum + attempts.length, 0);
      
      res.json({
        agreement,
        team: {
          members: teamMembers,
          total: teamMembers.length,
          verified: verifiedMembers,
          active: activeMembers,
          avgPoints
        },
        invites: {
          all: invites,
          pending: invites.filter(i => i.status === 'pending').length,
          accepted: invites.filter(i => i.status === 'accepted').length
        },
        licenses,
        metrics: {
          totalPoints,
          totalAttempts,
          utilizationRate: agreement.licensesOwned ? 
            Math.round((agreement.licensesUsed / agreement.licensesOwned) * 100) : 0
        }
      });
    } catch (error: any) {
      console.error('Corporate dashboard error:', error);
      res.status(500).json({ message: 'Failed to load dashboard data' });
    }
  });
  
  // Create corporate invite (corporate admin only)
  app.post('/api/corporate/invites', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { email, targetCourseId, targetCourseType, targetCourseName } = req.body;
      
      if (!email || !email.trim()) {
        return res.status(400).json({ message: 'Email is required' });
      }

      // Validate course-specific invite fields
      if (targetCourseType || targetCourseId || targetCourseName) {
        // If any course field is provided, all must be provided
        if (!targetCourseId || !targetCourseType || !targetCourseName) {
          return res.status(400).json({ 
            message: 'Course-specific invites require courseId, courseType, and courseName' 
          });
        }
        
        // Validate courseType
        if (targetCourseType !== 'live' && targetCourseType !== 'on_demand') {
          return res.status(400).json({ 
            message: 'Invalid course type. Must be "live" or "on_demand"' 
          });
        }
      }
      
      // Check if user is corporate admin
      const agreement = await storage.getCorporateAgreementByAdminUserId(userId);
      if (!agreement) {
        return res.status(403).json({ message: 'Not a corporate administrator' });
      }
      
      // Check available capacity including pending invites
      const pendingInvites = (await storage.getCorporateInvitesByAgreement(agreement.id))
        .filter(inv => inv.status === 'pending').length;
      
      const totalCommitted = (agreement.currentUsers || agreement.licensesUsed || 0) + pendingInvites;
      
      if (agreement.licensesOwned && totalCommitted >= agreement.licensesOwned) {
        return res.status(400).json({ 
          message: `License limit reached. ${pendingInvites} invites pending, ${agreement.currentUsers || agreement.licensesUsed} seats used of ${agreement.licensesOwned} total.`
        });
      }
      
      // Check if email already invited or registered
      const existingInvite = (await storage.getCorporateInvitesByAgreement(agreement.id))
        .find(inv => inv.email.toLowerCase() === email.toLowerCase() && inv.status === 'pending');
      
      if (existingInvite) {
        return res.status(400).json({ message: 'User already invited' });
      }
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser && existingUser.corporateAgreementId === agreement.id) {
        return res.status(400).json({ message: 'User already part of this organization' });
      }
      
      // Generate secure token
      const token = crypto.randomBytes(32).toString('hex');
      
      // Create invite with optional course details
      const invite = await storage.createCorporateInvite({
        corporateAgreementId: agreement.id,
        email: email.toLowerCase().trim(),
        invitedBy: userId,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        status: 'pending',
        targetCourseId: targetCourseId || undefined,
        targetCourseType: targetCourseType || undefined,
        targetCourseName: targetCourseName || undefined
      });
      
      // Double-check post-creation to catch race conditions
      const allInvites = await storage.getCorporateInvitesByAgreement(agreement.id);
      const currentPendingInvites = allInvites.filter(inv => inv.status === 'pending').length;
      const reloadedAgreement = await storage.getCorporateAgreementById(agreement.id);
      const finalCommitted = (reloadedAgreement?.currentUsers || 0) + currentPendingInvites;
      
      if (reloadedAgreement && finalCommitted > reloadedAgreement.licensesOwned) {
        // Race condition detected - rollback this invite
        await storage.deleteCorporateInvite(invite.id);
        return res.status(400).json({ 
          message: 'License limit reached due to concurrent invites. Please try again.' 
        });
      }
      
      // Send invitation email with optional course details
      try {
        const inviteUrl = `${req.protocol}://${req.get('host')}/corporate/join/${token}`;
        await sendCorporateInviteEmail(
          email, 
          agreement.companyName, 
          inviteUrl,
          targetCourseName,
          targetCourseType as 'live' | 'on_demand' | undefined
        );
      } catch (emailError) {
        console.error('Failed to send invite email:', emailError);
        // Continue even if email fails
      }
      
      res.json(invite);
    } catch (error: any) {
      console.error('Create invite error:', error);
      res.status(500).json({ message: 'Failed to create invite' });
    }
  });
  
  // Get all invites for corporate (corporate admin only)
  app.get('/api/corporate/invites', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      const agreement = await storage.getCorporateAgreementByAdminUserId(userId);
      if (!agreement) {
        return res.status(403).json({ message: 'Not a corporate administrator' });
      }
      
      const invites = await storage.getCorporateInvitesByAgreement(agreement.id);
      res.json(invites);
    } catch (error: any) {
      console.error('Get invites error:', error);
      res.status(500).json({ message: 'Failed to load invites' });
    }
  });
  
  // Accept corporate invite (public)
  app.post('/api/corporate/invites/:token/accept', async (req, res) => {
    try {
      const { token } = req.params;
      const { email, password, firstName, lastName } = req.body;
      
      // Validate invite token
      const invite = await storage.getCorporateInviteByToken(token);
      if (!invite) {
        return res.status(404).json({ message: 'Invalid or expired invite' });
      }
      
      if (invite.status !== 'pending') {
        return res.status(400).json({ message: 'Invite already used' });
      }
      
      if (new Date() > invite.expiresAt) {
        await storage.updateCorporateInviteStatus(invite.id, 'expired');
        return res.status(400).json({ message: 'Invite has expired' });
      }
      
      if (email.toLowerCase() !== invite.email.toLowerCase()) {
        return res.status(400).json({ message: 'Email does not match invite' });
      }
      
      // Get corporate agreement
      const agreement = await storage.getCorporateAgreementById(invite.corporateAgreementId);
      if (!agreement || !agreement.isActive) {
        return res.status(400).json({ message: 'Corporate account is not active' });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      let user = existingUser;
      
      if (existingUser) {
        // Link existing user to corporate account
        if (existingUser.corporateAgreementId) {
          return res.status(400).json({ 
            message: 'User already belongs to another organization' 
          });
        }
        
        user = await storage.updateUser(existingUser.id, {
          corporateAgreementId: agreement.id,
          isPremium: true
        });
      } else {
        // Create new user
        const hashedPassword = await bcrypt.hash(password, 10);
        user = await storage.createUser({
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          firstName: firstName?.trim() || '',
          lastName: lastName?.trim() || '',
          corporateAgreementId: agreement.id,
          isVerified: true, // Corporate users are pre-verified
          isPremium: true, // Corporate users get premium access
          role: 'user'
        });
      }
      
      // Atomic increment with rollback protection
      const incremented = await storage.incrementCorporateAgreementUsers(agreement.id);
      if (!incremented) {
        // Rollback user creation/update if license limit reached
        if (!existingUser) {
          // New user was created - delete it
          await storage.deleteUser(user.id);
        } else {
          // Existing user was updated - revert link
          await storage.updateUser(user.id, { 
            corporateAgreementId: null,
            isPremium: existingUser.isPremium // Restore original premium status
          });
        }
        return res.status(400).json({ 
          message: 'License limit reached. All licenses are currently in use.' 
        });
      }
      
      // Mark invite as accepted (only after successful increment)
      await storage.updateCorporateInviteStatus(invite.id, 'accepted', new Date());
      
      // Log course invitation activity if invite includes course details
      if (invite.targetCourseType && invite.targetCourseId) {
        try {
          await storage.createActivityLog({
            userId: user.id,
            activityType: 'course_invited',
            points: 0,
            metadata: { 
              courseId: invite.targetCourseId,
              courseType: invite.targetCourseType,
              courseName: invite.targetCourseName,
              inviteId: invite.id,
              corporateAgreementId: agreement.id
            },
          });
          
          console.log(`[COURSE-INVITE] User ${user.id} invited to ${invite.targetCourseType} course: ${invite.targetCourseName || invite.targetCourseId}`);
        } catch (logError) {
          console.error('[COURSE-INVITE] Error logging course invitation:', logError);
          // Don't fail the invite acceptance if logging fails
        }
      }
      
      // Auto-assign company-wide courses to new employee
      let companyCourses: any[] = [];
      try {
        const courseAssignments = await storage.getCorporateCourseAssignmentsByAgreement(agreement.id);
        companyCourses = courseAssignments.map(assignment => ({
          type: assignment.courseType,
          id: assignment.courseId,
          name: assignment.courseName
        }));
        
        // Log activity for each assigned course
        for (const course of companyCourses) {
          await storage.createActivityLog({
            userId: user.id,
            activityType: 'course_auto_assigned',
            points: 0,
            metadata: { 
              courseId: course.id,
              courseType: course.type,
              courseName: course.name,
              corporateAgreementId: agreement.id,
              source: 'company_wide'
            },
          });
        }
        
        if (companyCourses.length > 0) {
          console.log(`[CORPORATE-COURSES] Auto-assigned ${companyCourses.length} company-wide courses to user ${user.id}`);
        }
      } catch (courseError) {
        console.error('[CORPORATE-COURSES] Error auto-assigning courses:', courseError);
        // Don't fail invite if course assignment fails
      }
      
      res.json({ 
        message: 'Successfully joined organization',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        },
        enrolledCourse: invite.targetCourseType && invite.targetCourseId ? {
          type: invite.targetCourseType,
          id: invite.targetCourseId,
          name: invite.targetCourseName
        } : null,
        companyCourses: companyCourses
      });
    } catch (error: any) {
      console.error('Accept invite error:', error);
      res.status(500).json({ message: 'Failed to accept invite' });
    }
  });
  
  // Delete/cancel invite (corporate admin only)
  app.delete('/api/corporate/invites/:id', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      
      const agreement = await storage.getCorporateAgreementByAdminUserId(userId);
      if (!agreement) {
        return res.status(403).json({ message: 'Not a corporate administrator' });
      }
      
      // Verify invite belongs to this corporate
      const invites = await storage.getCorporateInvitesByAgreement(agreement.id);
      const invite = invites.find(inv => inv.id === id);
      
      if (!invite) {
        return res.status(404).json({ message: 'Invite not found' });
      }
      
      await storage.deleteCorporateInvite(id);
      res.json({ message: 'Invite deleted successfully' });
    } catch (error: any) {
      console.error('Delete invite error:', error);
      res.status(500).json({ message: 'Failed to delete invite' });
    }
  });
  
  // Corporate course assignments - GET all courses assigned to company
  app.get('/api/corporate/course-assignments', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      const agreement = await storage.getCorporateAgreementByAdminUserId(userId);
      if (!agreement) {
        return res.status(403).json({ message: 'Not a corporate administrator' });
      }
      
      const assignments = await storage.getCorporateCourseAssignmentsByAgreement(agreement.id);
      res.json(assignments);
    } catch (error: any) {
      console.error('Get course assignments error:', error);
      res.status(500).json({ message: 'Failed to get course assignments' });
    }
  });
  
  // Corporate course assignments - POST assign course to company
  app.post('/api/corporate/course-assignments', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { courseType, courseId, courseName } = req.body;
      
      if (!courseType || !courseId || !courseName) {
        return res.status(400).json({ message: 'Missing required fields: courseType, courseId, courseName' });
      }
      
      if (courseType !== 'live' && courseType !== 'on_demand') {
        return res.status(400).json({ message: 'Invalid courseType. Must be "live" or "on_demand"' });
      }
      
      const agreement = await storage.getCorporateAgreementByAdminUserId(userId);
      if (!agreement) {
        return res.status(403).json({ message: 'Not a corporate administrator' });
      }
      
      const assignment = await storage.createCorporateCourseAssignment({
        corporateAgreementId: agreement.id,
        courseType,
        courseId,
        courseName,
        assignedBy: userId,
      });
      
      res.json(assignment);
    } catch (error: any) {
      console.error('Create course assignment error:', error);
      if (error.message?.includes('duplicate') || error.code === '23505') {
        return res.status(400).json({ message: 'Course already assigned to this company' });
      }
      res.status(500).json({ message: 'Failed to create course assignment' });
    }
  });
  
  // Corporate course assignments - DELETE remove course from company
  app.delete('/api/corporate/course-assignments/:id', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      
      const agreement = await storage.getCorporateAgreementByAdminUserId(userId);
      if (!agreement) {
        return res.status(403).json({ message: 'Not a corporate administrator' });
      }
      
      // Verify assignment belongs to this corporate
      const assignments = await storage.getCorporateCourseAssignmentsByAgreement(agreement.id);
      const assignment = assignments.find(a => a.id === id);
      
      if (!assignment) {
        return res.status(404).json({ message: 'Course assignment not found' });
      }
      
      await storage.deleteCorporateCourseAssignment(id);
      res.json({ message: 'Course assignment deleted successfully' });
    } catch (error: any) {
      console.error('Delete course assignment error:', error);
      res.status(500).json({ message: 'Failed to delete course assignment' });
    }
  });
  
  // Bulk invite via CSV upload
  app.post('/api/corporate/invites/bulk-csv', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { emails, courseType, courseId, courseName } = req.body;
      
      if (!emails || !Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({ message: 'emails must be a non-empty array' });
      }
      
      // Validate course fields if any is provided
      if ((courseType || courseId || courseName) && (!courseType || !courseId || !courseName)) {
        return res.status(400).json({ 
          message: 'If providing course details, all fields (courseType, courseId, courseName) are required' 
        });
      }
      
      if (courseType && courseType !== 'live' && courseType !== 'on_demand') {
        return res.status(400).json({ message: 'Invalid courseType. Must be "live" or "on_demand"' });
      }
      
      const agreement = await storage.getCorporateAgreementByAdminUserId(userId);
      if (!agreement) {
        return res.status(403).json({ message: 'Not a corporate administrator' });
      }
      
      const results = [];
      const errors = [];
      
      for (const email of emails) {
        try {
          const normalizedEmail = email.toLowerCase().trim();
          
          // Validate email format
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            errors.push({ email, error: 'Invalid email format' });
            continue;
          }
          
          // Check if already invited
          const existingInvites = await storage.getCorporateInvitesByAgreement(agreement.id);
          if (existingInvites.some(inv => inv.email.toLowerCase() === normalizedEmail && inv.status === 'pending')) {
            errors.push({ email, error: 'Already invited' });
            continue;
          }
          
          const token = crypto.randomBytes(32).toString('hex');
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
          
          const invite = await storage.createCorporateInvite({
            corporateAgreementId: agreement.id,
            email: normalizedEmail,
            invitedBy: userId,
            token,
            expiresAt,
            targetCourseType: courseType || null,
            targetCourseId: courseId || null,
            targetCourseName: courseName || null,
          });
          
          // Send email
          const baseUrl = process.env.BASE_URL || 
                          (process.env.REPLIT_DOMAINS?.split(',')[0] 
                            ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` 
                            : 'http://localhost:5000');
          const inviteUrl = `${baseUrl}/accept-invite/${token}`;
          
          await sendCorporateInviteEmail(
            normalizedEmail, 
            agreement.companyName,
            inviteUrl,
            courseName || undefined,
            courseType as 'live' | 'on_demand' | undefined
          );
          
          results.push({ email: normalizedEmail, success: true, inviteId: invite.id });
        } catch (error: any) {
          console.error(`Error inviting ${email}:`, error);
          errors.push({ email, error: error.message || 'Failed to send invite' });
        }
      }
      
      res.json({ 
        message: `Sent ${results.length} invites, ${errors.length} failed`,
        results,
        errors
      });
    } catch (error: any) {
      console.error('Bulk invite error:', error);
      res.status(500).json({ message: 'Failed to process bulk invites' });
    }
  });
  
  // Get team members (corporate admin only)
  app.get('/api/corporate/team', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      const agreement = await storage.getCorporateAgreementByAdminUserId(userId);
      if (!agreement) {
        return res.status(403).json({ message: 'Not a corporate administrator' });
      }
      
      const members = await storage.getUsersByCorporateAgreement(agreement.id);
      
      // Enhance with quiz stats
      const enrichedMembers = await Promise.all(
        members.map(async (member) => {
          const attempts = await storage.getUserQuizAttempts(member.id);
          return {
            ...member,
            quizCount: attempts.length,
            lastActivity: attempts.length > 0 
              ? new Date(Math.max(...attempts.map(a => new Date(a.completedAt || a.createdAt).getTime())))
              : null
          };
        })
      );
      
      res.json(enrichedMembers);
    } catch (error: any) {
      console.error('Get team error:', error);
      res.status(500).json({ message: 'Failed to load team members' });
    }
  });
  
  // Validate corporate invite token (public - for pre-filling form)
  app.get('/api/corporate/invites/:token/validate', async (req, res) => {
    try {
      const { token } = req.params;
      
      const invite = await storage.getCorporateInviteByToken(token);
      if (!invite) {
        return res.status(404).json({ message: 'Invalid invite token' });
      }
      
      if (invite.status !== 'pending') {
        return res.status(400).json({ message: 'Invite already used' });
      }
      
      if (new Date() > invite.expiresAt) {
        return res.status(400).json({ message: 'Invite has expired' });
      }
      
      const agreement = await storage.getCorporateAgreementById(invite.corporateAgreementId);
      
      res.json({
        email: invite.email,
        companyName: agreement?.companyName,
        expiresAt: invite.expiresAt
      });
    } catch (error: any) {
      console.error('Validate invite error:', error);
      res.status(500).json({ message: 'Failed to validate invite' });
    }
  });
  
  // Corporate content access - Quiz (admin only)
  app.post('/api/admin/corporate-access/quiz', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { quizId, corporateAgreementId } = req.body;
      
      if (!quizId || !corporateAgreementId) {
        return res.status(400).json({ message: 'Quiz ID and Corporate Agreement ID are required' });
      }
      
      const access = await storage.grantQuizAccess(quizId, corporateAgreementId);
      res.json({ message: 'Quiz access granted successfully', access });
    } catch (error: any) {
      console.error('Grant quiz access error:', error);
      res.status(500).json({ message: 'Failed to grant quiz access' });
    }
  });
  
  app.delete('/api/admin/corporate-access/quiz', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { quizId, corporateAgreementId } = req.body;
      
      if (!quizId || !corporateAgreementId) {
        return res.status(400).json({ message: 'Quiz ID and Corporate Agreement ID are required' });
      }
      
      await storage.revokeQuizAccess(quizId, corporateAgreementId);
      res.json({ message: 'Quiz access revoked successfully' });
    } catch (error: any) {
      console.error('Revoke quiz access error:', error);
      res.status(500).json({ message: 'Failed to revoke quiz access' });
    }
  });
  
  // Corporate content access - Live Course (admin only)
  app.get('/api/admin/corporate-access/live-course/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const liveCourseId = req.params.id;
      const access = await storage.getLiveCourseAccessByLiveCourseId(liveCourseId);
      res.json(access);
    } catch (error: any) {
      console.error('Get live course access error:', error);
      res.status(500).json({ message: 'Failed to get live course access' });
    }
  });
  
  app.post('/api/admin/corporate-access/live-course', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { liveCourseId, corporateAgreementId } = req.body;
      
      if (!liveCourseId || !corporateAgreementId) {
        return res.status(400).json({ message: 'Live Course ID and Corporate Agreement ID are required' });
      }
      
      const access = await storage.grantLiveCourseAccess(liveCourseId, corporateAgreementId);
      res.json({ message: 'Live course access granted successfully', access });
    } catch (error: any) {
      console.error('Grant live course access error:', error);
      res.status(500).json({ message: 'Failed to grant live course access' });
    }
  });
  
  app.delete('/api/admin/corporate-access/live-course', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { liveCourseId, corporateAgreementId } = req.body;
      
      if (!liveCourseId || !corporateAgreementId) {
        return res.status(400).json({ message: 'Live Course ID and Corporate Agreement ID are required' });
      }
      
      await storage.revokeLiveCourseAccess(liveCourseId, corporateAgreementId);
      res.json({ message: 'Live course access revoked successfully' });
    } catch (error: any) {
      console.error('Revoke live course access error:', error);
      res.status(500).json({ message: 'Failed to revoke live course access' });
    }
  });
  
  // Corporate content access - On-Demand Course (admin only)
  app.post('/api/admin/corporate-access/on-demand-course', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { onDemandCourseId, corporateAgreementId } = req.body;
      
      if (!onDemandCourseId || !corporateAgreementId) {
        return res.status(400).json({ message: 'On-Demand Course ID and Corporate Agreement ID are required' });
      }
      
      const access = await storage.grantOnDemandCourseAccess(onDemandCourseId, corporateAgreementId);
      res.json({ message: 'On-demand course access granted successfully', access });
    } catch (error: any) {
      console.error('Grant on-demand course access error:', error);
      res.status(500).json({ message: 'Failed to grant on-demand course access' });
    }
  });
  
  app.delete('/api/admin/corporate-access/on-demand-course', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { onDemandCourseId, corporateAgreementId } = req.body;
      
      if (!onDemandCourseId || !corporateAgreementId) {
        return res.status(400).json({ message: 'On-Demand Course ID and Corporate Agreement ID are required' });
      }
      
      await storage.revokeOnDemandCourseAccess(onDemandCourseId, corporateAgreementId);
      res.json({ message: 'On-demand course access revoked successfully' });
    } catch (error: any) {
      console.error('Revoke on-demand course access error:', error);
      res.status(500).json({ message: 'Failed to revoke on-demand course access' });
    }
  });

  // Update user nickname
  app.patch('/api/user/nickname', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { nickname } = req.body;
      
      // Validate nickname
      if (!nickname || nickname.trim().length === 0) {
        return res.status(400).json({ message: 'Nickname cannot be empty' });
      }
      
      if (nickname.length > 50) {
        return res.status(400).json({ message: 'Nickname must be 50 characters or less' });
      }
      
      // Check if nickname is already taken
      const existingUser = await storage.getUserByNickname(nickname.trim());
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: 'This nickname is already taken' });
      }
      
      const updatedUser = await storage.updateUser(userId, { 
        nickname: nickname.trim() 
      });
      
      res.json({ 
        message: 'Nickname updated successfully',
        nickname: updatedUser.nickname 
      });
    } catch (error: any) {
      console.error('Update nickname error:', error);
      res.status(500).json({ message: 'Failed to update nickname' });
    }
  });
  
  // Get general leaderboard
  app.get('/api/leaderboard', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const leaderboard = await storage.getLeaderboard(limit);
      
      res.json(leaderboard.map((user, index) => ({
        rank: index + 1,
        id: user.id,
        displayName: user.nickname || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Utente',
        totalPoints: user.totalPoints || 0,
        level: user.level || 1,
        credits: user.credits || 0,
        isPremium: user.isPremium,
        corporateAgreementId: user.corporateAgreementId
      })));
    } catch (error: any) {
      console.error('Get leaderboard error:', error);
      res.status(500).json({ message: 'Failed to load leaderboard' });
    }
  });
  
  // Get team leaderboard (for corporate users)
  app.get('/api/leaderboard/team', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUserById(userId);
      
      if (!user?.corporateAgreementId) {
        return res.status(400).json({ message: 'User is not part of a corporate team' });
      }
      
      const teamLeaderboard = await storage.getTeamLeaderboard(user.corporateAgreementId);
      
      res.json(teamLeaderboard.map((member, index) => ({
        rank: index + 1,
        id: member.id,
        displayName: member.nickname || `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Utente',
        totalPoints: member.totalPoints || 0,
        level: member.level || 1,
        credits: member.credits || 0,
        isPremium: member.isPremium,
        isCurrentUser: member.id === userId
      })));
    } catch (error: any) {
      console.error('Get team leaderboard error:', error);
      res.status(500).json({ message: 'Failed to load team leaderboard' });
    }
  });

  // Register gamification routes
  registerGamificationRoutes(app);

  const httpServer = createServer(app);
  
  // Setup WebSocket server for live streaming
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/live-stream' });
  
  // Store active connections with metadata
  interface ClientConnection {
    ws: WebSocket;
    userId?: string;
    sessionId?: string;
    userName?: string;
  }
  
  const clients = new Map<WebSocket, ClientConnection>();
  
  // Broadcast helper function
  const broadcastToSession = (sessionId: string, message: any) => {
    clients.forEach((client, ws) => {
      if (client.sessionId === sessionId && ws.readyState === 1) {
        ws.send(JSON.stringify(message));
      }
    });
  };
  
  // Live streaming session endpoints (defined after broadcastToSession)
  
  // Validation schemas
  const startStreamingSessionSchema = z.object({
    sessionId: z.string().uuid(),
    streamUrl: z.string().url(),
    title: z.string().min(1)
  });
  
  const createPollSchema = z.object({
    question: z.string().min(1),
    options: z.array(z.object({ label: z.string(), text: z.string() })).min(2),
    correctAnswer: z.string().optional().nullable(),
    showResults: z.boolean().optional()
  });
  
  // Admin - Start a live streaming session
  app.post('/api/admin/live-streaming/start', isAdmin, async (req, res) => {
    try {
      const validated = startStreamingSessionSchema.parse(req.body);
      
      // Check if there's already an active session for this sessionId
      const existing = await storage.getActiveStreamingSession(validated.sessionId);
      if (existing) {
        return res.status(400).json({ message: 'An active streaming session already exists for this Live Course session' });
      }
      
      const streamingSession = await storage.createLiveStreamingSession({
        sessionId: validated.sessionId,
        streamUrl: validated.streamUrl,
        title: validated.title,
        isActive: true
      });
      
      // Broadcast session start to all connected clients for this session
      broadcastToSession(validated.sessionId, {
        type: 'session_started',
        session: streamingSession
      });

      // Send email notifications to enrolled users (async, don't block response)
      (async () => {
        try {
          const session = await storage.getSessionById(validated.sessionId);
          if (!session) return;

          const course = await storage.getLiveCourseById(session.courseId);
          if (!course) return;

          const enrollments = await storage.getLiveCourseEnrollmentsByCourseId(session.courseId);
          
          const baseUrl = process.env.BASE_URL || 
            (process.env.REPLIT_DOMAINS?.split(',')[0] 
              ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` 
              : 'http://localhost:5000');
          const sessionUrl = `${baseUrl}/live-session/${session.id}`;
          const startDate = new Date(session.startDate).toLocaleString('it-IT', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          for (const enrollment of enrollments) {
            const user = await storage.getUser(enrollment.userId);
            if (!user?.email) continue;

            try {
              await sendTemplateEmail('live_session_started', user.email, {
                firstName: user.firstName || 'Studente',
                courseTitle: course.title,
                sessionTitle: validated.title,
                instructor: course.instructor || 'Docente',
                startDate,
                sessionUrl
              });
            } catch (emailError) {
              console.error(`Failed to send notification email to ${user.email}:`, emailError);
            }
          }
          
          console.log(`Sent ${enrollments.length} live session notification emails`);
        } catch (notificationError) {
          console.error('Error sending live session notifications:', notificationError);
        }
      })();
      
      res.json(streamingSession);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
      }
      console.error('Start streaming session error:', error);
      res.status(500).json({ message: 'Failed to start streaming session' });
    }
  });
  
  // Admin - End a live streaming session
  app.post('/api/admin/live-streaming/:id/end', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      const session = await storage.getLiveStreamingSessionBySessionId(id);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      await storage.endLiveStreamingSession(session.id);
      
      // Broadcast session end to all connected clients
      broadcastToSession(session.sessionId, {
        type: 'session_ended',
        sessionId: session.sessionId
      });
      
      res.json({ message: 'Streaming session ended successfully' });
    } catch (error: any) {
      console.error('End streaming session error:', error);
      res.status(500).json({ message: 'Failed to end streaming session' });
    }
  });
  
  // Admin - Create a poll during live session
  app.post('/api/admin/live-streaming/:id/poll', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validated = createPollSchema.parse(req.body);
      
      const session = await storage.getLiveStreamingSessionBySessionId(id);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      // Close any active poll first
      const activePoll = await storage.getActivePoll(session.id);
      if (activePoll) {
        await storage.updateLiveStreamingPoll(activePoll.id, { isActive: false });
      }
      
      const poll = await storage.createLiveStreamingPoll({
        streamingSessionId: session.id,
        question: validated.question,
        options: validated.options,
        correctAnswer: validated.correctAnswer || null,
        showResults: validated.showResults || false,
        isActive: true
      });
      
      // Broadcast new poll to all clients
      broadcastToSession(session.sessionId, {
        type: 'poll',
        poll,
        stats: []
      });
      
      res.json(poll);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
      }
      console.error('Create poll error:', error);
      res.status(500).json({ message: 'Failed to create poll' });
    }
  });
  
  // Admin - Close a poll
  app.put('/api/admin/live-streaming/poll/:id/close', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { showResults } = req.body;
      
      // Get poll to find session
      const polls = await storage.getStreamingPolls(id);
      const poll = polls.find(p => p.id === id);
      if (!poll) {
        return res.status(404).json({ message: 'Poll not found' });
      }
      
      const updatedPoll = await storage.updateLiveStreamingPoll(id, {
        isActive: false,
        showResults: showResults !== undefined ? showResults : true
      });
      
      // Broadcast poll close with results
      const pollStats = await storage.getPollStats(id);
      const session = await storage.getLiveStreamingSessionBySessionId(poll.streamingSessionId);
      
      if (session) {
        broadcastToSession(session.sessionId, {
          type: 'poll_closed',
          poll: updatedPoll,
          stats: pollStats
        });
      }
      
      res.json(updatedPoll);
    } catch (error: any) {
      console.error('Close poll error:', error);
      res.status(500).json({ message: 'Failed to close poll' });
    }
  });
  
  // Get live streaming session info (authenticated users with enrollment check)
  app.get('/api/live-streaming/:sessionId', isAuthenticated, async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      const streamingSession = await storage.getActiveStreamingSession(sessionId);
      if (!streamingSession) {
        return res.status(404).json({ message: 'No active streaming session found' });
      }
      
      // Verify user enrollment in the live course session
      const liveCourseSession = await storage.getSessionById(sessionId);
      if (!liveCourseSession) {
        return res.status(404).json({ message: 'Live course session not found' });
      }
      
      // Check if user is enrolled in the live course
      const enrollment = await storage.getLiveCourseEnrollment(liveCourseSession.courseId, req.user!.id);
      if (!enrollment && !req.user!.isAdmin) {
        return res.status(403).json({ message: 'You must be enrolled in this course to access the live session' });
      }
      
      // Get active poll if any
      const activePoll = await storage.getActivePoll(streamingSession.id);
      let pollWithStats = null;
      
      if (activePoll) {
        const pollStats = await storage.getPollStats(activePoll.id);
        const userResponse = await storage.getUserPollResponse(activePoll.id, req.user!.id);
        
        pollWithStats = {
          ...activePoll,
          stats: pollStats,
          userVoted: !!userResponse,
          userResponse: userResponse?.selectedOption
        };
      }
      
      res.json({
        ...streamingSession,
        activePoll: pollWithStats
      });
    } catch (error: any) {
      console.error('Get streaming session error:', error);
      res.status(500).json({ message: 'Failed to load streaming session' });
    }
  });
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection');
    clients.set(ws, { ws });
    
    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        const client = clients.get(ws);
        
        switch (message.type) {
          case 'auth':
            // Authenticate and join session with enrollment verification
            if (client && message.userId && message.sessionId) {
              // Verify user enrollment
              const liveCourseSession = await storage.getSessionById(message.sessionId);
              if (!liveCourseSession) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Live course session not found'
                }));
                ws.close();
                return;
              }
              
              const enrollment = await storage.getLiveCourseEnrollment(liveCourseSession.courseId, message.userId);
              const user = await storage.getUser(message.userId);
              
              if (!enrollment && !user?.isAdmin) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'You must be enrolled in this course to access the live session'
                }));
                ws.close();
                return;
              }
              
              // User is authorized - set connection metadata
              client.userId = message.userId;
              client.sessionId = message.sessionId;
              client.userName = message.userName;
              clients.set(ws, client);
              
              // Send recent messages
              const streamingSession = await storage.getActiveStreamingSession(message.sessionId);
              if (streamingSession) {
                const recentMessages = await storage.getStreamingMessages(streamingSession.id, 50);
                ws.send(JSON.stringify({
                  type: 'history',
                  messages: recentMessages.reverse()
                }));
                
                // Send active poll if any
                const activePoll = await storage.getActivePoll(streamingSession.id);
                if (activePoll) {
                  const pollStats = await storage.getPollStats(activePoll.id);
                  ws.send(JSON.stringify({
                    type: 'poll',
                    poll: activePoll,
                    stats: pollStats
                  }));
                }
              }
            }
            break;
            
          case 'chat':
            // Save and broadcast chat message
            if (client?.userId && client?.sessionId) {
              const streamingSession = await storage.getActiveStreamingSession(client.sessionId);
              if (streamingSession) {
                const savedMessage = await storage.createLiveStreamingMessage({
                  streamingSessionId: streamingSession.id,
                  userId: client.userId,
                  userName: client.userName || 'Anonimo',
                  message: message.content,
                  isAdminMessage: message.isAdminMessage || false
                });
                
                // Broadcast to all clients in the same session
                clients.forEach((c, clientWs) => {
                  if (c.sessionId === client.sessionId && clientWs.readyState === 1) {
                    clientWs.send(JSON.stringify({
                      type: 'chat',
                      message: savedMessage
                    }));
                  }
                });
              }
            }
            break;
            
          case 'poll_vote':
            // Save poll response
            if (client?.userId && message.pollId) {
              // Check if user already voted
              const existingVote = await storage.getUserPollResponse(message.pollId, client.userId);
              if (!existingVote) {
                await storage.createPollResponse({
                  pollId: message.pollId,
                  userId: client.userId,
                  selectedOption: message.selectedOption
                });
                
                // Get updated stats and broadcast
                const pollStats = await storage.getPollStats(message.pollId);
                const poll = await storage.getStreamingPolls(client.sessionId!);
                const activePoll = poll.find(p => p.id === message.pollId);
                
                clients.forEach((c, clientWs) => {
                  if (c.sessionId === client.sessionId && clientWs.readyState === 1) {
                    clientWs.send(JSON.stringify({
                      type: 'poll_update',
                      pollId: message.pollId,
                      stats: pollStats,
                      poll: activePoll
                    }));
                  }
                });
              }
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      clients.delete(ws);
      console.log('WebSocket connection closed');
    });
  });

  // AI Scenario Conversation endpoints
  
  // Check for existing active conversation (GET /api/scenarios/check/:questionId)
  app.get('/api/scenarios/check/:questionId', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { questionId } = req.params;

      const conversation = await storage.getUserScenarioConversation(questionId, user.id);
      if (!conversation) {
        return res.json({ conversation: null, messages: [] });
      }

      const messages = await storage.getConversationMessages(conversation.id);
      res.json({ conversation, messages });
    } catch (error: any) {
      console.error('Check scenario conversation error:', error);
      res.status(500).json({ message: error.message || 'Failed to check conversation' });
    }
  });
  
  // Validation schemas
  const startScenarioSchema = z.object({
    questionId: z.string().uuid(),
    quizId: z.string().uuid(),
    category: z.string(),
    questionText: z.string(),
    userAnswer: z.string(),
    correctAnswer: z.string(),
    wasCorrect: z.boolean(),
    scenarioType: z.enum(['business_case', 'personal_development'])
  });

  const sendScenarioMessageSchema = z.object({
    message: z.string().min(1)
  });

  // Start AI scenario conversation (POST /api/scenarios/start)
  app.post('/api/scenarios/start', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const validated = startScenarioSchema.parse(req.body);

      // Check if there's already an active conversation for this question
      const existing = await storage.getUserScenarioConversation(validated.questionId, user.id);
      if (existing) {
        // Return existing conversation with messages
        const messages = await storage.getConversationMessages(existing.id);
        return res.json({ conversation: existing, messages });
      }

      // Generate scenario using AI
      const scenario = await generateScenario({
        category: validated.category,
        questionText: validated.questionText,
        userAnswer: validated.userAnswer,
        correctAnswer: validated.correctAnswer,
        wasCorrect: validated.wasCorrect,
        scenarioType: validated.scenarioType
      });

      // Create conversation
      const conversation = await storage.createScenarioConversation({
        userId: user.id,
        questionId: validated.questionId,
        quizId: validated.quizId,
        scenarioType: validated.scenarioType,
        category: validated.category,
        userAnswer: validated.userAnswer,
        wasCorrect: validated.wasCorrect,
        scenarioTitle: scenario.title,
        scenarioContext: scenario.context,
        isActive: true
      });

      // Create initial assistant message
      const initialMessage = await storage.createScenarioMessage({
        conversationId: conversation.id,
        role: 'assistant',
        content: `${scenario.context}\n\n${scenario.initialMessage}`
      });

      res.json({ 
        conversation, 
        messages: [initialMessage],
        scenario 
      });
    } catch (error: any) {
      console.error('Start scenario error:', error);
      res.status(500).json({ message: error.message || 'Failed to start scenario' });
    }
  });

  // Send message in scenario conversation (POST /api/scenarios/:conversationId/message)
  app.post('/api/scenarios/:conversationId/message', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { conversationId } = req.params;
      const validated = sendScenarioMessageSchema.parse(req.body);

      // Verify conversation belongs to user
      const conversation = await storage.getScenarioConversation(conversationId);
      if (!conversation || conversation.userId !== user.id) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      if (!conversation.isActive) {
        return res.status(400).json({ message: 'Conversation is closed' });
      }

      // Save user message
      await storage.createScenarioMessage({
        conversationId: conversationId,
        role: 'user',
        content: validated.message
      });

      // Get conversation history for AI context
      const messages = await storage.getConversationMessages(conversationId);
      const conversationHistory = messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

      // Get user's first name for personalization
      const userName = user.firstName || user.email?.split('@')[0] || 'Utente';

      // Generate AI response
      const aiResponse = await generateScenarioResponse(
        conversationHistory,
        conversation.category || 'General',
        conversation.scenarioType as 'business_case' | 'personal_development',
        userName
      );

      // Save assistant response
      const assistantMessage = await storage.createScenarioMessage({
        conversationId: conversationId,
        role: 'assistant',
        content: aiResponse
      });

      res.json({ message: assistantMessage });
    } catch (error: any) {
      console.error('Send scenario message error:', error);
      res.status(500).json({ message: error.message || 'Failed to send message' });
    }
  });

  // Get scenario conversation (GET /api/scenarios/:conversationId)
  app.get('/api/scenarios/:conversationId', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { conversationId } = req.params;

      const conversation = await storage.getScenarioConversation(conversationId);
      if (!conversation || conversation.userId !== user.id) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      const messages = await storage.getConversationMessages(conversationId);

      res.json({ conversation, messages });
    } catch (error: any) {
      console.error('Get scenario conversation error:', error);
      res.status(500).json({ message: error.message || 'Failed to get conversation' });
    }
  });

  // End scenario conversation (POST /api/scenarios/:conversationId/end)
  app.post('/api/scenarios/:conversationId/end', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { conversationId } = req.params;

      const conversation = await storage.getScenarioConversation(conversationId);
      if (!conversation || conversation.userId !== user.id) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      await storage.endScenarioConversation(conversationId);

      res.json({ message: 'Conversation ended' });
    } catch (error: any) {
      console.error('End scenario conversation error:', error);
      res.status(500).json({ message: error.message || 'Failed to end conversation' });
    }
  });

  // User Feedback API

  // Submit feedback (POST /api/feedback)
  app.post('/api/feedback', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { rating, comment, source } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
      }

      const feedback = await storage.createUserFeedback({
        userId: user.id,
        rating,
        comment: comment || null,
        source: source || 'popup',
      });

      res.json(feedback);
    } catch (error: any) {
      console.error('Submit feedback error:', error);
      res.status(500).json({ message: error.message || 'Failed to submit feedback' });
    }
  });

  // Check if user should see feedback prompt (GET /api/feedback/should-prompt)
  app.get('/api/feedback/should-prompt', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Check if user has submitted feedback in the last 30 days
      const hasRecentFeedback = await storage.checkUserHasRecentFeedback(user.id, 30);
      
      res.json({ shouldPrompt: !hasRecentFeedback });
    } catch (error: any) {
      console.error('Check feedback prompt error:', error);
      res.status(500).json({ message: error.message || 'Failed to check feedback prompt' });
    }
  });

  // Admin - Get all feedback (GET /api/admin/feedback)
  app.get('/api/admin/feedback', isAdmin, async (req, res) => {
    try {
      const feedbacks = await storage.getAllUserFeedback();
      res.json(feedbacks);
    } catch (error: any) {
      console.error('Get feedback error:', error);
      res.status(500).json({ message: error.message || 'Failed to get feedback' });
    }
  });

  // ========== PREVENTION SYSTEM ROUTES ==========
  
  // Get all prevention documents (GET /api/prevention/documents) - Public endpoint
  app.get('/api/prevention/documents', async (req, res) => {
    try {
      const activeOnly = req.query.activeOnly === 'true';
      const documents = await storage.getAllPreventionDocuments(activeOnly);
      res.json(documents);
    } catch (error: any) {
      console.error('Get prevention documents error:', error);
      res.status(500).json({ message: error.message || 'Failed to get documents' });
    }
  });

  // Get prevention document by ID (GET /api/prevention/documents/:id)
  app.get('/api/prevention/documents/:id', isAuthenticated, async (req, res) => {
    try {
      const document = await storage.getPreventionDocumentById(req.params.id);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      res.json(document);
    } catch (error: any) {
      console.error('Get prevention document error:', error);
      res.status(500).json({ message: error.message || 'Failed to get document' });
    }
  });

  // Upload and analyze prevention document (POST /api/prevention/documents/upload) - ADMIN ONLY
  app.post('/api/prevention/documents/upload', isAdmin, async (req, res) => {
    try {
      const user = req.user as any;
      const { title, fileUrl, pdfContent } = req.body;

      if (!title || !pdfContent || !fileUrl) {
        return res.status(400).json({ message: 'Title, fileUrl, and PDF content are required' });
      }

      // Analyze document with Gemini AI
      const analysis = await analyzePreventionDocument(pdfContent);

      // Create document record
      const document = await storage.createPreventionDocument({
        title,
        fileUrl,
        uploadedById: user.id,
        analysisStatus: 'completed',
        extractedTopics: analysis.topics,
        extractedKeywords: analysis.keywords,
        summary: analysis.summary,
        language: analysis.language,
        isActive: true,
      });

      // Create topic records if they don't exist
      for (const topicName of analysis.topics) {
        const existingTopics = await storage.getAllPreventionTopics();
        const exists = existingTopics.find(t => t.name.toLowerCase() === topicName.toLowerCase());
        
        if (!exists) {
          await storage.createPreventionTopic({
            name: topicName,
            isSensitive: false,
          });
        }
      }

      res.json(document);
    } catch (error: any) {
      console.error('Upload prevention document error:', error);
      res.status(500).json({ message: error.message || 'Failed to upload document' });
    }
  });

  // Update prevention document (PATCH /api/prevention/documents/:id) - ADMIN ONLY
  app.patch('/api/prevention/documents/:id', isAdmin, async (req, res) => {
    try {
      const document = await storage.updatePreventionDocument(req.params.id, req.body);
      res.json(document);
    } catch (error: any) {
      console.error('Update prevention document error:', error);
      res.status(500).json({ message: error.message || 'Failed to update document' });
    }
  });

  // Delete prevention document (DELETE /api/prevention/documents/:id) - ADMIN ONLY
  app.delete('/api/prevention/documents/:id', isAdmin, async (req, res) => {
    try {
      await storage.deletePreventionDocument(req.params.id);
      res.json({ message: 'Document deleted successfully' });
    } catch (error: any) {
      console.error('Delete prevention document error:', error);
      res.status(500).json({ message: error.message || 'Failed to delete document' });
    }
  });

  // Get all prevention topics (GET /api/prevention/topics)
  app.get('/api/prevention/topics', isAuthenticated, async (req, res) => {
    try {
      const topics = await storage.getAllPreventionTopics();
      res.json(topics);
    } catch (error: any) {
      console.error('Get prevention topics error:', error);
      res.status(500).json({ message: error.message || 'Failed to get topics' });
    }
  });

  // Create prevention topic (POST /api/prevention/topics) - ADMIN ONLY
  app.post('/api/prevention/topics', isAdmin, async (req, res) => {
    try {
      const topic = await storage.createPreventionTopic(req.body);
      res.json(topic);
    } catch (error: any) {
      console.error('Create prevention topic error:', error);
      res.status(500).json({ message: error.message || 'Failed to create topic' });
    }
  });

  // Update prevention topic (PATCH /api/prevention/topics/:id) - ADMIN ONLY
  app.patch('/api/prevention/topics/:id', isAdmin, async (req, res) => {
    try {
      const topic = await storage.updatePreventionTopic(req.params.id, req.body);
      res.json(topic);
    } catch (error: any) {
      console.error('Update prevention topic error:', error);
      res.status(500).json({ message: error.message || 'Failed to update topic' });
    }
  });

  // ========== PREVENTION INDEX ROUTES ==========

  // Get prevention index for current user (GET /api/prevention/index)
  app.get('/api/prevention/index', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { getPreventionIndex } = await import('./preventionIndexService');
      const indexData = await getPreventionIndex(user.id);
      res.json(indexData);
    } catch (error: any) {
      console.error('Get prevention index error:', error);
      res.status(500).json({ message: error.message || 'Failed to get prevention index' });
    }
  });

  // ========== PREVENTION ASSESSMENT ROUTES ==========

  // Start new prevention assessment (POST /api/prevention/assessment/start)
  app.post('/api/prevention/assessment/start', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;

      // Validate request body
      const startAssessmentSchema = z.object({
        userAge: z.number().int().min(1).max(120),
        userGender: z.string().min(1),
        userProfession: z.string().min(1),
      });

      const validatedData = startAssessmentSchema.parse(req.body);

      // Create assessment
      const assessment = await storage.createPreventionAssessment({
        userId: user.id,
        title: `Assessment Prevenzione - ${new Date().toLocaleDateString('it-IT')}`,
        status: 'in_progress',
        userAge: validatedData.userAge,
        userGender: validatedData.userGender,
        userProfession: validatedData.userProfession,
      });

      // Generate personalized AI questions based on user demographics
      const aiQuestions = await generateAssessmentQuestions(
        validatedData.userAge,
        validatedData.userGender,
        validatedData.userProfession
      );

      // Save generated questions to database
      const savedQuestions = [];
      for (let i = 0; i < aiQuestions.length; i++) {
        const question = aiQuestions[i];
        const savedQuestion = await storage.createPreventionAssessmentQuestion({
          assessmentId: assessment.id,
          questionText: question.text,
          options: question.options,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          orderIndex: i,
        });
        savedQuestions.push(savedQuestion);
      }

      res.json({
        ...assessment,
        questions: savedQuestions,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
      }
      console.error('Start assessment error:', error);
      res.status(500).json({ message: error.message || 'Failed to start assessment' });
    }
  });

  // Save user response to assessment question (POST /api/prevention/assessment/:id/response)
  app.post('/api/prevention/assessment/:id/response', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;

      // Validate request body
      const saveResponseSchema = z.object({
        questionId: z.string().uuid(),
        selectedAnswer: z.string().min(1),
        isCorrect: z.boolean().optional(),
      });

      const validatedData = saveResponseSchema.parse(req.body);

      // Verify assessment belongs to user
      const assessment = await storage.getPreventionAssessmentById(req.params.id);
      if (!assessment || assessment.userId !== user.id) {
        return res.status(404).json({ message: 'Assessment not found' });
      }

      // Save response
      const response = await storage.createPreventionUserResponse({
        assessmentId: req.params.id,
        questionId: validatedData.questionId,
        selectedAnswer: validatedData.selectedAnswer,
        isCorrect: validatedData.isCorrect ?? false,
      });

      res.json(response);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
      }
      console.error('Save response error:', error);
      res.status(500).json({ message: error.message || 'Failed to save response' });
    }
  });

  // Complete assessment and generate report (POST /api/prevention/assessment/:id/complete)
  app.post('/api/prevention/assessment/:id/complete', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;

      // Verify assessment belongs to user
      const assessment = await storage.getPreventionAssessmentById(req.params.id);
      if (!assessment || assessment.userId !== user.id) {
        return res.status(404).json({ message: 'Assessment not found' });
      }

      // Get all responses
      const responses = await storage.getPreventionUserResponses(req.params.id);
      
      // Calculate score
      const correctAnswers = responses.filter(r => r.isCorrect).length;
      const totalQuestions = responses.length;
      const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

      // Determine risk level
      let riskLevel = 'low';
      if (score < 50) {
        riskLevel = 'high';
      } else if (score < 70) {
        riskLevel = 'medium';
      }

      // TODO: Generate personalized recommendations using AI
      const recommendations = [
        'Consultare il medico per approfondimenti',
        'Mantenere uno stile di vita sano',
        'Effettuare controlli periodici',
      ];

      // TODO: Generate PDF report
      const reportPdfUrl = undefined;

      // Complete assessment
      const completedAssessment = await storage.completePreventionAssessment(
        req.params.id,
        score,
        riskLevel,
        recommendations,
        reportPdfUrl
      );

      res.json(completedAssessment);
    } catch (error: any) {
      console.error('Complete assessment error:', error);
      res.status(500).json({ message: error.message || 'Failed to complete assessment' });
    }
  });

  // Get latest assessment for user (GET /api/prevention/assessment/latest) - Optional auth
  app.get('/api/prevention/assessment/latest', async (req, res) => {
    try {
      const user = req.user as any;
      
      // If not authenticated, return 404 (no assessment for anonymous)
      if (!user) {
        return res.status(404).json({ message: 'No assessment found' });
      }
      
      const assessment = await storage.getLatestPreventionAssessment(user.id);
      
      if (!assessment) {
        return res.status(404).json({ message: 'No assessment found' });
      }

      // Get questions and responses if assessment exists
      const questions = await storage.getPreventionAssessmentQuestions(assessment.id);
      const responses = await storage.getPreventionUserResponses(assessment.id);

      res.json({
        ...assessment,
        questions,
        responses,
      });
    } catch (error: any) {
      console.error('Get latest assessment error:', error);
      res.status(500).json({ message: error.message || 'Failed to get assessment' });
    }
  });

  // Download assessment PDF report (GET /api/prevention/assessment/:id/pdf)
  app.get('/api/prevention/assessment/:id/pdf', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const assessment = await storage.getPreventionAssessmentById(req.params.id);

      if (!assessment) {
        return res.status(404).json({ message: 'Assessment not found' });
      }

      // Check ownership
      if (assessment.userId !== user.id) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      // Assessment must be completed to generate PDF
      if (assessment.status !== 'completed') {
        return res.status(400).json({ message: 'Assessment not completed yet' });
      }

      // Generate PDF
      const pdfBuffer = await generateAssessmentPDFBuffer({
        userAge: assessment.userAge,
        userGender: assessment.userGender,
        userProfession: assessment.userProfession,
        score: assessment.score || 0,
        riskLevel: assessment.riskLevel || 'low',
        recommendations: assessment.recommendations || [],
        completedAt: assessment.completedAt || new Date(),
      });

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="assessment-prevenzione-${assessment.id}.pdf"`
      );
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);
    } catch (error: any) {
      console.error('Generate assessment PDF error:', error);
      res.status(500).json({ message: error.message || 'Failed to generate PDF' });
    }
  });

  // Generate Prevention Path (POST /api/prevention/generate-path) - AUTHENTICATED
  app.post('/api/prevention/generate-path', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;

      // Get user's triage sessions to analyze conversation history
      const sessions = await storage.getTriageSessionsByUser(user.id);
      
      if (sessions.length === 0) {
        return res.status(400).json({ 
          message: 'Nessuna conversazione trovata. Inizia una conversazione prima di generare il percorso.' 
        });
      }

      // Get messages from all sessions for context
      let allMessages: string[] = [];
      for (const session of sessions.slice(0, 5)) { // Last 5 sessions for context
        const messages = await storage.getTriageMessagesBySession(session.id);
        allMessages = allMessages.concat(
          messages.map(msg => `${msg.role === 'user' ? 'Utente' : 'AI'}: ${msg.content}`)
        );
      }

      const conversationContext = allMessages.join('\n');

      const prompt = `Sei un esperto di prevenzione sanitaria. Analizza il seguente storico di conversazioni dell'utente e crea un Percorso di Prevenzione personalizzato.

STORICO CONVERSAZIONI:
${conversationContext}

COMPITO:
Genera un percorso di prevenzione strutturato che includa:

1. **Obiettivi Principali** (3-5 obiettivi prioritari basati sulle conversazioni)
2. **Piano d'Azione Settimanale** (step concreti da seguire)
3. **Screening e Controlli Consigliati** (esami e visite periodiche)
4. **Modifiche dello Stile di Vita** (alimentazione, attività fisica, sonno)
5. **Timeline** (quando fare cosa nei prossimi 3-6 mesi)

Struttura la risposta in modo chiaro con titoli, bullet points e indicazioni pratiche.
Le risposte DEVONO essere in italiano.`;

      const preventionPath = await generateGeminiContent(prompt, "gemini-2.5-pro");

      res.json({ 
        preventionPath,
        conversationCount: sessions.length,
        generatedAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Generate prevention path error:', error);
      res.status(500).json({ message: error.message || 'Errore durante la generazione del percorso' });
    }
  });

  // Generate Attention Points Analysis (POST /api/prevention/generate-attention-points) - AUTHENTICATED
  app.post('/api/prevention/generate-attention-points', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;

      // Get user's triage sessions
      const sessions = await storage.getTriageSessionsByUser(user.id);
      
      if (sessions.length === 0) {
        return res.status(400).json({ 
          message: 'Nessuna conversazione trovata. Inizia una conversazione prima di analizzare i punti di attenzione.' 
        });
      }

      // Get messages from all sessions for context
      let allMessages: string[] = [];
      for (const session of sessions.slice(0, 5)) {
        const messages = await storage.getTriageMessagesBySession(session.id);
        allMessages = allMessages.concat(
          messages.map(msg => `${msg.role === 'user' ? 'Utente' : 'AI'}: ${msg.content}`)
        );
      }

      const conversationContext = allMessages.join('\n');

      const prompt = `Sei un esperto di prevenzione sanitaria. Analizza il seguente storico di conversazioni dell'utente e identifica i Punti di Attenzione e le aree di miglioramento.

STORICO CONVERSAZIONI:
${conversationContext}

COMPITO:
Genera un'analisi dettagliata che includa:

1. **⚠️ Punti di Attenzione Prioritari** (3-5 aspetti che richiedono attenzione immediata)
2. **📊 Aree di Miglioramento** (comportamenti o abitudini da modificare)
3. **🎯 Fattori di Rischio Identificati** (basati sulle conversazioni)
4. **✅ Azioni Raccomandate** (step concreti per ogni punto di attenzione)
5. **⏰ Urgenza** (quali aspetti affrontare subito e quali nel medio termine)

Usa un tono empatico ma chiaro. Evidenzia i rischi senza allarmare, fornendo sempre soluzioni pratiche.
Le risposte DEVONO essere in italiano.`;

      const attentionPoints = await generateGeminiContent(prompt, "gemini-2.5-pro");

      res.json({ 
        attentionPoints,
        conversationCount: sessions.length,
        generatedAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Generate attention points error:', error);
      res.status(500).json({ message: error.message || 'Errore durante l\'analisi dei punti di attenzione' });
    }
  });

  // ========== TRIAGE CONVERSATION ROUTES ==========
  
  // *** ADMIN ENDPOINTS (must be before parametric routes) ***
  
  // Get all triage alerts (GET /api/triage/alerts) - ADMIN ONLY
  app.get('/api/triage/alerts', isAdmin, async (req, res) => {
    try {
      const alertsWithDetails = await storage.getAllTriageAlertsWithDetails();
      
      // Map to frontend format with all needed information
      const enrichedAlerts = alertsWithDetails.map((alertData) => {
        const user = alertData.user;
        const userInfo = user ? {
          userId: user.id,
          userEmail: user.email,
          userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
        } : { userId: null, userEmail: 'Utente Anonimo', userName: 'Anonimo' };

        return {
          id: alertData.id,
          sessionId: alertData.sessionId,
          urgencyLevel: alertData.urgencyLevel,
          suggestedAction: `${alertData.alertType}: ${alertData.reason}`,
          isResolved: alertData.isReviewed,
          resolvedAt: alertData.reviewedAt,
          createdAt: alertData.createdAt,
          initialSymptom: alertData.session?.initialSymptom || 'N/A',
          userInfo,
        };
      });
      
      res.json(enrichedAlerts);
    } catch (error: any) {
      console.error('Get all triage alerts error:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch alerts' });
    }
  });

  // Resolve triage alert (POST /api/triage/alerts/:id/resolve) - ADMIN ONLY
  app.post('/api/triage/alerts/:id/resolve', isAdmin, async (req, res) => {
    try {
      const alertId = req.params.id;
      const admin = req.user as any;
      
      const updatedAlert = await storage.updateTriageAlert(alertId, {
        isReviewed: true, // Backend uses isReviewed
        reviewedById: admin.id,
        reviewedAt: new Date(),
        reviewNotes: 'Resolved by admin',
      });
      
      // Map backend → frontend
      const mappedAlert = {
        id: updatedAlert.id,
        sessionId: updatedAlert.sessionId,
        urgencyLevel: updatedAlert.urgencyLevel,
        suggestedAction: `${updatedAlert.alertType}: ${updatedAlert.reason}`,
        isResolved: updatedAlert.isReviewed,
        resolvedAt: updatedAlert.reviewedAt,
        createdAt: updatedAlert.createdAt,
      };
      
      res.json(mappedAlert);
    } catch (error: any) {
      console.error('Resolve triage alert error:', error);
      res.status(500).json({ message: error.message || 'Failed to resolve alert' });
    }
  });

  // *** USER ENDPOINTS ***
  
  // Start new triage session (POST /api/triage/start) - Public endpoint for educational access
  app.post('/api/triage/start', aiGenerationLimiter, async (req, res) => {
    try {
      const user = req.user as any;
      const { initialSymptom, language } = req.body;

      if (!initialSymptom) {
        return res.status(400).json({ message: 'Initial symptom is required' });
      }

      // Create triage session (userId null for anonymous users)
      const session = await storage.createTriageSession({
        userId: user?.id || null,
        status: 'active',
      });

      // Create initial message
      const userMessage = await storage.createTriageMessage({
        sessionId: session.id,
        role: 'user',
        content: initialSymptom,
      });

      // Get AI response (pass user's first name for personalization if available)
      const aiResponse = await generateTriageResponse(
        initialSymptom, 
        [], 
        undefined, 
        user?.firstName
      );

      // Save AI response
      const aiMessage = await storage.createTriageMessage({
        sessionId: session.id,
        role: 'assistant',
        content: aiResponse.message,
      });

      // Check for sensitive flags and create alerts (only for authenticated users)
      if ((aiResponse.isSensitive || aiResponse.suggestDoctor) && user?.id) {
        await storage.createTriageAlert({
          userId: user.id,
          sessionId: session.id,
          urgencyLevel: aiResponse.urgencyLevel,
          alertType: aiResponse.isSensitive ? 'sensitive_topic' : 'doctor_referral',
          reason: `Urgency: ${aiResponse.urgencyLevel}. Related topics: ${aiResponse.relatedTopics.join(', ')}`,
          isReviewed: false,
        });
      }

      // Build response with upload instructions if needed
      const response: any = {
        session,
        messages: [userMessage, aiMessage],
        suggestDoctor: aiResponse.suggestDoctor,
        urgencyLevel: aiResponse.urgencyLevel,
        needsReportUpload: aiResponse.needsReportUpload,
      };

      // If user wants to upload reports, include upload endpoint info
      if (aiResponse.needsReportUpload) {
        response.uploadInfo = {
          endpoint: '/api/health-score/upload',
          sessionId: session.id, // Link upload to this triage session
          instructions: 'Puoi caricare i tuoi referti medici (PDF o immagini) per un\'analisi AI personalizzata. I dati saranno anonimizzati automaticamente per garantire la tua privacy.',
          acceptedFormats: ['PDF', 'JPEG', 'PNG'],
          maxSize: '10MB',
        };
      }

      res.json(response);
    } catch (error: any) {
      console.error('Start triage error:', error);
      res.status(500).json({ message: error.message || 'Failed to start triage session' });
    }
  });

  // Send message to triage session (POST /api/triage/:sessionId/message) - Public endpoint for educational access
  app.post('/api/triage/:sessionId/message', aiGenerationLimiter, async (req, res) => {
    try {
      const user = req.user as any;
      const { content, language } = req.body;
      const sessionId = req.params.sessionId;

      if (!content) {
        return res.status(400).json({ message: 'Message content is required' });
      }

      // Verify session exists
      const session = await storage.getTriageSessionById(sessionId);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      // Verify session ownership (only for authenticated users with userId)
      if (user?.id && session.userId && session.userId !== user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      if (session.status === 'closed') {
        return res.status(400).json({ message: 'Session is closed' });
      }

      // Check token usage for authenticated users (monthly limits)
      if (user?.id) {
        const tokenUsage = await storage.getOrCreateTokenUsage(user.id);
        const TOKEN_LIMITS = {
          free: 30,
          premium: 1000,
          premium_plus: -1, // Unlimited
        };
        
        const userTier = user.subscriptionTier || 'free';
        const limit = TOKEN_LIMITS[userTier as keyof typeof TOKEN_LIMITS] || TOKEN_LIMITS.free;
        
        // Estimate tokens: user message + expected AI response (assume AI response is 2x user message)
        // This prevents token overrun since we track both user and assistant tokens
        const estimatedUserTokens = Math.ceil(content.length / 4);
        const estimatedAiTokens = estimatedUserTokens * 2; // Conservative estimate
        const estimatedTotalTokens = estimatedUserTokens + estimatedAiTokens;
        
        if (limit !== -1 && tokenUsage.tokensUsed + estimatedTotalTokens > limit) {
          return res.status(403).json({ 
            message: `Hai raggiunto il limite mensile di ${limit} token. Passa a Premium per continuare.`,
            requiresUpgrade: true,
            tokenLimit: limit,
            tokensUsed: tokenUsage.tokensUsed,
            tokensRemaining: Math.max(0, limit - tokenUsage.tokensUsed),
            tier: userTier
          });
        }
      }

      // Check message limit for free/anonymous users (30 messages per session)
      const existingMessages = await storage.getTriageMessagesBySession(sessionId);
      const userMessageCount = existingMessages.filter(m => m.role === 'user').length;
      
      const isFreeUser = !user || !user.isPremium;
      const MESSAGE_LIMIT = 30;
      
      if (isFreeUser && userMessageCount >= MESSAGE_LIMIT) {
        return res.status(403).json({ 
          message: 'Limite messaggi raggiunto. Abbonati per continuare la conversazione.',
          requiresUpgrade: true,
          messageLimit: MESSAGE_LIMIT,
          messagesUsed: userMessageCount
        });
      }

      // Create user message
      const userMessage = await storage.createTriageMessage({
        sessionId,
        role: 'user',
        content,
      });

      // Get conversation history
      const messages = await storage.getTriageMessagesBySession(sessionId);
      const history = messages.map(m => ({ role: m.role, content: m.content }));

      // Get AI response (pass user's first name for personalization if available)
      const aiResponse = await generateTriageResponse(
        content, 
        history, 
        undefined, 
        user?.firstName
      );

      // Final token check AFTER AI generation (for authenticated users)
      if (user?.id) {
        const actualTokens = Math.ceil((content.length + aiResponse.message.length) / 4);
        const tokenUsage = await storage.getOrCreateTokenUsage(user.id);
        const TOKEN_LIMITS = {
          free: 30,
          premium: 1000,
          premium_plus: -1,
        };
        const userTier = user.subscriptionTier || 'free';
        const limit = TOKEN_LIMITS[userTier as keyof typeof TOKEN_LIMITS] || TOKEN_LIMITS.free;
        
        if (limit !== -1 && tokenUsage.tokensUsed + actualTokens > limit) {
          return res.status(403).json({ 
            message: `Hai raggiunto il limite mensile di ${limit} token. Passa a Premium per continuare.`,
            requiresUpgrade: true,
            tokenLimit: limit,
            tokensUsed: tokenUsage.tokensUsed,
            tokensRemaining: Math.max(0, limit - tokenUsage.tokensUsed),
            tier: userTier
          });
        }
      }

      // Save AI response
      const aiMessage = await storage.createTriageMessage({
        sessionId,
        role: 'assistant',
        content: aiResponse.message,
      });

      // Check for sensitive flags and create alerts (only for authenticated users)
      if ((aiResponse.isSensitive || aiResponse.suggestDoctor) && user?.id) {
        await storage.createTriageAlert({
          userId: user.id,
          sessionId,
          urgencyLevel: aiResponse.urgencyLevel,
          alertType: aiResponse.isSensitive ? 'sensitive_topic' : 'doctor_referral',
          reason: `Urgency: ${aiResponse.urgencyLevel}. Related topics: ${aiResponse.relatedTopics.join(', ')}`,
          isReviewed: false,
        });
      }

      // Track token usage for authenticated users
      if (user?.id) {
        const estimatedTokens = Math.ceil((content.length + aiResponse.message.length) / 4);
        const now = new Date();
        const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        try {
          await storage.upsertUserTokenUsage(user.id, monthYear, estimatedTokens);
        } catch (tokenError) {
          console.error('Error tracking token usage:', tokenError);
          // Don't fail the request if token tracking fails
        }
      }

      // Build response with upload instructions if needed
      const response: any = {
        userMessage,
        aiMessage,
        suggestDoctor: aiResponse.suggestDoctor,
        urgencyLevel: aiResponse.urgencyLevel,
        needsReportUpload: aiResponse.needsReportUpload,
      };

      // If user wants to upload reports, include upload endpoint info
      if (aiResponse.needsReportUpload) {
        response.uploadInfo = {
          endpoint: '/api/health-score/upload',
          sessionId: sessionId, // Link upload to this triage session
          instructions: 'Puoi caricare i tuoi referti medici (PDF o immagini) per un\'analisi AI personalizzata. I dati saranno anonimizzati automaticamente per garantire la tua privacy.',
          acceptedFormats: ['PDF', 'JPEG', 'PNG'],
          maxSize: '10MB',
        };
      }

      res.json(response);
    } catch (error: any) {
      console.error('Send triage message error:', error);
      res.status(500).json({ message: error.message || 'Failed to send message' });
    }
  });

  // Get triage session (GET /api/triage/:sessionId)
  app.get('/api/triage/:sessionId', async (req, res) => {
    try {
      const user = req.user as any;
      const sessionId = req.params.sessionId;

      const session = await storage.getTriageSessionById(sessionId);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      // Check ownership only if user is authenticated
      if (user && session.userId && session.userId !== user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const messages = await storage.getTriageMessagesBySession(sessionId);
      const alerts = await storage.getTriageAlertsBySession(sessionId);

      res.json({ session, messages, alerts });
    } catch (error: any) {
      console.error('Get triage session error:', error);
      res.status(500).json({ message: error.message || 'Failed to get session' });
    }
  });

  // Get triage messages (GET /api/triage/messages/:sessionId)
  app.get('/api/triage/messages/:sessionId', async (req, res) => {
    try {
      const user = req.user as any;
      const sessionId = req.params.sessionId;

      const session = await storage.getTriageSessionById(sessionId);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      // Check ownership only if user is authenticated
      if (user && session.userId && session.userId !== user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const messages = await storage.getTriageMessagesBySession(sessionId);
      res.json(messages);
    } catch (error: any) {
      console.error('Get triage messages error:', error);
      res.status(500).json({ message: error.message || 'Failed to get messages' });
    }
  });

  // Get user's triage sessions (GET /api/triage/user/sessions)
  app.get('/api/triage/user/sessions', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const sessions = await storage.getTriageSessionsByUser(user.id);
      res.json(sessions);
    } catch (error: any) {
      console.error('Get user triage sessions error:', error);
      res.status(500).json({ message: error.message || 'Failed to get sessions' });
    }
  });

  // Get active triage session (GET /api/triage/session/active)
  app.get('/api/triage/session/active', async (req, res) => {
    try {
      const user = req.user as any;
      
      // Anonymous users don't have saved sessions
      if (!user) {
        return res.json(null);
      }
      
      const sessions = await storage.getTriageSessionsByUser(user.id);
      const activeSession = sessions.find(s => s.status === 'active');
      res.json(activeSession || null);
    } catch (error: any) {
      console.error('Get active triage session error:', error);
      res.status(500).json({ message: error.message || 'Failed to get active session' });
    }
  });

  // Close triage session (POST /api/triage/:sessionId/close)
  app.post('/api/triage/:sessionId/close', async (req, res) => {
    try {
      const user = req.user as any;
      const sessionId = req.params.sessionId;

      const session = await storage.getTriageSessionById(sessionId);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      // Check ownership only if user is authenticated
      if (user && session.userId && session.userId !== user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const closedSession = await storage.closeTriageSession(sessionId);
      res.json(closedSession);
    } catch (error: any) {
      console.error('Close triage session error:', error);
      res.status(500).json({ message: error.message || 'Failed to close session' });
    }
  });

  // Admin: Get unreviewed triage alerts (GET /api/admin/triage/alerts/unreviewed)
  app.get('/api/admin/triage/alerts/unreviewed', isAdmin, async (req, res) => {
    try {
      const alerts = await storage.getUnreviewedTriageAlerts();
      res.json(alerts);
    } catch (error: any) {
      console.error('Get unreviewed alerts error:', error);
      res.status(500).json({ message: error.message || 'Failed to get alerts' });
    }
  });

  // Admin: Mark alert as reviewed (PATCH /api/admin/triage/alerts/:id/review)
  app.patch('/api/admin/triage/alerts/:id/review', isAdmin, async (req, res) => {
    try {
      const user = req.user as any;
      const { reviewNotes } = req.body;
      const alert = await storage.updateTriageAlert(req.params.id, {
        isReviewed: true,
        reviewedAt: new Date(),
        reviewedById: user.id,
        reviewNotes: reviewNotes || null,
      });
      res.json(alert);
    } catch (error: any) {
      console.error('Review alert error:', error);
      res.status(500).json({ message: error.message || 'Failed to review alert' });
    }
  });

  // ========== PROHMED CODES ROUTES ==========

  // Get all Prohmed codes (GET /api/prohmed-codes) - ADMIN ONLY
  app.get('/api/prohmed-codes', isAdmin, async (req, res) => {
    try {
      const codes = await storage.getAllProhmedCodes();
      // Transform to match frontend expected format
      const transformedCodes = codes.map(c => ({
        id: c.id,
        code: c.code,
        type: c.accessType,
        isRedeemed: c.status === 'redeemed',
        redeemedById: c.userId,
        redeemedAt: c.redeemedAt,
        expiresAt: c.expiresAt,
        createdAt: c.createdAt,
      }));
      res.json(transformedCodes);
    } catch (error: any) {
      console.error('Get all Prohmed codes error:', error);
      res.status(500).json({ message: error.message || 'Failed to get codes' });
    }
  });

  // Generate Prohmed codes in bulk (POST /api/prohmed-codes/generate) - ADMIN ONLY
  app.post('/api/prohmed-codes/generate', isAdmin, async (req, res) => {
    try {
      const { type, count } = req.body;

      if (!type || !count || count < 1 || count > 100) {
        return res.status(400).json({ message: 'Valid type and count (1-100) are required' });
      }

      const codes = await storage.createProhmedCodesBulk(count, type);
      res.json({ success: true, count: codes.length, codes });
    } catch (error: any) {
      console.error('Generate Prohmed codes bulk error:', error);
      res.status(500).json({ message: error.message || 'Failed to generate codes' });
    }
  });
  
  // Generate Prohmed code (POST /api/prohmed/codes/generate) - ADMIN ONLY
  app.post('/api/prohmed/codes/generate', isAdmin, async (req, res) => {
    try {
      const { userId, source, sourceDetails } = req.body;

      if (!userId || !source) {
        return res.status(400).json({ message: 'User ID and source are required' });
      }

      // Generate unique code
      const code = `PROHMED-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const prohmедCode = await storage.createProhmedCode({
        userId,
        code,
        source, // 'crossword_winner', 'full_plus_subscriber', 'manual_admin'
        sourceDetails: sourceDetails || null,
        status: 'active',
      });

      res.json(prohmедCode);
    } catch (error: any) {
      console.error('Generate Prohmed code error:', error);
      res.status(500).json({ message: error.message || 'Failed to generate code' });
    }
  });

  // Get user's Prohmed codes (GET /api/prohmed/codes/my)
  app.get('/api/prohmed/codes/my', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const codes = await storage.getProhmedCodesByUser(user.id);
      res.json(codes);
    } catch (error: any) {
      console.error('Get Prohmed codes error:', error);
      res.status(500).json({ message: error.message || 'Failed to get codes' });
    }
  });

  // Verify Prohmed code (GET /api/prohmed/codes/verify/:code)
  app.get('/api/prohmed/codes/verify/:code', async (req, res) => {
    try {
      const code = await storage.getProhmedCodeByCode(req.params.code);
      if (!code) {
        return res.status(404).json({ message: 'Code not found' });
      }
      res.json({ valid: code.status === 'active', code });
    } catch (error: any) {
      console.error('Verify Prohmed code error:', error);
      res.status(500).json({ message: error.message || 'Failed to verify code' });
    }
  });

  // Redeem Prohmed code (POST /api/prohmed/codes/redeem/:code)
  app.post('/api/prohmed/codes/redeem/:code', async (req, res) => {
    try {
      const codeRecord = await storage.getProhmedCodeByCode(req.params.code);
      if (!codeRecord) {
        return res.status(404).json({ message: 'Code not found' });
      }
      if (codeRecord.status !== 'active') {
        return res.status(400).json({ message: 'Code already redeemed or expired' });
      }

      const redeemedCode = await storage.redeemProhmedCode(req.params.code);
      res.json(redeemedCode);
    } catch (error: any) {
      console.error('Redeem Prohmed code error:', error);
      res.status(500).json({ message: error.message || 'Failed to redeem code' });
    }
  });

  // Generate Prohmed codes for weekly crossword winners (POST /api/prohmed/codes/generate-weekly-winners) - ADMIN ONLY
  app.post('/api/prohmed/codes/generate-weekly-winners', isAdmin, async (req, res) => {
    try {
      let { weekNumber, weekYear } = req.body;
      
      // Use current week if not specified (consistent with crossword system)
      const now = new Date();
      const targetWeekNumber = weekNumber ? parseInt(weekNumber, 10) : Math.ceil(now.getDate() / 7);
      const targetWeekYear = weekYear ? parseInt(weekYear, 10) : now.getFullYear();

      if (isNaN(targetWeekNumber) || isNaN(targetWeekYear)) {
        return res.status(400).json({ message: 'Invalid week number or year' });
      }

      // Get top 3 from leaderboard
      const leaderboard = await storage.getCrosswordLeaderboardByWeek(targetWeekNumber, targetWeekYear);
      const top3 = leaderboard
        .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
        .slice(0, 3);

      if (top3.length === 0) {
        return res.status(404).json({ message: 'No winners found for this week' });
      }

      // Generate family codes for top 3
      const generatedCodes = [];
      const skippedWinners = [];
      
      for (const winner of top3) {
        // Check if winner already has a code for this week (structured check)
        const existingCodes = await storage.getProhmedCodesByUser(winner.userId);
        const hasWeeklyCode = existingCodes.some(
          c => c.source === 'crossword_winner' && 
          c.sourceDetails === `W${targetWeekNumber}/${targetWeekYear}`
        );

        if (!hasWeeklyCode) {
          const code = `PROHMED-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          const prohmedCode = await storage.createProhmedCode({
            userId: winner.userId,
            code,
            accessType: 'family', // Family plan for winners
            source: 'crossword_winner',
            sourceDetails: `W${targetWeekNumber}/${targetWeekYear}`, // Structured format for exact matching
            status: 'active',
          });
          generatedCodes.push(prohmedCode);
        } else {
          skippedWinners.push({ userId: winner.userId, reason: 'Already has code for this week' });
        }
      }

      res.json({
        week: `${targetWeekNumber}/${targetWeekYear}`,
        winners: top3.length,
        codesGenerated: generatedCodes.length,
        skipped: skippedWinners.length,
        codes: generatedCodes,
        skippedWinners,
      });
    } catch (error: any) {
      console.error('Generate weekly winners codes error:', error);
      res.status(500).json({ message: error.message || 'Failed to generate codes for winners' });
    }
  });

  // ========== CROSSWORD GAME ROUTES ==========
  
  // Get all crossword puzzles (GET /api/crossword/puzzles)
  app.get('/api/crossword/puzzles', isAuthenticated, async (req, res) => {
    try {
      const activeOnly = req.query.activeOnly === 'true';
      const puzzles = await storage.getAllCrosswordPuzzles(activeOnly);
      res.json(puzzles);
    } catch (error: any) {
      console.error('Get crossword puzzles error:', error);
      res.status(500).json({ message: error.message || 'Failed to get puzzles' });
    }
  });

  // Get weekly crossword challenge (GET /api/crossword/weekly-challenge)
  app.get('/api/crossword/weekly-challenge', isAuthenticated, async (req, res) => {
    try {
      const now = new Date();
      const weekNumber = Math.ceil((now.getDate()) / 7);
      const weekYear = now.getFullYear();

      const puzzle = await storage.getWeeklyCrosswordChallenge(weekNumber, weekYear);
      if (!puzzle) {
        return res.status(404).json({ message: 'No weekly challenge available' });
      }

      res.json(puzzle);
    } catch (error: any) {
      console.error('Get weekly challenge error:', error);
      res.status(500).json({ message: error.message || 'Failed to get weekly challenge' });
    }
  });

  // Generate crossword puzzle with AI (POST /api/crossword/puzzles/generate) - ADMIN ONLY
  app.post('/api/crossword/puzzles/generate', isAdmin, async (req, res) => {
    try {
      const user = req.user as any;
      const { topic, difficulty, isWeeklyChallenge } = req.body;

      if (!topic || !difficulty) {
        return res.status(400).json({ message: 'Topic and difficulty are required' });
      }

      // Generate crossword with Gemini AI
      const crosswordData = await generateCrosswordPuzzle(topic, difficulty as 'easy' | 'medium' | 'hard');

      // Calculate week number if it's a weekly challenge
      let weekNumber = null;
      let weekYear = null;
      if (isWeeklyChallenge) {
        const now = new Date();
        weekNumber = Math.ceil((now.getDate()) / 7);
        weekYear = now.getFullYear();
      }

      const puzzle = await storage.createCrosswordPuzzle({
        title: crosswordData.title,
        topic,
        difficulty,
        cluesData: crosswordData.clues,
        gridData: crosswordData.grid,
        isWeeklyChallenge: isWeeklyChallenge || false,
        weekNumber,
        weekYear,
        createdById: user.id,
        isActive: true,
      });

      res.json(puzzle);
    } catch (error: any) {
      console.error('Generate crossword error:', error);
      res.status(500).json({ message: error.message || 'Failed to generate crossword' });
    }
  });

  // Get crossword puzzle by ID (GET /api/crossword/puzzles/:id)
  app.get('/api/crossword/puzzles/:id', isAuthenticated, async (req, res) => {
    try {
      const puzzle = await storage.getCrosswordPuzzleById(req.params.id);
      if (!puzzle) {
        return res.status(404).json({ message: 'Puzzle not found' });
      }
      
      // Create empty grid with same dimensions (hide solutions from user)
      const emptyGrid = (puzzle.gridData as any[][]).map((row: any[]) => 
        row.map((cell: any) => cell ? '' : null)
      );
      
      // Return puzzle with empty grid - solutions hidden
      res.json({
        ...puzzle,
        gridData: emptyGrid
      });
    } catch (error: any) {
      console.error('Get crossword puzzle error:', error);
      res.status(500).json({ message: error.message || 'Failed to get puzzle' });
    }
  });

  // Start crossword attempt (POST /api/crossword/attempts/start)
  app.post('/api/crossword/attempts/start', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { puzzleId } = req.body;

      if (!puzzleId) {
        return res.status(400).json({ message: 'Puzzle ID is required' });
      }

      // Check if user already has an attempt for this puzzle
      const existing = await storage.getCrosswordAttemptByUserAndPuzzle(user.id, puzzleId);
      if (existing) {
        return res.json(existing);
      }

      const attempt = await storage.createCrosswordAttempt({
        userId: user.id,
        puzzleId,
        status: 'in_progress',
        progressData: {},
        hintsUsed: 0,
      });

      res.json(attempt);
    } catch (error: any) {
      console.error('Start crossword attempt error:', error);
      res.status(500).json({ message: error.message || 'Failed to start attempt' });
    }
  });

  // Update crossword attempt progress (PATCH /api/crossword/attempts/:id)
  app.patch('/api/crossword/attempts/:id', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { progressData, hintsUsed, status, timeSpent, score } = req.body;

      const existing = await storage.getCrosswordAttemptById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: 'Attempt not found' });
      }
      if (existing.userId !== user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const updates: any = {};
      if (progressData !== undefined) updates.progressData = progressData;
      if (hintsUsed !== undefined) updates.hintsUsed = hintsUsed;
      if (status !== undefined) {
        updates.status = status;
        if (status === 'completed') {
          updates.completedAt = new Date();
          if (timeSpent !== undefined) updates.timeSpent = timeSpent;
          if (score !== undefined) updates.score = score;
        }
      }

      const attempt = await storage.updateCrosswordAttempt(req.params.id, updates);
      res.json(attempt);
    } catch (error: any) {
      console.error('Update crossword attempt error:', error);
      res.status(500).json({ message: error.message || 'Failed to update attempt' });
    }
  });

  // Submit crossword completion (POST /api/crossword/attempts/:id/complete)
  app.post('/api/crossword/attempts/:id/complete', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { timeSpentSeconds, accuracy, hintsUsed } = req.body;

      const attempt = await storage.getCrosswordAttemptById(req.params.id);
      if (!attempt) {
        return res.status(404).json({ message: 'Attempt not found' });
      }
      if (attempt.userId !== user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Mark as completed
      const completedAttempt = await storage.updateCrosswordAttempt(req.params.id, {
        status: 'completed',
        completedAt: new Date(),
        timeSpent: timeSpentSeconds || 0,
        correctAnswers: Math.round((accuracy || 0) * 100),
        hintsUsed: hintsUsed || 0,
        score: Math.round((accuracy || 0) * 1000 - (hintsUsed || 0) * 50),
      });

      // Get puzzle to check if it's a weekly challenge
      const puzzle = await storage.getCrosswordPuzzleById(attempt.puzzleId);
      
      if (puzzle?.isWeeklyChallenge && puzzle.weekNumber && puzzle.weekYear) {
        // Calculate score (higher accuracy, less time, fewer hints = better score)
        const baseScore = (accuracy || 0) * 100;
        const timeBonus = Math.max(0, 1000 - timeSpentSeconds);
        const hintPenalty = (hintsUsed || 0) * 50;
        const totalScore = Math.round(baseScore + timeBonus - hintPenalty);

        // Update leaderboard
        await storage.upsertCrosswordLeaderboard({
          userId: user.id,
          weekNumber: puzzle.weekNumber,
          weekYear: puzzle.weekYear,
          totalScore,
          puzzlesCompleted: 1,
          averageTime: timeSpentSeconds,
        });
      }

      res.json(completedAttempt);
    } catch (error: any) {
      console.error('Complete crossword attempt error:', error);
      res.status(500).json({ message: error.message || 'Failed to complete attempt' });
    }
  });

  // Get user's crossword attempts (GET /api/crossword/attempts/my)
  app.get('/api/crossword/attempts/my', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const attempts = await storage.getCrosswordAttemptsByUser(user.id);
      res.json(attempts);
    } catch (error: any) {
      console.error('Get crossword attempts error:', error);
      res.status(500).json({ message: error.message || 'Failed to get attempts' });
    }
  });

  // Get weekly leaderboard (GET /api/crossword/leaderboard/weekly)
  app.get('/api/crossword/leaderboard/weekly', isAuthenticated, async (req, res) => {
    try {
      const now = new Date();
      const weekNumber = Math.ceil((now.getDate()) / 7);
      const weekYear = now.getFullYear();

      const leaderboard = await storage.getCrosswordLeaderboardByWeek(weekNumber, weekYear);
      res.json(leaderboard);
    } catch (error: any) {
      console.error('Get weekly leaderboard error:', error);
      res.status(500).json({ message: error.message || 'Failed to get leaderboard' });
    }
  });

  // Get user's leaderboard history (GET /api/crossword/leaderboard/my)
  app.get('/api/crossword/leaderboard/my', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const history = await storage.getCrosswordLeaderboardByUser(user.id);
      res.json(history);
    } catch (error: any) {
      console.error('Get leaderboard history error:', error);
      res.status(500).json({ message: error.message || 'Failed to get history' });
    }
  });

  // ========== HEALTH SCORE ROUTES ==========

  // Upload and analyze medical report (POST /api/health-score/upload)
  app.post('/api/health-score/upload', isAuthenticated, uploadMedicalReport.single('report'), async (req, res) => {
    try {
      const user = req.user as any;
      
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const { triageSessionId, userConsent } = req.body;
      
      // Validate user consent (required for GDPR compliance)
      if (userConsent !== 'true') {
        // Delete uploaded file if no consent
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'User consent is required to process medical reports' });
      }

      const filePath = req.file.path;
      const fileType = req.file.mimetype;

      // Validate file is not empty or too small
      if (req.file.size < 100) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ 
          message: 'Il file caricato è vuoto o danneggiato. Carica un referto medico valido.' 
        });
      }

      // Step 1: Extract text from medical report (OCR)
      const ocrResult = await extractTextFromMedicalReport(filePath, fileType);

      // Step 2: Anonymize extracted text (PII removal)
      const anonymizationResult = await anonymizeMedicalText(ocrResult.extractedText);

      // Step 3: Create health report record
      const healthReport = await storage.createHealthReport({
        userId: user.id,
        triageSessionId: triageSessionId || null,
        reportType: ocrResult.reportType,
        fileName: req.file.originalname,
        fileType: fileType,
        fileSize: req.file.size,
        filePath: `medical-reports/${path.basename(filePath)}`,
        originalText: ocrResult.extractedText,
        anonymizedText: anonymizationResult.anonymizedText,
        detectedLanguage: ocrResult.detectedLanguage,
        medicalKeywords: ocrResult.medicalKeywords,
        extractedValues: ocrResult.extractedValues,
        aiSummary: ocrResult.summary,
        issuer: ocrResult.issuer || null,
        reportDate: ocrResult.reportDate ? new Date(ocrResult.reportDate) : null,
        isAnonymized: true,
        removedPiiTypes: anonymizationResult.removedPiiTypes,
        userConsent: true,
      });

      res.json({
        success: true,
        reportId: healthReport.id,
        report: healthReport,
        ocrConfidence: ocrResult.confidence,
        piiRemoved: anonymizationResult.piiCount,
      });
    } catch (error: any) {
      console.error('Upload medical report error:', error);
      // Clean up file on error
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: error.message || 'Failed to upload medical report' });
    }
  });

  // Calculate health score based on reports (POST /api/health-score/calculate)
  app.post('/api/health-score/calculate', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Get user's health reports
      const reports = await storage.getHealthReportsByUser(user.id);
      
      if (reports.length === 0) {
        return res.status(400).json({ 
          message: 'No health reports found. Please upload at least one medical report first.' 
        });
      }

      // Calculate health score using Gemini AI
      const reportsData = reports.map(r => ({
        reportType: r.reportType,
        keywords: r.medicalKeywords,
        values: r.extractedValues,
        summary: r.aiSummary,
        date: r.createdAt,
      }));

      const scorePrompt = `
Analyze these medical reports and calculate a health score (0-100):
${JSON.stringify(reportsData, null, 2)}

Provide:
1. Overall health score (0-100, where 100 is excellent health)
2. Lifestyle score (0-100): diet, exercise, sleep patterns
3. Lab results score (0-100): based on medical test values
4. Symptom score (0-100): severity and frequency of symptoms
5. Risk factors score (0-100): identified health risks
6. Key insights about the health status
7. Trend direction (improving, stable, declining)
8. Recommendations for improvement

Format as JSON: {
  "overallScore": number,
  "lifestyleScore": number,
  "labResultsScore": number,
  "symptomScore": number,
  "riskFactorsScore": number,
  "scoreInsights": string[],
  "trendDirection": string,
  "recommendations": string[]
}`;

      const aiResponse = await generateGeminiContent(scorePrompt);
      const scoreData = JSON.parse(aiResponse);

      // Create health score history entry
      const scoreHistory = await storage.createHealthScoreHistory({
        userId: user.id,
        overallScore: scoreData.overallScore,
        lifestyleScore: scoreData.lifestyleScore || null,
        labResultsScore: scoreData.labResultsScore || null,
        symptomScore: scoreData.symptomScore || null,
        riskFactorsScore: scoreData.riskFactorsScore || null,
        scoreInsights: scoreData.scoreInsights || [],
        trendDirection: scoreData.trendDirection || 'stable',
        contributingReportIds: reports.map(r => r.id),
      });

      // Create health insights for high-priority recommendations
      const insights = await Promise.all(
        scoreData.recommendations.slice(0, 3).map((rec: string, idx: number) => 
          storage.createHealthInsight({
            userId: user.id,
            insightType: 'recommendation',
            category: 'general',
            title: `Health Recommendation ${idx + 1}`,
            description: rec,
            priority: idx === 0 ? 'high' : idx === 1 ? 'medium' : 'low',
            status: 'active',
            basedOnReportIds: reports.map(r => r.id),
          })
        )
      );

      res.json({
        success: true,
        score: scoreHistory,
        insights: insights,
      });
    } catch (error: any) {
      console.error('Calculate health score error:', error);
      res.status(500).json({ message: error.message || 'Failed to calculate health score' });
    }
  });

  // Get user's health reports (GET /api/health-score/reports)
  app.get('/api/health-score/reports', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const reports = await storage.getHealthReportsByUser(user.id);
      res.json(reports);
    } catch (error: any) {
      console.error('Get health reports error:', error);
      res.status(500).json({ message: error.message || 'Failed to get health reports' });
    }
  });

  // Get reports for a triage session (GET /api/health-score/reports/triage/:sessionId)
  app.get('/api/health-score/reports/triage/:sessionId', isAuthenticated, async (req, res) => {
    try {
      const reports = await storage.getHealthReportsByTriageSession(req.params.sessionId);
      res.json(reports);
    } catch (error: any) {
      console.error('Get triage reports error:', error);
      res.status(500).json({ message: error.message || 'Failed to get triage reports' });
    }
  });

  // Get user's health score history (GET /api/health-score/history)
  app.get('/api/health-score/history', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const limit = parseInt(req.query.limit as string) || 10;
      const history = await storage.getHealthScoreHistory(user.id, limit);
      res.json(history);
    } catch (error: any) {
      console.error('Get health score history error:', error);
      res.status(500).json({ message: error.message || 'Failed to get health score history' });
    }
  });

  // Get latest health score (GET /api/health-score/latest)
  app.get('/api/health-score/latest', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const latestScore = await storage.getLatestHealthScore(user.id);
      
      if (!latestScore) {
        return res.status(404).json({ message: 'No health score found. Please upload medical reports first.' });
      }

      res.json(latestScore);
    } catch (error: any) {
      console.error('Get latest health score error:', error);
      res.status(500).json({ message: error.message || 'Failed to get latest health score' });
    }
  });

  // Get user's health insights (GET /api/health-score/insights)
  app.get('/api/health-score/insights', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const statusFilter = req.query.status as string | undefined;
      const insights = await storage.getHealthInsightsByUser(user.id, statusFilter);
      res.json(insights);
    } catch (error: any) {
      console.error('Get health insights error:', error);
      res.status(500).json({ message: error.message || 'Failed to get health insights' });
    }
  });

  // Acknowledge health insight (POST /api/health-score/insights/:id/acknowledge)
  app.post('/api/health-score/insights/:id/acknowledge', isAuthenticated, async (req, res) => {
    try {
      const insight = await storage.acknowledgeHealthInsight(req.params.id);
      res.json(insight);
    } catch (error: any) {
      console.error('Acknowledge health insight error:', error);
      res.status(500).json({ message: error.message || 'Failed to acknowledge insight' });
    }
  });

  // Resolve health insight (POST /api/health-score/insights/:id/resolve)
  app.post('/api/health-score/insights/:id/resolve', isAuthenticated, async (req, res) => {
    try {
      const insight = await storage.resolveHealthInsight(req.params.id);
      res.json(insight);
    } catch (error: any) {
      console.error('Resolve health insight error:', error);
      res.status(500).json({ message: error.message || 'Failed to resolve insight' });
    }
  });

  // Delete health report (DELETE /api/health-score/reports/:id)
  app.delete('/api/health-score/reports/:id', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const report = await storage.getHealthReportById(req.params.id);
      
      if (!report) {
        return res.status(404).json({ message: 'Health report not found' });
      }

      // Check ownership
      if (report.userId !== user.id && !user.isAdmin) {
        return res.status(403).json({ message: 'Not authorized to delete this report' });
      }

      // Delete physical file
      if (report.filePath) {
        const fullPath = path.join(process.cwd(), 'public', report.filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }

      // Delete database record
      await storage.deleteHealthReport(req.params.id);
      
      res.json({ message: 'Health report deleted successfully' });
    } catch (error: any) {
      console.error('Delete health report error:', error);
      res.status(500).json({ message: error.message || 'Failed to delete health report' });
    }
  });

  // ===========================
  // Webinar Health Endpoints
  // ===========================

  // Get all webinar health courses (GET /api/webinar-health) - PUBLIC ENDPOINT
  app.get('/api/webinar-health', async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user?.id;
      
      // Get all active live courses (public access, no user filter for anonymous)
      const courses = await storage.getAllLiveCourses(userId);
      
      // Filter for webinar health courses (using isWebinarHealth flag)
      const webinarCourses = courses.filter(course => course.isWebinarHealth === true);
      
      // Get sessions for each webinar with enrollment status
      const webinarsWithSessions = await Promise.all(
        webinarCourses.map(async (course) => {
          const sessions = await storage.getSessionsByCourseId(course.id);
          
          // Check if user is enrolled in each session (only for authenticated users)
          const sessionsWithEnrollment = await Promise.all(
            sessions.map(async (session) => {
              const enrollment = userId 
                ? await storage.getUserEnrollmentForSession(userId, session.id)
                : null;
              return {
                ...session,
                enrolled: session.enrolled || 0,
                isUserEnrolled: !!enrollment,
              };
            })
          );
          
          return {
            ...course,
            sessions: sessionsWithEnrollment,
          };
        })
      );
      
      res.json(webinarsWithSessions);
    } catch (error: any) {
      console.error('Get webinar health error:', error);
      res.status(500).json({ message: error.message || 'Failed to get webinar health courses' });
    }
  });

  // Enroll in webinar (POST /api/webinar-health/enroll/:sessionId)
  app.post('/api/webinar-health/enroll/:sessionId', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const sessionId = req.params.sessionId;
      
      // Get session details
      const session = await storage.getSessionById(sessionId);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      // Get course details
      const course = await storage.getLiveCourseById(session.courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      
      // Check if already enrolled
      const existingEnrollment = await storage.getUserEnrollmentForSession(user.id, sessionId);
      if (existingEnrollment) {
        return res.status(400).json({ message: 'Already enrolled in this webinar' });
      }
      
      // Check capacity
      if (session.capacity && session.enrolled && session.enrolled >= session.capacity) {
        return res.status(400).json({ message: 'Webinar is full' });
      }
      
      // Check if session has already started
      if (new Date(session.endDate) < new Date()) {
        return res.status(400).json({ message: 'This webinar has already ended' });
      }
      
      // Create enrollment (free for webinars)
      const enrollment = await storage.createLiveCourseEnrollment({
        userId: user.id,
        courseId: course.id,
        sessionId: session.id,
        amountPaid: 0, // Free webinar
        enrollmentDate: new Date(),
        status: 'confirmed',
      });
      
      // Update session enrolled count
      await storage.updateLiveCourseSession(sessionId, {
        enrolled: (session.enrolled || 0) + 1,
      });
      
      // Send confirmation email with webinar details
      try {
        const emailSubject = `Conferma iscrizione: ${course.title}`;
        const emailContent = `
          <h2>Iscrizione Confermata!</h2>
          <p>Ciao ${user.firstName || user.email},</p>
          <p>La tua iscrizione al webinar è stata confermata con successo.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0;">${course.title}</h3>
            <p><strong>Data:</strong> ${new Date(session.startDate).toLocaleDateString('it-IT', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
            <p><strong>Orario:</strong> ${new Date(session.startDate).toLocaleTimeString('it-IT', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })} - ${new Date(session.endDate).toLocaleTimeString('it-IT', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}</p>
            ${course.instructor ? `<p><strong>Relatore:</strong> ${course.instructor}</p>` : ''}
          </div>
          
          <p>Riceverai un'email con il link per partecipare 24 ore prima dell'inizio del webinar.</p>
          
          <p>A presto,<br>Il Team CIRY</p>
        `;
        
        await sendEmail(user.email, emailSubject, emailContent);
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't fail the enrollment if email fails
      }
      
      res.json({ 
        success: true, 
        message: 'Enrollment successful',
        enrollment 
      });
    } catch (error: any) {
      console.error('Webinar enrollment error:', error);
      res.status(500).json({ message: error.message || 'Failed to enroll in webinar' });
    }
  });

  // ===========================
  // Admin Webinar Health Endpoints
  // ===========================

  // Get all webinar health courses for admin (GET /api/admin/webinar-health)
  app.get('/api/admin/webinar-health', isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Get all active live courses (admin override to see all courses)
      const courses = await storage.getAllLiveCourses(undefined, true);
      
      // Filter for webinar health courses (using isWebinarHealth flag)
      const webinarCourses = courses.filter(course => course.isWebinarHealth === true);
      
      // Get sessions for each webinar
      const webinarsWithSessions = await Promise.all(
        webinarCourses.map(async (course) => {
          const sessions = await storage.getSessionsByCourseId(course.id);
          return {
            ...course,
            sessions,
          };
        })
      );
      
      res.json(webinarsWithSessions);
    } catch (error: any) {
      console.error('Get admin webinar health error:', error);
      res.status(500).json({ message: error.message || 'Failed to get webinar health courses' });
    }
  });

  // Update streaming URL for session (POST /api/admin/webinar-health/streaming-url)
  app.post('/api/admin/webinar-health/streaming-url', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { sessionId, streamingUrl } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ message: 'Session ID is required' });
      }
      
      // Update session with streaming URL
      const session = await storage.updateLiveCourseSession(sessionId, {
        streamingUrl: streamingUrl || null,
      });
      
      res.json({ success: true, session });
    } catch (error: any) {
      console.error('Update streaming URL error:', error);
      res.status(500).json({ message: error.message || 'Failed to update streaming URL' });
    }
  });

  // Get enrollments for a session (GET /api/admin/webinar-health/enrollments/:sessionId)
  app.get('/api/admin/webinar-health/enrollments/:sessionId', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      
      // Get all enrollments for this session
      const enrollments = await db
        .select({
          id: liveCourseEnrollments.id,
          userId: liveCourseEnrollments.userId,
          enrolledAt: liveCourseEnrollments.enrolledAt,
          user: {
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
          },
        })
        .from(liveCourseEnrollments)
        .innerJoin(users, eq(liveCourseEnrollments.userId, users.id))
        .where(eq(liveCourseEnrollments.sessionId, sessionId))
        .orderBy(desc(liveCourseEnrollments.enrolledAt));
      
      res.json(enrollments);
    } catch (error: any) {
      console.error('Get session enrollments error:', error);
      res.status(500).json({ message: error.message || 'Failed to get session enrollments' });
    }
  });
  
  return httpServer;
}
