const INVALID_USERNAMES = Object.freeze([
    // Unknown
    "unknown", "unassigned", "none", "invalid",

    // System
    "admin", "administrator", "root", "system", "support",
    "moderator", "mod", "staff", "owner", "superuser",
    "guest", "default", "public", "api", "server", "bot",
    "null", "undefined", "true", "false",

    // Routes
    "login", "logout", "register", "signup", "signin",
    "me", "profile", "settings", "dashboard", "account",
    "users", "user", "boards", "board",
    "search", "explore", "home", "about",
    "contact", "terms", "privacy", "error",

    // Placeholder
    "test", "testing", "demo", "sample", "example",
    "temp", "temporary", "deleted",
    "anonymous", "anon",

    // Sensitive
    "verified", "official", "team", "security", "help", "info"
]);

/**
 * Single source of truth for username validation. Used both by the
 * User schema validator and by controllers, so a controller-approved
 * username can never be rejected by the schema (and vice versa).
 *
 * @param {unknown} value
 * @returns {boolean}
 */
const isValidUsername = (value) => {
    if (typeof value !== 'string') {
        return false;
    }

    const v = value.trim().toLowerCase();

    if (INVALID_USERNAMES.includes(v)) {
        return false;
    }

    if (v.length < 2) {
        return false;
    }

    // only numbers
    if (/^\d+$/.test(v)) {
        return false;
    }

    // only allow safe chars
    if (!/^[a-z0-9_]+$/.test(v)) {
        return false;
    }

    return true;
};

export {
    isValidUsername,
};
