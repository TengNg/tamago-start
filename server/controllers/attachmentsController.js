import Attachment from '../models/Attachment.js';
import Card from '../models/Card.js';
import { authorize } from '../services/attachmentService.js';
import { dangerousMimeTypes } from '../middlewares/attachmentUpload.js';
import { SOCKET_EVENTS } from '../../shared/socket-events.js';
import { emitToBoard } from '../socket/registry.js';

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const uploadAttachment = async (req, res) => {
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

    let mimetype = req.file.mimetype;
    if (process.env.NODE_ENV !== "test") {
        const { fileTypeFromBuffer } = await import('file-type');
        const detectedType = await fileTypeFromBuffer(req.file.buffer);
        if (!detectedType) {
            return res.status(422).json({
                message: 'Could not determine file type (possibly corrupted or empty)'
            });
        }

        if (dangerousMimeTypes.includes(detectedType.mime)) {
            return res.status(422).json({
                message: 'File type blocked for security reasons'
            });
        }

        mimetype = detectedType.mime;
    }

    const attachment = new Attachment({
        docModel,
        doc,
        data: req.file.buffer,
        mimetype,
        originalname: req.file.originalname
    });

    await attachment.save();

    const attachmentPayload = {
        _id: attachment._id,
        docModel: attachment.docModel,
        doc: attachment.doc,
        mimetype: attachment.mimetype,
        originalname: attachment.originalname
    };

    if (attachment.docModel === "Card") {
        const card = await Card.findById(attachment.doc).lean();
        if (card) {
            emitToBoard(card.boardId, SOCKET_EVENTS.ATTACHMENT_CREATED, {
                attachment: attachmentPayload,
            });
        }
    }

    res.status(201).json(attachmentPayload);
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getAttachment = async (req, res) => {
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

    const safeName = String(attachment.originalname || 'attachment')
        .replace(/[\r\n"]/g, '')
        .replace(/[^\x20-\x7E]/g, '');

    res.set('Content-Type', attachment.mimetype);
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Content-Disposition', `attachment; filename="${safeName}"`);
    res.set('Content-Security-Policy', "sandbox; default-src 'none'");
    res.send(attachment.data);
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const listAttachments = async (req, res) => {
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
export const deleteAttachment = async (req, res) => {
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
        action: "delete",
    });

    const result = await Attachment.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
        return res.sendStatus(404);
    }

    if (attachment.docModel === "Card") {
        const card = await Card.findById(attachment.doc).lean();
        if (card) {
            emitToBoard(card.boardId, SOCKET_EVENTS.ATTACHMENT_DELETED, {
                id: attachment._id.toString(),
                cardId: attachment.doc.toString(),
            });
        }
    }

    res.json({ id });
};

