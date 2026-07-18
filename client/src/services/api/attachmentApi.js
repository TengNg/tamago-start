import { apiClient } from "../../lib/api-client";

/**
 * @param {string} attachmentId
 * @returns {Promise<Blob>}
 */
function viewAttachment(attachmentId) {
    return apiClient.get(`/attachments/${attachmentId}`, {
        responseType: "blob",
    });
}

/**
 * @param {string} cardId
 * @param {string} docModel
 * @returns {Promise<Attachment[]>}
 */
function fetchAttachments(cardId, docModel) {
    return apiClient.get(`/attachments/${cardId}/${docModel}`);
}

/**
 * @param {FormData} formData
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<Attachment>}
 */
function uploadAttachment(formData, { signal } = {}) {
    return apiClient.post("/attachments/upload", formData, {
        signal,
    });
}

/**
 * @param {string} attachmentId
 * @returns {Promise<{ id: string }>}
 */
function deleteAttachment(attachmentId) {
    return apiClient.delete(`/attachments/${attachmentId}`);
}

export default {
    viewAttachment,
    fetchAttachments,
    uploadAttachment,
    deleteAttachment,
};
