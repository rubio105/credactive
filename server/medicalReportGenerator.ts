/**
 * Generatore Referti Medici Realistici
 * Crea referti di analisi cliniche con valori normali e anomali annotati
 */

export interface MedicalTestValue {
  name: string;
  value: number;
  unit: string;
  referenceRange: string;
  isAbnormal: boolean;
  severity?: 'LOW' | 'HIGH' | 'CRITICAL_LOW' | 'CRITICAL_HIGH';
}

export interface MedicalReport {
  type: string;
  title: string;
  values: MedicalTestValue[];
  summary: string;
  formattedReport: string;
}

// Range di riferimento per emocromo completo
const CBC_RANGES = {
  wbc: { min: 4.0, max: 10.0, unit: '10^3/μL', name: 'Leucociti (WBC)' },
  rbc: { 
    male: { min: 4.5, max: 5.9, unit: '10^6/μL', name: 'Eritrociti (RBC)' },
    female: { min: 4.0, max: 5.2, unit: '10^6/μL', name: 'Eritrociti (RBC)' }
  },
  hemoglobin: {
    male: { min: 13.5, max: 17.5, unit: 'g/dL', name: 'Emoglobina (Hb)' },
    female: { min: 12.0, max: 16.0, unit: 'g/dL', name: 'Emoglobina (Hb)' }
  },
  hematocrit: {
    male: { min: 41, max: 53, unit: '%', name: 'Ematocrito (Hct)' },
    female: { min: 36, max: 46, unit: '%', name: 'Ematocrito (Hct)' }
  },
  platelets: { min: 150, max: 400, unit: '10^3/μL', name: 'Piastrine (PLT)' },
  mcv: { min: 80, max: 100, unit: 'fL', name: 'Volume Corpuscolare Medio (MCV)' },
  mch: { min: 27, max: 32, unit: 'pg', name: 'Emoglobina Corpuscolare Media (MCH)' },
  mchc: { min: 32, max: 36, unit: 'g/dL', name: 'Concentrazione Emoglobina Corpuscolare Media (MCHC)' },
};

// Range di riferimento per profilo lipidico
const LIPID_RANGES = {
  totalCholesterol: { min: 0, max: 200, unit: 'mg/dL', name: 'Colesterolo Totale', optimal: 'Ottimale: <200' },
  ldl: { min: 0, max: 100, unit: 'mg/dL', name: 'Colesterolo LDL', optimal: 'Ottimale: <100' },
  hdl: { 
    male: { min: 40, max: 80, unit: 'mg/dL', name: 'Colesterolo HDL', optimal: 'Ottimale: >60' },
    female: { min: 50, max: 90, unit: 'mg/dL', name: 'Colesterolo HDL', optimal: 'Ottimale: >60' }
  },
  triglycerides: { min: 0, max: 150, unit: 'mg/dL', name: 'Trigliceridi', optimal: 'Ottimale: <150' },
};

// Range di riferimento per funzionalità epatica
const LIVER_RANGES = {
  alt: { min: 0, max: 40, unit: 'U/L', name: 'ALT (GPT)' },
  ast: { min: 0, max: 40, unit: 'U/L', name: 'AST (GOT)' },
  ggt: { min: 0, max: 55, unit: 'U/L', name: 'Gamma-GT' },
  alkalinePhosphatase: { min: 30, max: 120, unit: 'U/L', name: 'Fosfatasi Alcalina' },
  totalBilirubin: { min: 0.1, max: 1.2, unit: 'mg/dL', name: 'Bilirubina Totale' },
};

// Range di riferimento per funzionalità renale
const KIDNEY_RANGES = {
  creatinine: {
    male: { min: 0.7, max: 1.3, unit: 'mg/dL', name: 'Creatinina' },
    female: { min: 0.6, max: 1.1, unit: 'mg/dL', name: 'Creatinina' }
  },
  urea: { min: 15, max: 50, unit: 'mg/dL', name: 'Azotemia (BUN)' },
  uricAcid: {
    male: { min: 3.5, max: 7.2, unit: 'mg/dL', name: 'Acido Urico' },
    female: { min: 2.6, max: 6.0, unit: 'mg/dL', name: 'Acido Urico' }
  },
};

// Range di riferimento per glicemia e metabolismo
const GLUCOSE_RANGES = {
  fastingGlucose: { min: 70, max: 100, unit: 'mg/dL', name: 'Glicemia a Digiuno', optimal: 'Ottimale: 70-100' },
  hba1c: { min: 0, max: 5.6, unit: '%', name: 'Emoglobina Glicata (HbA1c)', optimal: 'Ottimale: <5.7%' },
};

/**
 * Genera valore con possibilità di essere fuori range
 * Garantisce valori fisiologicamente plausibili
 */
function generateValue(
  range: { min: number; max: number },
  abnormalityRate: number = 0.3
): { value: number; isAbnormal: boolean; severity?: string } {
  const isAbnormal = Math.random() < abnormalityRate;
  
  if (!isAbnormal) {
    // Valore normale (nel range)
    // Gestione speciale per test con min=0 per evitare valori troppo bassi
    if (range.min === 0) {
      // Per test con min=0, usa una soglia minima realistica
      let realMin: number;
      
      if (range.max <= 10) {
        // Test con max basso (es. HbA1c max=5.6): range normale 70-100% del max
        realMin = range.max * 0.7;
      } else if (range.max <= 60) {
        // Test con max medio (ALT, AST max=40): range normale 5-max
        realMin = 5;
      } else {
        // Test con max alto (colesterolo, LDL, trigliceridi): range normale 40-max
        realMin = Math.max(range.max * 0.2, 30);
      }
      
      const value = realMin + Math.random() * (range.max - realMin);
      return { value: Number(value.toFixed(2)), isAbnormal: false };
    }
    
    // Per test con min > 0, campiona normalmente
    const value = range.min + Math.random() * (range.max - range.min);
    return { value: Number(value.toFixed(2)), isAbnormal: false };
  }
  
  // Valore anomalo
  const isHigh = Math.random() > 0.5;
  const isCritical = Math.random() < 0.2; // 20% di valori critici
  
  if (isHigh) {
    // Valori alti: sopra il max
    const deviation = isCritical ? 1.5 : 1.2;
    const value = range.max * (1 + Math.random() * (deviation - 1));
    return {
      value: Number(value.toFixed(2)),
      isAbnormal: true,
      severity: isCritical ? 'CRITICAL_HIGH' : 'HIGH'
    };
  } else {
    // Valori bassi: sotto il min ma fisiologicamente plausibili
    const deviation = isCritical ? 0.5 : 0.8;
    
    // Gestione speciale per test con min=0 (evita valori a zero)
    if (range.min === 0) {
      // Per test come LDL, trigliceridi, ALT, HbA1c, ecc.
      // Usa floor specifici per test con max molto bassi
      let floor: number;
      let maxOffset: number;
      
      if (range.max <= 10) {
        // Test con max basso (es. HbA1c max=5.6): floor più alto
        floor = Math.max(range.max * 0.6, 3.5); // Min 60% del max o 3.5
        maxOffset = range.max * 0.95; // 95% del max
      } else {
        // Test con max normale (LDL, trigliceridi, ALT)
        floor = range.max * 0.05; // 5% del max
        maxOffset = range.max * 0.3; // 30% del max
      }
      
      const value = floor + Math.random() * (maxOffset - floor);
      return {
        value: Number(value.toFixed(2)),
        isAbnormal: true,
        severity: isCritical ? 'CRITICAL_LOW' : 'LOW'
      };
    }
    
    // Per test con min > 0
    // Campiona tra (min * deviation) e min per restare realistici
    const lowerBound = range.min * deviation;
    const value = lowerBound + Math.random() * (range.min - lowerBound);
    return {
      value: Number(value.toFixed(2)),
      isAbnormal: true,
      severity: isCritical ? 'CRITICAL_LOW' : 'LOW'
    };
  }
}

/**
 * Genera referto emocromo completo
 */
export function generateCBCReport(gender: 'M' | 'F', age: number): MedicalReport {
  const values: MedicalTestValue[] = [];
  
  // Leucociti
  const wbc = generateValue(CBC_RANGES.wbc);
  values.push({
    name: CBC_RANGES.wbc.name,
    value: wbc.value,
    unit: CBC_RANGES.wbc.unit,
    referenceRange: `${CBC_RANGES.wbc.min}-${CBC_RANGES.wbc.max}`,
    isAbnormal: wbc.isAbnormal,
    severity: wbc.severity as any,
  });
  
  // Eritrociti (gender-specific)
  const rbcRange = gender === 'M' ? CBC_RANGES.rbc.male : CBC_RANGES.rbc.female;
  const rbc = generateValue(rbcRange);
  values.push({
    name: rbcRange.name,
    value: rbc.value,
    unit: rbcRange.unit,
    referenceRange: `${rbcRange.min}-${rbcRange.max}`,
    isAbnormal: rbc.isAbnormal,
    severity: rbc.severity as any,
  });
  
  // Emoglobina (gender-specific)
  const hbRange = gender === 'M' ? CBC_RANGES.hemoglobin.male : CBC_RANGES.hemoglobin.female;
  const hb = generateValue(hbRange);
  values.push({
    name: hbRange.name,
    value: hb.value,
    unit: hbRange.unit,
    referenceRange: `${hbRange.min}-${hbRange.max}`,
    isAbnormal: hb.isAbnormal,
    severity: hb.severity as any,
  });
  
  // Ematocrito (gender-specific)
  const hctRange = gender === 'M' ? CBC_RANGES.hematocrit.male : CBC_RANGES.hematocrit.female;
  const hct = generateValue(hctRange);
  values.push({
    name: hctRange.name,
    value: hct.value,
    unit: hctRange.unit,
    referenceRange: `${hctRange.min}-${hctRange.max}`,
    isAbnormal: hct.isAbnormal,
    severity: hct.severity as any,
  });
  
  // Piastrine
  const plt = generateValue(CBC_RANGES.platelets);
  values.push({
    name: CBC_RANGES.platelets.name,
    value: plt.value,
    unit: CBC_RANGES.platelets.unit,
    referenceRange: `${CBC_RANGES.platelets.min}-${CBC_RANGES.platelets.max}`,
    isAbnormal: plt.isAbnormal,
    severity: plt.severity as any,
  });
  
  // Indici corpuscolari
  const mcv = generateValue(CBC_RANGES.mcv);
  values.push({
    name: CBC_RANGES.mcv.name,
    value: mcv.value,
    unit: CBC_RANGES.mcv.unit,
    referenceRange: `${CBC_RANGES.mcv.min}-${CBC_RANGES.mcv.max}`,
    isAbnormal: mcv.isAbnormal,
    severity: mcv.severity as any,
  });
  
  const mch = generateValue(CBC_RANGES.mch);
  values.push({
    name: CBC_RANGES.mch.name,
    value: mch.value,
    unit: CBC_RANGES.mch.unit,
    referenceRange: `${CBC_RANGES.mch.min}-${CBC_RANGES.mch.max}`,
    isAbnormal: mch.isAbnormal,
    severity: mch.severity as any,
  });
  
  const mchc = generateValue(CBC_RANGES.mchc);
  values.push({
    name: CBC_RANGES.mchc.name,
    value: mchc.value,
    unit: CBC_RANGES.mchc.unit,
    referenceRange: `${CBC_RANGES.mchc.min}-${CBC_RANGES.mchc.max}`,
    isAbnormal: mchc.isAbnormal,
    severity: mchc.severity as any,
  });
  
  // Genera report formattato
  const formattedReport = formatReport('EMOCROMO COMPLETO', values);
  
  // Genera summary
  const abnormalValues = values.filter(v => v.isAbnormal);
  let summary = '';
  if (abnormalValues.length === 0) {
    summary = 'Tutti i valori dell\'emocromo rientrano nei range di normalità.';
  } else {
    summary = `Emocromo con ${abnormalValues.length} valore/i fuori range: ${abnormalValues.map(v => v.name).join(', ')}.`;
  }
  
  return {
    type: 'cbc',
    title: 'Emocromo Completo',
    values,
    summary,
    formattedReport,
  };
}

/**
 * Genera referto profilo lipidico
 */
export function generateLipidPanelReport(gender: 'M' | 'F', age: number): MedicalReport {
  const values: MedicalTestValue[] = [];
  
  // Colesterolo totale (più probabile alto in anziani)
  const cholRate = age > 50 ? 0.5 : 0.3;
  const totalChol = generateValue(LIPID_RANGES.totalCholesterol, cholRate);
  values.push({
    name: LIPID_RANGES.totalCholesterol.name,
    value: totalChol.value,
    unit: LIPID_RANGES.totalCholesterol.unit,
    referenceRange: `<${LIPID_RANGES.totalCholesterol.max} (${LIPID_RANGES.totalCholesterol.optimal})`,
    isAbnormal: totalChol.isAbnormal,
    severity: totalChol.severity as any,
  });
  
  // LDL
  const ldl = generateValue(LIPID_RANGES.ldl, cholRate);
  values.push({
    name: LIPID_RANGES.ldl.name,
    value: ldl.value,
    unit: LIPID_RANGES.ldl.unit,
    referenceRange: `<${LIPID_RANGES.ldl.max} (${LIPID_RANGES.ldl.optimal})`,
    isAbnormal: ldl.isAbnormal,
    severity: ldl.severity as any,
  });
  
  // HDL (gender-specific)
  const hdlRange = gender === 'M' ? LIPID_RANGES.hdl.male : LIPID_RANGES.hdl.female;
  const hdl = generateValue(hdlRange, 0.2);
  values.push({
    name: hdlRange.name,
    value: hdl.value,
    unit: hdlRange.unit,
    referenceRange: `>${hdlRange.min} (${hdlRange.optimal})`,
    isAbnormal: hdl.isAbnormal,
    severity: hdl.severity as any,
  });
  
  // Trigliceridi
  const trig = generateValue(LIPID_RANGES.triglycerides, 0.35);
  values.push({
    name: LIPID_RANGES.triglycerides.name,
    value: trig.value,
    unit: LIPID_RANGES.triglycerides.unit,
    referenceRange: `<${LIPID_RANGES.triglycerides.max} (${LIPID_RANGES.triglycerides.optimal})`,
    isAbnormal: trig.isAbnormal,
    severity: trig.severity as any,
  });
  
  const formattedReport = formatReport('PROFILO LIPIDICO', values);
  
  const abnormalValues = values.filter(v => v.isAbnormal);
  let summary = '';
  if (abnormalValues.length === 0) {
    summary = 'Profilo lipidico nella norma.';
  } else {
    summary = `Profilo lipidico con ${abnormalValues.length} valore/i alterato/i: ${abnormalValues.map(v => v.name).join(', ')}.`;
  }
  
  return {
    type: 'lipid_panel',
    title: 'Profilo Lipidico',
    values,
    summary,
    formattedReport,
  };
}

/**
 * Genera referto funzionalità epatica
 */
export function generateLiverFunctionReport(): MedicalReport {
  const values: MedicalTestValue[] = [];
  
  Object.entries(LIVER_RANGES).forEach(([key, range]) => {
    const result = generateValue(range, 0.25);
    values.push({
      name: range.name,
      value: result.value,
      unit: range.unit,
      referenceRange: `${range.min}-${range.max}`,
      isAbnormal: result.isAbnormal,
      severity: result.severity as any,
    });
  });
  
  const formattedReport = formatReport('FUNZIONALITÀ EPATICA', values);
  
  const abnormalValues = values.filter(v => v.isAbnormal);
  let summary = '';
  if (abnormalValues.length === 0) {
    summary = 'Funzionalità epatica nella norma.';
  } else {
    summary = `Funzionalità epatica con ${abnormalValues.length} enzima/i alterato/i: ${abnormalValues.map(v => v.name).join(', ')}.`;
  }
  
  return {
    type: 'liver_function',
    title: 'Funzionalità Epatica',
    values,
    summary,
    formattedReport,
  };
}

/**
 * Genera referto funzionalità renale
 */
export function generateKidneyFunctionReport(gender: 'M' | 'F'): MedicalReport {
  const values: MedicalTestValue[] = [];
  
  // Creatinina (gender-specific)
  const creatRange = gender === 'M' ? KIDNEY_RANGES.creatinine.male : KIDNEY_RANGES.creatinine.female;
  const creat = generateValue(creatRange, 0.25);
  values.push({
    name: creatRange.name,
    value: creat.value,
    unit: creatRange.unit,
    referenceRange: `${creatRange.min}-${creatRange.max}`,
    isAbnormal: creat.isAbnormal,
    severity: creat.severity as any,
  });
  
  // Urea
  const urea = generateValue(KIDNEY_RANGES.urea, 0.25);
  values.push({
    name: KIDNEY_RANGES.urea.name,
    value: urea.value,
    unit: KIDNEY_RANGES.urea.unit,
    referenceRange: `${KIDNEY_RANGES.urea.min}-${KIDNEY_RANGES.urea.max}`,
    isAbnormal: urea.isAbnormal,
    severity: urea.severity as any,
  });
  
  // Acido urico (gender-specific)
  const uricRange = gender === 'M' ? KIDNEY_RANGES.uricAcid.male : KIDNEY_RANGES.uricAcid.female;
  const uric = generateValue(uricRange, 0.3);
  values.push({
    name: uricRange.name,
    value: uric.value,
    unit: uricRange.unit,
    referenceRange: `${uricRange.min}-${uricRange.max}`,
    isAbnormal: uric.isAbnormal,
    severity: uric.severity as any,
  });
  
  const formattedReport = formatReport('FUNZIONALITÀ RENALE', values);
  
  const abnormalValues = values.filter(v => v.isAbnormal);
  let summary = '';
  if (abnormalValues.length === 0) {
    summary = 'Funzionalità renale nella norma.';
  } else {
    summary = `Funzionalità renale con ${abnormalValues.length} parametro/i alterato/i: ${abnormalValues.map(v => v.name).join(', ')}.`;
  }
  
  return {
    type: 'kidney_function',
    title: 'Funzionalità Renale',
    values,
    summary,
    formattedReport,
  };
}

/**
 * Genera referto glicemia e metabolismo
 */
export function generateGlucoseReport(age: number): MedicalReport {
  const values: MedicalTestValue[] = [];
  
  // Glicemia a digiuno (più probabile alta in anziani)
  const glucoseRate = age > 50 ? 0.4 : 0.25;
  const glucose = generateValue(GLUCOSE_RANGES.fastingGlucose, glucoseRate);
  values.push({
    name: GLUCOSE_RANGES.fastingGlucose.name,
    value: glucose.value,
    unit: GLUCOSE_RANGES.fastingGlucose.unit,
    referenceRange: `${GLUCOSE_RANGES.fastingGlucose.min}-${GLUCOSE_RANGES.fastingGlucose.max} (${GLUCOSE_RANGES.fastingGlucose.optimal})`,
    isAbnormal: glucose.isAbnormal,
    severity: glucose.severity as any,
  });
  
  // HbA1c
  const hba1c = generateValue(GLUCOSE_RANGES.hba1c, glucoseRate);
  values.push({
    name: GLUCOSE_RANGES.hba1c.name,
    value: hba1c.value,
    unit: GLUCOSE_RANGES.hba1c.unit,
    referenceRange: `<${GLUCOSE_RANGES.hba1c.max} (${GLUCOSE_RANGES.hba1c.optimal})`,
    isAbnormal: hba1c.isAbnormal,
    severity: hba1c.severity as any,
  });
  
  const formattedReport = formatReport('METABOLISMO GLUCIDICO', values);
  
  const abnormalValues = values.filter(v => v.isAbnormal);
  let summary = '';
  if (abnormalValues.length === 0) {
    summary = 'Metabolismo glucidico nella norma.';
  } else {
    summary = `Metabolismo glucidico con ${abnormalValues.length} parametro/i alterato/i: ${abnormalValues.map(v => v.name).join(', ')}.`;
  }
  
  return {
    type: 'glucose',
    title: 'Metabolismo Glucidico',
    values,
    summary,
    formattedReport,
  };
}

/**
 * Formatta il referto in formato leggibile con asterischi per valori anomali
 */
function formatReport(title: string, values: MedicalTestValue[]): string {
  let report = `═══════════════════════════════════════════════════════\n`;
  report += `  ${title}\n`;
  report += `═══════════════════════════════════════════════════════\n\n`;
  
  values.forEach(v => {
    const asterisk = v.isAbnormal ? ' *' : '  ';
    const severity = v.severity ? ` [${v.severity}]` : '';
    
    report += `${asterisk} ${v.name.padEnd(45)} ${String(v.value).padStart(8)} ${v.unit}\n`;
    report += `   Range di riferimento: ${v.referenceRange}${severity}\n`;
    
    if (v.isAbnormal) {
      if (v.severity === 'CRITICAL_HIGH' || v.severity === 'CRITICAL_LOW') {
        report += `   ⚠️  VALORE CRITICO - Consultare immediatamente il medico\n`;
      } else if (v.severity === 'HIGH') {
        report += `   ⚠️  Valore elevato - Monitoraggio consigliato\n`;
      } else if (v.severity === 'LOW') {
        report += `   ⚠️  Valore ridotto - Monitoraggio consigliato\n`;
      }
    }
    
    report += `\n`;
  });
  
  report += `═══════════════════════════════════════════════════════\n`;
  report += `* = Valore fuori range di riferimento\n`;
  report += `═══════════════════════════════════════════════════════\n`;
  
  return report;
}

/**
 * Genera un referto completo casuale
 */
export function generateRandomMedicalReport(gender: 'M' | 'F', age: number): MedicalReport {
  const reportTypes = [
    () => generateCBCReport(gender, age),
    () => generateLipidPanelReport(gender, age),
    () => generateLiverFunctionReport(),
    () => generateKidneyFunctionReport(gender),
    () => generateGlucoseReport(age),
  ];
  
  const randomReport = reportTypes[Math.floor(Math.random() * reportTypes.length)];
  return randomReport();
}
