import { db } from "./db";
import { 
  triageSessions, 
  triageMessages, 
  triageAlerts,
  preventionDocuments,
  preventionIndices,
  users
} from "@shared/schema";
import { eq, and, gte, sql, desc } from "drizzle-orm";

interface PreventionIndexBreakdown {
  frequencyScore: number;      // Consultation frequency (30 points max)
  depthScore: number;           // Conversational depth (20 points max)
  documentScore: number;        // Documents uploaded (20 points max)
  alertScore: number;           // Critical alerts managed (15 points max)
  insightScore: number;         // Health insights follow-up (15 points max)
}

interface PreventionIndexResult {
  score: number;
  tier: 'low' | 'medium' | 'high';
  breakdown: PreventionIndexBreakdown;
}

/**
 * Calculate Prevention Index for a user based on engagement over last 30 days
 * Score range: 0-100
 * Tiers: low (0-39), medium (40-69), high (70-100)
 */
export async function calculatePreventionIndex(userId: string): Promise<PreventionIndexResult> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 1. FREQUENCY SCORE (30 points max): Sessions on unique days
  const sessionsResult = await db
    .select({
      uniqueDays: sql<number>`COUNT(DISTINCT DATE(${triageSessions.createdAt}))`
    })
    .from(triageSessions)
    .where(
      and(
        eq(triageSessions.userId, userId),
        gte(triageSessions.createdAt, thirtyDaysAgo)
      )
    );
  
  const uniqueDays = Number(sessionsResult[0]?.uniqueDays || 0);
  const frequencyScore = Math.min(Math.round((uniqueDays / 10) * 30), 30);

  // 2. DEPTH SCORE (20 points max): Avg user messages per session
  const messagesResult = await db
    .select({
      avgMessages: sql<number>`AVG(user_message_count)`
    })
    .from(
      sql`(
        SELECT 
          ts.id,
          COUNT(CASE WHEN tm.role = 'user' THEN 1 END) as user_message_count
        FROM ${triageSessions} ts
        LEFT JOIN ${triageMessages} tm ON ts.id = tm.session_id
        WHERE ts.user_id = ${userId}
          AND ts.created_at >= ${thirtyDaysAgo}
        GROUP BY ts.id
      ) as session_stats`
    );

  const avgMessages = Number(messagesResult[0]?.avgMessages || 0);
  const depthScore = Math.min(Math.round((avgMessages / 5) * 20), 20);

  // 3. DOCUMENT SCORE (20 points max): Documents uploaded
  const docsResult = await db
    .select({
      count: sql<number>`COUNT(*)`
    })
    .from(preventionDocuments)
    .where(
      and(
        eq(preventionDocuments.uploadedById, userId),
        gte(preventionDocuments.createdAt, thirtyDaysAgo)
      )
    );

  const docCount = Number(docsResult[0]?.count || 0);
  const documentScore = Math.min(Math.round((docCount / 3) * 20), 20);

  // 4. ALERT SCORE (15 points max): Critical alerts managed
  const alertsResult = await db
    .select({
      total: sql<number>`COUNT(*)`,
      resolved: sql<number>`COUNT(CASE WHEN ${triageAlerts.isReviewed} = true THEN 1 END)`
    })
    .from(triageAlerts)
    .innerJoin(triageSessions, eq(triageAlerts.sessionId, triageSessions.id))
    .where(
      and(
        eq(triageSessions.userId, userId),
        gte(triageAlerts.createdAt, thirtyDaysAgo)
      )
    );

  const totalAlerts = Number(alertsResult[0]?.total || 0);
  const resolvedAlerts = Number(alertsResult[0]?.resolved || 0);
  
  let alertScore = 0;
  if (totalAlerts > 0) {
    const resolutionRate = resolvedAlerts / totalAlerts;
    alertScore = Math.round(resolutionRate * 15);
    
    // Penalty for unresolved critical alerts
    const unresolvedCount = totalAlerts - resolvedAlerts;
    if (unresolvedCount > 2) {
      alertScore = Math.max(0, alertScore - (unresolvedCount - 2) * 3);
    }
  }

  // 5. INSIGHT SCORE (15 points max): Prevention document engagement
  // Award points based on number of prevention documents analyzed
  let insightScore = 0;
  if (docCount > 0) {
    // Has uploaded documents: award partial to full points based on count
    insightScore = Math.min(docCount * 5, 15);
  }

  // Calculate total score
  const totalScore = frequencyScore + depthScore + documentScore + alertScore + insightScore;
  
  // Determine tier
  let tier: 'low' | 'medium' | 'high';
  if (totalScore >= 70) {
    tier = 'high';
  } else if (totalScore >= 40) {
    tier = 'medium';
  } else {
    tier = 'low';
  }

  const breakdown: PreventionIndexBreakdown = {
    frequencyScore,
    depthScore,
    documentScore,
    alertScore,
    insightScore,
  };

  return {
    score: totalScore,
    tier,
    breakdown,
  };
}

/**
 * Save or update prevention index for a user
 */
export async function savePreventionIndex(userId: string): Promise<void> {
  const indexData = await calculatePreventionIndex(userId);
  
  // Check if index exists
  const existing = await db
    .select()
    .from(preventionIndices)
    .where(eq(preventionIndices.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    // Update existing
    await db
      .update(preventionIndices)
      .set({
        score: indexData.score,
        tier: indexData.tier,
        breakdown: indexData.breakdown,
        updatedAt: new Date(),
      })
      .where(eq(preventionIndices.userId, userId));
  } else {
    // Insert new
    await db.insert(preventionIndices).values({
      userId,
      score: indexData.score,
      tier: indexData.tier,
      breakdown: indexData.breakdown,
    });
  }
}

/**
 * Get prevention index for a user (always recalculate to ensure fresh data)
 */
export async function getPreventionIndex(userId: string): Promise<PreventionIndexResult> {
  // Always recalculate to reflect latest user activity
  const indexData = await calculatePreventionIndex(userId);
  
  // Update or insert the cached value
  const existing = await db
    .select()
    .from(preventionIndices)
    .where(eq(preventionIndices.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    // Update existing record
    await db
      .update(preventionIndices)
      .set({
        score: indexData.score,
        tier: indexData.tier,
        breakdown: indexData.breakdown,
        updatedAt: new Date(),
      })
      .where(eq(preventionIndices.userId, userId));
  } else {
    // Insert new record
    await db.insert(preventionIndices).values({
      userId,
      score: indexData.score,
      tier: indexData.tier,
      breakdown: indexData.breakdown,
    });
  }

  return indexData;
}
