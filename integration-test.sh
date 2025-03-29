#!/bin/bash

# ================================================================
# KONFIGURATION
# ================================================================

# API-Basis-URL (anpassbar)
API_BASE_URL="http://localhost:3000/API/v1"

# Testdaten
TEST_EMAIL="test@example.com"
TEST_PASSWORD="Test@123"

# Protokollierung
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_DIR="test-results"
LOG_FILE="$LOG_DIR/integration_test_$TIMESTAMP.log"
ERROR_LOG="$LOG_DIR/integration_errors_$TIMESTAMP.log"
SUMMARY_FILE="$LOG_DIR/test_summary_$TIMESTAMP.json"
TEST_COUNT=0
PASS_COUNT=0
FAIL_COUNT=0

# Testdaten für Benutzer
NEW_USER='{
  "name": "Test User",
  "email": "testuser-'$TIMESTAMP'@example.com",
  "password": "Password@123",
  "role": "employee"
}'

# Authentifizierungstoken
AUTH_TOKEN=""

# ================================================================
# HILFSFUNKTIONEN
# ================================================================

# Verzeichnis für Protokolle erstellen
mkdir -p "$LOG_DIR"

# Protokollierung
log() {
  local message="[$(date +"%Y-%m-%d %H:%M:%S")] $1"
  echo "$message" | tee -a "$LOG_FILE"
}

# Fehler protokollieren
log_error() {
  local message="[$(date +"%Y-%m-%d %H:%M:%S")] ERROR: $1"
  echo "$message" | tee -a "$LOG_FILE" | tee -a "$ERROR_LOG"
}

# Test-Endpunkt mit erwarteter Antwort
test_endpoint() {
  local description="$1"
  local method="$2"
  local endpoint="$3"
  local data="$4"
  local expected_status="$5"
  local token_required="${6:-true}"
  
  TEST_COUNT=$((TEST_COUNT + 1))
  
  # Header vorbereiten
  local headers=(-H "Content-Type: application/json")
  
  # Authentifizierungstoken hinzufügen, wenn erforderlich
  if [ "$token_required" = true ] && [ -n "$AUTH_TOKEN" ]; then
    headers+=(-H "Authorization: Bearer $AUTH_TOKEN")
  fi
  
  # Daten für die Anfrage vorbereiten
  local data_param=""
  if [ -n "$data" ]; then
    data_param=(-d "$data")
  fi
  
  # curl-Befehl vorbereiten (für Protokollierung)
  local curl_cmd="curl -s -X $method \"$API_BASE_URL$endpoint\" ${headers[@]} ${data_param[@]}"
  
  log "TEST $TEST_COUNT: $description ($method $endpoint)"
  log "REQUEST: $curl_cmd"
  
  # Anfrage ausführen und Zeit messen
  local start_time=$(date +%s.%N)
  local http_response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_BASE_URL$endpoint" "${headers[@]}" "${data_param[@]}")
  local end_time=$(date +%s.%N)
  local duration=$(echo "$end_time - $start_time" | bc)
  
  # HTTP-Statuscode und Antwort trennen
  local status_code=$(echo "$http_response" | tail -n1)
  local response=$(echo "$http_response" | sed '$d')
  
  # Protokollierung der Antwort
  log "RESPONSE: ($status_code) $response"
  log "DURATION: ${duration}s"
  
  # Statuscode überprüfen
  if [ "$status_code" -eq "$expected_status" ]; then
    log "RESULT: PASSED ✓"
    PASS_COUNT=$((PASS_COUNT + 1))
    echo "$response"
    return 0
  else
    log "RESULT: FAILED ✗ - Expected status $expected_status, got $status_code"
    log_error "Test failed: $description - Expected status $expected_status, got $status_code"
    FAIL_COUNT=$((FAIL_COUNT + 1))
    echo "$response"
    return 1
  fi
}

# JSON-Antwort extrahieren
extract_json_value() {
  local json="$1"
  local key="$2"
  echo "$json" | grep -o "\"$key\":[^,}]*" | sed 's/"'$key'"://g' | sed 's/"//g' | sed 's/}//g' | sed 's/\[//g' | sed 's/\]//g' | tr -d ' '
}

# Zusammenfassung generieren
generate_summary() {
  echo "{
  \"timestamp\": \"$(date -Iseconds)\",
  \"total_tests\": $TEST_COUNT,
  \"passed\": $PASS_COUNT,
  \"failed\": $FAIL_COUNT,
  \"duration_seconds\": $TOTAL_DURATION
}" > "$SUMMARY_FILE"

  log "TEST SUMMARY: Total: $TEST_COUNT | Passed: $PASS_COUNT | Failed: $FAIL_COUNT | Duration: ${TOTAL_DURATION}s"
  
  if [ $FAIL_COUNT -eq 0 ]; then
    log "ALL TESTS PASSED ✓"
  else
    log "TESTS FAILED ✗ - Check $ERROR_LOG for details"
  fi
}

# ================================================================
# TEST AUSFÜHRUNG
# ================================================================

START_TIME=$(date +%s.%N)

log "INTEGRATION TEST STARTED"
log "API BASE URL: $API_BASE_URL"

# ----------------------------------------------------------------
# AUTHENTIFIZIERUNG
# ----------------------------------------------------------------

log "STEP: Authentifizierung durchführen"

AUTH_DATA="{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}"

# Die korrekte Login-Route ist /login (nicht /auth/login)
AUTH_RESPONSE=$(test_endpoint "Login" "POST" "/login" "$AUTH_DATA" 200 false)

# Erfolg überprüfen
if [ $? -eq 0 ]; then
  # JWT-Token extrahieren
  AUTH_TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"token":"[^"]*' | sed 's/"token":"//g')
  
  if [ -z "$AUTH_TOKEN" ]; then
    log_error "Token konnte nicht aus der Antwort extrahiert werden"
    exit 1
  else
    log "Authentifizierung erfolgreich, Token erhalten"
  fi
else
  log_error "Authentifizierung fehlgeschlagen, Tests werden abgebrochen"
  exit 1
fi

# ----------------------------------------------------------------
# PROFIL-TESTS
# ----------------------------------------------------------------

log "STEP: Profil-Tests"

# Korrekter Endpunkt für Profil ist /profile/me
test_endpoint "Mein Profil abrufen" "GET" "/profile/me" "" 200

# ----------------------------------------------------------------
# BENUTZER-TESTS
# ----------------------------------------------------------------

log "STEP: Benutzer-Tests"

# Alle Benutzer abrufen
USERS_RESPONSE=$(test_endpoint "Alle Benutzer abrufen" "GET" "/users" "" 200)

# Neuen Benutzer erstellen
CREATE_RESPONSE=$(test_endpoint "Benutzer erstellen" "POST" "/users" "$NEW_USER" 201)

# Erfolg überprüfen
if [ $? -eq 0 ]; then
  # ID des erstellten Benutzers extrahieren
  USER_ID=$(extract_json_value "$CREATE_RESPONSE" "id")
  
  if [ -n "$USER_ID" ]; then
    log "Benutzer erstellt mit ID: $USER_ID"
    
    # Benutzer nach ID abrufen
    test_endpoint "Benutzer nach ID abrufen" "GET" "/users/$USER_ID" "" 200
    
    # Benutzer aktualisieren
    UPDATE_USER="{\"name\":\"Updated Test User\"}"
    test_endpoint "Benutzer aktualisieren" "PUT" "/users/$USER_ID" "$UPDATE_USER" 200
    
    # Benutzer löschen
    test_endpoint "Benutzer löschen" "DELETE" "/users/$USER_ID" "" 200
  else
    log_error "Benutzer-ID konnte nicht aus der Antwort extrahiert werden"
  fi
fi

# ----------------------------------------------------------------
# KUNDEN-TESTS
# ----------------------------------------------------------------

log "STEP: Kunden-Tests"

# Alle Kunden abrufen
test_endpoint "Alle Kunden abrufen" "GET" "/customers" "" 200

# Neuen Kunden erstellen
NEW_CUSTOMER='{
  "name": "Test Customer",
  "email": "customer-'$TIMESTAMP'@example.com",
  "phone": "+43123456789",
  "type": "business"
}'

CUSTOMER_RESPONSE=$(test_endpoint "Kunden erstellen" "POST" "/customers" "$NEW_CUSTOMER" 201)

# Erfolg überprüfen
if [ $? -eq 0 ]; then
  # ID des erstellten Kunden extrahieren
  CUSTOMER_ID=$(extract_json_value "$CUSTOMER_RESPONSE" "id")
  
  if [ -n "$CUSTOMER_ID" ]; then
    log "Kunde erstellt mit ID: $CUSTOMER_ID"
    
    # Kunde nach ID abrufen
    test_endpoint "Kunde nach ID abrufen" "GET" "/customers/$CUSTOMER_ID" "" 200
    
    # Kunde aktualisieren
    UPDATE_CUSTOMER="{\"name\":\"Updated Test Customer\"}"
    test_endpoint "Kunde aktualisieren" "PUT" "/customers/$CUSTOMER_ID" "$UPDATE_CUSTOMER" 200
    
    # Kunde löschen
    test_endpoint "Kunde löschen" "DELETE" "/customers/$CUSTOMER_ID" "" 200
  else
    log_error "Kunden-ID konnte nicht aus der Antwort extrahiert werden"
  fi
fi

# ----------------------------------------------------------------
# BENACHRICHTIGUNGS-TESTS
# ----------------------------------------------------------------

log "STEP: Benachrichtigungs-Tests"

# Alle Benachrichtigungen abrufen
test_endpoint "Alle Benachrichtigungen abrufen" "GET" "/notifications" "" 200

# ----------------------------------------------------------------
# ANFORDERUNGS-TESTS
# ----------------------------------------------------------------

log "STEP: Anforderungs-Tests"

# Alle Anforderungen abrufen
test_endpoint "Alle Anforderungen abrufen" "GET" "/requests" "" 200

# Eine öffentliche Anforderung senden
NEW_REQUEST='{
  "name": "Test Contact",
  "email": "contact-'$TIMESTAMP'@example.com",
  "phone": "+43123456789",
  "service": "Support",
  "message": "Dies ist eine Testanfrage"
}'

# Öffentliche Anfrage (rate-limited, also vielleicht nur einmal testen)
test_endpoint "Öffentliche Anfrage senden" "POST" "/requests/public" "$NEW_REQUEST" 201 false

# ----------------------------------------------------------------
# ABSCHLUSS UND ZUSAMMENFASSUNG
# ----------------------------------------------------------------

END_TIME=$(date +%s.%N)
TOTAL_DURATION=$(echo "$END_TIME - $START_TIME" | bc)

log "INTEGRATION TEST COMPLETED"
generate_summary

# Exit-Code basierend auf Testergebnissen
if [ $FAIL_COUNT -eq 0 ]; then
  exit 0
else
  exit 1
fi
