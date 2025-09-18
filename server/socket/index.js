require('dotenv').config();

const jwt = require('jsonwebtoken');
const { Server: HttpServer } = require('http');
const { Server: SocketServer } = require("socket.io");
const state = require('./state');

const __prod__ = process.env.MODE === "production";
const opts = __prod__ ? {} : {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
    },
};

/**
 * @param {import("socket.io").Socket} socket
 */
const registerHandlers = (socket) => {
    const registerBoardHandlers = require('./handlers/board');
    const registerListHandlers = require('./handlers/list');
    const registerCardHandlers = require('./handlers/card');
    const registerChatHandlers = require('./handlers/chat');
    const registerCardCommentHandlers = require('./handlers/cardComment');
    registerBoardHandlers(socket, state);
    registerListHandlers(socket, state);
    registerCardHandlers(socket, state);
    registerChatHandlers(socket, state);
    registerCardCommentHandlers(socket, state);
};

/**
 * Initialize socket-server
 * @param {HttpServer} server
 */
const initSocket = (server) => {
    const io = new SocketServer(server, opts);

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
        const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

        const accessToken = cookiePairs[aTokenName];
        const refreshToken = cookiePairs[rTokenName];

        if (process.env.MODE == "development") {
            console.log("socket-middleware#cookiePairs: ", cookiePairs);
            console.log("socket-middleware#accessToken: ", accessToken);
            console.log("socket-middleware#refreshToken: ", refreshToken);
        }

        if (!accessToken) {
            return next(new Error('Authentication error: No access token provided'));
        }

        try {
            /** @type UserPayload */
            const decoded = jwt.verify(accessToken, accessTokenSecret);

            if (process.env.MODE === "development") {
                console.log("Token decoded data: ", decoded);
            }

            if (!decoded) {
                return next(new Error('Authentication error: Invalid token'));
            }

            socket.user = {
                id: decoded.userId,
                username: decoded.username,
            };

            if (process.env.MODE === "development") {
                console.log('Authenticated user:', socket.user);
            }

            return next();
        } catch (err) {
            console.log('Access token verification failed:', err.message);
            return next(new Error('Authentication error: Invalid access token'));
        }
    });

    io.on('connection', (socket) => {
        // register all feature handlers
        registerHandlers(socket);

        socket.on("disconnectFromBoard", () => {
            const { boardIdMap, usernameMap } = state;
            const boardId = boardIdMap.get(socket.id);
            if (boardId) {
                socket.leave(boardId);
                boardIdMap.delete(socket.id);
                delete usernameMap[socket.id];
            }
        });

        socket.on("disconnect", (reason, details) => {
            const { boardIdMap, usernameMap } = state;
            console.log('DisconnectReason', reason);
            console.log('DisconnectDetails', details);

            const boardId = boardIdMap.get(socket.id);
            if (boardId) {
                socket.leave(boardId);
                boardIdMap.delete(socket.id);
                delete usernameMap[socket.id];
                console.log(`User with socket ID ${socket.id} disconnected from board ${boardId}`);
            } else {
                console.log(`User with socket ID ${socket.id} disconnected without joining a board`);
            }
        });
    });
}

module.exports = {
    initSocket,
}
