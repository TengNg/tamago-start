require('dotenv').config();

const jwt = require('jsonwebtoken');
const { Server: HttpServer } = require('http');
const { Server: SocketServer } = require("socket.io");

const __prod__ = process.env.MODE === "production";
const opts = __prod__ ? {} : {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
    },
};

const boardIdMap = new Map();
const usernameMap = {};

/**
 * Initialize socket-server
 * @param {HttpServer} server
 */
const initSocket = (server) => {
    const io = new SocketServer(server, opts);

    io.use(async (socket, next) => {
        const cookies = socket.handshake.headers.cookie;
        if (cookies) {
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
                const decoded = jwt.verify(accessToken, accessTokenSecret);
                socket.user = {
                    id: decoded.id,
                    username: decoded.username,
                };

                if (process.env.MODE === "development") {
                    console.log('Authenticated user:', socket.user);
                }

                next();
            } catch (err) {
                console.log('Access token verification failed:', err.message);
                return next(new Error('Authentication error: Invalid access token'));
            }
        }
        next();
    });

    io.on('connection', (socket) => {
        // BOARD ===============================================================

        socket.on("joinBoard", (data) => {
            const { boardId } = data;
            boardIdMap.set(socket.id, boardId);

            const username = socket.user.username;
            usernameMap[socket.id] = username;
            socket.join(boardId);

            if (process.env.MODE === "development") {
                console.log(`User [username: ${username}] [socket_id: ${socket.id}] joins board with id ${boardId}`);
            }
        });

        socket.on("leaveBoard", (_data) => {
            const boardId = boardIdMap.get(socket.id);
            if (!boardId) return;

            const username = socket.user.username;
            socket.to(boardId).emit("memberLeaved", { username });
        });

        socket.on("kickMember", (memberName) => {
            const boardId = boardIdMap.get(socket.id);
            if (!boardId) return;

            const userEntry = Object.entries(usernameMap).find(([_userId, username]) => username === memberName);
            if (!userEntry) return;

            const userSocketId = userEntry[0];
            socket.to(boardId).emit("memberKicked", { userSocketId });
        });

        socket.on("closeBoard", (_) => {
            const boardId = boardIdMap.get(socket.id);
            if (!boardId) return;
            boardIdMap.delete(socket.id);
            socket.leave(boardId);
            socket.to(boardId).emit("boardClosed");
        });

        socket.on("updateBoardTitle", (data) => {
            const boardId = boardIdMap.get(socket.id);
            if (!boardId) return;
            socket.to(boardId).emit("getBoardWithUpdatedTitle", data);
        });

        socket.on("updateBoardDescription", (data) => {
            const boardId = boardIdMap.get(socket.id);
            if (!boardId) return;
            socket.to(boardId).emit("getBoardWithUpdatedDescription", data);
        });


        // LIST ================================================================

        socket.on("updateLists", (data) => {
            const boardId = boardIdMap.get(socket.id);
            if (!boardId) return;
            socket.to(boardId).emit("getBoardWithUpdatedLists", data);
        });

        socket.on("moveList", (data) => {
            const boardId = boardIdMap.get(socket.id);
            if (!boardId) return;
            socket.to(boardId).emit("listMoved", data);
        });

        socket.on("addMovedListToBoard", (data) => {
            const { boardId, list, cards, index } = data;
            socket.to(boardId).emit("getBoardWithMovedListAdded", { list, cards, index });
        });

        socket.on("addList", (data) => {
            const boardId = boardIdMap.get(socket.id);
            if (!boardId) return;
            socket.to(boardId).emit("newList", data);
        });

        socket.on("deleteList", (data) => {
            const boardId = boardIdMap.get(socket.id);
            if (!boardId) return;
            socket.to(boardId).emit("deletedList", data);
        });

        // CARD ================================================================

        socket.on("addCard", (data) => {
            const boardId = boardIdMap.get(socket.id);
            if (!boardId) return;
            socket.to(boardId).emit("newCard", data);
        });

        socket.on("deleteCard", (data) => {
            const boardId = boardIdMap.get(socket.id);
            if (!boardId) return;
            socket.to(boardId).emit("deletedCard", data);
        });

        socket.on("copyCard", (data) => {
            const boardId = boardIdMap.get(socket.id);
            if (!boardId) return;
            socket.to(boardId).emit("copyCard", data);
        });

        socket.on("moveCard", (data) => {
            const boardId = boardIdMap.get(socket.id);
            if (!boardId) return;
            socket.to(boardId).emit("cardMoved", data);
        });

        socket.on("moveCardByIndex", (data) => {
            const boardId = boardIdMap.get(socket.id);
            if (!boardId) return;
            socket.to(boardId).emit("cardMovedByIndex", data);
        });

        socket.on("moveCardToList", (data) => {
            const boardId = boardIdMap.get(socket.id);
            if (!boardId) return;
            socket.to(boardId).emit("cardMovedToList", data);
        });

        socket.on("updateCardOwner", (data) => {
            const boardId = boardIdMap.get(socket.id);
            if (!boardId) return;
            socket.to(boardId).emit("cardOwnerUpdated", { ...data });
        });

        socket.on("updateCardPriorityLevel", (data) => {
            const boardId = boardIdMap.get(socket.id);
            if (!boardId) return;
            socket.to(boardId).emit("cardPriorityLevelUpdated", { ...data });
        });

        socket.on("updateListTitle", (data) => {
            const boardId = boardIdMap.get(socket.id);
            if (!boardId) return;
            socket.to(boardId).emit("updatedListTitle", data);
        });

        socket.on("updateCardTitle", (data) => {
            const boardId = boardIdMap.get(socket.id);
            if (!boardId) return;
            socket.to(boardId).emit("updatedCardTitle", data);
        });

        socket.on("updateCardHighlight", (data) => {
            const boardId = boardIdMap.get(socket.id);
            if (!boardId) return;
            socket.to(boardId).emit("updatedCardHighlight", data);
        });

        socket.on("updateCardDescription", (data) => {
            const boardId = boardIdMap.get(socket.id);
            if (!boardId) return;
            socket.to(boardId).emit("updatedCardDescription", data);
        });

        socket.on("updateCardVerifiedStatus", (data) => {
            const boardId = boardIdMap.get(socket.id);
            if (!boardId) return;
            socket.to(boardId).emit("updatedCardVerifiedStatus", data);
        });

        socket.on("updateCardDueDate", (data) => {
            const boardId = boardIdMap.get(socket.id);
            if (!boardId) return;
            socket.to(boardId).emit("updatedCardDueDate", data);
        });

        // CHAT_MESSAGE ========================================================

        socket.on("sendMessage", (data) => {
            const boardId = boardIdMap.get(socket.id);
            if (!boardId) return;
            socket.to(boardId).emit("receiveMessage", data);
        });

        socket.on("deleteMessage", (data) => {
            const boardId = boardIdMap.get(socket.id);
            if (!boardId) return;
            socket.to(boardId).emit("messageDeleted", data);
        });

        socket.on("clearMessages", (_) => {
            const boardId = boardIdMap.get(socket.id);
            if (!boardId) return;
            socket.to(boardId).emit("messagesCleared");
        });

        // CARD_COMMENT ========================================================

        socket.on("addCardComment", (data) => {
            const boardId = boardIdMap.get(socket.id);
            if (!boardId) return;
            socket.to(boardId).emit("cardCommentAdded", data);
        });

        socket.on("deleteCardComment", (data) => {
            const boardId = boardIdMap.get(socket.id);
            if (!boardId) return;
            socket.to(boardId).emit("cardCommentDeleted", data);
        });

        // DISCONNECTION =======================================================

        socket.on("disconnectFromBoard", () => {
            const boardId = boardIdMap.get(socket.id);
            if (boardId) {
                socket.leave(boardId);
                boardIdMap.delete(socket.id);
                delete usernameMap[socket.id];
                // console.log(`#disconnectFromBoard: User with socket ID ${socket.id} disconnected from board ${boardId}`);
            } else {
                // console.log(`#disconnectFromBoard: User with socket ID ${socket.id} disconnected without joining a board`);
            }
        });

        socket.on("disconnect", (reason, details) => {
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
