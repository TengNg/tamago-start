const { cardById } = require('../services/cardService');
const { findWritedown } = require('../services/writedownService');
const { checkBoardPermission } = require('./boardPermissionService');

/**
 * @typedef {object} AuthorizationResult
 * @property {boolean} authorized
 * @property {string} msg
 * @property {number} code
 */
/**
 * @param {Object} params
 * @param {'card'|'writedown'} params.type
 * @param {string} params.refId
 * @param {string} params.userId
 * @param {'list' | 'card' | 'comment' | 'attachment'} params.resource
 * @param {'view' | 'create' | 'edit' | 'delete'} params.action
 * @throws {{ status: number, message: string }}
 */
async function authorize({ type, refId, userId, resource, action }) {
    if (!type || !resource || !action) {
        const message = "Missing required params for authorization";
        throw { status: 403, message };
    }

    if (type === "writedown") {
        const foundWritedown = await findWritedown(refId.toString());
        if (!foundWritedown) {
            const message = "Writedown not found";
            throw { status: 403, message };
        }

        return;
    }

    const foundCard = await cardById(refId.toString());
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

module.exports = {
    authorize
}
