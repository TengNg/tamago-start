import { apiClient } from "../lib/api-client";

/**
 * @param {string} movedListId
 * @param {string} selectedBoardId
 * @param {number | string} selectedIndex
 * @returns {Promise<{ list: List; cards: Card[] }>}
 */
export function moveList(movedListId, selectedBoardId, selectedIndex) {
    return apiClient.patch(
        `/lists/move/${movedListId}/b/${selectedBoardId}/i/${selectedIndex}`,
    );
}

/**
 * @param {{ title: string, order: string, boardId: string }} listData
 * @returns {Promise<List>}
 */
export function createList(listData) {
    return apiClient.post("/lists", listData);
}

/**
 * @param {string} listId
 * @param {string} field
 * @param {string} value
 * @returns {Promise<List>}
 */
export function updateList(listId, field, value) {
    return apiClient.patch(`/lists/${listId}`, { field, value });
}

/**
 * @param {string} listId
 * @returns {Promise<void>}
 */
export function deleteList(listId) {
    return apiClient.delete(`/lists/${listId}`);
}

/**
 * @param {string} listId
 * @param {string} rank
 * @returns {Promise<{ list: List; cards: Card[] }>}
 */
export function copyList(listId, rank) {
    return apiClient.post(`/lists/copy/${listId}`, { rank });
}

/**
 * @param {string} listId
 * @param {any} data
 * @returns {Promise<List>}
 */
export function reorderList(listId, data) {
    return apiClient.patch(`/lists/${listId}/reorder`, data);
}
