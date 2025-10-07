import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Express } from "express";
import { storage } from "./storage";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn("Google OAuth not configured: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing");
}

export function setupGoogleAuth(app: Express) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn("Skipping Google OAuth setup - credentials not provided");
    return;
  }

  // Build dynamic callback URL based on environment
  const getCallbackURL = () => {
    // In Replit, use REPLIT_DOMAINS or construct from request
    const replitDomains = process.env.REPLIT_DOMAINS;
    if (replitDomains) {
      const domains = replitDomains.split(',');
      const primaryDomain = domains[0];
      const callbackURL = `https://${primaryDomain}/api/auth/google/callback`;
      console.log(`[Google OAuth] Using callback URL: ${callbackURL}`);
      console.log(`[Google OAuth] Make sure this URL is configured in Google Cloud Console:`)
      console.log(`[Google OAuth] https://console.cloud.google.com/apis/credentials`);
      return callbackURL;
    }
    // Fallback to relative URL for local development
    return "/api/auth/google/callback";
  };

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: getCallbackURL(),
        scope: ["profile", "email"],
        passReqToCallback: false,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("Email not provided by Google"), undefined);
          }

          let user = await storage.getUserByEmail(email);

          if (!user) {
            const names = profile.displayName?.split(" ") || [];
            const firstName = names[0] || "";
            const lastName = names.slice(1).join(" ") || "";

            user = await storage.createUser({
              email,
              password: null,
              firstName,
              lastName,
              authProvider: "google",
              isPremium: false,
              isAdmin: false,
            });
          } else if (user.authProvider !== "google") {
            user = await storage.updateUser(user.id, {
              authProvider: "google",
            });
          }

          return done(null, user);
        } catch (error) {
          console.error("Google auth error:", error);
          return done(error as Error, undefined);
        }
      }
    )
  );

  app.get(
    "/api/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/login?error=google_auth_failed",
      successRedirect: "/home",
    })
  );
}
