const Attachment = require('../models/Attachment');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.uploadAttachment = async (req, res) => {
    const { type, refId } = req.body;
    if (!req.file || typeof req.file !== 'object' ||
        typeof req.file.buffer === 'undefined' ||
        typeof req.file.mimetype !== 'string' ||
        typeof req.file.originalname !== 'string') {
        const errMsg = 'Invalid or missing attachment file'
        return res.status(400).json({ error: errMsg });
    }
    if (!['card', 'writedown'].includes(type)) {
        return res.status(400).json({ error: 'Invalid type' });
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
        const attachment = await Attachment.findById(req.params.id);
        if (!attachment) {
            return res.status(404).json({ error: 'Attachment not found.' });
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
        const { type, refId } = req.params;
        if (!['card', 'writedown'].includes(type)) {
            return res.status(400).json({ error: 'Invalid type' });
        }
        if (!refId) {
            return res.status(400).json({ error: 'Missing refId' });
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
    const { id } = req.params;
    const result = await Attachment.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Attachment not found.' });
    }
    res.json({ success: true });
};
