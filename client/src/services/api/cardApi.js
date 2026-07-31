import { apiClient } from "../../lib/api-client";

/**
 * @param {string} cardId
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<Card>}
 */
function fetchCard(cardId, { signal } = {}) {
    return apiClient.get(`/cards/${cardId}`, { signal });
}

/**
 * @param {{
 *   title: string
 *   boardId: string;
 *   listId: string;
 *   prevCardId?: string;
 *   nextCardId?: string;
 * }} params
 * @returns {Promise<Card>}
 */
function createCard(params) {
    return apiClient.post("/cards", params);
}

/**
 * @param {string} cardId
 * @returns {Promise<{ message: string }>}
 */
function deleteCard(cardId) {
    return apiClient.delete(`/cards/${cardId}`);
}

/**
 * @param {string} cardId
 * @param {string} prevId
 * @param {string} nextId
 * @returns {Promise<Card>}
 */
function copyCard(cardId, prevId, nextId) {
    return apiClient.post(`/cards/${cardId}/copy`, {
        prevCardId: prevId,
        nextCardId: nextId,
    });
}

/**
 * @param {string} cardId
 * @param {{
 *   listId: string;
 *   prevCardId: string | null | undefined;
 *   nextCardId: string | null | undefined;
 *   oldPos: number;
 *   newPos: number;
 * }} data
 * @returns {Promise<Card>}
 */
function reorderCard(cardId, data) {
    return apiClient.patch(`/cards/${cardId}/reorder`, data);
}

/**
 * @param {string} cardId
 * @param {string} field
 * @param {any} value
 * @returns {Promise<Card>}
 */
function updateCard(cardId, field, value) {
    return apiClient.patch(`/cards/${cardId}`, { field, value });
}

export default {
    fetchCard,
    createCard,
    deleteCard,
    copyCard,
    reorderCard,
    updateCard,
};
