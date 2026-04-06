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
        return res.status(422).json({ message: errMsg });
    }

    await authorize({
        type,
        refId,
        userId,
        resource: "attachment",
        action: "create",
    });

    if (!req.file || typeof req.file !== 'object' ||
        typeof req.file.buffer === 'undefined' ||
        typeof req.file.mimetype !== 'string' ||
        typeof req.file.originalname !== 'string') {
        const errMsg = 'Invalid or missing attachment file'
        return res.status(422).json({ message: errMsg });
    }

    if (process.env.NODE_ENV !== "test") {
        const { fileTypeFromBuffer } = await import('file-type');
        const detectedType = await fileTypeFromBuffer(req.file.buffer);
        if (!detectedType) {
            return res.status(422).json({ message: 'Could not determine file type (possibly corrupted or empty)' });
        }
    }

    const attachment = new Attachment({
        type,
        refId,
        data: req.file.buffer,
        mimetype: req.file.mimetype,
        originalname: req.file.originalname
    });
    await attachment.save();
    res.status(201).json({
        _id: attachment._id,
        type: attachment.type,
        refId: attachment.refId,
        mimetype: attachment.mimetype,
        originalname: attachment.originalname
    });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.getAttachment = async (req, res) => {
    const { userId } = req.user;
    const attachment = await Attachment.findById(req.params.id);
    if (!attachment) {
        return res.sendStatus(404);
    }

    await authorize({
        type: attachment.type,
        refId: attachment.refId.toString(),
        userId,
        resource: "attachment",
        action: "view",
    });

    res.set('Content-Type', attachment.mimetype);
    res.send(attachment.data);
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
            return res.status(422).json({ message: 'Invalid type' });
        }

        if (!refId) {
            return res.status(422).json({ message: 'Missing refId' });
        }

        await authorize({
            type: /** @type ("card"|"writedown") */(type),
            refId,
            userId,
            resource: "attachment",
            action: "view",
        });

        const attachments = await Attachment.find({ type, refId }).select("_id createdAt mimetype originalname");
        res.json(attachments);
    } catch (err) {
        res.status(500).json({ message: 'Failed to list attachments.' });
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
        return res.sendStatus(404);
    }

    await authorize({
        type: attachment.type,
        refId: attachment.refId.toString(),
        userId,
        resource: "attachment",
        action: "view",
    });

    const result = await Attachment.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
        return res.sendStatus(404);
    }

    res.json({ id });
};
