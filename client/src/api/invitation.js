import { apiClient } from "../lib/api-client";

/**
 * @param {{ page: string | number }} params
 * @returns {Promise<GetInvitationsResponse>}
 */
export function fetchInvitations({ page }) {
    return apiClient.get("/invitations", { query: { page } });
}

/**
 * @param {string} invitationId
 * @returns {Promise<{ invitation: InvitationItem }>}
 */
export function acceptInvitation(invitationId) {
    return apiClient.patch(`/invitations/${invitationId}/accept`, {
        id: invitationId,
    });
}

/**
 * @param {string} invitationId
 * @returns {Promise<{ invitation: InvitationItem }>}
 */
export function rejectInvitation(invitationId) {
    return apiClient.patch(`/invitations/${invitationId}/reject`, {
        id: invitationId,
    });
}

/**
 * @param {string} invitationId
 * @returns {Promise<{ message: string }>}
 */
export function removeInvitation(invitationId) {
    return apiClient.delete(`/invitations/${invitationId}`);
}

/**
 * @param {string} boardId
 * @param {string} receiverName
 * @returns {Promise<InvitationItem>}
 */
export function sendInvitation(boardId, receiverName) {
    return apiClient.post("/invitations", { boardId, receiverName });
}

/**
 * @param {string} boardId
 * @param {string} memberId
 * @returns {Promise<{ message: string }>}
 */
export function removeBoardMember(boardId, memberId) {
    return apiClient.delete(`/boards/${boardId}/members/${memberId}`);
}
