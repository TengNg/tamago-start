const express = require('express');
const router = express.Router();
const upload = require('../../middlewares/attachmentUpload');
const attachmentsController = require('../../controllers/attachmentsController');

router.post('/upload', upload.single('attachment'), attachmentsController.uploadAttachment);
router.get('/:doc/:docModel', attachmentsController.listAttachments);
router.get('/:id', attachmentsController.getAttachment);
router.delete('/:id', attachmentsController.deleteAttachment);

module.exports = router;
