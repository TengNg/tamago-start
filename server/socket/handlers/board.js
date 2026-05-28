import BoardMembership from '../../models/BoardMembership.js';
import { SOCKET_EVENTS } from '../../../shared/socket-events.js';

/**
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 * @param {SocketSharedState} state
 */
export default function registerBoardHandlers(io, socket, state) {
    const { boardIdMap } = state;

    socket.on(SOCKET_EVENTS.BOARD_JOIN, async (data) => {
        const { boardId } = data;

        const membership = await BoardMembership.findOne({
            boardId,
            userId: socket.user.id
        });

        if (!membership) {
            socket.emit(SOCKET_EVENTS.BOARD_UNAUTHORIZED, { message: "You are not a member of this board" });
            return;
        }

        boardIdMap.set(socket.id, boardId);

        socket.join(boardId);

        if (process.env.NODE_ENV === "development") {
            console.log(`User[id=${socket.user.id}][username=${socket.user.username}][socket_id=${socket.id}] joins board with id ${boardId}`);
        }
    });

    socket.on(SOCKET_EVENTS.BOARD_LEAVE, (_data) => {
        const boardId = boardIdMap.get(socket.id);
        if (!boardId) return;

        const user = socket.user;
        socket.to(boardId).emit(SOCKET_EVENTS.BOARD_MEMBER_LEFT, { username: user.username });
    });

    socket.on(SOCKET_EVENTS.BOARD_KICK, (memberName) => {
        const boardId = boardIdMap.get(socket.id);
        if (!boardId) return;

        const connectedSockets = io.sockets.sockets;
        const targetSocket = Array.from(connectedSockets.values()).find(s => s.user && s.user.username === memberName);
        if (!targetSocket) return;
        socket.to(boardId).emit(SOCKET_EVENTS.BOARD_MEMBER_KICKED, { userSocketId: targetSocket.id });
    });

    socket.on(SOCKET_EVENTS.BOARD_CLOSE, (_) => {
        const boardId = boardIdMap.get(socket.id);
        if (!boardId) return;
        boardIdMap.delete(socket.id);
        socket.leave(boardId);
        socket.to(boardId).emit(SOCKET_EVENTS.BOARD_CLOSED);
    });

    socket.on(SOCKET_EVENTS.BOARD_UPDATE_TITLE, (data) => {
        const boardId = boardIdMap.get(socket.id);
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.BOARD_TITLE_UPDATED, data);
    });

    socket.on(SOCKET_EVENTS.BOARD_UPDATE_DESCRIPTION, (data) => {
        const boardId = boardIdMap.get(socket.id);
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.BOARD_DESCRIPTION_UPDATED, data);
    });
}
