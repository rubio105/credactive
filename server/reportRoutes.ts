import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import PDFDocument from "pdfkit";
import { db } from "./db";
import { reportDocuments, reportSignatureOtps, reportActivityLogs, users } from "@shared/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { isAuthenticated } from "./authSetup";
import { sendWhatsAppMessage } from "./twilio";
import { sendEmail } from "./email";
import { generateMedicalReportDraft, extractTextFromMedicalReport } from "./gemini";
import { z } from "zod";
import twilio from "twilio";

const router = Router();

const reportsUploadDir = path.join(process.cwd(), "uploads", "report-documents");
if (!fs.existsSync(reportsUploadDir)) {
  fs.mkdirSync(reportsUploadDir, { recursive: true });
}

const signedPdfsDir = path.join(process.cwd(), "uploads", "signed-reports");
if (!fs.existsSync(signedPdfsDir)) {
  fs.mkdirSync(signedPdfsDir, { recursive: true });
}

const reportStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, reportsUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `report-${uniqueSuffix}${ext}`);
  },
});

const uploadReport = multer({
  storage: reportStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /pdf|jpeg|jpg|png/;
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const allowedMimetypes = /application\/pdf|image\/jpeg|image\/jpg|image\/png/;
    const mimetype = allowedMimetypes.test(file.mimetype);
    if (extname || mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Solo file PDF e immagini sono consentiti"));
    }
  },
});

const isReportOperator = (req: any, res: any, next: any) => {
  if (!req.user?.isReportOperator) {
    return res.status(403).json({ message: "Accesso non autorizzato" });
  }
  next();
};

const isReportDoctor = (req: any, res: any, next: any) => {
  if (!req.user?.isReportDoctor) {
    return res.status(403).json({ message: "Accesso non autorizzato" });
  }
  next();
};

const logActivity = async (
  reportId: string,
  userId: string,
  action: string,
  details: any,
  req?: any
) => {
  try {
    await db.insert(reportActivityLogs).values({
      reportDocumentId: reportId,
      userId,
      action,
      details,
      ipAddress: req?.ip || req?.connection?.remoteAddress || null,
      userAgent: req?.headers?.["user-agent"] || null,
    });
  } catch (error) {
    console.error("[REPORT_LOG] Error logging activity:", error);
  }
};

router.post(
  "/upload",
  isAuthenticated,
  isReportOperator,
  uploadReport.single("file"),
  async (req: any, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "Nessun file caricato" });
      }

      const { patientName, patientFiscalCode, patientDateOfBirth } = req.body;
      if (!patientName?.trim()) {
        return res.status(400).json({ message: "Nome paziente obbligatorio" });
      }

      const operator = await db.query.users.findFirst({
        where: eq(users.id, req.user.id),
      });

      if (!operator?.assignedReportDoctorId) {
        return res.status(400).json({ 
          message: "Nessun medico assegnato. Contatta l'amministratore." 
        });
      }

      const fileType = file.mimetype === "application/pdf" ? "pdf" : "image";

      const [report] = await db
        .insert(reportDocuments)
        .values({
          patientName: patientName.trim(),
          patientFiscalCode: patientFiscalCode?.trim().toUpperCase() || null,
          patientDateOfBirth: patientDateOfBirth ? new Date(patientDateOfBirth) : null,
          originalFileName: file.originalname,
          filePath: file.path,
          fileType,
          status: "processing",
          uploadedByOperatorId: req.user.id,
          assignedDoctorId: operator.assignedReportDoctorId,
        })
        .returning();

      await logActivity(report.id, req.user.id, "uploaded", { fileName: file.originalname }, req);

      processReportWithAI(report.id, file.path, fileType).catch((err) => {
        console.error("[REPORT_AI] Error processing:", err);
      });

      res.json({ success: true, reportId: report.id });
    } catch (error: any) {
      console.error("[REPORT_UPLOAD] Error:", error);
      res.status(500).json({ message: "Errore durante il caricamento" });
    }
  }
);

async function processReportWithAI(reportId: string, filePath: string, fileType: string) {
  try {
    let extractedText = "";

    if (fileType === "pdf") {
      const ocrResult = await extractTextFromMedicalReport(filePath, "application/pdf");
      extractedText = ocrResult.extractedText || "";
    } else {
      const mimeType = filePath.endsWith(".png") ? "image/png" : "image/jpeg";
      const ocrResult = await extractTextFromMedicalReport(filePath, mimeType);
      extractedText = ocrResult.extractedText || "";
    }

    let aiDraft = "";
    if (extractedText.trim()) {
      const reportDraft = await generateMedicalReportDraft(extractedText);
      aiDraft = reportDraft;
    } else {
      aiDraft = `REFERTO MEDICO

SINTESI DIAGNOSTICA
Da completare a cura del medico.

PROPOSTA TERAPEUTICA
Da completare a cura del medico.

PIANO DI FOLLOW-UP
Da definire a cura del medico.`;
    }

    await db
      .update(reportDocuments)
      .set({
        extractedText,
        aiDraftReport: aiDraft,
        aiProcessedAt: new Date(),
        status: "pending_review",
        updatedAt: new Date(),
      })
      .where(eq(reportDocuments.id, reportId));

    const report = await db.query.reportDocuments.findFirst({
      where: eq(reportDocuments.id, reportId),
    });
    
    if (report) {
      await logActivity(
        reportId,
        report.uploadedByOperatorId,
        "ai_processed",
        { 
          extractedTextLength: extractedText.length,
          aiDraftLength: aiDraft.length,
        }
      );
    }

    console.log(`[REPORT_AI] Report ${reportId} processed successfully`);
  } catch (error) {
    console.error(`[REPORT_AI] Error processing report ${reportId}:`, error);
    await db
      .update(reportDocuments)
      .set({
        status: "pending_review",
        aiDraftReport: "Errore durante l'analisi AI. Compilare manualmente.",
        updatedAt: new Date(),
      })
      .where(eq(reportDocuments.id, reportId));
  }
}

router.get("/operator/my-uploads", isAuthenticated, isReportOperator, async (req: any, res) => {
  try {
    const reports = await db.query.reportDocuments.findMany({
      where: eq(reportDocuments.uploadedByOperatorId, req.user.id),
      orderBy: [desc(reportDocuments.createdAt)],
    });

    res.json(reports);
  } catch (error: any) {
    console.error("[REPORT_LIST] Error:", error);
    res.status(500).json({ message: "Errore nel recupero dei documenti" });
  }
});

router.get("/doctor/pending", isAuthenticated, isReportDoctor, async (req: any, res) => {
  try {
    const reports = await db.query.reportDocuments.findMany({
      where: and(
        eq(reportDocuments.assignedDoctorId, req.user.id),
        inArray(reportDocuments.status, ["pending_review", "in_review", "pending_signature"])
      ),
      orderBy: [desc(reportDocuments.createdAt)],
    });

    res.json(reports);
  } catch (error: any) {
    console.error("[REPORT_PENDING] Error:", error);
    res.status(500).json({ message: "Errore nel recupero dei referti" });
  }
});

router.get("/doctor/signed", isAuthenticated, isReportDoctor, async (req: any, res) => {
  try {
    const reports = await db.query.reportDocuments.findMany({
      where: and(
        eq(reportDocuments.assignedDoctorId, req.user.id),
        eq(reportDocuments.status, "signed")
      ),
      orderBy: [desc(reportDocuments.signedAt)],
    });

    res.json(reports);
  } catch (error: any) {
    console.error("[REPORT_SIGNED] Error:", error);
    res.status(500).json({ message: "Errore nel recupero dei referti firmati" });
  }
});

router.patch("/:id/edit", isAuthenticated, isReportDoctor, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { finalReport } = req.body;

    const report = await db.query.reportDocuments.findFirst({
      where: and(
        eq(reportDocuments.id, id),
        eq(reportDocuments.assignedDoctorId, req.user.id)
      ),
    });

    if (!report) {
      return res.status(404).json({ message: "Referto non trovato" });
    }

    if (report.status === "signed") {
      return res.status(400).json({ message: "Referto già firmato, non modificabile" });
    }

    await db
      .update(reportDocuments)
      .set({
        finalReport,
        status: "in_review",
        updatedAt: new Date(),
      })
      .where(eq(reportDocuments.id, id));

    await logActivity(id, req.user.id, "edited", { length: finalReport?.length }, req);

    res.json({ success: true });
  } catch (error: any) {
    console.error("[REPORT_EDIT] Error:", error);
    res.status(500).json({ message: "Errore durante il salvataggio" });
  }
});

router.post("/:id/request-otp", isAuthenticated, isReportDoctor, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { channel } = req.body;

    if (!["sms", "whatsapp", "email"].includes(channel)) {
      return res.status(400).json({ message: "Canale OTP non valido" });
    }

    const report = await db.query.reportDocuments.findFirst({
      where: and(
        eq(reportDocuments.id, id),
        eq(reportDocuments.assignedDoctorId, req.user.id)
      ),
    });

    if (!report) {
      return res.status(404).json({ message: "Referto non trovato" });
    }

    if (report.status === "signed") {
      return res.status(400).json({ message: "Referto già firmato" });
    }

    if (!report.finalReport?.trim()) {
      return res.status(400).json({ message: "Salva prima il referto finale" });
    }

    const doctor = await db.query.users.findFirst({
      where: eq(users.id, req.user.id),
    });

    const phoneNumber = doctor?.phone || doctor?.whatsappNumber;
    const doctorEmail = doctor?.email;
    
    if (channel === "email" && !doctorEmail) {
      return res.status(400).json({ message: "Email non configurata nel profilo" });
    }
    
    if ((channel === "sms" || channel === "whatsapp") && !phoneNumber) {
      return res.status(400).json({ 
        message: "Numero di telefono non configurato. Aggiorna il tuo profilo." 
      });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const contactInfo = channel === "email" 
      ? doctorEmail!.replace(/(.{3}).*@/, "$1***@")
      : phoneNumber!.replace(/\d(?=\d{4})/g, "*");

    await db.insert(reportSignatureOtps).values({
      reportDocumentId: id,
      doctorId: req.user.id,
      otpHash,
      channel,
      phoneNumber: contactInfo,
      expiresAt,
    });

    if (channel === "email") {
      console.log(`[REPORT_OTP] Sending Email OTP to ${doctorEmail}`);
      try {
        await sendEmail({
          to: doctorEmail!,
          subject: "Prohmed - Codice OTP per firma referto",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Codice OTP per Firma Referto</h2>
              <p>Il tuo codice di verifica per firmare il referto è:</p>
              <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937;">${otpCode}</span>
              </div>
              <p style="color: #6b7280; font-size: 14px;">Questo codice scade tra 5 minuti.</p>
              <p style="color: #6b7280; font-size: 14px;">Se non hai richiesto questo codice, ignora questa email.</p>
            </div>
          `,
        });
        console.log(`[REPORT_OTP] Email OTP sent successfully`);
      } catch (emailError: any) {
        console.error(`[REPORT_OTP] Email failed:`, emailError);
        return res.status(500).json({ 
          message: `Errore invio email: ${emailError.message || 'Riprova più tardi'}` 
        });
      }
    } else if (channel === "whatsapp") {
      console.log(`[REPORT_OTP] Sending WhatsApp OTP to ${phoneNumber}`);
      const whatsappResult = await sendWhatsAppMessage(
        phoneNumber,
        `Prohmed - Codice OTP per firma referto: ${otpCode}\nScade tra 5 minuti.`
      );
      if (!whatsappResult.success) {
        console.error(`[REPORT_OTP] WhatsApp failed:`, whatsappResult.error);
        return res.status(500).json({ 
          message: `Errore invio WhatsApp: ${whatsappResult.error || 'Verifica che il numero sia corretto e abilitato per WhatsApp'}` 
        });
      }
      console.log(`[REPORT_OTP] WhatsApp OTP sent successfully: ${whatsappResult.sid}`);
    } else {
      const twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      await twilioClient.messages.create({
        body: `Prohmed - Codice OTP per firma referto: ${otpCode}. Scade tra 5 minuti.`,
        from: process.env.TWILIO_PHONE_NUMBER || "+15005550006",
        to: phoneNumber,
      });
    }

    await db
      .update(reportDocuments)
      .set({ status: "pending_signature", updatedAt: new Date() })
      .where(eq(reportDocuments.id, id));

    await logActivity(id, req.user.id, "otp_sent", { channel }, req);

    res.json({ success: true, message: `OTP inviato via ${channel}` });
  } catch (error: any) {
    console.error("[REPORT_OTP] Error:", error);
    res.status(500).json({ message: "Errore durante l'invio OTP" });
  }
});

router.post("/:id/verify-otp", isAuthenticated, isReportDoctor, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    if (!otp || otp.length !== 6) {
      return res.status(400).json({ message: "Codice OTP non valido" });
    }

    const report = await db.query.reportDocuments.findFirst({
      where: and(
        eq(reportDocuments.id, id),
        eq(reportDocuments.assignedDoctorId, req.user.id)
      ),
    });

    if (!report) {
      return res.status(404).json({ message: "Referto non trovato" });
    }

    if (report.status === "signed") {
      return res.status(400).json({ message: "Referto già firmato" });
    }

    const otpRecord = await db.query.reportSignatureOtps.findFirst({
      where: and(
        eq(reportSignatureOtps.reportDocumentId, id),
        eq(reportSignatureOtps.doctorId, req.user.id)
      ),
      orderBy: [desc(reportSignatureOtps.createdAt)],
    });

    if (!otpRecord) {
      return res.status(400).json({ message: "Nessun OTP richiesto" });
    }

    if (otpRecord.verifiedAt) {
      return res.status(400).json({ message: "OTP già utilizzato" });
    }

    if (new Date() > otpRecord.expiresAt) {
      return res.status(400).json({ message: "OTP scaduto. Richiedine uno nuovo." });
    }

    if (otpRecord.attemptCount >= 5) {
      return res.status(400).json({ message: "Troppi tentativi. Richiedine uno nuovo." });
    }

    const isValid = await bcrypt.compare(otp, otpRecord.otpHash);
    
    if (!isValid) {
      await db
        .update(reportSignatureOtps)
        .set({ attemptCount: (otpRecord.attemptCount || 0) + 1 })
        .where(eq(reportSignatureOtps.id, otpRecord.id));
      return res.status(400).json({ message: "Codice OTP non corretto" });
    }

    await db
      .update(reportSignatureOtps)
      .set({ verifiedAt: new Date() })
      .where(eq(reportSignatureOtps.id, otpRecord.id));

    const doctor = await db.query.users.findFirst({
      where: eq(users.id, req.user.id),
    });

    const pdfPath = await generateSignedPDF(report, doctor);

    await db
      .update(reportDocuments)
      .set({
        status: "signed",
        signedAt: new Date(),
        signatureOtpChannel: otpRecord.channel,
        signedPdfPath: pdfPath,
        updatedAt: new Date(),
      })
      .where(eq(reportDocuments.id, id));

    await logActivity(id, req.user.id, "signed", { pdfPath }, req);

    res.json({ success: true, pdfPath: `/api/report-documents/${id}/pdf` });
  } catch (error: any) {
    console.error("[REPORT_VERIFY] Error:", error);
    res.status(500).json({ message: "Errore durante la verifica" });
  }
});

import type { ReportDocument } from "@shared/schema";

type User = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  specialization: string | null;
};

async function generateSignedPDF(report: ReportDocument, doctor: User | null): Promise<string> {
  const fileName = `referto-${report.id}-${Date.now()}.pdf`;
  const filePath = path.join(signedPdfsDir, fileName);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    const logoPath = path.join(process.cwd(), "attached_assets", "image_1768563399301.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 45, { width: 150 });
    }

    doc.moveDown(4);

    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text("REFERTO MEDICO", { align: "center" });

    doc.moveDown();

    doc
      .fontSize(11)
      .font("Helvetica")
      .text(`Paziente: ${report.patientName}`, { align: "left" });

    if (report.patientFiscalCode) {
      doc.text(`Codice Fiscale: ${report.patientFiscalCode}`);
    }

    doc.text(`Data: ${new Date().toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })}`);

    doc.moveDown(2);

    doc
      .fontSize(11)
      .font("Helvetica")
      .text(report.finalReport || report.aiDraftReport || "", {
        align: "left",
        lineGap: 4,
      });

    doc.moveDown(4);

    const signatureY = doc.y;
    
    doc
      .moveTo(350, signatureY)
      .lineTo(550, signatureY)
      .stroke();

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Dr. ${doctor?.firstName || ""} ${doctor?.lastName || ""}`, 350, signatureY + 5, {
        width: 200,
        align: "center",
      });

    if (doctor?.specialization) {
      doc.text(doctor.specialization, 350, signatureY + 20, {
        width: 200,
        align: "center",
      });
    }

    doc.moveDown(3);

    const signDate = new Date().toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    doc
      .fontSize(10)
      .fillColor("black")
      .font("Helvetica-Bold")
      .text(
        `Firmato dal Dott. ${doctor?.firstName || ""} ${doctor?.lastName || ""}`,
        { align: "center" }
      );

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(
        `in data ${signDate}`,
        { align: "center" }
      );

    doc.moveDown(1);

    doc
      .fontSize(8)
      .fillColor("gray")
      .text(
        `Documento firmato digitalmente | ID: ${report.id}`,
        { align: "center" }
      );

    doc.end();

    writeStream.on("finish", () => resolve(filePath));
    writeStream.on("error", reject);
  });
}

router.get("/:id/pdf", isAuthenticated, async (req: any, res) => {
  try {
    const { id } = req.params;

    const report = await db.query.reportDocuments.findFirst({
      where: eq(reportDocuments.id, id),
    });

    if (!report) {
      return res.status(404).json({ message: "Referto non trovato" });
    }

    const canAccess =
      req.user.isAdmin ||
      req.user.id === report.assignedDoctorId ||
      req.user.id === report.uploadedByOperatorId;

    if (!canAccess) {
      return res.status(403).json({ message: "Accesso non autorizzato" });
    }

    if (!report.signedPdfPath || !fs.existsSync(report.signedPdfPath)) {
      return res.status(404).json({ message: "PDF non disponibile" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="referto-${report.patientName.replace(/\s+/g, "-")}.pdf"`
    );
    fs.createReadStream(report.signedPdfPath).pipe(res);
  } catch (error: any) {
    console.error("[REPORT_PDF] Error:", error);
    res.status(500).json({ message: "Errore nel recupero del PDF" });
  }
});

router.get("/admin/all", isAuthenticated, async (req: any, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Accesso non autorizzato" });
    }

    const reports = await db.query.reportDocuments.findMany({
      orderBy: [desc(reportDocuments.createdAt)],
    });

    const enrichedReports = await Promise.all(
      reports.map(async (report) => {
        const operator = await db.query.users.findFirst({
          where: eq(users.id, report.uploadedByOperatorId),
        });
        const doctor = report.assignedDoctorId
          ? await db.query.users.findFirst({
              where: eq(users.id, report.assignedDoctorId),
            })
          : null;

        return {
          ...report,
          operatorName: operator
            ? `${operator.firstName} ${operator.lastName}`
            : "N/A",
          doctorName: doctor
            ? `Dr. ${doctor.firstName} ${doctor.lastName}`
            : "N/A",
        };
      })
    );

    res.json(enrichedReports);
  } catch (error: any) {
    console.error("[REPORT_ADMIN] Error:", error);
    res.status(500).json({ message: "Errore nel recupero dei referti" });
  }
});

router.get("/admin/operators", isAuthenticated, async (req: any, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Accesso non autorizzato" });
    }

    const operators = await db.query.users.findMany({
      where: eq(users.isReportOperator, true),
    });

    const enrichedOperators = await Promise.all(
      operators.map(async (op) => {
        const assignedDoctor = op.assignedReportDoctorId
          ? await db.query.users.findFirst({
              where: eq(users.id, op.assignedReportDoctorId),
            })
          : null;

        return {
          id: op.id,
          email: op.email,
          firstName: op.firstName,
          lastName: op.lastName,
          assignedDoctorId: op.assignedReportDoctorId,
          assignedDoctorName: assignedDoctor
            ? `Dr. ${assignedDoctor.firstName} ${assignedDoctor.lastName}`
            : null,
        };
      })
    );

    res.json(enrichedOperators);
  } catch (error: any) {
    console.error("[REPORT_OPERATORS] Error:", error);
    res.status(500).json({ message: "Errore nel recupero degli operatori" });
  }
});

router.get("/admin/doctors", isAuthenticated, async (req: any, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Accesso non autorizzato" });
    }

    const doctors = await db.query.users.findMany({
      where: eq(users.isReportDoctor, true),
    });

    res.json(
      doctors.map((d) => ({
        id: d.id,
        email: d.email,
        firstName: d.firstName,
        lastName: d.lastName,
        specialization: d.specialization,
        phone: d.phone,
      }))
    );
  } catch (error: any) {
    console.error("[REPORT_DOCTORS] Error:", error);
    res.status(500).json({ message: "Errore nel recupero dei medici" });
  }
});

router.patch("/admin/assign-doctor", isAuthenticated, async (req: any, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Accesso non autorizzato" });
    }

    const { operatorId, doctorId } = req.body;

    if (!operatorId) {
      return res.status(400).json({ message: "ID operatore obbligatorio" });
    }

    await db
      .update(users)
      .set({ assignedReportDoctorId: doctorId || null })
      .where(eq(users.id, operatorId));

    res.json({ success: true });
  } catch (error: any) {
    console.error("[REPORT_ASSIGN] Error:", error);
    res.status(500).json({ message: "Errore durante l'assegnazione" });
  }
});

export default router;