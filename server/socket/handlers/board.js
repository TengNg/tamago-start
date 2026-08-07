import BoardMembership from '../../models/BoardMembership.js';
import { SOCKET_EVENTS } from '../../../shared/socket-events.js';
import { allowedFields, isObjectId, log } from '../validate.js';

const BOARD_UPDATE_ALLOWED = ['field', 'value'];

/**
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
export default function registerBoardHandlers(io, socket) {

    socket.on(SOCKET_EVENTS.BOARD_JOIN, async (data) => {
        try {
            const { boardId } = data;

            if (!boardId || !isObjectId(boardId)) {
                log(`BOARD_JOIN: invalid boardId (socket=${socket.id})`);
                return;
            }

            // Leave previous board room if any
            const prevBoardId = socket.boardId;
            if (prevBoardId) {
                socket.leave(prevBoardId);
                socket.to(prevBoardId).emit(SOCKET_EVENTS.BOARD_MEMBER_LEFT, { memberId: socket.user.id });
            }

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

            log(`BOARD_JOIN: user=${socket.user.username} joined board=${boardId} (socket=${socket.id})`);
        } catch (err) {
            log(`BOARD_JOIN: error=${err.message} (socket=${socket.id})`);
        }
    });

    socket.on(SOCKET_EVENTS.BOARD_LEAVE, (_data) => {
        const boardId = socket.boardId;
        if (!boardId) return;

        socket.to(boardId).emit(SOCKET_EVENTS.BOARD_MEMBER_LEFT, { memberId: socket.user.id });

        delete socket.boardId;
        socket.leave(boardId);
    });

    socket.on(SOCKET_EVENTS.BOARD_KICK, async (data) => {
        const boardId = socket.boardId;
        if (!boardId) return;

        // Only the board owner can kick members
        const callerMembership = await BoardMembership.findOne({
            boardId,
            userId: socket.user.id,
            role: "owner",
        });
        if (!callerMembership || callerMembership.role !== 'owner') {
            log(`BOARD_KICK: not owner (socket=${socket.id})`);
            return;
        }

        const { memberId } = data;
        if (!memberId || !isObjectId(memberId)) {
            log(`BOARD_KICK: invalid memberId (socket=${socket.id})`);
            return;
        }

        const targetSocket = Array.from(io.sockets.sockets.values())
            .find(s => s.user && s.user.id === memberId);
        if (!targetSocket) return;

        // Remove target from the board room
        targetSocket.leave(boardId);
        delete targetSocket.boardId;

        socket.to(boardId).emit(SOCKET_EVENTS.BOARD_MEMBER_KICKED, { userSocketId: targetSocket.id });
        log(`BOARD_KICK: user=${memberId} kicked from board=${boardId} (socket=${socket.id})`);
    });

    socket.on(SOCKET_EVENTS.BOARD_CLOSE, async (_data) => {
        const boardId = socket.boardId;
        if (!boardId) return;

        // Only the board owner can close a board
        const callerMembership = await BoardMembership.findOne({
            boardId,
            userId: socket.user.id,
            role: "owner",
        });
        if (!callerMembership || callerMembership.role !== 'owner') {
            log(`BOARD_CLOSE: not owner (socket=${socket.id})`);
            return;
        }

        delete socket.boardId;
        socket.leave(boardId);
        socket.to(boardId).emit(SOCKET_EVENTS.BOARD_CLOSED);
        log(`BOARD_CLOSE: board=${boardId} closed by owner (socket=${socket.id})`);
    });

    socket.on(SOCKET_EVENTS.BOARD_UPDATE, async (data) => {
        const boardId = socket.boardId;
        if (!boardId) return;

        // Only the board owner can broadcast board updates
        const callerMembership = await BoardMembership.findOne({
            boardId,
            userId: socket.user.id,
            role: "owner",
        });
        if (!callerMembership || callerMembership.role !== 'owner') {
            log(`BOARD_UPDATE: not owner (socket=${socket.id})`);
            return;
        }

        if (!allowedFields(data, BOARD_UPDATE_ALLOWED)) {
            log(`BOARD_UPDATE: invalid fields (socket=${socket.id})`);
            return;
        }

        socket.to(boardId).emit(SOCKET_EVENTS.BOARD_UPDATED, data);
    });
}
