const router = require('express').Router();
const { addContact, getContacts, updateContact, optOut, deleteContact, bulkDeleteContacts, importPreview, importContacts, downloadTemplate } = require('../controllers/contact.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { upload } = require('../config/upload');

// ⚠ Static routes MUST come before /:id to avoid param conflicts
router.get('/template', authenticate, downloadTemplate);
router.post('/import/preview', authenticate, upload.single('file'), importPreview);
router.post('/import', authenticate, upload.single('file'), importContacts);
router.delete('/bulk', authenticate, bulkDeleteContacts);

router.post('/', authenticate, addContact);
router.get('/', authenticate, getContacts);
router.put('/:id', authenticate, updateContact);
router.patch('/:id/opt-out', authenticate, optOut);
router.delete('/:id', authenticate, deleteContact);

module.exports = router;

