import { SOCKET_EVENTS } from '../../../shared/socket-events.js';

export default function registerCardAttachmentHandlers(socket) {

    socket.on(SOCKET_EVENTS.ATTACHMENT_CREATE, (data) => {
        const boardId = socket.boardId;
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.ATTACHMENT_CREATED, data);
    });

    socket.on(SOCKET_EVENTS.ATTACHMENT_DELETE, (data) => {
        const boardId = socket.boardId;
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.ATTACHMENT_DELETED, data);
    });
}
