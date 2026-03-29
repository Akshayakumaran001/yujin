const XLSX = require('xlsx');

/**
 * Parse an Excel/CSV buffer into a list of contact rows.
 * Expects columns: name, phone, tags (all case-insensitive).
 *
 * @param {Buffer} buffer - Raw file buffer from multer
 * @returns {{ rows: object[], headers: string[] }}
 */
function parseContactSheet(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Convert to array of objects (header row → keys)
  const raw = XLSX.utils.sheet_to_json(sheet, {
    raw: false,      // All values as strings
    defval: '',      // Empty cells = ''
    blankrows: false,
  });

  return raw;
}

/**
 * Normalize a phone number — strip non-digits, handle Excel scientific notation.
 * e.g. "9.19876543210E10" → "919876543210"
 *       "+91 98765 43210" → "919876543210"
 */
function normalizePhone(raw) {
  if (!raw) return '';

  let str = String(raw).trim();

  // Handle Excel scientific notation (e.g. 9.1987654321E10)
  if (/e/i.test(str) && /[0-9]/.test(str)) {
    const num = parseFloat(str);
    if (!isNaN(num)) str = Math.round(num).toString();
  }

  // Strip everything except digits
  return str.replace(/\D/g, '');
}

/**
 * Parse tags from a comma/semicolon separated string.
 * Returns clean array of tag strings.
 */
function parseTags(raw) {
  if (!raw) return [];
  return String(raw)
    .split(/[,;]/)
    .map((t) => t.trim().toLowerCase().replace(/\s+/g, '_'))
    .filter((t) => t.length > 0);
}

/**
 * Given a raw row object and normalized-header map,
 * find the value of the first column whose header matches any of the keywords.
 */
function findColumn(normalizedRow, keywords) {
  for (const key of Object.keys(normalizedRow)) {
    if (keywords.some((kw) => key.includes(kw))) {
      return normalizedRow[key] || '';
    }
  }
  return '';
}

/**
 * Process an uploaded Excel buffer:
 * - Normalize column headers (trim + lowercase)
 * - Find name/phone/tags columns by keyword matching
 * - Validate + normalize each row
 * Returns { valid: [...], invalid: [...], detectedHeaders: [...] }
 */
function processImportBuffer(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const raw = XLSX.utils.sheet_to_json(sheet, {
    raw: false,
    defval: '',
    blankrows: false,
  });

  if (raw.length === 0) return { valid: [], invalid: [{ row: 1, reason: 'File is empty or has no data rows' }], detectedHeaders: [] };

  // Normalize keys of every row to lowercase+trimmed
  const rows = raw.map((row) => {
    const normalized = {};
    for (const [k, v] of Object.entries(row)) {
      normalized[k.toLowerCase().trim().replace(/\s+/g, '_')] = String(v).trim();
    }
    return normalized;
  });

  const detectedHeaders = Object.keys(rows[0] || {});

  const valid = [];
  const invalid = [];

  rows.forEach((row, idx) => {
    const name = findColumn(row, ['name', 'full_name', 'student', 'member', 'candidate']);
    const rawPhone = findColumn(row, ['phone', 'mobile', 'number', 'contact', 'whatsapp', 'cell']);
    const rawTags = findColumn(row, ['tag', 'domain', 'branch', 'department', 'role', 'category', 'group', 'label']);

    const phone = normalizePhone(rawPhone);
    const tags = parseTags(rawTags);

    if (!name) {
      invalid.push({ row: idx + 2, reason: `Missing name (detected columns: ${detectedHeaders.join(', ')})` });
      return;
    }
    if (!phone || phone.length < 10) {
      invalid.push({ row: idx + 2, reason: `Invalid phone "${rawPhone}" (must be ≥10 digits)` });
      return;
    }

    valid.push({ name, phone, tags });
  });

  return { valid, invalid, detectedHeaders };
}


/**
 * Generate a template Excel file buffer for users to fill in.
 */
function generateTemplateBuffer() {
  const wb = XLSX.utils.book_new();
  const sampleData = [
    { name: 'Akshay Kumar', phone: '919876543210', tags: 'interviewee, CSE' },
    { name: 'Priya Sharma', phone: '917890123456', tags: 'interviewee, ECE' },
    { name: 'Ravi Mohan', phone: '916543210987', tags: 'member, core_team' },
  ];
  const ws = XLSX.utils.json_to_sheet(sampleData);

  // Set column widths
  ws['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 30 }];

  XLSX.utils.book_append_sheet(wb, ws, 'Contacts');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = { processImportBuffer, generateTemplateBuffer, normalizePhone, parseTags };
