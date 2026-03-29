const router = require('express').Router();
const { createTemplate, getTemplates, updateTemplate, deleteTemplate } = require('../controllers/template.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/', authenticate, createTemplate);
router.get('/', authenticate, getTemplates);
router.put('/:id', authenticate, updateTemplate);
router.delete('/:id', authenticate, deleteTemplate);

module.exports = router;
