import * as fs from "fs";
import { GoogleGenAI, Modality } from "@google/genai";

// DON'T DELETE THIS COMMENT
// Blueprint: javascript_gemini integration
// Gemini AI service for medical prevention system

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Generic Gemini content generation helper
export async function generateGeminiContent(prompt: string, model: string = "gemini-2.5-pro"): Promise<string> {
  const response = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  return response.text || "";
}

export async function summarizeArticle(text: string): Promise<string> {
  const prompt = `Please summarize the following text concisely while maintaining key points:\n\n${text}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  return response.text || "Something went wrong";
}

export interface Sentiment {
  rating: number;
  confidence: number;
}

export async function analyzeSentiment(text: string): Promise<Sentiment> {
  try {
    const systemPrompt = `You are a sentiment analysis expert. 
Analyze the sentiment of the text and provide a rating
from 1 to 5 stars and a confidence score between 0 and 1.
Respond with JSON in this format: 
{'rating': number, 'confidence': number}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            rating: { type: "number" },
            confidence: { type: "number" },
          },
          required: ["rating", "confidence"],
        },
      },
      contents: [{ role: "user", parts: [{ text }] }],
    });

    const rawJson = response.text;

    if (rawJson) {
      const data: Sentiment = JSON.parse(rawJson);
      return data;
    } else {
      throw new Error("Empty response from model");
    }
  } catch (error) {
    throw new Error(`Failed to analyze sentiment: ${error}`);
  }
}

export async function analyzeImage(jpegImagePath: string): Promise<string> {
  const imageBytes = fs.readFileSync(jpegImagePath);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: [{
      role: "user",
      parts: [
        {
          inlineData: {
            data: imageBytes.toString("base64"),
            mimeType: "image/jpeg",
          },
        },
        {
          text: `Analyze this image in detail and describe its key elements, context, and any notable aspects.`,
        }
      ]
    }],
  });

  return response.text || "";
}

export async function analyzeVideo(mp4VideoPath: string): Promise<string> {
  const videoBytes = fs.readFileSync(mp4VideoPath);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: [{
      role: "user",
      parts: [
        {
          inlineData: {
            data: videoBytes.toString("base64"),
            mimeType: "video/mp4",
          },
        },
        {
          text: `Analyze this video in detail and describe its key elements, context, and any notable aspects.`,
        }
      ]
    }],
  });

  return response.text || "";
}

export async function generateImage(
  prompt: string,
  imagePath: string,
): Promise<void> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      return;
    }

    const content = candidates[0].content;
    if (!content || !content.parts) {
      return;
    }

    for (const part of content.parts) {
      if (part.text) {
        console.log(part.text);
      } else if (part.inlineData && part.inlineData.data) {
        const imageData = Buffer.from(part.inlineData.data, "base64");
        fs.writeFileSync(imagePath, imageData);
        console.log(`Image saved as ${imagePath}`);
      }
    }
  } catch (error) {
    throw new Error(`Failed to generate image: ${error}`);
  }
}

// ========== MEDICAL PREVENTION SYSTEM - CUSTOM FUNCTIONS ==========

/**
 * Analyze medical document (PDF text) and extract key topics/symptoms
 */
export async function analyzePreventionDocument(documentText: string): Promise<{
  topics: string[];
  keywords: string[];
  summary: string;
  language: string;
}> {
  try {
    const systemPrompt = `You are a medical document analysis expert.
Analyze the medical prevention document and extract:
- Main health topics covered (max 10)
- Medical keywords and symptoms (max 20)
- Brief summary (1-2 sentences)
- Detected language (it, en, es)

Respond with JSON in this exact format:
{
  "topics": ["topic1", "topic2", ...],
  "keywords": ["keyword1", "keyword2", ...],
  "summary": "brief summary",
  "language": "it"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            topics: { type: "array", items: { type: "string" } },
            keywords: { type: "array", items: { type: "string" } },
            summary: { type: "string" },
            language: { type: "string" },
          },
          required: ["topics", "keywords", "summary", "language"],
        },
      },
      contents: [{ role: "user", parts: [{ text: documentText }] }],
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty response from Gemini");
    }

    const result = JSON.parse(rawJson);
    console.log("[Gemini] Document analysis completed:", result.topics.length, "topics found");
    return result;
  } catch (error) {
    console.error("[Gemini] Failed to analyze prevention document:", error);
    throw new Error(`Failed to analyze prevention document: ${error}`);
  }
}

/**
 * Generate personalized prevention assessment questions
 */
export interface AssessmentQuestion {
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export async function generateAssessmentQuestions(
  userAge: number,
  userGender: string,
  userProfession: string
): Promise<AssessmentQuestion[]> {
  try {
    const systemPrompt = `You are a medical prevention expert creating personalized health assessment questions.

Generate exactly 10 multiple-choice questions about health prevention and wellness, personalized for:
- Age: ${userAge} years old
- Gender: ${userGender}
- Profession: ${userProfession}

REQUIREMENTS:
- Questions should cover: nutrition, exercise, mental health, disease prevention, workplace health
- Each question has 4 options (A, B, C, D)
- Questions must be appropriate for the user's age and profession
- Include practical, actionable health advice
- Mix difficulty levels (easy, medium, hard)
- Use Italian language
- Focus on prevention, not diagnosis

Respond with JSON in this exact format:
{
  "questions": [
    {
      "text": "Question text in Italian",
      "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
      "correctAnswer": "A",
      "explanation": "Brief explanation why this answer is correct (1-2 sentences)"
    },
    ... (exactly 10 questions)
  ]
}`;

    const userPrompt = `Create 10 personalized health prevention questions for a ${userAge}-year-old ${userGender} working as ${userProfession}. Focus on relevant health risks and prevention strategies for this demographic.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string" },
                  options: { type: "array", items: { type: "string" } },
                  correctAnswer: { type: "string" },
                  explanation: { type: "string" },
                },
                required: ["text", "options", "correctAnswer", "explanation"],
              },
            },
          },
          required: ["questions"],
        },
      },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty response from Gemini");
    }

    const result = JSON.parse(rawJson);
    console.log("[Gemini] Generated", result.questions.length, "assessment questions");
    
    // Validate we have exactly 10 questions
    if (!result.questions || result.questions.length !== 10) {
      throw new Error(`Invalid number of questions generated: ${result.questions?.length || 0}. Expected exactly 10 questions.`);
    }

    // Validate each question structure
    for (let i = 0; i < result.questions.length; i++) {
      const q = result.questions[i];
      
      // Validate required fields
      if (!q.text || !q.options || !q.correctAnswer || !q.explanation) {
        throw new Error(`Question ${i + 1} is missing required fields`);
      }
      
      // Validate options array has exactly 4 items
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        throw new Error(`Question ${i + 1} must have exactly 4 options, got ${q.options?.length || 0}`);
      }
      
      // Validate correctAnswer is A, B, C, or D
      const validAnswers = ['A', 'B', 'C', 'D'];
      if (!validAnswers.includes(q.correctAnswer)) {
        throw new Error(`Question ${i + 1} has invalid correctAnswer: "${q.correctAnswer}". Must be A, B, C, or D`);
      }
    }
    
    return result.questions;
  } catch (error) {
    console.error("[Gemini] Failed to generate assessment questions:", error);
    throw new Error(`Failed to generate assessment questions: ${error}`);
  }
}

/**
 * Generate medical triage response based on user symptoms
 */
export interface TriageResponse {
  message: string;
  isSensitive: boolean;
  suggestDoctor: boolean;
  urgencyLevel: "low" | "medium" | "high" | "emergency";
  relatedTopics: string[];
  needsReportUpload: boolean; // True if user wants to share medical reports
}

export async function generateTriageResponse(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  documentContext?: string
): Promise<TriageResponse> {
  try {
    const contextInfo = documentContext 
      ? `\n\nRelevant medical documentation:\n${documentContext}`
      : "";

    const systemPrompt = `You are a medical triage assistant named "Prohmed".
You help users understand their symptoms and guide them to appropriate care.

IMPORTANT GUIDELINES:
- Be empathetic, professional, and reassuring
- Ask clarifying questions about symptoms
- NEVER diagnose - only provide general health information
- For serious symptoms, ALWAYS recommend consulting a doctor
- Flag sensitive topics (mental health, chronic diseases, emergencies)
- Assess urgency level based on symptoms
- Suggest relevant prevention topics for further learning
- Use Italian language naturally and conversationally

MEDICAL REPORTS DETECTION:
- If user mentions wanting to share medical reports, test results, lab results, or medical documents, set needsReportUpload=true
- Common phrases: "ho degli esami", "vorrei mostrarti le analisi", "ho fatto degli esami del sangue", "posso caricare i referti?", "ti mando i risultati", etc.
- When needsReportUpload=true, inform user they can upload their reports for AI analysis

Respond with JSON in this exact format:
{
  "message": "your conversational response in Italian",
  "isSensitive": boolean (mental health, chronic conditions, or private topics),
  "suggestDoctor": boolean (should user contact a real doctor?),
  "urgencyLevel": "low" | "medium" | "high" | "emergency",
  "relatedTopics": ["topic1", "topic2", ...],
  "needsReportUpload": boolean (true if user wants to share medical reports/tests)
}${contextInfo}`;

    // Build contents array with proper message structure
    const contents = conversationHistory.map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));
    
    // Add current user message
    contents.push({
      role: "user",
      parts: [{ text: userMessage }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            message: { type: "string" },
            isSensitive: { type: "boolean" },
            suggestDoctor: { type: "boolean" },
            urgencyLevel: { type: "string", enum: ["low", "medium", "high", "emergency"] },
            relatedTopics: { type: "array", items: { type: "string" } },
            needsReportUpload: { type: "boolean" },
          },
          required: ["message", "isSensitive", "suggestDoctor", "urgencyLevel", "relatedTopics", "needsReportUpload"],
        },
      },
      contents,
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty response from Gemini");
    }

    const result = JSON.parse(rawJson);
    console.log("[Gemini] Triage response generated, urgency:", result.urgencyLevel);
    return result;
  } catch (error) {
    console.error("[Gemini] Failed to generate triage response:", error);
    throw new Error(`Failed to generate triage response: ${error}`);
  }
}

/**
 * Generate crossword puzzle based on medical topics
 */
export interface CrosswordClue {
  number: number;
  clue: string;
  answer: string;
  direction: "across" | "down";
  row: number;
  col: number;
}

export async function generateCrosswordPuzzle(
  topic: string,
  difficulty: "easy" | "medium" | "hard",
  size: number = 15
): Promise<{
  title: string;
  clues: CrosswordClue[];
  grid: string[][];
}> {
  try {
    const systemPrompt = `You are a crossword puzzle generator expert specializing in medical and health topics.
Generate a ${size}x${size} crossword puzzle about: ${topic}
Difficulty: ${difficulty}

Requirements:
- Create 15-20 intersecting words related to the topic
- Clues should be educational and engaging
- Words must be in Italian
- Provide exact grid positions (row, col) for each word
- Ensure words intersect properly
- No duplicate words

Respond with JSON in this exact format:
{
  "title": "puzzle title in Italian",
  "clues": [
    {
      "number": 1,
      "clue": "clue text in Italian",
      "answer": "ANSWER",
      "direction": "across" or "down",
      "row": 0,
      "col": 0
    },
    ...
  ],
  "grid": [["", "A", "", ...], [...], ...] (${size}x${size} array, empty string for blank cells)
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
      contents: [{ 
        role: "user", 
        parts: [{ text: `Generate crossword puzzle for topic: ${topic}` }] 
      }],
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty response from Gemini");
    }

    const result = JSON.parse(rawJson);
    console.log("[Gemini] Crossword puzzle generated:", result.clues?.length || 0, "clues");
    return result;
  } catch (error) {
    console.error("[Gemini] Failed to generate crossword puzzle:", error);
    throw new Error(`Failed to generate crossword puzzle: ${error}`);
  }
}

// ========== HEALTH SCORE SYSTEM - OCR & ANALYSIS ==========

/**
 * Extract text from medical report (PDF or image) using OCR
 */
export interface MedicalReportOCR {
  extractedText: string;
  reportType: string; // blood_test, radiology, cardiology, general, etc
  detectedLanguage: string; // it, en, es
  issuer?: string; // Hospital/lab name
  reportDate?: string; // ISO date string if detected
  extractedValues: Record<string, any>; // Medical values like {glucose: 95, cholesterol: 180}
  medicalKeywords: string[]; // Relevant keywords for search
  summary: string; // Brief AI summary
  confidence: number; // 0-100 OCR confidence
}

export async function extractTextFromMedicalReport(
  filePath: string,
  mimeType: string
): Promise<MedicalReportOCR> {
  try {
    let extractedText = "";
    
    // Handle PDF files
    if (mimeType === "application/pdf") {
      const pdfBuffer = fs.readFileSync(filePath);
      // @ts-ignore - pdf-parse has default export in runtime but not in types
      const pdfParse = (await import('pdf-parse')).default;
      const pdfData = await pdfParse(pdfBuffer);
      extractedText = pdfData.text;
      console.log("[Gemini] PDF text extracted:", extractedText.length, "characters");
    }
    // Handle images (JPEG, PNG) with Gemini Vision OCR
    else if (mimeType.startsWith("image/")) {
      const imageBytes = fs.readFileSync(filePath);
      
      const ocrPrompt = `Extract ALL text from this medical report image using OCR.
      
IMPORTANT REQUIREMENTS:
- Extract EVERY piece of text visible in the image
- Preserve the exact structure and formatting
- Include patient data, test names, values, units, reference ranges
- Include headers, footers, hospital/lab names, dates
- If text is unclear, include it with [?] marker
- Return the complete raw text as it appears

Respond ONLY with the extracted text, no additional commentary.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{
          role: "user",
          parts: [
            {
              inlineData: {
                data: imageBytes.toString("base64"),
                mimeType,
              },
            },
            { text: ocrPrompt }
          ]
        }],
      });

      extractedText = response.text || "";
      console.log("[Gemini] Image OCR completed:", extractedText.length, "characters");
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    if (!extractedText || extractedText.trim().length < 10) {
      throw new Error("No text could be extracted from the medical report");
    }

    // Analyze extracted text with Gemini to structure medical data
    const analysisPrompt = `Analyze this medical report text and extract structured information.

Medical Report Text:
${extractedText}

Extract the following information:
1. Report type (blood_test, radiology, cardiology, ultrasound, mri, ct_scan, ecg, urinalysis, general, other)
2. Detected language (it, en, es)
3. Hospital/lab name if visible
4. Report date if visible (ISO format YYYY-MM-DD)
5. Medical values as key-value pairs (e.g., glucose: 95, cholesterol: 180)
6. Medical keywords for search (max 15 keywords)
7. Brief summary (2-3 sentences in Italian)
8. OCR confidence (0-100 based on text clarity)

Respond with JSON in this exact format:
{
  "reportType": "blood_test",
  "detectedLanguage": "it",
  "issuer": "Hospital/Lab Name or null",
  "reportDate": "2024-03-15 or null",
  "extractedValues": {"param1": value1, "param2": value2},
  "medicalKeywords": ["keyword1", "keyword2", ...],
  "summary": "brief summary in Italian",
  "confidence": 85
}`;

    const analysisResponse = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            reportType: { type: "string" },
            detectedLanguage: { type: "string" },
            issuer: { type: "string" },
            reportDate: { type: "string" },
            extractedValues: { type: "object" },
            medicalKeywords: { type: "array", items: { type: "string" } },
            summary: { type: "string" },
            confidence: { type: "number" },
          },
          required: ["reportType", "detectedLanguage", "summary", "confidence"],
        },
      },
      contents: [{ role: "user", parts: [{ text: analysisPrompt }] }],
    });

    const analysisJson = analysisResponse.text;
    if (!analysisJson) {
      throw new Error("Empty analysis response from Gemini");
    }

    const analysis = JSON.parse(analysisJson);
    
    const result: MedicalReportOCR = {
      extractedText,
      reportType: analysis.reportType || "general",
      detectedLanguage: analysis.detectedLanguage || "it",
      issuer: analysis.issuer || undefined,
      reportDate: analysis.reportDate || undefined,
      extractedValues: analysis.extractedValues || {},
      medicalKeywords: analysis.medicalKeywords || [],
      summary: analysis.summary,
      confidence: analysis.confidence || 70,
    };

    console.log("[Gemini] Medical report OCR completed:", result.reportType, result.confidence + "% confidence");
    return result;
  } catch (error) {
    console.error("[Gemini] Failed to extract text from medical report:", error);
    throw new Error(`Failed to extract text from medical report: ${error}`);
  }
}

/**
 * Anonymize medical text by removing PII (Personal Identifiable Information)
 * Uses hybrid approach: regex patterns + Gemini AI for contextual PII detection
 */
export interface AnonymizationResult {
  anonymizedText: string;
  removedPiiTypes: string[]; // Types of PII found: cf, name, phone, email, address, etc
  piiCount: number; // Total number of PII items removed
}

export async function anonymizeMedicalText(
  originalText: string
): Promise<AnonymizationResult> {
  try {
    const removedPiiTypes = new Set<string>();
    let anonymizedText = originalText;
    let piiCount = 0;

    // Step 1: Regex-based PII removal for common Italian patterns
    
    // Italian Codice Fiscale (CF): 16 characters alphanumeric
    const cfRegex = /\b[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]\b/gi;
    if (cfRegex.test(anonymizedText)) {
      anonymizedText = anonymizedText.replace(cfRegex, '[CF_REDATTO]');
      removedPiiTypes.add('codice_fiscale');
      piiCount += (originalText.match(cfRegex) || []).length;
    }

    // Phone numbers (Italian formats: +39, 0039, landline, mobile)
    const phoneRegex = /(\+39|0039)?\s*\d{2,4}[\s-]?\d{5,8}|\b\d{10}\b/gi;
    if (phoneRegex.test(anonymizedText)) {
      anonymizedText = anonymizedText.replace(phoneRegex, '[TELEFONO_REDATTO]');
      removedPiiTypes.add('phone');
      piiCount += (originalText.match(phoneRegex) || []).length;
    }

    // Email addresses
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi;
    if (emailRegex.test(anonymizedText)) {
      anonymizedText = anonymizedText.replace(emailRegex, '[EMAIL_REDATTO]');
      removedPiiTypes.add('email');
      piiCount += (originalText.match(emailRegex) || []).length;
    }

    // Italian addresses (patterns: Via, Viale, Piazza, Corso + street number)
    const addressRegex = /\b(Via|Viale|Piazza|Corso|Vicolo|Largo)\s+[A-Za-zàèéìòù\s]+\s*,?\s*\d+/gi;
    if (addressRegex.test(anonymizedText)) {
      anonymizedText = anonymizedText.replace(addressRegex, '[INDIRIZZO_REDATTO]');
      removedPiiTypes.add('address');
      piiCount += (originalText.match(addressRegex) || []).length;
    }

    // Italian postal codes (5 digits)
    const postalCodeRegex = /\b\d{5}\b/g;
    if (postalCodeRegex.test(anonymizedText)) {
      anonymizedText = anonymizedText.replace(postalCodeRegex, '[CAP_REDATTO]');
      removedPiiTypes.add('postal_code');
      piiCount += (originalText.match(postalCodeRegex) || []).length;
    }

    // Step 2: AI-based contextual PII detection with Gemini
    const aiPrompt = `Analyze this medical report text and identify ALL personally identifiable information (PII) that needs to be anonymized.

Medical Report Text:
${anonymizedText}

IMPORTANT:
- Identify: patient names, doctor names, relative names, dates of birth, national ID numbers not caught by regex, addresses, any other personal identifiers
- DO NOT include: medical values, test results, diagnoses, symptoms, medications
- Be thorough: check for names in signatures, headers, footers, patient data sections

Respond with JSON in this exact format:
{
  "piiItems": [
    {
      "type": "name" | "date_of_birth" | "national_id" | "doctor_name" | "relative_name" | "address" | "other",
      "value": "the exact PII text found",
      "context": "brief context where found"
    },
    ...
  ]
}

If no additional PII found beyond regex patterns, return empty piiItems array.`;

    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            piiItems: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  value: { type: "string" },
                  context: { type: "string" },
                },
                required: ["type", "value"],
              },
            },
          },
          required: ["piiItems"],
        },
      },
      contents: [{ role: "user", parts: [{ text: aiPrompt }] }],
    });

    const aiJson = aiResponse.text;
    if (aiJson) {
      const aiResult = JSON.parse(aiJson);
      
      // Replace AI-identified PII with redacted placeholders
      if (aiResult.piiItems && aiResult.piiItems.length > 0) {
        for (const pii of aiResult.piiItems) {
          // Create case-insensitive replacement
          const escapedValue = pii.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(escapedValue, 'gi');
          
          const placeholder = `[${pii.type.toUpperCase()}_REDATTO]`;
          anonymizedText = anonymizedText.replace(regex, placeholder);
          
          removedPiiTypes.add(pii.type);
          piiCount++;
        }
        
        console.log(`[Gemini] AI detected ${aiResult.piiItems.length} additional PII items`);
      }
    }

    const result: AnonymizationResult = {
      anonymizedText,
      removedPiiTypes: Array.from(removedPiiTypes),
      piiCount,
    };

    console.log("[Gemini] Anonymization completed:", piiCount, "PII items removed, types:", result.removedPiiTypes.join(', '));
    return result;
  } catch (error) {
    console.error("[Gemini] Failed to anonymize medical text:", error);
    throw new Error(`Failed to anonymize medical text: ${error}`);
  }
}
