import {
  users,
  categories,
  quizzes,
  questions,
  quizGenerationJobs,
  userQuizAttempts,
  userProgress,
  quizReports,
  liveCourses,
  liveCourseSessions,
  liveCourseEnrollments,
  liveStreamingSessions,
  liveStreamingMessages,
  liveStreamingPolls,
  liveStreamingPollResponses,
  contentPages,
  onDemandCourses,
  courseVideos,
  videoQuestions,
  courseQuestions,
  userVideoProgress,
  badges,
  userBadges,
  achievements,
  userAchievements,
  dailyChallenges,
  userDailyChallenges,
  userCertificates,
  leaderboard,
  activityLog,
  corporateAgreements,
  corporateInvites,
  corporateLicenses,
  corporateCourseAssignments,
  quizCorporateAccess,
  liveCourseCorporateAccess,
  onDemandCourseCorporateAccess,
  emailTemplates,
  subscriptionPlans,
  medicalKnowledgeBase,
  medicalKnowledgeChunks,
  apiKeys,
  type User,
  type UpsertUser,
  type Category,
  type Quiz,
  type Question,
  type QuizGenerationJob,
  type UserQuizAttempt,
  type UserProgress,
  type QuizReport,
  type LiveCourse,
  type LiveCourseSession,
  type LiveCourseEnrollment,
  type LiveStreamingSession,
  type LiveStreamingMessage,
  type LiveStreamingPoll,
  type LiveStreamingPollResponse,
  type ContentPage,
  type OnDemandCourse,
  type CourseVideo,
  type VideoQuestion,
  type CourseQuestion,
  type UserVideoProgress,
  type Badge,
  type UserBadge,
  type Achievement,
  type UserAchievement,
  type DailyChallenge,
  type UserDailyChallenge,
  type UserCertificate,
  type Leaderboard,
  type ActivityLog,
  type CorporateAgreement,
  type CorporateInvite,
  type CorporateLicense,
  type QuizCorporateAccess,
  type LiveCourseCorporateAccess,
  type OnDemandCourseCorporateAccess,
  type EmailTemplate,
  type SelectCorporateCourseAssignment,
  type InsertUserQuizAttempt,
  type InsertUserProgress,
  type InsertQuizReport,
  type InsertQuizGenerationJob,
  type InsertLiveCourse,
  type InsertLiveCourseSession,
  type InsertLiveCourseEnrollment,
  type InsertLiveStreamingSession,
  type InsertLiveStreamingMessage,
  type InsertLiveStreamingPoll,
  type InsertLiveStreamingPollResponse,
  type InsertContentPage,
  type InsertOnDemandCourse,
  type InsertCourseVideo,
  type InsertVideoQuestion,
  type InsertCourseQuestion,
  type InsertUserVideoProgress,
  type InsertBadge,
  type InsertUserBadge,
  type InsertAchievement,
  type InsertUserAchievement,
  type InsertDailyChallenge,
  type InsertUserDailyChallenge,
  type InsertUserCertificate,
  type InsertLeaderboard,
  type InsertActivityLog,
  type InsertCorporateAgreement,
  type InsertCorporateInvite,
  type InsertCorporateLicense,
  type InsertCorporateCourseAssignment,
  type InsertEmailTemplate,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  type QuizWithCount,
  type Setting,
  type InsertSetting,
  settings,
  scenarioConversations,
  scenarioMessages,
  type ScenarioConversation,
  type ScenarioMessage,
  type InsertScenarioConversation,
  type InsertScenarioMessage,
  userFeedback,
  appointments,
  appointmentAttachments,
  type Appointment,
  type InsertAppointment,
  type AppointmentAttachment,
  type InsertAppointmentAttachment,
  type UserFeedback,
  type InsertUserFeedback,
  // Prevention system
  preventionDocuments,
  preventionTopics,
  triageSessions,
  triageMessages,
  triageAlerts,
  prohmedCodes,
  type PreventionDocument,
  type InsertPreventionDocument,
  type PreventionTopic,
  type InsertPreventionTopic,
  type TriageSession,
  type InsertTriageSession,
  type TriageMessage,
  type InsertTriageMessage,
  type TriageAlert,
  type InsertTriageAlert,
  type ProhmedCode,
  type InsertProhmedCode,
  // Prevention assessments
  preventionAssessments,
  preventionAssessmentQuestions,
  preventionUserResponses,
  type PreventionAssessment,
  type InsertPreventionAssessment,
  type PreventionAssessmentQuestion,
  type InsertPreventionAssessmentQuestion,
  type PreventionUserResponse,
  type InsertPreventionUserResponse,
  // Health Risk Predictions
  healthRiskPredictions,
  type HealthRiskPrediction,
  type InsertHealthRiskPrediction,
  // Crossword game
  crosswordPuzzles,
  crosswordAttempts,
  crosswordLeaderboard,
  type CrosswordPuzzle,
  type InsertCrosswordPuzzle,
  type CrosswordAttempt,
  type InsertCrosswordAttempt,
  type CrosswordLeaderboard,
  type InsertCrosswordLeaderboard,
  // Health Score System
  userHealthReports,
  healthScoreHistory,
  healthInsights,
  type UserHealthReport,
  type InsertUserHealthReport,
  type HealthScoreHistory,
  type InsertHealthScoreHistory,
  type HealthInsight,
  type InsertHealthInsight,
  // Token Usage System
  userTokenUsage,
  type UserTokenUsage,
  type InsertUserTokenUsage,
  // Job Queue System
  jobQueue,
  type JobQueue,
  type InsertJobQueue,
  type MedicalKnowledgeBase,
  type InsertMedicalKnowledgeBase,
  type MedicalKnowledgeChunk,
  type InsertMedicalKnowledgeChunk,
  professionalContactRequests,
  type ProfessionalContactRequest,
  type InsertProfessionalContactRequest,
  doctorPatientLinks,
  doctorNotes,
  type DoctorPatientLink,
  type InsertDoctorPatientLink,
  type DoctorNote,
  type InsertDoctorNote,
  auditLogs,
  type AuditLog,
  type InsertAuditLog,
  loginLogs,
  type LoginLog,
  type InsertLoginLog,
  pushSubscriptions,
  type PushSubscription,
  type InsertPushSubscription,
  notifications,
  type Notification,
  type InsertNotification,
  type ApiKey,
  type InsertApiKey,
  wearableDevices,
  bloodPressureReadings,
  wearableDailyReports,
  proactiveHealthTriggers,
  proactiveNotifications,
  type WearableDevice,
  type InsertWearableDevice,
  type BloodPressureReading,
  type InsertBloodPressureReading,
  type WearableDailyReport,
  type InsertWearableDailyReport,
  type ProactiveHealthTrigger,
  type InsertProactiveHealthTrigger,
  type ProactiveNotification,
  type InsertProactiveNotification,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, sql, and, or, gte, lte, gt, lt, inArray } from "drizzle-orm";

// Type for pending appointment reminders with joined data
export type PendingReminderData = {
  // From appointment_reminders
  id: string;
  appointmentId: string;
  reminderType: string;
  scheduledFor: Date;
  sentAt: Date | null;
  status: string;
  channel: string;
  errorMessage: string | null;
  twilioSid: string | null;
  createdAt: Date;
  
  // From appointments
  startTime: Date;
  endTime: Date;
  videoRoomUrl: string | null;
  
  // From patient user
  patientEmail: string;
  firstName: string;
  lastName: string;
  patientWhatsapp: string | null;
  whatsappNotificationsEnabled: boolean;
};

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByDoctorCode(doctorCode: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  createUser(user: Partial<User>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User>;
  updateUserStripeCustomer(userId: string, stripeCustomerId: string): Promise<User>;
  updateUserLanguage(userId: string, language: string): Promise<User>;
  setPasswordResetToken(userId: string, token: string, expires: Date): Promise<void>;
  updateUserPassword(userId: string, password: string): Promise<void>;
  clearPasswordResetToken(userId: string): Promise<void>;
  
  // Admin User operations
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Quiz operations
  getCategories(): Promise<Category[]>;
  getCategoriesWithQuizzes(userId?: string, isAdminOverride?: boolean): Promise<Array<Category & { quizzes: QuizWithCount[] }>>;
  getAllQuizzes(userId?: string, isAdminOverride?: boolean): Promise<Quiz[]>;
  getQuizzesByCategory(categoryId: string, userId?: string, isAdminOverride?: boolean): Promise<Quiz[]>;
  getQuizById(id: string): Promise<Quiz | undefined>;
  getQuestionsByQuizId(quizId: string): Promise<Question[]>;
  getQuestionById(id: string): Promise<Question | undefined>;
  
  // Admin Category operations
  createCategory(category: Omit<Category, 'id' | 'createdAt'>): Promise<Category>;
  updateCategory(id: string, updates: Partial<Category>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
  
  // Admin Quiz operations
  createQuiz(quiz: Omit<Quiz, 'id' | 'createdAt'>): Promise<Quiz>;
  updateQuiz(id: string, updates: Partial<Quiz>): Promise<Quiz>;
  deleteQuiz(id: string): Promise<void>;
  
  // Admin Question operations
  getAllQuestions(): Promise<Question[]>;
  createQuestion(question: Omit<Question, 'id' | 'createdAt'>): Promise<Question>;
  updateQuestion(id: string, updates: Partial<Question>): Promise<Question>;
  deleteQuestion(id: string): Promise<void>;
  
  // Quiz generation job operations
  createGenerationJob(job: InsertQuizGenerationJob): Promise<QuizGenerationJob>;
  updateGenerationJob(id: string, updates: Partial<QuizGenerationJob>): Promise<QuizGenerationJob>;
  getGenerationJobById(id: string): Promise<QuizGenerationJob | undefined>;
  getGenerationJobsByQuizId(quizId: string): Promise<QuizGenerationJob[]>;
  
  // User progress operations
  createQuizAttempt(attempt: InsertUserQuizAttempt): Promise<UserQuizAttempt>;
  getQuizAttemptById(attemptId: string): Promise<UserQuizAttempt | undefined>;
  getUserQuizAttempts(userId: string, limit?: number): Promise<UserQuizAttempt[]>;
  getUserProgress(userId: string): Promise<UserProgress[]>;
  updateUserProgress(userId: string, categoryId: string, attempt: UserQuizAttempt): Promise<void>;
  
  // Report operations
  createQuizReport(report: InsertQuizReport): Promise<QuizReport>;
  getQuizReport(attemptId: string): Promise<QuizReport | undefined>;
  getUserReports(userId: string, limit?: number): Promise<QuizReport[]>;
  
  // Live course operations
  createLiveCourse(course: InsertLiveCourse): Promise<LiveCourse>;
  updateLiveCourse(id: string, updates: Partial<LiveCourse>): Promise<LiveCourse>;
  deleteLiveCourse(id: string): Promise<void>;
  getLiveCourseById(id: string): Promise<LiveCourse | undefined>;
  getLiveCourseByQuizId(quizId: string): Promise<LiveCourse | undefined>;
  getAllLiveCourses(userId?: string, isAdminOverride?: boolean): Promise<LiveCourse[]>;
  
  // Live course session operations
  createLiveCourseSession(session: InsertLiveCourseSession): Promise<LiveCourseSession>;
  updateLiveCourseSession(id: string, updates: Partial<LiveCourseSession>): Promise<LiveCourseSession>;
  deleteLiveCourseSession(id: string): Promise<void>;
  getSessionsByCourseId(courseId: string): Promise<LiveCourseSession[]>;
  getSessionById(id: string): Promise<LiveCourseSession | undefined>;
  
  // Live course enrollment operations
  createLiveCourseEnrollment(enrollment: InsertLiveCourseEnrollment): Promise<LiveCourseEnrollment>;
  updateLiveCourseEnrollment(id: string, updates: Partial<LiveCourseEnrollment>): Promise<LiveCourseEnrollment>;
  getUserEnrollments(userId: string): Promise<LiveCourseEnrollment[]>;
  getLiveCourseEnrollment(liveCourseId: string, userId: string): Promise<LiveCourseEnrollment | undefined>;
  getUserEnrollmentForSession(userId: string, sessionId: string): Promise<LiveCourseEnrollment | undefined>;
  
  // Live streaming session operations
  createLiveStreamingSession(session: InsertLiveStreamingSession): Promise<LiveStreamingSession>;
  updateLiveStreamingSession(id: string, updates: Partial<LiveStreamingSession>): Promise<LiveStreamingSession>;
  getActiveStreamingSession(sessionId: string): Promise<LiveStreamingSession | undefined>;
  getLiveStreamingSessionBySessionId(sessionId: string): Promise<LiveStreamingSession | undefined>;
  endLiveStreamingSession(id: string): Promise<void>;
  
  // Live streaming chat operations
  createLiveStreamingMessage(message: InsertLiveStreamingMessage): Promise<LiveStreamingMessage>;
  getStreamingMessages(streamingSessionId: string, limit?: number): Promise<LiveStreamingMessage[]>;
  
  // Live streaming poll operations
  createLiveStreamingPoll(poll: InsertLiveStreamingPoll): Promise<LiveStreamingPoll>;
  updateLiveStreamingPoll(id: string, updates: Partial<LiveStreamingPoll>): Promise<LiveStreamingPoll>;
  getActivePoll(streamingSessionId: string): Promise<LiveStreamingPoll | undefined>;
  getStreamingPolls(streamingSessionId: string): Promise<LiveStreamingPoll[]>;
  
  // Live streaming poll response operations
  createPollResponse(response: InsertLiveStreamingPollResponse): Promise<LiveStreamingPollResponse>;
  getPollResponses(pollId: string): Promise<LiveStreamingPollResponse[]>;
  getUserPollResponse(pollId: string, userId: string): Promise<LiveStreamingPollResponse | undefined>;
  getPollStats(pollId: string): Promise<{option: string; count: number}[]>;
  
  // On-demand course operations
  createOnDemandCourse(course: InsertOnDemandCourse): Promise<OnDemandCourse>;
  updateOnDemandCourse(id: string, updates: Partial<OnDemandCourse>): Promise<OnDemandCourse>;
  deleteOnDemandCourse(id: string): Promise<void>;
  getOnDemandCourseById(id: string): Promise<OnDemandCourse | undefined>;
  getAllOnDemandCourses(includeInactive?: boolean, userId?: string, isAdminOverride?: boolean): Promise<OnDemandCourse[]>;
  
  // Course video operations
  createCourseVideo(video: InsertCourseVideo): Promise<CourseVideo>;
  updateCourseVideo(id: string, updates: Partial<CourseVideo>): Promise<CourseVideo>;
  deleteCourseVideo(id: string): Promise<void>;
  getVideosByCourseId(courseId: string): Promise<CourseVideo[]>;
  getCourseVideoById(id: string): Promise<CourseVideo | undefined>;
  
  // Video question operations
  createVideoQuestion(question: InsertVideoQuestion): Promise<VideoQuestion>;
  updateVideoQuestion(id: string, updates: Partial<VideoQuestion>): Promise<VideoQuestion>;
  deleteVideoQuestion(id: string): Promise<void>;
  getQuestionsByVideoId(videoId: string): Promise<VideoQuestion[]>;
  
  // Course question operations (at course level, not video level)
  createCourseQuestion(question: InsertCourseQuestion): Promise<CourseQuestion>;
  updateCourseQuestion(id: string, updates: Partial<CourseQuestion>): Promise<CourseQuestion>;
  deleteCourseQuestion(id: string): Promise<void>;
  getQuestionsByCourseId(courseId: string): Promise<CourseQuestion[]>;
  
  // User video progress operations
  upsertUserVideoProgress(progress: InsertUserVideoProgress): Promise<UserVideoProgress>;
  getUserVideoProgress(userId: string, courseId: string): Promise<UserVideoProgress[]>;
  getUserCourseProgress(userId: string, courseId: string): Promise<{completed: number; total: number}>;
  
  // Content page operations
  getAllContentPages(): Promise<ContentPage[]>;
  getContentPageBySlug(slug: string): Promise<ContentPage | undefined>;
  getContentPageById(id: string): Promise<ContentPage | undefined>;
  createContentPage(page: InsertContentPage): Promise<ContentPage>;
  updateContentPage(id: string, updates: Partial<ContentPage>): Promise<ContentPage>;
  deleteContentPage(id: string): Promise<void>;
  
  // Gamification - Badge operations
  getAllBadges(): Promise<Badge[]>;
  getBadgeById(id: string): Promise<Badge | undefined>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  updateBadge(id: string, updates: Partial<Badge>): Promise<Badge>;
  deleteBadge(id: string): Promise<void>;
  getUserBadges(userId: string): Promise<(UserBadge & { badge: Badge })[]>;
  awardBadge(userId: string, badgeId: string): Promise<UserBadge>;
  
  // Gamification - Achievement operations
  getAllAchievements(): Promise<Achievement[]>;
  getAchievementById(id: string): Promise<Achievement | undefined>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  updateAchievement(id: string, updates: Partial<Achievement>): Promise<Achievement>;
  deleteAchievement(id: string): Promise<void>;
  getUserAchievements(userId: string): Promise<(UserAchievement & { achievement: Achievement })[]>;
  
  // Gamification - Daily challenge operations
  getTodayDailyChallenge(): Promise<DailyChallenge | undefined>;
  createDailyChallenge(challenge: InsertDailyChallenge): Promise<DailyChallenge>;
  getUserDailyChallengeStatus(userId: string, challengeId: string): Promise<UserDailyChallenge | undefined>;
  completeDailyChallenge(userChallenge: InsertUserDailyChallenge): Promise<UserDailyChallenge>;
  
  // Gamification - Certificate operations
  getUserCertificates(userId: string): Promise<UserCertificate[]>;
  getCertificateById(id: string): Promise<UserCertificate | undefined>;
  getCertificateByVerificationCode(code: string): Promise<UserCertificate | undefined>;
  createCertificate(certificate: InsertUserCertificate): Promise<UserCertificate>;
  updateCertificate(id: string, updates: Partial<UserCertificate>): Promise<UserCertificate>;
  
  // Gamification - Leaderboard operations
  getGlobalLeaderboard(limit?: number, period?: string): Promise<(Leaderboard & { user: User })[]>;
  getCategoryLeaderboard(categoryId: string, limit?: number, period?: string): Promise<(Leaderboard & { user: User })[]>;
  getUserLeaderboardPosition(userId: string, categoryId?: string, period?: string): Promise<Leaderboard | undefined>;
  
  // Gamification - Activity log operations
  getUserActivityLog(userId: string, limit?: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  
  // Corporate agreement operations
  getCorporateAgreementByEmailDomain(emailDomain: string): Promise<CorporateAgreement | undefined>;
  getCorporateAgreementByPromoCode(promoCode: string): Promise<CorporateAgreement | undefined>;
  getCorporateAgreementById(id: string): Promise<CorporateAgreement | undefined>;
  getAllCorporateAgreements(): Promise<CorporateAgreement[]>;
  createCorporateAgreement(agreement: InsertCorporateAgreement): Promise<CorporateAgreement>;
  updateCorporateAgreement(id: string, updates: Partial<CorporateAgreement>): Promise<CorporateAgreement>;
  deleteCorporateAgreement(id: string): Promise<void>;
  incrementCorporateAgreementUsers(id: string): Promise<boolean>;
  decrementCorporateAgreementUsers(id: string): Promise<void>;
  getUsersByCorporateAgreement(agreementId: string): Promise<User[]>;
  getCorporateAgreementByAdminUserId(userId: string): Promise<CorporateAgreement | undefined>;
  
  // Corporate invite operations
  createCorporateInvite(invite: InsertCorporateInvite): Promise<CorporateInvite>;
  getCorporateInviteByToken(token: string): Promise<CorporateInvite | undefined>;
  getCorporateInvitesByAgreement(agreementId: string): Promise<CorporateInvite[]>;
  updateCorporateInviteStatus(id: string, status: string, acceptedAt?: Date): Promise<CorporateInvite>;
  deleteCorporateInvite(id: string): Promise<void>;
  
  // Corporate course assignment operations
  createCorporateCourseAssignment(assignment: InsertCorporateCourseAssignment): Promise<SelectCorporateCourseAssignment>;
  getCorporateCourseAssignmentsByAgreement(agreementId: string): Promise<SelectCorporateCourseAssignment[]>;
  deleteCorporateCourseAssignment(id: string): Promise<void>;
  
  // Corporate license operations
  createCorporateLicense(license: InsertCorporateLicense): Promise<CorporateLicense>;
  getCorporateLicensesByAgreement(agreementId: string): Promise<CorporateLicense[]>;
  updateCorporateLicense(id: string, updates: Partial<CorporateLicense>): Promise<CorporateLicense>;
  
  // Corporate content access operations
  grantQuizAccess(quizId: string, corporateAgreementId: string): Promise<QuizCorporateAccess>;
  revokeQuizAccess(quizId: string, corporateAgreementId: string): Promise<void>;
  getQuizAccessByCorporateAgreement(corporateAgreementId: string): Promise<QuizCorporateAccess[]>;
  checkQuizAccess(quizId: string, corporateAgreementId: string): Promise<boolean>;
  
  grantLiveCourseAccess(liveCourseId: string, corporateAgreementId: string): Promise<LiveCourseCorporateAccess>;
  revokeLiveCourseAccess(liveCourseId: string, corporateAgreementId: string): Promise<void>;
  getLiveCourseAccessByCorporateAgreement(corporateAgreementId: string): Promise<LiveCourseCorporateAccess[]>;
  getLiveCourseAccessByLiveCourseId(liveCourseId: string): Promise<LiveCourseCorporateAccess[]>;
  checkLiveCourseAccess(liveCourseId: string, corporateAgreementId: string): Promise<boolean>;
  
  grantOnDemandCourseAccess(onDemandCourseId: string, corporateAgreementId: string): Promise<OnDemandCourseCorporateAccess>;
  revokeOnDemandCourseAccess(onDemandCourseId: string, corporateAgreementId: string): Promise<void>;
  getOnDemandCourseAccessByCorporateAgreement(corporateAgreementId: string): Promise<OnDemandCourseCorporateAccess[]>;
  checkOnDemandCourseAccess(onDemandCourseId: string, corporateAgreementId: string): Promise<boolean>;
  
  // Settings operations
  getSetting(key: string): Promise<Setting | undefined>;
  getAllSettings(): Promise<Setting[]>;
  upsertSetting(key: string, value: string, description?: string, category?: string): Promise<Setting>;
  deleteSetting(key: string): Promise<void>;
  
  // Email template operations
  getAllEmailTemplates(): Promise<EmailTemplate[]>;
  getEmailTemplateByCode(code: string): Promise<EmailTemplate | undefined>;
  getEmailTemplateById(id: string): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate>;
  deleteEmailTemplate(id: string): Promise<void>;

  // Subscription plan operations
  getAllSubscriptionPlans(includeInactive?: boolean): Promise<SubscriptionPlan[]>;
  getSubscriptionPlanById(id: string): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(id: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan>;
  deleteSubscriptionPlan(id: string): Promise<void>;

  // User feedback operations
  createUserFeedback(feedback: InsertUserFeedback): Promise<UserFeedback>;
  getAllUserFeedback(): Promise<(UserFeedback & { user?: User })[]>;
  getUserFeedbackByUserId(userId: string): Promise<UserFeedback[]>;
  checkUserHasRecentFeedback(userId: string, days?: number): Promise<boolean>;
  updateFeedbackResolution(id: number, isResolved: boolean, adminNotes?: string): Promise<void>;
  incrementUserLoginCount(userId: string): Promise<void>;
  markUserFeedbackSubmitted(userId: string): Promise<void>;

  // ========== PREVENTION SYSTEM ==========
  
  // Prevention document operations
  createPreventionDocument(doc: InsertPreventionDocument): Promise<PreventionDocument>;
  getPreventionDocumentById(id: string): Promise<PreventionDocument | undefined>;
  getAllPreventionDocuments(activeOnly?: boolean): Promise<PreventionDocument[]>;
  getPreventionDocumentsByUser(userId: string): Promise<PreventionDocument[]>;
  updatePreventionDocument(id: string, updates: Partial<PreventionDocument>): Promise<PreventionDocument>;
  deletePreventionDocument(id: string): Promise<void>;
  
  // Prevention topic operations
  createPreventionTopic(topic: InsertPreventionTopic): Promise<PreventionTopic>;
  getPreventionTopicById(id: string): Promise<PreventionTopic | undefined>;
  getAllPreventionTopics(): Promise<PreventionTopic[]>;
  updatePreventionTopic(id: string, updates: Partial<PreventionTopic>): Promise<PreventionTopic>;
  deletePreventionTopic(id: string): Promise<void>;
  
  // Triage session operations
  createTriageSession(session: InsertTriageSession): Promise<TriageSession>;
  getTriageSessionById(id: string): Promise<TriageSession | undefined>;
  getTriageSessionsByUser(userId: string): Promise<TriageSession[]>;
  updateTriageSession(id: string, updates: Partial<TriageSession>): Promise<TriageSession>;
  closeTriageSession(id: string): Promise<TriageSession>;
  
  // Triage message operations
  createTriageMessage(message: InsertTriageMessage): Promise<TriageMessage>;
  getTriageMessagesBySession(sessionId: string): Promise<TriageMessage[]>;
  
  // Triage alert operations
  createTriageAlert(alert: InsertTriageAlert): Promise<TriageAlert>;
  getTriageAlertById(id: string): Promise<TriageAlert | undefined>; // Get alert by ID
  getTriageAlertsBySession(sessionId: string): Promise<TriageAlert[]>;
  getUserTriageAlerts(userId: string): Promise<TriageAlert[]>; // Get all alerts for a user
  getUnreviewedTriageAlerts(): Promise<TriageAlert[]>;
  getAllTriageAlerts(): Promise<TriageAlert[]>; // Admin: fetch all alerts
  getAllTriageAlertsWithDetails(): Promise<Array<TriageAlert & { session?: TriageSession; user?: User }>>; // Optimized with JOIN
  updateTriageAlert(id: string, updates: Partial<TriageAlert>): Promise<TriageAlert>;
  getPendingAlertForUser(userId: string): Promise<TriageAlert | undefined>; // Get most recent pending medium/high alert
  resolveUserAlert(alertId: string, response: string): Promise<TriageAlert>; // Mark alert as resolved by user
  updateAlertToMonitoring(alertId: string, response: string): Promise<TriageAlert>; // Update alert to monitoring (not resolved)
  
  // Prohmed code operations
  createProhmedCode(code: InsertProhmedCode): Promise<ProhmedCode>;
  createProhmedCodesBulk(count: number, accessType: string, source?: string, expiresAt?: Date): Promise<ProhmedCode[]>;
  getAllProhmedCodes(): Promise<ProhmedCode[]>;
  getProhmedCodeByCode(code: string): Promise<ProhmedCode | undefined>;
  getProhmedCodesByUser(userId: string): Promise<ProhmedCode[]>;
  updateProhmedCode(id: string, updates: Partial<ProhmedCode>): Promise<ProhmedCode>;
  redeemProhmedCode(code: string): Promise<ProhmedCode>;

  // ========== PREVENTION ASSESSMENT SYSTEM ==========
  
  // Prevention assessment operations
  createPreventionAssessment(assessment: InsertPreventionAssessment): Promise<PreventionAssessment>;
  getPreventionAssessmentById(id: string): Promise<PreventionAssessment | undefined>;
  getPreventionAssessmentsByUser(userId: string): Promise<PreventionAssessment[]>;
  getLatestPreventionAssessment(userId: string): Promise<PreventionAssessment | undefined>;
  updatePreventionAssessment(id: string, updates: Partial<PreventionAssessment>): Promise<PreventionAssessment>;
  completePreventionAssessment(id: string, score: number, riskLevel: string, recommendations: string[], reportPdfUrl?: string): Promise<PreventionAssessment>;
  
  // Prevention assessment question operations
  createPreventionAssessmentQuestion(question: InsertPreventionAssessmentQuestion): Promise<PreventionAssessmentQuestion>;
  getPreventionAssessmentQuestions(assessmentId: string): Promise<PreventionAssessmentQuestion[]>;
  
  // Prevention user response operations
  createPreventionUserResponse(response: InsertPreventionUserResponse): Promise<PreventionUserResponse>;
  getPreventionUserResponses(assessmentId: string): Promise<PreventionUserResponse[]>;
  getUserResponsesByQuestion(questionId: string): Promise<PreventionUserResponse[]>;

  // Health risk prediction operations
  createHealthRiskPrediction(prediction: InsertHealthRiskPrediction): Promise<HealthRiskPrediction>;
  getActiveHealthRiskPredictionsForUser(userId: string): Promise<HealthRiskPrediction[]>;
  deactivateExpiredPredictions(): Promise<void>;

  // ========== CROSSWORD GAME ==========
  
  // Crossword puzzle operations
  createCrosswordPuzzle(puzzle: InsertCrosswordPuzzle): Promise<CrosswordPuzzle>;
  getCrosswordPuzzleById(id: string): Promise<CrosswordPuzzle | undefined>;
  getAllCrosswordPuzzles(activeOnly?: boolean): Promise<CrosswordPuzzle[]>;
  getWeeklyCrosswordChallenge(weekNumber: number, weekYear: number): Promise<CrosswordPuzzle | undefined>;
  updateCrosswordPuzzle(id: string, updates: Partial<CrosswordPuzzle>): Promise<CrosswordPuzzle>;
  countUserCrosswordsForQuizToday(userId: string, quizId: string): Promise<number>;
  
  // Crossword attempt operations
  createCrosswordAttempt(attempt: InsertCrosswordAttempt): Promise<CrosswordAttempt>;
  getCrosswordAttemptById(id: string): Promise<CrosswordAttempt | undefined>;
  getCrosswordAttemptByUserAndPuzzle(userId: string, puzzleId: string): Promise<CrosswordAttempt | undefined>;
  getCrosswordAttemptsByUser(userId: string): Promise<CrosswordAttempt[]>;
  updateCrosswordAttempt(id: string, updates: Partial<CrosswordAttempt>): Promise<CrosswordAttempt>;
  
  // Crossword leaderboard operations
  upsertCrosswordLeaderboard(entry: InsertCrosswordLeaderboard): Promise<CrosswordLeaderboard>;
  getCrosswordLeaderboardByWeek(weekNumber: number, weekYear: number): Promise<CrosswordLeaderboard[]>;
  getCrosswordLeaderboardByUser(userId: string): Promise<CrosswordLeaderboard[]>;
  updateCrosswordLeaderboard(id: string, updates: Partial<CrosswordLeaderboard>): Promise<CrosswordLeaderboard>;

  // ========== HEALTH SCORE SYSTEM ==========
  
  // Health report operations
  createHealthReport(report: InsertUserHealthReport): Promise<UserHealthReport>;
  getHealthReportById(id: string): Promise<UserHealthReport | undefined>;
  getHealthReportsByUser(userId: string): Promise<UserHealthReport[]>;
  getHealthReportsByTriageSession(sessionId: string): Promise<UserHealthReport[]>;
  updateHealthReport(id: string, updates: Partial<UserHealthReport>): Promise<UserHealthReport>;
  deleteHealthReport(id: string): Promise<void>;
  
  // Health score history operations
  createHealthScoreHistory(score: InsertHealthScoreHistory): Promise<HealthScoreHistory>;
  getLatestHealthScore(userId: string): Promise<HealthScoreHistory | undefined>;
  getHealthScoreHistory(userId: string, limit?: number): Promise<HealthScoreHistory[]>;
  
  // Health insight operations
  createHealthInsight(insight: InsertHealthInsight): Promise<HealthInsight>;
  getHealthInsightsByUser(userId: string, statusFilter?: string): Promise<HealthInsight[]>;
  updateHealthInsight(id: string, updates: Partial<HealthInsight>): Promise<HealthInsight>;
  acknowledgeHealthInsight(id: string): Promise<HealthInsight>;
  resolveHealthInsight(id: string): Promise<HealthInsight>;
  deleteHealthInsight(id: string): Promise<void>;

  // ========== USER TOKEN USAGE SYSTEM ==========
  
  // Token usage operations
  getUserTokenUsage(userId: string, monthYear: string): Promise<UserTokenUsage | undefined>;
  upsertUserTokenUsage(userId: string, monthYear: string, tokensToAdd: number): Promise<UserTokenUsage>;
  getOrCreateTokenUsage(userId: string): Promise<UserTokenUsage>;

  // ========== JOB QUEUE SYSTEM ==========
  
  // Job queue operations
  createJob(job: InsertJobQueue): Promise<JobQueue>;
  getJobById(id: string): Promise<JobQueue | undefined>;
  getJobsByUser(userId: string, limit?: number): Promise<JobQueue[]>;
  getPendingJobs(limit?: number): Promise<JobQueue[]>;
  updateJob(id: string, updates: Partial<JobQueue>): Promise<JobQueue>;
  updateJobProgress(id: string, progress: number, currentStep: string): Promise<JobQueue>;
  completeJob(id: string, outputData: any): Promise<JobQueue>;
  failJob(id: string, errorMessage: string): Promise<JobQueue>;

  // ========== MEDICAL KNOWLEDGE BASE (RAG) ==========
  
  // Medical document operations
  createMedicalDocument(doc: InsertMedicalKnowledgeBase): Promise<MedicalKnowledgeBase>;
  getMedicalDocumentById(id: string): Promise<MedicalKnowledgeBase | undefined>;
  getMedicalDocuments(filters?: { isActive?: boolean; documentType?: string; medicalTopics?: string[] }): Promise<MedicalKnowledgeBase[]>;
  updateMedicalDocument(id: string, updates: Partial<MedicalKnowledgeBase>): Promise<MedicalKnowledgeBase>;
  deleteMedicalDocument(id: string): Promise<void>;
  
  // Medical knowledge chunks operations
  createMedicalChunk(chunk: InsertMedicalKnowledgeChunk): Promise<MedicalKnowledgeChunk>;
  getChunksByDocument(documentId: string): Promise<MedicalKnowledgeChunk[]>;
  
  // Semantic search operation
  semanticSearchMedical(queryEmbedding: number[], limit?: number, topicFilter?: string[]): Promise<Array<MedicalKnowledgeChunk & { similarity: number; documentTitle: string }>>;
  
  // ========== PROFESSIONAL CONTACT REQUESTS ==========
  
  // Professional contact request operations
  createProfessionalContactRequest(request: InsertProfessionalContactRequest): Promise<ProfessionalContactRequest>;
  getProfessionalContactRequestById(id: string): Promise<ProfessionalContactRequest | undefined>;
  getAllProfessionalContactRequests(): Promise<ProfessionalContactRequest[]>;
  updateProfessionalContactRequest(id: string, updates: Partial<ProfessionalContactRequest>): Promise<ProfessionalContactRequest>;
  deleteProfessionalContactRequest(id: string): Promise<void>;

  // Doctor-Patient Link operations
  generateDoctorCode(doctorId: string): Promise<string>;
  linkPatientToDoctor(patientId: string, doctorCode: string): Promise<void>;
  getDoctorPatients(doctorId: string): Promise<Array<User & { linkedAt: Date }>>;
  getPatientDoctors(patientId: string): Promise<Array<User & { linkedAt: Date }>>;
  unlinkPatientFromDoctor(doctorId: string, patientId: string): Promise<void>;
  getDoctorStatsSummary(doctorId: string): Promise<{
    totalPatients: number;
    criticalAlerts: number;
    todayAppointments: number;
    weekAppointments: number;
  }>;
  
  // Doctor Notes operations
  createDoctorNote(note: InsertDoctorNote): Promise<DoctorNote>;
  getDoctorNotesByPatient(patientId: string): Promise<Array<DoctorNote & { doctor: { firstName: string | null, lastName: string | null }, doctorName: string }>>;
  getDoctorNotesByDoctor(doctorId: string): Promise<DoctorNote[]>;
  getDoctorNoteById(id: string): Promise<DoctorNote | undefined>;
  deleteDoctorNote(id: string): Promise<void>;
  
  // Doctor Alert operations  
  getPatientAlertsByDoctor(doctorId: string): Promise<Array<TriageAlert & { patientName: string; patientEmail: string }>>;
  
  // Audit Log operations (GDPR compliance)
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(filters?: {
    userId?: string;
    resourceType?: string;
    resourceOwnerId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<Array<AuditLog & { user?: { fullName: string; email: string }; resourceOwner?: { fullName: string; email: string } }>>;
  getAuditLogsCount(filters?: {
    userId?: string;
    resourceType?: string;
    resourceOwnerId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<number>;

  // Login Log operations (Track authentication events)
  createLoginLog(log: InsertLoginLog): Promise<LoginLog>;
  getLoginLogs(filters?: {
    userId?: string;
    userEmail?: string;
    success?: boolean;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<LoginLog[]>;
  getLoginLogsCount(filters?: {
    userId?: string;
    userEmail?: string;
    success?: boolean;
    startDate?: Date;
    endDate?: Date;
  }): Promise<number>;
  deleteOldLoginLogs(retentionDays: number): Promise<number>;

  // Appointment operations
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointmentById(id: string): Promise<Appointment | undefined>;
  getAppointmentsByDoctor(doctorId: string, startDate?: Date, endDate?: Date): Promise<Appointment[]>;
  getAppointmentsByPatient(patientId: string, status?: string): Promise<Appointment[]>;
  updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment>;
  deleteAppointment(id: string): Promise<void>;
  bookAppointment(appointmentId: string, patientId: string, notes?: string): Promise<Appointment>;
  updateAppointmentStatus(id: string, status: string, updatedBy: string): Promise<Appointment>;
  getAppointmentsSummary(doctorId: string): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
  }>;

  // Push Notification operations
  createPushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription>;
  getPushSubscriptionsByUser(userId: string): Promise<PushSubscription[]>;
  getAllPushSubscriptions(): Promise<PushSubscription[]>;
  deletePushSubscription(endpoint: string): Promise<void>;

  // In-App Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  markNotificationAsRead(notificationId: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;

  // ========== EXTERNAL API KEYS ==========

  // API Key operations
  createApiKey(name: string, scopes: string[], createdBy: string, rateLimitPerMinute?: number, expiresAt?: Date): Promise<{ id: string; key: string }>;
  validateApiKey(keyHash: string): Promise<ApiKey | undefined>;
  listApiKeys(activeOnly?: boolean): Promise<ApiKey[]>;
  revokeApiKey(id: string): Promise<void>;
  updateApiKeyUsage(keyHash: string): Promise<void>;

  // ========== WEARABLE INTEGRATION ==========

  // Wearable Device operations
  createWearableDevice(device: InsertWearableDevice): Promise<WearableDevice>;
  getWearableDevicesByUser(userId: string): Promise<WearableDevice[]>;
  getAllWearableDevices(): Promise<WearableDevice[]>;
  getWearableDeviceById(id: string): Promise<WearableDevice | undefined>;
  updateWearableDevice(id: string, updates: Partial<WearableDevice>): Promise<WearableDevice>;
  deleteWearableDevice(id: string): Promise<void>;

  // Blood Pressure Reading operations
  createBloodPressureReading(reading: InsertBloodPressureReading): Promise<BloodPressureReading>;
  getBloodPressureReadingsByUser(userId: string, startDate?: Date, endDate?: Date): Promise<BloodPressureReading[]>;
  getBloodPressureReadingById(id: string): Promise<BloodPressureReading | undefined>;
  getAnomalousBloodPressureReadings(userId?: string): Promise<Array<BloodPressureReading & { userName?: string; userEmail?: string }>>;
  updateBloodPressureReading(id: string, updates: Partial<BloodPressureReading>): Promise<BloodPressureReading>;

  // Wearable Daily Reports
  createWearableDailyReport(report: InsertWearableDailyReport): Promise<WearableDailyReport>;
  getWearableDailyReportById(id: string): Promise<WearableDailyReport | undefined>;
  getWearableDailyReportsByPatient(patientId: string, limit?: number): Promise<WearableDailyReport[]>;
  getWearableDailyReportsByDoctor(doctorId: string, limit?: number): Promise<WearableDailyReport[]>;
  getLatestWearableDailyReport(patientId: string): Promise<WearableDailyReport | undefined>;

  // ========== PROACTIVE HEALTH TRIGGERS ==========

  // Proactive Trigger operations
  createProactiveHealthTrigger(trigger: InsertProactiveHealthTrigger): Promise<ProactiveHealthTrigger>;
  getProactiveHealthTriggers(activeOnly?: boolean): Promise<ProactiveHealthTrigger[]>;
  getProactiveHealthTriggerById(id: string): Promise<ProactiveHealthTrigger | undefined>;
  updateProactiveHealthTrigger(id: string, updates: Partial<ProactiveHealthTrigger>): Promise<ProactiveHealthTrigger>;
  deleteProactiveHealthTrigger(id: string): Promise<void>;

  // Proactive Notification operations
  createProactiveNotification(notification: InsertProactiveNotification): Promise<ProactiveNotification>;
  getProactiveNotificationsByUser(userId: string, limit?: number): Promise<ProactiveNotification[]>;
  getProactiveNotificationStats(startDate?: Date, endDate?: Date): Promise<{
    total: number;
    sent: number;
    failed: number;
    clicked: number;
    byChannel: Record<string, number>;
    byType: Record<string, number>;
  }>;

  // Appointment Reminder operations
  fetchPendingReminders(): Promise<PendingReminderData[]>;
  markReminderSent(reminderId: string, sid?: string): Promise<void>;
  markReminderSkipped(reminderId: string, reason: string): Promise<void>;
  markReminderFailed(reminderId: string, errorMessage: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, tierOrSubscriptionId?: string): Promise<User> {
    // If tierOrSubscriptionId is a tier (premium or premium_plus), use it as subscriptionTier
    // If it starts with "sub_", it's a Stripe subscription ID
    const isTier = tierOrSubscriptionId && !tierOrSubscriptionId.startsWith('sub_');
    
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId,
        ...(tierOrSubscriptionId && !isTier && { stripeSubscriptionId: tierOrSubscriptionId }),
        ...(isTier && { subscriptionTier: tierOrSubscriptionId }),
        isPremium: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserStripeCustomer(userId: string, stripeCustomerId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        stripeCustomerId,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserLanguage(userId: string, language: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        language,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Admin User operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    // Handle both numeric IDs (serial) and UUID strings (varchar)
    // Try to convert to number, but if it fails (UUID), use the string as-is
    const userIdNumber = Number(id);
    const userId = isNaN(userIdNumber) ? id : userIdNumber;
    
    // Delete all user-related data in correct order to avoid foreign key constraint violations
    
    // Import all necessary tables at the top of the file if not already imported
    const {
      userQuizAttempts,
      userProgress,
      quizReports,
      liveCourseEnrollments,
      liveStreamingMessages,
      liveStreamingPollResponses,
      userVideoProgress,
      userBadges,
      userAchievements,
      userDailyChallenges,
      userCertificates,
      // Medical/Healthcare tables (already have onDelete: cascade in most cases, but including for safety)
      triageSessions,
      userHealthReports,
      preventionDocuments,
      doctorNotes,
      appointments,
      triageAlerts,
      preventionAssessments,
      userFeedback,
      auditLogs,
      prohmedCodes,
      doctorPatientLinks,
      // Tables with onDelete: cascade (will be deleted automatically, but can delete explicitly for clarity)
      // emailNotifications, pushSubscriptions, notifications, mlTrainingData
    } = await import('@shared/schema');
    
    // Delete quiz/learning related data
    await db.delete(userQuizAttempts).where(eq(userQuizAttempts.userId, userId));
    await db.delete(userProgress).where(eq(userProgress.userId, userId));
    await db.delete(quizReports).where(eq(quizReports.userId, userId));
    
    // Delete course related data
    await db.delete(liveCourseEnrollments).where(eq(liveCourseEnrollments.userId, userId));
    await db.delete(userVideoProgress).where(eq(userVideoProgress.userId, userId));
    
    // Delete gamification data
    await db.delete(userBadges).where(eq(userBadges.userId, userId));
    await db.delete(userAchievements).where(eq(userAchievements.userId, userId));
    await db.delete(userDailyChallenges).where(eq(userDailyChallenges.userId, userId));
    await db.delete(userCertificates).where(eq(userCertificates.userId, userId));
    
    // Delete streaming data
    await db.delete(liveStreamingMessages).where(eq(liveStreamingMessages.userId, userId));
    await db.delete(liveStreamingPollResponses).where(eq(liveStreamingPollResponses.userId, userId));
    
    // Delete medical/healthcare data (some have cascade, but explicit for safety)
    await db.delete(triageAlerts).where(eq(triageAlerts.userId, userId));
    await db.delete(triageSessions).where(eq(triageSessions.userId, userId));
    await db.delete(userHealthReports).where(eq(userHealthReports.userId, userId));
    await db.delete(preventionDocuments).where(eq(preventionDocuments.uploadedById, userId));
    await db.delete(preventionAssessments).where(eq(preventionAssessments.userId, userId));
    await db.delete(userFeedback).where(eq(userFeedback.userId, userId));
    
    // Delete appointments where user is doctor or patient
    await db.delete(appointments).where(or(
      eq(appointments.doctorId, userId),
      eq(appointments.patientId, userId)
    ));
    
    // Delete doctor-related data (notes where user is doctor OR patient)
    await db.delete(doctorNotes).where(or(
      eq(doctorNotes.doctorId, userId),
      eq(doctorNotes.patientId, userId)
    ));
    await db.delete(doctorPatientLinks).where(or(
      eq(doctorPatientLinks.doctorId, userId),
      eq(doctorPatientLinks.patientId, userId)
    ));
    
    // Delete Prohmed codes linked to user (set null on delete for this table)
    await db.delete(prohmedCodes).where(eq(prohmedCodes.userId, userId));
    
    // Delete audit logs
    await db.delete(auditLogs).where(eq(auditLogs.userId, userId));
    
    // Tables with onDelete: cascade will be automatically deleted:
    // - emailNotifications
    // - pushSubscriptions  
    // - notifications
    // - mlTrainingData (onDelete: set null)
    
    // Finally, delete the user (handles both numeric and UUID IDs)
    await db.delete(users).where(eq(users.id, userId));
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByDoctorCode(doctorCode: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(sql`UPPER(${users.doctorCode}) = UPPER(${doctorCode})`);
    return user;
  }

  async getUserByNickname(nickname: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.nickname, nickname));
    return user;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.passwordResetToken, token));
    return user;
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData as any)
      .returning();
    return user;
  }

  async setPasswordResetToken(userId: string, token: string, expires: Date): Promise<void> {
    await db
      .update(users)
      .set({
        passwordResetToken: token,
        passwordResetExpires: expires,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async updateUserPassword(userId: string, password: string): Promise<void> {
    await db
      .update(users)
      .set({
        password,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async clearPasswordResetToken(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        passwordResetToken: null,
        passwordResetExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // Quiz operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.sortOrder, categories.name);
  }

  async getCategoriesWithQuizzes(userId?: string, isAdminOverride: boolean = false): Promise<Array<Category & { quizzes: QuizWithCount[] }>> {
    // Get user's corporate agreement if they have one (skip if admin override)
    let userCorporateAgreementId: string | null = null;
    if (userId && !isAdminOverride) {
      const user = await this.getUser(userId);
      userCorporateAgreementId = user?.corporateAgreementId || null;
    }

    // Get accessible quiz IDs for corporate user (skip if admin override)
    let accessibleQuizIds = new Set<string>();
    if (userCorporateAgreementId && !isAdminOverride) {
      const accesses = await this.getQuizAccessByCorporateAgreement(userCorporateAgreementId);
      accessibleQuizIds = new Set(accesses.map(a => a.quizId));
    }

    // Optimize with a single LEFT JOIN query instead of N+1 queries
    const rows = await db
      .select()
      .from(categories)
      .leftJoin(quizzes, eq(categories.id, quizzes.categoryId))
      .orderBy(categories.sortOrder, categories.name, quizzes.title);

    // Get question counts for all quizzes in one query
    const questionCounts = await db
      .select({
        quizId: questions.quizId,
        count: sql<number>`cast(count(${questions.id}) as integer)`,
      })
      .from(questions)
      .groupBy(questions.quizId);

    // Create a map of quiz ID to question count
    const countMap = new Map<string, number>();
    for (const { quizId, count } of questionCounts) {
      countMap.set(quizId, count);
    }

    // Get crossword IDs for all quizzes in one query
    const crosswordIds = await db
      .select({
        quizId: crosswordPuzzles.quizId,
        crosswordId: crosswordPuzzles.id,
      })
      .from(crosswordPuzzles);

    // Create a map of quiz ID to crossword ID
    const crosswordMap = new Map<string, string>();
    for (const { quizId, crosswordId } of crosswordIds) {
      if (quizId) {
        crosswordMap.set(quizId, crosswordId);
      }
    }

    // Group quizzes by category
    const categoryMap = new Map<string, Category & { quizzes: QuizWithCount[] }>();
    
    for (const row of rows) {
      const category = row.categories;
      const quiz = row.quizzes;
      
      if (!categoryMap.has(category.id)) {
        categoryMap.set(category.id, {
          ...category,
          quizzes: []
        });
      }
      
      if (quiz) {
        // Filter based on visibility (skip if admin override)
        const isPublic = !quiz.visibilityType || quiz.visibilityType === 'public';
        const isCorporateExclusive = quiz.visibilityType === 'corporate_exclusive';
        const hasAccess = userCorporateAgreementId && accessibleQuizIds.has(quiz.id);

        // Show quiz if: admin override OR it's public OR (it's corporate_exclusive AND user has access)
        if (isAdminOverride || isPublic || (isCorporateExclusive && hasAccess)) {
          // Add question count and crossword ID to quiz
          const quizWithCount = {
            ...quiz,
            questionCount: countMap.get(quiz.id) || 0,
            crosswordId: crosswordMap.get(quiz.id)
          };
          categoryMap.get(category.id)!.quizzes.push(quizWithCount);
        }
      }
    }

    return Array.from(categoryMap.values());
  }

  async getAllQuizzes(userId?: string, isAdminOverride: boolean = false): Promise<Quiz[]> {
    // Get user's corporate agreement if they have one (skip if admin override)
    let userCorporateAgreementId: string | null = null;
    if (userId && !isAdminOverride) {
      const user = await this.getUser(userId);
      userCorporateAgreementId = user?.corporateAgreementId || null;
    }

    // Get accessible quiz IDs for corporate user (skip if admin override)
    let accessibleQuizIds = new Set<string>();
    if (userCorporateAgreementId && !isAdminOverride) {
      const accesses = await this.getQuizAccessByCorporateAgreement(userCorporateAgreementId);
      accessibleQuizIds = new Set(accesses.map(a => a.quizId));
    }

    const allQuizzes = await db
      .select()
      .from(quizzes)
      .orderBy(quizzes.title);

    // Filter based on visibility (skip if admin override)
    if (isAdminOverride) {
      return allQuizzes;
    }
    
    return allQuizzes.filter(quiz => {
      const isPublic = !quiz.visibilityType || quiz.visibilityType === 'public';
      const isCorporateExclusive = quiz.visibilityType === 'corporate_exclusive';
      const hasAccess = userCorporateAgreementId && accessibleQuizIds.has(quiz.id);
      return isPublic || (isCorporateExclusive && hasAccess);
    });
  }

  async getQuizzesByCategory(categoryId: string, userId?: string, isAdminOverride: boolean = false): Promise<Quiz[]> {
    // Get user's corporate agreement if they have one (skip if admin override)
    let userCorporateAgreementId: string | null = null;
    if (userId && !isAdminOverride) {
      const user = await this.getUser(userId);
      userCorporateAgreementId = user?.corporateAgreementId || null;
    }

    // Get accessible quiz IDs for corporate user (skip if admin override)
    let accessibleQuizIds = new Set<string>();
    if (userCorporateAgreementId && !isAdminOverride) {
      const accesses = await this.getQuizAccessByCorporateAgreement(userCorporateAgreementId);
      accessibleQuizIds = new Set(accesses.map(a => a.quizId));
    }

    const categoryQuizzes = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.categoryId, categoryId))
      .orderBy(quizzes.title);

    // Filter based on visibility (skip if admin override)
    if (isAdminOverride) {
      return categoryQuizzes;
    }
    
    return categoryQuizzes.filter(quiz => {
      const isPublic = !quiz.visibilityType || quiz.visibilityType === 'public';
      const isCorporateExclusive = quiz.visibilityType === 'corporate_exclusive';
      const hasAccess = userCorporateAgreementId && accessibleQuizIds.has(quiz.id);
      return isPublic || (isCorporateExclusive && hasAccess);
    });
  }

  async getQuizById(id: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz;
  }

  async getQuestionsByQuizId(quizId: string): Promise<Question[]> {
    return await db
      .select()
      .from(questions)
      .where(eq(questions.quizId, quizId))
      .orderBy(sql`RANDOM()`); // Randomize question order
  }

  async getAllQuestions(): Promise<Question[]> {
    return await db
      .select()
      .from(questions)
      .orderBy(questions.quizId);
  }

  async getQuestionById(id: string): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question;
  }

  // Admin Category operations
  async createCategory(categoryData: Omit<Category, 'id' | 'createdAt'>): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(categoryData)
      .returning();
    return category;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    const [category] = await db
      .update(categories)
      .set(updates)
      .where(eq(categories.id, id))
      .returning();
    return category;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Admin Quiz operations
  async createQuiz(quizData: Omit<Quiz, 'id' | 'createdAt'>): Promise<Quiz> {
    const [quiz] = await db
      .insert(quizzes)
      .values(quizData)
      .returning();
    return quiz;
  }

  async updateQuiz(id: string, updates: Partial<Quiz>): Promise<Quiz> {
    const [quiz] = await db
      .update(quizzes)
      .set(updates)
      .where(eq(quizzes.id, id))
      .returning();
    return quiz;
  }

  async deleteQuiz(id: string): Promise<void> {
    // Delete in correct order to avoid foreign key constraint violations
    
    // 1. Delete quiz reports (references userQuizAttempts)
    const attempts = await db
      .select({ id: userQuizAttempts.id })
      .from(userQuizAttempts)
      .where(eq(userQuizAttempts.quizId, id));
    
    const attemptIds = attempts.map(a => a.id);
    if (attemptIds.length > 0) {
      await db.delete(quizReports).where(
        sql`${quizReports.attemptId} IN (${sql.join(attemptIds.map(id => sql`${id}`), sql`, `)})`
      );
    }
    
    // 2. Delete user quiz attempts
    await db.delete(userQuizAttempts).where(eq(userQuizAttempts.quizId, id));
    
    // 3. Delete quiz generation jobs
    await db.delete(quizGenerationJobs).where(eq(quizGenerationJobs.quizId, id));
    
    // 4. Delete questions
    await db.delete(questions).where(eq(questions.quizId, id));
    
    // 5. Delete live course related data
    const courses = await db
      .select({ id: liveCourses.id })
      .from(liveCourses)
      .where(eq(liveCourses.quizId, id));
    
    const courseIds = courses.map(c => c.id);
    if (courseIds.length > 0) {
      // Delete enrollments first
      await db.delete(liveCourseEnrollments).where(
        sql`${liveCourseEnrollments.courseId} IN (${sql.join(courseIds.map(id => sql`${id}`), sql`, `)})`
      );
      
      // Delete sessions
      await db.delete(liveCourseSessions).where(
        sql`${liveCourseSessions.courseId} IN (${sql.join(courseIds.map(id => sql`${id}`), sql`, `)})`
      );
      
      // Delete courses
      await db.delete(liveCourses).where(eq(liveCourses.quizId, id));
    }
    
    // 6. Finally delete the quiz itself
    await db.delete(quizzes).where(eq(quizzes.id, id));
  }

  // Admin Question operations
  async createQuestion(questionData: Omit<Question, 'id' | 'createdAt'>): Promise<Question> {
    const [question] = await db
      .insert(questions)
      .values(questionData)
      .returning();
    return question;
  }

  async updateQuestion(id: string, updates: Partial<Question>): Promise<Question> {
    const [question] = await db
      .update(questions)
      .set(updates)
      .where(eq(questions.id, id))
      .returning();
    return question;
  }

  async deleteQuestion(id: string): Promise<void> {
    await db.delete(questions).where(eq(questions.id, id));
  }

  // Quiz generation job operations
  async createGenerationJob(jobData: InsertQuizGenerationJob): Promise<QuizGenerationJob> {
    const [job] = await db
      .insert(quizGenerationJobs)
      .values(jobData)
      .returning();
    return job;
  }

  async updateGenerationJob(id: string, updates: Partial<QuizGenerationJob>): Promise<QuizGenerationJob> {
    const [job] = await db
      .update(quizGenerationJobs)
      .set(updates)
      .where(eq(quizGenerationJobs.id, id))
      .returning();
    return job;
  }

  async getGenerationJobById(id: string): Promise<QuizGenerationJob | undefined> {
    const [job] = await db
      .select()
      .from(quizGenerationJobs)
      .where(eq(quizGenerationJobs.id, id));
    return job;
  }

  async getGenerationJobsByQuizId(quizId: string): Promise<QuizGenerationJob[]> {
    return await db
      .select()
      .from(quizGenerationJobs)
      .where(eq(quizGenerationJobs.quizId, quizId))
      .orderBy(desc(quizGenerationJobs.createdAt));
  }

  // User progress operations
  async createQuizAttempt(attempt: InsertUserQuizAttempt): Promise<UserQuizAttempt> {
    const [created] = await db
      .insert(userQuizAttempts)
      .values(attempt)
      .returning();
    return created;
  }

  async getQuizAttemptById(attemptId: string): Promise<UserQuizAttempt | undefined> {
    const [attempt] = await db
      .select()
      .from(userQuizAttempts)
      .where(eq(userQuizAttempts.id, attemptId));
    return attempt;
  }

  async getUserQuizAttempts(userId: string, limit = 10): Promise<(UserQuizAttempt & { quizTitle: string })[]> {
    const results = await db
      .select({
        id: userQuizAttempts.id,
        userId: userQuizAttempts.userId,
        quizId: userQuizAttempts.quizId,
        answers: userQuizAttempts.answers,
        score: userQuizAttempts.score,
        correctAnswers: userQuizAttempts.correctAnswers,
        totalQuestions: userQuizAttempts.totalQuestions,
        timeSpent: userQuizAttempts.timeSpent,
        pointsEarned: userQuizAttempts.pointsEarned,
        completedAt: userQuizAttempts.completedAt,
        quizTitle: quizzes.title,
      })
      .from(userQuizAttempts)
      .leftJoin(quizzes, eq(userQuizAttempts.quizId, quizzes.id))
      .where(eq(userQuizAttempts.userId, userId))
      .orderBy(desc(userQuizAttempts.completedAt))
      .limit(limit);
    
    return results.map(r => ({
      ...r,
      quizTitle: r.quizTitle || 'Quiz Sconosciuto'
    }));
  }

  async getUserProgress(userId: string): Promise<UserProgress[]> {
    return await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));
  }

  async updateUserProgress(userId: string, categoryId: string, attempt: UserQuizAttempt): Promise<void> {
    // Check if user progress exists for this category
    const [existing] = await db
      .select()
      .from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.categoryId, categoryId)));

    if (existing) {
      // Update existing progress
      const newQuizzesCompleted = (existing.quizzesCompleted || 0) + 1;
      const newTotalTime = (existing.totalTimeSpent || 0) + attempt.timeSpent;
      const newAverageScore = Math.round(
        (((existing.averageScore || 0) * (existing.quizzesCompleted || 0)) + attempt.score) / newQuizzesCompleted
      );

      await db
        .update(userProgress)
        .set({
          quizzesCompleted: newQuizzesCompleted,
          averageScore: newAverageScore,
          totalTimeSpent: newTotalTime,
          lastAttemptAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userProgress.id, existing.id));
    } else {
      // Create new progress record
      await db
        .insert(userProgress)
        .values({
          userId,
          categoryId,
          quizzesCompleted: 1,
          averageScore: attempt.score,
          totalTimeSpent: attempt.timeSpent,
          lastAttemptAt: new Date(),
        });
    }
  }

  // Report operations
  async createQuizReport(reportData: InsertQuizReport): Promise<QuizReport> {
    const [report] = await db
      .insert(quizReports)
      .values(reportData)
      .returning();
    return report;
  }

  async getQuizReport(attemptId: string): Promise<QuizReport | undefined> {
    const [report] = await db
      .select()
      .from(quizReports)
      .where(eq(quizReports.attemptId, attemptId));
    return report;
  }

  async getUserReports(userId: string, limit = 10): Promise<QuizReport[]> {
    return await db
      .select()
      .from(quizReports)
      .where(eq(quizReports.userId, userId))
      .orderBy(desc(quizReports.createdAt))
      .limit(limit);
  }

  // Live course operations
  async createLiveCourse(course: InsertLiveCourse): Promise<LiveCourse> {
    const [created] = await db
      .insert(liveCourses)
      .values(course)
      .returning();
    return created;
  }

  async updateLiveCourse(id: string, updates: Partial<LiveCourse>): Promise<LiveCourse> {
    const [updated] = await db
      .update(liveCourses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(liveCourses.id, id))
      .returning();
    return updated;
  }

  async deleteLiveCourse(id: string): Promise<void> {
    await db.delete(liveCourses).where(eq(liveCourses.id, id));
  }

  async getLiveCourseById(id: string): Promise<LiveCourse | undefined> {
    const [course] = await db
      .select()
      .from(liveCourses)
      .where(eq(liveCourses.id, id));
    return course;
  }

  async getLiveCourseByQuizId(quizId: string): Promise<LiveCourse | undefined> {
    const [course] = await db
      .select()
      .from(liveCourses)
      .where(and(eq(liveCourses.quizId, quizId), eq(liveCourses.isActive, true)));
    return course;
  }

  async getAllLiveCourses(userId?: string, isAdminOverride: boolean = false): Promise<LiveCourse[]> {
    // Get user's corporate agreement if they have one (skip if admin override)
    let userCorporateAgreementId: string | null = null;
    if (userId && !isAdminOverride) {
      const user = await this.getUser(userId);
      userCorporateAgreementId = user?.corporateAgreementId || null;
    }

    // Get accessible live course IDs for corporate user (skip if admin override)
    let accessibleLiveCourseIds = new Set<string>();
    if (userCorporateAgreementId && !isAdminOverride) {
      const accesses = await this.getLiveCourseAccessByCorporateAgreement(userCorporateAgreementId);
      accessibleLiveCourseIds = new Set(accesses.map(a => a.liveCourseId));
    }

    const allCourses = await db
      .select()
      .from(liveCourses)
      .where(eq(liveCourses.isActive, true));

    // Filter based on visibility (skip if admin override)
    if (isAdminOverride) {
      return allCourses;
    }
    
    return allCourses.filter(course => {
      const isPublic = !course.visibilityType || course.visibilityType === 'public';
      const isCorporateExclusive = course.visibilityType === 'corporate_exclusive';
      const hasAccess = userCorporateAgreementId && accessibleLiveCourseIds.has(course.id);
      return isPublic || (isCorporateExclusive && hasAccess);
    });
  }

  // Live course session operations
  async createLiveCourseSession(session: InsertLiveCourseSession): Promise<LiveCourseSession> {
    const [created] = await db
      .insert(liveCourseSessions)
      .values(session)
      .returning();
    return created;
  }

  async updateLiveCourseSession(id: string, updates: Partial<LiveCourseSession>): Promise<LiveCourseSession> {
    const [updated] = await db
      .update(liveCourseSessions)
      .set(updates)
      .where(eq(liveCourseSessions.id, id))
      .returning();
    return updated;
  }

  async deleteLiveCourseSession(id: string): Promise<void> {
    await db.delete(liveCourseSessions).where(eq(liveCourseSessions.id, id));
  }

  async getSessionsByCourseId(courseId: string): Promise<LiveCourseSession[]> {
    return await db
      .select()
      .from(liveCourseSessions)
      .where(eq(liveCourseSessions.courseId, courseId))
      .orderBy(liveCourseSessions.startDate);
  }

  async getSessionById(id: string): Promise<LiveCourseSession | undefined> {
    const [session] = await db
      .select()
      .from(liveCourseSessions)
      .where(eq(liveCourseSessions.id, id));
    return session;
  }

  // Live course enrollment operations
  async createLiveCourseEnrollment(enrollment: InsertLiveCourseEnrollment): Promise<LiveCourseEnrollment> {
    const [created] = await db
      .insert(liveCourseEnrollments)
      .values(enrollment)
      .returning();
    return created;
  }

  async updateLiveCourseEnrollment(id: string, updates: Partial<LiveCourseEnrollment>): Promise<LiveCourseEnrollment> {
    const [updated] = await db
      .update(liveCourseEnrollments)
      .set(updates)
      .where(eq(liveCourseEnrollments.id, id))
      .returning();
    return updated;
  }

  async getUserEnrollments(userId: string): Promise<LiveCourseEnrollment[]> {
    return await db
      .select()
      .from(liveCourseEnrollments)
      .where(eq(liveCourseEnrollments.userId, userId))
      .orderBy(desc(liveCourseEnrollments.enrolledAt));
  }

  async getLiveCourseEnrollment(liveCourseId: string, userId: string): Promise<LiveCourseEnrollment | undefined> {
    const [enrollment] = await db
      .select()
      .from(liveCourseEnrollments)
      .where(and(
        eq(liveCourseEnrollments.courseId, liveCourseId),
        eq(liveCourseEnrollments.userId, userId)
      ))
      .limit(1);
    return enrollment;
  }

  async getUserEnrollmentForSession(userId: string, sessionId: string): Promise<LiveCourseEnrollment | undefined> {
    const [enrollment] = await db
      .select()
      .from(liveCourseEnrollments)
      .where(and(
        eq(liveCourseEnrollments.userId, userId),
        eq(liveCourseEnrollments.sessionId, sessionId)
      ))
      .limit(1);
    return enrollment;
  }

  // Live streaming session operations
  async createLiveStreamingSession(session: InsertLiveStreamingSession): Promise<LiveStreamingSession> {
    const [created] = await db
      .insert(liveStreamingSessions)
      .values(session)
      .returning();
    return created;
  }

  async updateLiveStreamingSession(id: string, updates: Partial<LiveStreamingSession>): Promise<LiveStreamingSession> {
    const [updated] = await db
      .update(liveStreamingSessions)
      .set(updates)
      .where(eq(liveStreamingSessions.id, id))
      .returning();
    return updated;
  }

  async getActiveStreamingSession(sessionId: string): Promise<LiveStreamingSession | undefined> {
    const [session] = await db
      .select()
      .from(liveStreamingSessions)
      .where(and(
        eq(liveStreamingSessions.sessionId, sessionId),
        eq(liveStreamingSessions.isActive, true)
      ))
      .limit(1);
    return session;
  }

  async getLiveStreamingSessionBySessionId(sessionId: string): Promise<LiveStreamingSession | undefined> {
    const [session] = await db
      .select()
      .from(liveStreamingSessions)
      .where(eq(liveStreamingSessions.sessionId, sessionId))
      .orderBy(desc(liveStreamingSessions.createdAt))
      .limit(1);
    return session;
  }

  async endLiveStreamingSession(id: string): Promise<void> {
    await db
      .update(liveStreamingSessions)
      .set({ isActive: false, endedAt: new Date() })
      .where(eq(liveStreamingSessions.id, id));
  }

  // Live streaming chat operations
  async createLiveStreamingMessage(message: InsertLiveStreamingMessage): Promise<LiveStreamingMessage> {
    const [created] = await db
      .insert(liveStreamingMessages)
      .values(message)
      .returning();
    return created;
  }

  async getStreamingMessages(streamingSessionId: string, limit: number = 100): Promise<LiveStreamingMessage[]> {
    return await db
      .select()
      .from(liveStreamingMessages)
      .where(eq(liveStreamingMessages.streamingSessionId, streamingSessionId))
      .orderBy(desc(liveStreamingMessages.createdAt))
      .limit(limit);
  }

  // Live streaming poll operations
  async createLiveStreamingPoll(poll: InsertLiveStreamingPoll): Promise<LiveStreamingPoll> {
    const [created] = await db
      .insert(liveStreamingPolls)
      .values(poll)
      .returning();
    return created;
  }

  async updateLiveStreamingPoll(id: string, updates: Partial<LiveStreamingPoll>): Promise<LiveStreamingPoll> {
    const [updated] = await db
      .update(liveStreamingPolls)
      .set(updates)
      .where(eq(liveStreamingPolls.id, id))
      .returning();
    return updated;
  }

  async getActivePoll(streamingSessionId: string): Promise<LiveStreamingPoll | undefined> {
    const [poll] = await db
      .select()
      .from(liveStreamingPolls)
      .where(and(
        eq(liveStreamingPolls.streamingSessionId, streamingSessionId),
        eq(liveStreamingPolls.isActive, true)
      ))
      .orderBy(desc(liveStreamingPolls.createdAt))
      .limit(1);
    return poll;
  }

  async getStreamingPolls(streamingSessionId: string): Promise<LiveStreamingPoll[]> {
    return await db
      .select()
      .from(liveStreamingPolls)
      .where(eq(liveStreamingPolls.streamingSessionId, streamingSessionId))
      .orderBy(desc(liveStreamingPolls.createdAt));
  }

  // Live streaming poll response operations
  async createPollResponse(response: InsertLiveStreamingPollResponse): Promise<LiveStreamingPollResponse> {
    const [created] = await db
      .insert(liveStreamingPollResponses)
      .values(response)
      .returning();
    return created;
  }

  async getPollResponses(pollId: string): Promise<LiveStreamingPollResponse[]> {
    return await db
      .select()
      .from(liveStreamingPollResponses)
      .where(eq(liveStreamingPollResponses.pollId, pollId))
      .orderBy(desc(liveStreamingPollResponses.createdAt));
  }

  async getUserPollResponse(pollId: string, userId: string): Promise<LiveStreamingPollResponse | undefined> {
    const [response] = await db
      .select()
      .from(liveStreamingPollResponses)
      .where(and(
        eq(liveStreamingPollResponses.pollId, pollId),
        eq(liveStreamingPollResponses.userId, userId)
      ))
      .limit(1);
    return response;
  }

  async getPollStats(pollId: string): Promise<{option: string; count: number}[]> {
    const results = await db
      .select({
        option: liveStreamingPollResponses.selectedOption,
        count: sql<number>`count(*)::int`
      })
      .from(liveStreamingPollResponses)
      .where(eq(liveStreamingPollResponses.pollId, pollId))
      .groupBy(liveStreamingPollResponses.selectedOption);
    
    return results.map(r => ({ option: r.option, count: r.count }));
  }

  // On-demand course operations
  async createOnDemandCourse(course: InsertOnDemandCourse): Promise<OnDemandCourse> {
    const [created] = await db
      .insert(onDemandCourses)
      .values(course)
      .returning();
    return created;
  }

  async updateOnDemandCourse(id: string, updates: Partial<OnDemandCourse>): Promise<OnDemandCourse> {
    const [updated] = await db
      .update(onDemandCourses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(onDemandCourses.id, id))
      .returning();
    return updated;
  }

  async deleteOnDemandCourse(id: string): Promise<void> {
    await db.delete(onDemandCourses).where(eq(onDemandCourses.id, id));
  }

  async getOnDemandCourseById(id: string): Promise<OnDemandCourse | undefined> {
    const [course] = await db
      .select()
      .from(onDemandCourses)
      .where(eq(onDemandCourses.id, id));
    return course;
  }

  async getAllOnDemandCourses(includeInactive: boolean = false, userId?: string, isAdminOverride: boolean = false): Promise<OnDemandCourse[]> {
    // Get user's corporate agreement if they have one (skip if admin override)
    let userCorporateAgreementId: string | null = null;
    if (userId && !isAdminOverride) {
      const user = await this.getUser(userId);
      userCorporateAgreementId = user?.corporateAgreementId || null;
    }

    // Get accessible on-demand course IDs for corporate user (skip if admin override)
    let accessibleCourseIds = new Set<string>();
    if (userCorporateAgreementId && !isAdminOverride) {
      const accesses = await this.getOnDemandCourseAccessByCorporateAgreement(userCorporateAgreementId);
      accessibleCourseIds = new Set(accesses.map(a => a.onDemandCourseId));
    }

    let allCourses: OnDemandCourse[];
    if (includeInactive) {
      allCourses = await db
        .select()
        .from(onDemandCourses)
        .orderBy(onDemandCourses.sortOrder);
    } else {
      allCourses = await db
        .select()
        .from(onDemandCourses)
        .where(eq(onDemandCourses.isActive, true))
        .orderBy(onDemandCourses.sortOrder);
    }

    // Filter based on visibility (skip if admin override)
    if (isAdminOverride) {
      return allCourses;
    }
    
    return allCourses.filter(course => {
      const isPublic = !course.visibilityType || course.visibilityType === 'public';
      const isCorporateExclusive = course.visibilityType === 'corporate_exclusive';
      const hasAccess = userCorporateAgreementId && accessibleCourseIds.has(course.id);
      return isPublic || (isCorporateExclusive && hasAccess);
    });
  }

  // Course video operations
  async createCourseVideo(video: InsertCourseVideo): Promise<CourseVideo> {
    const [created] = await db
      .insert(courseVideos)
      .values(video)
      .returning();
    return created;
  }

  async updateCourseVideo(id: string, updates: Partial<CourseVideo>): Promise<CourseVideo> {
    const [updated] = await db
      .update(courseVideos)
      .set(updates)
      .where(eq(courseVideos.id, id))
      .returning();
    return updated;
  }

  async deleteCourseVideo(id: string): Promise<void> {
    await db.delete(courseVideos).where(eq(courseVideos.id, id));
  }

  async getVideosByCourseId(courseId: string): Promise<CourseVideo[]> {
    return await db
      .select()
      .from(courseVideos)
      .where(eq(courseVideos.courseId, courseId))
      .orderBy(courseVideos.sortOrder);
  }

  async getCourseVideoById(id: string): Promise<CourseVideo | undefined> {
    const [video] = await db
      .select()
      .from(courseVideos)
      .where(eq(courseVideos.id, id));
    return video;
  }

  // Video question operations
  async createVideoQuestion(question: InsertVideoQuestion): Promise<VideoQuestion> {
    const [created] = await db
      .insert(videoQuestions)
      .values(question)
      .returning();
    return created;
  }

  async updateVideoQuestion(id: string, updates: Partial<VideoQuestion>): Promise<VideoQuestion> {
    const [updated] = await db
      .update(videoQuestions)
      .set(updates)
      .where(eq(videoQuestions.id, id))
      .returning();
    return updated;
  }

  async deleteVideoQuestion(id: string): Promise<void> {
    await db.delete(videoQuestions).where(eq(videoQuestions.id, id));
  }

  async getQuestionsByVideoId(videoId: string): Promise<VideoQuestion[]> {
    return await db
      .select()
      .from(videoQuestions)
      .where(eq(videoQuestions.videoId, videoId))
      .orderBy(videoQuestions.sortOrder);
  }

  // Course question operations (at course level, not video level)
  async createCourseQuestion(question: InsertCourseQuestion): Promise<CourseQuestion> {
    const [created] = await db
      .insert(courseQuestions)
      .values(question)
      .returning();
    return created;
  }

  async updateCourseQuestion(id: string, updates: Partial<CourseQuestion>): Promise<CourseQuestion> {
    const [updated] = await db
      .update(courseQuestions)
      .set(updates)
      .where(eq(courseQuestions.id, id))
      .returning();
    return updated;
  }

  async deleteCourseQuestion(id: string): Promise<void> {
    await db.delete(courseQuestions).where(eq(courseQuestions.id, id));
  }

  async getQuestionsByCourseId(courseId: string): Promise<CourseQuestion[]> {
    return await db
      .select()
      .from(courseQuestions)
      .where(eq(courseQuestions.courseId, courseId))
      .orderBy(courseQuestions.sortOrder);
  }

  // User video progress operations
  async upsertUserVideoProgress(progress: InsertUserVideoProgress): Promise<UserVideoProgress> {
    const [upserted] = await db
      .insert(userVideoProgress)
      .values(progress)
      .onConflictDoUpdate({
        target: [userVideoProgress.userId, userVideoProgress.videoId],
        set: {
          ...progress,
          lastWatchedAt: new Date(),
        },
      })
      .returning();
    return upserted;
  }

  async getUserVideoProgress(userId: string, courseId: string): Promise<UserVideoProgress[]> {
    return await db
      .select()
      .from(userVideoProgress)
      .where(
        and(
          eq(userVideoProgress.userId, userId),
          eq(userVideoProgress.courseId, courseId)
        )
      );
  }

  async getUserCourseProgress(userId: string, courseId: string): Promise<{completed: number; total: number}> {
    const [result] = await db
      .select({
        completed: sql<number>`count(*) filter (where ${userVideoProgress.completed} = true)`,
        total: sql<number>`count(*)`
      })
      .from(userVideoProgress)
      .where(
        and(
          eq(userVideoProgress.userId, userId),
          eq(userVideoProgress.courseId, courseId)
        )
      );
    return result || { completed: 0, total: 0 };
  }
  
  // Content page operations
  async getAllContentPages(): Promise<ContentPage[]> {
    return await db
      .select()
      .from(contentPages)
      .orderBy(contentPages.slug);
  }
  
  async getContentPageBySlug(slug: string): Promise<ContentPage | undefined> {
    const [page] = await db
      .select()
      .from(contentPages)
      .where(eq(contentPages.slug, slug));
    return page;
  }
  
  async getContentPageById(id: string): Promise<ContentPage | undefined> {
    const [page] = await db
      .select()
      .from(contentPages)
      .where(eq(contentPages.id, id));
    return page;
  }
  
  async createContentPage(page: InsertContentPage): Promise<ContentPage> {
    const [created] = await db
      .insert(contentPages)
      .values(page)
      .returning();
    return created;
  }
  
  async updateContentPage(id: string, updates: Partial<ContentPage>): Promise<ContentPage> {
    const [updated] = await db
      .update(contentPages)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contentPages.id, id))
      .returning();
    return updated;
  }
  
  async deleteContentPage(id: string): Promise<void> {
    await db.delete(contentPages).where(eq(contentPages.id, id));
  }
  
  // Gamification - Badge operations
  async getAllBadges(): Promise<Badge[]> {
    return await db.select().from(badges).orderBy(badges.sortOrder, badges.name);
  }
  
  async getBadgeById(id: string): Promise<Badge | undefined> {
    const [badge] = await db.select().from(badges).where(eq(badges.id, id));
    return badge;
  }
  
  async createBadge(badge: InsertBadge): Promise<Badge> {
    const [created] = await db.insert(badges).values(badge).returning();
    return created;
  }
  
  async updateBadge(id: string, updates: Partial<Badge>): Promise<Badge> {
    const [updated] = await db
      .update(badges)
      .set(updates)
      .where(eq(badges.id, id))
      .returning();
    return updated;
  }
  
  async deleteBadge(id: string): Promise<void> {
    await db.delete(badges).where(eq(badges.id, id));
  }
  
  async getUserBadges(userId: string): Promise<(UserBadge & { badge: Badge })[]> {
    const results = await db
      .select({
        id: userBadges.id,
        userId: userBadges.userId,
        badgeId: userBadges.badgeId,
        earnedAt: userBadges.earnedAt,
        badge: badges,
      })
      .from(userBadges)
      .leftJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, userId))
      .orderBy(desc(userBadges.earnedAt));
    
    return results.filter(r => r.badge !== null) as (UserBadge & { badge: Badge })[];
  }
  
  async awardBadge(userId: string, badgeId: string): Promise<UserBadge> {
    const [created] = await db
      .insert(userBadges)
      .values({ userId, badgeId })
      .returning();
    return created;
  }
  
  // Gamification - Achievement operations
  async getAllAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements).orderBy(achievements.sortOrder, achievements.name);
  }
  
  async getAchievementById(id: string): Promise<Achievement | undefined> {
    const [achievement] = await db.select().from(achievements).where(eq(achievements.id, id));
    return achievement;
  }
  
  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const [created] = await db.insert(achievements).values(achievement).returning();
    return created;
  }
  
  async updateAchievement(id: string, updates: Partial<Achievement>): Promise<Achievement> {
    const [updated] = await db
      .update(achievements)
      .set(updates)
      .where(eq(achievements.id, id))
      .returning();
    return updated;
  }
  
  async deleteAchievement(id: string): Promise<void> {
    await db.delete(achievements).where(eq(achievements.id, id));
  }
  
  async getUserAchievements(userId: string): Promise<(UserAchievement & { achievement: Achievement })[]> {
    const results = await db
      .select({
        id: userAchievements.id,
        userId: userAchievements.userId,
        achievementId: userAchievements.achievementId,
        progress: userAchievements.progress,
        isUnlocked: userAchievements.isUnlocked,
        unlockedAt: userAchievements.unlockedAt,
        createdAt: userAchievements.createdAt,
        updatedAt: userAchievements.updatedAt,
        achievement: achievements,
      })
      .from(userAchievements)
      .leftJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId))
      .orderBy(desc(userAchievements.unlockedAt), userAchievements.progress);
    
    return results.filter(r => r.achievement !== null) as (UserAchievement & { achievement: Achievement })[];
  }
  
  // Gamification - Daily challenge operations
  async getTodayDailyChallenge(): Promise<DailyChallenge | undefined> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [challenge] = await db
      .select()
      .from(dailyChallenges)
      .where(
        and(
          eq(dailyChallenges.isActive, true),
          gte(dailyChallenges.date, today)
        )
      )
      .orderBy(dailyChallenges.date)
      .limit(1);
    
    return challenge;
  }
  
  async createDailyChallenge(challenge: InsertDailyChallenge): Promise<DailyChallenge> {
    const [created] = await db
      .insert(dailyChallenges)
      .values(challenge)
      .returning();
    return created;
  }
  
  async getUserDailyChallengeStatus(userId: string, challengeId: string): Promise<UserDailyChallenge | undefined> {
    const [status] = await db
      .select()
      .from(userDailyChallenges)
      .where(
        and(
          eq(userDailyChallenges.userId, userId),
          eq(userDailyChallenges.challengeId, challengeId)
        )
      );
    
    return status;
  }
  
  async completeDailyChallenge(userChallenge: InsertUserDailyChallenge): Promise<UserDailyChallenge> {
    const [created] = await db
      .insert(userDailyChallenges)
      .values(userChallenge)
      .returning();
    return created;
  }
  
  // Gamification - Certificate operations
  async getUserCertificates(userId: string): Promise<UserCertificate[]> {
    return await db
      .select()
      .from(userCertificates)
      .where(eq(userCertificates.userId, userId))
      .orderBy(desc(userCertificates.issuedAt));
  }
  
  async getCertificateById(id: string): Promise<UserCertificate | undefined> {
    const [certificate] = await db
      .select()
      .from(userCertificates)
      .where(eq(userCertificates.id, id));
    return certificate;
  }
  
  async getCertificateByVerificationCode(code: string): Promise<UserCertificate | undefined> {
    const [certificate] = await db
      .select()
      .from(userCertificates)
      .where(eq(userCertificates.verificationCode, code));
    return certificate;
  }
  
  async createCertificate(certificate: InsertUserCertificate): Promise<UserCertificate> {
    const [created] = await db
      .insert(userCertificates)
      .values(certificate)
      .returning();
    return created;
  }
  
  async updateCertificate(id: string, updates: Partial<UserCertificate>): Promise<UserCertificate> {
    const [updated] = await db
      .update(userCertificates)
      .set(updates)
      .where(eq(userCertificates.id, id))
      .returning();
    return updated;
  }
  
  // Gamification - Leaderboard operations
  async getGlobalLeaderboard(limit = 50, period = 'all_time'): Promise<(Leaderboard & { user: User })[]> {
    const results = await db
      .select({
        id: leaderboard.id,
        userId: leaderboard.userId,
        categoryId: leaderboard.categoryId,
        rank: leaderboard.rank,
        points: leaderboard.points,
        quizzesCompleted: leaderboard.quizzesCompleted,
        averageScore: leaderboard.averageScore,
        period: leaderboard.period,
        updatedAt: leaderboard.updatedAt,
        user: users,
      })
      .from(leaderboard)
      .leftJoin(users, eq(leaderboard.userId, users.id))
      .where(
        and(
          sql`${leaderboard.categoryId} IS NULL`,
          eq(leaderboard.period, period)
        )
      )
      .orderBy(leaderboard.rank)
      .limit(limit);
    
    return results.filter(r => r.user !== null) as (Leaderboard & { user: User })[];
  }
  
  async getCategoryLeaderboard(categoryId: string, limit = 50, period = 'all_time'): Promise<(Leaderboard & { user: User })[]> {
    const results = await db
      .select({
        id: leaderboard.id,
        userId: leaderboard.userId,
        categoryId: leaderboard.categoryId,
        rank: leaderboard.rank,
        points: leaderboard.points,
        quizzesCompleted: leaderboard.quizzesCompleted,
        averageScore: leaderboard.averageScore,
        period: leaderboard.period,
        updatedAt: leaderboard.updatedAt,
        user: users,
      })
      .from(leaderboard)
      .leftJoin(users, eq(leaderboard.userId, users.id))
      .where(
        and(
          eq(leaderboard.categoryId, categoryId),
          eq(leaderboard.period, period)
        )
      )
      .orderBy(leaderboard.rank)
      .limit(limit);
    
    return results.filter(r => r.user !== null) as (Leaderboard & { user: User })[];
  }
  
  async getUserLeaderboardPosition(userId: string, categoryId?: string, period = 'all_time'): Promise<Leaderboard | undefined> {
    const [position] = await db
      .select()
      .from(leaderboard)
      .where(
        and(
          eq(leaderboard.userId, userId),
          categoryId ? eq(leaderboard.categoryId, categoryId) : sql`${leaderboard.categoryId} IS NULL`,
          eq(leaderboard.period, period)
        )
      );
    
    return position;
  }
  
  // Gamification - Activity log operations
  async getUserActivityLog(userId: string, limit = 50): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLog)
      .where(eq(activityLog.userId, userId))
      .orderBy(desc(activityLog.createdAt))
      .limit(limit);
  }
  
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [created] = await db.insert(activityLog).values(log).returning();
    return created;
  }
  
  // Corporate agreement operations
  async getCorporateAgreementByEmailDomain(emailDomain: string): Promise<CorporateAgreement | undefined> {
    const [agreement] = await db
      .select()
      .from(corporateAgreements)
      .where(eq(corporateAgreements.emailDomain, emailDomain));
    return agreement;
  }
  
  async getCorporateAgreementByPromoCode(promoCode: string): Promise<CorporateAgreement | undefined> {
    const [agreement] = await db
      .select()
      .from(corporateAgreements)
      .where(eq(corporateAgreements.promoCode, promoCode));
    return agreement;
  }
  
  async getCorporateAgreementById(id: string): Promise<CorporateAgreement | undefined> {
    const [agreement] = await db
      .select()
      .from(corporateAgreements)
      .where(eq(corporateAgreements.id, id));
    return agreement;
  }
  
  async getAllCorporateAgreements(): Promise<CorporateAgreement[]> {
    return await db.select().from(corporateAgreements).orderBy(desc(corporateAgreements.createdAt));
  }
  
  async createCorporateAgreement(agreement: InsertCorporateAgreement): Promise<CorporateAgreement> {
    const [created] = await db.insert(corporateAgreements).values(agreement).returning();
    return created;
  }
  
  async updateCorporateAgreement(id: string, updates: Partial<CorporateAgreement>): Promise<CorporateAgreement> {
    const [updated] = await db
      .update(corporateAgreements)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(corporateAgreements.id, id))
      .returning();
    return updated;
  }
  
  async deleteCorporateAgreement(id: string): Promise<void> {
    await db.delete(corporateAgreements).where(eq(corporateAgreements.id, id));
  }
  
  async incrementCorporateAgreementUsers(id: string): Promise<boolean> {
    // Atomic increment with licensesOwned enforcement
    const result = await db
      .update(corporateAgreements)
      .set({ 
        currentUsers: sql`${corporateAgreements.currentUsers} + 1`,
        licensesUsed: sql`${corporateAgreements.licensesUsed} + 1`,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(corporateAgreements.id, id),
          // Only increment if below license limit (atomic check-and-update)
          sql`${corporateAgreements.currentUsers} < ${corporateAgreements.licensesOwned}`
        )
      )
      .returning();
    
    // Return true if update succeeded (row was updated), false if limit reached
    return result.length > 0;
  }
  
  async decrementCorporateAgreementUsers(id: string): Promise<void> {
    await db
      .update(corporateAgreements)
      .set({ 
        currentUsers: sql`GREATEST(0, ${corporateAgreements.currentUsers} - 1)`,
        updatedAt: new Date()
      })
      .where(eq(corporateAgreements.id, id));
  }
  
  async getUsersByCorporateAgreement(agreementId: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.corporateAgreementId, agreementId))
      .orderBy(desc(users.createdAt));
  }
  
  async getCorporateAgreementByAdminUserId(userId: string): Promise<CorporateAgreement | undefined> {
    const [agreement] = await db
      .select()
      .from(corporateAgreements)
      .where(eq(corporateAgreements.adminUserId, userId));
    return agreement;
  }
  
  // Corporate invite operations
  async createCorporateInvite(invite: InsertCorporateInvite): Promise<CorporateInvite> {
    const [created] = await db.insert(corporateInvites).values(invite).returning();
    return created;
  }
  
  async getCorporateInviteByToken(token: string): Promise<CorporateInvite | undefined> {
    const [invite] = await db
      .select()
      .from(corporateInvites)
      .where(eq(corporateInvites.token, token));
    return invite;
  }
  
  async getCorporateInvitesByAgreement(agreementId: string): Promise<CorporateInvite[]> {
    return await db
      .select()
      .from(corporateInvites)
      .where(eq(corporateInvites.corporateAgreementId, agreementId))
      .orderBy(desc(corporateInvites.createdAt));
  }
  
  async updateCorporateInviteStatus(id: string, status: string, acceptedAt?: Date): Promise<CorporateInvite> {
    const [updated] = await db
      .update(corporateInvites)
      .set({ status, acceptedAt })
      .where(eq(corporateInvites.id, id))
      .returning();
    return updated;
  }
  
  async deleteCorporateInvite(id: string): Promise<void> {
    await db.delete(corporateInvites).where(eq(corporateInvites.id, id));
  }
  
  // Corporate course assignment operations
  async createCorporateCourseAssignment(assignment: InsertCorporateCourseAssignment): Promise<SelectCorporateCourseAssignment> {
    const [created] = await db.insert(corporateCourseAssignments).values(assignment).returning();
    return created;
  }
  
  async getCorporateCourseAssignmentsByAgreement(agreementId: string): Promise<SelectCorporateCourseAssignment[]> {
    return await db
      .select()
      .from(corporateCourseAssignments)
      .where(eq(corporateCourseAssignments.corporateAgreementId, agreementId))
      .orderBy(desc(corporateCourseAssignments.createdAt));
  }
  
  async deleteCorporateCourseAssignment(id: string): Promise<void> {
    await db.delete(corporateCourseAssignments).where(eq(corporateCourseAssignments.id, id));
  }
  
  // Corporate license operations
  async createCorporateLicense(license: InsertCorporateLicense): Promise<CorporateLicense> {
    const [created] = await db.insert(corporateLicenses).values(license).returning();
    return created;
  }
  
  async getCorporateLicensesByAgreement(agreementId: string): Promise<CorporateLicense[]> {
    return await db
      .select()
      .from(corporateLicenses)
      .where(eq(corporateLicenses.corporateAgreementId, agreementId))
      .orderBy(desc(corporateLicenses.purchasedAt));
  }
  
  async updateCorporateLicense(id: string, updates: Partial<CorporateLicense>): Promise<CorporateLicense> {
    const [updated] = await db
      .update(corporateLicenses)
      .set(updates)
      .where(eq(corporateLicenses.id, id))
      .returning();
    return updated;
  }
  
  // Corporate content access operations - Quiz
  async grantQuizAccess(quizId: string, corporateAgreementId: string): Promise<QuizCorporateAccess> {
    const [access] = await db
      .insert(quizCorporateAccess)
      .values({ quizId, corporateAgreementId })
      .onConflictDoNothing()
      .returning();
    
    // If access already exists, fetch and return it
    if (!access) {
      const [existing] = await db
        .select()
        .from(quizCorporateAccess)
        .where(
          and(
            eq(quizCorporateAccess.quizId, quizId),
            eq(quizCorporateAccess.corporateAgreementId, corporateAgreementId)
          )
        );
      return existing;
    }
    
    return access;
  }
  
  async revokeQuizAccess(quizId: string, corporateAgreementId: string): Promise<void> {
    await db
      .delete(quizCorporateAccess)
      .where(
        and(
          eq(quizCorporateAccess.quizId, quizId),
          eq(quizCorporateAccess.corporateAgreementId, corporateAgreementId)
        )
      );
  }
  
  async getQuizAccessByCorporateAgreement(corporateAgreementId: string): Promise<QuizCorporateAccess[]> {
    return await db
      .select()
      .from(quizCorporateAccess)
      .where(eq(quizCorporateAccess.corporateAgreementId, corporateAgreementId));
  }
  
  async checkQuizAccess(quizId: string, corporateAgreementId: string): Promise<boolean> {
    const [access] = await db
      .select()
      .from(quizCorporateAccess)
      .where(
        and(
          eq(quizCorporateAccess.quizId, quizId),
          eq(quizCorporateAccess.corporateAgreementId, corporateAgreementId)
        )
      );
    return !!access;
  }
  
  // Corporate content access operations - Live Course
  async grantLiveCourseAccess(liveCourseId: string, corporateAgreementId: string): Promise<LiveCourseCorporateAccess> {
    const [access] = await db
      .insert(liveCourseCorporateAccess)
      .values({ liveCourseId, corporateAgreementId })
      .onConflictDoNothing()
      .returning();
    
    // If access already exists, fetch and return it
    if (!access) {
      const [existing] = await db
        .select()
        .from(liveCourseCorporateAccess)
        .where(
          and(
            eq(liveCourseCorporateAccess.liveCourseId, liveCourseId),
            eq(liveCourseCorporateAccess.corporateAgreementId, corporateAgreementId)
          )
        );
      return existing;
    }
    
    return access;
  }
  
  async revokeLiveCourseAccess(liveCourseId: string, corporateAgreementId: string): Promise<void> {
    await db
      .delete(liveCourseCorporateAccess)
      .where(
        and(
          eq(liveCourseCorporateAccess.liveCourseId, liveCourseId),
          eq(liveCourseCorporateAccess.corporateAgreementId, corporateAgreementId)
        )
      );
  }
  
  async getLiveCourseAccessByCorporateAgreement(corporateAgreementId: string): Promise<LiveCourseCorporateAccess[]> {
    return await db
      .select()
      .from(liveCourseCorporateAccess)
      .where(eq(liveCourseCorporateAccess.corporateAgreementId, corporateAgreementId));
  }
  
  async getLiveCourseAccessByLiveCourseId(liveCourseId: string): Promise<LiveCourseCorporateAccess[]> {
    return await db
      .select()
      .from(liveCourseCorporateAccess)
      .where(eq(liveCourseCorporateAccess.liveCourseId, liveCourseId));
  }
  
  async checkLiveCourseAccess(liveCourseId: string, corporateAgreementId: string): Promise<boolean> {
    const [access] = await db
      .select()
      .from(liveCourseCorporateAccess)
      .where(
        and(
          eq(liveCourseCorporateAccess.liveCourseId, liveCourseId),
          eq(liveCourseCorporateAccess.corporateAgreementId, corporateAgreementId)
        )
      );
    return !!access;
  }
  
  // Corporate content access operations - On-Demand Course
  async grantOnDemandCourseAccess(onDemandCourseId: string, corporateAgreementId: string): Promise<OnDemandCourseCorporateAccess> {
    const [access] = await db
      .insert(onDemandCourseCorporateAccess)
      .values({ onDemandCourseId, corporateAgreementId })
      .onConflictDoNothing()
      .returning();
    
    // If access already exists, fetch and return it
    if (!access) {
      const [existing] = await db
        .select()
        .from(onDemandCourseCorporateAccess)
        .where(
          and(
            eq(onDemandCourseCorporateAccess.onDemandCourseId, onDemandCourseId),
            eq(onDemandCourseCorporateAccess.corporateAgreementId, corporateAgreementId)
          )
        );
      return existing;
    }
    
    return access;
  }
  
  async revokeOnDemandCourseAccess(onDemandCourseId: string, corporateAgreementId: string): Promise<void> {
    await db
      .delete(onDemandCourseCorporateAccess)
      .where(
        and(
          eq(onDemandCourseCorporateAccess.onDemandCourseId, onDemandCourseId),
          eq(onDemandCourseCorporateAccess.corporateAgreementId, corporateAgreementId)
        )
      );
  }
  
  async getOnDemandCourseAccessByCorporateAgreement(corporateAgreementId: string): Promise<OnDemandCourseCorporateAccess[]> {
    return await db
      .select()
      .from(onDemandCourseCorporateAccess)
      .where(eq(onDemandCourseCorporateAccess.corporateAgreementId, corporateAgreementId));
  }
  
  async checkOnDemandCourseAccess(onDemandCourseId: string, corporateAgreementId: string): Promise<boolean> {
    const [access] = await db
      .select()
      .from(onDemandCourseCorporateAccess)
      .where(
        and(
          eq(onDemandCourseCorporateAccess.onDemandCourseId, onDemandCourseId),
          eq(onDemandCourseCorporateAccess.corporateAgreementId, corporateAgreementId)
        )
      );
    return !!access;
  }
  
  // Settings operations
  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key));
    return setting;
  }
  
  async getAllSettings(): Promise<Setting[]> {
    return await db.select().from(settings).orderBy(settings.category, settings.key);
  }
  
  async upsertSetting(key: string, value: string, description?: string, category?: string): Promise<Setting> {
    const [setting] = await db
      .insert(settings)
      .values({
        key,
        value,
        description,
        category,
      })
      .onConflictDoUpdate({
        target: settings.key,
        set: {
          value,
          description,
          category,
          updatedAt: new Date(),
        },
      })
      .returning();
    return setting;
  }
  
  async deleteSetting(key: string): Promise<void> {
    await db.delete(settings).where(eq(settings.key, key));
  }

  // Analytics operations
  async getUserAnalyticsByCategory(userId: string, categoryId: string): Promise<{
    totalAttempts: number;
    averageScore: number;
    bestScore: number;
    recentScores: number[];
    timeSpent: number;
    weakTopics: string[];
    strongTopics: string[];
  } | null> {
    // Get all attempts for quizzes in this category
    const attempts = await db
      .select({
        score: userQuizAttempts.score,
        timeSpent: userQuizAttempts.timeSpent,
        completedAt: userQuizAttempts.completedAt,
      })
      .from(userQuizAttempts)
      .leftJoin(quizzes, eq(userQuizAttempts.quizId, quizzes.id))
      .where(and(
        eq(userQuizAttempts.userId, userId),
        eq(quizzes.categoryId, categoryId)
      ))
      .orderBy(desc(userQuizAttempts.completedAt))
      .limit(20);

    if (attempts.length === 0) {
      return null;
    }

    // Get reports for weak/strong topics
    const reports = await db
      .select({
        weakAreas: quizReports.weakAreas,
        strengths: quizReports.strengths,
      })
      .from(quizReports)
      .leftJoin(userQuizAttempts, eq(quizReports.attemptId, userQuizAttempts.id))
      .leftJoin(quizzes, eq(userQuizAttempts.quizId, quizzes.id))
      .where(and(
        eq(quizReports.userId, userId),
        eq(quizzes.categoryId, categoryId)
      ))
      .orderBy(desc(quizReports.createdAt))
      .limit(5);

    const scores = attempts.map(a => a.score);
    const totalTimeSpent = attempts.reduce((sum, a) => sum + a.timeSpent, 0);

    // Aggregate weak and strong topics
    const weakTopicsMap = new Map<string, number>();
    const strongTopicsSet = new Set<string>();

    reports.forEach(r => {
      const weak = r.weakAreas as any[];
      const strong = r.strengths as string[];
      
      if (weak) {
        weak.forEach(w => {
          const count = weakTopicsMap.get(w.category) || 0;
          weakTopicsMap.set(w.category, count + 1);
        });
      }
      
      if (strong) {
        strong.forEach(s => strongTopicsSet.add(s));
      }
    });

    const weakTopics = Array.from(weakTopicsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);

    const strongTopics = Array.from(strongTopicsSet).slice(0, 5);

    return {
      totalAttempts: attempts.length,
      averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      bestScore: Math.max(...scores),
      recentScores: scores.slice(0, 10),
      timeSpent: totalTimeSpent,
      weakTopics,
      strongTopics,
    };
  }

  async getCategoryBenchmark(categoryId: string): Promise<{
    averageScore: number;
    totalAttempts: number;
    topPerformers: number;
  }> {
    // Get aggregate stats for all users in this category
    const stats = await db
      .select({
        avgScore: sql<number>`AVG(${userQuizAttempts.score})::int`,
        totalAttempts: sql<number>`COUNT(*)::int`,
        topPerformers: sql<number>`COUNT(DISTINCT CASE WHEN ${userQuizAttempts.score} >= 90 THEN ${userQuizAttempts.userId} END)::int`,
      })
      .from(userQuizAttempts)
      .leftJoin(quizzes, eq(userQuizAttempts.quizId, quizzes.id))
      .where(eq(quizzes.categoryId, categoryId));

    return {
      averageScore: stats[0]?.avgScore || 0,
      totalAttempts: stats[0]?.totalAttempts || 0,
      topPerformers: stats[0]?.topPerformers || 0,
    };
  }

  async getUserPerformanceTrend(userId: string, days: number = 30): Promise<Array<{
    date: string;
    averageScore: number;
    attemptsCount: number;
  }>> {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    const attempts = await db
      .select({
        completedAt: userQuizAttempts.completedAt,
        score: userQuizAttempts.score,
      })
      .from(userQuizAttempts)
      .where(and(
        eq(userQuizAttempts.userId, userId),
        sql`${userQuizAttempts.completedAt} >= ${dateThreshold}`
      ))
      .orderBy(userQuizAttempts.completedAt);

    // Group by date
    const grouped = new Map<string, { scores: number[]; count: number }>();
    
    attempts.forEach(a => {
      if (!a.completedAt) return;
      const date = a.completedAt.toISOString().split('T')[0];
      const existing = grouped.get(date) || { scores: [], count: 0 };
      existing.scores.push(a.score);
      existing.count++;
      grouped.set(date, existing);
    });

    return Array.from(grouped.entries()).map(([date, data]) => ({
      date,
      averageScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.count),
      attemptsCount: data.count,
    }));
  }

  // Email template operations
  async getAllEmailTemplates(): Promise<EmailTemplate[]> {
    return await db.select().from(emailTemplates).orderBy(emailTemplates.name);
  }

  async getEmailTemplateByCode(code: string): Promise<EmailTemplate | undefined> {
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.code, code));
    return template;
  }

  async getEmailTemplateById(id: string): Promise<EmailTemplate | undefined> {
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, id));
    return template;
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const [newTemplate] = await db
      .insert(emailTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  async updateEmailTemplate(id: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate> {
    const [updated] = await db
      .update(emailTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emailTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteEmailTemplate(id: string): Promise<void> {
    await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
  }

  // Subscription plan operations
  async getAllSubscriptionPlans(includeInactive: boolean = false): Promise<SubscriptionPlan[]> {
    if (includeInactive) {
      return await db.select().from(subscriptionPlans).orderBy(subscriptionPlans.sortOrder);
    }
    return await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(subscriptionPlans.sortOrder);
  }

  async getSubscriptionPlanById(id: string): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, id));
    return plan;
  }

  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [newPlan] = await db
      .insert(subscriptionPlans)
      .values(plan)
      .returning();
    return newPlan;
  }

  async updateSubscriptionPlan(id: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const [updated] = await db
      .update(subscriptionPlans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(subscriptionPlans.id, id))
      .returning();
    return updated;
  }

  async deleteSubscriptionPlan(id: string): Promise<void> {
    await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, id));
  }

  // Leaderboard operations
  async getLeaderboard(limit: number = 100): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.totalPoints), desc(users.level))
      .limit(limit);
  }

  async getTeamLeaderboard(corporateAgreementId: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.corporateAgreementId, corporateAgreementId))
      .orderBy(desc(users.totalPoints), desc(users.level));
  }

  // AI Scenario Conversation operations
  async createScenarioConversation(conversation: InsertScenarioConversation): Promise<ScenarioConversation> {
    const [created] = await db
      .insert(scenarioConversations)
      .values(conversation)
      .returning();
    return created;
  }

  async getScenarioConversation(id: string): Promise<ScenarioConversation | undefined> {
    const [conversation] = await db
      .select()
      .from(scenarioConversations)
      .where(eq(scenarioConversations.id, id));
    return conversation;
  }

  async getUserScenarioConversation(questionId: string, userId: string): Promise<ScenarioConversation | undefined> {
    const [conversation] = await db
      .select()
      .from(scenarioConversations)
      .where(and(
        eq(scenarioConversations.questionId, questionId),
        eq(scenarioConversations.userId, userId),
        eq(scenarioConversations.isActive, true)
      ))
      .orderBy(desc(scenarioConversations.createdAt))
      .limit(1);
    return conversation;
  }

  async createScenarioMessage(message: InsertScenarioMessage): Promise<ScenarioMessage> {
    const [created] = await db
      .insert(scenarioMessages)
      .values(message)
      .returning();
    return created;
  }

  async getConversationMessages(conversationId: string): Promise<ScenarioMessage[]> {
    return await db
      .select()
      .from(scenarioMessages)
      .where(eq(scenarioMessages.conversationId, conversationId))
      .orderBy(scenarioMessages.createdAt);
  }

  async endScenarioConversation(id: string): Promise<void> {
    await db
      .update(scenarioConversations)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(scenarioConversations.id, id));
  }

  // User feedback operations
  async createUserFeedback(feedback: InsertUserFeedback): Promise<UserFeedback> {
    const [created] = await db
      .insert(userFeedback)
      .values(feedback)
      .returning();
    return created;
  }

  async getAllUserFeedback(): Promise<(UserFeedback & { user?: User })[]> {
    const feedbacks = await db
      .select({
        feedback: userFeedback,
        user: users,
      })
      .from(userFeedback)
      .leftJoin(users, eq(userFeedback.userId, users.id))
      .orderBy(desc(userFeedback.createdAt));
    
    return feedbacks.map(f => ({
      ...f.feedback,
      user: f.user || undefined,
    }));
  }

  async updateFeedbackResolution(id: number, isResolved: boolean, adminNotes?: string): Promise<void> {
    await db
      .update(userFeedback)
      .set({ isResolved, adminNotes })
      .where(eq(userFeedback.id, id));
  }

  async incrementUserLoginCount(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ loginCount: sql`${users.loginCount} + 1` })
      .where(eq(users.id, userId));
  }

  async markUserFeedbackSubmitted(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ feedbackSubmitted: true })
      .where(eq(users.id, userId));
  }

  async getUserFeedbackByUserId(userId: string): Promise<UserFeedback[]> {
    return await db
      .select()
      .from(userFeedback)
      .where(eq(userFeedback.userId, userId))
      .orderBy(desc(userFeedback.createdAt));
  }

  async checkUserHasRecentFeedback(userId: string, days: number = 30): Promise<boolean> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const [result] = await db
      .select()
      .from(userFeedback)
      .where(and(
        eq(userFeedback.userId, userId),
        gte(userFeedback.createdAt, cutoffDate)
      ))
      .limit(1);
    
    return !!result;
  }

  // ========== PREVENTION SYSTEM IMPLEMENTATIONS ==========
  
  // Prevention document operations
  async createPreventionDocument(doc: InsertPreventionDocument): Promise<PreventionDocument> {
    const [document] = await db.insert(preventionDocuments).values(doc).returning();
    return document;
  }

  async getPreventionDocumentById(id: string): Promise<PreventionDocument | undefined> {
    const [doc] = await db.select().from(preventionDocuments).where(eq(preventionDocuments.id, id));
    return doc;
  }

  async getAllPreventionDocuments(activeOnly: boolean = false): Promise<PreventionDocument[]> {
    const query = db.select().from(preventionDocuments);
    if (activeOnly) {
      return await query.where(eq(preventionDocuments.isActive, true)).orderBy(desc(preventionDocuments.createdAt));
    }
    return await query.orderBy(desc(preventionDocuments.createdAt));
  }

  async getPreventionDocumentsByUser(userId: string): Promise<PreventionDocument[]> {
    return await db
      .select()
      .from(preventionDocuments)
      .where(eq(preventionDocuments.uploadedById, userId))
      .orderBy(desc(preventionDocuments.createdAt)); // Order by creation date descending (most recent first)
  }

  async updatePreventionDocument(id: string, updates: Partial<PreventionDocument>): Promise<PreventionDocument> {
    const [doc] = await db
      .update(preventionDocuments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(preventionDocuments.id, id))
      .returning();
    return doc;
  }

  async deletePreventionDocument(id: string): Promise<void> {
    await db.delete(preventionDocuments).where(eq(preventionDocuments.id, id));
  }

  // Prevention topic operations
  async createPreventionTopic(topic: InsertPreventionTopic): Promise<PreventionTopic> {
    const [newTopic] = await db.insert(preventionTopics).values(topic).returning();
    return newTopic;
  }

  async getPreventionTopicById(id: string): Promise<PreventionTopic | undefined> {
    const [topic] = await db.select().from(preventionTopics).where(eq(preventionTopics.id, id));
    return topic;
  }

  async getAllPreventionTopics(): Promise<PreventionTopic[]> {
    return await db.select().from(preventionTopics).orderBy(preventionTopics.name);
  }

  async updatePreventionTopic(id: string, updates: Partial<PreventionTopic>): Promise<PreventionTopic> {
    const [topic] = await db
      .update(preventionTopics)
      .set(updates)
      .where(eq(preventionTopics.id, id))
      .returning();
    return topic;
  }

  async deletePreventionTopic(id: string): Promise<void> {
    await db.delete(preventionTopics).where(eq(preventionTopics.id, id));
  }

  // Triage session operations
  async createTriageSession(session: InsertTriageSession): Promise<TriageSession> {
    const [newSession] = await db.insert(triageSessions).values(session).returning();
    return newSession;
  }

  async getTriageSessionById(id: string): Promise<TriageSession | undefined> {
    const [session] = await db.select().from(triageSessions).where(eq(triageSessions.id, id));
    return session;
  }

  async getTriageSessionsByUser(userId: string): Promise<TriageSession[]> {
    return await db
      .select()
      .from(triageSessions)
      .where(eq(triageSessions.userId, userId))
      .orderBy(desc(triageSessions.createdAt));
  }

  async updateTriageSession(id: string, updates: Partial<TriageSession>): Promise<TriageSession> {
    const [session] = await db
      .update(triageSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(triageSessions.id, id))
      .returning();
    return session;
  }

  async closeTriageSession(id: string): Promise<TriageSession> {
    const [session] = await db
      .update(triageSessions)
      .set({ status: 'closed', closedAt: new Date(), updatedAt: new Date() })
      .where(eq(triageSessions.id, id))
      .returning();
    return session;
  }

  // Triage message operations
  async createTriageMessage(message: InsertTriageMessage): Promise<TriageMessage> {
    const [newMessage] = await db.insert(triageMessages).values(message).returning();
    return newMessage;
  }

  async getTriageMessagesBySession(sessionId: string): Promise<TriageMessage[]> {
    return await db
      .select()
      .from(triageMessages)
      .where(eq(triageMessages.sessionId, sessionId))
      .orderBy(triageMessages.createdAt);
  }

  // Triage alert operations
  async createTriageAlert(alert: InsertTriageAlert): Promise<TriageAlert> {
    const [newAlert] = await db.insert(triageAlerts).values(alert).returning();
    
    // Auto-send WhatsApp for EMERGENCY alerts
    if (newAlert.urgencyLevel === 'EMERGENCY') {
      try {
        const user = await this.getUser(newAlert.userId);
        if (user?.whatsappNumber && user?.whatsappNotificationsEnabled && (user as any)?.whatsappVerified) {
          const { sendWhatsAppMessage } = await import('./twilio');
          const message = `🚨 CIRY - ALERT EMERGENZA\n\nÈ stato rilevato un segnale che richiede attenzione medica urgente.\n\nAccedi subito all'app per visualizzare i dettagli e contattare il tuo medico.\n\nhttps://ciry.app`;
          
          await sendWhatsAppMessage(user.whatsappNumber, message);
          console.log(`[WhatsApp] Emergency alert sent to user ${user.id}`);
        }
      } catch (error) {
        console.error('[WhatsApp] Failed to send emergency alert:', error);
        // Don't block alert creation if WhatsApp fails
      }
    }
    
    return newAlert;
  }

  async getTriageAlertById(id: string): Promise<TriageAlert | undefined> {
    const [alert] = await db
      .select()
      .from(triageAlerts)
      .where(eq(triageAlerts.id, id));
    return alert;
  }

  async getTriageAlertsBySession(sessionId: string): Promise<TriageAlert[]> {
    return await db
      .select()
      .from(triageAlerts)
      .where(eq(triageAlerts.sessionId, sessionId))
      .orderBy(desc(triageAlerts.createdAt));
  }

  async getUserTriageAlerts(userId: string): Promise<TriageAlert[]> {
    return await db
      .select()
      .from(triageAlerts)
      .where(eq(triageAlerts.userId, userId))
      .orderBy(desc(triageAlerts.createdAt));
  }

  async getUnreviewedTriageAlerts(): Promise<TriageAlert[]> {
    return await db
      .select()
      .from(triageAlerts)
      .where(eq(triageAlerts.isReviewed, false))
      .orderBy(desc(triageAlerts.createdAt));
  }

  async getAllTriageAlerts(): Promise<TriageAlert[]> {
    return await db
      .select()
      .from(triageAlerts)
      .orderBy(desc(triageAlerts.createdAt));
  }

  async getAllTriageAlertsWithDetails(): Promise<Array<TriageAlert & { session?: TriageSession; user?: User }>> {
    const results = await db
      .select({
        alert: triageAlerts,
        session: triageSessions,
        user: users,
      })
      .from(triageAlerts)
      .leftJoin(triageSessions, eq(triageAlerts.sessionId, triageSessions.id))
      .leftJoin(users, eq(triageSessions.userId, users.id))
      .orderBy(desc(triageAlerts.createdAt));

    return results.map((row) => ({
      ...row.alert,
      session: row.session || undefined,
      user: row.user || undefined,
    }));
  }

  async updateTriageAlert(id: string, updates: Partial<TriageAlert>): Promise<TriageAlert> {
    const [alert] = await db
      .update(triageAlerts)
      .set(updates)
      .where(eq(triageAlerts.id, id))
      .returning();
    return alert;
  }

  async getPendingAlertForUser(userId: string): Promise<TriageAlert | undefined> {
    const [alert] = await db
      .select()
      .from(triageAlerts)
      .where(
        and(
          eq(triageAlerts.userId, userId),
          eq(triageAlerts.status, 'pending'),
          or(
            eq(triageAlerts.urgencyLevel, 'medium'),
            eq(triageAlerts.urgencyLevel, 'high'),
            eq(triageAlerts.urgencyLevel, 'emergency')
          )
        )
      )
      .orderBy(desc(triageAlerts.createdAt))
      .limit(1);
    return alert;
  }

  async resolveUserAlert(alertId: string, response: string): Promise<TriageAlert> {
    const [alert] = await db
      .update(triageAlerts)
      .set({
        status: 'user_resolved',
        userResolved: true,
        userResolvedAt: new Date(),
        followupResponse: response,
      })
      .where(eq(triageAlerts.id, alertId))
      .returning();
    return alert;
  }

  async updateAlertToMonitoring(alertId: string, response: string): Promise<TriageAlert> {
    const [alert] = await db
      .update(triageAlerts)
      .set({
        status: 'monitoring',
        userResolved: false,
        followupResponse: response,
      })
      .where(eq(triageAlerts.id, alertId))
      .returning();
    return alert;
  }

  // Prohmed code operations
  async createProhmedCode(code: InsertProhmedCode): Promise<ProhmedCode> {
    const [newCode] = await db.insert(prohmedCodes).values(code).returning();
    return newCode;
  }

  async getProhmedCodeByCode(code: string): Promise<ProhmedCode | undefined> {
    const [codeRecord] = await db.select().from(prohmedCodes).where(eq(prohmedCodes.code, code));
    return codeRecord;
  }

  async getProhmedCodesByUser(userId: string): Promise<ProhmedCode[]> {
    return await db
      .select()
      .from(prohmedCodes)
      .where(eq(prohmedCodes.userId, userId))
      .orderBy(desc(prohmedCodes.createdAt));
  }

  async updateProhmedCode(id: string, updates: Partial<ProhmedCode>): Promise<ProhmedCode> {
    const [code] = await db
      .update(prohmedCodes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(prohmedCodes.id, id))
      .returning();
    return code;
  }

  async redeemProhmedCode(code: string): Promise<ProhmedCode> {
    const [redeemedCode] = await db
      .update(prohmedCodes)
      .set({ status: 'redeemed', redeemedAt: new Date(), updatedAt: new Date() })
      .where(eq(prohmedCodes.code, code))
      .returning();
    return redeemedCode;
  }

  async createProhmedCodesBulk(count: number, accessType: string, source = 'admin_bulk', expiresAt?: Date): Promise<ProhmedCode[]> {
    const codesToInsert = [];
    for (let i = 0; i < count; i++) {
      const code = `PROHMED-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      codesToInsert.push({
        code,
        userId: null, // No user assigned initially
        source,
        accessType,
        status: 'active',
        expiresAt: expiresAt || null,
      });
      // Small delay to ensure unique timestamps
      await new Promise(resolve => setTimeout(resolve, 2));
    }
    
    const newCodes = await db.insert(prohmedCodes).values(codesToInsert).returning();
    return newCodes;
  }

  async getAllProhmedCodes(): Promise<ProhmedCode[]> {
    return await db
      .select()
      .from(prohmedCodes)
      .orderBy(desc(prohmedCodes.createdAt));
  }

  // ========== PREVENTION ASSESSMENT IMPLEMENTATIONS ==========
  
  // Prevention assessment operations
  async createPreventionAssessment(assessment: InsertPreventionAssessment): Promise<PreventionAssessment> {
    const [newAssessment] = await db.insert(preventionAssessments).values(assessment).returning();
    return newAssessment;
  }

  async getPreventionAssessmentById(id: string): Promise<PreventionAssessment | undefined> {
    const [assessment] = await db.select().from(preventionAssessments).where(eq(preventionAssessments.id, id));
    return assessment;
  }

  async getPreventionAssessmentsByUser(userId: string): Promise<PreventionAssessment[]> {
    return await db
      .select()
      .from(preventionAssessments)
      .where(eq(preventionAssessments.userId, userId))
      .orderBy(desc(preventionAssessments.createdAt));
  }

  async getLatestPreventionAssessment(userId: string): Promise<PreventionAssessment | undefined> {
    const [assessment] = await db
      .select()
      .from(preventionAssessments)
      .where(eq(preventionAssessments.userId, userId))
      .orderBy(desc(preventionAssessments.createdAt))
      .limit(1);
    return assessment;
  }

  async updatePreventionAssessment(id: string, updates: Partial<PreventionAssessment>): Promise<PreventionAssessment> {
    const [assessment] = await db
      .update(preventionAssessments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(preventionAssessments.id, id))
      .returning();
    return assessment;
  }

  async completePreventionAssessment(
    id: string, 
    score: number, 
    riskLevel: string, 
    recommendations: string[], 
    reportPdfUrl?: string
  ): Promise<PreventionAssessment> {
    const [assessment] = await db
      .update(preventionAssessments)
      .set({
        status: 'completed',
        score,
        riskLevel,
        recommendations,
        reportPdfUrl,
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(preventionAssessments.id, id))
      .returning();
    return assessment;
  }

  // Prevention assessment question operations
  async createPreventionAssessmentQuestion(question: InsertPreventionAssessmentQuestion): Promise<PreventionAssessmentQuestion> {
    const [newQuestion] = await db.insert(preventionAssessmentQuestions).values(question).returning();
    return newQuestion;
  }

  async getPreventionAssessmentQuestions(assessmentId: string): Promise<PreventionAssessmentQuestion[]> {
    return await db
      .select()
      .from(preventionAssessmentQuestions)
      .where(eq(preventionAssessmentQuestions.assessmentId, assessmentId))
      .orderBy(preventionAssessmentQuestions.orderIndex);
  }

  // Prevention user response operations
  async createPreventionUserResponse(response: InsertPreventionUserResponse): Promise<PreventionUserResponse> {
    const [newResponse] = await db.insert(preventionUserResponses).values(response).returning();
    return newResponse;
  }

  async getPreventionUserResponses(assessmentId: string): Promise<PreventionUserResponse[]> {
    return await db
      .select()
      .from(preventionUserResponses)
      .where(eq(preventionUserResponses.assessmentId, assessmentId))
      .orderBy(preventionUserResponses.createdAt);
  }

  async getUserResponsesByQuestion(questionId: string): Promise<PreventionUserResponse[]> {
    return await db
      .select()
      .from(preventionUserResponses)
      .where(eq(preventionUserResponses.questionId, questionId))
      .orderBy(preventionUserResponses.createdAt);
  }

  // Health risk prediction operations
  async createHealthRiskPrediction(prediction: InsertHealthRiskPrediction): Promise<HealthRiskPrediction> {
    const [newPrediction] = await db.insert(healthRiskPredictions).values(prediction).returning();
    return newPrediction;
  }

  async getActiveHealthRiskPredictionsForUser(userId: string): Promise<HealthRiskPrediction[]> {
    return await db
      .select()
      .from(healthRiskPredictions)
      .where(
        and(
          eq(healthRiskPredictions.userId, userId),
          eq(healthRiskPredictions.isActive, true),
          gt(healthRiskPredictions.expiresAt, new Date())
        )
      )
      .orderBy(desc(healthRiskPredictions.riskScore));
  }

  async deactivateExpiredPredictions(): Promise<void> {
    await db
      .update(healthRiskPredictions)
      .set({ isActive: false })
      .where(
        and(
          eq(healthRiskPredictions.isActive, true),
          lt(healthRiskPredictions.expiresAt, new Date())
        )
      );
  }

  // ========== CROSSWORD GAME IMPLEMENTATIONS ==========
  
  // Crossword puzzle operations
  async createCrosswordPuzzle(puzzle: InsertCrosswordPuzzle): Promise<CrosswordPuzzle> {
    const [newPuzzle] = await db.insert(crosswordPuzzles).values(puzzle).returning();
    return newPuzzle;
  }

  async getCrosswordPuzzleById(id: string): Promise<CrosswordPuzzle | undefined> {
    const [puzzle] = await db.select().from(crosswordPuzzles).where(eq(crosswordPuzzles.id, id));
    return puzzle;
  }

  async getAllCrosswordPuzzles(activeOnly: boolean = false): Promise<CrosswordPuzzle[]> {
    const query = db.select().from(crosswordPuzzles);
    if (activeOnly) {
      return await query.where(eq(crosswordPuzzles.isActive, true)).orderBy(desc(crosswordPuzzles.createdAt));
    }
    return await query.orderBy(desc(crosswordPuzzles.createdAt));
  }

  async getWeeklyCrosswordChallenge(weekNumber: number, weekYear: number): Promise<CrosswordPuzzle | undefined> {
    const [puzzle] = await db
      .select()
      .from(crosswordPuzzles)
      .where(and(
        eq(crosswordPuzzles.isWeeklyChallenge, true),
        eq(crosswordPuzzles.weekNumber, weekNumber),
        eq(crosswordPuzzles.weekYear, weekYear)
      ));
    return puzzle;
  }

  async updateCrosswordPuzzle(id: string, updates: Partial<CrosswordPuzzle>): Promise<CrosswordPuzzle> {
    const [puzzle] = await db
      .update(crosswordPuzzles)
      .set(updates)
      .where(eq(crosswordPuzzles.id, id))
      .returning();
    return puzzle;
  }

  async countUserCrosswordsForQuizToday(userId: string, quizId: string): Promise<number> {
    // Calculate 24 hours ago
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const result = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(crosswordPuzzles)
      .where(
        and(
          eq(crosswordPuzzles.quizId, quizId),
          eq(crosswordPuzzles.createdById, userId),
          gte(crosswordPuzzles.createdAt, twentyFourHoursAgo)
        )
      );

    return result[0]?.count || 0;
  }

  // Crossword attempt operations
  async createCrosswordAttempt(attempt: InsertCrosswordAttempt): Promise<CrosswordAttempt> {
    const [newAttempt] = await db.insert(crosswordAttempts).values(attempt).returning();
    return newAttempt;
  }

  async getCrosswordAttemptById(id: string): Promise<CrosswordAttempt | undefined> {
    const [attempt] = await db.select().from(crosswordAttempts).where(eq(crosswordAttempts.id, id));
    return attempt;
  }

  async getCrosswordAttemptByUserAndPuzzle(userId: string, puzzleId: string): Promise<CrosswordAttempt | undefined> {
    const [attempt] = await db
      .select()
      .from(crosswordAttempts)
      .where(and(
        eq(crosswordAttempts.userId, userId),
        eq(crosswordAttempts.puzzleId, puzzleId)
      ));
    return attempt;
  }

  async getCrosswordAttemptsByUser(userId: string): Promise<CrosswordAttempt[]> {
    return await db
      .select()
      .from(crosswordAttempts)
      .where(eq(crosswordAttempts.userId, userId))
      .orderBy(desc(crosswordAttempts.createdAt));
  }

  async updateCrosswordAttempt(id: string, updates: Partial<CrosswordAttempt>): Promise<CrosswordAttempt> {
    const [attempt] = await db
      .update(crosswordAttempts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(crosswordAttempts.id, id))
      .returning();
    return attempt;
  }

  // Crossword leaderboard operations
  async upsertCrosswordLeaderboard(entry: InsertCrosswordLeaderboard): Promise<CrosswordLeaderboard> {
    const [leaderboardEntry] = await db
      .insert(crosswordLeaderboard)
      .values(entry)
      .onConflictDoUpdate({
        target: [crosswordLeaderboard.userId, crosswordLeaderboard.weekNumber, crosswordLeaderboard.weekYear],
        set: {
          ...entry,
          updatedAt: new Date(),
        },
      })
      .returning();
    return leaderboardEntry;
  }

  async getCrosswordLeaderboardByWeek(weekNumber: number, weekYear: number): Promise<CrosswordLeaderboard[]> {
    return await db
      .select()
      .from(crosswordLeaderboard)
      .where(and(
        eq(crosswordLeaderboard.weekNumber, weekNumber),
        eq(crosswordLeaderboard.weekYear, weekYear)
      ))
      .orderBy(desc(crosswordLeaderboard.totalScore));
  }

  async getCrosswordLeaderboardByUser(userId: string): Promise<CrosswordLeaderboard[]> {
    return await db
      .select()
      .from(crosswordLeaderboard)
      .where(eq(crosswordLeaderboard.userId, userId))
      .orderBy(desc(crosswordLeaderboard.weekYear), desc(crosswordLeaderboard.weekNumber));
  }

  async updateCrosswordLeaderboard(id: string, updates: Partial<CrosswordLeaderboard>): Promise<CrosswordLeaderboard> {
    const [entry] = await db
      .update(crosswordLeaderboard)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(crosswordLeaderboard.id, id))
      .returning();
    return entry;
  }

  // ========== HEALTH SCORE SYSTEM ==========
  
  // Health report operations
  async createHealthReport(report: InsertUserHealthReport): Promise<UserHealthReport> {
    const [healthReport] = await db
      .insert(userHealthReports)
      .values(report)
      .returning();
    return healthReport;
  }

  async getHealthReportById(id: string): Promise<UserHealthReport | undefined> {
    const [report] = await db
      .select()
      .from(userHealthReports)
      .where(eq(userHealthReports.id, id));
    return report;
  }

  async getHealthReportsByUser(userId: string): Promise<UserHealthReport[]> {
    return await db
      .select()
      .from(userHealthReports)
      .where(eq(userHealthReports.userId, userId))
      .orderBy(desc(userHealthReports.createdAt));
  }

  async getHealthReportsByTriageSession(sessionId: string): Promise<UserHealthReport[]> {
    return await db
      .select()
      .from(userHealthReports)
      .where(eq(userHealthReports.triageSessionId, sessionId))
      .orderBy(desc(userHealthReports.createdAt));
  }

  async updateHealthReport(id: string, updates: Partial<UserHealthReport>): Promise<UserHealthReport> {
    const [report] = await db
      .update(userHealthReports)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userHealthReports.id, id))
      .returning();
    return report;
  }

  async deleteHealthReport(id: string): Promise<void> {
    await db.delete(userHealthReports).where(eq(userHealthReports.id, id));
  }

  // Health score history operations
  async createHealthScoreHistory(score: InsertHealthScoreHistory): Promise<HealthScoreHistory> {
    const [scoreEntry] = await db
      .insert(healthScoreHistory)
      .values(score)
      .returning();
    return scoreEntry;
  }

  async getLatestHealthScore(userId: string): Promise<HealthScoreHistory | undefined> {
    const [score] = await db
      .select()
      .from(healthScoreHistory)
      .where(eq(healthScoreHistory.userId, userId))
      .orderBy(desc(healthScoreHistory.calculatedAt))
      .limit(1);
    return score;
  }

  async getHealthScoreHistory(userId: string, limit: number = 10): Promise<HealthScoreHistory[]> {
    return await db
      .select()
      .from(healthScoreHistory)
      .where(eq(healthScoreHistory.userId, userId))
      .orderBy(desc(healthScoreHistory.calculatedAt))
      .limit(limit);
  }

  // Health insight operations
  async createHealthInsight(insight: InsertHealthInsight): Promise<HealthInsight> {
    const [healthInsight] = await db
      .insert(healthInsights)
      .values(insight)
      .returning();
    return healthInsight;
  }

  async getHealthInsightsByUser(userId: string, statusFilter?: string): Promise<HealthInsight[]> {
    if (statusFilter) {
      return await db
        .select()
        .from(healthInsights)
        .where(and(
          eq(healthInsights.userId, userId),
          eq(healthInsights.status, statusFilter)
        ))
        .orderBy(desc(healthInsights.priority), desc(healthInsights.createdAt));
    }
    
    return await db
      .select()
      .from(healthInsights)
      .where(eq(healthInsights.userId, userId))
      .orderBy(desc(healthInsights.priority), desc(healthInsights.createdAt));
  }

  async updateHealthInsight(id: string, updates: Partial<HealthInsight>): Promise<HealthInsight> {
    const [insight] = await db
      .update(healthInsights)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(healthInsights.id, id))
      .returning();
    return insight;
  }

  async acknowledgeHealthInsight(id: string): Promise<HealthInsight> {
    const [insight] = await db
      .update(healthInsights)
      .set({ 
        status: 'acknowledged',
        acknowledgedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(healthInsights.id, id))
      .returning();
    return insight;
  }

  async resolveHealthInsight(id: string): Promise<HealthInsight> {
    const [insight] = await db
      .update(healthInsights)
      .set({ 
        status: 'resolved',
        resolvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(healthInsights.id, id))
      .returning();
    return insight;
  }

  async deleteHealthInsight(id: string): Promise<void> {
    await db.delete(healthInsights).where(eq(healthInsights.id, id));
  }

  // ========== USER TOKEN USAGE SYSTEM ==========
  
  async getUserTokenUsage(userId: string, monthYear: string): Promise<UserTokenUsage | undefined> {
    const [usage] = await db
      .select()
      .from(userTokenUsage)
      .where(and(
        eq(userTokenUsage.userId, userId),
        eq(userTokenUsage.monthYear, monthYear)
      ));
    return usage;
  }

  async upsertUserTokenUsage(userId: string, monthYear: string, tokensToAdd: number): Promise<UserTokenUsage> {
    const existing = await this.getUserTokenUsage(userId, monthYear);
    
    if (existing) {
      const [updated] = await db
        .update(userTokenUsage)
        .set({
          tokensUsed: existing.tokensUsed + tokensToAdd,
          messageCount: existing.messageCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(userTokenUsage.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userTokenUsage)
        .values({
          userId,
          monthYear,
          tokensUsed: tokensToAdd,
          messageCount: 1,
        })
        .returning();
      return created;
    }
  }

  async getOrCreateTokenUsage(userId: string): Promise<UserTokenUsage> {
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const existing = await this.getUserTokenUsage(userId, monthYear);
    if (existing) {
      return existing;
    }
    
    const [created] = await db
      .insert(userTokenUsage)
      .values({
        userId,
        monthYear,
        tokensUsed: 0,
        messageCount: 0,
      })
      .returning();
    return created;
  }

  // ========== JOB QUEUE SYSTEM ==========

  async createJob(job: InsertJobQueue): Promise<JobQueue> {
    const [created] = await db.insert(jobQueue).values(job).returning();
    return created;
  }

  async getJobById(id: string): Promise<JobQueue | undefined> {
    const [job] = await db.select().from(jobQueue).where(eq(jobQueue.id, id));
    return job;
  }

  async getJobsByUser(userId: string, limit: number = 50): Promise<JobQueue[]> {
    return await db
      .select()
      .from(jobQueue)
      .where(eq(jobQueue.userId, userId))
      .orderBy(desc(jobQueue.createdAt))
      .limit(limit);
  }

  async getPendingJobs(limit: number = 10): Promise<JobQueue[]> {
    return await db
      .select()
      .from(jobQueue)
      .where(eq(jobQueue.status, 'pending'))
      .orderBy(jobQueue.priority, desc(jobQueue.createdAt))
      .limit(limit);
  }

  async updateJob(id: string, updates: Partial<JobQueue>): Promise<JobQueue> {
    const [updated] = await db
      .update(jobQueue)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(jobQueue.id, id))
      .returning();
    return updated;
  }

  async updateJobProgress(id: string, progress: number, currentStep: string): Promise<JobQueue> {
    const [updated] = await db
      .update(jobQueue)
      .set({
        progress,
        currentStep,
        status: 'processing',
        updatedAt: new Date(),
      })
      .where(eq(jobQueue.id, id))
      .returning();
    return updated;
  }

  async completeJob(id: string, outputData: any): Promise<JobQueue> {
    const [completed] = await db
      .update(jobQueue)
      .set({
        status: 'completed',
        progress: 100,
        outputData,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(jobQueue.id, id))
      .returning();
    return completed;
  }

  async failJob(id: string, errorMessage: string): Promise<JobQueue> {
    const job = await this.getJobById(id);
    const retryCount = job?.retryCount || 0;
    const maxRetries = job?.maxRetries || 3;
    const shouldRetry = job && retryCount < maxRetries;

    const [failed] = await db
      .update(jobQueue)
      .set({
        status: shouldRetry ? 'pending' : 'failed',
        errorMessage,
        retryCount: retryCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(jobQueue.id, id))
      .returning();
    return failed;
  }

  // ========== MEDICAL KNOWLEDGE BASE (RAG) OPERATIONS ==========

  async createMedicalDocument(doc: InsertMedicalKnowledgeBase): Promise<MedicalKnowledgeBase> {
    const [document] = await db.insert(medicalKnowledgeBase).values(doc).returning();
    return document;
  }

  async getMedicalDocumentById(id: string): Promise<MedicalKnowledgeBase | undefined> {
    const [doc] = await db.select().from(medicalKnowledgeBase).where(eq(medicalKnowledgeBase.id, id));
    return doc;
  }

  async getMedicalDocuments(filters?: { isActive?: boolean; documentType?: string; medicalTopics?: string[] }): Promise<MedicalKnowledgeBase[]> {
    let query = db.select().from(medicalKnowledgeBase);
    
    const conditions = [];
    if (filters?.isActive !== undefined) {
      conditions.push(eq(medicalKnowledgeBase.isActive, filters.isActive));
    }
    if (filters?.documentType) {
      conditions.push(eq(medicalKnowledgeBase.documentType, filters.documentType));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query;
  }

  async updateMedicalDocument(id: string, updates: Partial<MedicalKnowledgeBase>): Promise<MedicalKnowledgeBase> {
    const [updated] = await db
      .update(medicalKnowledgeBase)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(medicalKnowledgeBase.id, id))
      .returning();
    return updated;
  }

  async deleteMedicalDocument(id: string): Promise<void> {
    await db.delete(medicalKnowledgeBase).where(eq(medicalKnowledgeBase.id, id));
  }

  async createMedicalChunk(chunk: InsertMedicalKnowledgeChunk): Promise<MedicalKnowledgeChunk> {
    const [created] = await db.insert(medicalKnowledgeChunks).values(chunk as any).returning();
    return created;
  }

  async getChunksByDocument(documentId: string): Promise<MedicalKnowledgeChunk[]> {
    return await db.select().from(medicalKnowledgeChunks).where(eq(medicalKnowledgeChunks.documentId, documentId));
  }

  async semanticSearchMedical(
    queryEmbedding: number[], 
    limit: number = 5, 
    topicFilter?: string[]
  ): Promise<Array<MedicalKnowledgeChunk & { similarity: number; documentTitle: string }>> {
    // Convert embedding array to pgvector format
    const embeddingStr = `[${queryEmbedding.join(',')}]`;
    
    // Cosine similarity search with optional topic filtering
    const query = sql`
      SELECT 
        c.id,
        c.document_id,
        c.chunk_index,
        c.content,
        c.token_count,
        c.created_at,
        d.title as document_title,
        1 - (c.embedding <=> ${embeddingStr}::vector) as similarity
      FROM medical_knowledge_chunks c
      JOIN medical_knowledge_base d ON c.document_id = d.id
      WHERE d.is_active = true
      ${topicFilter && topicFilter.length > 0 
        ? sql`AND d.medical_topics && ARRAY[${sql.join(topicFilter.map(t => sql`${t}`), sql`, `)}]::text[]`
        : sql``
      }
      ORDER BY c.embedding <=> ${embeddingStr}::vector
      LIMIT ${limit}
    `;
    
    const results = await db.execute(query);
    return results.rows as any;
  }

  // ========== PROFESSIONAL CONTACT REQUESTS ==========

  async createProfessionalContactRequest(request: InsertProfessionalContactRequest): Promise<ProfessionalContactRequest> {
    const [created] = await db.insert(professionalContactRequests).values(request).returning();
    return created;
  }

  async getProfessionalContactRequestById(id: string): Promise<ProfessionalContactRequest | undefined> {
    const [request] = await db.select().from(professionalContactRequests).where(eq(professionalContactRequests.id, id));
    return request;
  }

  async getAllProfessionalContactRequests(): Promise<ProfessionalContactRequest[]> {
    return await db.select().from(professionalContactRequests).orderBy(desc(professionalContactRequests.createdAt));
  }

  async updateProfessionalContactRequest(id: string, updates: Partial<ProfessionalContactRequest>): Promise<ProfessionalContactRequest> {
    const [updated] = await db
      .update(professionalContactRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(professionalContactRequests.id, id))
      .returning();
    return updated;
  }

  async deleteProfessionalContactRequest(id: string): Promise<void> {
    await db.delete(professionalContactRequests).where(eq(professionalContactRequests.id, id));
  }

  // ========== DOCTOR-PATIENT LINK OPERATIONS ==========

  async generateDoctorCode(doctorId: string): Promise<string> {
    // Check if doctor already has a code
    const doctor = await this.getUser(doctorId);
    if (doctor?.doctorCode) {
      return doctor.doctorCode;
    }

    // Generate unique 8-character alphanumeric code
    let code = '';
    let isUnique = false;
    
    while (!isUnique) {
      code = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // Check if code already exists
      const existing = await db.select().from(users).where(eq(users.doctorCode, code));
      if (existing.length === 0) {
        isUnique = true;
      }
    }

    // Save code to doctor's profile
    await db.update(users).set({ doctorCode: code }).where(eq(users.id, doctorId));
    
    return code;
  }

  async linkPatientToDoctor(patientId: string, doctorCode: string): Promise<void> {
    // Find doctor by code
    const [doctor] = await db.select().from(users).where(eq(users.doctorCode, doctorCode));
    
    if (!doctor) {
      throw new Error('Codice medico non valido');
    }

    if (!doctor.isDoctor) {
      throw new Error('Il codice non appartiene a un medico');
    }

    // Check if already linked
    const existing = await db.select().from(doctorPatientLinks)
      .where(and(
        eq(doctorPatientLinks.doctorId, doctor.id),
        eq(doctorPatientLinks.patientId, patientId)
      ));

    if (existing.length > 0) {
      throw new Error('Sei già collegato a questo medico');
    }

    // Create link
    await db.insert(doctorPatientLinks).values({
      doctorId: doctor.id,
      patientId,
      doctorCode,
    });
  }

  async getDoctorPatients(doctorId: string): Promise<Array<User & { linkedAt: Date }>> {
    const results = await db
      .select({
        user: users,
        linkedAt: doctorPatientLinks.linkedAt,
      })
      .from(doctorPatientLinks)
      .innerJoin(users, eq(doctorPatientLinks.patientId, users.id))
      .where(eq(doctorPatientLinks.doctorId, doctorId))
      .orderBy(desc(doctorPatientLinks.linkedAt));

    return results.map(r => ({ ...r.user, linkedAt: r.linkedAt! }));
  }

  async getPatientDoctors(patientId: string): Promise<Array<User & { linkedAt: Date }>> {
    const results = await db
      .select({
        user: users,
        linkedAt: doctorPatientLinks.linkedAt,
      })
      .from(doctorPatientLinks)
      .innerJoin(users, eq(doctorPatientLinks.doctorId, users.id))
      .where(eq(doctorPatientLinks.patientId, patientId))
      .orderBy(desc(doctorPatientLinks.linkedAt));

    return results.map(r => ({ ...r.user, linkedAt: r.linkedAt! }));
  }

  async unlinkPatientFromDoctor(doctorId: string, patientId: string): Promise<void> {
    await db.delete(doctorPatientLinks)
      .where(and(
        eq(doctorPatientLinks.doctorId, doctorId),
        eq(doctorPatientLinks.patientId, patientId)
      ));
  }

  async getDoctorStatsSummary(doctorId: string): Promise<{
    totalPatients: number;
    criticalAlerts: number;
    todayAppointments: number;
    weekAppointments: number;
  }> {
    // Get total patients linked to doctor
    const patientLinks = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(doctorPatientLinks)
      .where(eq(doctorPatientLinks.doctorId, doctorId));
    const totalPatients = patientLinks[0]?.count || 0;

    // Get patient IDs for alert filtering
    const linkedPatients = await db
      .select({ patientId: doctorPatientLinks.patientId })
      .from(doctorPatientLinks)
      .where(eq(doctorPatientLinks.doctorId, doctorId));
    const patientIds = linkedPatients.map(p => p.patientId);

    // Get critical alerts count (EMERGENCY + HIGH, pending status)
    let criticalAlerts = 0;
    if (patientIds.length > 0) {
      const { triageAlerts } = await import('@shared/schema');
      const alertsCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(triageAlerts)
        .where(and(
          inArray(triageAlerts.userId, patientIds),
          eq(triageAlerts.status, 'pending'),
          or(
            eq(triageAlerts.urgencyLevel, 'EMERGENCY'),
            eq(triageAlerts.urgencyLevel, 'HIGH')
          )
        ));
      criticalAlerts = alertsCount[0]?.count || 0;
    }

    // Get today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const { appointments } = await import('@shared/schema');
    const todayCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(appointments)
      .where(and(
        eq(appointments.doctorId, doctorId),
        gte(appointments.startTime, today),
        lt(appointments.startTime, tomorrow),
        sql`${appointments.status} != 'cancelled'`
      ));
    const todayAppointments = todayCount[0]?.count || 0;

    // Get week appointments (next 7 days)
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    
    const weekCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(appointments)
      .where(and(
        eq(appointments.doctorId, doctorId),
        gte(appointments.startTime, today),
        lt(appointments.startTime, weekFromNow),
        sql`${appointments.status} != 'cancelled'`
      ));
    const weekAppointments = weekCount[0]?.count || 0;

    return {
      totalPatients,
      criticalAlerts,
      todayAppointments,
      weekAppointments,
    };
  }

  // ========== DOCTOR NOTES OPERATIONS ==========

  async createDoctorNote(note: InsertDoctorNote): Promise<DoctorNote> {
    const [created] = await db.insert(doctorNotes).values(note).returning();
    return created;
  }

  async getDoctorNotesByPatient(patientId: string): Promise<Array<DoctorNote & { doctor: { firstName: string | null, lastName: string | null }, doctorName: string }>> {
    const results = await db
      .select({
        note: doctorNotes,
        doctorFirstName: users.firstName,
        doctorLastName: users.lastName,
      })
      .from(doctorNotes)
      .innerJoin(users, eq(doctorNotes.doctorId, users.id))
      .where(eq(doctorNotes.patientId, patientId))
      .orderBy(desc(doctorNotes.createdAt));

    return results.map(r => ({
      ...r.note,
      doctor: {
        firstName: r.doctorFirstName,
        lastName: r.doctorLastName,
      },
      doctorName: `Dr. ${r.doctorFirstName || ''} ${r.doctorLastName || ''}`.trim(),
    }));
  }

  async getDoctorNotesByDoctor(doctorId: string): Promise<DoctorNote[]> {
    return await db
      .select()
      .from(doctorNotes)
      .where(eq(doctorNotes.doctorId, doctorId))
      .orderBy(desc(doctorNotes.createdAt));
  }

  async getDoctorNoteById(id: string): Promise<DoctorNote | undefined> {
    const [note] = await db.select().from(doctorNotes).where(eq(doctorNotes.id, id));
    return note;
  }

  async deleteDoctorNote(id: string): Promise<void> {
    await db.delete(doctorNotes).where(eq(doctorNotes.id, id));
  }

  // ========== DOCTOR ALERT OPERATIONS ==========

  async getPatientAlertsByDoctor(doctorId: string): Promise<Array<TriageAlert & { patientName: string; patientEmail: string }>> {
    // Get all patients linked to this doctor
    const linkedPatients = await this.getDoctorPatients(doctorId);
    const patientIds = linkedPatients.map(p => p.id);

    if (patientIds.length === 0) {
      return [];
    }

    // Get alerts for these patients
    const results = await db
      .select({
        alert: triageAlerts,
        patientFirstName: users.firstName,
        patientLastName: users.lastName,
        patientEmail: users.email,
      })
      .from(triageAlerts)
      .innerJoin(users, eq(triageAlerts.userId, users.id))
      .where(inArray(triageAlerts.userId, patientIds))
      .orderBy(desc(triageAlerts.createdAt));

    return results.map(r => ({
      ...r.alert,
      patientName: `${r.patientFirstName} ${r.patientLastName}`,
      patientEmail: r.patientEmail,
    }));
  }

  // ========== AUDIT LOG OPERATIONS (GDPR COMPLIANCE) ==========

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [created] = await db
      .insert(auditLogs)
      .values(log)
      .returning();
    return created;
  }

  async getAuditLogs(filters?: {
    userId?: string;
    resourceType?: string;
    resourceOwnerId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<Array<AuditLog & { user?: { fullName: string; email: string }; resourceOwner?: { fullName: string; email: string } }>> {
    const conditions = [];
    
    if (filters?.userId) {
      conditions.push(eq(auditLogs.userId, filters.userId));
    }
    
    if (filters?.resourceType) {
      conditions.push(eq(auditLogs.resourceType, filters.resourceType));
    }
    
    if (filters?.resourceOwnerId) {
      conditions.push(eq(auditLogs.resourceOwnerId, filters.resourceOwnerId));
    }
    
    if (filters?.startDate) {
      conditions.push(gte(auditLogs.createdAt, filters.startDate));
    }
    
    if (filters?.endDate) {
      conditions.push(sql`${auditLogs.createdAt} <= ${filters.endDate}`);
    }

    let query = db
      .select({
        log: auditLogs,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .orderBy(desc(auditLogs.createdAt));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }

    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
    }

    const results = await query;

    return results.map(r => ({
      ...r.log,
      user: r.userFirstName && r.userLastName ? {
        fullName: `${r.userFirstName} ${r.userLastName}`,
        email: r.userEmail || '',
      } : undefined,
    }));
  }

  async getAuditLogsCount(filters?: {
    userId?: string;
    resourceType?: string;
    resourceOwnerId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<number> {
    const conditions = [];
    
    if (filters?.userId) {
      conditions.push(eq(auditLogs.userId, filters.userId));
    }
    
    if (filters?.resourceType) {
      conditions.push(eq(auditLogs.resourceType, filters.resourceType));
    }
    
    if (filters?.resourceOwnerId) {
      conditions.push(eq(auditLogs.resourceOwnerId, filters.resourceOwnerId));
    }
    
    if (filters?.startDate) {
      conditions.push(gte(auditLogs.createdAt, filters.startDate));
    }
    
    if (filters?.endDate) {
      conditions.push(sql`${auditLogs.createdAt} <= ${filters.endDate}`);
    }

    let query = db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogs);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const [result] = await query;
    return result?.count || 0;
  }

  // ========== LOGIN LOG OPERATIONS (TRACK AUTHENTICATION) ==========

  async createLoginLog(log: InsertLoginLog): Promise<LoginLog> {
    const [created] = await db
      .insert(loginLogs)
      .values(log)
      .returning();
    return created;
  }

  async getLoginLogs(filters?: {
    userId?: string;
    userEmail?: string;
    success?: boolean;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<LoginLog[]> {
    const conditions = [];
    
    if (filters?.userId) {
      conditions.push(eq(loginLogs.userId, filters.userId));
    }
    
    if (filters?.userEmail) {
      conditions.push(eq(loginLogs.userEmail, filters.userEmail));
    }
    
    if (filters?.success !== undefined) {
      conditions.push(eq(loginLogs.success, filters.success));
    }
    
    if (filters?.startDate) {
      conditions.push(gte(loginLogs.createdAt, filters.startDate));
    }
    
    if (filters?.endDate) {
      conditions.push(sql`${loginLogs.createdAt} <= ${filters.endDate}`);
    }

    let query = db
      .select()
      .from(loginLogs)
      .orderBy(desc(loginLogs.createdAt));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }

    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
    }

    return await query;
  }

  async getLoginLogsCount(filters?: {
    userId?: string;
    userEmail?: string;
    success?: boolean;
    startDate?: Date;
    endDate?: Date;
  }): Promise<number> {
    const conditions = [];
    
    if (filters?.userId) {
      conditions.push(eq(loginLogs.userId, filters.userId));
    }
    
    if (filters?.userEmail) {
      conditions.push(eq(loginLogs.userEmail, filters.userEmail));
    }
    
    if (filters?.success !== undefined) {
      conditions.push(eq(loginLogs.success, filters.success));
    }
    
    if (filters?.startDate) {
      conditions.push(gte(loginLogs.createdAt, filters.startDate));
    }
    
    if (filters?.endDate) {
      conditions.push(sql`${loginLogs.createdAt} <= ${filters.endDate}`);
    }

    let query = db
      .select({ count: sql<number>`count(*)::int` })
      .from(loginLogs);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const [result] = await query;
    return result?.count || 0;
  }

  async deleteOldLoginLogs(retentionDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await db
      .delete(loginLogs)
      .where(sql`${loginLogs.createdAt} < ${cutoffDate}`)
      .returning({ id: loginLogs.id });

    return result.length;
  }

  // Appointment operations
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db.insert(appointments).values(appointment).returning();
    return newAppointment;
  }

  async getAppointmentById(id: string): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment;
  }

  async getAppointmentsByDoctor(doctorId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    const conditions = [eq(appointments.doctorId, doctorId)];
    
    if (startDate && endDate) {
      conditions.push(gte(appointments.startTime, startDate));
      conditions.push(lte(appointments.startTime, endDate));
    }
    
    const appointmentsList = await db.select()
      .from(appointments)
      .where(and(...conditions))
      .orderBy(asc(appointments.startTime));
    
    // Fetch attachments for each appointment
    const appointmentsWithAttachments = await Promise.all(
      appointmentsList.map(async (apt) => {
        const attachments = await db.select()
          .from(appointmentAttachments)
          .where(eq(appointmentAttachments.appointmentId, apt.id));
        
        return {
          ...apt,
          attachments
        };
      })
    );
    
    return appointmentsWithAttachments;
  }

  async getAppointmentsByPatient(patientId: string, status?: string): Promise<Appointment[]> {
    const conditions = [eq(appointments.patientId, patientId)];
    
    if (status) {
      conditions.push(eq(appointments.status, status));
    }
    
    return await db.select()
      .from(appointments)
      .where(and(...conditions))
      .orderBy(desc(appointments.startTime));
  }

  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment> {
    const [updated] = await db.update(appointments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return updated;
  }

  async deleteAppointment(id: string): Promise<void> {
    await db.delete(appointments).where(eq(appointments.id, id));
  }

  async bookAppointment(appointmentId: string, patientId: string, notes?: string): Promise<Appointment> {
    const [updated] = await db.update(appointments)
      .set({
        patientId,
        description: notes,
        status: 'booked',
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, appointmentId))
      .returning();
    return updated;
  }

  async updateAppointmentStatus(id: string, status: string, updatedBy: string): Promise<Appointment> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'cancelled') {
      updateData.cancelledBy = updatedBy;
      updateData.cancelledAt = new Date();
    }

    const [updated] = await db.update(appointments)
      .set(updateData)
      .where(eq(appointments.id, id))
      .returning();
    return updated;
  }

  async getAppointmentsSummary(doctorId: string): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
  }> {
    const allAppointments = await db.select()
      .from(appointments)
      .where(eq(appointments.doctorId, doctorId));

    return {
      total: allAppointments.length,
      pending: allAppointments.filter(a => a.status === 'booked').length,
      confirmed: allAppointments.filter(a => a.status === 'confirmed').length,
      completed: allAppointments.filter(a => a.status === 'completed').length,
    };
  }

  // Push Notification operations
  async createPushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription> {
    const [created] = await db.insert(pushSubscriptions)
      .values(subscription)
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
          userAgent: subscription.userAgent,
        },
      })
      .returning();
    return created;
  }

  async getPushSubscriptionsByUser(userId: string): Promise<PushSubscription[]> {
    return await db.select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));
  }

  async getAllPushSubscriptions(): Promise<PushSubscription[]> {
    return await db.select().from(pushSubscriptions);
  }

  async deletePushSubscription(endpoint: string): Promise<void> {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  }

  // In-App Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return created;
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50); // Last 50 notifications
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ 
        read: true,
        readAt: new Date(),
      })
      .where(eq(notifications.id, notificationId));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ 
        read: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        )
      );
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        )
      );
    return result[0]?.count || 0;
  }

  // ========== EXTERNAL API KEYS ==========

  async createApiKey(name: string, scopes: string[], createdBy: string, rateLimitPerMinute: number = 60, expiresAt?: Date): Promise<{ id: string; key: string }> {
    const crypto = await import('crypto');
    
    // Generate API key: ciry_<random_32_chars>
    const randomBytes = crypto.randomBytes(24);
    const key = `ciry_${randomBytes.toString('base64url')}`;
    
    // Hash the key for storage (SHA-256)
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');
    
    // Extract prefix for display (first 12 chars)
    const keyPrefix = key.substring(0, 12);
    
    const [created] = await db
      .insert(apiKeys)
      .values({
        name,
        keyHash,
        keyPrefix,
        scopes: scopes as any,
        active: true,
        rateLimitPerMinute,
        createdBy,
        expiresAt: expiresAt || null,
      })
      .returning();
    
    // Return the plaintext key ONLY once (never stored)
    return { id: created.id, key };
  }

  async validateApiKey(keyHash: string): Promise<ApiKey | undefined> {
    const [key] = await db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.keyHash, keyHash),
          eq(apiKeys.active, true),
          or(
            sql`${apiKeys.expiresAt} IS NULL`,
            sql`${apiKeys.expiresAt} > NOW()`
          )
        )
      );
    
    return key;
  }

  async listApiKeys(activeOnly: boolean = false): Promise<ApiKey[]> {
    if (activeOnly) {
      return await db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.active, true))
        .orderBy(desc(apiKeys.createdAt));
    }
    
    return await db
      .select()
      .from(apiKeys)
      .orderBy(desc(apiKeys.createdAt));
  }

  async revokeApiKey(id: string): Promise<void> {
    await db
      .update(apiKeys)
      .set({ 
        active: false,
        revokedAt: new Date(),
      })
      .where(eq(apiKeys.id, id));
  }

  async updateApiKeyUsage(keyHash: string): Promise<void> {
    await db
      .update(apiKeys)
      .set({
        lastUsedAt: new Date(),
        requestCount: sql`${apiKeys.requestCount} + 1`,
      })
      .where(eq(apiKeys.keyHash, keyHash));
  }

  // ========== WEARABLE INTEGRATION ==========

  async createWearableDevice(device: InsertWearableDevice): Promise<WearableDevice> {
    const [created] = await db
      .insert(wearableDevices)
      .values({
        ...device,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return created;
  }

  async getWearableDevicesByUser(userId: string): Promise<WearableDevice[]> {
    return await db
      .select()
      .from(wearableDevices)
      .where(eq(wearableDevices.userId, userId))
      .orderBy(desc(wearableDevices.createdAt));
  }

  async getAllWearableDevices(): Promise<WearableDevice[]> {
    return await db
      .select()
      .from(wearableDevices)
      .orderBy(desc(wearableDevices.createdAt));
  }

  async getWearableDeviceById(id: string): Promise<WearableDevice | undefined> {
    const [device] = await db
      .select()
      .from(wearableDevices)
      .where(eq(wearableDevices.id, id));
    return device;
  }

  async updateWearableDevice(id: string, updates: Partial<WearableDevice>): Promise<WearableDevice> {
    const [updated] = await db
      .update(wearableDevices)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(wearableDevices.id, id))
      .returning();
    return updated;
  }

  async deleteWearableDevice(id: string): Promise<void> {
    await db.delete(wearableDevices).where(eq(wearableDevices.id, id));
  }

  async createBloodPressureReading(reading: InsertBloodPressureReading): Promise<BloodPressureReading> {
    const [created] = await db
      .insert(bloodPressureReadings)
      .values({
        ...reading,
        createdAt: new Date(),
      })
      .returning();
    return created;
  }

  async getBloodPressureReadingsByUser(userId: string, startDate?: Date, endDate?: Date): Promise<BloodPressureReading[]> {
    let query = db
      .select()
      .from(bloodPressureReadings)
      .where(eq(bloodPressureReadings.userId, userId))
      .$dynamic();

    if (startDate) {
      query = query.where(gte(bloodPressureReadings.measurementTime, startDate));
    }
    if (endDate) {
      query = query.where(lte(bloodPressureReadings.measurementTime, endDate));
    }

    return await query.orderBy(desc(bloodPressureReadings.measurementTime));
  }

  async getBloodPressureReadingById(id: string): Promise<BloodPressureReading | undefined> {
    const [reading] = await db
      .select()
      .from(bloodPressureReadings)
      .where(eq(bloodPressureReadings.id, id));
    return reading;
  }

  async getAnomalousBloodPressureReadings(userId?: string): Promise<Array<BloodPressureReading & { userName?: string; userEmail?: string }>> {
    let query = db
      .select({
        ...bloodPressureReadings,
        userName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        userEmail: users.email,
      })
      .from(bloodPressureReadings)
      .leftJoin(users, eq(bloodPressureReadings.userId, users.id))
      .where(eq(bloodPressureReadings.isAnomalous, true))
      .$dynamic();

    if (userId) {
      query = query.where(eq(bloodPressureReadings.userId, userId));
    }

    return await query.orderBy(desc(bloodPressureReadings.measurementTime));
  }

  async updateBloodPressureReading(id: string, updates: Partial<BloodPressureReading>): Promise<BloodPressureReading> {
    const [updated] = await db
      .update(bloodPressureReadings)
      .set(updates)
      .where(eq(bloodPressureReadings.id, id))
      .returning();
    return updated;
  }

  // Wearable Daily Reports
  async createWearableDailyReport(report: InsertWearableDailyReport): Promise<WearableDailyReport> {
    const [created] = await db
      .insert(wearableDailyReports)
      .values({
        ...report,
        createdAt: new Date(),
      })
      .returning();
    return created;
  }

  async getWearableDailyReportById(id: string): Promise<WearableDailyReport | undefined> {
    const [report] = await db
      .select()
      .from(wearableDailyReports)
      .where(eq(wearableDailyReports.id, id));
    return report;
  }

  async getWearableDailyReportsByPatient(patientId: string, limit: number = 50): Promise<WearableDailyReport[]> {
    return await db
      .select()
      .from(wearableDailyReports)
      .where(eq(wearableDailyReports.patientId, patientId))
      .orderBy(desc(wearableDailyReports.createdAt))
      .limit(limit);
  }

  async getWearableDailyReportsByDoctor(doctorId: string, limit: number = 50): Promise<WearableDailyReport[]> {
    return await db
      .select()
      .from(wearableDailyReports)
      .where(eq(wearableDailyReports.doctorId, doctorId))
      .orderBy(desc(wearableDailyReports.createdAt))
      .limit(limit);
  }

  async getLatestWearableDailyReport(patientId: string): Promise<WearableDailyReport | undefined> {
    const [report] = await db
      .select()
      .from(wearableDailyReports)
      .where(eq(wearableDailyReports.patientId, patientId))
      .orderBy(desc(wearableDailyReports.createdAt))
      .limit(1);
    return report;
  }

  // ========== PROACTIVE HEALTH TRIGGERS ==========

  async createProactiveHealthTrigger(trigger: InsertProactiveHealthTrigger): Promise<ProactiveHealthTrigger> {
    const [created] = await db
      .insert(proactiveHealthTriggers)
      .values({
        ...trigger,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return created;
  }

  async getProactiveHealthTriggers(activeOnly: boolean = false): Promise<ProactiveHealthTrigger[]> {
    let query = db.select().from(proactiveHealthTriggers).$dynamic();

    if (activeOnly) {
      query = query.where(eq(proactiveHealthTriggers.isActive, true));
    }

    return await query.orderBy(desc(proactiveHealthTriggers.createdAt));
  }

  async getProactiveHealthTriggerById(id: string): Promise<ProactiveHealthTrigger | undefined> {
    const [trigger] = await db
      .select()
      .from(proactiveHealthTriggers)
      .where(eq(proactiveHealthTriggers.id, id));
    return trigger;
  }

  async updateProactiveHealthTrigger(id: string, updates: Partial<ProactiveHealthTrigger>): Promise<ProactiveHealthTrigger> {
    const [updated] = await db
      .update(proactiveHealthTriggers)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(proactiveHealthTriggers.id, id))
      .returning();
    return updated;
  }

  async deleteProactiveHealthTrigger(id: string): Promise<void> {
    await db.delete(proactiveHealthTriggers).where(eq(proactiveHealthTriggers.id, id));
  }

  async createProactiveNotification(notification: InsertProactiveNotification): Promise<ProactiveNotification> {
    const [created] = await db
      .insert(proactiveNotifications)
      .values({
        ...notification,
        createdAt: new Date(),
        sentAt: new Date(),
      })
      .returning();
    return created;
  }

  async getProactiveNotificationsByUser(userId: string, limit: number = 50): Promise<ProactiveNotification[]> {
    return await db
      .select()
      .from(proactiveNotifications)
      .where(eq(proactiveNotifications.userId, userId))
      .orderBy(desc(proactiveNotifications.sentAt))
      .limit(limit);
  }

  async getProactiveNotificationStats(startDate?: Date, endDate?: Date): Promise<{
    total: number;
    sent: number;
    failed: number;
    clicked: number;
    byChannel: Record<string, number>;
    byType: Record<string, number>;
  }> {
    let query = db
      .select({
        status: proactiveNotifications.status,
        channel: proactiveNotifications.channel,
        notificationType: proactiveNotifications.notificationType,
        clickedAt: proactiveNotifications.clickedAt,
      })
      .from(proactiveNotifications)
      .$dynamic();

    if (startDate) {
      query = query.where(gte(proactiveNotifications.sentAt, startDate));
    }
    if (endDate) {
      query = query.where(lte(proactiveNotifications.sentAt, endDate));
    }

    const notifications = await query;

    const stats = {
      total: notifications.length,
      sent: notifications.filter(n => n.status === 'sent' || n.status === 'clicked').length,
      failed: notifications.filter(n => n.status === 'failed').length,
      clicked: notifications.filter(n => n.clickedAt !== null).length,
      byChannel: {} as Record<string, number>,
      byType: {} as Record<string, number>,
    };

    notifications.forEach(n => {
      stats.byChannel[n.channel] = (stats.byChannel[n.channel] || 0) + 1;
      stats.byType[n.notificationType] = (stats.byType[n.notificationType] || 0) + 1;
    });

    return stats;
  }

  // ========== APPOINTMENT REMINDER OPERATIONS ==========

  async fetchPendingReminders(): Promise<PendingReminderData[]> {
    const result = await db.execute(sql`
      SELECT 
        r.id, r.appointment_id, r.reminder_type, r.scheduled_for, r.sent_at,
        r.status, r.channel, r.error_message, r.twilio_sid, r.created_at,
        a.start_time, a.end_time, a.meeting_url as video_room_url,
        u.email as patient_email, u.first_name, u.last_name,
        u.whatsapp_number as patient_whatsapp, u.whatsapp_notifications_enabled
      FROM appointment_reminders r
      JOIN appointments a ON r.appointment_id = a.id
      JOIN users u ON a.patient_id = u.id
      WHERE r.status = 'pending' AND r.scheduled_for <= NOW()
    `);

    return result.rows.map((row: any) => ({
      id: row.id,
      appointmentId: row.appointment_id,
      reminderType: row.reminder_type,
      scheduledFor: new Date(row.scheduled_for),
      sentAt: row.sent_at ? new Date(row.sent_at) : null,
      status: row.status,
      channel: row.channel,
      errorMessage: row.error_message,
      twilioSid: row.twilio_sid,
      createdAt: new Date(row.created_at),
      startTime: new Date(row.start_time),
      endTime: new Date(row.end_time),
      videoRoomUrl: row.video_room_url,
      patientEmail: row.patient_email,
      firstName: row.first_name,
      lastName: row.last_name,
      patientWhatsapp: row.patient_whatsapp,
      whatsappNotificationsEnabled: row.whatsapp_notifications_enabled === true || row.whatsapp_notifications_enabled === 't',
    }));
  }

  async markReminderSent(reminderId: string, sid?: string): Promise<void> {
    await db.execute(sql`
      UPDATE appointment_reminders 
      SET status = 'sent', sent_at = NOW(), twilio_sid = ${sid || null}
      WHERE id = ${reminderId}
    `);
  }

  async markReminderSkipped(reminderId: string, reason: string): Promise<void> {
    await db.execute(sql`
      UPDATE appointment_reminders 
      SET status = 'skipped', error_message = ${reason}
      WHERE id = ${reminderId}
    `);
  }

  async markReminderFailed(reminderId: string, errorMessage: string): Promise<void> {
    await db.execute(sql`
      UPDATE appointment_reminders 
      SET status = 'failed', error_message = ${errorMessage} 
      WHERE id = ${reminderId}
    `);
  }
}

export const storage = new DatabaseStorage();
