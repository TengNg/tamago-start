import { SOCKET_EVENTS } from '../../../shared/socket-events.js';

/**
 * @param {import('socket.io').Socket} socket
 * @param {SocketSharedState} state
 */
export default function registerListHandlers(socket, state) {
    const { boardIdMap } = state;

    socket.on(SOCKET_EVENTS.LIST_UPDATE_ALL, (data) => {
        const boardId = boardIdMap.get(socket.id);
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.LIST_UPDATED_ALL, data);
    });

    socket.on(SOCKET_EVENTS.LIST_MOVE, (data) => {
        const boardId = boardIdMap.get(socket.id);
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.LIST_MOVED, data);
    });

    socket.on(SOCKET_EVENTS.LIST_MOVE_TO_BOARD, (data) => {
        const { boardId, list, cards, index } = data;
        socket.to(boardId).emit(SOCKET_EVENTS.LIST_MOVED_TO_BOARD, { list, cards, index });
    });

    socket.on(SOCKET_EVENTS.LIST_CREATE, (data) => {
        const boardId = boardIdMap.get(socket.id);
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.LIST_CREATED, data);
    });

    socket.on(SOCKET_EVENTS.LIST_DELETE, (data) => {
        const boardId = boardIdMap.get(socket.id);
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.LIST_DELETED, data);
    });

    socket.on(SOCKET_EVENTS.LIST_UPDATE_TITLE, (data) => {
        const boardId = boardIdMap.get(socket.id);
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.LIST_TITLE_UPDATED, data);
    });
}
