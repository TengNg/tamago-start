/**
 * @param {import('socket.io').Socket} socket
 * @param {SocketSharedState} state
 */
export default function registerChatHandlers(socket, state) {
    const { boardIdMap } = state;

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
}
