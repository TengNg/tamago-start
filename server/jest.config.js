/** @type {import('jest').Config} */
export default {
    preset: '@shelf/jest-mongodb',
    testMatch: [
        '**/tests/controllers/**/*.test.js',
        '**/tests/middlewares/**/*.test.js',
    ],
    testTimeout: 20000,
    coveragePathIgnorePatterns: [
        "/lib/",
        "/models/"
    ],
};
