const { cardById } = require('../services/cardService');
const { findWritedown } = require('../services/writedownService');
const { isActionAuthorized } = require('../services/boardActionAuthorizeService');

/**
 * @typedef {object} AuthorizationResult
 * @property {boolean} authorized
 * @property {string} msg
 * @property {number} code
 */

/**
 * @param {string} type
 * @param {import('mongoose').Types.ObjectId | string} userId
 * @param {import('mongoose').Types.ObjectId | string} refId
 * @param {boolean} allowOnPublicAccess
 * @returns {Promise<AuthorizationResult>}
 */
async function authorize(userId, type, refId, allowOnPublicAccess) {
    if (type === "card") {
        const foundCard = await cardById(refId);
        if (!foundCard) {
            return {
                authorized: false,
                msg: "Card not found",
                code: 400,
            }
        }

        const { authorized } = await isActionAuthorized(foundCard.boardId, userId, { allowOnPublicAccess });
        if (!authorized) {
            return {
                authorized: false,
                msg: "unauthorized",
                code: 403,
            }
        }
    }

    if (type === "writedown") {
        const foundWritedown = await findWritedown(refId);
        if (!foundWritedown) {
            return {
                authorized: false,
                msg: "Writedown not found",
                code: 400,
            }
        }
    }

    return {
        authorized: true,
        msg: "",
        code: 200,
    }
}

module.exports = {
    authorize
}
