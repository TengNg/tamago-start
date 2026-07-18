import CurrentUserContext from "../context/CurrentUserContext";
import { useContext } from "react";

const useCurrentUser = () => {
    const user = useContext(CurrentUserContext);

    if (user === undefined) {
        throw new Error("useCurrentUser() must be used within <RequireAuth />");
    }

    return user;
};

export default useCurrentUser;
