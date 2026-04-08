/**
 * @param {import('socket.io').Socket} socket
 * @param {SocketSharedState} state
 */
export default function registerListHandlers(socket, state) {
    const { boardIdMap } = state;

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

    socket.on("updateListTitle", (data) => {
        const boardId = boardIdMap.get(socket.id);
        if (!boardId) return;
        socket.to(boardId).emit("updatedListTitle", data);
    });
}
