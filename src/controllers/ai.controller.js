const { generateMessage } = require('../services/ai.service');
const logger = require('../services/logger.service');

/**
 * POST /ai/generate
 */
async function generate(req, res) {
  try {
    const { context, tone = 'friendly', length = 'short', audience = 'students' } = req.body;

    if (!context) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'context is required' } });
    }

    const generatedText = await generateMessage({ context, tone, length, audience });

    return res.json({
      success: true,
      data: {
        generatedText,
        note: 'Review and edit before sending. Human approval required.',
      },
    });
  } catch (err) {
    logger.error('AI generate endpoint error', { error: err.message });
    return res.status(500).json({ success: false, error: { code: 'AI_ERROR', message: err.message } });
  }
}

module.exports = { generate };
