const router = require('express').Router();
const { generate } = require('../controllers/ai.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/generate', authenticate, generate);

module.exports = router;
