import { generateTriageResponse } from "./gemini";
import { saveTrainingData } from "./mlDataCollector";

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

// Genera prompt di conversazione completo
function generateConversationPrompt(
  symptom: string,
  age: number,
  gender: string,
  weight: number,
  height: number
): string {
  return `Paziente con i seguenti dati:
- Età: ${age} anni
- Sesso: ${gender === "M" ? "Maschile" : "Femminile"}
- Peso: ${weight} kg
- Altezza: ${height} cm

Sintomo principale: ${symptom}

Fornisci un triage medico completo con:
1. Valutazione urgenza (EMERGENCY, HIGH, MEDIUM, LOW)
2. Possibili diagnosi differenziali
3. Esami consigliati
4. Consigli immediati per il paziente
5. Quando rivolgersi al medico`;
}

/**
 * Genera una singola conversazione sintetica
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
    
    // Seleziona sintomo casuale
    const { category, symptom } = getRandomSymptom();
    
    // Genera prompt completo
    const conversationPrompt = generateConversationPrompt(symptom, age, gender, weight, height);
    
    // Chiama Gemini per generare risposta realistica
    const startTime = Date.now();
    const aiResponse = await generateTriageResponse(conversationPrompt, []);
    const responseTime = Date.now() - startTime;
    
    // Stima token usati (approssimativa)
    const estimatedTokens = Math.round((conversationPrompt.length + JSON.stringify(aiResponse).length) / 4);
    
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
      },
      outputRaw: JSON.stringify(aiResponse),
      userAge: age,
      userGender: gender,
      responseTimeMs: responseTime,
      tokensUsed: estimatedTokens,
    });
    
    console.log(`[Synthetic Generator] ✅ Generata conversazione: ${category} (${age}${gender}, ${responseTime}ms)`);
    
    return { success: true, category };
  } catch (error: any) {
    console.error('[Synthetic Generator] ❌ Errore generazione:', error.message);
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
      
      // Genera conversazione
      try {
        const conversationPrompt = generateConversationPrompt(symptom, age, gender, weight, height);
        
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
