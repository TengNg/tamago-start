export const chatKeys = {
    /**
    * @param {string} boardId
    */
    messages: (boardId) => {
        return ['chat', 'board', boardId, 'messages'];
    },

    /**
    * @param {string} boardId
    * @param {string} messageId
    */
    message: (boardId, messageId) => {
        return ['chat', 'board', boardId, 'messages', messageId]
    }
};
