import OpenAI from "openai";
import { getApiKey } from "./config";

let openaiInstance: OpenAI | null = null;

async function getOpenAI(): Promise<OpenAI> {
  if (openaiInstance) {
    return openaiInstance;
  }

  const apiKey = await getApiKey('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  openaiInstance = new OpenAI({ apiKey });
  return openaiInstance;
}

export function clearOpenAIInstance() {
  openaiInstance = null;
}

interface ScenarioGenerationParams {
  category: string;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  wasCorrect: boolean;
  scenarioType: 'business_case' | 'personal_development';
}

interface GeneratedScenario {
  title: string;
  context: string;
  initialMessage: string;
}

const businessCasePrompts: Record<string, string> = {
  'GDPR': `You are a Data Protection Officer (DPO) expert. Create realistic business scenarios based on GDPR compliance challenges. Focus on practical situations like data breaches, subject access requests, consent management, cross-border transfers, or vendor compliance.`,
  
  'ISO 27001': `You are an Information Security Manager. Create realistic business scenarios about implementing ISO 27001 controls, risk assessments, incident response, audit preparation, or security policy enforcement.`,
  
  'CISSP': `You are a Chief Information Security Officer (CISO). Create realistic security scenarios covering risk management, security architecture decisions, incident handling, access control challenges, or business continuity planning.`,
  
  'CISM': `You are an Information Security Manager. Create realistic governance scenarios about security program development, risk management, incident management, or aligning security with business objectives.`,
  
  'NIS2': `You are a cybersecurity compliance expert. Create realistic scenarios about NIS2 Directive implementation, incident reporting obligations, supply chain security, or governance requirements for essential entities.`,
  
  'DORA': `You are a financial sector compliance expert. Create realistic scenarios about digital operational resilience, ICT risk management, third-party risk, or resilience testing for financial entities.`,
};

const personalDevelopmentPrompts: Record<string, string> = {
  'Insight Discovery': `You are a professional coach specializing in Insight Discovery personality framework. Create realistic workplace scenarios focused on stress management, communication challenges, team conflicts, or leadership situations. Tailor advice to the user's color type (Red/Fire, Yellow/Sunshine, Green/Earth, Blue/Cool Blue) and their typical stress triggers and coping mechanisms.`,
};

export async function generateScenario(params: ScenarioGenerationParams): Promise<GeneratedScenario> {
  const openai = await getOpenAI();
  
  let systemPrompt = '';
  let userPrompt = '';

  if (params.scenarioType === 'business_case') {
    // Business case scenarios for certifications
    const categoryPrompt = businessCasePrompts[params.category] || businessCasePrompts['GDPR'];
    
    systemPrompt = `${categoryPrompt}

Your scenarios should:
- Be realistic and practical
- Present a clear business challenge or decision point
- Allow for interactive discussion where the user can explore different approaches
- Be concise but detailed enough to be engaging (2-3 sentences for context)
- Focus on real-world application, not theory`;

    userPrompt = `The user just answered a question about: "${params.questionText}"

Their answer was ${params.wasCorrect ? 'CORRECT' : 'INCORRECT'} (they chose ${params.userAnswer}, correct answer was ${params.correctAnswer}).

Generate a realistic business scenario that:
1. Relates to the topic of the question
2. ${params.wasCorrect ? 'Explores a practical application or edge case' : 'Helps them understand the concept through a real-world example'}
3. Presents a situation where they need to make decisions or think critically

Respond in JSON format:
{
  "title": "Brief scenario title (max 60 chars)",
  "context": "2-3 sentence scenario description presenting the situation",
  "initialMessage": "Opening question or prompt to engage the user (be conversational and ask what they would do)"
}`;

  } else {
    // Personal development scenarios for Insight Discovery
    systemPrompt = personalDevelopmentPrompts['Insight Discovery'];

    userPrompt = `The user just completed a personality assessment question: "${params.questionText}"

Create a realistic workplace stress or communication scenario that:
1. Relates to personality and behavioral preferences
2. Presents a common workplace challenge (stress, conflict, communication breakdown, leadership decision)
3. Encourages reflection on their personal approach and coping strategies

Respond in JSON format:
{
  "title": "Brief scenario title (max 60 chars)",
  "context": "2-3 sentence scenario describing a workplace situation involving stress or interpersonal challenges",
  "initialMessage": "Opening question asking how they would handle this situation or what their approach would be"
}`;
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.8,
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  
  return {
    title: result.title || "Scenario Pratico",
    context: result.context || "",
    initialMessage: result.initialMessage || "Come affronteresti questa situazione?",
  };
}

export async function generateScenarioResponse(
  conversationHistory: Array<{ role: 'user' | 'assistant', content: string }>,
  category: string,
  scenarioType: 'business_case' | 'personal_development',
  userName?: string
): Promise<string> {
  const openai = await getOpenAI();

  // Detect language from the most recent user message
  const lastUserMessage = conversationHistory.filter(m => m.role === 'user').pop();
  const detectedLanguage = lastUserMessage?.content || '';
  
  // Create a personalized greeting with user's name
  const greeting = userName ? `${userName}` : '';

  let systemPrompt = '';
  
  if (scenarioType === 'business_case') {
    const categoryPrompt = businessCasePrompts[category] || businessCasePrompts['GDPR'];
    systemPrompt = `${categoryPrompt}

You are having an interactive conversation about a business scenario. Your role:
- ALWAYS use the user's first name when addressing them${greeting ? ` (their name is ${greeting})` : ''}
- Respond in the SAME LANGUAGE as the user's question (detect from their message)
- ONLY respond to questions related to the scenario topic (${category}). If the user asks about unrelated topics, politely redirect them back to the scenario
- Guide the user through decision-making
- Ask clarifying questions when needed
- Provide expert insights when appropriate
- Challenge assumptions constructively
- Keep responses concise (2-4 sentences max)
- Be conversational and engaging
- ALWAYS end your response with a phrase like "Se hai bisogno di altri approfondimenti o vuoi esplorare un aspetto specifico, chiedimi pure!" (adapt to the detected language)
- If the user provides a good answer, acknowledge it and optionally introduce a complication or follow-up consideration`;

  } else {
    systemPrompt = `${personalDevelopmentPrompts['Insight Discovery']}

You are having an interactive conversation about a workplace scenario. Your role:
- ALWAYS use the user's first name when addressing them${greeting ? ` (their name is ${greeting})` : ''}
- Respond in the SAME LANGUAGE as the user's question (detect from their message)
- ONLY respond to questions related to the scenario topic (personality, workplace stress, communication). If the user asks about unrelated topics, politely redirect them back to the scenario
- Help the user reflect on their natural tendencies
- Explore different approaches based on personality preferences
- Provide constructive coaching and insights
- Ask thought-provoking questions
- Keep responses concise (2-4 sentences max)
- Be empathetic and supportive
- ALWAYS end your response with a phrase like "Se hai bisogno di altri approfondimenti o vuoi esplorare un aspetto specifico, chiedimi pure!" (adapt to the detected language)
- Help them recognize patterns in their behavior and stress responses`;
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ],
    temperature: 0.7,
    max_tokens: 200,
  });

  return response.choices[0].message.content || "Interessante punto di vista. Puoi elaborare?";
}
