import { SOCKET_EVENTS } from '../../shared/socket-events.js';

/**
 * @type {import('socket.io').Server | null}
 */
let io = null;

/**
 * @param {import('socket.io').Server} instance
 */
export const setIo = (instance) => {
    io = instance;
};

/**
 * @returns {import('socket.io').Server | null}
 */
export const getIo = () => io;

/**
 * @param {string | import('mongoose').Types.ObjectId} boardId
 * @param {string} event
 * @param {unknown} payload
 * @returns {void}
 */
export function emitToBoard(boardId, event, payload) {
    if (!io) {
        return;
    }

    io.to(String(boardId)).emit(event, payload);
}

/**
 * Kick every socket of `userId` out of `boardId`. Used by the REST member
 * removal path so removed users lose socket access immediately.
 *
 * @param {string} userId
 * @param {string | import('mongoose').Types.ObjectId} boardId
 * @returns {void}
 */
export function revokeUserBoardSockets(userId, boardId) {
    if (!io) return;
    const boardStr = String(boardId);
    const sockets = Array.from(io.sockets.sockets.values()).filter(
        (s) =>
            s.user &&
            s.user.id === userId &&
            s.rooms &&
            s.rooms.has(boardStr),
    );

    for (const socket of sockets) {
        socket.emit(SOCKET_EVENTS.BOARD_MEMBER_KICKED, { userSocketId: socket.id });
        socket.leave(boardStr);
        delete socket.boardId;
    }
}
