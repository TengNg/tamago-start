const Attachment = require('../models/Attachment');
const { authorize } = require('../services/attachmentService');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.uploadAttachment = async (req, res) => {
    const { userId } = req.user;
    const { type, refId } = req.body;

    const validTypes = ["card", "writedown"];
    if (!validTypes.includes(type)) {
        const errMsg = 'Invalid attachment-type (attachment should only for card or writedown)'
        return res.status(400).json({ message: errMsg });
    }

    const { authorized, msg, code } = await authorize(userId, type, refId, false);
    if (!authorized) {
        return res.status(code).json({ message: msg });
    }

    if (!req.file || typeof req.file !== 'object' ||
        typeof req.file.buffer === 'undefined' ||
        typeof req.file.mimetype !== 'string' ||
        typeof req.file.originalname !== 'string') {
        const errMsg = 'Invalid or missing attachment file'
        return res.status(400).json({ message: errMsg });
    }

    const { fileTypeFromBuffer } = await import('file-type');
    const detectedType = await fileTypeFromBuffer(req.file.buffer);
    if (!detectedType) {
        return res.status(400).json({ message: 'Could not determine file type (possibly corrupted or empty)' });
    }

    const attachment = new Attachment({
        type,
        refId,
        data: req.file.buffer,
        mimetype: req.file.mimetype,
        originalname: req.file.originalname
    });
    await attachment.save();
    res.status(201).json({ id: attachment._id });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.getAttachment = async (req, res) => {
    try {
        const { userId } = req.user;
        const attachment = await Attachment.findById(req.params.id);
        if (!attachment) {
            return res.status(404);
        }

        const { authorized, msg, code } = await authorize(userId, attachment.type, attachment.refId, true);
        if (!authorized) {
            return res.status(code).json({ message: msg });
        }

        res.set('Content-Type', attachment.mimetype);
        res.send(attachment.data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get attachment.' });
    }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.listAttachments = async (req, res) => {
    try {
        const { userId } = req.user;
        const { type, refId } = req.params;
        if (!['card', 'writedown'].includes(type)) {
            return res.status(400).json({ error: 'Invalid type' });
        }

        if (!refId) {
            return res.status(400).json({ error: 'Missing refId' });
        }

        const { authorized, msg, code } = await authorize(userId, type, refId, true);
        if (!authorized) {
            return res.status(code).json({ error: msg });
        }

        const attachments = await Attachment.find({ type, refId });
        res.json(attachments.map(a => ({
            id: a._id,
            mimetype: a.mimetype,
            createdAt: a.createdAt,
            originalname: a.originalname || '',
        })));
    } catch (err) {
        res.status(500).json({ error: 'Failed to list attachments.' });
    }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.deleteAttachment = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;

    const attachment = await Attachment.findById(req.params.id);
    if (!attachment) {
        return res.status(404);
    }

    const { authorized, msg, code } = await authorize(userId, attachment.type, attachment.refId, false);
    if (!authorized) {
        return res.status(code).json({ message: msg });
    }

    const result = await Attachment.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
        return res.status(404);
    }

    res.json({ success: true });
};
