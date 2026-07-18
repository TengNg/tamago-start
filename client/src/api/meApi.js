import { apiClient } from "../lib/api-client";

/**
 * @returns {Promise<{ user: CurrentUser }>}
 */
export function fetchCurrentUser() {
    return apiClient.get("/me");
}

/**
 * @param {{ username: string }} params
 * @returns {Promise<void>}
 */
export function updateUsername({ username }) {
    return apiClient.patch("/me/username", { newUsername: username });
}

/**
 * @param {{ currentPassword: string, newPassword: string }} params
 * @returns {Promise<{ notice?: string; message?: string } | void>}
 */
export function updatePassword({ currentPassword, newPassword }) {
    return apiClient.patch("/me/password", { currentPassword, newPassword });
}

/**
 * @param {string} boardId
 * @returns {Promise<{ pinnedBoards: Record<string, { title: string }> }>}
 */
export function pinBoard(boardId) {
    return apiClient.patch(`/me/pinned-boards/${boardId}`);
}

/**
 * @param {Record<string, { title: string }>} newPinnedBoards
 * @returns {Promise<{ pinnedBoards: Record<string, { title: string }> }>}
 */
export function updatePinnedBoards(newPinnedBoards) {
    return apiClient.patch("/me/pinned-boards", {
        pinnedBoards: newPinnedBoards,
    });
}

/**
 * @param {string} boardId
 * @returns {Promise<{ pinnedBoards: Record<string, { title: string }> }>}
 */
export function deletePinnedBoard(boardId) {
    return apiClient.delete(`/me/pinned-boards/${boardId}`);
}

/**
 * @returns {Promise<void>}
 */
export function cleanPinnedBoards() {
    return apiClient.delete("/me/pinned-boards/");
}
