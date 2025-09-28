/**
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 * @param {SocketSharedState} state
 */
function registerBoardHandlers(io, socket, state) {
    const { boardIdMap } = state;

    socket.on("joinBoard", (data) => {
        const { boardId } = data;
        boardIdMap.set(socket.id, boardId);

        socket.join(boardId);

        if (process.env.MODE === "development") {
            console.log(`User[id=${socket.user.id}][username=${socket.user.username}][socket_id=${socket.id}] joins board with id ${boardId}`);
        }
    });

    socket.on("leaveBoard", (_data) => {
        const boardId = boardIdMap.get(socket.id);
        if (!boardId) return;

        const user = socket.user;
        socket.to(boardId).emit("memberLeaved", { username: user.username });
    });

    socket.on("kickMember", (memberName) => {
        const boardId = boardIdMap.get(socket.id);
        if (!boardId) return;

        const connectedSockets = io.sockets.sockets;
        const targetSocket = Array.from(connectedSockets.values()).find(s => s.user && s.user.username === memberName);
        if (!targetSocket) return;
        socket.to(boardId).emit("memberKicked", { userSocketId: targetSocket.id });
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
