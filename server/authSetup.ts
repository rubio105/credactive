import passport from "passport";
import type { Express, RequestHandler } from "express";
import { setupAuth as setupPassportAuth } from "./auth";
import { setupSocialAuthStrategies, getSession } from "./replitAuth";
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
  
  // Setup social authentication strategies (Google, Apple)
  await setupSocialAuthStrategies(app);

  // Unified serialization - works with both local and social auth
  passport.serializeUser((user: any, done) => {
    if (user.claims) {
      // Social auth - store all session data including tokens
      done(null, {
        userId: user.claims.sub,
        isSocial: true,
        access_token: user.access_token,
        refresh_token: user.refresh_token,
        expires_at: user.expires_at,
        claims: user.claims
      });
    } else {
      // Local auth - store only user ID
      done(null, { userId: user.id, isSocial: false });
    }
  });

  passport.deserializeUser(async (sessionData: any, done) => {
    try {
      const { userId, isSocial } = sessionData;
      
      if (isSocial) {
        // For social auth, merge database user with session tokens
        const [dbUser] = await db.select().from(users).where(eq(users.id, userId));
        if (!dbUser) {
          return done(null, false);
        }
        // Merge database user with social auth session data
        const user = {
          ...dbUser,
          claims: sessionData.claims,
          access_token: sessionData.access_token,
          refresh_token: sessionData.refresh_token,
          expires_at: sessionData.expires_at
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
