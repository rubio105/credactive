import { type Express } from "express";

export function registerFieraRoutes(app: Express) {
  app.post("/api/fiera/submit", async (req, res) => {
    const { nome, email, eta, sesso, tipologia, paese } = req.body ?? {};

    if (!nome || !email || !eta || !sesso || !tipologia || !paese) {
      return res.status(400).json({ error: "Tutti i campi sono obbligatori" });
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      return res.status(400).json({ error: "Indirizzo email non valido" });
    }

    const isPrivato = tipologia === "Utente Privato";

    if (isPrivato) {
      try {
        const { sendEmail } = await import("./email");
        const primoNome = String(nome).split(" ")[0];

        await sendEmail({
          to: email,
          subject: "ExperienceLab 2026 — Il tuo codice sconto del 25%",
          htmlContent: `
            <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
              <div style="background:#1e3a4f;padding:42px 30px;text-align:center;">
                <h1 style="color:#c9a96e;margin:0;font-size:22px;font-weight:300;letter-spacing:4px;text-transform:uppercase;">ExperienceLab 2026</h1>
                <p style="color:#ffffff;margin:10px 0 0;font-size:11px;letter-spacing:3px;text-transform:uppercase;">Il tuo voucher esclusivo</p>
              </div>
              <div style="padding:42px 32px;">
                <p style="color:#2c2c2c;font-size:16px;margin-bottom:14px;">Ciao <strong>${primoNome}</strong>,</p>
                <p style="color:#555;font-size:15px;line-height:1.7;margin-bottom:28px;">
                  Grazie per esserti registrato a <strong>ExperienceLab 2026</strong>!<br>
                  Come utente privato hai diritto al tuo sconto esclusivo del <strong>25%</strong>.
                </p>
                <div style="background:#f8f6f3;border:2px dashed #c9a96e;border-radius:4px;padding:34px 24px;text-align:center;margin-bottom:26px;">
                  <p style="color:#999;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">Il tuo codice sconto</p>
                  <p style="color:#1e3a4f;font-size:36px;font-weight:800;letter-spacing:6px;margin:0;">EXPERIENCELAB26</p>
                  <p style="color:#c9a96e;font-size:18px;font-weight:600;margin:10px 0 0;">&minus;25% di sconto</p>
                </div>
                <p style="color:#999;font-size:13px;line-height:1.6;">Usa questo codice al momento dell'acquisto. Il codice &egrave; personale e non cedibile.</p>
              </div>
              <div style="background:#f0ede9;padding:20px 30px;text-align:center;">
                <p style="color:#bbb;font-size:11px;margin:0;">&copy; 2026 ExperienceLab. Tutti i diritti riservati.</p>
              </div>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("[Fiera] Email send error:", emailErr);
      }
    }

    return res.json({ success: true, isPrivato });
  });
}
