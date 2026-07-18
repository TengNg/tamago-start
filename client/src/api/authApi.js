import { apiClient } from "../lib/api-client";

/**
 * @param {{ username: string, password: string }} params
 * @returns {Promise<void>}
 */
export function login({ username, password }) {
    return apiClient.post("/login", {
        username: username.trim(),
        password,
    });
}

/**
 * @param {{ username: string, password: string, confirmedPassword: string }} params
 * @returns {Promise<void>}
 */
export function register({ username, password, confirmedPassword }) {
    return apiClient.post("/register", {
        username: username.trim(),
        password,
        confirmedPassword,
    });
}

/**
 * @param {{ allDevices?: boolean }} params
 * @returns {Promise<void>}
 */
export function logout({ allDevices = false }) {
    const endpoint = allDevices ? "/logout/all-devices" : "/logout";
    return apiClient.get(endpoint);
}
