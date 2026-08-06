import Card from '../models/Card.js';
import Writedown from '../models/Writedown.js';
import { checkBoardPermission } from './boardPermissionService.js';

/**
 * @typedef {object} AuthorizationResult
 * @property {boolean} authorized
 * @property {string} msg
 * @property {number} code
 */
/**
 * @param {Object} params
 * @param {'Card'|'Writedown'} params.docModel
 * @param {string} params.doc
 * @param {string} params.userId
 * @param {'list' | 'card' | 'comment' | 'attachment'} params.resource
 * @param {'view' | 'create' | 'edit' | 'delete'} params.action
 * @throws {{ status: number, message: string }}
 */
async function authorize({ docModel, doc, userId, resource, action }) {
    if (!docModel || !resource || !action) {
        const message = "Missing required params for authorization";
        throw { status: 403, message };
    }

    if (docModel === "Writedown") {
        const foundWritedown = await Writedown.findById(doc);
        if (!foundWritedown) {
            const message = "Writedown not found";
            throw { status: 403, message };
        }

        if (foundWritedown.owner.toString() !== userId) {
            const message = "Not the owner of this writedown";
            throw { status: 403, message };
        }

        return;
    }

    const foundCard = await Card.findById(doc).lean();
    if (!foundCard) {
        const message = "Card not found";
        throw { status: 403, message };
    }

    await checkBoardPermission({
        boardId: foundCard.boardId.toString(),
        userId,
        resource,
        action,
    })
}

export {
    authorize
}
