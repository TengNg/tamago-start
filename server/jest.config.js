module.exports = {
    preset: '@shelf/jest-mongodb',
    testMatch: [
        '**/tests/controllers/card/*.test.js',
        // '**/tests/controllers/*.test.js',
        // '**/tests/services/*.test.js'
    ],
    testTimeout: 20000,
    coveragePathIgnorePatterns: [
        "/lib/",
        "/models/"
    ],
};
