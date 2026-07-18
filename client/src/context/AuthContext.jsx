import { createContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { logout as logoutApi } from "../api/authApi";
import { fetchCurrentUser } from "../api/meApi";

const AuthContext = createContext(/** @type {AuthContextValue} */ ({}));

/** @param {{ children: React.ReactNode }} props */
export const AuthContextProvider = ({ children }) => {
    const queryClient = useQueryClient();

    const currentUserQuery = useQuery({
        queryKey: ["me"],
        queryFn: fetchCurrentUser,
    });

    /** @param {{ allDevices?: boolean }} opts */
    const logout = async (opts = { allDevices: false }) => {
        await logoutApi(opts);
        queryClient.resetQueries({ queryKey: ["me"], exact: true });
    };

    return (
        <AuthContext.Provider
            value={{
                currentUserQuery,
                currentUser: currentUserQuery.data?.user,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
