import PDFDocument from 'pdfkit';

interface AssessmentPDFData {
  userAge: number;
  userGender: string;
  userProfession: string;
  score: number;
  riskLevel: string;
  recommendations: string[];
  completedAt: Date;
}

export function generateAssessmentPDF(data: AssessmentPDFData): typeof PDFDocument {
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'portrait',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
  });

  const { userAge, userGender, userProfession, score, riskLevel, recommendations, completedAt } = data;
  
  // Colors
  const primaryColor = '#2563eb'; // Blue
  const secondaryColor = '#1e40af'; // Dark blue
  const greenColor = '#10b981'; // Green
  const yellowColor = '#f59e0b'; // Yellow/Amber
  const redColor = '#ef4444'; // Red
  const textColor = '#1f2937'; // Dark gray
  
  // Header - Logo
  doc.fontSize(28)
     .fillColor(primaryColor)
     .font('Helvetica-Bold')
     .text('CIRY', 0, 50, { align: 'center' });
  
  doc.fontSize(14)
     .fillColor(secondaryColor)
     .font('Helvetica')
     .text('ACADEMY - Hub Prevenzione Medica', 0, 85, { align: 'center' });
  
  // Title
  doc.fontSize(24)
     .fillColor(textColor)
     .font('Helvetica-Bold')
     .text('Report Assessment Prevenzione', 0, 130, { align: 'center' });
  
  // Decorative line
  const lineY = 170;
  const lineWidth = 400;
  const centerX = doc.page.width / 2;
  doc.moveTo(centerX - lineWidth / 2, lineY)
     .lineTo(centerX + lineWidth / 2, lineY)
     .lineWidth(2)
     .strokeColor(primaryColor)
     .stroke();
  
  // Demographics section
  const startY = 200;
  doc.fontSize(16)
     .fillColor(textColor)
     .font('Helvetica-Bold')
     .text('Dati Anagrafici', 50, startY);
  
  doc.fontSize(12)
     .fillColor(textColor)
     .font('Helvetica')
     .text(`Età: ${userAge} anni`, 50, startY + 30)
     .text(`Genere: ${userGender}`, 50, startY + 50)
     .text(`Professione: ${userProfession}`, 50, startY + 70);
  
  // Score section
  const scoreY = startY + 120;
  doc.fontSize(14)
     .fillColor(textColor)
     .font('Helvetica-Bold')
     .text('Punteggio Ottenuto', 50, scoreY);
  
  doc.fontSize(48)
     .fillColor(primaryColor)
     .font('Helvetica-Bold')
     .text(`${score}%`, 50, scoreY + 30);
  
  // Risk Level section
  const riskY = scoreY + 100;
  doc.fontSize(14)
     .fillColor(textColor)
     .font('Helvetica-Bold')
     .text('Livello di Rischio', 50, riskY);
  
  let riskColor = textColor;
  let riskLabel = 'Non valutato';
  
  switch (riskLevel) {
    case 'low':
      riskColor = greenColor;
      riskLabel = 'Rischio Basso';
      break;
    case 'medium':
      riskColor = yellowColor;
      riskLabel = 'Rischio Moderato';
      break;
    case 'high':
      riskColor = redColor;
      riskLabel = 'Rischio Alto';
      break;
  }
  
  doc.fontSize(18)
     .fillColor(riskColor)
     .font('Helvetica-Bold')
     .text(riskLabel, 50, riskY + 30);
  
  // Recommendations section
  const recY = riskY + 80;
  doc.fontSize(14)
     .fillColor(textColor)
     .font('Helvetica-Bold')
     .text('Raccomandazioni Personalizzate', 50, recY);
  
  let currentY = recY + 30;
  recommendations.forEach((rec, index) => {
    // Check if we need a new page
    if (currentY > doc.page.height - 100) {
      doc.addPage();
      currentY = 50;
    }
    
    // Bullet point
    doc.fontSize(10)
       .fillColor(primaryColor)
       .font('Helvetica')
       .text('•', 50, currentY);
    
    // Recommendation text
    doc.fontSize(11)
       .fillColor(textColor)
       .font('Helvetica')
       .text(rec, 65, currentY, { width: 480 });
    
    currentY += 30;
  });
  
  // Footer - Disclaimer
  const footerY = doc.page.height - 80;
  doc.fontSize(9)
     .fillColor('#6b7280')
     .font('Helvetica')
     .text(
       'DISCLAIMER: I risultati di questo assessment sono a scopo educativo. Per una valutazione medica completa, consultare sempre un professionista sanitario.',
       50,
       footerY,
       { width: doc.page.width - 100, align: 'center' }
     );
  
  // Date
  const dateStr = completedAt.toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.fontSize(10)
     .fillColor(textColor)
     .font('Helvetica')
     .text(`Report generato il ${dateStr}`, 0, footerY + 30, { align: 'center' });
  
  return doc;
}

export function generateAssessmentPDFBuffer(data: AssessmentPDFData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = generateAssessmentPDF(data);
    const chunks: Buffer[] = [];
    
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    
    doc.end();
  });
}
