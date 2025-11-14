import passport from "passport";
import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { setupAuth as setupPassportAuth } from "./auth";
import { setupGoogleAuth } from "./googleAuth";
import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const pgSession = connectPgSimple(session);

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  
  const sessionConfig: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "fallback-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
      // Only use secure cookies when HTTPS is explicitly enabled
      secure: process.env.FORCE_HTTPS === "true",
      sameSite: "lax",
    },
  };

  if (process.env.DATABASE_URL) {
    sessionConfig.store = new pgSession({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      tableName: 'sessions',
      createTableIfMissing: false,
    });
  } else {
    console.warn("DATABASE_URL not found, using in-memory session store (not suitable for production)");
  }
  
  app.use(session(sessionConfig));
  
  app.use(passport.initialize());
  app.use(passport.session());

  // Setup local email/password authentication
  setupPassportAuth();
  
  // Setup Google OAuth authentication - DISABLED
  // setupGoogleAuth(app);

  // Unified serialization - store only user ID
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Unified deserialization - retrieve user from database
  passport.deserializeUser(async (userId: string, done) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      done(null, user || null);
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

export const isDoctor: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user as any;
  const dbUser = await storage.getUser(user.id);

  if (!dbUser?.isDoctor) {
    return res.status(403).json({ message: "Forbidden: Doctor access required" });
  }

  return next();
};
