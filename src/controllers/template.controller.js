const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../services/logger.service');

/**
 * POST /templates
 */
async function createTemplate(req, res) {
  try {
    const { name, content } = req.body;
    if (!name || !content) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'name and content required' } });
    }
    const template = await prisma.template.create({
      data: { id: require('crypto').randomUUID(), name, content, createdById: req.user.userId },
    });
    logger.info('Template created', { templateId: template.id });
    return res.status(201).json({ success: true, data: template });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

/**
 * GET /templates
 */
async function getTemplates(req, res) {
  try {
    const templates = await prisma.template.findMany({ orderBy: { createdAt: 'desc' } });
    return res.json({ success: true, data: templates });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

/**
 * PUT /templates/:id
 */
async function updateTemplate(req, res) {
  try {
    const { name, content } = req.body;
    const template = await prisma.template.update({
      where: { id: req.params.id },
      data: { name, content },
    });
    return res.json({ success: true, data: template });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

/**
 * DELETE /templates/:id
 */
async function deleteTemplate(req, res) {
  try {
    await prisma.template.delete({ where: { id: req.params.id } });
    return res.json({ success: true, data: { message: 'Template deleted' } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

module.exports = { createTemplate, getTemplates, updateTemplate, deleteTemplate };
