import { generateTriageResponse } from "./gemini";
import { saveTrainingData } from "./mlDataCollector";
import { 
  generateRandomMedicalReport, 
  generateCBCReport,
  generateLipidPanelReport,
  generateLiverFunctionReport,
  generateKidneyFunctionReport,
  generateGlucoseReport,
  type MedicalReport 
} from "./medicalReportGenerator";

/**
 * Generatore Dati Sintetici per ML Training
 * Crea conversazioni mediche realistiche per addestrare modelli proprietari
 */

// Categorie di sintomi con variazioni
const SYMPTOM_CATEGORIES = {
  testa: [
    "male alla testa forte da 3 giorni",
    "emicrania pulsante sul lato sinistro",
    "cefalea tensiva con rigidità del collo",
    "mal di testa dopo trauma cranico",
    "dolore frontale con congestione nasale",
    "vertigini e nausea con mal di testa",
    "emicrania con aura visiva",
    "dolore dietro gli occhi",
  ],
  addome: [
    "dolore addominale acuto al fianco destro",
    "crampi addominali con diarrea",
    "bruciore di stomaco persistente",
    "dolore epigastrico dopo i pasti",
    "gonfiore addominale e flatulenza",
    "dolore al basso ventre sinistro",
    "nausea e vomito da 2 giorni",
  ],
  torace: [
    "dolore toracico retrosternale",
    "oppressione al petto con affanno",
    "dolore acuto durante la respirazione",
    "palpitazioni e tachicardia",
    "tosse secca persistente con dolore",
    "difficoltà respiratorie notturne",
  ],
  arti: [
    "dolore al ginocchio destro dopo caduta",
    "gonfiore alla caviglia sinistra",
    "dolore lombare cronico",
    "intorpidimento alle mani durante la notte",
    "crampi muscolari ai polpacci",
    "dolore alla spalla con limitazione movimento",
  ],
  generale: [
    "febbre alta da 38.5°C da 2 giorni",
    "stanchezza cronica e debolezza",
    "perdita di peso non intenzionale",
    "sudorazioni notturne",
    "vertigini e svenimenti",
    "mal di gola e tosse",
  ],
};

// Dati anagrafici realistici
const GENDERS = ["M", "F"];
const AGE_RANGES = [
  { min: 18, max: 30, weight: 2 }, // giovani adulti
  { min: 31, max: 50, weight: 3 }, // adulti
  { min: 51, max: 70, weight: 3 }, // età matura
  { min: 71, max: 85, weight: 2 }, // anziani
];

// Abitudini di vita
const SMOKING_STATUS = ["Non fumatore", "Fumatore (10 sig/giorno)", "Fumatore (20 sig/giorno)", "Ex fumatore"];
const ALCOHOL_STATUS = ["Nessun consumo", "Occasionale (1-2 unità/settimana)", "Moderato (5-10 unità/settimana)", "Elevato (>10 unità/settimana)"];
const PHYSICAL_ACTIVITY = ["Sedentario", "Attività leggera (1-2 volte/settimana)", "Attività moderata (3-4 volte/settimana)", "Attività intensa (5+ volte/settimana)"];

// Comorbidità comuni (variano con età)
const COMORBIDITIES = [
  "Ipertensione arteriosa",
  "Diabete tipo 2",
  "Ipercolesterolemia",
  "Obesità",
  "Asma",
  "BPCO",
  "Depressione",
  "Ansia",
  "Gastrite cronica",
  "Artrosi",
];

// Farmaci comuni
const COMMON_MEDICATIONS = [
  "Ramipril 5mg (antiipertensivo)",
  "Metformina 1000mg (antidiabetico)",
  "Atorvastatina 20mg (statina)",
  "Omeprazolo 20mg (gastroprotettore)",
  "Aspirina 100mg (antiaggregante)",
  "Levotiroxina 50mcg (tiroide)",
  "Salbutamolo spray (broncodilatatore)",
];

// Genera età con distribuzione pesata
function generateAge(): number {
  const totalWeight = AGE_RANGES.reduce((sum, r) => sum + r.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const range of AGE_RANGES) {
    random -= range.weight;
    if (random <= 0) {
      return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    }
  }
  return 45; // fallback
}

// Genera peso realistico basato su età e sesso
function generateWeight(age: number, gender: string): number {
  const baseWeight = gender === "M" ? 75 : 62;
  const ageAdjustment = age > 50 ? Math.random() * 10 - 5 : 0;
  const variation = Math.random() * 20 - 10;
  return Math.round(baseWeight + ageAdjustment + variation);
}

// Genera altezza realistica basata su sesso
function generateHeight(gender: string): number {
  const baseHeight = gender === "M" ? 175 : 165;
  const variation = Math.random() * 20 - 10;
  return Math.round(baseHeight + variation);
}

// Genera valori clinici realistici basati su età
function generateClinicalValues(age: number): {
  cholesterol: number;
  ldl: number;
  hdl: number;
  triglycerides: number;
  bloodPressure: string;
  glucose: number;
  bmi: number;
} {
  // Colesterolo totale (normale <200, borderline 200-239, alto >240)
  const baseCholesterol = age > 50 ? 210 : 180;
  const cholesterol = Math.round(baseCholesterol + (Math.random() * 60 - 20));
  
  // LDL (cattivo) - normale <100, ottimale <130
  const ldl = Math.round(cholesterol * 0.6 + (Math.random() * 30 - 15));
  
  // HDL (buono) - desiderabile >40 uomini, >50 donne
  const hdl = Math.round(45 + (Math.random() * 20));
  
  // Trigliceridi - normale <150
  const triglycerides = Math.round(100 + (Math.random() * 100));
  
  // Pressione arteriosa (sistolica/diastolica)
  const systolic = age > 60 ? Math.round(130 + Math.random() * 30) : Math.round(115 + Math.random() * 25);
  const diastolic = age > 60 ? Math.round(75 + Math.random() * 20) : Math.round(70 + Math.random() * 15);
  const bloodPressure = `${systolic}/${diastolic} mmHg`;
  
  // Glicemia a digiuno (normale 70-100, pre-diabete 100-125, diabete >126)
  const baseGlucose = age > 50 ? 95 : 85;
  const glucose = Math.round(baseGlucose + (Math.random() * 40 - 10));
  
  // BMI viene calcolato dopo in base a peso e altezza
  const bmi = 0; // placeholder
  
  return { cholesterol, ldl, hdl, triglycerides, bloodPressure, glucose, bmi };
}

// Genera abitudini di vita realistiche
function generateLifestyleHabits(age: number): {
  smoking: string;
  alcohol: string;
  physicalActivity: string;
} {
  // Giovani fumano meno, anziani sono più spesso ex-fumatori
  const smokingIndex = age < 35 ? 0 : age > 60 ? 3 : Math.floor(Math.random() * 4);
  const smoking = SMOKING_STATUS[smokingIndex];
  
  const alcohol = ALCOHOL_STATUS[Math.floor(Math.random() * ALCOHOL_STATUS.length)];
  const physicalActivity = PHYSICAL_ACTIVITY[Math.floor(Math.random() * PHYSICAL_ACTIVITY.length)];
  
  return { smoking, alcohol, physicalActivity };
}

// Genera comorbidità basate su età (anziani hanno più patologie)
function generateComorbidities(age: number): string[] {
  const count = age < 40 ? 0 : age < 60 ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * 3) + 1;
  const selected: string[] = [];
  
  const shuffled = [...COMORBIDITIES].sort(() => Math.random() - 0.5);
  for (let i = 0; i < count && i < shuffled.length; i++) {
    selected.push(shuffled[i]);
  }
  
  return selected;
}

// Genera farmaci in uso (correla con comorbidità ed età)
function generateMedications(age: number, comorbidities: string[]): string[] {
  if (age < 40 || comorbidities.length === 0) return [];
  
  const count = Math.min(comorbidities.length, Math.floor(Math.random() * 3) + 1);
  const selected: string[] = [];
  
  const shuffled = [...COMMON_MEDICATIONS].sort(() => Math.random() - 0.5);
  for (let i = 0; i < count && i < shuffled.length; i++) {
    selected.push(shuffled[i]);
  }
  
  return selected;
}

// Seleziona sintomo casuale da tutte le categorie
function getRandomSymptom(): { category: string; symptom: string } {
  const categories = Object.keys(SYMPTOM_CATEGORIES);
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  const symptoms = SYMPTOM_CATEGORIES[randomCategory as keyof typeof SYMPTOM_CATEGORIES];
  const randomSymptom = symptoms[Math.floor(Math.random() * symptoms.length)];
  
  return {
    category: randomCategory,
    symptom: randomSymptom,
  };
}

// Genera prompt di conversazione completo con dati clinici completi
function generateConversationPrompt(
  symptom: string,
  age: number,
  gender: string,
  weight: number,
  height: number,
  clinicalValues: ReturnType<typeof generateClinicalValues>,
  lifestyle: ReturnType<typeof generateLifestyleHabits>,
  comorbidities: string[],
  medications: string[]
): string {
  const bmi = (weight / ((height / 100) ** 2)).toFixed(1);
  
  let prompt = `Paziente con i seguenti dati:

DATI ANAGRAFICI:
- Età: ${age} anni
- Sesso: ${gender === "M" ? "Maschile" : "Femminile"}
- Peso: ${weight} kg
- Altezza: ${height} cm
- BMI: ${bmi}

VALORI CLINICI:
- Colesterolo totale: ${clinicalValues.cholesterol} mg/dL
- Colesterolo LDL: ${clinicalValues.ldl} mg/dL
- Colesterolo HDL: ${clinicalValues.hdl} mg/dL
- Trigliceridi: ${clinicalValues.triglycerides} mg/dL
- Pressione arteriosa: ${clinicalValues.bloodPressure}
- Glicemia a digiuno: ${clinicalValues.glucose} mg/dL

ABITUDINI DI VITA:
- Fumo: ${lifestyle.smoking}
- Alcol: ${lifestyle.alcohol}
- Attività fisica: ${lifestyle.physicalActivity}`;

  if (comorbidities.length > 0) {
    prompt += `\n\nPATOLOGIE PREGRESSE:\n- ${comorbidities.join('\n- ')}`;
  }

  if (medications.length > 0) {
    prompt += `\n\nFARMACI IN USO:\n- ${medications.join('\n- ')}`;
  }

  prompt += `\n\nSINTOMO PRINCIPALE: ${symptom}

Fornisci un triage medico completo considerando tutti i fattori di rischio e la storia clinica del paziente:
1. Valutazione urgenza (EMERGENCY, HIGH, MEDIUM, LOW)
2. Possibili diagnosi differenziali tenendo conto dei valori clinici e comorbidità
3. Esami consigliati specifici per questo caso
4. Consigli immediati personalizzati per il paziente
5. Quando rivolgersi al medico
6. Considerazioni sui fattori di rischio cardiovascolare e metabolico`;

  return prompt;
}

// Follow-up domande realistiche che un paziente potrebbe fare
const PATIENT_FOLLOWUP_QUESTIONS = [
  "Devo preoccuparmi?",
  "È grave secondo lei?",
  "Quali esami dovrei fare?",
  "Posso prendere qualche farmaco per stare meglio?",
  "Devo andare subito in ospedale?",
  "Può essere qualcosa di serio?",
  "Cosa posso fare per migliorare?",
  "Sono a rischio di complicazioni?",
  "Quanto tempo ci vorrà per guarire?",
  "Ci sono cose da evitare?",
  "Devo cambiare la mia alimentazione?",
  "Posso continuare a fare sport?",
  "È contagioso?",
  "I miei familiari sono a rischio?",
];

// Domande specifiche per referti medici con valori anomali
const MEDICAL_REPORT_QUESTIONS = [
  "Ho visto che alcuni valori hanno l'asterisco, cosa significa?",
  "Quanto sono preoccupanti i valori fuori range?",
  "Cosa posso fare per normalizzare questi valori?",
  "Devo ripetere le analisi?",
  "Quali sono le cause di questi valori alterati?",
  "Serve una visita specialistica?",
  "Posso migliorare con la dieta?",
  "Sono necessari farmaci?",
  "C'è rischio di complicazioni?",
  "Quando dovrei rifare gli esami?",
];

/**
 * Genera una singola conversazione sintetica con follow-up realistici
 */
async function generateSyntheticConversation(): Promise<{
  success: boolean;
  category?: string;
  error?: string;
}> {
  try {
    // Genera dati demografici
    const age = generateAge();
    const gender = GENDERS[Math.floor(Math.random() * GENDERS.length)];
    const weight = generateWeight(age, gender);
    const height = generateHeight(gender);
    
    // Genera valori clinici e abitudini
    const clinicalValues = generateClinicalValues(age);
    const lifestyle = generateLifestyleHabits(age);
    const comorbidities = generateComorbidities(age);
    const medications = generateMedications(age, comorbidities);
    
    // Seleziona sintomo casuale
    const { category, symptom } = getRandomSymptom();
    
    // Genera prompt completo con tutti i dati
    const conversationPrompt = generateConversationPrompt(
      symptom, age, gender, weight, height,
      clinicalValues, lifestyle, comorbidities, medications
    );
    
    // Chiama Gemini per generare risposta realistica iniziale
    const startTime = Date.now();
    const aiResponse = await generateTriageResponse(conversationPrompt, []);
    
    // Costruisci conversazione con 1-2 follow-up realistici
    const conversationHistory: Array<{ role: string; content: string }> = [
      { role: 'user', content: symptom },
      { role: 'assistant', content: aiResponse.message },
    ];

    // 70% di probabilità di avere 1-2 follow-up
    const shouldHaveFollowup = Math.random() > 0.3;
    const followupCount = shouldHaveFollowup ? (Math.random() > 0.5 ? 2 : 1) : 0;

    for (let i = 0; i < followupCount; i++) {
      // Seleziona domanda follow-up casuale
      const followupQuestion = PATIENT_FOLLOWUP_QUESTIONS[
        Math.floor(Math.random() * PATIENT_FOLLOWUP_QUESTIONS.length)
      ];
      
      // Genera risposta AI al follow-up (passa la history completa senza la nuova domanda)
      const followupResponse = await generateTriageResponse(
        followupQuestion,
        conversationHistory // Pass full history including previous exchanges
      );
      
      // Aggiungi domanda e risposta alla history
      conversationHistory.push({ role: 'user', content: followupQuestion });
      conversationHistory.push({ role: 'assistant', content: followupResponse.message });
    }

    const responseTime = Date.now() - startTime;
    
    // Calcola token totali della conversazione completa
    const totalContent = conversationHistory.map(m => m.content).join(' ');
    const estimatedTokens = Math.round(totalContent.length / 4);
    
    // Build full conversation transcript
    const conversationTranscript = conversationHistory
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');
    
    // Salva nel sistema ML
    await saveTrainingData({
      requestType: 'medical_triage',
      modelUsed: 'gemini-2.5-pro',
      inputPrompt: conversationPrompt,
      inputText: symptom,
      outputJson: {
        ...aiResponse,
        _synthetic: true,
        _category: category,
        _demographics: { age, gender, weight, height },
        _clinicalValues: clinicalValues,
        _lifestyle: lifestyle,
        _comorbidities: comorbidities,
        _medications: medications,
        _conversationTurns: conversationHistory.length,
        _fullConversation: conversationHistory,
      },
      outputRaw: conversationTranscript,
      userAge: age,
      userGender: gender,
      responseTimeMs: responseTime,
      tokensUsed: estimatedTokens,
    });
    
    console.log(`[Synthetic Generator] ✅ Generata conversazione: ${category} (${age}${gender}, ${conversationHistory.length} messaggi, ${responseTime}ms)`);
    
    return { success: true, category };
  } catch (error: any) {
    console.error('[Synthetic Generator] ❌ Errore generazione:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Genera conversazione basata su referto medico con valori anomali
 */
async function generateMedicalReportConversation(): Promise<{
  success: boolean;
  reportType?: string;
  error?: string;
}> {
  try {
    // Genera dati demografici
    const age = generateAge();
    const gender = GENDERS[Math.floor(Math.random() * GENDERS.length)] as 'M' | 'F';
    
    // Genera referto medico casuale
    const report = generateRandomMedicalReport(gender, age);
    
    // Costruisci messaggio iniziale del paziente con il referto
    const initialMessage = `Ho ritirato le analisi del sangue. Ecco i risultati:\n\n${report.formattedReport}\n\nCosa ne pensa? Ci sono valori preoccupanti?`;
    
    // Chiama AI per interpretare il referto
    const startTime = Date.now();
    const aiResponse = await generateTriageResponse(initialMessage, []);
    
    // Costruisci conversazione
    const conversationHistory: Array<{ role: string; content: string }> = [
      { role: 'user', content: initialMessage },
      { role: 'assistant', content: aiResponse.message },
    ];
    
    // Se ci sono valori anomali, simula domande di approfondimento
    const abnormalValues = report.values.filter(v => v.isAbnormal);
    if (abnormalValues.length > 0) {
      // 80% di probabilità di 1-2 domande di approfondimento
      const shouldAskMore = Math.random() > 0.2;
      const questionCount = shouldAskMore ? (Math.random() > 0.5 ? 2 : 1) : 0;
      
      for (let i = 0; i < questionCount; i++) {
        const question = MEDICAL_REPORT_QUESTIONS[
          Math.floor(Math.random() * MEDICAL_REPORT_QUESTIONS.length)
        ];
        
        const followupResponse = await generateTriageResponse(
          question,
          conversationHistory
        );
        
        conversationHistory.push({ role: 'user', content: question });
        conversationHistory.push({ role: 'assistant', content: followupResponse.message });
      }
    }
    
    const responseTime = Date.now() - startTime;
    
    // Calcola token totali
    const totalContent = conversationHistory.map(m => m.content).join(' ');
    const estimatedTokens = Math.round(totalContent.length / 4);
    
    // Build conversation transcript
    const conversationTranscript = conversationHistory
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');
    
    // Salva nel sistema ML
    await saveTrainingData({
      requestType: 'medical_report_analysis',
      modelUsed: 'gemini-2.5-pro',
      inputPrompt: initialMessage,
      inputText: `Analisi referto: ${report.title}`,
      outputJson: {
        ...aiResponse,
        _synthetic: true,
        _reportType: report.type,
        _reportTitle: report.title,
        _demographics: { age, gender },
        _abnormalValuesCount: abnormalValues.length,
        _abnormalValues: abnormalValues.map(v => ({
          name: v.name,
          value: v.value,
          severity: v.severity,
        })),
        _conversationTurns: conversationHistory.length,
        _fullConversation: conversationHistory,
        _medicalReport: report,
      },
      outputRaw: conversationTranscript,
      userAge: age,
      userGender: gender,
      responseTimeMs: responseTime,
      tokensUsed: estimatedTokens,
    });
    
    console.log(`[Synthetic Generator] ✅ Generata conversazione referto: ${report.type} (${age}${gender}, ${abnormalValues.length} anomalie, ${conversationHistory.length} messaggi)`);
    
    return { success: true, reportType: report.type };
  } catch (error: any) {
    console.error('[Synthetic Generator] ❌ Errore generazione referto:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Genera batch di conversazioni sintetiche
 * @param count Numero di conversazioni da generare
 * @param delayMs Ritardo tra le generazioni (per evitare rate limit)
 */
export async function generateSyntheticDataBatch(
  count: number = 10,
  delayMs: number = 2000
): Promise<{
  total: number;
  successful: number;
  failed: number;
  byCategory: Record<string, number>;
}> {
  console.log(`[Synthetic Generator] 🚀 Inizio generazione di ${count} conversazioni sintetiche...`);
  
  const results = {
    total: count,
    successful: 0,
    failed: 0,
    byCategory: {} as Record<string, number>,
  };
  
  for (let i = 0; i < count; i++) {
    console.log(`[Synthetic Generator] Progresso: ${i + 1}/${count}`);
    
    const result = await generateSyntheticConversation();
    
    if (result.success && result.category) {
      results.successful++;
      results.byCategory[result.category] = (results.byCategory[result.category] || 0) + 1;
    } else {
      results.failed++;
    }
    
    // Ritardo per evitare rate limit di Gemini
    if (i < count - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  console.log(`[Synthetic Generator] ✅ Completato: ${results.successful} successi, ${results.failed} fallimenti`);
  console.log(`[Synthetic Generator] 📊 Per categoria:`, results.byCategory);
  
  return results;
}

/**
 * Genera dataset bilanciato (ugual numero per categoria)
 */
export async function generateBalancedDataset(
  perCategory: number = 5,
  delayMs: number = 2000
): Promise<{
  total: number;
  successful: number;
  failed: number;
  byCategory: Record<string, number>;
}> {
  const categories = Object.keys(SYMPTOM_CATEGORIES);
  const totalCount = categories.length * perCategory;
  
  console.log(`[Synthetic Generator] 🎯 Generazione dataset bilanciato: ${perCategory} casi per categoria (totale: ${totalCount})`);
  
  const results = {
    total: totalCount,
    successful: 0,
    failed: 0,
    byCategory: {} as Record<string, number>,
  };
  
  // Genera perCategory casi per ogni categoria
  for (const category of categories) {
    console.log(`[Synthetic Generator] Categoria: ${category} (${perCategory} casi)`);
    
    for (let i = 0; i < perCategory; i++) {
      const symptoms = SYMPTOM_CATEGORIES[category as keyof typeof SYMPTOM_CATEGORIES];
      const symptom = symptoms[i % symptoms.length];
      
      // Genera dati demografici
      const age = generateAge();
      const gender = GENDERS[Math.floor(Math.random() * GENDERS.length)];
      const weight = generateWeight(age, gender);
      const height = generateHeight(gender);
      
      // Genera valori clinici e abitudini
      const clinicalValues = generateClinicalValues(age);
      const lifestyle = generateLifestyleHabits(age);
      const comorbidities = generateComorbidities(age);
      const medications = generateMedications(age, comorbidities);
      
      // Genera conversazione
      try {
        const conversationPrompt = generateConversationPrompt(
          symptom, age, gender, weight, height,
          clinicalValues, lifestyle, comorbidities, medications
        );
        
        const startTime = Date.now();
        const aiResponse = await generateTriageResponse(conversationPrompt, []);
        const responseTime = Date.now() - startTime;
        
        const estimatedTokens = Math.round((conversationPrompt.length + JSON.stringify(aiResponse).length) / 4);
        
        await saveTrainingData({
          requestType: 'medical_triage',
          modelUsed: 'gemini-2.5-pro',
          inputPrompt: conversationPrompt,
          inputText: symptom,
          outputJson: {
            ...aiResponse,
            _synthetic: true,
            _category: category,
            _demographics: { age, gender, weight, height },
            _clinicalValues: clinicalValues,
            _lifestyle: lifestyle,
            _comorbidities: comorbidities,
            _medications: medications,
          },
          outputRaw: JSON.stringify(aiResponse),
          userAge: age,
          userGender: gender,
          responseTimeMs: responseTime,
          tokensUsed: estimatedTokens,
        });
        
        results.successful++;
        results.byCategory[category] = (results.byCategory[category] || 0) + 1;
        
        console.log(`[Synthetic Generator] ✅ ${category} ${i + 1}/${perCategory} (${age}${gender})`);
      } catch (error: any) {
        console.error(`[Synthetic Generator] ❌ Errore ${category}:`, error.message);
        results.failed++;
      }
      
      // Ritardo per rate limit
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  console.log(`[Synthetic Generator] ✅ Dataset bilanciato completato`);
  console.log(`[Synthetic Generator] 📊 Risultati:`, results);
  
  return results;
}

/**
 * Genera batch di conversazioni basate su referti medici
 * @param count Numero di referti da generare
 * @param delayMs Ritardo tra le generazioni
 */
export async function generateMedicalReportsBatch(
  count: number = 10,
  delayMs: number = 2000
): Promise<{
  total: number;
  successful: number;
  failed: number;
  byReportType: Record<string, number>;
}> {
  console.log(`[Synthetic Generator] 🩺 Inizio generazione di ${count} conversazioni su referti medici...`);
  
  const results = {
    total: count,
    successful: 0,
    failed: 0,
    byReportType: {} as Record<string, number>,
  };
  
  for (let i = 0; i < count; i++) {
    console.log(`[Synthetic Generator] Progresso: ${i + 1}/${count}`);
    
    const result = await generateMedicalReportConversation();
    
    if (result.success && result.reportType) {
      results.successful++;
      results.byReportType[result.reportType] = (results.byReportType[result.reportType] || 0) + 1;
    } else {
      results.failed++;
    }
    
    // Ritardo per evitare rate limit
    if (i < count - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  console.log(`[Synthetic Generator] ✅ Completato: ${results.successful} successi, ${results.failed} fallimenti`);
  console.log(`[Synthetic Generator] 📊 Per tipo di referto:`, results.byReportType);
  
  return results;
}

/**
 * Genera dataset misto: sintomi + referti medici
 * @param symptomsCount Numero di conversazioni su sintomi
 * @param reportsCount Numero di conversazioni su referti
 * @param delayMs Ritardo tra le generazioni
 */
export async function generateMixedDataset(
  symptomsCount: number = 10,
  reportsCount: number = 10,
  delayMs: number = 2000
): Promise<{
  total: number;
  successful: number;
  failed: number;
  symptoms: number;
  reports: number;
}> {
  console.log(`[Synthetic Generator] 🎯 Generazione dataset misto: ${symptomsCount} sintomi + ${reportsCount} referti`);
  
  const results = {
    total: symptomsCount + reportsCount,
    successful: 0,
    failed: 0,
    symptoms: 0,
    reports: 0,
  };
  
  // Alterna tra sintomi e referti per varietà
  const tasks: Array<'symptom' | 'report'> = [];
  for (let i = 0; i < symptomsCount; i++) tasks.push('symptom');
  for (let i = 0; i < reportsCount; i++) tasks.push('report');
  
  // Shuffle
  tasks.sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    console.log(`[Synthetic Generator] Progresso: ${i + 1}/${tasks.length} (${task})`);
    
    let result;
    if (task === 'symptom') {
      result = await generateSyntheticConversation();
      if (result.success) results.symptoms++;
    } else {
      result = await generateMedicalReportConversation();
      if (result.success) results.reports++;
    }
    
    if (result.success) {
      results.successful++;
    } else {
      results.failed++;
    }
    
    // Ritardo
    if (i < tasks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  console.log(`[Synthetic Generator] ✅ Dataset misto completato`);
  console.log(`[Synthetic Generator] 📊 Risultati:`, {
    totale: results.total,
    successi: results.successful,
    fallimenti: results.failed,
    sintomi: results.symptoms,
    referti: results.reports,
  });
  
  return results;
}
