const Attachment = require('../models/Attachment');
const { authorize } = require('../services/attachmentService');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.uploadAttachment = async (req, res) => {
    const { userId } = req.user;
    const { docModel, doc } = req.body;

    const validDocModels = ["Card", "Writedown"];
    if (!validDocModels.includes(docModel)) {
        return res.status(422).json({
            message: 'Invalid docModel (must be Card or Writedown)'
        });
    }

    if (!doc) {
        return res.status(422).json({ message: 'Missing doc id' });
    }

    await authorize({
        docModel,
        doc,
        userId,
        resource: "attachment",
        action: "create",
    });

    if (
        !req.file ||
        typeof req.file !== 'object' ||
        typeof req.file.buffer === 'undefined' ||
        typeof req.file.mimetype !== 'string' ||
        typeof req.file.originalname !== 'string'
    ) {
        return res.status(422).json({ message: 'Invalid or missing attachment file' });
    }

    if (process.env.NODE_ENV !== "test") {
        const { fileTypeFromBuffer } = await import('file-type');
        const detectedType = await fileTypeFromBuffer(req.file.buffer);
        if (!detectedType) {
            return res.status(422).json({
                message: 'Could not determine file type (possibly corrupted or empty)'
            });
        }
    }

    const attachment = new Attachment({
        docModel,
        doc,
        data: req.file.buffer,
        mimetype: req.file.mimetype,
        originalname: req.file.originalname
    });

    await attachment.save();

    res.status(201).json({
        _id: attachment._id,
        docModel: attachment.docModel,
        doc: attachment.doc,
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
        docModel: attachment.docModel,
        doc: attachment.doc.toString(),
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
    const { userId } = req.user;
    const { docModel, doc } = req.params;

    if (docModel !== "Card" && docModel !== "Writedown") {
        return res.status(422).json({
            message: 'Invalid docModel (must be Card or Writedown)'
        });
    }

    if (!doc) {
        return res.status(422).json({ message: 'Missing doc id' });
    }

    await authorize({
        docModel,
        doc,
        userId,
        resource: "attachment",
        action: "view",
    });

    const attachments = await Attachment
        .find({ docModel, doc })
        .select("_id createdAt mimetype originalname");

    res.json(attachments);
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.deleteAttachment = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;

    const attachment = await Attachment.findById(id);
    if (!attachment) {
        return res.sendStatus(404);
    }

    await authorize({
        docModel: attachment.docModel,
        doc: attachment.doc.toString(),
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

