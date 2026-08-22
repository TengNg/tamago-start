import { UseQueryResult } from "@tanstack/react-query";

export {};

declare global {
    type AuthContextValue = {
        currentUserQuery: UseQueryResult<CurrentUser>;
        currentUser: CurrentUser | undefined;
        logout: (opts?: { allDevices?: boolean }) => Promise<void>;
    }
}
