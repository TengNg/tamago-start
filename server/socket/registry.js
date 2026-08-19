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
 * @param {string} userId
 * @param {string | import('mongoose').Types.ObjectId} boardId
 * @returns {void}
 */
export function revokeUserBoardSockets(userId, boardId) {
    if (!io) {
        return;
    }

    const boardStr = String(boardId);
    const adapter = io.sockets.adapter;

    const socketIdsInRoom = adapter.rooms.get(boardStr);
    if (!socketIdsInRoom) {
        return;
    }

    for (const socketId of socketIdsInRoom) {
        const socket = io.sockets.sockets.get(socketId);
        if (socket && socket.user && socket.user.id === userId) {
            socket.emit(SOCKET_EVENTS.BOARD_MEMBER_KICKED, { userSocketId: socket.id });
            if (process.env.NODE_ENV === "development") {
                console.log("emitted board member kicked event");
            }

            socket.leave(boardStr);
            if (process.env.NODE_ENV === "development") {
                console.log("left board " + boardStr);
            }

            delete socket.boardId;
        }
    }
}
