import PDFDocument from "pdfkit";
import type { User, Quiz, UserQuizAttempt } from "@shared/schema";

export interface CertificateData {
  user: User;
  quiz: Quiz;
  attempt: UserQuizAttempt;
  verificationCode: string;
  issueDate: Date;
}

export function generateCertificatePDF(data: CertificateData): typeof PDFDocument {
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
  });

  const { user, quiz, attempt, verificationCode, issueDate } = data;
  
  // Colors
  const primaryColor = '#2563eb'; // Blue
  const secondaryColor = '#1e40af'; // Dark blue
  const goldColor = '#f59e0b'; // Gold/amber
  const textColor = '#1f2937'; // Dark gray
  
  // Certificate border
  doc.lineWidth(8)
     .strokeColor(primaryColor)
     .rect(30, 30, doc.page.width - 60, doc.page.height - 60)
     .stroke();
  
  doc.lineWidth(2)
     .strokeColor(goldColor)
     .rect(40, 40, doc.page.width - 80, doc.page.height - 80)
     .stroke();
  
  // Logo placeholder (you can add actual logo later)
  // For now, we'll use styled text as logo
  doc.fontSize(24)
     .fillColor(primaryColor)
     .font('Helvetica-Bold')
     .text('CIRY', 0, 80, { align: 'center' });
  
  doc.fontSize(14)
     .fillColor(secondaryColor)
     .font('Helvetica')
     .text('Care & Intelligence Ready for You', 0, 110, { align: 'center' });
  
  // Certificate title
  doc.fontSize(36)
     .fillColor(textColor)
     .font('Helvetica-Bold')
     .text('CERTIFICATE OF ACHIEVEMENT', 0, 170, { align: 'center' });
  
  // Decorative line
  const lineY = 220;
  const lineWidth = 200;
  const centerX = doc.page.width / 2;
  doc.moveTo(centerX - lineWidth / 2, lineY)
     .lineTo(centerX + lineWidth / 2, lineY)
     .lineWidth(2)
     .strokeColor(goldColor)
     .stroke();
  
  // Presented to
  doc.fontSize(16)
     .fillColor(textColor)
     .font('Helvetica')
     .text('This is to certify that', 0, 250, { align: 'center' });
  
  // User name (large and prominent)
  const userName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.email;
  doc.fontSize(32)
     .fillColor(primaryColor)
     .font('Helvetica-Bold')
     .text(userName, 0, 280, { align: 'center' });
  
  // Achievement text
  doc.fontSize(16)
     .fillColor(textColor)
     .font('Helvetica')
     .text('has successfully completed', 0, 330, { align: 'center' });
  
  // Quiz title
  doc.fontSize(24)
     .fillColor(secondaryColor)
     .font('Helvetica-Bold')
     .text(quiz.title, 100, 360, { 
       align: 'center',
       width: doc.page.width - 200,
     });
  
  // Score
  const scoreText = `with a score of ${attempt.score}%`;
  doc.fontSize(18)
     .fillColor(attempt.score >= 90 ? '#10b981' : attempt.score >= 70 ? goldColor : '#6b7280')
     .font('Helvetica-Bold')
     .text(scoreText, 0, 410, { align: 'center' });
  
  // Date and verification section
  const bottomY = doc.page.height - 150;
  
  // Date
  const formattedDate = issueDate.toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });
  
  doc.fontSize(12)
     .fillColor(textColor)
     .font('Helvetica')
     .text(`Date: ${formattedDate}`, 100, bottomY);
  
  // Verification code
  doc.fontSize(10)
     .fillColor('#6b7280')
     .font('Helvetica')
     .text(`Verification Code: ${verificationCode}`, 0, bottomY + 30, { align: 'center' });
  
  // Signature line (placeholder)
  const sigLineY = bottomY + 60;
  const sigLineLength = 150;
  const sigX = doc.page.width - 200;
  
  doc.moveTo(sigX, sigLineY)
     .lineTo(sigX + sigLineLength, sigLineY)
     .lineWidth(1)
     .strokeColor('#9ca3af')
     .stroke();
  
  doc.fontSize(10)
     .fillColor(textColor)
     .font('Helvetica-Oblique')
     .text('Director of Certifications', sigX, sigLineY + 10, { 
       width: sigLineLength, 
       align: 'center' 
     });
  
  // Footer
  doc.fontSize(8)
     .fillColor('#9ca3af')
     .font('Helvetica')
     .text(
       'This certificate verifies successful completion and can be verified at ciry.app/verify',
       50,
       doc.page.height - 60,
       { align: 'center', width: doc.page.width - 100 }
     );
  
  return doc;
}

export function generateCertificateBuffer(data: CertificateData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = generateCertificatePDF(data);
    const chunks: Buffer[] = [];
    
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    
    doc.end();
  });
}
