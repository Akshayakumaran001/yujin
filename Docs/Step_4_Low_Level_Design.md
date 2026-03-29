# 🔍 LOW-LEVEL DESIGN (LLD)
📌 WhatsApp Automation System

## 4.1 🎯 Objective of LLD

Define:
- Exact modules
- Responsibilities
- Internal flow
- Function-level breakdown

> After this, you should be able to start coding directly without confusion.

---

## 4.2 🧩 Module Breakdown

We split the system into clean, independent modules:

1. Auth Module
2. User Module
3. Contact Module
4. Message Module
5. Template Module
6. Queue Module
7. Worker Module
8. WhatsApp Service
9. Logging Module
10. Control Module

---

## 4.3 📁 Suggested Folder Structure (Node.js)

```
src/
│
├── controllers/
├── services/
├── models/
├── routes/
├── queue/
├── workers/
├── utils/
├── config/
└── app.js
```

---

## 4.4 🔐 Auth Module

**Responsibilities:**
- Login
- Token generation
- Middleware protection

**Key Functions:**
```
login(email, password)
generateJWT(user)
verifyJWT(token)
```

**Flow:**
```
User → Login → JWT → Protected Routes
```

---

## 4.5 👤 User Module

**Responsibilities:**
- Manage users
- Role assignment

**Roles:**
- ADMIN
- CORE_MEMBER

**Key Functions:**
```
createUser()
getUserById()
assignRole()
```

---

## 4.6 📇 Contact Module

**Responsibilities:** Store and manage recipients

**Data Fields:**
- name
- phone
- tags (array)
- optOut (boolean)

**Key Functions:**
```
addContact()
getContactsByFilter(tags)
markOptOut(phone)
```

---

## 4.7 💬 Message Module (Core Entry Point)

**Responsibilities:**
- Accept send requests
- Trigger processing

**Key Function:**
```
sendMessage(request)
```

**Flow:**
```
Request → Validate → Call Processor → Queue Jobs
```

---

## 4.8 🧠 Template Module

**Responsibilities:**
- Store reusable messages
- Handle placeholders

**Example Template:**
```
Hi {{name}}, welcome to {{club}}
```

**Key Function:**
```
applyTemplate(template, contact)
```

**Output:**
```
Hi Akshay, welcome to Coding Club
```

---

## 4.9 ⚙️ Message Processor (MOST IMPORTANT)

**Responsibilities:**
- Resolve contacts
- Apply templates
- Create jobs

**Key Function:**
```
processMessageRequest(payload)
```

**Internal Flow:**
```
1. Fetch contacts
2. Loop contacts
3. Personalize message
4. Create job object
5. Push to queue
```

**Job Structure:**
```json
{
  "phone": "9876543210",
  "message": "Hi Akshay...",
  "attempt": 0,
  "status": "pending"
}
```

---

## 4.10 📬 Queue Module

**Responsibilities:**
- Store jobs
- Manage order

**Options:**
- BullMQ (recommended)
- Simple array (MVP)

**Functions:**
```
addJob(job)
getNextJob()
retryJob(job)
```

---

## 4.11 👷 Worker Module

**Responsibilities:**
- Execute jobs
- Enforce delay
- Handle retries

**Core Loop:**
```js
while (true) {
    job = getNextJob()
    wait(randomDelay)
    sendMessage(job)
}
```

**Delay Logic:**
```
delay = random(5s, 10s)
```

---

## 4.12 📱 WhatsApp Service

**Built on:** whatsapp-web.js

**Responsibilities:**
- Send messages
- Maintain session

**Key Functions:**
```
initializeClient()
sendMessage(phone, text)
handleDisconnect()
```

**Internal Safety:**
- Singleton instance (ONLY ONE client)
- Auto-reconnect logic

---

## 4.13 🧾 Logging Module

**Responsibilities:** Track everything

**Types of Logs:**

*Message Logs:*
- message_id
- recipient
- status
- timestamp

*Audit Logs:*
- user_id
- action
- timestamp

**Functions:**
```
logMessage()
logUserAction()
```

---

## 4.14 🛑 Control Module

**Responsibilities:** System-wide control

**Features:**

*Kill Switch:*
```
if (SYSTEM_PAUSED) stop all workers
```

*Rate Config:*
```
setDelay(min, max)
```

---

## 4.15 🔄 End-to-End Execution Flow

```
1. User hits /send-message

2. Auth Middleware:
   → verify JWT

3. Controller:
   → validate input

4. Message Processor:
   → fetch contacts
   → apply template
   → generate jobs

5. Queue:
   → store jobs

6. Worker:
   → pick job
   → wait delay
   → send via WhatsApp

7. Logging:
   → save result
```

---

## 4.16 ⚠️ Edge Cases Handling

| Case | Action |
|------|--------|
| WhatsApp Disconnected | Pause worker → Retry after reconnect |
| Message Failure | Retry up to 3 times → Mark failed |
| Invalid Number | Skip + log error |
| Opt-Out User | Do NOT send |

---

## 4.17 🧠 Design Principles Used

✅ **Separation of Concerns** — Each module does ONE thing

✅ **Loose Coupling** — Queue separates processing from sending

✅ **Fault Tolerance** — Retries + logging

✅ **Control First** — Kill switch + rate limits

---

## 4.18 🔮 Future Extensions
- Replace WhatsApp Web → Official API
- Add scheduling module
- Add analytics dashboard

---

✅ LOW-LEVEL DESIGN COMPLETE
