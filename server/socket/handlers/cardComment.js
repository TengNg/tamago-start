/**
 * @param {import('socket.io').Socket} socket
 * @param {SocketSharedState} state
 */
export default function registerCardCommentHandlers(socket, state) {
    const { boardIdMap } = state;

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
}
