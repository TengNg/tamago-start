export const cardKeys = {
    /**
     * @param {string} cardId
     */
    detail: (cardId) => {
        return ["cards", "detail", cardId];
    },

    /**
     * @param {string} cardId
     */
    attachments: (cardId) => {
        return ["cards", "attachments", cardId];
    },

    /**
     * @param {string} cardId
     */
    comments: (cardId) => {
        return ["cards", "comments", cardId];
    },
};
