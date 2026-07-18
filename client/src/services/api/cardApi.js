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
 *   boardId: string;
 *   listId: string;
 *   order: string;
 *   title: string
 * }} cardData
 * @returns {Promise<Card>}
 */
function createCard(cardData) {
    return apiClient.post("/cards", cardData);
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
 * @param {string} rank
 * @returns {Promise<Card>}
 */
function copyCard(cardId, rank) {
    return apiClient.post(`/cards/${cardId}/copy`, { rank });
}

/**
 * @param {string} cardId
 * @param {{
 *   rank: string;
 *   listId: string;
 *   oldPos: number;
 *   newPos: number;
 * }} data
 * @returns {Promise<{ oldListId: string; newCard: Card }>}
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
