import { SOCKET_EVENTS } from '../../../shared/socket-events.js';

/**
 * @param {import('socket.io').Socket} socket
 */
export default function registerCardCommentHandlers(socket) {

    socket.on(SOCKET_EVENTS.COMMENT_CREATE, (data) => {
        const boardId = socket.boardId;
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.COMMENT_CREATED, data);
    });

    socket.on(SOCKET_EVENTS.COMMENT_DELETE, (data) => {
        const boardId = socket.boardId;
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.COMMENT_DELETED, data);
    });
}
