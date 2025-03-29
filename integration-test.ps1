# ================================================================
# KONFIGURATION
# ================================================================

# API-Basis-URL (anpassbar)
$API_BASE_URL = "http://localhost:3000/API/v1"

# Testdaten
$TEST_EMAIL = "test@example.com"
$TEST_PASSWORD = "Test@123"

# Protokollierung
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$LOG_DIR = "test-results"
$LOG_FILE = "$LOG_DIR\integration_test_$TIMESTAMP.log"
$ERROR_LOG = "$LOG_DIR\integration_errors_$TIMESTAMP.log"
$SUMMARY_FILE = "$LOG_DIR\test_summary_$TIMESTAMP.json"
$TEST_COUNT = 0
$PASS_COUNT = 0
$FAIL_COUNT = 0

# Testdaten für Benutzer
$NEW_USER = @{
  name = "Test User"
  email = "testuser-$TIMESTAMP@example.com"
  password = "Password@123"
  role = "employee"
} | ConvertTo-Json

# Authentifizierungstoken
$AUTH_TOKEN = ""

# ================================================================
# HILFSFUNKTIONEN
# ================================================================

# Verzeichnis für Protokolle erstellen
New-Item -ItemType Directory -Force -Path $LOG_DIR | Out-Null

# Protokollierung
function Write-Log {
    param (
        [string]$message
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $message"
    Write-Host $logMessage
    Add-Content -Path $LOG_FILE -Value $logMessage
}

# Fehler protokollieren
function Write-ErrorLog {
    param (
        [string]$message
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $errorMessage = "[$timestamp] ERROR: $message"
    Write-Host $errorMessage -ForegroundColor Red
    Add-Content -Path $LOG_FILE -Value $errorMessage
    Add-Content -Path $ERROR_LOG -Value $errorMessage
}

# Test-Endpunkt mit erwarteter Antwort
function Test-Endpoint {
    param (
        [string]$description,
        [string]$method,
        [string]$endpoint,
        [string]$data,
        [int]$expectedStatus,
        [bool]$tokenRequired = $true
    )
    
    $script:TEST_COUNT++
    
    # Header vorbereiten
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    # Authentifizierungstoken hinzufügen, wenn erforderlich
    if ($tokenRequired -and $AUTH_TOKEN) {
        $headers["Authorization"] = "Bearer $AUTH_TOKEN"
    }
    
    # Anfrage vorbereiten
    $params = @{
        Method = $method
        Uri = "$API_BASE_URL$endpoint"
        Headers = $headers
        ContentType = "application/json"
    }
    
    # Daten für die Anfrage hinzufügen, wenn vorhanden
    if ($data) {
        $params["Body"] = $data
    }
    
    # Befehl für Protokollierung
    $cmdLog = "Invoke-RestMethod -Method $method -Uri '$API_BASE_URL$endpoint' -Headers $($headers | ConvertTo-Json -Compress)"
    if ($data) {
        $cmdLog += " -Body '$data'"
    }
    
    Write-Log "TEST $TEST_COUNT: $description ($method $endpoint)"
    Write-Log "REQUEST: $cmdLog"
    
    # Anfrage ausführen und Zeit messen
    $startTime = Get-Date
    
    try {
        $response = Invoke-WebRequest @params -SkipHttpErrorCheck
        $statusCode = $response.StatusCode
        $responseContent = $response.Content
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $responseContent = $_.ErrorDetails.Message
    }
    
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    # Protokollierung der Antwort
    Write-Log "RESPONSE: ($statusCode) $responseContent"
    Write-Log "DURATION: ${duration}s"
    
    # Statuscode überprüfen
    if ($statusCode -eq $expectedStatus) {
        Write-Log "RESULT: PASSED ✓"
        $script:PASS_COUNT++
        return $true, $responseContent
    }
    else {
        Write-Log "RESULT: FAILED ✗ - Expected status $expectedStatus, got $statusCode"
        Write-ErrorLog "Test failed: $description - Expected status $expectedStatus, got $statusCode"
        $script:FAIL_COUNT++
        return $false, $responseContent
    }
}

# Zusammenfassung generieren
function Generate-Summary {
    param (
        [double]$totalDuration
    )
    
    $summary = @{
        timestamp = (Get-Date -Format "o")
        total_tests = $TEST_COUNT
        passed = $PASS_COUNT
        failed = $FAIL_COUNT
        duration_seconds = [math]::Round($totalDuration, 2)
    } | ConvertTo-Json
    
    Set-Content -Path $SUMMARY_FILE -Value $summary
    
    Write-Log "TEST SUMMARY: Total: $TEST_COUNT | Passed: $PASS_COUNT | Failed: $FAIL_COUNT | Duration: $([math]::Round($totalDuration, 2))s"
    
    if ($FAIL_COUNT -eq 0) {
        Write-Log "ALL TESTS PASSED ✓"
    }
    else {
        Write-Log "TESTS FAILED ✗ - Check $ERROR_LOG for details"
    }
}

# ================================================================
# TEST AUSFÜHRUNG
# ================================================================

$START_TIME = Get-Date

Write-Log "INTEGRATION TEST STARTED"
Write-Log "API BASE URL: $API_BASE_URL"

# ----------------------------------------------------------------
# AUTHENTIFIZIERUNG
# ----------------------------------------------------------------

Write-Log "STEP: Authentifizierung durchführen"

$AUTH_DATA = @{
    email = $TEST_EMAIL
    password = $TEST_PASSWORD
} | ConvertTo-Json

# Die richtige Login-Route ist /login (nicht /auth/login)
$authResult, $authResponse = Test-Endpoint "Login" "POST" "/login" $AUTH_DATA 200 $false

if ($authResult) {
    try {
        $authResponseObj = $authResponse | ConvertFrom-Json
        $AUTH_TOKEN = $authResponseObj.token
        
        if (-not $AUTH_TOKEN) {
            Write-ErrorLog "Token konnte nicht aus der Antwort extrahiert werden"
            exit 1
        }
        else {
            Write-Log "Authentifizierung erfolgreich, Token erhalten"
        }
    }
    catch {
        Write-ErrorLog "Fehler beim Parsen der Antwort: $_"
        exit 1
    }
}
else {
    Write-ErrorLog "Authentifizierung fehlgeschlagen, Tests werden abgebrochen"
    exit 1
}

# ----------------------------------------------------------------
# PROFIL-TESTS
# ----------------------------------------------------------------

Write-Log "STEP: Profil-Tests"

# Mein Profil abrufen (korrigierter Endpunkt)
Test-Endpoint "Mein Profil abrufen" "GET" "/profile/me" "" 200

# ----------------------------------------------------------------
# BENUTZER-TESTS (Nur als Admin möglich)
# ----------------------------------------------------------------

Write-Log "STEP: Benutzer-Tests"

# Alle Benutzer abrufen
$usersResult, $usersResponse = Test-Endpoint "Alle Benutzer abrufen" "GET" "/users" "" 200

# Neuen Benutzer erstellen
$createResult, $createResponse = Test-Endpoint "Benutzer erstellen" "POST" "/users" $NEW_USER 201

if ($createResult) {
    try {
        $createResponseObj = $createResponse | ConvertFrom-Json
        $USER_ID = $createResponseObj.id
        
        if ($USER_ID) {
            Write-Log "Benutzer erstellt mit ID: $USER_ID"
            
            # Benutzer nach ID abrufen
            Test-Endpoint "Benutzer nach ID abrufen" "GET" "/users/$USER_ID" "" 200
            
            # Benutzer aktualisieren
            $UPDATE_USER = @{
                name = "Updated Test User"
            } | ConvertTo-Json
            
            Test-Endpoint "Benutzer aktualisieren" "PUT" "/users/$USER_ID" $UPDATE_USER 200
            
            # Benutzer löschen
            Test-Endpoint "Benutzer löschen" "DELETE" "/users/$USER_ID" "" 200
        }
        else {
            Write-ErrorLog "Benutzer-ID konnte nicht aus der Antwort extrahiert werden"
        }
    }
    catch {
        Write-ErrorLog "Fehler beim Parsen der Antwort: $_"
    }
}

# ----------------------------------------------------------------
# KUNDEN-TESTS
# ----------------------------------------------------------------

Write-Log "STEP: Kunden-Tests"

# Alle Kunden abrufen
Test-Endpoint "Alle Kunden abrufen" "GET" "/customers" "" 200

# Neuen Kunden erstellen
$NEW_CUSTOMER = @{
    name = "Test Customer"
    email = "customer-$TIMESTAMP@example.com"
    phone = "+43123456789"
    type = "business"
} | ConvertTo-Json

$customerResult, $customerResponse = Test-Endpoint "Kunden erstellen" "POST" "/customers" $NEW_CUSTOMER 201

if ($customerResult) {
    try {
        $customerResponseObj = $customerResponse | ConvertFrom-Json
        $CUSTOMER_ID = $customerResponseObj.id
        
        if ($CUSTOMER_ID) {
            Write-Log "Kunde erstellt mit ID: $CUSTOMER_ID"
            
            # Kunde nach ID abrufen
            Test-Endpoint "Kunde nach ID abrufen" "GET" "/customers/$CUSTOMER_ID" "" 200
            
            # Kunde aktualisieren
            $UPDATE_CUSTOMER = @{
                name = "Updated Test Customer"
            } | ConvertTo-Json
            
            Test-Endpoint "Kunde aktualisieren" "PUT" "/customers/$CUSTOMER_ID" $UPDATE_CUSTOMER 200
            
            # Kunde löschen
            Test-Endpoint "Kunde löschen" "DELETE" "/customers/$CUSTOMER_ID" "" 200
        }
        else {
            Write-ErrorLog "Kunden-ID konnte nicht aus der Antwort extrahiert werden"
        }
    }
    catch {
        Write-ErrorLog "Fehler beim Parsen der Antwort: $_"
    }
}

# ----------------------------------------------------------------
# BENACHRICHTIGUNGS-TESTS
# ----------------------------------------------------------------

Write-Log "STEP: Benachrichtigungs-Tests"

# Alle Benachrichtigungen abrufen
Test-Endpoint "Alle Benachrichtigungen abrufen" "GET" "/notifications" "" 200

# ----------------------------------------------------------------
# ANFORDERUNGS-TESTS
# ----------------------------------------------------------------

Write-Log "STEP: Anforderungs-Tests"

# Alle Anforderungen abrufen
Test-Endpoint "Alle Anforderungen abrufen" "GET" "/requests" "" 200

# Teste eine öffentliche Anforderung
$NEW_REQUEST = @{
    name = "Test Contact"
    email = "contact-$TIMESTAMP@example.com"
    phone = "+43123456789"
    service = "Support"
    message = "Dies ist eine Testanfrage"
} | ConvertTo-Json

# Öffentliche Anfrage (rate-limited, also vielleicht nur einmal testen)
Test-Endpoint "Öffentliche Anfrage senden" "POST" "/requests/public" $NEW_REQUEST 201 $false

# ----------------------------------------------------------------
# ABSCHLUSS UND ZUSAMMENFASSUNG
# ----------------------------------------------------------------

$END_TIME = Get-Date
$TOTAL_DURATION = ($END_TIME - $START_TIME).TotalSeconds

Write-Log "INTEGRATION TEST COMPLETED"
Generate-Summary $TOTAL_DURATION

# Exit-Code basierend auf Testergebnissen
if ($FAIL_COUNT -eq 0) {
    exit 0
}
else {
    exit 1
}
