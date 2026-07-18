import { apiClient } from "../../lib/api-client";

/**
 * @param {{
 *   boardId: string;
 *   limit?: number;
 *   before?: string;
 * }} param
 * @returns {Promise<GetChatResponse>}
 */
function fetchChat({ boardId, limit = 20, before }) {
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
function sendMessage({ boardId, content }) {
    return apiClient.post(`/chat/messages/b/${boardId}`, { content });
}

/**
 * @param {string} id
 * @returns {Promise<void>}
 */
function deleteMessage(id) {
    return apiClient.delete(`/chat/messages/${id}`);
}

/**
 * @param {string} boardId
 * @returns {Promise<void>}
 */
function clearMessages(boardId) {
    return apiClient.delete(`/chat/messages/b/${boardId}`);
}

export default { fetchChat, sendMessage, deleteMessage, clearMessages };
