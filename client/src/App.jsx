import "./App.css";
import "./index.css";
import { lazy, Suspense, useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import NavBar from "./components/ui/NavBar";
import ThemesDialog from "./components/ui/ThemesDialog";

import RequireAuth from "./components/auth/RequireAuth";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";

const About = lazy(() => import("./pages/About"));
const Boards = lazy(() => import("./pages/Boards"));
const Board = lazy(() => import("./pages/Board"));
const Activities = lazy(() => import("./pages/Activities"));
const Profile = lazy(() => import("./pages/Profile"));
const Writedowns = lazy(() => import("./pages/Writedowns"));
const SomethingWentWrong = lazy(() => import("./pages/SomethingWentWrong"));

import { BoardStateContextProvider } from "./context/BoardStateContext";

import useLocalStorage from "./hooks/useLocalStorage";

import { PAGES } from "./constants/pages";
import LOCAL_STORAGE_KEYS from "./constants/localStorageKeys";
import THEMES from "./constants/themes";
import Icon from "./components/shared/Icon";
import PinnedBoards from "./components/board/PinnedBoards";
import Modal from "./components/ui/Modal";
import Public from "./components/auth/Public";

/** @type {Record<string, string>} */
const titleMap = Object.values(PAGES).reduce((obj, p, index) => {
    const title = `0${index} ${p.title}`;
    return { ...obj, [p.path]: title };
}, {});

function Loading() {
    return (
        <>
            <div className="font-medium mx-auto text-center mt-20 text-gray-600"></div>
            <div className="loader mx-auto my-8"></div>
        </>
    );
}

function App() {
    const location = useLocation();
    const { pathname } = location;

    const [openPinnedBoards, setOpenPinnedBoards] = useState(false);
    const [openThemesDialog, setOpenThemesDialog] = useState(false);
    const [themeStyle, setThemeStyle] = useLocalStorage(
        LOCAL_STORAGE_KEYS.APP_BACKGROUND_THEME,
        /** @type {keyof typeof THEMES} */ ("offwhite"),
    );

    const currentTheme = THEMES[themeStyle] || THEMES.offwhite;

    useEffect(() => {
        if ("scrollRestoration" in window.history) {
            window.history.scrollRestoration = "manual";
        }

        /** @param {KeyboardEvent} event */
        const handleKeyDown = (event) => {
            if (event.ctrlKey && event.key === "p") {
                event.preventDefault();
                setOpenPinnedBoards((prev) => !prev);
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    useEffect(() => {
        /** @type {HTMLDivElement | null} */
        const root = document.querySelector("#root");
        if (root) {
            root.style.backgroundColor = `rgb(${currentTheme.bg})`;
            root.style.color = `rgb(${currentTheme.text})`;
        }
        document.documentElement.setAttribute("data-theme", themeStyle);
    }, [themeStyle, currentTheme]);

    useEffect(() => {
        if (pathname.includes("/b/")) return;
        document.title = titleMap[pathname] || "tamago-start";
    }, [pathname]);

    return (
        <>
            <NavBar setOpenPinnedBoards={setOpenPinnedBoards} />
            <Suspense fallback={<Loading />}>
                <Routes>
                    <Route path="/" element={<About />} />
                    <Route path="/about" element={<About />} />

                    <Route element={<Public />}>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                    </Route>

                    <Route element={<RequireAuth />}>
                        <Route path="/boards" element={<Boards />} />
                        <Route path="/writedowns" element={<Writedowns />} />
                        <Route path="/activities" element={<Activities />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route
                            path="/b/:boardId/"
                            element={
                                <BoardStateContextProvider>
                                    <Board />
                                </BoardStateContextProvider>
                            }
                        />
                    </Route>

                    <Route path="/error" element={<SomethingWentWrong />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>

            <Modal
                open={openThemesDialog}
                setOpen={setOpenThemesDialog}
                title="themes"
                bodyClassName="px-0!"
            >
                <ThemesDialog
                    themeStyle={themeStyle}
                    setThemeStyle={setThemeStyle}
                />
            </Modal>

            <button
                onClick={() => setOpenThemesDialog(true)}
                className="fixed grid place-items-center sm:right-4 sm:bottom-4 text-[14px] sm:text-[1rem] right-2.5 bottom-2.5 sm:w-8.75 sm:h-8.75 w-7.5 h-7.5 rounded-full hover:brightness-110"
                style={{
                    backgroundColor: `rgb(${currentTheme.bg})`,
                    color: `rgb(${currentTheme.text})`,
                    border: `2px solid rgb(${currentTheme.border})`,
                }}
                title={themeStyle}
            >
                <Icon className="w-4 h-4" name="pallete" />
            </button>

            <Modal
                open={openPinnedBoards}
                setOpen={setOpenPinnedBoards}
                title="pinned boards"
            >
                <PinnedBoards />
            </Modal>
        </>
    );
}

export default App;
