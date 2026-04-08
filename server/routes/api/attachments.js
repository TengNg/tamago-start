import express from 'express';
const router = express.Router();

import upload from '../../middlewares/attachmentUpload.js';
import {
    uploadAttachment,
    listAttachments,
    getAttachment,
    deleteAttachment,
} from '../../controllers/attachmentsController.js';

router.post('/upload', upload.single('attachment'), uploadAttachment);
router.get('/:doc/:docModel', listAttachments);
router.get('/:id', getAttachment);
router.delete('/:id', deleteAttachment);

export default router;
