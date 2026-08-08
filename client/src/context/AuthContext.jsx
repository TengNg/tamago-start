import { createContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi, meApi } from "../services/api";

const AuthContext = createContext(/** @type {AuthContextValue} */ ({}));

/** @param {{ children: React.ReactNode }} props */
export const AuthContextProvider = ({ children }) => {
    const queryClient = useQueryClient();

    const currentUserQuery = useQuery({
        queryKey: ["me"],
        queryFn: meApi.fetchCurrentUser,
    });

    /** @param {{ allDevices?: boolean }} opts */
    const logout = async (opts = { allDevices: false }) => {
        await authApi.logout(opts);
        queryClient.resetQueries();
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
