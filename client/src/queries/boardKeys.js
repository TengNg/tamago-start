export const boardKeys = {
    /**
     * @param {string} [filter=all]
     */
    all: (filter = "all") => {
        return ["boards", filter];
    },

    /**
     * @param {string} boardId
     */
    detail: (boardId) => {
        return ["boards", "detail", boardId];
    },

    /**
     * @param {string} boardId
     */
    stats: (boardId) => {
        return ["boards", "detail", boardId, "stats"];
    },
};
