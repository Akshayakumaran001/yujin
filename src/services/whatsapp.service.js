const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const logger = require('./logger.service');
const config = require('../config');
const systemState = require('../config/systemState');

let client = null;
let isInitialized = false;
const readyCallbacks = []; // Registered callbacks to run when WA becomes ready

/**
 * Register a callback to run once WhatsApp is connected and ready.
 */
function onReady(fn) {
  if (isInitialized) {
    fn(); // Already ready — call immediately
  } else {
    readyCallbacks.push(fn);
  }
}

/**
 * Initialize the WhatsApp Web client (singleton).
 * Prints QR to terminal for scanning.
 */
function initializeClient() {
  if (client) return client;

  logger.info('Initializing WhatsApp client...');

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: config.whatsapp.sessionPath,
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    },
  });

  client.on('qr', (qr) => {
    logger.info('📱 Scan this QR code with WhatsApp to login:');
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    logger.info('✅ WhatsApp client is ready!');
    systemState.whatsappConnected = true;
    isInitialized = true;
    // Fire all registered ready callbacks
    readyCallbacks.forEach((fn) => { try { fn(); } catch (e) { logger.error('onReady callback error', { error: e.message }); } });
    readyCallbacks.length = 0;
  });

  client.on('authenticated', () => {
    logger.info('WhatsApp session authenticated successfully.');
  });

  client.on('auth_failure', (msg) => {
    logger.error('WhatsApp authentication failed', { msg });
    systemState.whatsappConnected = false;
  });

  client.on('disconnected', (reason) => {
    logger.warn('WhatsApp client disconnected', { reason });
    systemState.whatsappConnected = false;
    isInitialized = false;

    // Attempt reconnect after 10 seconds
    logger.info('Attempting WhatsApp reconnect in 10s...');
    setTimeout(() => {
      client.initialize().catch((err) =>
        logger.error('Reconnect failed', { error: err.message })
      );
    }, 10000);
  });

  client.on('message', (msg) => {
    // Handle incoming messages (e.g., opt-out keyword)
    if (msg.body.toLowerCase() === 'stop') {
      logger.info('Opt-out request received', { from: msg.from });
    }
  });

  client.initialize().catch((err) => {
    logger.error('WhatsApp init error', { error: err.message });
  });

  return client;
}

/**
 * Send a WhatsApp message to a phone number.
 * Phone must be in format: 91XXXXXXXXXX@c.us
 */
async function sendMessage(phone, text) {
  if (!client || !isInitialized) {
    throw new Error('WhatsApp client not ready');
  }

  // Normalize phone number to WhatsApp format
  const chatId = phone.includes('@c.us') ? phone : `${phone}@c.us`;

  try {
    await client.sendMessage(chatId, text);
    logger.info('Message sent', { phone, length: text.length });
    return { success: true };
  } catch (error) {
    logger.error('Message send failed', { phone, error: error.message });
    throw error;
  }
}

/**
 * Check if client is connected and ready.
 */
function isClientReady() {
  return isInitialized && systemState.whatsappConnected;
}

/**
 * Get client instance (for advanced use).
 */
function getClient() {
  return client;
}

module.exports = {
  initializeClient,
  onReady,
  sendMessage,
  isClientReady,
  getClient,
};
