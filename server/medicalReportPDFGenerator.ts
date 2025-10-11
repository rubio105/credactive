import PDFDocument from "pdfkit";
import type { UserHealthReport } from "@shared/schema";
import path from "path";
import fs from "fs";

export interface MedicalReportPDFData {
  report: UserHealthReport;
  userName: string;
  userLanguage?: string;
}

export function generateMedicalReportPDF(data: MedicalReportPDFData): typeof PDFDocument {
  const { report, userName, userLanguage = 'it' } = data;
  
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 40, bottom: 60, left: 50, right: 50 },
  });

  // Colors - Prohmed Green Theme
  const primaryColor = '#10b981'; // Emerald green
  const secondaryColor = '#059669'; // Dark emerald
  const accentColor = '#34d399'; // Light emerald
  const textColor = '#1f2937'; // Dark gray
  const lightGray = '#f3f4f6';

  // Translations
  const t = getTranslations(userLanguage);

  // Header with Prohmed Logo and CIRY branding
  const logoPath = path.join(process.cwd(), 'public', 'images', 'prohmed-logo.jpg');
  if (fs.existsSync(logoPath)) {
    try {
      // Use fit to maintain aspect ratio instead of forcing dimensions
      doc.image(logoPath, 50, 40, { fit: [120, 60] });
    } catch (error) {
      console.error('Error loading Prohmed logo:', error);
    }
  }

  // CIRY logo/text on the right
  doc.fontSize(18)
     .fillColor(primaryColor)
     .font('Helvetica-Bold')
     .text('CIRY', doc.page.width - 150, 45, { width: 100, align: 'right' });
  
  doc.fontSize(9)
     .fillColor(textColor)
     .font('Helvetica')
     .text('Care & Intelligence Ready for You', doc.page.width - 200, 68, { width: 150, align: 'right' });

  // Header Border
  doc.moveTo(50, 100)
     .lineTo(doc.page.width - 50, 100)
     .lineWidth(2)
     .strokeColor(primaryColor)
     .stroke();

  // Title
  doc.fontSize(24)
     .fillColor(primaryColor)
     .font('Helvetica-Bold')
     .text(t.title, 50, 120, { align: 'center', width: doc.page.width - 100 });

  doc.fontSize(11)
     .fillColor(textColor)
     .font('Helvetica')
     .text(t.subtitle, 50, 150, { align: 'center', width: doc.page.width - 100 });

  let yPos = 190;

  // Patient Information Box
  doc.rect(50, yPos, doc.page.width - 100, 80)
     .fillAndStroke(lightGray, textColor);

  doc.fontSize(10)
     .fillColor(textColor)
     .font('Helvetica-Bold')
     .text(t.patient, 60, yPos + 10);

  doc.fontSize(9)
     .font('Helvetica')
     .text(`${t.name}: ${userName}`, 60, yPos + 30)
     .text(`${t.reportDate}: ${new Date(report.createdAt || new Date()).toLocaleDateString(userLanguage === 'it' ? 'it-IT' : 'en-US')}`, 60, yPos + 45)
     .text(`${t.reportType}: ${getReportTypeName(report.reportType || 'generale', userLanguage)}`, 60, yPos + 60);

  yPos += 100;

  // Radiological Image Section (if available)
  const radiologicalAnalysis = report.radiologicalAnalysis as any;
  if (radiologicalAnalysis && report.filePath && isImageFile(report.fileType)) {
    const imagePath = path.join(process.cwd(), 'public', report.filePath);
    if (fs.existsSync(imagePath)) {
      try {
        yPos += 10;
        
        // Section Title
        doc.fontSize(14)
           .fillColor(primaryColor)
           .font('Helvetica-Bold')
           .text(t.radiologicalImage, 50, yPos);
        
        yPos += 25;
        
        // Display radiological image
        const imageWidth = 250;
        const imageHeight = 200;
        
        // Check if we need a new page
        if (yPos + imageHeight > doc.page.height - 100) {
          doc.addPage();
          yPos = 50;
        }
        
        doc.image(imagePath, 50, yPos, { width: imageWidth, height: imageHeight, fit: [imageWidth, imageHeight] });
        
        // Add findings markers with color-coded categories (if available)
        if (radiologicalAnalysis.findings && radiologicalAnalysis.findings.length > 0) {
          let markersY = yPos;
          const markersX = 50 + imageWidth + 20;
          
          doc.fontSize(11)
             .fillColor(secondaryColor)
             .font('Helvetica-Bold')
             .text(t.findings, markersX, markersY);
          
          markersY += 25;
          
          radiologicalAnalysis.findings.slice(0, 5).forEach((finding: any, index: number) => {
            // Color-coded marker based on category
            const categoryColors: Record<string, string> = {
              normal: '#10b981',    // Green
              attention: '#f59e0b', // Amber/Yellow
              urgent: '#ef4444'     // Red
            };
            const markerColor = categoryColors[finding.category] || '#6b7280'; // Default gray
            
            // Draw circular marker with number
            doc.circle(markersX + 10, markersY + 6, 10)
               .fillAndStroke(markerColor, markerColor);
            
            doc.fontSize(9)
               .fillColor('white')
               .font('Helvetica-Bold')
               .text(`${index + 1}`, markersX + 6, markersY + 2, { width: 8, align: 'center' });
            
            // Finding description with patient-friendly text if available
            const findingText = finding.patientDescription || finding.description || finding.finding;
            doc.fontSize(9)
               .fillColor(textColor)
               .font('Helvetica')
               .text(findingText, markersX + 25, markersY, { width: doc.page.width - markersX - 75 });
            
            markersY += doc.heightOfString(findingText, { width: doc.page.width - markersX - 75 }) + 15;
          });
        }
        
        yPos += imageHeight + 20;
      } catch (error) {
        console.error('Error loading radiological image:', error);
      }
    }
  }

  // AI Summary Section - Patient-Friendly Language
  if (report.aiSummary) {
    if (yPos > doc.page.height - 200) {
      doc.addPage();
      yPos = 50;
    }

    doc.fontSize(14)
       .fillColor(primaryColor)
       .font('Helvetica-Bold')
       .text(t.patientSummary, 50, yPos);

    yPos += 25;

    doc.rect(50, yPos, doc.page.width - 100, 0)
       .lineWidth(1)
       .strokeColor(accentColor)
       .stroke();

    yPos += 10;

    doc.fontSize(10)
       .fillColor(textColor)
       .font('Helvetica')
       .text(report.aiSummary, 50, yPos, { width: doc.page.width - 100, align: 'justify' });

    yPos += doc.heightOfString(report.aiSummary, { width: doc.page.width - 100 }) + 20;
  }

  // Medical Values Section
  const extractedValues = report.extractedValues as Record<string, any> || {};
  if (Object.keys(extractedValues).length > 0) {
    if (yPos > doc.page.height - 200) {
      doc.addPage();
      yPos = 50;
    }

    doc.fontSize(14)
       .fillColor(primaryColor)
       .font('Helvetica-Bold')
       .text(t.medicalValues, 50, yPos);

    yPos += 25;

    // Table header
    doc.rect(50, yPos, doc.page.width - 100, 25)
       .fillAndStroke(primaryColor, primaryColor);

    doc.fontSize(10)
       .fillColor('white')
       .font('Helvetica-Bold')
       .text(t.parameter, 60, yPos + 8, { width: 200 })
       .text(t.value, doc.page.width / 2 - 50, yPos + 8, { width: 150 })
       .text(t.range, doc.page.width - 200, yPos + 8, { width: 140 });

    yPos += 25;

    // Table rows
    Object.entries(extractedValues).forEach(([key, value], index) => {
      const bgColor = index % 2 === 0 ? 'white' : lightGray;
      doc.rect(50, yPos, doc.page.width - 100, 20)
         .fillAndStroke(bgColor, textColor);

      doc.fontSize(9)
         .fillColor(textColor)
         .font('Helvetica')
         .text(key, 60, yPos + 5, { width: 200 })
         .text(String(value), doc.page.width / 2 - 50, yPos + 5, { width: 150 });

      yPos += 20;

      // Check if we need a new page
      if (yPos > doc.page.height - 100) {
        doc.addPage();
        yPos = 50;
      }
    });

    yPos += 10;
  }

  // Technical Section - For Medical Professionals
  if (report.anonymizedText) {
    if (yPos > doc.page.height - 250) {
      doc.addPage();
      yPos = 50;
    }

    doc.fontSize(14)
       .fillColor(secondaryColor)
       .font('Helvetica-Bold')
       .text(t.technicalSection, 50, yPos);

    yPos += 25;

    doc.fontSize(8)
       .fillColor('#6b7280')
       .font('Helvetica-Oblique')
       .text(t.technicalNote, 50, yPos, { width: doc.page.width - 100 });

    yPos += 30;

    doc.rect(50, yPos, doc.page.width - 100, 0)
       .lineWidth(1)
       .strokeColor('#d1d5db')
       .stroke();

    yPos += 10;

    const textToShow = report.anonymizedText.slice(0, 1000); // Limit text to avoid overflow

    doc.fontSize(8)
       .fillColor(textColor)
       .font('Helvetica')
       .text(textToShow, 50, yPos, { width: doc.page.width - 100, align: 'justify' });

    yPos += doc.heightOfString(textToShow, { width: doc.page.width - 100 }) + 10;
  }

  // Radiological Analysis Details (if available)
  if (radiologicalAnalysis) {
    // Use patient-friendly assessment if available, fallback to overall assessment
    const assessmentText = radiologicalAnalysis.patientAssessment || radiologicalAnalysis.overallAssessment;
    
    if (assessmentText) {
      if (yPos > doc.page.height - 200) {
        doc.addPage();
        yPos = 50;
      }

      doc.fontSize(14)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text(t.detailedExplanation, 50, yPos);

      yPos += 25;

      doc.fontSize(10)
         .fillColor(textColor)
         .font('Helvetica')
         .text(assessmentText, 50, yPos, { width: doc.page.width - 100, align: 'justify' });

      yPos += doc.heightOfString(assessmentText, { width: doc.page.width - 100 }) + 20;

      // Confidence Score
      if (radiologicalAnalysis.confidence) {
        doc.fontSize(9)
           .fillColor('#6b7280')
           .font('Helvetica-Oblique')
           .text(`${t.confidence}: ${radiologicalAnalysis.confidence}%`, 50, yPos);
        
        yPos += 20;
      }
    }
    
    // Technical Assessment for medical professionals (if different from patient version)
    if (radiologicalAnalysis.technicalAssessment && 
        radiologicalAnalysis.technicalAssessment !== radiologicalAnalysis.patientAssessment) {
      if (yPos > doc.page.height - 200) {
        doc.addPage();
        yPos = 50;
      }

      doc.fontSize(12)
         .fillColor(secondaryColor)
         .font('Helvetica-Bold')
         .text(t.technicalAssessment, 50, yPos);

      yPos += 20;

      doc.fontSize(9)
         .fillColor('#6b7280')
         .font('Helvetica-Oblique')
         .text(t.forProfessionals, 50, yPos);

      yPos += 20;

      doc.fontSize(9)
         .fillColor(textColor)
         .font('Helvetica')
         .text(radiologicalAnalysis.technicalAssessment, 50, yPos, { width: doc.page.width - 100, align: 'justify' });

      yPos += doc.heightOfString(radiologicalAnalysis.technicalAssessment, { width: doc.page.width - 100 }) + 20;
    }
    
    // Therapeutic Recommendations Section
    if (radiologicalAnalysis.recommendations && radiologicalAnalysis.recommendations.length > 0) {
      if (yPos > doc.page.height - 250) {
        doc.addPage();
        yPos = 50;
      }

      doc.fontSize(14)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text(t.recommendations, 50, yPos);

      yPos += 25;

      // Display recommendations as numbered list
      radiologicalAnalysis.recommendations.forEach((recommendation: string, index: number) => {
        // Check if we need a new page
        const recommendationHeight = doc.heightOfString(recommendation, { width: doc.page.width - 130 }) + 15;
        if (yPos + recommendationHeight > doc.page.height - 100) {
          doc.addPage();
          yPos = 50;
        }

        // Number circle
        doc.circle(60, yPos + 6, 8)
           .fillAndStroke(accentColor, primaryColor);
        
        doc.fontSize(9)
           .fillColor('white')
           .font('Helvetica-Bold')
           .text(`${index + 1}`, 56, yPos + 2, { width: 8, align: 'center' });

        // Recommendation text
        doc.fontSize(10)
           .fillColor(textColor)
           .font('Helvetica')
           .text(recommendation, 80, yPos, { width: doc.page.width - 130, align: 'justify' });

        yPos += recommendationHeight;
      });

      yPos += 10;
    }
  }

  // Footer with Privacy Notice
  const footerY = doc.page.height - 80;
  
  doc.rect(50, footerY, doc.page.width - 100, 60)
     .fillAndStroke('#fef3c7', '#d97706');

  doc.fontSize(8)
     .fillColor('#92400e')
     .font('Helvetica-Bold')
     .text(t.privacyTitle, 60, footerY + 10, { width: doc.page.width - 120 });

  doc.fontSize(7)
     .fillColor('#78350f')
     .font('Helvetica')
     .text(t.privacyNote, 60, footerY + 25, { width: doc.page.width - 120 });

  // Page number
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    doc.fontSize(8)
       .fillColor('#9ca3af')
       .font('Helvetica')
       .text(`${t.page} ${i + 1} ${t.of} ${range.count}`, 0, doc.page.height - 30, { align: 'center' });
  }

  return doc;
}

export function generateMedicalReportBuffer(data: MedicalReportPDFData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = generateMedicalReportPDF(data);
    const chunks: Buffer[] = [];
    
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    
    doc.end();
  });
}

function isImageFile(fileType: string): boolean {
  return fileType?.startsWith('image/') || false;
}

function getReportTypeName(type: string, language: string): string {
  const names: Record<string, Record<string, string>> = {
    it: {
      esame_sangue: "Esame del Sangue",
      radiologia: "Radiologia",
      cardiologia: "Cardiologia",
      ecografia: "Ecografia",
      risonanza: "Risonanza Magnetica",
      tac: "TAC",
      ecg: "Elettrocardiogramma",
      esame_urine: "Esame delle Urine",
      generale: "Referto Generale",
    },
    en: {
      esame_sangue: "Blood Test",
      radiologia: "Radiology",
      cardiologia: "Cardiology",
      ecografia: "Ultrasound",
      risonanza: "MRI",
      tac: "CT Scan",
      ecg: "Electrocardiogram",
      esame_urine: "Urine Test",
      generale: "General Report",
    }
  };
  return names[language]?.[type] || names['it']?.[type] || "Referto Medico";
}

function getTranslations(language: string) {
  const translations: Record<string, any> = {
    it: {
      title: "Referto Medico Digitale",
      subtitle: "Analisi AI-Powered by CIRY & Prohmed",
      patient: "Informazioni Paziente",
      name: "Nome",
      reportDate: "Data Referto",
      reportType: "Tipo",
      radiologicalImage: "Immagine Radiologica",
      findings: "Reperti:",
      patientSummary: "Riepilogo per il Paziente",
      detailedExplanation: "Spiegazione Dettagliata del Referto",
      medicalValues: "Valori Medici Rilevati",
      parameter: "Parametro",
      value: "Valore",
      range: "Range di Riferimento",
      technicalSection: "Sezione Tecnica - Per Professionisti Sanitari",
      technicalNote: "Questa sezione contiene informazioni tecniche destinate ai professionisti sanitari.",
      technicalAssessment: "Valutazione Tecnica (Per Medici)",
      forProfessionals: "Questa sezione utilizza terminologia medico-scientifica professionale",
      radiologicalAssessment: "Valutazione Radiologica",
      recommendations: "Raccomandazioni Terapeutiche e Follow-up",
      confidence: "Affidabilità AI",
      privacyTitle: "🔒 Privacy & Sicurezza:",
      privacyNote: "Tutti i dati personali sono stati anonimizzati secondo le normative GDPR. Questo referto è generato tramite AI per scopi informativi. Consultare sempre un medico professionista.",
      page: "Pagina",
      of: "di",
    },
    en: {
      title: "Digital Medical Report",
      subtitle: "AI-Powered Analysis by CIRY & Prohmed",
      patient: "Patient Information",
      name: "Name",
      reportDate: "Report Date",
      reportType: "Type",
      radiologicalImage: "Radiological Image",
      findings: "Findings:",
      patientSummary: "Patient Summary",
      detailedExplanation: "Detailed Report Explanation",
      medicalValues: "Detected Medical Values",
      parameter: "Parameter",
      value: "Value",
      range: "Reference Range",
      technicalSection: "Technical Section - For Healthcare Professionals",
      technicalNote: "This section contains technical information intended for healthcare professionals.",
      technicalAssessment: "Technical Assessment (For Physicians)",
      forProfessionals: "This section uses professional medical-scientific terminology",
      radiologicalAssessment: "Radiological Assessment",
      recommendations: "Therapeutic Recommendations and Follow-up",
      confidence: "AI Confidence",
      privacyTitle: "🔒 Privacy & Security:",
      privacyNote: "All personal data has been anonymized according to GDPR regulations. This report is AI-generated for informational purposes. Always consult a professional physician.",
      page: "Page",
      of: "of",
    }
  };
  return translations[language] || translations['it'];
}
