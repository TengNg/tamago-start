import { Server } from "socket.io";
import { SOCKET_EVENTS } from '../../shared/socket-events.js';
import { checkTokens } from '../middlewares/authenticateToken.js';

// handlers
import registerBoardHandlers from './handlers/board.js';
import registerListHandlers from './handlers/list.js';
import registerCardHandlers from './handlers/card.js';
import registerChatHandlers from './handlers/chat.js';
import registerCardCommentHandlers from './handlers/cardComment.js';
import registerCardAttachmentHandlers from './handlers/cardAttachment.js';

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

        if (process.env.NODE_ENV == "development") {
            console.log("socket-middleware#cookiePairs: ", cookiePairs);
            console.log("socket-middleware#accessToken: ", accessToken);
            console.log("socket-middleware#refreshToken: ", refreshToken);
        }

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
        // register all feature handlers
        registerBoardHandlers(io, socket);
        registerListHandlers(socket);
        registerCardHandlers(socket);
        registerChatHandlers(socket);
        registerCardCommentHandlers(socket);
        registerCardAttachmentHandlers(socket);

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
