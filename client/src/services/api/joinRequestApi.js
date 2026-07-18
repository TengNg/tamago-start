import { apiClient } from "../../lib/api-client";

/**
 * @param {{ page: string | number }} params
 * @returns {Promise<GetJoinRequestsResponse>}
 */
function fetchJoinRequests({ page }) {
    return apiClient.get("/join_board_requests", { query: { page } });
}

/**
 * @param {{ id: string, boardId: string, requesterId: string }} params
 * @returns {Promise<void>}
 */
function acceptJoinRequest({ id, boardId, requesterId }) {
    return apiClient.patch(`/join_board_requests/${id}/accept`, {
        boardId,
        requesterId,
    });
}

/**
 * @param {{ id: string, boardId: string, requesterId: string }} params
 * @returns {Promise<void>}
 */
function rejectJoinRequest({ id, boardId, requesterId }) {
    return apiClient.patch(`/join_board_requests/${id}/reject`, {
        boardId,
        requesterId,
    });
}

/**
 * @param {string} id
 * @returns {Promise<void>}
 */
function removeJoinRequest(id) {
    return apiClient.delete(`/join_board_requests/${id}`);
}

/**
 * @param {string} boardId
 * @returns {Promise<void>}
 */
function sendJoinRequest(boardId) {
    return apiClient.post("/join_board_requests/", { boardId });
}

export default {
    fetchJoinRequests,
    acceptJoinRequest,
    rejectJoinRequest,
    removeJoinRequest,
    sendJoinRequest,
};
