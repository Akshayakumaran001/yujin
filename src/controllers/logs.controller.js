const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * GET /logs/messages
 */
async function getMessageLogs(req, res) {
  try {
    const { status, limit = 100 } = req.query;
    const logs = await prisma.messageLog.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      include: { contact: { select: { name: true } }, message: { select: { status: true } } },
    });
    return res.json({ success: true, data: logs });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

/**
 * GET /logs/audit
 */
async function getAuditLogs(req, res) {
  try {
    const { limit = 100 } = req.query;
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      include: { user: { select: { name: true, email: true } } },
    });
    const parsed = logs.map((l) => ({
      ...l,
      metadata: JSON.parse(l.metadata || '{}'),
    }));
    return res.json({ success: true, data: parsed });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

/**
 * GET /logs/summary — Daily stats
 */
async function getSummary(req, res) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [sent, failed, pending] = await Promise.all([
      prisma.messageLog.count({ where: { status: 'sent', sentAt: { gte: today } } }),
      prisma.messageLog.count({ where: { status: 'failed', createdAt: { gte: today } } }),
      prisma.messageLog.count({ where: { status: 'pending' } }),
    ]);

    return res.json({
      success: true,
      data: {
        today: { sent, failed, pending },
        successRate: sent + failed > 0 ? Math.round((sent / (sent + failed)) * 100) : 100,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

module.exports = { getMessageLogs, getAuditLogs, getSummary };
