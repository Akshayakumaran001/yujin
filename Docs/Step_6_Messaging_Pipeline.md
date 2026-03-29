# 🔄 MESSAGING PIPELINE DESIGN
📌 WhatsApp Automation System

## 6.1 🎯 Objectives

The messaging pipeline must:
- Prevent WhatsApp bans
- Ensure reliable delivery
- Handle failures gracefully
- Maintain human-like behavior
- Provide full traceability

---

## 6.2 🧩 Pipeline Overview

```
[Message Request]
        ↓
[Message Processor]
        ↓
[Job Creation]
        ↓
[Queue]
        ↓
[Worker]
        ↓
[Rate Limiter]
        ↓
[WhatsApp Sender]
        ↓
[Logging + Retry Handler]
```

---

## 6.3 📬 Step-by-Step Pipeline Flow

### 🟢 Step 1: Message Request

Input example:
```
"Send welcome message to CSE 1st year"
```

System:
- Validates request
- Checks permissions

---

### 🧠 Step 2: Message Processing
```
Fetch contacts → Apply template → Personalize
```

Output:
```json
[
  { "phone": "xxx", "message": "Hi Akshay..." },
  { "phone": "yyy", "message": "Hi Rahul..." }
]
```

---

### 🧱 Step 3: Job Creation

Each recipient becomes a job:
```json
{
  "job_id": "uuid",
  "phone": "9876543210",
  "message": "Hi Akshay...",
  "attempt": 0,
  "status": "pending"
}
```

---

### 📥 Step 4: Queue Insertion

Jobs are pushed into queue:
```
Queue = [Job1, Job2, Job3...]
```

👉 FIFO (First-In-First-Out)

---

## 6.4 👷 Worker Execution Model

**Core Loop:**
```
while (queue not empty):
    if system_paused → wait
    job = getNextJob()
    apply delay
    send message
    log result
```

**Worker Responsibilities:**
- Rate limiting
- Retry handling
- Error handling
- Logging

---

## 6.5 ⏱️ Rate Limiting Strategy (CRITICAL)

**Goal:** Simulate human messaging behavior

**Rules:**
- Delay: 5–10 seconds per message
- Randomization required
- After 20–30 messages → longer pause

**Implementation:**
```js
delay = random(5000, 10000)
await sleep(delay)
```

**Burst Protection:**
```
After N messages:
→ pause 30–60 seconds
```

**Why this works:**
- Avoids bot detection
- Mimics natural typing behavior

---

## 6.6 🔁 Retry Strategy

**Conditions for Retry:**
- Network failure
- WhatsApp send failure
- Temporary disconnect

**Retry Policy:**
- Max attempts = 3
- Retry delay = exponential

**Example:**
```
Attempt 1 → immediate
Attempt 2 → after 30s
Attempt 3 → after 2 min
```

**After Failure:**
- Mark status = FAILED
- Log error

---

## 6.7 🚨 Failure Handling

| Case | Action |
|------|--------|
| WhatsApp Session Lost | Pause worker → Attempt reconnect → Resume queue |
| Invalid Number | Skip message → Log as FAILED |
| Rate Limit Breach Risk | Increase delay dynamically |

---

## 6.8 🧾 Logging Pipeline

**For Every Message, log:**
- job_id
- phone
- status
- attempt
- timestamp

**Log Flow:**
```
Worker → DB (message_logs)
```

---

## 6.9 🛑 Kill Switch Integration

**Behavior:**
```
if SYSTEM_PAUSED:
    stop processing
    keep queue intact
```

**Use Cases:**
- Spam detection
- Unexpected behavior
- Emergency stop

---

## 6.10 🧠 Smart Safeguards (IMPORTANT)

**1. Duplicate Prevention**
> Do not send same message twice to same user

**2. Opt-Out Check**
```
if contact.opt_out == true:
    skip
```

**3. Content Variation (Optional)**
> Add slight variations to message text

---

## 6.11 ⚡ Throughput Expectations

| Safe Throughput | Limit |
|----------------|-------|
| Per minute | ~6–10 messages |
| Per day | ~300–500 messages (safe upper bound) |

**DO NOT EXCEED:**
- Bulk sending in seconds
- Parallel sending

---

## 6.12 🚫 What NOT to Do

- ❌ Parallel workers sending simultaneously
- ❌ No delay between messages
- ❌ Sending identical messages instantly
- ❌ Ignoring failures

---

## 6.13 🔮 Future Upgrade Path

When moving to official API:
- Worker logic remains SAME
- Only sender changes

---

## 6.14 🧠 Why This Pipeline is Production-Level

✅ Queue-based decoupling
✅ Controlled execution
✅ Retry + fault tolerance
✅ Ban prevention logic
✅ Full observability

---

✅ MESSAGING PIPELINE COMPLETE
