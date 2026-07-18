import { apiClient } from "../../lib/api-client";

/**
 * @param {string} movedListId
 * @param {string} selectedBoardId
 * @param {number | string} selectedIndex
 * @returns {Promise<{ list: List; cards: Card[] }>}
 */
function moveList(movedListId, selectedBoardId, selectedIndex) {
    return apiClient.patch(
        `/lists/move/${movedListId}/b/${selectedBoardId}/i/${selectedIndex}`,
    );
}

/**
 * @param {{ title: string, order: string, boardId: string }} listData
 * @returns {Promise<List>}
 */
function createList(listData) {
    return apiClient.post("/lists", listData);
}

/**
 * @param {string} listId
 * @param {string} field
 * @param {string} value
 * @returns {Promise<List>}
 */
function updateList(listId, field, value) {
    return apiClient.patch(`/lists/${listId}`, { field, value });
}

/**
 * @param {string} listId
 * @returns {Promise<void>}
 */
function deleteList(listId) {
    return apiClient.delete(`/lists/${listId}`);
}

/**
 * @param {string} listId
 * @param {string} rank
 * @returns {Promise<{ list: List; cards: Card[] }>}
 */
function copyList(listId, rank) {
    return apiClient.post(`/lists/copy/${listId}`, { rank });
}

/**
 * @param {string} listId
 * @param {any} data
 * @returns {Promise<List>}
 */
function reorderList(listId, data) {
    return apiClient.patch(`/lists/${listId}/reorder`, data);
}

export default {
    moveList,
    createList,
    updateList,
    deleteList,
    copyList,
    reorderList,
};
