import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertUserQuizAttemptSchema } from "@shared/schema";
import { z } from "zod";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY. Please set this environment variable.');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

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
      res.json({ quiz, questions });
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

      // Create a one-time payment intent for €30
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 3000, // €30 in cents
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

  const httpServer = createServer(app);
  return httpServer;
}
