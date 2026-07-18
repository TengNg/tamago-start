import { apiClient } from "../../lib/api-client";

/**
 * @param {string} [filter]
 * @returns {Promise<{ writedowns: Writedown[] }>}
 */
function fetchWritedowns(filter = "") {
    return apiClient.get("/personal_writedowns", { query: { filter } });
}

/**
 * @param {string} id
 * @returns {Promise<{ writedown: Writedown }>}
 */
function fetchWritedown(id) {
    return apiClient.get(`/personal_writedowns/${id}`);
}

/**
 * @param {string} rank
 * @returns {Promise<{ newWritedown: Writedown }>}
 */
function createWritedown(rank) {
    return apiClient.post("/personal_writedowns", { rank });
}

/**
 * @param {string} id
 * @param {string} content
 * @returns {Promise<{ updatedWritedown: { _id: string, title: string, content: string, createdAt: string } }>}
 */
function saveWritedown(id, content) {
    return apiClient.patch(`/personal_writedowns/${id}`, { content });
}

/**
 * @param {string} id
 * @returns {Promise<void>}
 */
function deleteWritedown(id) {
    return apiClient.delete(`/personal_writedowns/${id}`);
}

/**
 * @returns {Promise<void>}
 */
function deleteAllWritedowns() {
    return apiClient.delete("/personal_writedowns/");
}

/**
 * @param {string} id
 * @param {string} title
 * @returns {Promise<void>}
 */
function updateWritedownTitle(id, title) {
    return apiClient.patch(`/personal_writedowns/${id}/title`, { title });
}

/**
 * @param {string} id
 * @returns {Promise<{ pinned: boolean }>}
 */
function pinWritedown(id) {
    return apiClient.patch(`/personal_writedowns/${id}/pin`);
}

/**
 * @param {string} id
 * @param {string} rank
 * @returns {Promise<void>}
 */
function reorderWritedown(id, rank) {
    return apiClient.patch(`/personal_writedowns/${id}/reorder`, { rank });
}

export default {
    fetchWritedowns,
    fetchWritedown,
    createWritedown,
    saveWritedown,
    deleteWritedown,
    deleteAllWritedowns,
    updateWritedownTitle,
    pinWritedown,
    reorderWritedown,
};
