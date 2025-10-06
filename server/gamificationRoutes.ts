import type { Express } from "express";
import { storage } from "./storage";
import { isAuthenticated, isAdmin } from "./authSetup";
import { processQuizCompletion } from "./gamification";
import {
  insertBadgeSchema,
  insertAchievementSchema,
  insertDailyChallengeSchema,
} from "@shared/schema";
import { generateCertificateBuffer } from "./certificateGenerator";
import crypto from "crypto";
import { sendCertificateEarnedEmail } from "./email";

export function registerGamificationRoutes(app: Express): void {
  // ===============================================
  // BADGE ROUTES
  // ===============================================
  
  // Get all badges (public)
  app.get("/api/badges", async (req, res) => {
    try {
      const badges = await storage.getAllBadges();
      res.json(badges.filter(b => b.isActive));
    } catch (error: any) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });
  
  // Get user's badges (protected)
  app.get("/api/user/badges", isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userBadges = await storage.getUserBadges(req.user.id);
      res.json(userBadges);
    } catch (error: any) {
      console.error("Error fetching user badges:", error);
      res.status(500).json({ message: "Failed to fetch user badges" });
    }
  });
  
  // Admin: Create badge
  app.post("/api/admin/badges", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertBadgeSchema.parse(req.body);
      const badge = await storage.createBadge(validatedData);
      res.status(201).json(badge);
    } catch (error: any) {
      console.error("Error creating badge:", error);
      res.status(400).json({ message: error.message || "Failed to create badge" });
    }
  });
  
  // Admin: Update badge
  app.put("/api/admin/badges/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const badge = await storage.updateBadge(id, req.body);
      res.json(badge);
    } catch (error: any) {
      console.error("Error updating badge:", error);
      res.status(400).json({ message: error.message || "Failed to update badge" });
    }
  });
  
  // Admin: Delete badge
  app.delete("/api/admin/badges/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteBadge(id);
      res.json({ message: "Badge deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting badge:", error);
      res.status(500).json({ message: "Failed to delete badge" });
    }
  });
  
  // ===============================================
  // ACHIEVEMENT ROUTES
  // ===============================================
  
  // Get all achievements (public)
  app.get("/api/achievements", async (req, res) => {
    try {
      const achievements = await storage.getAllAchievements();
      res.json(achievements.filter(a => a.isActive));
    } catch (error: any) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });
  
  // Get user's achievements (protected)
  app.get("/api/user/achievements", isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userAchievements = await storage.getUserAchievements(req.user.id);
      res.json(userAchievements);
    } catch (error: any) {
      console.error("Error fetching user achievements:", error);
      res.status(500).json({ message: "Failed to fetch user achievements" });
    }
  });
  
  // Admin: Create achievement
  app.post("/api/admin/achievements", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertAchievementSchema.parse(req.body);
      const achievement = await storage.createAchievement(validatedData);
      res.status(201).json(achievement);
    } catch (error: any) {
      console.error("Error creating achievement:", error);
      res.status(400).json({ message: error.message || "Failed to create achievement" });
    }
  });
  
  // Admin: Update achievement
  app.put("/api/admin/achievements/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const achievement = await storage.updateAchievement(id, req.body);
      res.json(achievement);
    } catch (error: any) {
      console.error("Error updating achievement:", error);
      res.status(400).json({ message: error.message || "Failed to update achievement" });
    }
  });
  
  // Admin: Delete achievement
  app.delete("/api/admin/achievements/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAchievement(id);
      res.json({ message: "Achievement deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting achievement:", error);
      res.status(500).json({ message: "Failed to delete achievement" });
    }
  });
  
  // ===============================================
  // LEADERBOARD ROUTES
  // ===============================================
  
  // Get global leaderboard
  app.get("/api/leaderboard/global", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const period = (req.query.period as string) || 'all_time';
      
      const leaderboard = await storage.getGlobalLeaderboard(limit, period);
      res.json(leaderboard);
    } catch (error: any) {
      console.error("Error fetching global leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });
  
  // Get category leaderboard
  app.get("/api/leaderboard/category/:categoryId", async (req, res) => {
    try {
      const { categoryId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const period = (req.query.period as string) || 'all_time';
      
      const leaderboard = await storage.getCategoryLeaderboard(categoryId, limit, period);
      res.json(leaderboard);
    } catch (error: any) {
      console.error("Error fetching category leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });
  
  // Get user's leaderboard position
  app.get("/api/user/leaderboard-position", isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const categoryId = req.query.categoryId as string | undefined;
      const period = (req.query.period as string) || 'all_time';
      
      const position = await storage.getUserLeaderboardPosition(req.user.id, categoryId, period);
      res.json(position || null);
    } catch (error: any) {
      console.error("Error fetching user leaderboard position:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard position" });
    }
  });
  
  // ===============================================
  // DAILY CHALLENGE ROUTES
  // ===============================================
  
  // Get today's daily challenge
  app.get("/api/daily-challenge", isAuthenticated, async (req: any, res) => {
    try {
      const challenge = await storage.getTodayDailyChallenge();
      
      if (!challenge) {
        return res.json(null);
      }
      
      // Check if user has already completed it
      if (req.user) {
        const userStatus = await storage.getUserDailyChallengeStatus(req.user.id, challenge.id);
        res.json({ ...challenge, userStatus });
      } else {
        res.json(challenge);
      }
    } catch (error: any) {
      console.error("Error fetching daily challenge:", error);
      res.status(500).json({ message: "Failed to fetch daily challenge" });
    }
  });
  
  // Admin: Create daily challenge
  app.post("/api/admin/daily-challenge", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertDailyChallengeSchema.parse(req.body);
      const challenge = await storage.createDailyChallenge(validatedData);
      res.status(201).json(challenge);
    } catch (error: any) {
      console.error("Error creating daily challenge:", error);
      res.status(400).json({ message: error.message || "Failed to create daily challenge" });
    }
  });
  
  // ===============================================
  // CERTIFICATE ROUTES
  // ===============================================
  
  // Get user's certificates
  app.get("/api/user/certificates", isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const certificates = await storage.getUserCertificates(req.user.id);
      res.json(certificates);
    } catch (error: any) {
      console.error("Error fetching user certificates:", error);
      res.status(500).json({ message: "Failed to fetch certificates" });
    }
  });
  
  // Generate certificate for a quiz attempt
  app.post("/api/certificates/generate/:attemptId", isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { attemptId } = req.params;
      const userId = req.user.id;
      
      // Get the quiz attempt
      const attempt = await storage.getQuizAttemptById(attemptId);
      if (!attempt) {
        return res.status(404).json({ message: "Quiz attempt not found" });
      }
      
      // Verify the attempt belongs to the user
      if (attempt.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Check if score meets minimum threshold (70%)
      if (attempt.score < 70) {
        return res.status(400).json({ 
          message: "Certificate requires minimum score of 70%",
          currentScore: attempt.score 
        });
      }
      
      // Check if certificate already exists
      const existingCertificates = await storage.getUserCertificates(userId);
      const existingCertificate = existingCertificates.find(c => c.quizAttemptId === attemptId);
      
      if (existingCertificate) {
        return res.json(existingCertificate);
      }
      
      // Get user and quiz details
      const [user, quiz] = await Promise.all([
        storage.getUser(userId),
        storage.getQuizById(attempt.quizId),
      ]);
      
      if (!user || !quiz) {
        return res.status(404).json({ message: "User or quiz not found" });
      }
      
      // Generate verification code
      const verificationCode = crypto.randomBytes(8).toString('hex').toUpperCase();
      
      // Create certificate record
      const certificate = await storage.createCertificate({
        userId,
        quizId: quiz.id,
        quizAttemptId: attemptId,
        quizTitle: quiz.title,
        score: attempt.score,
        verificationCode,
        isPublic: true,
      });
      
      // Send certificate earned email (fire and forget)
      sendCertificateEarnedEmail(
        user.email,
        user.firstName,
        quiz.title,
        attempt.score,
        certificate.id
      ).catch(err => console.error('Failed to send certificate earned email:', err));
      
      res.status(201).json(certificate);
    } catch (error: any) {
      console.error("Error generating certificate:", error);
      res.status(500).json({ message: "Failed to generate certificate" });
    }
  });
  
  // Download certificate PDF
  app.get("/api/certificates/download/:certificateId", isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { certificateId } = req.params;
      const userId = req.user.id;
      
      // Get certificate
      const certificate = await storage.getCertificateById(certificateId);
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      // Verify certificate belongs to user
      if (certificate.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Get related data
      const [user, quiz, attempt] = await Promise.all([
        storage.getUser(userId),
        storage.getQuizById(certificate.quizId),
        storage.getQuizAttemptById(certificate.quizAttemptId),
      ]);
      
      if (!user || !quiz || !attempt) {
        return res.status(404).json({ message: "Related data not found" });
      }
      
      // Generate PDF
      const pdfBuffer = await generateCertificateBuffer({
        user,
        quiz,
        attempt,
        verificationCode: certificate.verificationCode,
        issueDate: certificate.issuedAt,
      });
      
      // Set response headers for PDF download
      const fileName = `certificate_${quiz.title.replace(/[^a-zA-Z0-9]/g, '_')}_${userId}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error("Error downloading certificate:", error);
      res.status(500).json({ message: "Failed to download certificate" });
    }
  });
  
  // Get certificate by verification code (public)
  app.get("/api/certificates/verify/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const certificate = await storage.getCertificateByVerificationCode(code);
      
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      // Only return if certificate is public
      if (!certificate.isPublic) {
        return res.status(403).json({ message: "Certificate is private" });
      }
      
      res.json(certificate);
    } catch (error: any) {
      console.error("Error verifying certificate:", error);
      res.status(500).json({ message: "Failed to verify certificate" });
    }
  });
  
  // Toggle certificate visibility
  app.patch("/api/user/certificates/:id/visibility", isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { id } = req.params;
      const { isPublic } = req.body;
      
      // Verify certificate belongs to user
      const certificate = await storage.getCertificateById(id);
      if (!certificate || certificate.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updated = await storage.updateCertificate(id, { isPublic });
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating certificate visibility:", error);
      res.status(500).json({ message: "Failed to update certificate" });
    }
  });
  
  // ===============================================
  // ACTIVITY LOG ROUTES
  // ===============================================
  
  // Get user's activity log
  app.get("/api/user/activity-log", isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const limit = parseInt(req.query.limit as string) || 50;
      const activityLog = await storage.getUserActivityLog(req.user.id, limit);
      res.json(activityLog);
    } catch (error: any) {
      console.error("Error fetching activity log:", error);
      res.status(500).json({ message: "Failed to fetch activity log" });
    }
  });
  
  // ===============================================
  // USER STATS ROUTES
  // ===============================================
  
  // Get user gamification stats
  app.get("/api/user/stats", isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get user badges, achievements, certificates count
      const badges = await storage.getUserBadges(req.user.id);
      const achievements = await storage.getUserAchievements(req.user.id);
      const certificates = await storage.getUserCertificates(req.user.id);
      const attempts = await storage.getUserQuizAttempts(req.user.id, 100);
      
      // Calculate stats
      const unlockedAchievements = achievements.filter(a => a.isUnlocked);
      const totalQuizzes = attempts.length;
      const averageScore = totalQuizzes > 0
        ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / totalQuizzes)
        : 0;
      
      res.json({
        totalPoints: user.totalPoints || 0,
        level: user.level || 1,
        currentStreak: user.currentStreak || 0,
        longestStreak: user.longestStreak || 0,
        badgesEarned: badges.length,
        achievementsUnlocked: unlockedAchievements.length,
        totalAchievements: achievements.length,
        certificatesEarned: certificates.length,
        totalQuizzes,
        averageScore,
      });
    } catch (error: any) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Get aggregated gamification data for dashboard
  app.get("/api/user/gamification", isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get all badges (both earned and not earned)
      const allBadges = await storage.getAllBadges();
      const userBadges = await storage.getUserBadges(req.user.id);
      const userBadgeIds = new Set(userBadges.map(b => b.id));
      
      // Combine badges with earned status
      const badges = allBadges.filter(b => b.isActive).map(badge => ({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        iconUrl: badge.iconUrl,
        earnedAt: userBadgeIds.has(badge.id) 
          ? userBadges.find(ub => ub.id === badge.id)?.earnedAt 
          : undefined
      }));
      
      // Get leaderboard position
      const leaderboardPosition = await storage.getUserLeaderboardPosition(req.user.id, undefined, 'all_time') || {
        rank: 0,
        totalPoints: user.totalPoints || 0
      };
      
      res.json({
        profile: {
          totalPoints: user.totalPoints || 0,
          level: user.level || 1,
          currentStreak: user.currentStreak || 0,
          longestStreak: user.longestStreak || 0,
        },
        badges,
        leaderboardPosition
      });
    } catch (error: any) {
      console.error("Error fetching user gamification data:", error);
      res.status(500).json({ message: "Failed to fetch gamification data" });
    }
  });
}
