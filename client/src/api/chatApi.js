import { apiClient } from "../lib/api-client";

/**
 * @param {{
 *   boardId: string;
 *   limit?: number;
 *   before?: string;
 * }} param
 * @returns {Promise<GetChatResponse>}
 */
export function fetchChat({ boardId, limit = 20, before }) {
    return apiClient.get(`/chat/messages/b/${boardId}`, {
        query: { limit, ...(before ? { before } : {}) },
    });
}

/**
 * @param {{
 *   boardId: string;
 *   content: string;
 * }} param
 * @returns {Promise<{ chatMessage: ChatMessage }>}
 */
export function sendMessage({ boardId, content }) {
    return apiClient.post(`/chat/messages/b/${boardId}`, { content });
}

/**
 * @param {string} id
 * @returns {Promise<void>}
 */
export function deleteMessage(id) {
    return apiClient.delete(`/chat/messages/${id}`);
}

/**
 * @param {string} boardId
 * @returns {Promise<void>}
 */
export function clearMessages(boardId) {
    return apiClient.delete(`/chat/messages/b/${boardId}`);
}
