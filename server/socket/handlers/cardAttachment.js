import { SOCKET_EVENTS } from '../../../shared/socket-events.js';

/**
 * @param {import('socket.io').Socket} socket
 * @param {SocketSharedState} state
 */
export default function registerCardAttachmentHandlers(socket, state) {
    const { boardIdMap } = state;

    socket.on(SOCKET_EVENTS.ATTACHMENT_CREATE, (data) => {
        const boardId = boardIdMap.get(socket.id);
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.ATTACHMENT_CREATED, data);
    });

    socket.on(SOCKET_EVENTS.ATTACHMENT_DELETE, (data) => {
        const boardId = boardIdMap.get(socket.id);
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.ATTACHMENT_DELETED, data);
    });
}
