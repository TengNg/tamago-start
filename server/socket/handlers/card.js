import { SOCKET_EVENTS } from '../../../shared/socket-events.js';

/**
 * @param {import('socket.io').Socket} socket
 */
export default function registerCardHandlers(socket) {

    socket.on(SOCKET_EVENTS.CARD_CREATE, (data) => {
        const boardId = socket.boardId;
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.CARD_CREATED, data);
    });

    socket.on(SOCKET_EVENTS.CARD_DELETE, (data) => {
        const boardId = socket.boardId;
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.CARD_DELETED, data);
    });

    socket.on(SOCKET_EVENTS.CARD_COPY, (data) => {
        const boardId = socket.boardId;
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.CARD_COPIED, data);
    });

    socket.on(SOCKET_EVENTS.CARD_MOVE, (data) => {
        const boardId = socket.boardId;
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.CARD_MOVED, data);
    });

    socket.on(SOCKET_EVENTS.CARD_MOVE_BY_INDEX, (data) => {
        const boardId = socket.boardId;
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.CARD_MOVED_BY_INDEX, data);
    });

    socket.on(SOCKET_EVENTS.CARD_MOVE_TO_LIST, (data) => {
        const boardId = socket.boardId;
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.CARD_MOVED_TO_LIST, data);
    });

    socket.on(SOCKET_EVENTS.CARD_UPDATE_OWNER, (data) => {
        const boardId = socket.boardId;
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.CARD_OWNER_UPDATED, { ...data });
    });

    socket.on(SOCKET_EVENTS.CARD_UPDATE_PRIORITY, (data) => {
        const boardId = socket.boardId;
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.CARD_PRIORITY_UPDATED, { ...data });
    });

    socket.on(SOCKET_EVENTS.CARD_UPDATE_TITLE, (data) => {
        const boardId = socket.boardId;
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.CARD_TITLE_UPDATED, data);
    });

    socket.on(SOCKET_EVENTS.CARD_UPDATE_HIGHLIGHT, (data) => {
        const boardId = socket.boardId;
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.CARD_HIGHLIGHT_UPDATED, data);
    });

    socket.on(SOCKET_EVENTS.CARD_UPDATE_DESCRIPTION, (data) => {
        const boardId = socket.boardId;
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.CARD_DESCRIPTION_UPDATED, data);
    });

    socket.on(SOCKET_EVENTS.CARD_UPDATE_VERIFIED, (data) => {
        const boardId = socket.boardId;
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.CARD_VERIFIED_UPDATED, data);
    });

    socket.on(SOCKET_EVENTS.CARD_UPDATE_DUE_DATE, (data) => {
        const boardId = socket.boardId;
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.CARD_DUE_DATE_UPDATED, data);
    });
}
