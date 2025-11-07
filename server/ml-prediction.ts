import { generateGeminiContent } from './gemini';
import type { InsertHealthRiskPrediction } from '@shared/schema';

export interface PredictionAnalysisInput {
  userId: number;
  userProfile: {
    age?: number;
    gender?: string;
    heightCm?: number;
    weightKg?: number;
    smokingStatus?: string;
    physicalActivity?: string;
    chronicConditions?: string[];
    currentMedications?: string[];
  };
  medicalDocuments: Array<{
    id: string;
    type: string;
    content: string;
    summary?: string;
    date: Date;
  }>;
  triageHistory: Array<{
    urgencyLevel: string;
    content: string;
    date: Date;
  }>;
  preventionIndex?: number;
}

export interface RiskPredictionResult {
  riskType: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  predictedTimeframe: string;
  contributingFactors: string[];
  recommendations: string[];
  basedOnDocuments: string[];
  aiAnalysis: string;
  confidenceLevel: 'high' | 'medium' | 'low';
}

/**
 * Calculates BMI from height and weight
 */
function calculateBMI(heightCm?: number, weightKg?: number): number | null {
  if (!heightCm || !weightKg || heightCm === 0) return null;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

/**
 * Determines risk category from score
 */
function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * Generates health risk predictions using AI analysis
 */
export async function generateHealthRiskPredictions(
  input: PredictionAnalysisInput
): Promise<RiskPredictionResult[]> {
  const { userProfile, medicalDocuments, triageHistory, preventionIndex } = input;

  // Calculate BMI
  const bmi = calculateBMI(userProfile.heightCm, userProfile.weightKg);

  // Build comprehensive medical context for AI
  const medicalContext = `
## Patient Profile
- Age: ${userProfile.age || 'Unknown'}
- Gender: ${userProfile.gender || 'Unknown'}
- BMI: ${bmi ? `${bmi} (${getBMICategory(bmi)})` : 'Unknown'}
- Smoking Status: ${userProfile.smokingStatus || 'Unknown'}
- Physical Activity: ${userProfile.physicalActivity || 'Unknown'}
- Chronic Conditions: ${userProfile.chronicConditions?.join(', ') || 'None reported'}
- Current Medications: ${userProfile.currentMedications?.join(', ') || 'None reported'}
- Prevention Index: ${preventionIndex || 'Not calculated'}

## Medical Documents Summary (Last ${medicalDocuments.length})
${medicalDocuments.map((doc, idx) => `
${idx + 1}. ${doc.type} (${doc.date.toLocaleDateString('it-IT')})
   Summary: ${doc.summary || 'No summary available'}
`).join('\n')}

## Recent Triage History (Last ${triageHistory.length} consultations)
${triageHistory.map((triage, idx) => `
${idx + 1}. Urgency: ${triage.urgencyLevel} (${triage.date.toLocaleDateString('it-IT')})
   Concern: ${triage.content.substring(0, 200)}...
`).join('\n')}
`;

  const prompt = `Sei un medico esperto in medicina preventiva e analisi predittiva dei rischi sanitari.

${medicalContext}

**COMPITO**: Analizza i dati del paziente e identifica i principali rischi sanitari futuri con predizioni basate su evidenze scientifiche.

**ISTRUZIONI**:
1. Identifica da 3 a 5 rischi sanitari più rilevanti per questo paziente
2. Per ogni rischio, fornisci:
   - Tipo di rischio (es. diabete tipo 2, malattie cardiovascolari, ipertensione, obesità, osteoporosi)
   - Score di probabilità (0-100)
   - Timeframe predetto (next_year, 1-3_years, 3-5_years, 5+_years)
   - Fattori contribuenti specifici
   - Raccomandazioni preventive concrete e personalizzate
   - Livello di confidenza (high, medium, low)
   - Analisi dettagliata

**FORMATO RISPOSTA** (JSON array):
\`\`\`json
[
  {
    "riskType": "diabete tipo 2",
    "riskScore": 65,
    "predictedTimeframe": "1-3_years",
    "contributingFactors": [
      "BMI elevato (29.2 - sovrappeso)",
      "Stile di vita sedentario dichiarato",
      "Storia familiare di diabete (se presente nei documenti)"
    ],
    "recommendations": [
      "Controllo glicemia a digiuno ogni 6 mesi",
      "Aumentare attività fisica a 150 min/settimana",
      "Riduzione graduale peso (-5-7% raccomandato)",
      "Dieta mediterranea con riduzione carboidrati raffinati"
    ],
    "confidenceLevel": "high",
    "aiAnalysis": "Il paziente presenta fattori di rischio significativi per lo sviluppo di diabete tipo 2. Il BMI di 29.2 combinato con uno stile di vita sedentario aumenta significativamente la probabilità. I documenti medici mostrano valori glicemici borderline. Interventi preventivi ora possono ridurre il rischio del 50-60%."
  }
]
\`\`\`

**IMPORTANTE**:
- Sii specifico e basato sui dati forniti
- Non speculare oltre i dati disponibili
- Ordina i rischi per priorità (score più alto prima)
- Fornisci sempre raccomandazioni actionable
- Se dati insufficienti, usa confidenceLevel: "low"`;

  try {
    const response = await generateGeminiContent(prompt, 'gemini-2.0-flash-exp');
    
    // Parse AI response
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/\[([\s\S]*?)\]/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }

    const predictionsData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    
    // Validate and normalize predictions
    const predictions: RiskPredictionResult[] = predictionsData.map((pred: any) => ({
      riskType: pred.riskType,
      riskScore: Math.min(100, Math.max(0, pred.riskScore)),
      riskLevel: getRiskLevel(pred.riskScore),
      predictedTimeframe: pred.predictedTimeframe,
      contributingFactors: pred.contributingFactors || [],
      recommendations: pred.recommendations || [],
      basedOnDocuments: medicalDocuments.map(doc => doc.id),
      aiAnalysis: pred.aiAnalysis,
      confidenceLevel: pred.confidenceLevel || 'medium',
    }));

    return predictions;
  } catch (error: any) {
    console.error('[ML Prediction] Error generating predictions:', error.message);
    throw new Error(`Failed to generate health risk predictions: ${error.message}`);
  }
}

/**
 * Helper to get BMI category
 */
function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Sottopeso';
  if (bmi < 25) return 'Normopeso';
  if (bmi < 30) return 'Sovrappeso';
  if (bmi < 35) return 'Obesità I grado';
  if (bmi < 40) return 'Obesità II grado';
  return 'Obesità III grado';
}

/**
 * Converts prediction result to database insert format
 */
export function predictionToInsert(
  userId: number,
  prediction: RiskPredictionResult
): Omit<InsertHealthRiskPrediction, 'id' | 'createdAt' | 'updatedAt'> {
  // Predictions expire after 6 months
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 6);

  return {
    userId: userId.toString(),
    riskType: prediction.riskType,
    riskScore: prediction.riskScore,
    riskLevel: prediction.riskLevel,
    predictedTimeframe: prediction.predictedTimeframe,
    contributingFactors: prediction.contributingFactors,
    recommendations: prediction.recommendations,
    basedOnDocuments: prediction.basedOnDocuments,
    aiAnalysis: prediction.aiAnalysis,
    modelUsed: 'gemini-2.0-flash-exp',
    confidenceLevel: prediction.confidenceLevel,
    isActive: true,
    expiresAt,
  };
}
