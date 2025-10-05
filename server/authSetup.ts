import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { setupAuth as setupPassportAuth } from "./auth";
import { storage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
    store: sessionStore,
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  setupPassportAuth();
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
