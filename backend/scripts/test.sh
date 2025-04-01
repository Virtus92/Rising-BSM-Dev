#!/bin/bash

# Configuration
BASE_URL="http://localhost:3000/api"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="AdminPass123!"
TEST_USER_EMAIL="testuser_$(date +%s)@example.com"
TEST_CUSTOMER_EMAIL="testcustomer_$(date +%s)@example.com"
TEST_REQUEST_EMAIL="testrequest_$(date +%s)@example.com"

# Helper functions
log_success() {
  echo -e "\033[32m✓ $1\033[0m"
}

log_failure() {
  echo -e "\033[31m✗ $1\033[0m"
  FAILED_TESTS=$((FAILED_TESTS + 1))
}

log_info() {
  echo -e "\033[34mℹ $1\033[0m"
}

validate_response() {
  local response="$1"
  local expected_code="$2"
  local jq_path="$3"
  local expected_value="$4"
  
  # Extract HTTP status code
  code=$(echo "$response" | grep -oP '(?<=HTTP\/[0-9.]\s)[0-9]{3}' | tail -1)
  if [ "$code" != "$expected_code" ]; then
    log_failure "Expected status $expected_code but got $code"
    echo "Response: $response"
    return 1
  fi
  
  # Check JSON response if jq path is provided
  if [ -n "$jq_path" ]; then
    body=$(echo "$response" | awk '/^{/,0')
    if ! echo "$body" | jq -e . >/dev/null 2>&1; then
      log_failure "Invalid JSON response"
      echo "Response: $body"
      return 1
    fi
    
    actual_value=$(echo "$body" | jq -r "$jq_path")
    
    if [ -n "$expected_value" ] && [ "$actual_value" != "$expected_value" ]; then
      log_failure "Expected $jq_path to be '$expected_value' but got '$actual_value'"
      echo "Full response: $body"
      return 1
    fi
  fi
  
  return 0
}

# Initialize counters
TOTAL_TESTS=0
FAILED_TESTS=0

# Cleanup function
cleanup() {
  log_info "Starting cleanup..."
  
  # Delete test customer if exists
  if [ -n "$CUSTOMER_ID" ]; then
    log_info "Deleting test customer (hard delete)..."
    curl -s -X DELETE "$BASE_URL/customers/$CUSTOMER_ID?mode=hard" \
      -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null
  fi
  
  # Delete test user if exists
  if [ -n "$USER_ID" ]; then
    log_info "Deleting test user..."
    curl -s -X DELETE "$BASE_URL/users/$USER_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null
  fi
  
  # Delete test appointment if exists
  if [ -n "$APPOINTMENT_ID" ]; then
    log_info "Deleting test appointment..."
    curl -s -X DELETE "$BASE_URL/appointments/$APPOINTMENT_ID" \
      -H "Authorization: Bearer $USER_TOKEN" > /dev/null
  fi
  
  # Delete test request if exists
  if [ -n "$REQUEST_ID" ]; then
    log_info "Deleting test request..."
    curl -s -X DELETE "$BASE_URL/requests/$REQUEST_ID" \
      -H "Authorization: Bearer $USER_TOKEN" > /dev/null
  fi
}

# Trap for cleanup on exit
trap cleanup EXIT

# 1. Authentication Tests
log_info "=== AUTHENTICATION TESTS ==="

# Admin login
log_info "Admin login..."
ADMIN_AUTH_RESPONSE=$(curl -s -i -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")
TOTAL_TESTS=$((TOTAL_TESTS + 1))

ADMIN_TOKEN=$(echo "$ADMIN_AUTH_RESPONSE" | awk '/^{/,0' | jq -r '.data.accessToken')
if validate_response "$ADMIN_AUTH_RESPONSE" "200" ".data.user.email" "$ADMIN_EMAIL"; then
  log_success "Admin authenticated successfully"
else
  log_failure "Admin authentication failed"
  exit 1
fi

# 2. User Management Tests
log_info "=== USER MANAGEMENT TESTS ==="

# Create test user
log_info "Creating test user..."
USER_CREATE_RESPONSE=$(curl -s -i -X POST "$BASE_URL/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_USER_EMAIL\",\"name\":\"Test User\",\"password\":\"TestPass123!\",\"role\":\"mitarbeiter\"}")
TOTAL_TESTS=$((TOTAL_TESTS + 1))

if validate_response "$USER_CREATE_RESPONSE" "201" ".data.email" "$TEST_USER_EMAIL"; then
  log_success "Test user created successfully"
  USER_ID=$(echo "$USER_CREATE_RESPONSE" | awk '/^{/,0' | jq -r '.data.id')
else
  log_failure "Test user creation failed"
fi

# Login as test user
log_info "Logging in as test user..."
USER_AUTH_RESPONSE=$(curl -s -i -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"TestPass123!\"}")
TOTAL_TESTS=$((TOTAL_TESTS + 1))

USER_TOKEN=$(echo "$USER_AUTH_RESPONSE" | awk '/^{/,0' | jq -r '.data.accessToken')
if validate_response "$USER_AUTH_RESPONSE" "200" ".data.user.email" "$TEST_USER_EMAIL"; then
  log_success "Test user authenticated successfully"
else
  log_failure "Test user authentication failed"
fi

# Get user profile
log_info "Getting test user profile..."
PROFILE_RESPONSE=$(curl -s -i -X GET "$BASE_URL/profile-me" \
  -H "Authorization: Bearer $USER_TOKEN")
TOTAL_TESTS=$((TOTAL_TESTS + 1))

if validate_response "$PROFILE_RESPONSE" "200" ".data.user.email" "$TEST_USER_EMAIL"; then
  log_success "Profile retrieval successful"
else
  log_failure "Profile retrieval failed"
fi

# Update user profile
log_info "Updating test user profile..."
PROFILE_UPDATE_RESPONSE=$(curl -s -i -X PUT "$BASE_URL/profile-me" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Updated Test User\",\"phone\":\"+1234567890\"}")
TOTAL_TESTS=$((TOTAL_TESTS + 1))

if validate_response "$PROFILE_UPDATE_RESPONSE" "200" ".data.user.name" "Updated Test User"; then
  log_success "Profile update successful"
else
  log_failure "Profile update failed"
fi

# 3. Contact Requests Tests
log_info "=== CONTACT REQUESTS TESTS ==="

# Create request
log_info "Creating contact request..."
REQUEST_CREATE_RESPONSE=$(curl -s -i -X POST "$BASE_URL/requests-public" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test Request\",\"email\":\"$TEST_REQUEST_EMAIL\",\"service\":\"facility\",\"message\":\"This is a test request\"}")
TOTAL_TESTS=$((TOTAL_TESTS + 1))

if validate_response "$REQUEST_CREATE_RESPONSE" "201" ".data.email" "$TEST_REQUEST_EMAIL"; then
  log_success "Contact request created successfully"
  REQUEST_ID=$(echo "$REQUEST_CREATE_RESPONSE" | awk '/^{/,0' | jq -r '.data.id')
else
  log_failure "Contact request creation failed"
fi

# Get request (as admin)
if [ -n "$REQUEST_ID" ]; then
  log_info "Getting contact request..."
  REQUEST_GET_RESPONSE=$(curl -s -i -X GET "$BASE_URL/requests/$REQUEST_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  if validate_response "$REQUEST_GET_RESPONSE" "200" ".data.email" "$TEST_REQUEST_EMAIL"; then
    log_success "Contact request retrieval successful"
  else
    log_failure "Contact request retrieval failed"
  fi
fi

# Update request status
if [ -n "$REQUEST_ID" ]; then
  log_info "Updating request status..."
  REQUEST_STATUS_RESPONSE=$(curl -s -i -X PATCH "$BASE_URL/requests/$REQUEST_ID-status" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"status\":\"in_bearbeitung\"}")
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  if validate_response "$REQUEST_STATUS_RESPONSE" "200" ".data.status" "in_bearbeitung"; then
    log_success "Request status update successful"
  else
    log_failure "Request status update failed"
  fi
fi

# Add note to request
if [ -n "$REQUEST_ID" ]; then
  log_info "Adding note to request..."
  REQUEST_NOTE_RESPONSE=$(curl -s -i -X POST "$BASE_URL/requests/$REQUEST_ID-notes" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"note\":\"This is a test note\"}")
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  if validate_response "$REQUEST_NOTE_RESPONSE" "201" ".data.text" "This is a test note"; then
    log_success "Request note added successfully"
  else
    log_failure "Request note addition failed"
  fi
fi

# 4. Customer Management Tests
log_info "=== CUSTOMER MANAGEMENT TESTS ==="

# Create customer
log_info "Creating test customer..."
CUSTOMER_CREATE_RESPONSE=$(curl -s -i -X POST "$BASE_URL/customers" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_CUSTOMER_EMAIL\",\"name\":\"Test Customer\",\"type\":\"private\",\"status\":\"active\"}")
TOTAL_TESTS=$((TOTAL_TESTS + 1))

if validate_response "$CUSTOMER_CREATE_RESPONSE" "201" ".data.email" "$TEST_CUSTOMER_EMAIL"; then
  log_success "Test customer created successfully"
  CUSTOMER_ID=$(echo "$CUSTOMER_CREATE_RESPONSE" | awk '/^{/,0' | jq -r '.data.id')
else
  log_failure "Test customer creation failed"
fi

# Get customer
if [ -n "$CUSTOMER_ID" ]; then
  log_info "Getting test customer..."
  CUSTOMER_GET_RESPONSE=$(curl -s -i -X GET "$BASE_URL/customers/$CUSTOMER_ID" \
    -H "Authorization: Bearer $USER_TOKEN")
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  if validate_response "$CUSTOMER_GET_RESPONSE" "200" ".data.id" "$CUSTOMER_ID"; then
    log_success "Customer retrieval successful"
  else
    log_failure "Customer retrieval failed"
  fi
fi

# Update customer
if [ -n "$CUSTOMER_ID" ]; then
  log_info "Updating test customer..."
  CUSTOMER_UPDATE_RESPONSE=$(curl -s -i -X PUT "$BASE_URL/customers/$CUSTOMER_ID" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Updated Customer\",\"phone\":\"+1234567890\"}")
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  if validate_response "$CUSTOMER_UPDATE_RESPONSE" "200" ".data.name" "Updated Customer"; then
    log_success "Customer update successful"
  else
    log_failure "Customer update failed"
  fi
fi

# Add customer note
if [ -n "$CUSTOMER_ID" ]; then
  log_info "Adding customer note..."
  CUSTOMER_NOTE_RESPONSE=$(curl -s -i -X POST "$BASE_URL/customers/$CUSTOMER_ID-notes" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"text\":\"Test customer note\",\"type\":\"general\"}")
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  if validate_response "$CUSTOMER_NOTE_RESPONSE" "201" ".data.message" "Note added successfully"; then
    log_success "Customer note added successfully"
  else
    log_failure "Customer note addition failed"
  fi
fi

# Update customer status
if [ -n "$CUSTOMER_ID" ]; then
  log_info "Updating customer status..."
  CUSTOMER_STATUS_RESPONSE=$(curl -s -i -X PATCH "$BASE_URL/customers/$CUSTOMER_ID-status" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"status\":\"inactive\"}")
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  if validate_response "$CUSTOMER_STATUS_RESPONSE" "200" ".data.status" "inactive"; then
    log_success "Customer status update successful"
  else
    log_failure "Customer status update failed"
  fi
fi

# Soft delete customer
if [ -n "$CUSTOMER_ID" ]; then
  log_info "Soft deleting customer..."
  CUSTOMER_DELETE_RESPONSE=$(curl -s -i -X DELETE "$BASE_URL/customers/$CUSTOMER_ID" \
    -H "Authorization: Bearer $USER_TOKEN")
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  if validate_response "$CUSTOMER_DELETE_RESPONSE" "200" ".data.success" "true"; then
    log_success "Customer soft delete successful"
    
    # Verify customer is soft deleted
    log_info "Verifying soft delete..."
    CUSTOMER_GET_DELETED_RESPONSE=$(curl -s -i -X GET "$BASE_URL/customers/$CUSTOMER_ID" \
      -H "Authorization: Bearer $USER_TOKEN")
    
    if validate_response "$CUSTOMER_GET_DELETED_RESPONSE" "404"; then
      log_success "Customer is correctly soft deleted"
    else
      log_failure "Customer soft delete verification failed"
    fi
  else
    log_failure "Customer soft delete failed"
  fi
fi

# 5. Appointment Tests
log_info "=== APPOINTMENT TESTS ==="

# Create appointment (with soft deleted customer)
if [ -n "$CUSTOMER_ID" ]; then
  log_info "Creating appointment..."
  APPOINTMENT_CREATE_RESPONSE=$(curl -s -i -X POST "$BASE_URL/appointments" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"Test Appointment\",\"customerId\":$CUSTOMER_ID,\"date\":\"2023-12-01\",\"time\":\"14:00\",\"status\":\"planned\"}")
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  if validate_response "$APPOINTMENT_CREATE_RESPONSE" "201" ".data.title" "Test Appointment"; then
    log_success "Appointment created successfully"
    APPOINTMENT_ID=$(echo "$APPOINTMENT_CREATE_RESPONSE" | awk '/^{/,0' | jq -r '.data.id')
  else
    log_failure "Appointment creation failed"
  fi
fi

# Update appointment
if [ -n "$APPOINTMENT_ID" ]; then
  log_info "Updating appointment..."
  APPOINTMENT_UPDATE_RESPONSE=$(curl -s -i -X PUT "$BASE_URL/appointments/$APPOINTMENT_ID" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"Updated Appointment\",\"date\":\"2023-12-02\",\"time\":\"15:00\"}")
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  if validate_response "$APPOINTMENT_UPDATE_RESPONSE" "200" ".data.title" "Updated Appointment"; then
    log_success "Appointment update successful"
  else
    log_failure "Appointment update failed"
  fi
fi

# Add appointment note
if [ -n "$APPOINTMENT_ID" ]; then
  log_info "Adding appointment note..."
  APPOINTMENT_NOTE_RESPONSE=$(curl -s -i -X POST "$BASE_URL/appointments/$APPOINTMENT_ID-notes" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"text\":\"Test appointment note\"}")
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  if validate_response "$APPOINTMENT_NOTE_RESPONSE" "201" ".data.message" "Note added successfully"; then
    log_success "Appointment note added successfully"
  else
    log_failure "Appointment note addition failed"
  fi
fi

# Update appointment status
if [ -n "$APPOINTMENT_ID" ]; then
  log_info "Updating appointment status..."
  APPOINTMENT_STATUS_RESPONSE=$(curl -s -i -X PATCH "$BASE_URL/appointments/$APPOINTMENT_ID-status" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"status\":\"confirmed\"}")
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  if validate_response "$APPOINTMENT_STATUS_RESPONSE" "200" ".data.status" "confirmed"; then
    log_success "Appointment status update successful"
  else
    log_failure "Appointment status update failed"
  fi
fi

# 6. Dashboard Tests
log_info "=== DASHBOARD TESTS ==="

# Get dashboard data
log_info "Getting dashboard data..."
DASHBOARD_RESPONSE=$(curl -s -i -X GET "$BASE_URL/dashboard" \
  -H "Authorization: Bearer $USER_TOKEN")
TOTAL_TESTS=$((TOTAL_TESTS + 1))

if validate_response "$DASHBOARD_RESPONSE" "200" ".data.stats.totalCustomers.count" ".*"; then
  log_success "Dashboard data retrieval successful"
else
  log_failure "Dashboard data retrieval failed"
fi

# Get dashboard stats
log_info "Getting dashboard stats..."
DASHBOARD_STATS_RESPONSE=$(curl -s -i -X GET "$BASE_URL/dashboard-stats" \
  -H "Authorization: Bearer $USER_TOKEN")
TOTAL_TESTS=$((TOTAL_TESTS + 1))

if validate_response "$DASHBOARD_STATS_RESPONSE" "200" ".data.newRequests.count" ".*"; then
  log_success "Dashboard stats retrieval successful"
else
  log_failure "Dashboard stats retrieval failed"
fi

# Global search
log_info "Testing global search..."
DASHBOARD_SEARCH_RESPONSE=$(curl -s -i -X GET "$BASE_URL/dashboard-search?q=test" \
  -H "Authorization: Bearer $USER_TOKEN")
TOTAL_TESTS=$((TOTAL_TESTS + 1))

if validate_response "$DASHBOARD_SEARCH_RESPONSE" "200"; then
  log_success "Global search successful"
else
  log_failure "Global search failed"
fi

# 7. Final cleanup and results
log_info "=== TEST RESULTS ==="
if [ "$FAILED_TESTS" -eq 0 ]; then
  log_success "All $TOTAL_TESTS tests passed successfully!"
else
  log_failure "$FAILED_TESTS out of $TOTAL_TESTS tests failed"
  exit 1
fi