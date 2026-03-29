/**
 * Template Service — replace {{placeholder}} in message templates.
 */

/**
 * Apply a template string to a contact object.
 * All {{key}} patterns in content are replaced with contact[key] values.
 *
 * @param {string} content - Template string, e.g. "Hi {{name}}, welcome to {{club}}"
 * @param {object} contact - Contact data, e.g. { name: "Akshay", club: "Coding Club" }
 * @param {object} extra   - Extra vars to merge (optional)
 * @returns {string}       - Personalized message
 */
function applyTemplate(content, contact = {}, extra = {}) {
  const vars = { ...contact, ...extra };

  return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (vars[key] !== undefined) return String(vars[key]);
    return match; // Leave unresolved placeholders as-is
  });
}

/**
 * Validate that no critical placeholders remain unresolved.
 * Returns array of unresolved placeholder names.
 */
function findUnresolved(text) {
  const matches = text.match(/\{\{(\w+)\}\}/g) || [];
  return matches.map((m) => m.replace(/[{}]/g, ''));
}

module.exports = { applyTemplate, findUnresolved };
