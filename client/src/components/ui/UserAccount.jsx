import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import dateFormatter from "../../utils/dateFormatter";
import Icon from "../shared/Icon";
import useCurrentUserContext from "../../hooks/useCurrentUserContext";

const UserAccount = () => {
    const { currentUser, logout } = useCurrentUserContext();

    const [collapse, setCollapse] = useState(true);

    const navigate = useNavigate();

    const location = useLocation();
    const { pathname } = location;

    const userProfileImageRef = useRef();
    const userInfoRef = useRef();
    const containerRef = useRef();

    useEffect(() => {
        const abortController = new AbortController();

        window.addEventListener(
            "keydown",
            (e) => {
                if (e.key === "Escape" && collapse) {
                    setCollapse(true);
                }
            },
            { signal: abortController.signal },
        );

        window.addEventListener(
            "mousedown",
            (e) => {
                if (
                    containerRef.current &&
                    !containerRef.current.contains(e.target) &&
                    collapse
                ) {
                    setCollapse(true);
                }
            },
            { signal: abortController.signal },
        );

        return () => {
            abortController.abort();
        };
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate("/login");
        setCollapse(true);
    };

    return (
        <>
            <div
                id="user-account"
                ref={containerRef}
                className="md:block hidden relative h-fit gap-2 z-30"
            >
                <div
                    onClick={() => setCollapse((collapse) => !collapse)}
                    ref={userProfileImageRef}
                    className={`${currentUser.loginWithDiscord ? "bg-indigo-600 border-[3px] border-indigo-400" : "bg-sky-700"} text-white flex--center ms-auto text-[0.8rem] w-8 h-8 rounded-full bg-center bg-cover overflow-hidden cursor-pointer hover:opacity-90`}
                >
                    <div className="font-bold flex--center select-none">
                        {currentUser.username.charAt(0).toUpperCase()}
                    </div>
                </div>

                {collapse === false && (
                    <div
                        ref={userInfoRef}
                        className="account__menu absolute bottom-0 right-0 translate-y-[105%] flex flex-col box--style shadow-gray-700 border-2 border-gray-700 p-3 select-none gap-4 min-w-[220px]"
                    >
                        {currentUser && (
                            <>
                                <div className="flex items-center justify-between">
                                    <div className="font-medium text-[0.8rem] text-gray-400">
                                        Account
                                    </div>
                                    <button
                                        className="text-gray-400"
                                        onClick={() => setCollapse(true)}
                                    >
                                        <Icon
                                            className="w-4 h-4"
                                            name="xmark"
                                        />
                                    </button>
                                </div>

                                <div className="h-px w-full bg-gray-400"></div>

                                <div className="select-none font-medium text-[0.8rem] max-w-[200px] overflow-hidden whitespace-nowrap text-ellipsis text-gray-700">
                                    username: {currentUser.username}
                                </div>

                                <div className="select-none font-medium text-[0.8rem] max-w-[200px] overflow-hidden whitespace-nowrap text-ellipsis text-gray-700">
                                    joined:{" "}
                                    {dateFormatter(currentUser.createdAt, {
                                        withTime: false,
                                    })}
                                </div>

                                <div className="h-px w-full bg-gray-400"></div>

                                <div className="flex flex-col gap-2">
                                    <Link
                                        to={`/profile`}
                                        className="p-2 bg-violet-800 text-gray-50 text-[0.75rem] font-medium hover:bg-violet-700 grid place-items-center"
                                    >
                                        <span
                                            className={`${pathname.includes("/profile") ? "underline" : ""}`}
                                        >
                                            Profile
                                        </span>
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="p-2 bg-gray-700 hover:bg-gray-600 text-[0.75rem] font-medium text-gray-200"
                                    >
                                        Log out
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default UserAccount;
