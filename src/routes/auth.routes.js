const router = require('express').Router();
const { login, me, register } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/login', login);
router.post('/register', register); // First-time setup only
router.get('/me', authenticate, me);

module.exports = router;
