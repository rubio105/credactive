import { db } from "./db";
import { mlTrainingData } from "@shared/schema";
import { eq, count, sql as sqlOp, and, gte } from "drizzle-orm";
import crypto from "crypto";
import fs from "fs/promises"; // Use async fs
import { createReadStream } from "fs";

/**
 * ML Training Data Collector - UNIVERSAL
 * Intercepts ALL platform data: Gemini, OpenAI, medical notes, documents, conversations
 * Part of Active Learning strategy for gradual migration to proprietary ML models
 */

// ALL possible request types across the platform
type MLRequestType = 
  // AI Interactions (Gemini)
  | 'radiological_analysis' | 'medical_triage' | 'prevention_chat' | 'crossword_generation'
  | 'rag_semantic_search' // RAG knowledge base queries
  // AI Interactions (OpenAI)
  | 'conversational_assistant' | 'email_marketing' | 'ai_translation' | 'tts_audio' 
  | 'question_generation' | 'scenario_generation'
  // Medical Data (non-AI)
  | 'doctor_note' | 'medical_report' | 'ecg_upload' | 'document_upload'
  // Other
  | 'user_feedback' | 'health_assessment';

interface MLTrainingDataInput {
  requestType: MLRequestType;
  modelUsed: string; // 'gemini-2.5-pro', 'gpt-4o', 'tts-1', 'manual' (non-AI data)
  
  // Input data (flexible for all types)
  inputImagePath?: string; // Path to any file (radiology, ECG, documents)
  inputText?: string; // Text input (chat, notes, prompts)
  inputPrompt: string; // Full prompt or content description
  
  // Output data
  outputJson: any; // Parsed JSON response or structured data
  outputRaw?: string; // Raw text response or content
  
  // User context
  userId?: string;
  userAge?: number;
  userGender?: string;
  
  // Performance metrics
  responseTimeMs?: number;
  tokensUsed?: number;
  confidenceScore?: number;
}

/**
 * Calculate SHA-256 hash of file asynchronously using streams
 */
async function calculateFileHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = createReadStream(filePath);
    
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * Save Gemini API call data for ML training (fully async, non-blocking)
 */
export async function saveTrainingData(data: MLTrainingDataInput): Promise<void> {
  try {
    // Calculate image hash if image path provided (async streaming)
    let inputImageHash: string | undefined;
    if (data.inputImagePath) {
      try {
        await fs.access(data.inputImagePath); // Check file exists (async)
        inputImageHash = await calculateFileHash(data.inputImagePath);
      } catch {
        // File doesn't exist or can't be read - continue without hash
      }
    }

    // Insert into database
    await db.insert(mlTrainingData).values({
      requestType: data.requestType,
      modelUsed: data.modelUsed,
      inputImagePath: data.inputImagePath || null,
      inputImageHash: inputImageHash || null,
      inputText: data.inputText || null,
      inputPrompt: data.inputPrompt,
      outputJson: data.outputJson,
      outputRaw: data.outputRaw || null,
      userId: data.userId || null,
      userAge: data.userAge || null,
      userGender: data.userGender || null,
      responseTimeMs: data.responseTimeMs || null,
      tokensUsed: data.tokensUsed || null,
      confidenceScore: data.confidenceScore || null,
      userFeedback: null,
      doctorCorrectionJson: null,
      doctorNotes: null,
      includedInTraining: false,
      qualityRating: null,
    });

    console.log(`[ML Collector] Saved ${data.requestType} training data for model: ${data.modelUsed}`);
  } catch (error) {
    // Don't let ML data collection errors affect the main flow
    console.error('[ML Collector] Failed to save training data:', error);
  }
}

/**
 * Update training data with user feedback
 */
export async function updateTrainingDataFeedback(
  dataId: string,
  feedback: {
    userFeedback?: 'positive' | 'negative' | 'corrected';
    doctorCorrectionJson?: any;
    doctorNotes?: string;
    qualityRating?: number;
  }
): Promise<void> {
  try {
    await db.update(mlTrainingData)
      .set({
        userFeedback: feedback.userFeedback || null,
        doctorCorrectionJson: feedback.doctorCorrectionJson || null,
        doctorNotes: feedback.doctorNotes || null,
        qualityRating: feedback.qualityRating || null,
      })
      .where(eq(mlTrainingData.id, dataId));

    console.log(`[ML Collector] Updated feedback for training data: ${dataId}`);
  } catch (error) {
    console.error('[ML Collector] Failed to update training data feedback:', error);
  }
}

/**
 * Get training data statistics (optimized with database aggregates)
 */
export async function getMLTrainingStats(): Promise<{
  totalRecords: number;
  byRequestType: Record<string, number>;
  byModel: Record<string, number>;
  withFeedback: number;
  includedInTraining: number;
}> {
  try {
    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(mlTrainingData);
    const totalRecords = Number(totalResult[0]?.count || 0);

    // Get counts by request type
    const byRequestTypeResults = await db
      .select({
        requestType: mlTrainingData.requestType,
        count: count(),
      })
      .from(mlTrainingData)
      .groupBy(mlTrainingData.requestType);

    const byRequestType: Record<string, number> = {};
    for (const row of byRequestTypeResults) {
      byRequestType[row.requestType] = Number(row.count);
    }

    // Get counts by model
    const byModelResults = await db
      .select({
        modelUsed: mlTrainingData.modelUsed,
        count: count(),
      })
      .from(mlTrainingData)
      .groupBy(mlTrainingData.modelUsed);

    const byModel: Record<string, number> = {};
    for (const row of byModelResults) {
      byModel[row.modelUsed] = Number(row.count);
    }

    // Count records with feedback (using SQL)
    const withFeedbackResult = await db
      .select({ count: count() })
      .from(mlTrainingData)
      .where(sqlOp`${mlTrainingData.userFeedback} IS NOT NULL`);
    const withFeedback = Number(withFeedbackResult[0]?.count || 0);

    // Count records included in training
    const includedInTrainingResult = await db
      .select({ count: count() })
      .from(mlTrainingData)
      .where(eq(mlTrainingData.includedInTraining, true));
    const includedInTraining = Number(includedInTrainingResult[0]?.count || 0);

    return {
      totalRecords,
      byRequestType,
      byModel,
      withFeedback,
      includedInTraining,
    };
  } catch (error) {
    console.error('[ML Collector] Failed to get training stats:', error);
    return {
      totalRecords: 0,
      byRequestType: {},
      byModel: {},
      withFeedback: 0,
      includedInTraining: 0,
    };
  }
}

/**
 * HELPER: Save OpenAI API call for ML training
 */
export async function saveOpenAIData(data: {
  requestType: MLRequestType;
  model: string; // 'gpt-4o', 'gpt-4o-mini', 'tts-1'
  inputPrompt: string;
  messages?: any[]; // OpenAI messages array
  outputText?: string;
  outputJson?: any;
  userId?: string;
  userAge?: number;
  userGender?: string;
  responseTimeMs?: number;
  tokensUsed?: number;
}): Promise<void> {
  await saveTrainingData({
    requestType: data.requestType,
    modelUsed: data.model,
    inputPrompt: data.inputPrompt,
    inputText: data.messages ? JSON.stringify(data.messages) : undefined,
    outputJson: data.outputJson || { text: data.outputText },
    outputRaw: data.outputText,
    userId: data.userId,
    userAge: data.userAge,
    userGender: data.userGender,
    responseTimeMs: data.responseTimeMs,
    tokensUsed: data.tokensUsed,
  });
}

/**
 * HELPER: Save medical note/document for ML training (non-AI data)
 */
export async function saveMedicalData(data: {
  requestType: 'doctor_note' | 'medical_report' | 'ecg_upload' | 'document_upload';
  content: string | object; // Note content or document metadata
  filePath?: string;
  userId?: string;
  userAge?: number;
  userGender?: string;
  metadata?: any; // Additional metadata (category, attachments, etc.)
}): Promise<void> {
  await saveTrainingData({
    requestType: data.requestType,
    modelUsed: 'manual', // Non-AI data
    inputPrompt: `Medical data: ${data.requestType}`,
    inputText: typeof data.content === 'string' ? data.content : JSON.stringify(data.content),
    inputImagePath: data.filePath,
    outputJson: data.metadata || {},
    userId: data.userId,
    userAge: data.userAge,
    userGender: data.userGender,
  });
}

/**
 * Export training data to JSON file (optimized with database filtering)
 */
export async function exportTrainingDataToFile(
  outputPath: string,
  filters?: {
    requestType?: string;
    minQualityRating?: number;
    excludeAlreadyIncluded?: boolean;
  }
): Promise<{ exported: number; filePath: string }> {
  try {
    // Build query with filters at database level
    const conditions: any[] = [];
    
    if (filters?.requestType) {
      conditions.push(eq(mlTrainingData.requestType, filters.requestType));
    }
    
    if (filters?.minQualityRating !== undefined) {
      conditions.push(gte(mlTrainingData.qualityRating, filters.minQualityRating));
    }
    
    if (filters?.excludeAlreadyIncluded) {
      conditions.push(eq(mlTrainingData.includedInTraining, false));
    }

    // Fetch filtered data (apply WHERE conditions using 'and')
    const filteredData = conditions.length > 0
      ? await db.select().from(mlTrainingData).where(and(...conditions))
      : await db.select().from(mlTrainingData);

    // Export to JSON using async fs
    await fs.writeFile(outputPath, JSON.stringify(filteredData, null, 2), 'utf-8');

    console.log(`[ML Collector] Exported ${filteredData.length} records to: ${outputPath}`);

    return {
      exported: filteredData.length,
      filePath: outputPath,
    };
  } catch (error) {
    console.error('[ML Collector] Failed to export training data:', error);
    throw error;
  }
}
