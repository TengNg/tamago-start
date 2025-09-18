/**
 * @param {import('socket.io').Socket} socket
 * @param {SocketSharedState} state
 */
function registerBoardHandlers(socket, state) {
    const { boardIdMap, usernameMap } = state;

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
}

module.exports = registerBoardHandlers;
