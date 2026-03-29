require('dotenv').config();
const express = require('express');
const cors = require('cors');

const config = require('./config');
const logger = require('./services/logger.service');
const { initializeClient, onReady } = require('./services/whatsapp.service');
const { startWorker, recoverPendingJobs } = require('./workers/messageWorker');

// Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const contactRoutes = require('./routes/contact.routes');
const messageRoutes = require('./routes/message.routes');
const templateRoutes = require('./routes/template.routes');
const systemRoutes = require('./routes/system.routes');
const logsRoutes = require('./routes/logs.routes');
const aiRoutes = require('./routes/ai.routes');

const app = express();

// ── Middleware ────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});

// ── Routes ────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/contacts', contactRoutes);
app.use('/messages', messageRoutes);
app.use('/templates', templateRoutes);
app.use('/system', systemRoutes);
app.use('/logs', logsRoutes);
app.use('/ai', aiRoutes);

// Manual queue recovery trigger (no auth — useful during debug)
app.post('/system/recover-queue', async (_req, res) => {
  await recoverPendingJobs();
  res.json({ success: true, data: { message: 'Recovery triggered — check server logs.' } });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found' } });
});

// Global error handler
app.use((err, _req, res, _next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
});

// ── Start ─────────────────────────────────────────────────
const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📡 API ready at http://localhost:${PORT}`);

  // Initialize WhatsApp client — recover pending jobs once WA is ready
  initializeClient();
  onReady(() => {
    logger.info('WhatsApp ready — recovering any pending messages in 5s...');
    setTimeout(() => recoverPendingJobs(), 5000);
  });

  // Start message worker
  startWorker();
});

module.exports = app;
