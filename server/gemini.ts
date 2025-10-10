import * as fs from "fs";
import { GoogleGenAI, Modality } from "@google/genai";

// DON'T DELETE THIS COMMENT
// Blueprint: javascript_gemini integration
// Gemini AI service for medical prevention system

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

Respond with JSON in this exact format:
{
  "message": "your conversational response in Italian",
  "isSensitive": boolean (mental health, chronic conditions, or private topics),
  "suggestDoctor": boolean (should user contact a real doctor?),
  "urgencyLevel": "low" | "medium" | "high" | "emergency",
  "relatedTopics": ["topic1", "topic2", ...]
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
          },
          required: ["message", "isSensitive", "suggestDoctor", "urgencyLevel", "relatedTopics"],
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
