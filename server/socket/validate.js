/**
 * Checks that all keys in `data` are within the `allowed` set.
 * @param {Record<string, unknown>} data
 * @param {string[]} allowed
 * @returns {boolean}
 */
export function allowedFields(data, allowed) {
    if (!data || typeof data !== 'object') return false;
    return Object.keys(data).every((key) => allowed.includes(key));
}
