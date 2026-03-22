const Board = require('../models/Board');

/**
 * @typedef {object} AuthorizationResult
 * @property {InstanceType<typeof Board>} [board]
 * @property {boolean} authorized
 */

/**
 * @param {import('mongoose').Types.ObjectId | string} boardId
 * @param {import('mongoose').Types.ObjectId | string} userId
 * @param {{ allowOnPublicAccess?: boolean, ownerOnly?: boolean }} [opt]
 * @returns {Promise<AuthorizationResult>}
 */
const isActionAuthorized = async (
    boardId,
    userId,
    opt = { allowOnPublicAccess: false, ownerOnly: false }
) => {
    const { allowOnPublicAccess, ownerOnly } = opt;

    const board = await Board.findById(boardId);
    if (!board) {
        return {
            authorized: false,
        };
    }

    if (allowOnPublicAccess && board.visibility === "public") {
        return {
            authorized: true,
        };
    }

    const isOwner = board.createdBy.toString() === userId.toString();
    const isMember = board.members.map(id => id.toString()).includes(userId.toString());
    const haveAccess = isOwner || isMember;

    if (ownerOnly === false && haveAccess) {
        return {
            board,
            authorized: true
        }
    }

    if (ownerOnly === true && isOwner) {
        return {
            board,
            authorized: true
        }
    }

    return {
        authorized: false
    }
};

module.exports = {
    isActionAuthorized
};
