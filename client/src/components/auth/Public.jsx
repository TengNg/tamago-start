import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

export default function Public() {
    const { currentUser } = useAuth();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/boards";

    if (currentUser) {
        return <Navigate to={from} replace />;
    }

    return <Outlet />;
}
