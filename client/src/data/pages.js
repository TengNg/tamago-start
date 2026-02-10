export const PAGES = Object.freeze({
    ABOUT: {
        path: "/about",
        title: "about",
    },

    BOARDS: {
        path: "/boards",
        title: "boards",
    },

    WRITEDOWNS: {
        path: "/writedowns",
        title: "writedowns",
    },

    ACTIVITIES: {
        path: "/activities",
        title: "activities",
    },

    PROFILE: {
        path: "/profile",
        title: "profile",
    },

    LOGIN: {
        path: "/login",
        title: "login",
    },

    REGISTER: {
        path: "/register",
        title: "register",
    },
});

export const AUTHORIZED_NAV_PAGES = Object.freeze([
    PAGES.BOARDS,
    PAGES.WRITEDOWNS,
    PAGES.ACTIVITIES,
    PAGES.PROFILE,
]);

export const UNAUTHORIZED_NAV_PAGES = Object.freeze([
    PAGES.ABOUT,
    PAGES.LOGIN,
    PAGES.REGISTER,
]);

export const AUTHORIZED_KEYS = Object.freeze({
    0: PAGES.ABOUT,
    1: PAGES.BOARDS,
    2: PAGES.WRITEDOWNS,
    3: PAGES.ACTIVITIES,
    4: PAGES.PROFILE,
});

export const UNAUTHORIZED_KEYS = Object.freeze({
    1: PAGES.ABOUT,
    2: PAGES.LOGIN,
    3: PAGES.REGISTER,
});

export default {
    PAGES,
    AUTHORIZED_NAV_PAGES,
    UNAUTHORIZED_NAV_PAGES,
    AUTHORIZED_KEYS,
    UNAUTHORIZED_KEYS,
};
