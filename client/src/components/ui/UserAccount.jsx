import { useState, useRef, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import dateFormatter from "../../utils/dateFormatter";
import Icon from "../shared/Icon";
import useAuth from "../../hooks/useAuth";
import { useKeybind } from "../../hooks/useKeybind";
import ModalStackContext from "../../context/ModalStackContext";
import useClickOutside from "../../hooks/useClickOutside";

const UserAccount = () => {
    const { currentUser, logout } = useAuth();

    const { isAnyModalOpen } = useContext(ModalStackContext);

    const [collapse, setCollapse] = useState(true);

    const navigate = useNavigate();

    const location = useLocation();
    const { pathname } = location;

    /** @type {React.MutableRefObject<HTMLDivElement | null>} */
    const userProfileImageRef = useRef(null);

    /** @type {React.MutableRefObject<HTMLDivElement | null>} */
    const userInfoRef = useRef(null);

    /** @type {React.MutableRefObject<HTMLDivElement | null>} */
    const containerRef = useRef(null);

    useKeybind("esc", () => {
        if (!collapse && !isAnyModalOpen) {
            setCollapse(true);
        }
    });

    useClickOutside(containerRef, () => {
        if (!collapse && !isAnyModalOpen) {
            setCollapse(true);
        }
    });

    const handleLogout = async () => {
        await logout();
        navigate("/login");
        setCollapse(true);
    };

    if (!currentUser) {
        return null;
    }

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

                {!collapse && (
                    <div
                        ref={userInfoRef}
                        className="account__menu absolute -bottom-1 right-0 translate-y-full flex flex-col box--style shadow-gray-700 border-2 border-gray-700 p-3 select-none gap-4 min-w-55"
                    >
                        {currentUser && (
                            <>
                                <div className="flex items-center justify-between">
                                    <div className="font-medium text-sm text-gray-600">
                                        Account
                                    </div>
                                    <button
                                        className="text-gray-600"
                                        onClick={() => setCollapse(true)}
                                    >
                                        <Icon
                                            className="w-4 h-4"
                                            name="xmark"
                                        />
                                    </button>
                                </div>

                                <div className="h-px w-full bg-gray-400"></div>

                                <div>
                                    <div className="select-none font-medium text-sm max-w-60 overflow-hidden whitespace-nowrap text-ellipsis text-gray-800 mb-2">
                                        <span className="text-gray-600">
                                            username:
                                        </span>{" "}
                                        {currentUser.username}
                                    </div>

                                    <div className="select-none font-medium text-sm max-w-60 overflow-hidden whitespace-nowrap text-ellipsis text-gray-800">
                                        <span className="text-gray-600">
                                            joined:{" "}
                                        </span>
                                        {dateFormatter(currentUser.createdAt, {
                                            withTime: false,
                                        })}
                                    </div>
                                </div>

                                <div className="h-px w-full bg-gray-400"></div>

                                <div className="flex flex-col gap-2">
                                    <Link
                                        to={`/profile`}
                                        className="p-2 bg-violet-800 text-gray-50 text-sm font-medium hover:bg-violet-700 grid place-items-center"
                                    >
                                        <span
                                            className={`${pathname.includes("/profile") ? "underline" : ""}`}
                                        >
                                            Profile
                                        </span>
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="p-2 bg-gray-700 hover:bg-gray-600 text-sm font-medium text-gray-200"
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
