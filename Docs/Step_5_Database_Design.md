# 🗄️ DATABASE DESIGN
📌 WhatsApp Automation System

## 5.1 🎯 Design Goals

The database must:
- Support efficient querying (contacts, logs)
- Ensure data integrity
- Enable auditability
- Be simple enough for MVP, scalable later

---

## 5.2 🧩 Core Entities

We'll design around these main entities:
- User
- Contact
- Message
- MessageLog
- Template
- AuditLog
- OptOut

---

## 5.3 📊 Entity Relationship Overview

```
User ───< Message ───< MessageLog >─── Contact
          │
          └── Template
          
User ───< AuditLog
Contact ─── OptOut
```

---

## 5.4 📋 Table Definitions

### 👤 1. Users Table
**Purpose:** Store system users (admins, core members)

```sql
users (
  id UUID PRIMARY KEY,
  name VARCHAR,
  email VARCHAR UNIQUE,
  password_hash TEXT,
  role VARCHAR, -- ADMIN / CORE_MEMBER
  created_at TIMESTAMP
)
```

---

### 📇 2. Contacts Table
**Purpose:** Store recipients

```sql
contacts (
  id UUID PRIMARY KEY,
  name VARCHAR,
  phone VARCHAR UNIQUE,
  tags TEXT[], -- ["CSE", "2nd_year"]
  opt_out BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP
)
```

---

### 💬 3. Messages Table
**Purpose:** Represents a message request (batch)

```sql
messages (
  id UUID PRIMARY KEY,
  content TEXT,
  template_id UUID,
  created_by UUID REFERENCES users(id),
  status VARCHAR, -- pending / processing / completed
  created_at TIMESTAMP
)
```

---

### 📩 4. MessageLogs Table
**Purpose:** Track each message sent to each user

```sql
message_logs (
  id UUID PRIMARY KEY,
  message_id UUID REFERENCES messages(id),
  contact_id UUID REFERENCES contacts(id),
  phone VARCHAR,
  status VARCHAR, -- pending / sent / failed
  attempt INT DEFAULT 0,
  error TEXT,
  sent_at TIMESTAMP
)
```

---

### 🧠 5. Templates Table
**Purpose:** Reusable message formats

```sql
templates (
  id UUID PRIMARY KEY,
  name VARCHAR,
  content TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP
)
```

---

### 🧾 6. AuditLogs Table
**Purpose:** Track user actions (security + debugging)

```sql
audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action TEXT,
  metadata JSONB,
  created_at TIMESTAMP
)
```

---

### 🚫 7. OptOut Table (Optional Advanced)

> You can also keep opt-out in contacts table (simpler)

If separate:

```sql
opt_outs (
  id UUID PRIMARY KEY,
  phone VARCHAR UNIQUE,
  reason TEXT,
  created_at TIMESTAMP
)
```

---

## 5.5 🔑 Relationships Explained

**One-to-Many Relationships:**
- One User → Many Messages
- One Message → Many MessageLogs
- One Contact → Many MessageLogs
- One User → Many AuditLogs

**Why Message + MessageLogs split?**

> This is a VERY important design decision

- **Message (Batch Level):** "Send welcome message"
- **MessageLogs (Individual Level):** Sent to Akshay ✅, Rahul ❌ (failed)

---

## 5.6  Indexing Strategy (Performance)

**Must-have Indexes:**
```sql
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_message_logs_status ON message_logs(status);
CREATE INDEX idx_message_logs_message_id ON message_logs(message_id);
```

**Why?**
- Fast lookup for sending
- Fast filtering for logs
- Efficient retries

---

## 5.7  Data Flow with DB

**Example: Send Message**
```
1. Insert into messages table
2. Fetch contacts
3. Insert multiple rows into message_logs
4. Worker updates status per row
```

**Example: Retry**
```sql
SELECT * FROM message_logs
WHERE status = 'failed' AND attempt < 3
```

---

## 5.8  Data Integrity Rules

**Constraints:**
- Unique phone numbers
- Foreign key relationships enforced
- Status must be ENUM-like

**Example:**
```sql
CHECK (status IN ('pending', 'sent', 'failed'))
```

---

## 5.9  Design Choices

 **Normalized Structure** — Avoids duplication

 **Log-Based Tracking** — Full traceability

**Scalable Pattern** — Works even if you switch APIs

**Retry-Friendly** — MessageLogs supports retry logic

---

## 5.10  Common Mistakes (Avoid These)

- ❌ Storing everything in one table
- ❌ No logs (you'll regret this)
- ❌ No indexing
- ❌ No status tracking

---

## 5.11  Future Enhancements
- Add delivery status tracking
- Add analytics table
- Add scheduled messages table

---

DATABASE DESIGN COMPLETE
