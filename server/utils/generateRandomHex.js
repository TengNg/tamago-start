import { randomBytes } from 'crypto';

/**
 * @param {number} length
 * @returns {string}
 */
const generateRandomHex = (length) => {
    return randomBytes(Math.round(length / 2)).toString('hex');
};

export { generateRandomHex };

