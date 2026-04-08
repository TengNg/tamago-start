/**
 * @param {import('socket.io').Socket} socket
 * @param {SocketSharedState} state
 */
export default function registerCardAttachmentHandlers(socket, state) {
    const { boardIdMap } = state;

    socket.on("addCardAttachment", (data) => {
        const boardId = boardIdMap.get(socket.id);
        if (!boardId) return;
        socket.to(boardId).emit("cardAttachmentAdded", data);
    });

    socket.on("deleteCardAttachment", (data) => {
        const boardId = boardIdMap.get(socket.id);
        if (!boardId) return;
        socket.to(boardId).emit("cardAttachmentDeleted", data);
    });
}
