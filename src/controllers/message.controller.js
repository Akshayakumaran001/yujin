const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../services/logger.service');
const { processMessageRequest } = require('../services/message.service');

/**
 * POST /messages/send
 */
async function sendMessage(req, res) {
  try {
    const { content, templateId, contactIds, filters } = req.body;

    if (!content && !templateId) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Provide content or templateId' } });
    }

    const result = await processMessageRequest({
      content,
      templateId,
      contactIds,
      filters,
      createdById: req.user.userId,
    });

    // Log user action
    await prisma.auditLog.create({
      data: {
        id: require('crypto').randomUUID(),
        userId: req.user.userId,
        action: 'send_message',
        metadata: JSON.stringify({ messageId: result.messageId, queuedCount: result.queuedCount }),
      },
    });

    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    logger.error('Send message error', { error: err.message });
    return res.status(400).json({ success: false, error: { code: 'REQUEST_FAILED', message: err.message } });
  }
}

/**
 * GET /messages/:id — Get message batch status
 */
async function getMessageStatus(req, res) {
  try {
    const { id } = req.params;
    const message = await prisma.message.findUnique({
      where: { id },
      include: {
        _count: { select: { messageLogs: true } },
      },
    });

    if (!message) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Message not found' } });
    }

    // Compute summary stats
    const logs = await prisma.messageLog.groupBy({
      by: ['status'],
      where: { messageId: id },
      _count: { status: true },
    });

    const stats = { pending: 0, sent: 0, failed: 0 };
    logs.forEach((l) => { stats[l.status] = l._count.status; });

    return res.json({ success: true, data: { ...message, stats } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

/**
 * GET /messages/:id/logs — Get per-contact delivery logs
 */
async function getMessageLogs(req, res) {
  try {
    const { id } = req.params;
    const logs = await prisma.messageLog.findMany({
      where: { messageId: id },
      include: { contact: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: logs });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

/**
 * GET /messages — List all message batches
 */
async function getAllMessages(req, res) {
  try {
    const messages = await prisma.message.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { _count: { select: { messageLogs: true } } },
    });
    return res.json({ success: true, data: messages });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

module.exports = { sendMessage, getMessageStatus, getMessageLogs, getAllMessages };
