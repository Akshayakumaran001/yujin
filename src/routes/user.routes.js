const router = require('express').Router();
const { createUser, getUsers, updateRole } = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.post('/', authenticate, requireRole('ADMIN'), createUser);
router.get('/', authenticate, requireRole('ADMIN'), getUsers);
router.patch('/:id/role', authenticate, requireRole('ADMIN'), updateRole);

module.exports = router;
