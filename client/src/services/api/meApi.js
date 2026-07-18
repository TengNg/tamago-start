import { apiClient } from "../../lib/api-client";

/**
 * @returns {Promise<{ user: CurrentUser }>}
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
 * @returns {Promise<{ pinnedBoards: Record<string, { title: string }> }>}
 */
function pinBoard(boardId) {
    return apiClient.patch(`/me/pinned-boards/${boardId}`);
}

/**
 * @param {Record<string, { title: string }>} newPinnedBoards
 * @returns {Promise<{ pinnedBoards: Record<string, { title: string }> }>}
 */
function updatePinnedBoards(newPinnedBoards) {
    return apiClient.patch("/me/pinned-boards", {
        pinnedBoards: newPinnedBoards,
    });
}

/**
 * @param {string} boardId
 * @returns {Promise<{ pinnedBoards: Record<string, { title: string }> }>}
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
    updatePinnedBoards,
    deletePinnedBoard,
    cleanPinnedBoards,
};
