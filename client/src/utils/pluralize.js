/**
 * @param {number} count
 * @param {string} word
 * @param {string} [suffix="s"]
 * @returns {string}
 */
const pluralizeString = (count, word, suffix = "s") => {
    if (count === 1) {
        return `${count} ${word}`;
    }
    return `${count} ${word}${suffix}`;
};

/**
 * @param {number} count
 * @param {string} word
 * @param {string} [suffix="s"]
 * @returns {string}
 */
const pluralizeWord = (count, word, suffix = "s") => {
    if (count === 1) {
        return word;
    }
    return `${word}${suffix}`;
};

export { pluralizeString, pluralizeWord };
