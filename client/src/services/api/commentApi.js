import { apiClient } from "../../lib/api-client";

/**
 * @param {string} cardId
 * @param {string} commentId
 * @returns {Promise<{ comment: CardComment }>}
 */
function fetchComment(cardId, commentId) {
    return apiClient.get(`/cards/${cardId}/comments/${commentId}`);
}

/**
 * @param {string} cardId
 * @param {{ page?: string | number }} [opts]
 * @returns {Promise<GetCardCommentsResponse>}
 */
function fetchComments(cardId, { page = 1 } = {}) {
    return apiClient.get(`/cards/${cardId}/comments`, { query: { page } });
}

/**
 * @param {string} cardId
 * @param {string} content
 * @returns {Promise<{ comment: CardComment }>}
 */
function addComment(cardId, content) {
    return apiClient.post(`/cards/${cardId}/comments`, { content });
}

/**
 * @param {string} cardId
 * @param {string} commentId
 * @returns {Promise<void>}
 */
function deleteComment(cardId, commentId) {
    return apiClient.delete(`/cards/${cardId}/comments/${commentId}`);
}

export default { fetchComment, fetchComments, addComment, deleteComment };
