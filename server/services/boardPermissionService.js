import Board from '../models/Board.js';
import BoardMembership from '../models/BoardMembership.js';

/**
 * @param {Object} params
 * @param {string} params.boardId
 * @param {string} params.userId
 * @param {'list' | 'card' | 'comment' | 'attachment'} params.resource
 * @param {'view' | 'create' | 'edit' | 'delete'} params.action
 */
const isActionAuthorized = async ({ boardId, userId, resource, action }) => {
    if (!boardId || !resource || !action) {
        return {
            message: "Missing required params",
            authorized: false
        };
    }

    const board = await Board.findById(boardId);
    if (!board) {
        return {
            board,
            message: "Board not found",
            authorized: false
        };
    }

    const membership = await BoardMembership.findOne({ boardId, userId }).lean();
    if (!membership) {
        const publicViewOnly = board.visibility === 'public' && action === 'view';
        if (publicViewOnly) {
            return { board, authorized: true }
        }
        return {
            message: "Not a member",
            authorized: false
        };
    }

    const isOwner = membership.role === "owner";
    if (isOwner) {
        return {
            board,
            authorized: true,
        };
    }

    if (action === 'view') {
        return {
            board,
            authorized: true,
        };
    }

    const allowed = hasPermission(membership.permissions, resource, action);
    if (allowed) {
        return {
            board,
            authorized: true
        }
    }

    return {
        authorized: false
    };
};

/**
* @param {import("mongoose").FlattenMaps<any>} permissions
* @param {'list' | 'card' | 'comment' | 'attachment'} resource
* @param {'view' | 'create' | 'edit' | 'delete' | 'manage'} action
* @returns {boolean}
*/
const hasPermission = (permissions, resource, action) => {
    if (resource === 'list') {
        return permissions?.lists?.[action] === true;
    }

    if (resource === 'card') {
        return permissions?.cards?.[action] === true;
    }

    if (resource === 'comment') {
        return permissions?.cards?.comments?.[action] === true;
    }

    if (resource === 'attachment') {
        return permissions?.cards?.attachments?.[action] === true;
    }

    return false;
};

/**
 * @param {Object} params
 * @param {string} params.boardId
 * @param {string} params.userId
 * @param {'list' | 'card' | 'comment' | 'attachment'} params.resource
 * @param {'view' | 'create' | 'edit' | 'delete'} params.action
 * @returns {Promise<any>}
 * @throws {{ status: number, message: string }}
 */
const checkBoardPermission = async ({ boardId, userId, resource, action }) => {
    const {
        board,
        authorized
    } = await isActionAuthorized({
        boardId,
        userId,
        resource,
        action
    });
    if (!authorized) {
        const message = `You do not have permission to ${action} ${resource}s`;
        throw { status: 403, message }; // catch it with errorHandler middleware
    }

    return { board };
};

/**
 * @param {Object} params
 * @param {("owner" | "member")[]} params.roles
 * @param {string | import("mongoose").ObjectId} params.userId
 * @param {string | import("mongoose").ObjectId} params.boardId
 * @returns {Promise<import("mongoose").Document>}
 * @throws {{ status: number, message: string }}
 */
const checkAllowedRoles = async ({ roles, userId, boardId }) => {
    const allowed = await BoardMembership.findOne({
        userId,
        boardId,
        role: { $in: roles }
    });
    if (!allowed) {
        throw { status: 403, message: "unauthorized" }
    }

    return allowed;
}

export {
    isActionAuthorized,
    hasPermission,
    checkBoardPermission,
    checkAllowedRoles,
};
