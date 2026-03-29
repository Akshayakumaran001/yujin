const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');
const logger = require('./logger.service');

let genAI = null;

function getGenAI() {
  if (!genAI && config.gemini.apiKey) {
    genAI = new GoogleGenerativeAI(config.gemini.apiKey);
  }
  return genAI;
}

/**
 * Generate a WhatsApp message draft using Gemini.
 */
async function generateMessage({ context, tone = 'friendly', length = 'short', audience = 'students' }) {
  const ai = getGenAI();
  if (!ai) {
    throw new Error('Gemini API key not configured. Set GEMINI_API_KEY in .env');
  }

  const model = ai.getGenerativeModel(
    { model: 'gemini-2.0-flash' },
    { apiVersion: 'v1beta' }
  );

  const prompt = `Generate a WhatsApp message for a college club.

Context: ${context}
Audience: ${audience}
Tone: ${tone}
Length: ${length} (${length === 'short' ? '2-3 lines' : length === 'medium' ? '4-5 lines' : '6-8 lines'})

Requirements:
- Include {{name}} placeholder for personalization
- Keep it professional yet friendly
- No emojis unless tone is "casual"
- Return ONLY the message text, no explanation

Message:`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    if (text.length > 1000) throw new Error('Generated message too long');

    logger.info('AI message generated', { contextLength: context.length, tone });
    return text;
  } catch (err) {
    logger.error('AI generation failed', { error: err.message });

    // Friendly error messages for common API issues
    if (err.message.includes('429') || err.message.includes('quota')) {
      const retryMatch = err.message.match(/retry.*?(\d+)s/i);
      const waitTime = retryMatch ? `${retryMatch[1]}s` : 'a minute';
      throw new Error(`Rate limit reached — please wait ${waitTime} and try again. If this keeps happening, get a free API key from aistudio.google.com/apikey`);
    }
    if (err.message.includes('403') || err.message.includes('API_KEY_INVALID')) {
      throw new Error('Invalid API key — get a free key at aistudio.google.com/apikey and add it to .env as GEMINI_API_KEY');
    }
    if (err.message.includes('404')) {
      throw new Error('Gemini model not available — please restart the server');
    }

    throw err;
  }
}

module.exports = { generateMessage };
