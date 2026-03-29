# 📄 SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
📌 Project: WhatsApp Automation System for College Club

## 1. 🧭 INTRODUCTION

### 1.1 Purpose

The purpose of this document is to specify the requirements for a secure and reliable WhatsApp automation system that enables a college club to efficiently communicate with its members.

The system aims to:
- Automate repetitive communication tasks
- Ensure controlled and non-spam messaging
- Maintain accountability through logging and monitoring
- Provide a structured and scalable messaging workflow

### 1.2 Scope

The system is designed as an internal communication tool for a college club.

The system will:
- Allow authorized users to send WhatsApp messages
- Support individual and group messaging
- Provide message templates with personalization
- Use queue-based controlled delivery
- Maintain logs for auditing and debugging
- Support optional AI-assisted message drafting

The system will not:
- Act as a public messaging platform
- Support bulk marketing or spam messaging
- Guarantee delivery due to dependency on WhatsApp Web

### 1.3 Definitions and Abbreviations

| Term | Description |
|------|-------------|
| Admin | User with full system control |
| Core Member | Authorized user who can send messages |
| Contact | Club member receiving messages |
| Template | Predefined message format |
| Queue | Mechanism to manage message sending order |
| Worker | Process that executes message sending |
| Session | Active WhatsApp Web login instance |

---

## 2. 👥 OVERALL DESCRIPTION

### 2.1 Product Perspective

The system is a standalone backend-driven application integrated with WhatsApp Web.

It consists of:
- User interface for control
- Backend service for processing
- Queue for safe message delivery
- WhatsApp Web integration layer

### 2.2 User Classes and Characteristics

🧑‍💼 **Admin**
- Technical or semi-technical user
- Full system access
- Responsible for monitoring and control

🧑‍🔧 **Core Member**
- Limited technical knowledge
- Can send messages using predefined workflows

👥 **Contacts**
- Passive users receiving messages
- No direct interaction with system

### 2.3 Operating Environment

| Component | Technology |
|-----------|------------|
| Backend | Node.js |
| Messaging | WhatsApp Web (via automation) |
| Database | PostgreSQL / SQLite |
| Queue | Redis / In-memory |
| Hosting | Local / Free cloud platforms |

### 2.4 Constraints
- Must operate with minimal or zero cost
- Dependent on WhatsApp Web stability
- Limited scalability due to unofficial API usage
- Must mimic human behavior to avoid bans

### 2.5 Assumptions
- Message volume remains moderate
- Users follow responsible usage
- System is not exposed publicly

---

## 3. ⚙️ FUNCTIONAL REQUIREMENTS

### 3.1 User Authentication and Authorization
- FR-1: System shall require user authentication
- FR-2: System shall implement role-based access control
- FR-3: Only authorized users can send messages

### 3.2 Contact Management
- FR-4: System shall store contact details (name, phone, tags)
- FR-5: System shall allow grouping using tags
- FR-6: System shall support filtering contacts

### 3.3 Messaging System
- FR-7: System shall send messages to individual contacts
- FR-8: System shall send messages to groups based on filters
- FR-9: System shall support message templates
- FR-10: System shall support placeholder-based personalization

### 3.4 Queue and Delivery System
- FR-11: System shall enqueue all outgoing messages
- FR-12: System shall enforce rate limiting
- FR-13: System shall process messages sequentially
- FR-14: System shall retry failed messages (up to 3 attempts)

### 3.5 Logging and Monitoring
- FR-15: System shall maintain message logs
- FR-16: System shall track message status (sent/failed)
- FR-17: System shall maintain audit logs for user actions

### 3.6 Control Mechanisms
- FR-18: System shall provide a global kill switch
- FR-19: System shall detect WhatsApp session status

### 3.7 Opt-Out Mechanism
- FR-20: System shall maintain an opt-out list
- FR-21: System shall prevent messaging opted-out users

### 3.8 AI Assistance (Optional)
- FR-22: System shall provide AI-generated message suggestions
- FR-23: System shall require human approval before sending AI-generated messages

---

## 4. 🚀 NON-FUNCTIONAL REQUIREMENTS

### 4.1 Security
- Secure authentication (JWT-based)
- Input validation and sanitization
- Protection against unauthorized access
- Secure storage of session data

### 4.2 Reliability
- System shall handle failures gracefully
- System shall support retry mechanisms
- System shall recover from crashes

### 4.3 Performance
- System shall support moderate load (up to ~200 messages/day)
- Queue shall prevent overload

### 4.4 Scalability
- Modular design for future upgrades
- Ability to migrate to official WhatsApp API

### 4.5 Usability
- Simple and intuitive interface
- Clear feedback for user actions

### 4.6 Maintainability
- Modular code structure
- Comprehensive logging
- Easy debugging and updates

---

## 5. 🔐 EXTERNAL INTERFACE REQUIREMENTS

### 5.1 User Interface
Dashboard for:
- Sending messages
- Managing contacts
- Viewing logs

### 5.2 API Interface
RESTful APIs for:
- Authentication
- Messaging
- Contact management
- Logs

### 5.3 WhatsApp Interface
- Integration via WhatsApp Web session
- QR-based login mechanism

---

## 6. ⚠️ RISKS AND LIMITATIONS

### 6.1 Technical Risks
- WhatsApp Web updates may break system
- Session disconnection issues
- Message delivery uncertainty

### 6.2 Operational Risks
- Risk of number ban
- Misuse by internal users

### 6.3 Mitigation Strategies
- Strict rate limiting
- Controlled access
- Monitoring and logging

---

## 7. 📊 SUCCESS CRITERIA

The system will be considered successful if:
- Messages are delivered reliably within safe limits
- Users can operate the system easily
- Logs provide full traceability
- System runs continuously with minimal failures

---

✅ This SRS is:
- ✔ Clean enough for exam answers (16-mark ready)
- ✔ Structured enough for real system design
- ✔ Practical enough for actual implementation
