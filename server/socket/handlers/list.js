import BoardMembership from '../../models/BoardMembership.js';
import { SOCKET_EVENTS } from '../../../shared/socket-events.js';

/**
 * @param {import('socket.io').Socket} socket
 */
export default function registerListHandlers(socket) {

    socket.on(SOCKET_EVENTS.LIST_UPDATE_ALL, (data) => {
        const boardId = socket.boardId;
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.LIST_UPDATED_ALL, data);
    });

    socket.on(SOCKET_EVENTS.LIST_MOVE, (data) => {
        const boardId = socket.boardId;
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.LIST_MOVED, data);
    });

    socket.on(SOCKET_EVENTS.LIST_MOVE_TO_BOARD, async (data) => {
        const { boardId: targetBoardId, list, cards, index } = data;
        const sourceBoardId = socket.boardId;
        if (!sourceBoardId) return;

        const membership = await BoardMembership.findOne({
            boardId: targetBoardId,
            userId: socket.user.id,
        });
        if (!membership) return;

        socket.to(targetBoardId).emit(SOCKET_EVENTS.LIST_MOVED_TO_BOARD, { list, cards, index });
    });

    socket.on(SOCKET_EVENTS.LIST_CREATE, (data) => {
        const boardId = socket.boardId;
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.LIST_CREATED, data);
    });

    socket.on(SOCKET_EVENTS.LIST_DELETE, (data) => {
        const boardId = socket.boardId;
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.LIST_DELETED, data);
    });

    socket.on(SOCKET_EVENTS.LIST_UPDATE_TITLE, (data) => {
        const boardId = socket.boardId;
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.LIST_TITLE_UPDATED, data);
    });
}
