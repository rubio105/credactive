# Fix Errore Twilio Video: "Invalid Access Token issuer/subject"

## 🔴 Problema

Quando provi ad accedere al teleconsulto, vedi l'errore:
```
Errore di connessione
Invalid Access Token issuer/subject
```

## 🎯 Causa

L'errore si verifica quando le credenziali Twilio Video **non sono configurate correttamente** in produzione. 

**Importante**: Per Twilio Video servono **API Keys specifiche**, non le credenziali base (Account SID + Auth Token) usate per SMS/WhatsApp!

## ✅ Soluzione

### Passo 1: Crea API Keys per Twilio Video

1. Accedi alla [Twilio Console](https://console.twilio.com/)
2. Vai a **Account** → **API keys & tokens**
3. Clicca su **Create API key**
4. Compila:
   - **Friendly name**: `CIRY Video API Key`
   - **Key type**: Seleziona **Standard**
5. Clicca **Create API Key**
6. **IMPORTANTE**: Copia subito le credenziali (non potrai più vederle dopo):
   - **SID** (inizia con `SK...`)
   - **Secret** (stringa lunga alfanumerica)

### Passo 2: Configura le Variabili d'Ambiente in Produzione

Connettiti al server di produzione:

```bash
ssh root@157.180.21.147
cd /var/www/credactive
```

Modifica il file `.env`:

```bash
nano .env
```

Assicurati che ci siano queste variabili (aggiungi o modifica):

```bash
# Twilio Account (già presente per SMS/WhatsApp)
TWILIO_ACCOUNT_SID=AC...  # Account SID principale (inizia con AC)

# Twilio Video API Keys (NUOVE - da aggiungere)
TWILIO_API_KEY_SID=SK...  # API Key SID (inizia con SK)
TWILIO_API_KEY_SECRET=...  # API Key Secret (stringa lunga)
```

**Nota**: 
- `TWILIO_ACCOUNT_SID` è il tuo Account SID principale (quello che già usi per SMS)
- `TWILIO_API_KEY_SID` e `TWILIO_API_KEY_SECRET` sono le nuove credenziali create al Passo 1

Salva e esci (CTRL+X, poi Y, poi ENTER)

### Passo 3: Riavvia l'Applicazione

```bash
pm2 restart credactive
```

Verifica che sia tutto ok:

```bash
pm2 logs credactive --lines 50
```

Dovresti vedere:
```
[Twilio Video] Using credentials from env vars
```

### Passo 4: Testa il Teleconsulto

1. Accedi come medico
2. Vai su **Appuntamenti**
3. Clicca su **Avvia Videochiamata** per un appuntamento
4. Dovresti vedere "Connesso" invece dell'errore

## 🔍 Verifica Credenziali

Se continui ad avere problemi, verifica che le credenziali siano corrette:

```bash
# Sul server
cd /var/www/credactive
grep TWILIO .env
```

Dovresti vedere qualcosa tipo:
```
TWILIO_ACCOUNT_SID=AC1234567890abcdef...
TWILIO_AUTH_TOKEN=1234567890abcdef...
TWILIO_API_KEY_SID=SK1234567890abcdef...
TWILIO_API_KEY_SECRET=abc123def456ghi789...
TWILIO_PHONE_NUMBER=whatsapp:+...
```

## 📚 Riferimenti

- [Twilio Video Quickstart](https://www.twilio.com/docs/video/javascript-getting-started)
- [Twilio API Keys](https://www.twilio.com/docs/iam/api-keys)

## ⚠️ Note Importanti

1. **Non confondere** le credenziali:
   - SMS/WhatsApp usa: Account SID + Auth Token
   - Video usa: Account SID + API Key SID + API Key Secret

2. **Sicurezza**: Non condividere mai le API Keys. Sono come password!

3. **Backup**: Salva le credenziali in un posto sicuro (1Password, LastPass, etc.)
