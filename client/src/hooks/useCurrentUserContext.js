import CurrentUserContext from "../context/CurrentUserContext";
import { useContext } from "react";

const useCurrentUserContext = () => {
    return useContext(CurrentUserContext);
};

export default useCurrentUserContext;
