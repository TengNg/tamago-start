import { apiClient } from "../lib/api-client";

/**
 * @param {{ filter: string }} [opts={ filter: "" }]
 * @returns {Promise<GetBoardsResponse>}
 */
export function fetchBoards(opts = { filter: "" }) {
    return apiClient.get("/boards", { query: { filter: opts.filter } });
}

/**
 * @param {string} boardId
 * @returns {Promise<BoardState>}
 */
export function fetchBoard(boardId) {
    return apiClient.get(`/boards/${boardId}`);
}

/**
 * @param {{ boardId: string, page: number | string }} opts
 * @returns {Promise<GetBoardActivitiesResponse>}
 */
export function fetchBoardActivities({ boardId, page }) {
    return apiClient.get(`/boards/${boardId}/activities`, { query: { page } });
}

/**
 * @param {string} boardId
 * @returns {Promise<{ message: string }>}
 */
export function cleanBoardActivities(boardId) {
    return apiClient.delete(`/boards/${boardId}/activities`);
}

/**
 * @param {string} boardId
 * @returns {Promise<{ count: number }>}
 */
export function fetchBoardListCount(boardId) {
    return apiClient.get(`/boards/${boardId}/list-count`);
}

/**
 * @param {string} boardId
 * @returns {Promise<BoardStatsResponse>}
 */
export function fetchBoardStats(boardId) {
    return apiClient.get(`/boards/${boardId}/stats`);
}

/**
 * @param {{ title: string, description: string }} data
 * @returns {Promise<Board>}
 */
export function createBoard({ title, description }) {
    return apiClient.post("/boards", { title, description });
}

/**
 * @param {string} boardId
 * @param {string} field
 * @param {string} value
 * @returns {Promise<Board>}
 */
export function updateBoard(boardId, field, value) {
    return apiClient.patch(`/boards/${boardId}`, { field, value });
}

/**
 * @param {string} boardId
 * @returns {Promise<{ message: string }>}
 */
export function deleteBoard(boardId) {
    return apiClient.delete(`/boards/${boardId}`);
}

/**
 * @param {string} boardId
 * @returns {Promise<{ message: string }>}
 */
export function leaveBoard(boardId) {
    return apiClient.delete(`/boards/${boardId}/members/leave`);
}

/**
 * @param {string} boardId
 * @param {{ title: string, desciption: string }} data
 * @returns {Promise<{ message: string }>}
 */
export function copyBoard(boardId, { title, desciption }) {
    return apiClient.post(`/boards/copy/${boardId}`, { title, desciption });
}
