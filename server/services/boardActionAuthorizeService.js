const { Types } = require('mongoose');
const Board = require('../models/Board');

/**
 * @typedef {object} AuthorizationResult
 * @property {InstanceType<typeof Board>} [board]
 * @property {boolean} authorized
 */

/**
 * @param {Types.ObjectId | string} boardId
 * @param {string} userId
 * @param {{ ownerOnly?: boolean }} [opt]
 * @returns {Promise<AuthorizationResult>}
 */
const isActionAuthorized = async (boardId, userId, opt = { ownerOnly: false }) => {
    const board = await Board.findById(boardId);
    if (!board) {
        return {
            authorized: false,
        };
    }

    const ownerOnly = opt.ownerOnly;

    const isOwner = board.createdBy.toString() === userId;
    const isMember = board.members.map(id => id.toString()).includes(userId);
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
