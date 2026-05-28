import { SOCKET_EVENTS } from '../../../shared/socket-events.js';

/**
 * @param {import('socket.io').Socket} socket
 * @param {SocketSharedState} state
 */
export default function registerChatHandlers(socket, state) {
    const { boardIdMap } = state;

    socket.on(SOCKET_EVENTS.CHAT_SEND, (data) => {
        const boardId = boardIdMap.get(socket.id);
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.CHAT_RECEIVED, data);
    });

    socket.on(SOCKET_EVENTS.CHAT_DELETE, (data) => {
        const boardId = boardIdMap.get(socket.id);
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.CHAT_DELETED, data);
    });

    socket.on(SOCKET_EVENTS.CHAT_CLEAR, (_) => {
        const boardId = boardIdMap.get(socket.id);
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.CHAT_CLEARED);
    });
}
