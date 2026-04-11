export const chatKeys = {
    /**
     * @param {string} boardId
     */
    messages: (boardId) => {
        return ["chat", "messages", "board", boardId];
    },
};
