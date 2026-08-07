import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { CurrentUserContextProvider } from "../../context/CurrentUserContext";
import AuthLoading from "./AuthLoading";

export default function RequireAuth() {
    const location = useLocation();
    const { currentUserQuery, currentUser } = useAuth();

    if (currentUserQuery.isPending) {
        return <AuthLoading />;
    }

    if (currentUserQuery.isError || !currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return (
        <CurrentUserContextProvider user={currentUser}>
            <Outlet />
        </CurrentUserContextProvider>
    );
}
