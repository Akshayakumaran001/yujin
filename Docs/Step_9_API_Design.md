# 📡 API DESIGN SPECIFICATION
📌 WhatsApp Automation System

## 9.1 🎯 Objectives

The API layer must:
- Be clean and predictable
- Enforce security and validation
- Support all core operations
- Be easy to extend later

---

## 9.2 🧩 API Design Principles

**✅ RESTful Design**
- Use standard HTTP methods
- Resource-based URLs

**✅ Consistent Structure**

All responses follow:
```json
{
  "success": true,
  "data": {},
  "error": null
}
```

**❌ Avoid:**
- Random response formats
- Mixing logic in controllers

---

## 9.3 🔐 Authentication APIs

### 1. Login
**Endpoint:** `POST /auth/login`

Request:
```json
{
  "email": "user@mail.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "JWT_TOKEN",
    "user": {
      "id": "uuid",
      "role": "ADMIN"
    }
  }
}
```

### 2. Get Current User
```
GET /auth/me
```
👉 Requires JWT

---

## 9.4 👤 User APIs (Admin Only)

### Create User
`POST /users`
```json
{
  "name": "Akshay",
  "email": "akshay@mail.com",
  "password": "secure123",
  "role": "CORE_MEMBER"
}
```

### Get All Users
`GET /users`

### Update Role
`PATCH /users/:id/role`

---

## 9.5 📇 Contact APIs

### Add Contact
`POST /contacts`
```json
{
  "name": "Rahul",
  "phone": "9876543210",
  "tags": ["CSE", "2nd_year"]
}
```

### Get Contacts (with filters)
`GET /contacts?tags=CSE,2nd_year`

### Update Contact
`PUT /contacts/:id`

### Opt-Out Contact
`PATCH /contacts/:id/opt-out`

---

## 9.6 🧠 Template APIs

### Create Template
`POST /templates`
```json
{
  "name": "Welcome Message",
  "content": "Hi {{name}}, welcome to our club!"
}
```

### Get Templates
`GET /templates`

### Update Template
`PUT /templates/:id`

---

## 9.7 💬 Messaging APIs (CORE)

### Send Message
`POST /messages/send`

Request (using template):
```json
{
  "template_id": "uuid",
  "filters": {
    "tags": ["CSE", "1st_year"]
  }
}
```

OR Direct Message:
```json
{
  "content": "Hi {{name}}, meeting at 5PM",
  "contacts": ["uuid1", "uuid2"]
}
```

Response:
```json
{
  "success": true,
  "data": {
    "message_id": "uuid",
    "queued_count": 50
  }
}
```

### Get Message Status
`GET /messages/:id`

### Get Message Logs
`GET /messages/:id/logs`

---

## 9.8 📬 Queue Control APIs

### Pause System (Kill Switch)
`POST /system/pause`

### Resume System
`POST /system/resume`

### Get System Status
`GET /system/status`

---

## 9.9 🧾 Logs APIs

### Get Audit Logs
`GET /logs/audit`

### Get Message Logs
`GET /logs/messages`

---

## 9.10 🤖 AI APIs

### Generate Message
`POST /ai/generate`

Request:
```json
{
  "context": "Invite students for hackathon",
  "tone": "friendly",
  "length": "short"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "generated_text": "Hi {{name}}, join our hackathon..."
  }
}
```

---

## 9.11 ⚠️ Error Handling

**Standard Error Format:**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Phone number is invalid"
  }
}
```

**Common Error Codes:**

| Code | Meaning |
|------|---------|
| UNAUTHORIZED | Invalid token |
| FORBIDDEN | No permission |
| INVALID_INPUT | Bad request |
| NOT_FOUND | Resource missing |
| SYSTEM_PAUSED | Kill switch active |

---

## 9.12 🔒 Middleware Design

**1. Auth Middleware**
```
Verify JWT → attach user → next()
```

**2. Role Middleware**
```
Check role → allow/deny
```

**3. Validation Middleware**
```
Validate request body → reject if invalid
```

---

## 9.13 🔄 API Flow Example

**Sending Message:**
```
Client → POST /messages/send
        ↓
Auth Middleware
        ↓
Validation
        ↓
Controller
        ↓
Message Processor
        ↓
Queue
        ↓
Response
```

---

## 9.14 🧠 Design Decisions

✅ Separate concerns (auth, messaging, logs)
✅ Clear endpoint naming
✅ Predictable responses
✅ Easy to scale

---

## 9.15 🔮 Future Enhancements
- Webhooks for delivery updates
- Bulk upload APIs
- Scheduling endpoints

---

✅ API DESIGN COMPLETE
