import { createContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { logout as logoutApi } from "../api/authApi";
import { fetchCurrentUser } from "../api/meApi";

const CurrentUserContext = createContext({});

export const CurrentUserContextProvider = ({ children }) => {
    const queryClient = useQueryClient();

    const currentUserQuery = useQuery({
        queryKey: ["me"],
        queryFn: fetchCurrentUser,
    });

    const logout = async (opts = { allDevices: false }) => {
        try {
            await logoutApi(opts);
            queryClient.resetQueries({ queryKey: ["me"], exact: true });
        } catch (err) {
            throw err;
        }
    };

    return (
        <CurrentUserContext.Provider
            value={{
                currentUserQuery,
                currentUser: currentUserQuery.data,
                logout,
            }}
        >
            {children}
        </CurrentUserContext.Provider>
    );
};

export default CurrentUserContext;
