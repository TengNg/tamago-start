import { apiClient } from "../../lib/api-client";

/**
 * @returns {Promise<CurrentUser>}
 */
function fetchCurrentUser() {
    return apiClient.get("/me");
}

/**
 * @param {{ username: string }} params
 * @returns {Promise<void>}
 */
function updateUsername({ username }) {
    return apiClient.patch("/me/username", { newUsername: username });
}

/**
 * @param {{ currentPassword: string, newPassword: string }} params
 * @returns {Promise<{ notice?: string; message?: string } | void>}
 */
function updatePassword({ currentPassword, newPassword }) {
    return apiClient.patch("/me/password", { currentPassword, newPassword });
}

/**
 * @param {string} boardId
 * @returns {Promise<{ pinnedBoards: CurrentUser["pinnedBoards"] }>}
 */
function pinBoard(boardId) {
    return apiClient.patch(`/me/pinned-boards/${boardId}`);
}

/**
 * @param {string} boardId
 * @param {{ prevBoardId: string | null | undefined; nextBoardId: string | null | undefined }} data
 * @returns {Promise<{ pinnedBoards: CurrentUser["pinnedBoards"] }>}
 */
function reorderPinnedBoard(boardId, data) {
    return apiClient.patch(`/me/pinned-boards/${boardId}/reorder`, data);
}

/**
 * @param {string} boardId
 * @returns {Promise<{ pinnedBoards: CurrentUser["pinnedBoards"] }>}
 */
function deletePinnedBoard(boardId) {
    return apiClient.delete(`/me/pinned-boards/${boardId}`);
}

/**
 * @returns {Promise<void>}
 */
function cleanPinnedBoards() {
    return apiClient.delete("/me/pinned-boards/");
}

export default {
    fetchCurrentUser,
    updateUsername,
    updatePassword,
    pinBoard,
    reorderPinnedBoard,
    deletePinnedBoard,
    cleanPinnedBoards,
};
