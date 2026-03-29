const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../services/logger.service');

/**
 * POST /contacts — Add a contact
 */
async function addContact(req, res) {
  try {
    const { name, phone, tags = [] } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'name and phone required' } });
    }

    // Basic phone validation
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid phone number' } });
    }

    const contact = await prisma.contact.create({
      data: {
        id: require('crypto').randomUUID(),
        name,
        phone: cleanPhone,
        tags: JSON.stringify(Array.isArray(tags) ? tags : [tags]),
      },
    });

    logger.info('Contact added', { contactId: contact.id, phone: cleanPhone });
    return res.status(201).json({ success: true, data: { ...contact, tags: JSON.parse(contact.tags) } });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Phone number already exists' } });
    }
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

/**
 * GET /contacts — Get all contacts with optional tag filter
 */
async function getContacts(req, res) {
  try {
    const { tags, optOut } = req.query;
    let contacts = await prisma.contact.findMany({
      where: optOut !== undefined ? { optOut: optOut === 'true' } : {},
      orderBy: { createdAt: 'desc' },
    });

    // Filter by tags (stored as JSON string in SQLite)
    if (tags) {
      const filterTags = tags.split(',').map((t) => t.trim());
      contacts = contacts.filter((c) => {
        const ctags = JSON.parse(c.tags || '[]');
        return filterTags.some((ft) => ctags.includes(ft));
      });
    }

    const parsed = contacts.map((c) => ({ ...c, tags: JSON.parse(c.tags || '[]') }));
    return res.json({ success: true, data: parsed });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

/**
 * PUT /contacts/:id — Update a contact
 */
async function updateContact(req, res) {
  try {
    const { id } = req.params;
    const { name, phone, tags } = req.body;
    const data = {};
    if (name) data.name = name;
    if (phone) data.phone = phone.replace(/\D/g, '');
    if (tags) data.tags = JSON.stringify(Array.isArray(tags) ? tags : [tags]);

    const contact = await prisma.contact.update({ where: { id }, data });
    return res.json({ success: true, data: { ...contact, tags: JSON.parse(contact.tags) } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

/**
 * PATCH /contacts/:id/opt-out — Mark contact as opted out
 */
async function optOut(req, res) {
  try {
    const { id } = req.params;
    const contact = await prisma.contact.update({ where: { id }, data: { optOut: true } });

    // Also add to OptOut table
    await prisma.optOut.upsert({
      where: { phone: contact.phone },
      create: { id: require('crypto').randomUUID(), phone: contact.phone, reason: req.body.reason || 'User requested' },
      update: {},
    });

    logger.info('Contact opted out', { contactId: id, phone: contact.phone });
    return res.json({ success: true, data: { message: 'Contact opted out successfully' } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

/**
 * DELETE /contacts/:id — Delete a contact
 */
async function deleteContact(req, res) {
  try {
    await prisma.contact.delete({ where: { id: req.params.id } });
    return res.json({ success: true, data: { message: 'Contact deleted' } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

/**
 * DELETE /contacts/bulk — Delete multiple contacts by IDs
 */
async function bulkDeleteContacts(req, res) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'ids array is required' } });
    }
    const { count } = await prisma.contact.deleteMany({ where: { id: { in: ids } } });
    logger.info('Bulk delete contacts', { count });
    return res.json({ success: true, data: { deleted: count } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

/**
 * POST /contacts/import/preview — Parse file, return headers + sample rows (no DB write)
 */
async function importPreview(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'No file uploaded' } });
    }

    const XLSX = require('xlsx');
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const raw = XLSX.utils.sheet_to_json(sheet, { raw: true, defval: '', blankrows: false });
    if (raw.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'File is empty or has no data rows' } });
    }

    const headers = Object.keys(raw[0]);
    const preview = raw.slice(0, 3).map(row => {
      const out = {};
      headers.forEach(h => { out[h] = String(row[h] || '').slice(0, 60); });
      return out;
    });

    return res.json({ success: true, data: { headers, preview, totalRows: raw.length } });
  } catch (err) {
    logger.error('Import preview error', { error: err.message });
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

/**
 * POST /contacts/import — Bulk import from Excel/CSV with explicit column mapping
 */
async function importContacts(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'No file uploaded' } });
    }

    // Column mapping provided by the user in the UI
    const { nameCol, phoneCol, tagsCol } = req.body;
    if (!nameCol || !phoneCol) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'nameCol and phoneCol are required in the mapping' } });
    }

    const { normalizePhone, parseTags } = require('../services/import.service');
    const XLSX = require('xlsx');
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const raw = XLSX.utils.sheet_to_json(sheet, { raw: true, defval: '', blankrows: false });

    let imported = 0;
    let updated = 0;
    const failed = [];
    const invalid = [];

    for (let idx = 0; idx < raw.length; idx++) {
      const row = raw[idx];
      const name = String(row[nameCol] || '').trim();
      const rawPhone = String(row[phoneCol] || '').trim();
      const rawTags = tagsCol ? String(row[tagsCol] || '').trim() : '';

      const phone = normalizePhone(rawPhone);
      const tags = parseTags(rawTags);

      if (!name) { invalid.push({ row: idx + 2, reason: 'Empty name' }); continue; }
      if (!phone || phone.length < 10) { invalid.push({ row: idx + 2, reason: `Invalid phone: "${rawPhone}"` }); continue; }

      try {
        const existing = await prisma.contact.findUnique({ where: { phone } });
        if (existing) {
          const merged = [...new Set([...JSON.parse(existing.tags || '[]'), ...tags])];
          await prisma.contact.update({ where: { phone }, data: { name, tags: JSON.stringify(merged) } });
          updated++;
        } else {
          await prisma.contact.create({
            data: { id: require('crypto').randomUUID(), name, phone, tags: JSON.stringify(tags) },
          });
          imported++;
        }
      } catch (err) {
        failed.push({ row: idx + 2, name, phone, reason: err.message });
      }
    }

    logger.info('Bulk import complete', { imported, updated, failed: failed.length, skipped: invalid.length });
    return res.status(201).json({
      success: true,
      data: {
        imported, updated,
        failed: failed.length,
        skippedRows: invalid.length,
        summary: `${imported} added, ${updated} updated, ${invalid.length} invalid rows skipped`,
        errors: [...failed, ...invalid],
      },
    });
  } catch (err) {
    logger.error('Import error', { error: err.message });
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}


/**
 * GET /contacts/template — Download a pre-formatted Excel template
 */
function downloadTemplate(_req, res) {
  const { generateTemplateBuffer } = require('../services/import.service');
  const buffer = generateTemplateBuffer();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="contacts_template.xlsx"');
  res.send(buffer);
}

module.exports = { addContact, getContacts, updateContact, optOut, deleteContact, bulkDeleteContacts, importPreview, importContacts, downloadTemplate };

