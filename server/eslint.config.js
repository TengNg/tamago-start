import jsdoc from 'eslint-plugin-jsdoc';

const config = [
    // configuration included in plugin
    // jsdoc.configs['flat/recommended'],
    // other configuration objects...
    {
        files: ['**/*.js'],
        plugins: {
            jsdoc,
        },
        rules: {
            "jsdoc/check-alignment": "error",
            "jsdoc/check-param-names": "error",
            "jsdoc/check-tag-names": "error",
            "jsdoc/check-types": "error",
            "jsdoc/require-param": "error",
            // "jsdoc/require-returns": "warn",
            // "jsdoc/require-description": "warn"
        }
    }
];

export default config;
