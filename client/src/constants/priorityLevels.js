const PRIORITY_LEVELS = Object.freeze({
    none: {
        value: "none",
        title: "NONE",
        color: "hsl(215, 14%, 40%)",
    },

    low: {
        value: "low",
        title: "LOW",
        color: "hsl(259, 86%, 65%)",
    },

    medium: {
        value: "medium",
        title: "MEDIUM",
        color: "hsl(44, 50%, 50%)",
    },

    high: {
        value: "high",
        title: "HIGH",
        color: "hsl(348, 55%, 55%)",
    },

    critical: {
        value: "critical",
        title: "CRITICAL",
        color: "hsl(345, 60%, 45%)",
    },
});

export default PRIORITY_LEVELS;
