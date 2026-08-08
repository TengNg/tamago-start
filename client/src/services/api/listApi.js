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
 * @param {{
 *  title: string;
 *  boardId: string;
 *  prevListId?: string;
 * }} listData
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
 * @param {string | undefined} prevId
 * @param {string | undefined} nextId
 * @returns {Promise<{ list: List; cards: Card[] }>}
 */
function copyList(listId, prevId, nextId) {
    return apiClient.post(`/lists/copy/${listId}`, {
        prevListId: prevId,
        nextListId: nextId,
    });
}

/**
 * @param {string} listId
 * @param {{
 *   prevListId: string | null | undefined;
 *   nextListId: string | null | undefined;
 *   oldPos: number;
 *   newPos: number;
 * }} data
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
