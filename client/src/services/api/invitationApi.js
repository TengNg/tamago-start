import { apiClient } from "../../lib/api-client";

/**
 * @param {{ page: string | number }} params
 * @returns {Promise<GetInvitationsResponse>}
 */
function fetchInvitations({ page }) {
    return apiClient.get("/invitations", { query: { page } });
}

/**
 * @param {string} invitationId
 * @returns {Promise<{ invitation: InvitationItem }>}
 */
function acceptInvitation(invitationId) {
    return apiClient.patch(`/invitations/${invitationId}/accept`, {
        id: invitationId,
    });
}

/**
 * @param {string} invitationId
 * @returns {Promise<{ invitation: InvitationItem }>}
 */
function rejectInvitation(invitationId) {
    return apiClient.patch(`/invitations/${invitationId}/reject`, {
        id: invitationId,
    });
}

/**
 * @param {string} invitationId
 * @returns {Promise<{ message: string }>}
 */
function removeInvitation(invitationId) {
    return apiClient.delete(`/invitations/${invitationId}`);
}

/**
 * @param {string} boardId
 * @param {string} receiverName
 * @returns {Promise<InvitationItem>}
 */
function sendInvitation(boardId, receiverName) {
    return apiClient.post("/invitations", { boardId, receiverName });
}

/**
 * @param {string} boardId
 * @param {string} memberId
 * @returns {Promise<{ message: string }>}
 */
function removeBoardMember(boardId, memberId) {
    return apiClient.delete(`/boards/${boardId}/members/${memberId}`);
}

export default {
    fetchInvitations,
    acceptInvitation,
    rejectInvitation,
    removeInvitation,
    sendInvitation,
    removeBoardMember,
};
