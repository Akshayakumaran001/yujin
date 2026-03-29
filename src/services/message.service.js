/**
 * Message Service — processMessageRequest
 * Fetches contacts, applies template, creates jobs, pushes to queue.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { v4: uuidv4 } = require('crypto');

const logger = require('./logger.service');
const { applyTemplate } = require('./template.service');
const queue = require('../queue/messageQueue');

/**
 * Process a message send request end-to-end.
 *
 * @param {object} payload
 * @param {string} [payload.content]      - Direct message content
 * @param {string} [payload.templateId]   - Template ID (overrides content)
 * @param {string[]} [payload.contactIds] - Specific contacts to send to
 * @param {object} [payload.filters]      - Tag-based filter: { tags: ['CSE'] }
 * @param {string} payload.createdById    - User making the request
 * @returns {object} { messageId, queuedCount }
 */
async function processMessageRequest(payload) {
  const { content, templateId, contactIds, filters, createdById } = payload;

  // 1. Resolve template content
  let templateContent = content;
  let template = null;
  if (templateId) {
    template = await prisma.template.findUnique({ where: { id: templateId } });
    if (!template) throw new Error('Template not found');
    templateContent = template.content;
  }

  if (!templateContent) throw new Error('No message content or template provided');

  // 2. Fetch target contacts
  let contacts = [];

  if (contactIds && contactIds.length > 0) {
    contacts = await prisma.contact.findMany({
      where: { id: { in: contactIds }, optOut: false },
    });
  } else if (filters && filters.tags && filters.tags.length > 0) {
    // Tag-based filter — SQLite stores tags as JSON string
    const allContacts = await prisma.contact.findMany({ where: { optOut: false } });
    contacts = allContacts.filter((c) => {
      const ctags = JSON.parse(c.tags || '[]');
      return filters.tags.some((t) => ctags.includes(t));
    });
  } else {
    contacts = await prisma.contact.findMany({ where: { optOut: false } });
  }

  if (contacts.length === 0) throw new Error('No eligible contacts found');

  // 3. Create top-level Message record
  const message = await prisma.message.create({
    data: {
      id: require('crypto').randomUUID(),
      content: templateContent,
      templateId: templateId || null,
      createdById,
      status: 'processing',
    },
  });

  // 4. Create MessageLog + queue job per contact
  const jobs = [];

  for (const contact of contacts) {
    const personalizedMsg = applyTemplate(templateContent, {
      name: contact.name,
      phone: contact.phone,
    });

    const logId = require('crypto').randomUUID();

    await prisma.messageLog.create({
      data: {
        id: logId,
        messageId: message.id,
        contactId: contact.id,
        phone: contact.phone,
        status: 'pending',
        attempt: 0,
      },
    });

    jobs.push({ jobId: logId, phone: contact.phone, message: personalizedMsg, attempt: 0 });
  }

  // Push all jobs to queue
  jobs.forEach((job) => queue.addJob(job));

  // Update message status
  await prisma.message.update({
    where: { id: message.id },
    data: { status: 'processing' },
  });

  logger.info(`Message request processed`, {
    messageId: message.id,
    queuedCount: jobs.length,
    createdById,
  });

  return { messageId: message.id, queuedCount: jobs.length };
}

module.exports = { processMessageRequest };
