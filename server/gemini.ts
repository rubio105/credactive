import * as fs from "fs";
import { GoogleGenAI, Modality } from "@google/genai";
import { createRequire } from "module";

// DON'T DELETE THIS COMMENT
// Blueprint: javascript_gemini integration
// Gemini AI service for medical prevention system

// pdf-parse (CommonJS module) - use createRequire for compatibility
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

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
  documentContext?: string,
  userName?: string,
  scientificContext?: string,
  userRole?: 'patient' | 'doctor',
  language?: string,
  userAge?: number,
  userGender?: string
): Promise<TriageResponse> {
  try {
    const contextInfo = documentContext 
      ? `\n\nRELEVANT MEDICAL DOCUMENTATION (User's personal reports):\n${documentContext}`
      : "";
    
    const scientificInfo = scientificContext
      ? `\n\nSCIENTIFIC EVIDENCE BASE (Medical literature):\n${scientificContext}\n\nIMPORTANT: Base your prevention recommendations on these scientific sources when relevant.`
      : "";
    
    const userGreeting = userName 
      ? `\n\nUSER CONTEXT: The user's name is ${userName}. When appropriate, address them by name to personalize the conversation (e.g., "Ciao ${userName}, capisco la tua preoccupazione...").`
      : "\n\nUSER CONTEXT: This is an anonymous user. Use general greetings without names.";

    // Build demographic context for patients
    const demographicContext = userRole !== 'doctor' && (userAge || userGender)
      ? `\n\nPATIENT DEMOGRAPHICS:${userAge ? `\n- Age: ${userAge} years old` : ''}${userGender ? `\n- Gender: ${userGender}` : ''}
IMPORTANT: Consider age and gender when:
- Assessing risk factors (age-specific conditions, gender-specific health concerns)
- Recommending screening schedules (mammography, prostate, colonoscopy based on age/gender)
- Discussing prevention strategies (menopause, andropause, age-related concerns)
- Evaluating symptoms (pediatric vs adult vs elderly considerations)
- Providing personalized health education tailored to their demographic profile`
      : '';

    const roleContext = userRole === 'doctor' 
      ? `\n\nUSER ROLE: This user is a MEDICAL PROFESSIONAL. Adapt your language:
- Use appropriate medical terminology and technical language
- Reference clinical guidelines and evidence-based practices
- Discuss pathophysiology and mechanisms when relevant
- Provide detailed, scientifically rigorous explanations
- Focus on prevention strategies they can recommend to their patients
- Still maintain a conversational tone, but with professional depth`
      : `\n\nUSER ROLE: This user is a PATIENT or general public. Adapt your language:
- Use simple, everyday language and avoid medical jargon
- Explain concepts in accessible terms
- Focus on practical, actionable advice
- Be empathetic and supportive
- Translate medical terms into plain Italian`;

    const systemPrompt = `You are "AI Prohmed", an educational assistant specialized in teaching prevention strategies.
Your mission is to help users LEARN how to prevent health issues through their personal cases.

CONVERSATIONAL & EXPLORATORY APPROACH:
- Be empathetic, encouraging, and naturally conversational
- ALWAYS ask clarifying follow-up questions before giving advice
- When user mentions a symptom/concern, explore it deeply with 2-3 specific questions:
  * TIMING: "Da quanto tempo?" "Quando è iniziato?" "È costante o intermittente?"
  * LOCATION: "In che zona esatta?" "Si irradia altrove?" "È localizzato o diffuso?"
  * INTENSITY: "Quanto è forte da 1 a 10?" "Interferisce con le attività quotidiane?"
  * CONTEXT: "Cosa stavi facendo quando è iniziato?" "Hai notato fattori scatenanti?"
  * ASSOCIATED SYMPTOMS: "Hai altri sintomi?" "C'è qualcos'altro che hai notato?"
- Make the conversation feel natural, like talking to a caring health educator
- Build on previous answers to go deeper into their case

PREVENTION EDUCATION FOCUS:
- ONLY after understanding their specific case, TEACH personalized prevention strategies
- Explain WHY certain practices prevent diseases (mechanism of action)
- Provide actionable steps: diet, exercise, lifestyle, screening schedules
- Discuss risk factors specific to their case (age, family history, profession)
- Connect prevention to long-term health benefits
- Encourage positive behavior change with motivational insights

WHEN TO FLAG MEDICAL ATTENTION:
- If user mentions concerning symptoms needing immediate care, set suggestDoctor=true${userRole === 'doctor' 
  ? `
- For MEDICAL PROFESSIONALS: Acknowledge clinical concerns and suggest appropriate specialist referral or further investigation
- Discuss differential diagnoses and recommended clinical pathways
- Focus on evidence-based guidelines and professional judgment
- Do NOT suggest contacting Prohmed team (they are already medical professionals)`
  : `
- For PATIENTS: When suggesting medical attention, ALWAYS say: "Ti consiglio di rivolgerti al team medico Prohmed per una valutazione professionale."
- ALWAYS ask: "Vuoi prendere un appuntamento con il nostro team medico?"
- ALWAYS guide them to action: "Puoi cliccare sul pulsante 'Richiedi Contatto Medico' per essere ricontattato da un nostro specialista."`}
- Still educate on prevention, but acknowledge when professional evaluation is needed
- Flag sensitive topics that may require specialized support (mental health, chronic conditions)

MEDICAL REPORTS FOR PERSONALIZATION:
- If user wants to share medical reports/results to personalize learning, set needsReportUpload=true
- Common phrases: "ho degli esami", "vorrei mostrarti le analisi", "posso caricare i referti?", "ti mando i risultati"
- Use reports to tailor prevention education to their specific health profile

LANGUAGE & TONE:
- Respond in ${language === 'en' ? 'English' : language === 'es' ? 'Spanish' : language === 'fr' ? 'French' : 'Italian'} naturally and conversationally
- Be motivating and positive about prevention benefits
- Avoid medical jargon - explain in simple terms
- Celebrate small steps toward healthier habits
- Ask questions one at a time, don't overwhelm with too many questions at once

Respond with JSON in this exact format:
{
  "message": "your educational response in ${language === 'en' ? 'English' : language === 'es' ? 'Spanish' : language === 'fr' ? 'French' : 'Italian'}, teaching prevention strategies",
  "isSensitive": boolean (mental health, chronic conditions, or private topics),
  "suggestDoctor": boolean (if immediate medical attention recommended),
  "urgencyLevel": "low" | "medium" | "high" | "emergency",
  "relatedTopics": ["prevention topic1", "prevention topic2", ...],
  "needsReportUpload": boolean (true if user wants to share medical reports for personalized learning)
}${scientificInfo}${contextInfo}${userGreeting}${demographicContext}${roleContext}`;

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
      model: "gemini-2.5-flash",
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
    console.log("[Gemini] Triage response generated (Flash), urgency:", result.urgencyLevel);
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
    const analysisPrompt = `Analizza questo referto medico ed estrai informazioni strutturate IN ITALIANO.

Testo del Referto Medico:
${extractedText}

Estrai le seguenti informazioni (TUTTO IN ITALIANO):
1. Tipo di referto (esame_sangue, radiologia, cardiologia, ecografia, risonanza, tac, ecg, esame_urine, generale, altro)
2. Lingua rilevata (it, en, es)
3. Nome ospedale/laboratorio se visibile
4. Data del referto se visibile (formato ISO YYYY-MM-DD)
5. Valori medici come coppie chiave-valore IN ITALIANO (es. glucosio: 95, colesterolo: 180, emoglobina: 14.5)
   - Usa SEMPRE nomi italiani per i parametri medici
   - Esempi: "glucosio" (non "glucose"), "colesterolo totale" (non "total cholesterol"), "emoglobina" (non "hemoglobin")
6. Parole chiave mediche per ricerca IN ITALIANO (max 15 keywords)
   - Esempi: "diabete", "pressione arteriosa", "funzionalità renale" (non in inglese)
7. Riassunto dettagliato e informativo (4-6 frasi in italiano) che includa:
   - Cosa mostra il referto (tipo di esame e scopo)
   - Principali risultati e valori rilevati
   - Eventuali valori anomali o reperti significativi
   - Significato clinico generale in linguaggio comprensibile
8. Confidenza OCR (0-100 basata sulla chiarezza del testo)

IMPORTANTE: Tutti i nomi dei parametri medici devono essere in ITALIANO, non in inglese.

Rispondi con JSON in questo formato esatto:
{
  "reportType": "esame_sangue",
  "detectedLanguage": "it",
  "issuer": "Nome Ospedale/Lab o null",
  "reportDate": "2024-03-15 o null",
  "extractedValues": {"glucosio": 95, "colesterolo totale": 180, "emoglobina": 14.5},
  "medicalKeywords": ["parola1", "parola2", ...],
  "summary": "breve riassunto in italiano",
  "confidence": 85
}`;

    const analysisResponse = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
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

// ========== RADIOLOGICAL IMAGE ANALYSIS (X-RAY, MRI, CT, ULTRASOUND) ==========

export interface RadiologyFinding {
  category: 'normal' | 'attention' | 'urgent';
  description: string; // Legacy field - kept for backward compatibility
  technicalDescription?: string; // Medical terminology for professionals
  patientDescription?: string; // Clear explanation for patients
  location?: string;
  confidence?: number;
}

export interface RadiologicalAnalysis {
  imageType: 'xray' | 'mri' | 'ct' | 'ultrasound' | 'other';
  bodyPart: string;
  findings: RadiologyFinding[];
  overallAssessment: string; // Legacy field - kept for backward compatibility
  technicalAssessment?: string; // Professional medical assessment
  patientAssessment?: string; // Patient-friendly assessment
  recommendations: string[];
  confidence: number;
}

/**
 * Analyze radiological images (X-ray, MRI, CT, Ultrasound) using Gemini Vision
 * Provides detailed medical interpretation with categorized findings
 */
export async function analyzeRadiologicalImage(
  filePath: string,
  mimeType: string
): Promise<RadiologicalAnalysis> {
  try {
    if (!mimeType.startsWith("image/")) {
      throw new Error(`Unsupported file type for radiological analysis: ${mimeType}`);
    }

    const imageBytes = fs.readFileSync(filePath);
    
    const radiologyPrompt = `Sei un radiologo esperto. Analizza questa immagine medica radiologica e fornisci un referto dettagliato IN ITALIANO.

IMPORTANTE: Fornisci DOPPIA DESCRIZIONE per ogni elemento - una tecnica per medici e una comprensibile per pazienti.

Analizza e identifica:
1. Tipo di imaging (xray, mri, ct, ultrasound, other)
2. Parte del corpo visualizzata (es. "torace", "cranio", "ginocchio sinistro", "addome")
3. Reperti radiologici (findings) con DUE DESCRIZIONI per ogni reperto:
   - "technicalDescription": Descrizione medico-scientifica precisa con terminologia tecnica (per professionisti sanitari)
   - "patientDescription": Spiegazione comprensibile e rassicurante (per il paziente e familiari)
   - Categorizzati come: "normal", "attention", "urgent"
4. Valutazione complessiva in DUE VERSIONI:
   - "technicalAssessment": Valutazione professionale con terminologia medica
   - "patientAssessment": Spiegazione chiara e comprensibile per il paziente
5. Raccomandazioni pratiche in italiano
6. Livello di confidenza (0-100) basato sulla qualità dell'immagine

ESEMPIO DI FINDING:
{
  "category": "attention",
  "technicalDescription": "Ispessimento pleurico basale destro con minimo versamento pleurico. Disventilazione parenchimale basale.",
  "patientDescription": "Si nota un leggero accumulo di liquido nella parte bassa del polmone destro. Questo può essere dovuto a infiammazione o irritazione della membrana che riveste il polmone. Nulla di grave, ma da monitorare.",
  "location": "base polmonare destra",
  "confidence": 85
}

Rispondi SOLO con JSON in questo formato:
{
  "imageType": "xray",
  "bodyPart": "torace",
  "findings": [
    {
      "category": "normal",
      "technicalDescription": "Descrizione tecnica professionale",
      "patientDescription": "Spiegazione comprensibile per il paziente",
      "location": "sede anatomica (opzionale)",
      "confidence": 90
    }
  ],
  "technicalAssessment": "Valutazione complessiva professionale con terminologia medica",
  "patientAssessment": "Spiegazione chiara e rassicurante per il paziente della situazione complessiva",
  "recommendations": [
    "Prima raccomandazione pratica",
    "Seconda raccomandazione se necessaria"
  ],
  "confidence": 85
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
      },
      contents: [{
        role: "user",
        parts: [
          {
            inlineData: {
              data: imageBytes.toString("base64"),
              mimeType,
            },
          },
          { text: radiologyPrompt }
        ]
      }],
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty radiological analysis response from Gemini");
    }

    const analysis = JSON.parse(rawJson);
    
    const result: RadiologicalAnalysis = {
      imageType: analysis.imageType || 'other',
      bodyPart: analysis.bodyPart || 'non identificato',
      findings: analysis.findings || [],
      overallAssessment: analysis.overallAssessment || '',
      recommendations: analysis.recommendations || [],
      confidence: analysis.confidence || 70,
    };

    console.log("[Gemini] Radiological analysis completed:", result.imageType, result.bodyPart, result.findings.length, "findings");
    return result;
  } catch (error) {
    console.error("[Gemini] Failed to analyze radiological image:", error);
    throw new Error(`Failed to analyze radiological image: ${error}`);
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

/**
 * Generate text embeddings using Gemini Embeddings API
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await ai.models.embedContent({
      model: "text-embedding-004",
      contents: [{ role: "user", parts: [{ text }] }],
    });

    if (!response.embeddings || response.embeddings.length === 0 || !response.embeddings[0].values) {
      throw new Error("No embedding returned from Gemini");
    }

    console.log("[Gemini] Generated embedding:", response.embeddings[0].values.length, "dimensions");
    return response.embeddings[0].values;
  } catch (error) {
    console.error("[Gemini] Failed to generate embedding:", error);
    throw new Error(`Failed to generate embedding: ${error}`);
  }
}

/**
 * Chunk text into smaller pieces for embedding (overlap strategy for context preservation)
 */
export interface TextChunk {
  content: string;
  index: number;
  tokenCount: number;
}

export function chunkText(text: string, maxTokens: number = 500, overlapTokens: number = 50): TextChunk[] {
  // Simple word-based chunking (1 token ≈ 0.75 words as rough estimate)
  const wordsPerChunk = Math.floor(maxTokens * 0.75);
  const overlapWords = Math.floor(overlapTokens * 0.75);
  
  const words = text.split(/\s+/);
  const chunks: TextChunk[] = [];
  let index = 0;
  
  for (let i = 0; i < words.length; i += wordsPerChunk - overlapWords) {
    const chunkWords = words.slice(i, i + wordsPerChunk);
    const content = chunkWords.join(' ');
    
    if (content.trim().length > 0) {
      chunks.push({
        content,
        index,
        tokenCount: Math.ceil(chunkWords.length / 0.75), // Rough token estimate
      });
      index++;
    }
  }
  
  console.log(`[Gemini] Chunked text into ${chunks.length} chunks (max ${maxTokens} tokens, overlap ${overlapTokens})`);
  return chunks;
}
