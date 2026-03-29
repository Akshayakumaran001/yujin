const router = require('express').Router();
const { pause, resume, getStatus } = require('../controllers/system.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.post('/pause', authenticate, requireRole('ADMIN'), pause);
router.post('/resume', authenticate, requireRole('ADMIN'), resume);
router.get('/status', authenticate, getStatus);

module.exports = router;
