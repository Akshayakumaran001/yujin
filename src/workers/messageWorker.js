/**
 * Message Worker — Core execution loop.
 * Polls the queue, enforces rate limiting, sends messages, handles retries.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const logger = require('../services/logger.service');
const systemState = require('../config/systemState');
const config = require('../config');
const queue = require('../queue/messageQueue');
const { sendMessage, isClientReady } = require('../services/whatsapp.service');

let workerInterval = null;

/**
 * Random delay between min and max milliseconds.
 */
function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Re-queue any pending MessageLogs from DB on startup.
 * Handles server restarts where in-memory queue was lost.
 */
async function recoverPendingJobs() {
  try {
    const pendingLogs = await prisma.messageLog.findMany({
      where: { status: 'pending', attempt: { lt: 3 } },
      include: { message: { select: { content: true, templateId: true } }, contact: { select: { name: true } } },
    });

    if (pendingLogs.length === 0) {
      logger.info('No pending messages to recover.');
      return;
    }

    logger.info(`🔄 Recovering ${pendingLogs.length} pending message(s) from DB...`);

    const { applyTemplate } = require('../services/template.service');
    for (const log of pendingLogs) {
      const raw = log.message?.content || '';
      const personalized = applyTemplate(raw, { name: log.contact?.name || '', phone: log.phone });
      queue.addJob({ jobId: log.id, phone: log.phone, message: personalized, attempt: log.attempt });
    }

    logger.info(`✅ ${pendingLogs.length} message(s) re-queued for delivery.`);
  } catch (err) {
    logger.error('Error recovering pending jobs', { error: err.message });
  }
}

/**
 * Process a single job — send message, retry on failure.
 */
async function processJob(job) {
  const { jobId, phone, message, attempt = 0 } = job;

  if (!isClientReady()) {
    logger.warn('WhatsApp not ready — will retry in 8s', { jobId });
    await sleep(8000); // Give WA time to connect before requeueing
    queue.addJob({ ...job, attempt });
    return;
  }

  try {
    await sendMessage(phone, message);

    // Update DB log
    await prisma.messageLog.updateMany({
      where: { id: jobId },
      data: {
        status: 'sent',
        sentAt: new Date(),
        attempt: attempt + 1,
      },
    });

    systemState.metrics.sentToday++;
    logger.info('✅ Message sent successfully', { jobId, phone, attempt: attempt + 1 });
  } catch (error) {
    const nextAttempt = attempt + 1;

    if (nextAttempt < 3) {
      // Exponential backoff: 30s → 120s
      const backoff = 30000 * nextAttempt;
      logger.warn(`Message failed, retrying in ${backoff / 1000}s`, {
        jobId,
        phone,
        attempt: nextAttempt,
        error: error.message,
      });

      await sleep(backoff);
      queue.addJob({ ...job, attempt: nextAttempt });
    } else {
      // Mark as permanently failed
      await prisma.messageLog.updateMany({
        where: { id: jobId },
        data: {
          status: 'failed',
          attempt: nextAttempt,
          error: error.message,
        },
      });

      systemState.metrics.failedToday++;
      logger.error('❌ Message permanently failed after 3 attempts', { jobId, phone, error: error.message });
    }
  }
}

/**
 * Main worker loop — runs continuously while the system is active.
 */
async function workerLoop() {
  let messagesSentInBurst = 0;

  while (true) {
    // Respect kill switch
    if (systemState.isPaused) {
      await sleep(2000);
      continue;
    }

    if (queue.isEmpty()) {
      await sleep(1000);
      continue;
    }

    const job = queue.getNextJob();
    if (!job) {
      await sleep(500);
      continue;
    }

    await processJob(job);
    messagesSentInBurst++;

    // Burst protection: pause after N messages
    if (messagesSentInBurst >= config.rateLimit.burstLimit) {
      logger.info(`Burst limit reached (${config.rateLimit.burstLimit}). Pausing for ${config.rateLimit.burstPause / 1000}s...`);
      await sleep(config.rateLimit.burstPause);
      messagesSentInBurst = 0;
    } else {
      // Normal human-like delay between messages
      const delay = randomDelay(config.rateLimit.delayMin, config.rateLimit.delayMax);
      logger.info(`Waiting ${delay / 1000}s before next message...`);
      await sleep(delay);
    }
  }
}

/**
 * Start the worker.
 */
function startWorker() {
  if (systemState.workerRunning) {
    logger.warn('Worker already running.');
    return;
  }

  systemState.workerRunning = true;
  logger.info('🚀 Message worker started.');

  // Run the loop in background (non-blocking)
  workerLoop().catch((err) => {
    logger.error('Worker crashed', { error: err.message });
    systemState.workerRunning = false;
  });
}

module.exports = { startWorker, processJob, recoverPendingJobs };
