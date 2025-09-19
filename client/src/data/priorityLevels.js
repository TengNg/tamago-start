const OPACITY = 1;

const PRIORITY_LEVELS = Object.freeze({
    none: {
        value: "none",
        title: "...",
        color: {
            rgba: `rgba(55, 65, 81, ${OPACITY})`,
        },
    },

    low: {
        value: "low",
        title: "LOW",
        color: {
            rgba: `rgba(168, 125, 247, ${OPACITY})`,
        },
    },

    medium: {
        value: "medium",
        title: "MEDIUM",
        color: {
            rgba: `rgba(191, 155, 64, ${OPACITY})`,
        },
    },

    high: {
        value: "high",
        title: "HIGH",
        color: {
            rgba: `rgba(209, 97, 121, ${OPACITY})`,
        },
    },

    critical: {
        value: "critical",
        title: "CRITICAL",
        color: {
            rgba: `rgba(204, 51, 84, ${OPACITY})`,
        },
    },
});

export default PRIORITY_LEVELS;
