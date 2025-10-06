import passport from "passport";
import type { Express, RequestHandler } from "express";
import { setupAuth as setupPassportAuth } from "./auth";
import { setupAuth as setupSocialAuth, getSession } from "./replitAuth";
import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Setup local email/password authentication
  setupPassportAuth();
  
  // Setup social authentication (Google, Apple)
  await setupSocialAuth(app);

  // Unified serialization - works with both local and social auth
  passport.serializeUser((user: any, done) => {
    // For social auth, user has claims.sub; for local auth, user.id
    const userId = user.claims?.sub || user.id;
    done(null, { userId, isSocial: !!user.claims });
  });

  passport.deserializeUser(async (sessionData: any, done) => {
    try {
      const { userId, isSocial } = sessionData;
      
      if (isSocial) {
        // For social auth, reconstruct the user object with claims
        const [dbUser] = await db.select().from(users).where(eq(users.id, userId));
        if (!dbUser) {
          return done(null, false);
        }
        // Reconstruct social auth user format
        const user = {
          claims: { sub: userId },
          // We'll refresh tokens on next request if needed
        };
        done(null, user);
      } else {
        // For local auth, get user from database
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        done(null, user || null);
      }
    } catch (error) {
      done(error);
    }
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  return next();
};

export const isAdmin: RequestHandler = async (req, res, next) => {
  console.log('=== isAdmin middleware ===');
  console.log('isAuthenticated:', req.isAuthenticated());
  console.log('req.user:', req.user);
  
  if (!req.isAuthenticated() || !req.user) {
    console.log('Rejecting: Not authenticated');
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user as any;
  console.log('User ID:', user.id);
  const dbUser = await storage.getUser(user.id);
  console.log('DB User:', dbUser);

  if (!dbUser?.isAdmin) {
    console.log('Rejecting: Not admin. isAdmin:', dbUser?.isAdmin);
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }

  console.log('User is admin, allowing access');
  return next();
};
