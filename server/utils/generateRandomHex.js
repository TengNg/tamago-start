const crypto = require('crypto');

/**
 * @param {number} length
 * @returns {string}
 */
const generateRandomHex = (length) => {
    return crypto.randomBytes(Math.round(length / 2)).toString('hex');
};

module.exports = { generateRandomHex };

