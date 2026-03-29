# Architecture

## Flow
UI → API → Processor → Queue → Worker → WhatsApp → DB

## Components
- API Layer
- Processor
- Queue
- Worker
- WhatsApp Client
- Database

## Key Design
- Decoupled execution
- Controlled rate
