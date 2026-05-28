import BoardMembership from '../../models/BoardMembership.js';
import { SOCKET_EVENTS } from '../../../shared/socket-events.js';

/**
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
export default function registerBoardHandlers(io, socket) {

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

        socket.boardId = boardId;
        socket.join(boardId);

        if (process.env.NODE_ENV === "development") {
            console.log(`User[id=${socket.user.id}][username=${socket.user.username}][socket_id=${socket.id}] joins board with id ${boardId}`);
        }
    });

    socket.on(SOCKET_EVENTS.BOARD_LEAVE, (_data) => {
        const boardId = socket.boardId;
        if (!boardId) return;

        const user = socket.user;
        socket.to(boardId).emit(SOCKET_EVENTS.BOARD_MEMBER_LEFT, { username: user.username });

        delete socket.boardId;
        socket.leave(boardId);
    });

    socket.on(SOCKET_EVENTS.BOARD_KICK, (memberId) => {
        const boardId = socket.boardId;
        if (!boardId) return;

        const connectedSockets = io.sockets.sockets;
        const targetSocket = Array.from(connectedSockets.values()).find(s => s.user && s.user.username === memberId);
        if (!targetSocket) return;
        socket.to(boardId).emit(SOCKET_EVENTS.BOARD_MEMBER_KICKED, { userSocketId: targetSocket.id });
    });

    socket.on(SOCKET_EVENTS.BOARD_CLOSE, (_) => {
        const boardId = socket.boardId;
        if (!boardId) return;
        delete socket.boardId;
        socket.leave(boardId);
        socket.to(boardId).emit(SOCKET_EVENTS.BOARD_CLOSED);
    });

    socket.on(SOCKET_EVENTS.BOARD_UPDATE_TITLE, (data) => {
        const boardId = socket.boardId;
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.BOARD_TITLE_UPDATED, data);
    });

    socket.on(SOCKET_EVENTS.BOARD_UPDATE_DESCRIPTION, (data) => {
        const boardId = socket.boardId;
        if (!boardId) return;
        socket.to(boardId).emit(SOCKET_EVENTS.BOARD_DESCRIPTION_UPDATED, data);
    });
}
