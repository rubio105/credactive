import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "./db";
import {
  clientApiKeys,
  clientReportSubmissions,
  reportDocuments,
  reportActivityLogs,
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { generateMedicalReportDraft, extractTextFromMedicalReport } from "./gemini";
import { isAuthenticated } from "./authSetup";

const router = Router();

const reportsUploadDir = path.join(process.cwd(), "uploads", "report-documents");
if (!fs.existsSync(reportsUploadDir)) {
  fs.mkdirSync(reportsUploadDir, { recursive: true });
}

const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, reportsUploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `client-${uniqueSuffix}${ext}`);
  },
});

const uploadReport = multer({
  storage: uploadStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /pdf|jpeg|jpg|png/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = /application\/pdf|image\/jpeg|image\/jpg|image\/png/.test(file.mimetype);
    if (ext || mime) cb(null, true);
    else cb(new Error("Solo file PDF e immagini sono consentiti"));
  },
});

async function authenticateApiKey(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "unauthorized",
      message: "Authorization header mancante. Usa: Authorization: Bearer <API_KEY>",
    });
  }

  const providedKey = authHeader.replace("Bearer ", "").trim();

  const keyRecord = await db.query.clientApiKeys.findFirst({
    where: and(
      eq(clientApiKeys.apiKey, providedKey),
      eq(clientApiKeys.isActive, true)
    ),
  });

  if (!keyRecord) {
    return res.status(401).json({
      error: "unauthorized",
      message: "API key non valida o disabilitata",
    });
  }

  await db
    .update(clientApiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(clientApiKeys.id, keyRecord.id));

  req.clientApiKey = keyRecord;
  next();
}

async function processClientReportWithAI(reportId: string, filePath: string, fileType: string) {
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
      aiDraft = await generateMedicalReportDraft(extractedText);
    } else {
      aiDraft = `REFERTO MEDICO\n\nSINTESI DIAGNOSTICA\nDa completare a cura del medico.\n\nPROPOSTA TERAPEUTICA\nDa completare a cura del medico.\n\nPIANO DI FOLLOW-UP\nDa definire a cura del medico.`;
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

    console.log(`[CLIENT_API_AI] Report ${reportId} processed successfully`);
  } catch (error) {
    console.error(`[CLIENT_API_AI] Error processing report ${reportId}:`, error);
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

const uploadSchema = z.object({
  patient_name: z.string().min(1, "patient_name obbligatorio"),
  patient_fiscal_code: z.string().optional(),
  patient_date_of_birth: z.string().optional(),
  webhook_url: z.string().url("webhook_url deve essere un URL valido"),
  external_id: z.string().optional(),
});

router.post("/reports/upload", authenticateApiKey, uploadReport.single("file"), async (req: any, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        error: "missing_file",
        message: "Nessun file caricato. Usa il campo 'file' nel form-data.",
      });
    }

    const parsed = uploadSchema.safeParse(req.body);
    if (!parsed.success) {
      fs.unlinkSync(file.path);
      return res.status(400).json({
        error: "validation_error",
        message: "Dati mancanti o non validi",
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { patient_name, patient_fiscal_code, patient_date_of_birth, webhook_url, external_id } = parsed.data;

    const clientKey = req.clientApiKey;

    if (!clientKey.assignedDoctorId) {
      fs.unlinkSync(file.path);
      return res.status(500).json({
        error: "configuration_error",
        message: "Medico refertatore non configurato per questa API key. Contatta il supporto Prohmed.",
      });
    }

    const fileType = file.mimetype === "application/pdf" ? "pdf" : "image";

    const [report] = await db
      .insert(reportDocuments)
      .values({
        patientName: patient_name.trim(),
        patientFiscalCode: patient_fiscal_code?.trim().toUpperCase() || null,
        patientDateOfBirth: patient_date_of_birth ? new Date(patient_date_of_birth) : null,
        originalFileName: file.originalname,
        filePath: file.path,
        fileType,
        status: "processing",
        uploadedByOperatorId: clientKey.assignedOperatorId || clientKey.assignedDoctorId,
        assignedDoctorId: clientKey.assignedDoctorId,
      })
      .returning();

    const [submission] = await db
      .insert(clientReportSubmissions)
      .values({
        clientApiKeyId: clientKey.id,
        reportDocumentId: report.id,
        clientExternalId: external_id || null,
        webhookUrl: webhook_url,
      })
      .returning();

    processClientReportWithAI(report.id, file.path, fileType).catch((err: any) => {
      console.error("[CLIENT_API] AI processing error:", err);
    });

    res.status(202).json({
      success: true,
      report_id: report.id,
      external_id: external_id || null,
      status: "processing",
      message: "Documento ricevuto. In elaborazione AI. Riceverai il referto firmato al webhook_url una volta completato il processo.",
      status_url: `/api/client/reports/${report.id}`,
    });
  } catch (error: any) {
    console.error("[CLIENT_API] Upload error:", error);
    res.status(500).json({
      error: "server_error",
      message: "Errore interno del server",
    });
  }
});

router.get("/reports/:reportId", authenticateApiKey, async (req: any, res) => {
  try {
    const { reportId } = req.params;
    const clientKey = req.clientApiKey;

    const submission = await db.query.clientReportSubmissions.findFirst({
      where: and(
        eq(clientReportSubmissions.clientApiKeyId, clientKey.id),
        eq(clientReportSubmissions.reportDocumentId, reportId)
      ),
    });

    if (!submission) {
      return res.status(404).json({
        error: "not_found",
        message: "Documento non trovato o non appartiene a questa API key",
      });
    }

    const report = await db.query.reportDocuments.findFirst({
      where: eq(reportDocuments.id, reportId),
    });

    if (!report) {
      return res.status(404).json({ error: "not_found", message: "Documento non trovato" });
    }

    const statusMap: Record<string, string> = {
      processing: "In elaborazione AI",
      pending_review: "In attesa di revisione del medico",
      in_review: "In revisione dal medico",
      pending_signature: "In attesa di firma",
      signed: "Firmato e completato",
      rejected: "Rifiutato",
    };

    res.json({
      report_id: report.id,
      external_id: submission.clientExternalId,
      status: report.status,
      status_description: statusMap[report.status] || report.status,
      patient_name: report.patientName,
      created_at: report.createdAt,
      updated_at: report.updatedAt,
      signed_at: report.signedAt || null,
      webhook_url: submission.webhookUrl,
      webhook_sent: submission.webhookSuccess,
      webhook_sent_at: submission.webhookSentAt || null,
      pdf_ready: report.status === "signed" && !!report.signedPdfPath,
    });
  } catch (error: any) {
    console.error("[CLIENT_API] Status error:", error);
    res.status(500).json({ error: "server_error", message: "Errore interno del server" });
  }
});

export async function deliverWebhook(reportDocumentId: string): Promise<void> {
  try {
    const submission = await db.query.clientReportSubmissions.findFirst({
      where: eq(clientReportSubmissions.reportDocumentId, reportDocumentId),
    });

    if (!submission || submission.webhookSuccess) return;

    const report = await db.query.reportDocuments.findFirst({
      where: eq(reportDocuments.id, reportDocumentId),
    });

    if (!report || report.status !== "signed" || !report.signedPdfPath) return;

    const clientKey = await db.query.clientApiKeys.findFirst({
      where: eq(clientApiKeys.id, submission.clientApiKeyId),
    });

    const pdfBuffer = fs.readFileSync(report.signedPdfPath);
    const pdfBase64 = pdfBuffer.toString("base64");

    const payload = {
      event: "report.signed",
      report_id: report.id,
      external_id: submission.clientExternalId || null,
      patient_name: report.patientName,
      patient_fiscal_code: report.patientFiscalCode || null,
      signed_at: report.signedAt,
      pdf_filename: `referto-${report.patientName?.replace(/\s+/g, "-")}-${Date.now()}.pdf`,
      pdf_base64: pdfBase64,
      pdf_size_bytes: pdfBuffer.length,
    };

    const bodyString = JSON.stringify(payload);
    let signature: string | undefined;

    if (clientKey?.webhookSecret) {
      signature = crypto
        .createHmac("sha256", clientKey.webhookSecret)
        .update(bodyString)
        .digest("hex");
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Prohmed-Event": "report.signed",
      "X-Prohmed-Report-Id": report.id,
    };

    if (signature) {
      headers["X-Prohmed-Signature"] = `sha256=${signature}`;
    }

    const response = await fetch(submission.webhookUrl, {
      method: "POST",
      headers,
      body: bodyString,
      signal: AbortSignal.timeout(30000),
    });

    if (response.ok) {
      await db
        .update(clientReportSubmissions)
        .set({
          webhookSentAt: new Date(),
          webhookSuccess: true,
          webhookAttempts: submission.webhookAttempts + 1,
          webhookLastError: null,
          updatedAt: new Date(),
        })
        .where(eq(clientReportSubmissions.id, submission.id));

      console.log(`[WEBHOOK] Delivered successfully to ${submission.webhookUrl} for report ${reportDocumentId}`);
    } else {
      const errorText = await response.text();
      await db
        .update(clientReportSubmissions)
        .set({
          webhookAttempts: submission.webhookAttempts + 1,
          webhookLastError: `HTTP ${response.status}: ${errorText.slice(0, 500)}`,
          updatedAt: new Date(),
        })
        .where(eq(clientReportSubmissions.id, submission.id));

      console.error(`[WEBHOOK] Delivery failed (${response.status}) for report ${reportDocumentId}`);
    }
  } catch (error: any) {
    console.error(`[WEBHOOK] Error delivering webhook for report ${reportDocumentId}:`, error);

    const submission = await db.query.clientReportSubmissions.findFirst({
      where: eq(clientReportSubmissions.reportDocumentId, reportDocumentId),
    });

    if (submission) {
      await db
        .update(clientReportSubmissions)
        .set({
          webhookAttempts: submission.webhookAttempts + 1,
          webhookLastError: error.message || "Unknown error",
          updatedAt: new Date(),
        })
        .where(eq(clientReportSubmissions.id, submission.id));
    }
  }
}

router.get("/admin/keys", isAuthenticated, async (req: any, res) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: "forbidden" });
  }
  try {
    const keys = await db.select().from(clientApiKeys).orderBy(desc(clientApiKeys.createdAt));
    res.json(keys.map((k) => ({ ...k, apiKeyHash: undefined })));
  } catch (err: any) {
    console.error("[CLIENT_API] GET keys error:", err?.message);
    res.status(500).json({ error: "server_error", detail: err?.message });
  }
});

router.post("/admin/keys", isAuthenticated, async (req: any, res) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: "forbidden" });
  }
  try {
    const { clientName, assignedDoctorId, assignedOperatorId, notes } = req.body;
    console.log("[CLIENT_API] POST /admin/keys body:", { clientName, assignedDoctorId, notes });

    if (!clientName?.trim()) {
      return res.status(400).json({ error: "clientName obbligatorio" });
    }
    if (!assignedDoctorId) {
      return res.status(400).json({ error: "Il medico refertatore è obbligatorio" });
    }

    const rawKey = `pmk_${crypto.randomBytes(24).toString("hex")}`;
    const keyHash = await bcrypt.hash(rawKey, 10);

    console.log("[CLIENT_API] Inserting key for doctor:", assignedDoctorId);

    const [key] = await db
      .insert(clientApiKeys)
      .values({
        clientName: clientName.trim(),
        apiKey: rawKey,
        apiKeyHash: keyHash,
        assignedDoctorId,
        assignedOperatorId: assignedOperatorId || null,
        notes: notes || null,
        webhookSecret: crypto.randomBytes(16).toString("hex"),
        isActive: true,
      })
      .returning();

    console.log("[CLIENT_API] Key created:", key.id);
    res.json({
      ...key,
      apiKeyHash: undefined,
      message: "Conserva questa API key, non verrà mostrata di nuovo.",
    });
  } catch (err: any) {
    console.error("[CLIENT_API_ADMIN] Create key error:", err?.message, err?.code, err?.detail);
    res.status(500).json({ error: "server_error", detail: err?.message });
  }
});

router.patch("/admin/keys/:keyId/toggle", isAuthenticated, async (req: any, res) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: "forbidden" });
  }
  try {
    const { keyId } = req.params;
    const [key] = await db.select().from(clientApiKeys).where(eq(clientApiKeys.id, keyId)).limit(1);
    if (!key) return res.status(404).json({ error: "not_found" });

    const [updated] = await db
      .update(clientApiKeys)
      .set({ isActive: !key.isActive, updatedAt: new Date() })
      .where(eq(clientApiKeys.id, keyId))
      .returning();

    res.json({ ...updated, apiKeyHash: undefined });
  } catch (err) {
    res.status(500).json({ error: "server_error" });
  }
});

router.get("/admin/submissions", isAuthenticated, async (req: any, res) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: "forbidden" });
  }
  try {
    const submissions = await db.select().from(clientReportSubmissions).orderBy(desc(clientReportSubmissions.createdAt));
    res.json(submissions);
  } catch (err: any) {
    console.error("[CLIENT_API] GET submissions error:", err?.message);
    res.status(500).json({ error: "server_error", detail: err?.message });
  }
});

export default router;
