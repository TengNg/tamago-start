/**
 * Minimal fetch-based API client
 *
 * - Base URL from `VITE_SERVER_URL` or defaults to `http://localhost:3001/api`
 * - Always sends credentials (cookies)
 * - Auto-serializes JSON request bodies
 * - Returns parsed response body directly (never full Response)
 * - Throws `ApiClientError` with `{ message, status, data }` — compatible with getErrorMessage.js
 */

/** @typedef {"blob"} ResponseType */

/**
 * @typedef {Object} RequestOptions
 * @property {AbortSignal} [signal]
 * @property {Record<string, string>} [headers]
 * @property {Record<string, any>} [query]
 * @property {ResponseType} [responseType]
 */

/**
 * @augments Error
 */
class ApiClientError extends Error {
    /** @type {number|undefined} */
    status;

    /** @type {any} */
    data;

    /**
     * @param {string} [message]
     * @param {number} [status]
     * @param {any} [data]
     */
    constructor(message = "API Error", status = undefined, data = undefined) {
        super(message || "API Error");

        if (status !== undefined) {
            this.status = status;
        }

        if (data !== undefined) {
            this.data = data;
        }

        Object.setPrototypeOf(this, ApiClientError.prototype);
    }
}

const BASE_URL =
    (import.meta.env.VITE_SERVER_URL || "http://localhost:3001") + "/api";

/**
 * @param {Response} res
 * @param {ResponseType} [responseType]
 * @returns {Promise<any>}
 */
async function handleResponse(res, responseType = undefined) {
    if (!res.ok) {
        const contentType = res.headers.get("content-type") || "";
        let body;
        try {
            body = contentType.includes("application/json")
                ? await res.json()
                : await res.text();
        } catch {
            body = undefined;
        }
        const message =
            (body && typeof body === "object" && body.message) ||
            (typeof body === "string" ? body : undefined) ||
            res.statusText ||
            "Request failed";
        throw new ApiClientError(message, res.status, body);
    }

    if (res.status === 204) {
        return undefined;
    }

    if (responseType === "blob") {
        return res.blob();
    }

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
        return res.json();
    }

    return res.text();
}

/**
 * @param {string} method
 * @param {string} url
 * @param {any} [data]
 * @param {RequestOptions} [options]
 * @returns {Promise<any>}
 */
async function request(method, url, data = undefined, options = {}) {
    const { signal, headers: extraHeaders, query, responseType } = options;

    const qs = query ? `?${new URLSearchParams(query)}` : "";
    const endpoint = BASE_URL + (url.startsWith("/") ? url : `/${url}`) + qs;

    let body;
    if (data instanceof FormData) {
        body = data;
    } else if (data !== undefined) {
        body = JSON.stringify(data);
    }

    const headers =
        body instanceof FormData
            ? extraHeaders
            : { "Content-Type": "application/json", ...extraHeaders };

    const res = await fetch(endpoint, {
        method,
        credentials: "include",
        headers,
        body: method === "GET" || method === "HEAD" ? undefined : body,
        signal,
    });

    return handleResponse(res, responseType);
}

/**
 * @param {string} url
 * @param {RequestOptions} [options]
 */
function get(url, options = undefined) {
    return request("GET", url, undefined, options);
}

/**
 * @param {string} url
 * @param {any} [data]
 * @param {RequestOptions} [options]
 */
function post(url, data = undefined, options) {
    return request("POST", url, data, options);
}

/**
 * @param {string} url
 * @param {any} [data]
 * @param {RequestOptions} [options]
 */
function patch(url, data = undefined, options = undefined) {
    return request("PATCH", url, data, options);
}

/**
 * @param {string} url
 * @param {any} [data]
 * @param {RequestOptions} [options]
 */
function del(url, data = undefined, options = undefined) {
    return request("DELETE", url, data, options);
}

export const apiClient = {
    get,
    post,
    patch,
    delete: del,
    ApiClientError,
};
