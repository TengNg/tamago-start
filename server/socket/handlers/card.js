import { SOCKET_EVENTS } from '../../../shared/socket-events.js';
import { allowedFields } from '../validate.js';

const CARD_UPDATE_ALLOWED = ['id', 'listId', 'field', 'value'];

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

    socket.on(SOCKET_EVENTS.CARD_UPDATE, (data) => {
        const boardId = socket.boardId;
        if (!boardId) return;
        if (!allowedFields(data, CARD_UPDATE_ALLOWED)) return;
        socket.to(boardId).emit(SOCKET_EVENTS.CARD_UPDATED, data);
    });
}
