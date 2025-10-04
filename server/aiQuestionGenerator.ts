import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface QuestionOption {
  text: string;
  isCorrect: boolean;
}

interface GeneratedQuestion {
  question: string;
  options: QuestionOption[];
  explanation: string;
  difficulty: string;
  domain?: string; // CISSP domain or topic area
}

const certificationPrompts: Record<string, string> = {
  'CISSP': `You are an expert CISSP (Certified Information Systems Security Professional) instructor. Generate realistic CISSP exam questions covering the 8 domains: Security and Risk Management, Asset Security, Security Architecture and Engineering, Communication and Network Security, Identity and Access Management, Security Assessment and Testing, Security Operations, and Software Development Security.`,
  
  'CISM': `You are an expert CISM (Certified Information Security Manager) instructor. Generate realistic CISM exam questions covering the 4 domains: Information Security Governance, Information Risk Management, Information Security Program Development and Management, and Information Security Incident Management.`,
  
  'ISO 27001': `You are an expert ISO 27001 auditor and consultant. Generate realistic questions about ISO/IEC 27001 Information Security Management System implementation, controls, risk assessment, and compliance.`,
  
  'GDPR': `You are an expert Data Protection Officer (DPO) and GDPR consultant. Generate realistic questions about GDPR compliance, data subject rights, lawful basis for processing, DPIAs, cross-border transfers, and accountability principles.`,
  
  'NIS2': `You are an expert on the NIS2 Directive (EU Directive on Network and Information Security). Generate realistic questions about cybersecurity risk management, reporting obligations, supply chain security, and governance requirements for essential and important entities.`,
  
  'DORA': `You are an expert on DORA (Digital Operational Resilience Act). Generate realistic questions about ICT risk management, incident reporting, digital operational resilience testing, third-party risk management, and information sharing for financial entities.`,
  
  'OSCP': `You are an expert penetration tester and OSCP instructor. Generate realistic questions about ethical hacking, penetration testing methodologies, exploit development, privilege escalation, and practical offensive security techniques.`,
  
  'CEH': `You are an expert Certified Ethical Hacker instructor. Generate realistic CEH exam questions covering reconnaissance, scanning, enumeration, system hacking, malware threats, sniffing, social engineering, and web application hacking.`,
  
  'Open Innovation': `You are an expert in Open Innovation strategies and business model innovation. Generate realistic questions about open innovation frameworks, collaborative innovation, intellectual property strategies, innovation ecosystems, and corporate-startup partnerships.`,
  
  'Bilancio': `You are an expert in Italian corporate finance and management accounting (Bilancio e Controllo di Gestione). Generate realistic questions about financial statements analysis, budgeting, cost accounting, KPIs, and management control systems.`,
  
  'Insight Discovery': `You are an expert in Insight Discovery personality assessment and team dynamics. Generate realistic personality assessment questions based on the 4-color model (Red/Fire, Yellow/Sunshine, Green/Earth, Blue/Cool Blue) covering behavioral preferences, communication styles, and working styles.`,
};

export async function generateQuestions(
  quizTitle: string,
  category: string,
  count: number,
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert' = 'intermediate',
  documentContext?: string
): Promise<GeneratedQuestion[]> {
  
  const systemPrompt = certificationPrompts[category] || certificationPrompts['CISSP'];
  
  const domainInstructions = category === 'CISSP' 
    ? '\n- For CISSP questions, include a "domain" field with one of the 8 CISSP domains: "Security and Risk Management", "Asset Security", "Security Architecture and Engineering", "Communication and Network Security", "Identity and Access Management", "Security Assessment and Testing", "Security Operations", or "Software Development Security"'
    : '\n- Include a "domain" field with the main topic or area covered by the question';

  const documentContextSection = documentContext 
    ? `\n\n⚠️ CRITICAL INSTRUCTION: You MUST create questions EXCLUSIVELY from the following document content. DO NOT use general knowledge or external information. Every question, answer option, and explanation must be directly traceable to the text below:\n\n===== DOCUMENT CONTENT START =====\n${documentContext.substring(0, 30000)}\n===== DOCUMENT CONTENT END =====\n\n` 
    : '';

  const questionSourceInstruction = documentContext
    ? '- ALL questions MUST be based ONLY on the document content provided above\n- DO NOT include general knowledge questions\n- Every answer must be verifiable in the provided document text\n- Reference specific sections, concepts, or procedures from the document'
    : '- Questions should be realistic and exam-like\n- Cover different subtopics within the domain';

  const userPrompt = `Generate ${count} multiple-choice questions for ${quizTitle}.${documentContextSection}

Requirements:
- Difficulty level: ${difficulty}
- Each question must have exactly 4 options (A, B, C, D)
- Only ONE option should be correct
- Include a detailed explanation for the correct answer
${questionSourceInstruction}
- Avoid duplicate questions${domainInstructions}

Return ONLY a valid JSON array with this exact structure:
[
  {
    "question": "The question text here?",
    "options": [
      {"text": "Option A text", "isCorrect": false},
      {"text": "Option B text", "isCorrect": true},
      {"text": "Option C text", "isCorrect": false},
      {"text": "Option D text", "isCorrect": false}
    ],
    "explanation": "Detailed explanation of why the correct answer is correct and why others are wrong.",
    "difficulty": "${difficulty}",
    "domain": "Security and Risk Management"
  }
]`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Using gpt-4o as it's more reliable for structured output
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      max_tokens: Math.min(count * 800, 16000), // Cap at 16000 (GPT-4o limit is 16384)
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }
    let parsed = JSON.parse(content);
    
    // Handle both array and object with questions array
    const questions = Array.isArray(parsed) ? parsed : parsed.questions || [];
    
    return questions.slice(0, count);
  } catch (error) {
    console.error('Error generating questions:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to generate questions: ${message}`);
  }
}

export async function generateQuestionsInBatches(
  quizTitle: string,
  category: string,
  totalCount: number,
  batchSize: number = 20,
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert' = 'intermediate',
  documentContext?: string
): Promise<GeneratedQuestion[]> {
  const allQuestions: GeneratedQuestion[] = [];
  const batches = Math.ceil(totalCount / batchSize);
  
  for (let i = 0; i < batches; i++) {
    const count = Math.min(batchSize, totalCount - allQuestions.length);
    console.log(`Generating batch ${i + 1}/${batches} (${count} questions)...`);
    
    const batchQuestions = await generateQuestions(quizTitle, category, count, difficulty, documentContext);
    allQuestions.push(...batchQuestions);
    
    // Small delay between batches to avoid rate limiting
    if (i < batches - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return allQuestions.slice(0, totalCount);
}
