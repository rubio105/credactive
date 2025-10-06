import { db } from "./db";
import {
  users,
  badges,
  userBadges,
  achievements,
  userAchievements,
  userQuizAttempts,
  activityLog,
  leaderboard,
  type User,
  type Badge,
  type UserBadge,
  type Achievement,
  type UserAchievement,
  type UserQuizAttempt,
  type InsertActivityLog,
  type InsertUserBadge,
  type InsertUserAchievement,
} from "@shared/schema";
import { eq, desc, sql, and, gte } from "drizzle-orm";

// Points configuration
const POINTS_CONFIG = {
  // Quiz completion points
  BASE_QUIZ_POINTS: 100,
  PERFECT_SCORE_BONUS: 50, // Bonus for 100% score
  SPEED_BONUS_MAX: 30, // Max bonus for fast completion
  
  // Difficulty multipliers
  DIFFICULTY_MULTIPLIERS: {
    beginner: 1,
    intermediate: 1.5,
    advanced: 2,
    expert: 2.5,
  },
  
  // Other activities
  DAILY_CHALLENGE_POINTS: 50,
  STREAK_DAILY_BONUS: 10,
  BADGE_EARNED_POINTS: 25,
  ACHIEVEMENT_UNLOCKED_POINTS: 50,
  
  // Level system
  POINTS_PER_LEVEL: 500, // Points needed per level
};

// Badge categories
export const BADGE_CATEGORIES = {
  QUIZ: 'quiz',
  STREAK: 'streak',
  ACHIEVEMENT: 'achievement',
  SPECIAL: 'special',
};

// Achievement categories
export const ACHIEVEMENT_CATEGORIES = {
  COMPLETION: 'completion',
  MASTERY: 'mastery',
  DEDICATION: 'dedication',
  SOCIAL: 'social',
};

/**
 * Calculate points earned for a quiz attempt
 */
export function calculateQuizPoints(
  score: number,
  totalQuestions: number,
  timeSpent: number,
  quizDuration: number,
  difficulty: string
): number {
  const difficultyMultiplier = POINTS_CONFIG.DIFFICULTY_MULTIPLIERS[difficulty as keyof typeof POINTS_CONFIG.DIFFICULTY_MULTIPLIERS] || 1;
  
  // Base points
  let points = POINTS_CONFIG.BASE_QUIZ_POINTS * difficultyMultiplier;
  
  // Perfect score bonus
  if (score === 100) {
    points += POINTS_CONFIG.PERFECT_SCORE_BONUS;
  }
  
  // Speed bonus (if completed in less than half the allotted time)
  const halfDuration = (quizDuration * 60) / 2; // quizDuration is in minutes, timeSpent in seconds
  if (timeSpent < halfDuration) {
    const speedRatio = 1 - (timeSpent / halfDuration);
    const speedBonus = Math.round(POINTS_CONFIG.SPEED_BONUS_MAX * speedRatio);
    points += speedBonus;
  }
  
  // Scale by score percentage
  points = Math.round(points * (score / 100));
  
  return Math.max(0, points);
}

/**
 * Calculate user level based on total points
 */
export function calculateLevel(totalPoints: number): number {
  return Math.floor(totalPoints / POINTS_CONFIG.POINTS_PER_LEVEL) + 1;
}

/**
 * Calculate points needed for next level
 */
export function pointsToNextLevel(totalPoints: number): number {
  const currentLevel = calculateLevel(totalPoints);
  const pointsForNextLevel = currentLevel * POINTS_CONFIG.POINTS_PER_LEVEL;
  return pointsForNextLevel - totalPoints;
}

/**
 * Update user streak
 */
export async function updateUserStreak(userId: string): Promise<{ currentStreak: number; longestStreak: number; streakBroken: boolean }> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!user) {
    throw new Error('User not found');
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastActivity = user.lastActivityDate ? new Date(user.lastActivityDate) : null;
  
  if (lastActivity) {
    lastActivity.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
    
    let newStreak = user.currentStreak || 0;
    let streakBroken = false;
    
    if (daysDiff === 0) {
      // Same day, no change
      return { currentStreak: newStreak, longestStreak: user.longestStreak || 0, streakBroken: false };
    } else if (daysDiff === 1) {
      // Consecutive day, increment streak
      newStreak++;
    } else {
      // Streak broken
      newStreak = 1;
      streakBroken = true;
    }
    
    const newLongestStreak = Math.max(user.longestStreak || 0, newStreak);
    
    await db.update(users)
      .set({
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastActivityDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    
    return { currentStreak: newStreak, longestStreak: newLongestStreak, streakBroken };
  } else {
    // First activity
    await db.update(users)
      .set({
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    
    return { currentStreak: 1, longestStreak: 1, streakBroken: false };
  }
}

/**
 * Award points to user and update level
 */
export async function awardPoints(
  userId: string,
  points: number,
  activityType: string,
  metadata?: Record<string, any>
): Promise<{ newPoints: number; newLevel: number; leveledUp: boolean }> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!user) {
    throw new Error('User not found');
  }
  
  const oldPoints = user.totalPoints || 0;
  const newPoints = oldPoints + points;
  const oldLevel = calculateLevel(oldPoints);
  const newLevel = calculateLevel(newPoints);
  const leveledUp = newLevel > oldLevel;
  
  // Update user points and level
  await db.update(users)
    .set({
      totalPoints: newPoints,
      level: newLevel,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
  
  // Log activity
  await db.insert(activityLog).values({
    userId,
    activityType,
    points,
    metadata: metadata || {},
  });
  
  return { newPoints, newLevel, leveledUp };
}

/**
 * Check and award badges based on user activity
 */
export async function checkAndAwardBadges(userId: string): Promise<Badge[]> {
  const newBadges: Badge[] = [];
  
  // Get user stats
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) return newBadges;
  
  // Get all active badges
  const allBadges = await db.select().from(badges).where(eq(badges.isActive, true));
  
  // Get user's earned badges
  const earnedBadgeIds = (await db.select().from(userBadges).where(eq(userBadges.userId, userId)))
    .map(ub => ub.badgeId);
  
  // Get user quiz attempts
  const attempts = await db.select().from(userQuizAttempts).where(eq(userQuizAttempts.userId, userId));
  
  for (const badge of allBadges) {
    // Skip if already earned
    if (earnedBadgeIds.includes(badge.id)) continue;
    
    let shouldAward = false;
    
    // Check badge category and requirements
    switch (badge.category) {
      case BADGE_CATEGORIES.QUIZ:
        // Award based on quiz completion count
        if (badge.name === 'First Steps' && attempts.length >= 1) shouldAward = true;
        if (badge.name === 'Quiz Master' && attempts.length >= 10) shouldAward = true;
        if (badge.name === 'Quiz Legend' && attempts.length >= 50) shouldAward = true;
        if (badge.name === 'Perfect Score' && attempts.some(a => a.score === 100)) shouldAward = true;
        break;
        
      case BADGE_CATEGORIES.STREAK:
        if (badge.name === 'Week Warrior' && (user.currentStreak || 0) >= 7) shouldAward = true;
        if (badge.name === 'Month Champion' && (user.currentStreak || 0) >= 30) shouldAward = true;
        break;
    }
    
    if (shouldAward) {
      // Award badge
      await db.insert(userBadges).values({
        userId,
        badgeId: badge.id,
      });
      
      // Award badge points
      if (badge.points && badge.points > 0) {
        await awardPoints(userId, badge.points, 'badge_earned', { badgeId: badge.id, badgeName: badge.name });
      }
      
      newBadges.push(badge);
    }
  }
  
  return newBadges;
}

/**
 * Check and update achievements
 */
export async function checkAndUpdateAchievements(userId: string): Promise<Achievement[]> {
  const unlockedAchievements: Achievement[] = [];
  
  // Get all active achievements
  const allAchievements = await db.select().from(achievements).where(eq(achievements.isActive, true));
  
  // Get user achievements
  const userAchs = await db.select().from(userAchievements).where(eq(userAchievements.userId, userId));
  const userAchMap = new Map(userAchs.map(ua => [ua.achievementId, ua]));
  
  // Get user stats
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) return unlockedAchievements;
  
  const attempts = await db.select().from(userQuizAttempts).where(eq(userQuizAttempts.userId, userId));
  const userBadgesCount = await db.select().from(userBadges).where(eq(userBadges.userId, userId));
  
  for (const achievement of allAchievements) {
    const userAch = userAchMap.get(achievement.id);
    
    // Skip if already unlocked
    if (userAch?.isUnlocked) continue;
    
    // Parse requirement
    const req = achievement.requirement as { type: string; target: number };
    let currentProgress = 0;
    
    switch (req.type) {
      case 'quizzes_completed':
        currentProgress = attempts.length;
        break;
      case 'perfect_scores':
        currentProgress = attempts.filter(a => a.score === 100).length;
        break;
      case 'badges_earned':
        currentProgress = userBadgesCount.length;
        break;
      case 'total_points':
        currentProgress = user.totalPoints || 0;
        break;
      case 'streak_days':
        currentProgress = user.longestStreak || 0;
        break;
    }
    
    const isUnlocked = currentProgress >= req.target;
    
    if (userAch) {
      // Update existing achievement
      await db.update(userAchievements)
        .set({
          progress: currentProgress,
          isUnlocked,
          unlockedAt: isUnlocked && !userAch.isUnlocked ? new Date() : userAch.unlockedAt,
          updatedAt: new Date(),
        })
        .where(eq(userAchievements.id, userAch.id));
      
      if (isUnlocked && !userAch.isUnlocked) {
        // Award achievement points
        if (achievement.points && achievement.points > 0) {
          await awardPoints(userId, achievement.points, 'achievement_unlocked', {
            achievementId: achievement.id,
            achievementName: achievement.name,
          });
        }
        unlockedAchievements.push(achievement);
      }
    } else {
      // Create new achievement tracking
      await db.insert(userAchievements).values({
        userId,
        achievementId: achievement.id,
        progress: currentProgress,
        isUnlocked,
        unlockedAt: isUnlocked ? new Date() : null,
      });
      
      if (isUnlocked) {
        // Award achievement points
        if (achievement.points && achievement.points > 0) {
          await awardPoints(userId, achievement.points, 'achievement_unlocked', {
            achievementId: achievement.id,
            achievementName: achievement.name,
          });
        }
        unlockedAchievements.push(achievement);
      }
    }
  }
  
  return unlockedAchievements;
}

/**
 * Update leaderboard for a user and category
 */
export async function updateLeaderboard(userId: string, categoryId?: string, period: string = 'all_time'): Promise<void> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) return;
  
  // Get user quiz attempts for the category
  let attempts;
  if (categoryId) {
    // Need to join with quizzes to filter by category
    attempts = await db
      .select({ attempt: userQuizAttempts })
      .from(userQuizAttempts)
      .where(eq(userQuizAttempts.userId, userId));
    // Filter by category in memory (simple approach)
    // In production, you'd do this with a proper join
  } else {
    attempts = await db.select().from(userQuizAttempts).where(eq(userQuizAttempts.userId, userId));
  }
  
  const quizzesCompleted = attempts.length;
  const averageScore = quizzesCompleted > 0
    ? Math.round(attempts.reduce((sum: number, a: any) => sum + (a.attempt?.score || a.score || 0), 0) / quizzesCompleted)
    : 0;
  
  // Check if leaderboard entry exists
  const [existing] = await db
    .select()
    .from(leaderboard)
    .where(
      and(
        eq(leaderboard.userId, userId),
        categoryId ? eq(leaderboard.categoryId, categoryId) : sql`category_id IS NULL`,
        eq(leaderboard.period, period)
      )
    );
  
  if (existing) {
    // Update existing entry
    await db
      .update(leaderboard)
      .set({
        points: user.totalPoints || 0,
        quizzesCompleted,
        averageScore,
        updatedAt: new Date(),
      })
      .where(eq(leaderboard.id, existing.id));
  } else {
    // Create new entry
    await db.insert(leaderboard).values({
      userId,
      categoryId: categoryId || null,
      rank: 0, // Will be recalculated
      points: user.totalPoints || 0,
      quizzesCompleted,
      averageScore,
      period,
    });
  }
  
  // Recalculate ranks for this leaderboard
  await recalculateLeaderboardRanks(categoryId, period);
}

/**
 * Recalculate ranks for a leaderboard
 */
async function recalculateLeaderboardRanks(categoryId?: string, period: string = 'all_time'): Promise<void> {
  const entries = await db
    .select()
    .from(leaderboard)
    .where(
      and(
        categoryId ? eq(leaderboard.categoryId, categoryId) : sql`category_id IS NULL`,
        eq(leaderboard.period, period)
      )
    )
    .orderBy(desc(leaderboard.points));
  
  // Update ranks
  for (let i = 0; i < entries.length; i++) {
    await db
      .update(leaderboard)
      .set({ rank: i + 1, updatedAt: new Date() })
      .where(eq(leaderboard.id, entries[i].id));
  }
}

/**
 * Process quiz completion with gamification
 */
export async function processQuizCompletion(
  userId: string,
  attempt: UserQuizAttempt,
  quizDuration: number,
  difficulty: string
): Promise<{
  pointsEarned: number;
  newLevel: number;
  leveledUp: boolean;
  newBadges: Badge[];
  newAchievements: Achievement[];
  streakData: { currentStreak: number; longestStreak: number; streakBroken: boolean };
}> {
  // Calculate points
  const pointsEarned = calculateQuizPoints(
    attempt.score,
    attempt.totalQuestions,
    attempt.timeSpent,
    quizDuration,
    difficulty
  );
  
  // Update quiz attempt with points
  await db
    .update(userQuizAttempts)
    .set({ pointsEarned })
    .where(eq(userQuizAttempts.id, attempt.id));
  
  // Award points and update level
  const { newLevel, leveledUp } = await awardPoints(
    userId,
    pointsEarned,
    'quiz_completed',
    {
      quizId: attempt.quizId,
      score: attempt.score,
      difficulty,
    }
  );
  
  // Update streak
  const streakData = await updateUserStreak(userId);
  
  // Award streak bonus if applicable
  if (streakData.currentStreak > 1) {
    await awardPoints(
      userId,
      POINTS_CONFIG.STREAK_DAILY_BONUS * streakData.currentStreak,
      'streak_maintained',
      { streak: streakData.currentStreak }
    );
  }
  
  // Check and award badges
  const newBadges = await checkAndAwardBadges(userId);
  
  // Check and update achievements
  const newAchievements = await checkAndUpdateAchievements(userId);
  
  // Update leaderboard
  await updateLeaderboard(userId);
  
  return {
    pointsEarned,
    newLevel,
    leveledUp,
    newBadges,
    newAchievements,
    streakData,
  };
}
