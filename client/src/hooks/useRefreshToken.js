import useAuth from "./useAuth";
import { axiosPrivate } from "../api/axios";

const useRefreshToken = () => {
    const { setAuth } = useAuth();

    const refresh = async () => {
        try {
            const response = await axiosPrivate.get("/refresh");
            const { user, accessToken } = response.data;
            setAuth({ user, accessToken });
            return accessToken;
        } catch (err) {
            // await axiosPrivate.get("/logout");
            return undefined;
        }
    };

    return refresh;
};

export default useRefreshToken;
