import { SOCKET_EVENTS } from '../../../shared/socket-events.js';

/**
 * @param {import('socket.io').Socket} socket
 */
export default function registerChatHandlers(socket) {

    socket.on(SOCKET_EVENTS.CHAT_SEND, (data) => {
        const boardId = socket.boardId;
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.CHAT_RECEIVED, data);
    });

    socket.on(SOCKET_EVENTS.CHAT_DELETE, (data) => {
        const boardId = socket.boardId;
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.CHAT_DELETED, data);
    });

    socket.on(SOCKET_EVENTS.CHAT_CLEAR, (_) => {
        const boardId = socket.boardId;
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.CHAT_CLEARED);
    });
}
