import { SOCKET_EVENTS } from '../../../shared/socket-events.js';

/**
 * @param {import('socket.io').Socket} socket
 * @param {SocketSharedState} state
 */
export default function registerCardCommentHandlers(socket, state) {
    const { boardIdMap } = state;

    socket.on(SOCKET_EVENTS.COMMENT_CREATE, (data) => {
        const boardId = boardIdMap.get(socket.id);
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.COMMENT_CREATED, data);
    });

    socket.on(SOCKET_EVENTS.COMMENT_DELETE, (data) => {
        const boardId = boardIdMap.get(socket.id);
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.COMMENT_DELETED, data);
    });
}
