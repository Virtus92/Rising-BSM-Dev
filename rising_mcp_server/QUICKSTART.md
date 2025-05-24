# Quick Start Guide

## 1. Initial Setup

### Step 1: Install Dependencies
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Step 2: Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
BMS_API_URL=https://your-bms.com/api
BMS_API_KEY=<leave empty for now>
```

## 2. Get Your Bearer Token

### Option A: Using the Helper Script
```bash
python get_token.py
```

Enter your BMS credentials when prompted. The script will:
1. Login to your BMS
2. Get access and refresh tokens
3. Save them for future use
4. Display the access token

### Option B: Direct API Call
```bash
curl -X POST https://your-bms.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com", "password": "yourpassword"}' \
  | jq -r '.accessToken'
```

### Step 3: Update .env with Token
Add the access token to your `.env`:
```env
BMS_API_KEY=eyJhbGciOiJIUzI1NiIs...your-token-here
```

## 3. Start the Server

### For SSE/N8N Integration:
```bash
python run_sse.py
```

The server will start on `http://localhost:8000`

### For MCP Protocol:
```bash
python run_mcp.py
```

## 4. Test the Connection

### Check Health:
```bash
curl http://localhost:8000/health
```

### Test SSE Events:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8000/sse/events
```

## 5. N8N Integration

### Create HTTP Request Node:
1. URL: `http://localhost:8000/sse/events`
2. Method: GET
3. Authentication: Header Auth
   - Name: `Authorization`
   - Value: `Bearer YOUR_TOKEN`
4. Options:
   - Accept: `text/event-stream`

### Create Workflow:
1. SSE Trigger → Listen for events
2. Switch Node → Route based on event type
3. Function Node → Process event data
4. HTTP Request → Call MCP tools

### Example: Auto-assign Requests
```javascript
// Function node to find best agent
const users = await $http.get('http://localhost:8000/mcp/resources/bms://users/active');
const bestAgent = users.data.users[0]; // Simple example
return { user_id: bestAgent.id };
```

## 6. Using MCP Tools from N8N

### Login (if token expires):
```javascript
const response = await $http.post('http://localhost:8000/mcp/tools/auth_login', {
  email: 'your@email.com',
  password: 'yourpassword',
  save_token: true
});
```

### Assign Request:
```javascript
const response = await $http.post('http://localhost:8000/mcp/tools/request_assign', {
  request_id: 'req_123',
  user_id: 'user_456',
  note: 'Auto-assigned by N8N'
}, {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});
```

### Create Appointment:
```javascript
const response = await $http.post('http://localhost:8000/mcp/tools/appointment_create', {
  customer_id: 'cust_789',
  scheduled_at: '2024-01-20T14:00:00Z',
  duration_minutes: 60,
  title: 'Follow-up Meeting'
}, {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});
```

## 7. Monitoring

### View Logs:
The server uses JSON logging. To pretty-print:
```bash
python run_sse.py | jq '.'
```

### Check Active Connections:
```bash
curl http://localhost:8000/
```

## Troubleshooting

### Token Issues:
- Token expired? Use `auth_refresh` tool or login again
- Permission denied? Check service account permissions in BMS

### Connection Issues:
- Check firewall settings
- Verify BMS API URL is correct
- Ensure CORS is configured for N8N domain

### Event Issues:
- No events? Check filter parameters
- Missing events? Verify webhook configuration in BMS

## Next Steps

1. Create a service account specifically for N8N
2. Set up production deployment with HTTPS
3. Configure rate limiting and monitoring
4. Implement custom workflows for your business needs