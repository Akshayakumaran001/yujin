const systemState = require('../config/systemState');
const { isClientReady } = require('../services/whatsapp.service');
const queue = require('../queue/messageQueue');
const logger = require('../services/logger.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * POST /system/pause — Kill switch
 */
async function pause(req, res) {
  systemState.isPaused = true;
  await prisma.auditLog.create({
    data: {
      id: require('crypto').randomUUID(),
      userId: req.user.userId,
      action: 'system_pause',
      metadata: '{}',
    },
  });
  logger.warn('🛑 System PAUSED by admin', { userId: req.user.userId });
  return res.json({ success: true, data: { message: 'System paused. Worker stopped.' } });
}

/**
 * POST /system/resume
 */
async function resume(req, res) {
  systemState.isPaused = false;
  await prisma.auditLog.create({
    data: {
      id: require('crypto').randomUUID(),
      userId: req.user.userId,
      action: 'system_resume',
      metadata: '{}',
    },
  });
  logger.info('▶️ System RESUMED by admin', { userId: req.user.userId });
  return res.json({ success: true, data: { message: 'System resumed. Worker will continue.' } });
}

/**
 * GET /system/status
 */
function getStatus(req, res) {
  const status = systemState.getStatus();
  return res.json({
    success: true,
    data: {
      ...status,
      whatsappConnected: isClientReady(),
      queueSize: queue.size(),
    },
  });
}

module.exports = { pause, resume, getStatus };
