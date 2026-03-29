const router = require('express').Router();
const { getMessageLogs, getAuditLogs, getSummary } = require('../controllers/logs.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.get('/messages', authenticate, getMessageLogs);
router.get('/audit', authenticate, requireRole('ADMIN'), getAuditLogs);
router.get('/summary', authenticate, getSummary);

module.exports = router;
