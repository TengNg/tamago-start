import { createContext } from "react";

/** @type {React.Context<CurrentUser>} */
const CurrentUserContext = createContext(
    /** @type {CurrentUser} */ (/** @type {unknown} */ (undefined)),
);

/** @param {{ children: React.ReactNode, user: CurrentUser }} props */
export const CurrentUserContextProvider = ({ children, user }) => {
    return (
        <CurrentUserContext.Provider value={user}>
            {children}
        </CurrentUserContext.Provider>
    );
};

export default CurrentUserContext;
