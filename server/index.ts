import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import helmet from "helmet";
import cors from "cors";
import path from "path";

const app = express();

const isDevelopment = app.get("env") === "development";

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com", "https://www.googletagmanager.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://api.openai.com", "https://www.google-analytics.com", "https://www.googletagmanager.com", "ws:", "wss:"],
      frameSrc: ["'self'", "https://js.stripe.com"],
      mediaSrc: ["'self'", "blob:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: isDevelopment ? [] : null,
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: {
    action: 'deny',
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
}));

const allowedOrigins = isDevelopment 
  ? ['http://localhost:5000', 'http://127.0.0.1:5000']
  : (process.env.ALLOWED_DOMAINS || '')
      .split(',')
      .filter(Boolean)
      .flatMap(domain => [`http://${domain.trim()}`, `https://${domain.trim()}`]);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
    } else if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Start job worker for async document processing
  const { jobWorker } = await import("./jobWorker");
  jobWorker.start();
  console.log('[Job Worker] Background processing started');

  // Webinar reminder system - Check every hour for sessions starting in 24 hours
  setInterval(async () => {
    try {
      const { db } = await import("./db");
      const { sendEmail } = await import("./email");
      const { liveCourseSessions, liveCourses, liveCourseEnrollments, users } = await import("../shared/schema");
      const { eq, and, gte, lte } = await import("drizzle-orm");
      
      const now = new Date();
      const in23Hours = new Date(now.getTime() + 23 * 60 * 60 * 1000);
      const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);
      
      // Find sessions starting in 24 hours (+/- 1 hour window)
      const upcomingSessions = await db
        .select({
          sessionId: liveCourseSessions.id,
          sessionStartDate: liveCourseSessions.startDate,
          sessionEndDate: liveCourseSessions.endDate,
          streamingUrl: liveCourseSessions.streamingUrl,
          courseId: liveCourseSessions.courseId,
          courseTitle: liveCourses.title,
          instructor: liveCourses.instructor,
        })
        .from(liveCourseSessions)
        .innerJoin(liveCourses, eq(liveCourseSessions.courseId, liveCourses.id))
        .where(
          and(
            gte(liveCourseSessions.startDate, in23Hours),
            lte(liveCourseSessions.startDate, in25Hours)
          )
        );
      
      for (const session of upcomingSessions) {
        const { isNull } = await import("drizzle-orm");
        
        // Get enrollments that haven't received a reminder yet
        const enrollments = await db
          .select({
            enrollmentId: liveCourseEnrollments.id,
            userId: liveCourseEnrollments.userId,
            userEmail: users.email,
            userFirstName: users.firstName,
          })
          .from(liveCourseEnrollments)
          .innerJoin(users, eq(liveCourseEnrollments.userId, users.id))
          .where(
            and(
              eq(liveCourseEnrollments.sessionId, session.sessionId),
              isNull(liveCourseEnrollments.reminderSentAt) // Only send if reminder not sent yet
            )
          );
        
        // Send reminder email to each enrolled user (only once)
        for (const enrollment of enrollments) {
          try {
            const emailSubject = `Promemoria: Webinar "${session.courseTitle}" domani`;
            const emailContent = `
              <h2>Ciao ${enrollment.userFirstName || 'Partecipante'},</h2>
              <p>Ti ricordiamo che domani inizia il webinar a cui sei iscritto:</p>
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>${session.courseTitle}</h3>
                <p><strong>Data e ora:</strong> ${new Date(session.sessionStartDate).toLocaleDateString('it-IT', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })} alle ${new Date(session.sessionStartDate).toLocaleTimeString('it-IT', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}</p>
                ${session.instructor ? `<p><strong>Relatore:</strong> ${session.instructor}</p>` : ''}
                ${session.streamingUrl ? `<p><strong>Link per partecipare:</strong> <a href="${session.streamingUrl}">${session.streamingUrl}</a></p>` : ''}
              </div>
              <p>Ci vediamo domani!</p>
              <p>Il Team CIRY</p>
            `;
            
            await sendEmail({
              to: enrollment.userEmail,
              subject: emailSubject,
              htmlContent: emailContent
            });
            
            // Mark reminder as sent
            await db
              .update(liveCourseEnrollments)
              .set({ reminderSentAt: new Date() })
              .where(eq(liveCourseEnrollments.id, enrollment.enrollmentId));
            
            console.log(`Reminder email sent to ${enrollment.userEmail} for session ${session.sessionId}`);
          } catch (emailError) {
            console.error(`Failed to send reminder email to ${enrollment.userEmail}:`, emailError);
          }
        }
      }
      
      if (upcomingSessions.length > 0) {
        console.log(`Processed ${upcomingSessions.length} webinar reminder(s)`);
      }
    } catch (error) {
      console.error('Webinar reminder system error:', error);
    }
  }, 60 * 60 * 1000); // Run every hour

  // Serve static files BEFORE Vite catch-all in development
  if (app.get("env") === "development") {
    const publicPath = path.resolve(import.meta.dirname, "..", "public");
    app.use(express.static(publicPath));
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
