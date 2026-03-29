# Messaging Pipeline

Request → Processor → Jobs → Queue → Worker → WhatsApp → Logs

## Rules
- Delay 5–10 sec
- Retry max 3
- No parallel sending
