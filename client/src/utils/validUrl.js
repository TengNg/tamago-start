/**
 * @param {string} str
 * @returns {boolean}
 */
function validUrl(str) {
    try {
        const url = new URL(str);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch (err) {
        return false;
    }
}

export default validUrl;
