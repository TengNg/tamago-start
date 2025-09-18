/**
 * @param {import('socket.io').Socket} socket
 * @param {SocketSharedState} state
 */
function registerCardHandlers(socket, state) {
    const { boardIdMap } = state;

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
}

module.exports = registerCardHandlers;
