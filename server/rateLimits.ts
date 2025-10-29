import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 5, // 5 tentativi per IP
  message: 'Troppi tentativi di autenticazione. Riprova tra 15 minuti.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ora
  max: 3, // 3 registrazioni per IP per ora
  message: 'Troppe registrazioni da questo IP. Riprova tra un\'ora.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ora
  max: 3, // 3 richieste per IP per ora
  message: 'Troppe richieste di reset password. Riprova tra un\'ora.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const aiGenerationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ora
  max: 200, // 200 richieste AI per IP per ora (generoso per permettere conversazioni lunghe)
  message: 'Troppe richieste di generazione AI. Riprova tra un\'ora.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100, // 100 richieste per IP
  message: 'Troppe richieste. Riprova tra 15 minuti.',
  standardHeaders: true,
  legacyHeaders: false,
});
