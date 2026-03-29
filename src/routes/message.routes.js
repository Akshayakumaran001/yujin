const router = require('express').Router();
const { sendMessage, getMessageStatus, getMessageLogs, getAllMessages } = require('../controllers/message.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/send', authenticate, sendMessage);
router.get('/', authenticate, getAllMessages);
router.get('/:id', authenticate, getMessageStatus);
router.get('/:id/logs', authenticate, getMessageLogs);

module.exports = router;
