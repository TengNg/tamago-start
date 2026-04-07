import { cardById } from '../services/cardService.js';
import { findWritedown } from '../services/writedownService.js';
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
        const foundWritedown = await findWritedown(doc);
        if (!foundWritedown) {
            const message = "Writedown not found";
            throw { status: 403, message };
        }

        return;
    }

    const foundCard = await cardById(doc);
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
