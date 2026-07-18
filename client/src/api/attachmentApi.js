import { apiClient } from "../lib/api-client";

/**
 * @param {string} attachmentId
 * @returns {Promise<Blob>}
 */
export function viewAttachment(attachmentId) {
    return apiClient.get(`/attachments/${attachmentId}`, {
        responseType: "blob",
    });
}

/**
 * @param {string} cardId
 * @param {string} docModel
 * @returns {Promise<Attachment[]>}
 */
export function fetchAttachments(cardId, docModel) {
    return apiClient.get(`/attachments/${cardId}/${docModel}`);
}

/**
 * @param {FormData} formData
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<Attachment>}
 */
export function uploadAttachment(formData, { signal } = {}) {
    return apiClient.post("/attachments/upload", formData, {
        signal,
    });
}

/**
 * @param {string} attachmentId
 * @returns {Promise<{ id: string }>}
 */
export function deleteAttachment(attachmentId) {
    return apiClient.delete(`/attachments/${attachmentId}`);
}
