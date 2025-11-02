# 📚 CIRY - Documentazione Tecnica

Benvenuti nella documentazione tecnica di CIRY (Care & Intelligence Ready for You).

---

## 📖 Documentazione Disponibile

### API Integrazione ProhMed

📄 **[API_INTEGRATION_PROHMED.md](./API_INTEGRATION_PROHMED.md)** - Documentazione completa per sviluppatori

**Destinatari**: Sviluppatori ProhMed (Android/iOS)  
**Contenuto**:
- ✅ Panoramica architettura e separazione dati
- ✅ Autenticazione con API keys e sicurezza
- ✅ Riferimento completo API endpoints con esempi
- ✅ Strutture dati TypeScript/Dart
- ✅ Gestione errori e best practices
- ✅ Esempi integrazione React Native e Flutter
- ✅ Testing con cURL e script automatici
- ✅ FAQ e troubleshooting

**Quando usarlo**:
- Prima di iniziare l'integrazione ProhMed
- Come riferimento durante sviluppo
- Per debugging errori API
- Per training nuovi sviluppatori team

---

## 🔧 Guide Integrazione (Root Directory)

Nella directory principale del progetto trovi anche:

### 📄 PROHMED_INTEGRATION.md
Guida pratica integrazione con esempi end-to-end e flow completi.

### 📄 TESTING_GUIDE.md
Guida testing passo-passo con esempi pratici.

### 🧪 test-prohmed-api.sh
Script bash per testing automatico API in produzione.

---

## 🚀 Quick Start

### Per Sviluppatori ProhMed

1. **Leggi la documentazione principale**:
   ```bash
   cat docs/API_INTEGRATION_PROHMED.md
   ```

2. **Ottieni credenziali produzione**:
   - Base URL: `https://ciry.app`
   - API Key: Richiedi all'amministratore CIRY
   - Rate Limit: 120 richieste/minuto

3. **Testa l'API**:
   ```bash
   curl https://ciry.app/api/v1/docs
   ```

4. **Integra nel tuo progetto**:
   - React Native: vedi sezione 6.1 della documentazione
   - Flutter: vedi sezione 6.2 della documentazione

---

## 📞 Supporto

### Contatti Tecnici
- **Email**: [Inserire email supporto tecnico]
- **Documentazione Online**: `https://ciry.app/api/v1/docs`

### Richieste API Key
Contattare amministratore CIRY per:
- Generazione nuove API keys
- Modifica rate limits
- Cambio permessi/scopes
- Rotazione chiavi (security)

### Segnalazione Bug
Includere sempre:
1. Timestamp richiesta (ISO 8601)
2. Endpoint chiamato
3. Request body (senza dati sensibili)
4. Response status + body
5. Ambiente (produzione/staging)
6. API key prefix (primi 12 caratteri)

---

## 📅 Changelog

### 2025-11-02
- ✅ Documentazione tecnica completa ProhMed API
- ✅ Esempi integrazione React Native e Flutter
- ✅ Sezione FAQ e troubleshooting
- ✅ Script testing automatico

---

**Ultimo aggiornamento**: 2 Novembre 2025  
**Versione API**: 1.0
