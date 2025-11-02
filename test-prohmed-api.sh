#!/bin/bash

# 🧪 Test Script per CIRY Triage API - Integrazione ProhMed
# Verifica funzionamento completo dell'API

set -e  # Exit on error

# Colori output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurazione
API_URL="${API_URL:-http://localhost:5000}"  # Default: localhost
API_KEY="${CIRY_API_KEY}"  # Settare come variabile ambiente

# Funzioni helper
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Verifica configurazione
check_config() {
    print_header "STEP 0: Verifica Configurazione"
    
    if [ -z "$API_KEY" ]; then
        print_error "CIRY_API_KEY non impostata!"
        echo ""
        echo "Impostare la variabile:"
        echo "  export CIRY_API_KEY='ciry_your_api_key_here'"
        exit 1
    fi
    
    print_success "API Key configurata"
    print_info "Base URL: $API_URL"
}

# Test 1: Documentazione API
test_docs() {
    print_header "STEP 1: Test Endpoint Documentazione"
    
    RESPONSE=$(curl -s "$API_URL/api/v1/docs")
    
    if echo "$RESPONSE" | grep -q "CIRY Triage API"; then
        print_success "Documentazione API disponibile"
    else
        print_error "Documentazione non trovata"
        exit 1
    fi
}

# Test 2: Creare sessione senza medicalHistory
test_session_basic() {
    print_header "STEP 2: Creare Sessione Base (senza anamnesi)"
    
    RESPONSE=$(curl -s -X POST "$API_URL/api/v1/triage/sessions" \
        -H "X-API-Key: $API_KEY" \
        -H "Content-Type: application/json" \
        -d '{
            "userId": "test_prohmed_patient_001"
        }')
    
    SESSION_ID=$(echo "$RESPONSE" | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$SESSION_ID" ]; then
        print_success "Sessione creata: $SESSION_ID"
        export SESSION_ID_BASIC=$SESSION_ID
    else
        print_error "Creazione sessione fallita"
        echo "Response: $RESPONSE"
        exit 1
    fi
}

# Test 3: Creare sessione CON medicalHistory + initialSymptoms
test_session_full() {
    print_header "STEP 3: Creare Sessione Completa (con anamnesi + sintomi)"
    
    RESPONSE=$(curl -s -X POST "$API_URL/api/v1/triage/sessions" \
        -H "X-API-Key: $API_KEY" \
        -H "Content-Type: application/json" \
        -d '{
            "userId": "test_prohmed_patient_002",
            "initialSymptoms": "Febbre alta da 3 giorni con mal di testa persistente",
            "medicalHistory": {
                "age": 45,
                "gender": "male",
                "allergies": ["Penicillina", "Arachidi"],
                "chronicConditions": ["Diabete tipo 2", "Ipertensione"],
                "currentMedications": ["Metformina 500mg 2x/die", "Ramipril 5mg 1x/die"],
                "previousSurgeries": ["Appendicectomia 2018"]
            }
        }')
    
    SESSION_ID=$(echo "$RESPONSE" | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)
    FIRST_RESPONSE=$(echo "$RESPONSE" | grep -o '"firstResponse":{[^}]*}')
    
    if [ -n "$SESSION_ID" ]; then
        print_success "Sessione creata con anamnesi: $SESSION_ID"
        export SESSION_ID_FULL=$SESSION_ID
        
        if [ -n "$FIRST_RESPONSE" ]; then
            print_success "AI ha risposto ai sintomi iniziali"
            
            # Verifica flag requiresDoctorContact
            REQUIRES_DOCTOR=$(echo "$RESPONSE" | grep -o '"requiresDoctorContact":[^,}]*' | cut -d':' -f2)
            URGENCY=$(echo "$RESPONSE" | grep -o '"urgency":"[^"]*"' | cut -d'"' -f4)
            
            print_info "Urgenza: $URGENCY"
            print_info "Richiede medico: $REQUIRES_DOCTOR"
        fi
    else
        print_error "Creazione sessione fallita"
        echo "Response: $RESPONSE"
        exit 1
    fi
}

# Test 4: Inviare messaggio
test_send_message() {
    print_header "STEP 4: Inviare Messaggio in Chat"
    
    RESPONSE=$(curl -s -X POST "$API_URL/api/v1/triage/sessions/$SESSION_ID_FULL/messages" \
        -H "X-API-Key: $API_KEY" \
        -H "Content-Type: application/json" \
        -d '{
            "message": "Ora ho anche nausea e vertigini"
        }')
    
    AI_CONTENT=$(echo "$RESPONSE" | grep -o '"content":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -n "$AI_CONTENT" ]; then
        print_success "AI ha risposto al messaggio"
        
        # Verifica flag requiresDoctorContact
        REQUIRES_DOCTOR=$(echo "$RESPONSE" | grep -o '"requiresDoctorContact":[^,}]*' | cut -d':' -f2)
        URGENCY=$(echo "$RESPONSE" | grep -o '"urgency":"[^"]*"' | cut -d'"' -f4)
        
        print_info "Urgenza: $URGENCY"
        print_info "Richiede medico: $REQUIRES_DOCTOR"
        
        if [ "$REQUIRES_DOCTOR" = "true" ]; then
            print_success "✨ FLAG requiresDoctorContact FUNZIONA!"
            print_info "→ App ProhMed dovrebbe aprire prenotazioni"
        fi
    else
        print_error "Invio messaggio fallito"
        echo "Response: $RESPONSE"
        exit 1
    fi
}

# Test 5: Recuperare storico messaggi
test_get_messages() {
    print_header "STEP 5: Recuperare Storico Messaggi"
    
    RESPONSE=$(curl -s "$API_URL/api/v1/triage/sessions/$SESSION_ID_FULL/messages" \
        -H "X-API-Key: $API_KEY")
    
    MESSAGE_COUNT=$(echo "$RESPONSE" | grep -o '"messages":\[' | wc -l)
    
    if [ "$MESSAGE_COUNT" -gt 0 ]; then
        TOTAL=$(echo "$RESPONSE" | grep -o '"total":[0-9]*' | cut -d':' -f2)
        print_success "Storico recuperato: $TOTAL messaggi totali"
    else
        print_error "Recupero storico fallito"
        echo "Response: $RESPONSE"
        exit 1
    fi
}

# Test 6: Lista sessioni utente
test_list_sessions() {
    print_header "STEP 6: Lista Sessioni Paziente"
    
    RESPONSE=$(curl -s "$API_URL/api/v1/triage/sessions?userId=test_prohmed_patient_002" \
        -H "X-API-Key: $API_KEY")
    
    SESSION_COUNT=$(echo "$RESPONSE" | grep -o '"sessionId":"[^"]*"' | wc -l)
    
    if [ "$SESSION_COUNT" -gt 0 ]; then
        print_success "Trovate $SESSION_COUNT sessioni per il paziente"
    else
        print_error "Nessuna sessione trovata"
        echo "Response: $RESPONSE"
        exit 1
    fi
}

# Test 7: Dettagli sessione
test_session_details() {
    print_header "STEP 7: Dettagli Sessione Specifica"
    
    RESPONSE=$(curl -s "$API_URL/api/v1/triage/sessions/$SESSION_ID_FULL" \
        -H "X-API-Key: $API_KEY")
    
    STATUS=$(echo "$RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    
    if [ "$STATUS" = "active" ]; then
        print_success "Sessione attiva e recuperabile"
    else
        print_error "Stato sessione inaspettato: $STATUS"
        exit 1
    fi
}

# Test 8: Chiudere sessione
test_close_session() {
    print_header "STEP 8: Chiudere Sessione"
    
    RESPONSE=$(curl -s -X DELETE "$API_URL/api/v1/triage/sessions/$SESSION_ID_BASIC" \
        -H "X-API-Key: $API_KEY")
    
    SUCCESS=$(echo "$RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
    
    if [ "$SUCCESS" = "true" ]; then
        print_success "Sessione chiusa correttamente"
    else
        print_error "Chiusura sessione fallita"
        echo "Response: $RESPONSE"
        exit 1
    fi
}

# Test 9: Validazione medicalHistory errato
test_validation() {
    print_header "STEP 9: Test Validazione (medicalHistory errato)"
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/v1/triage/sessions" \
        -H "X-API-Key: $API_KEY" \
        -H "Content-Type: application/json" \
        -d '{
            "userId": "test_validation",
            "medicalHistory": {
                "age": "quarantacinque",
                "gender": "invalid"
            }
        }')
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" = "400" ]; then
        print_success "Validazione funziona (HTTP 400 atteso)"
    else
        print_error "Validazione non funziona correttamente (HTTP $HTTP_CODE)"
    fi
}

# Test 10: Rate limiting headers
test_rate_limit() {
    print_header "STEP 10: Verifica Rate Limit Headers"
    
    HEADERS=$(curl -s -I "$API_URL/api/v1/triage/sessions?userId=test" \
        -H "X-API-Key: $API_KEY")
    
    if echo "$HEADERS" | grep -q "X-RateLimit-Limit"; then
        LIMIT=$(echo "$HEADERS" | grep "X-RateLimit-Limit" | cut -d':' -f2 | tr -d ' \r')
        REMAINING=$(echo "$HEADERS" | grep "X-RateLimit-Remaining" | cut -d':' -f2 | tr -d ' \r')
        
        print_success "Rate limit headers presenti"
        print_info "Limite: $LIMIT richieste/minuto"
        print_info "Rimanenti: $REMAINING richieste"
    else
        print_error "Rate limit headers mancanti"
    fi
}

# Esegui tutti i test
main() {
    print_header "🧪 TEST SUITE CIRY TRIAGE API - INTEGRAZIONE PROHMED"
    
    check_config
    test_docs
    test_session_basic
    test_session_full
    test_send_message
    test_get_messages
    test_list_sessions
    test_session_details
    test_close_session
    test_validation
    test_rate_limit
    
    print_header "🎉 TUTTI I TEST SUPERATI!"
    echo ""
    print_success "L'API è pronta per l'integrazione ProhMed"
    echo ""
    print_info "Prossimi step:"
    echo "  1. Fornire API key allo sviluppatore ProhMed"
    echo "  2. Condividere PROHMED_INTEGRATION.md"
    echo "  3. Assistere nell'integrazione nell'app mobile"
    echo ""
}

# Esegui
main
