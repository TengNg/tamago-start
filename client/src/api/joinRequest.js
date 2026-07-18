import { apiClient } from "../lib/api-client";

/**
 * @param {{ page: string | number }} params
 * @returns {Promise<GetJoinRequestsResponse>}
 */
export function fetchJoinRequests({ page }) {
    return apiClient.get("/join_board_requests", { query: { page } });
}

/**
 * @param {{ id: string, boardId: string, requesterId: string }} params
 * @returns {Promise<void>}
 */
export function acceptJoinRequest({ id, boardId, requesterId }) {
    return apiClient.patch(`/join_board_requests/${id}/accept`, {
        boardId,
        requesterId,
    });
}

/**
 * @param {{ id: string, boardId: string, requesterId: string }} params
 * @returns {Promise<void>}
 */
export function rejectJoinRequest({ id, boardId, requesterId }) {
    return apiClient.patch(`/join_board_requests/${id}/reject`, {
        boardId,
        requesterId,
    });
}

/**
 * @param {string} id
 * @returns {Promise<void>}
 */
export function removeJoinRequest(id) {
    return apiClient.delete(`/join_board_requests/${id}`);
}

/**
 * @param {string} boardId
 * @returns {Promise<void>}
 */
export function sendJoinRequest(boardId) {
    return apiClient.post("/join_board_requests/", { boardId });
}
