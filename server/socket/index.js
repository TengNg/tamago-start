import { Server } from "socket.io";
import { Types } from 'mongoose';
import { SOCKET_EVENTS } from '../../shared/socket-events.js';
import { checkTokens } from '../middlewares/authenticateToken.js';
import { setIo } from './registry.js';
import BoardMembership from '../models/BoardMembership.js';

const __prod__ = process.env.NODE_ENV === "production";
const opts = __prod__ ? {} : {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
    },
};

/**
 * Initialize socket-server
 * @param {import('http').Server} server
 */
const initSocket = (server) => {
    const io = new Server(server, opts);
    setIo(io);

    io.use(async (socket, next) => {
        const cookies = socket.handshake.headers.cookie;
        if (!cookies) {
            return next(new Error('Authentication error: No cookies provided'));
        }

        const cookiePairs = cookies.split('; ').reduce((acc, cookie) => {
            const [name, value] = cookie.split('=');
            acc[name] = value;
            return acc;
        }, {});

        const aTokenName = process.env.ACCESS_TOKEN_COOKIE_NAME;
        const rTokenName = process.env.REFRESH_TOKEN_COOKIE_NAME;

        const accessToken = cookiePairs[aTokenName];
        const refreshToken = cookiePairs[rTokenName];

        // if (process.env.NODE_ENV == "development") {
        //     console.log("socket-middleware#cookiePairs: ", cookiePairs);
        //     console.log("socket-middleware#accessToken: ", accessToken);
        //     console.log("socket-middleware#refreshToken: ", refreshToken);
        // }

        if (!accessToken && !refreshToken) {
            return next(new Error('Authentication error: No tokens provided'));
        }

        try {
            const { user } = await checkTokens(accessToken, refreshToken);

            socket.user = {
                id: user.userId,
                username: user.username,
            };

            if (process.env.NODE_ENV === "development") {
                console.log('Authenticated user:', socket.user);
            }

            return next();
        } catch (err) {
            if (process.env.NODE_ENV == "development") {
                console.log('Socket authentication failed:', err.message);
            }

            return next(new Error('unauthorized'));
        }
    });

    io.on('connection', (socket) => {
        socket.on(SOCKET_EVENTS.BOARD_JOIN, async (data) => {
            try {
                const boardId = data?.boardId;

                if (typeof boardId !== 'string' || !Types.ObjectId.isValid(boardId)) {
                    return;
                }

                const prevBoardId = socket.boardId;
                if (prevBoardId === boardId) {
                    // Reconnect/duplicate join for the same board — already there.
                    socket.join(boardId);
                    return;
                }

                const membership = await BoardMembership.findOne({
                    boardId,
                    userId: socket.user.id,
                });
                if (!membership) {
                    socket.emit(SOCKET_EVENTS.BOARD_UNAUTHORIZED, { message: "You are not a member of this board" });
                    return;
                }

                // Only leave the previous room after the new membership checks out.
                if (prevBoardId) {
                    socket.leave(prevBoardId);
                    socket.to(prevBoardId).emit(SOCKET_EVENTS.BOARD_MEMBER_LEFT, { memberId: socket.user.id });
                }

                socket.boardId = boardId;
                socket.join(boardId);
            } catch (err) {
                console.log('BOARD_JOIN error:', err.message);
            }
        });

        socket.on(SOCKET_EVENTS.BOARD_DISCONNECT, () => {
            const boardId = socket.boardId;
            if (boardId) {
                socket.leave(boardId);
                delete socket.boardId;
            }
        });

        socket.on("disconnect", (reason, details) => {
            console.log('DisconnectReason', reason);
            console.log('DisconnectDetails', details);

            const boardId = socket.boardId;
            if (boardId) {
                socket.leave(boardId);
                delete socket.boardId;
                console.log(`User with socket ID ${socket.id} disconnected from board ${boardId}`);
            } else {
                console.log(`User with socket ID ${socket.id} disconnected without joining a board`);
            }
        });
    });
};

export {
    initSocket,
};
