require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  jwt: {
    secret: process.env.JWT_SECRET || 'change_this_secret_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  whatsapp: {
    sessionPath: process.env.WA_SESSION_PATH || './sessions',
  },

  rateLimit: {
    delayMin: parseInt(process.env.MSG_DELAY_MIN_MS) || 5000,
    delayMax: parseInt(process.env.MSG_DELAY_MAX_MS) || 10000,
    burstLimit: parseInt(process.env.MSG_BURST_LIMIT) || 25,
    burstPause: parseInt(process.env.MSG_BURST_PAUSE_MS) || 45000,
    maxPerDay: parseInt(process.env.MAX_MESSAGES_PER_DAY) || 300,
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
};
