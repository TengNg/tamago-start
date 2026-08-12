import { apiClient } from "../../lib/api-client";

/**
 * @param {{ username: string, password: string }} params
 * @returns {Promise<void>}
 */
function login({ username, password }) {
    return apiClient.post("/login", {
        username: username.trim(),
        password,
    });
}

/**
 * @param {{ username: string, password: string, confirmedPassword: string }} params
 * @returns {Promise<void>}
 */
function register({ username, password, confirmedPassword }) {
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
function logout({ allDevices = false }) {
    const endpoint = allDevices ? "/logout/all-devices" : "/logout";
    return apiClient.post(endpoint);
}

export default { login, register, logout };
