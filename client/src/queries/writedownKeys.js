export const writedownKeys = {
    /**
     * @param {string} [filter=""]
     */
    all: (filter = "") => {
        return ["writedowns", { filter }];
    },

    /**
     * @param {string} id
     */
    detail: (id) => {
        return ["writedowns", "detail", id];
    },
};
