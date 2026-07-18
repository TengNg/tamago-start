import { useEffect } from "react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import UserAccount from "./UserAccount";

import {
    AUTHORIZED_NAV_PAGES,
    UNAUTHORIZED_NAV_PAGES,
    AUTHORIZED_KEYS,
    UNAUTHORIZED_KEYS,
} from "../../constants/pages";
import Icon from "../shared/Icon";
import useAuth from "../../hooks/useAuth";

/**
 * @typedef {Object} NavBarProps
 * @property {React.Dispatch<React.SetStateAction<boolean>>} setOpenPinnedBoards
 */

/**
 * @param {NavBarProps} props
 */
const NavBar = ({ setOpenPinnedBoards }) => {
    const { currentUser } = useAuth();

    const navigate = useNavigate();
    const { pathname } = useLocation();

    const isBoardPath = pathname.startsWith("/b/");

    useEffect(() => {
        /** @param {KeyboardEvent} e */
        const handleOnKeyDown = (e) => {
            const isTextFieldFocused = document.querySelector(
                "input:focus, textarea:focus",
            );
            if (isTextFieldFocused || e.ctrlKey) {
                return;
            }

            const activeElement = document.activeElement;
            const isInputFocused =
                activeElement &&
                (activeElement.tagName === "INPUT" ||
                    activeElement.tagName === "TEXTAREA" ||
                    activeElement.tagName === "SELECT" ||
                    activeElement.getAttribute("contenteditable") === "true");
            if (isInputFocused) {
                return;
            }

            if (e.key === "5") {
                if (!currentUser) {
                    return;
                }

                const recentlyViewedBoardId = currentUser.recentlyViewedBoardId;
                if (recentlyViewedBoardId) {
                    navigate(`/b/${recentlyViewedBoardId}`);
                }
                return;
            }

            const keys = !currentUser ? UNAUTHORIZED_KEYS : AUTHORIZED_KEYS;
            const key = /** @type {keyof typeof keys} */ (
                /** @type {unknown} */ (e.key)
            );
            const path = keys[key]?.path;
            if (!path) {
                return;
            }

            navigate(path, { state: { from: path } });
        };

        document.addEventListener("keydown", handleOnKeyDown);

        return () => {
            document.removeEventListener("keydown", handleOnKeyDown);
        };
    }, [currentUser]);

    if (!currentUser) {
        return (
            <section
                id="header-section"
                className="w-full flex--center relative gap-2 py-3 px-2 sm:px-4"
            >
                <nav className="unauthorized h-full top-4 m-auto border-gray-700 border-2 bg-transparent px-2 z-30 drop-shadow-xs">
                    <ul className="w-full h-full flex justify-around items-center sm:gap-4 gap-2">
                        {UNAUTHORIZED_NAV_PAGES.map((el, index) => {
                            const { path, title } = el;
                            const num = `0${index + 1}`;
                            return (
                                <li key={title} className="w-fit">
                                    <NavLink
                                        to={path}
                                        className={({ isActive }) =>
                                            isActive ||
                                            pathname === path ||
                                            (pathname === "/" &&
                                                path === "/about")
                                                ? "anchor--style--selected sm:px-4"
                                                : "anchor--style sm:px-4"
                                        }
                                    >
                                        <div className="md:text-[0.8rem] text-[0.65rem]">
                                            <span className="md:inline hidden">
                                                {num}
                                            </span>
                                            <span className="md:inline hidden">
                                                {" "}
                                            </span>
                                            <span>{title}</span>
                                        </div>
                                    </NavLink>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </section>
        );
    }

    return (
        <>
            <section
                id="header-section"
                className="w-full flex--center relative gap-2 py-3 px-2 sm:px-4"
            >
                <div className="md:block hidden w-10 h-10"></div>

                <div className="absolute md:flex hidden items-center gap-2 md:top-4 md:left-4 top-2 left-2 text-[0.75rem] font-medium">
                    {currentUser.recentlyViewedBoardId && (
                        <>
                            {!isBoardPath && (
                                <button
                                    title="[05] Go to last viewed board"
                                    className="bg-transparent hover:bg-gray-600 hover:text-gray-50 text-slate-600 border-slate-600 border border-dashed text-[0.75rem] md:p-2 p-1 font-medium cursor-pointer"
                                    onClick={() => {
                                        const recentlyViewedBoardId =
                                            currentUser.recentlyViewedBoardId;
                                        if (recentlyViewedBoardId) {
                                            navigate(
                                                `/b/${recentlyViewedBoardId}`,
                                            );
                                        }
                                    }}
                                >
                                    <Icon
                                        name="rotate-right"
                                        className="md:block hidden w-2.5 h-2.5 -scale-x-100"
                                    />
                                </button>
                            )}
                        </>
                    )}
                    <button
                        className="bg-transparent hover:bg-gray-600 hover:text-gray-50 text-slate-600 border-slate-600 border border-dashed text-[0.75rem] md:p-2 p-1 font-medium cursor-pointer"
                        title="[C-p] Open your pinned boards"
                        onClick={() => {
                            setOpenPinnedBoards(true);
                        }}
                    >
                        <Icon name="pin" className="w-2.5 h-2.5" />
                    </button>
                </div>

                <nav className="h-full top-4 m-auto border-gray-700 border bg-transparent px-2 z-30 drop-shadow-xs">
                    <ul className="w-full h-full flex justify-around items-center sm:gap-4 gap-2">
                        {AUTHORIZED_NAV_PAGES.map((el, index) => {
                            const { path, title } = el;
                            const num = `0${index + 1}`;
                            return (
                                <li key={path}>
                                    <NavLink
                                        to={path}
                                        className={({ isActive }) =>
                                            isActive
                                                ? "anchor--style--selected"
                                                : "anchor--style"
                                        }
                                    >
                                        <div className="md:text-[0.8rem] text-[0.65rem]">
                                            <span className="md:inline hidden">
                                                {num}
                                            </span>
                                            <span className="md:inline hidden">
                                                {" "}
                                            </span>
                                            <span>{title}</span>
                                        </div>
                                    </NavLink>
                                </li>
                            );
                        })}

                        <li className="md:hidden block">
                            <div className="flex gap-2">
                                {currentUser.recentlyViewedBoardId && (
                                    <>
                                        {!isBoardPath && (
                                            <button
                                                className="bg-transparent hover:bg-gray-600 hover:text-gray-50 text-slate-600 border-slate-600 border border-dashed text-[0.75rem] md:p-2 p-1 font-normal"
                                                onClick={() => {
                                                    const recentlyViewedBoardId =
                                                        currentUser.recentlyViewedBoardId;
                                                    if (recentlyViewedBoardId) {
                                                        navigate(
                                                            `/b/${recentlyViewedBoardId}`,
                                                        );
                                                    }
                                                }}
                                            >
                                                <Icon
                                                    name="rotate-right"
                                                    className="md:hidden block md:w-4 md:h-4 w-3 h-3 -scale-x-100"
                                                />
                                            </button>
                                        )}
                                    </>
                                )}
                                <button
                                    className="bg-transparent hover:bg-gray-600 hover:text-gray-50 text-slate-600 border-slate-600 border border-dashed text-[0.75rem] md:p-2 p-1 font-medium"
                                    onClick={() => {
                                        setOpenPinnedBoards(true);
                                    }}
                                >
                                    <Icon name="pin" className="w-2.5 h-2.5" />
                                </button>
                            </div>
                        </li>
                    </ul>
                </nav>

                <UserAccount />
            </section>
        </>
    );
};

export default NavBar;
