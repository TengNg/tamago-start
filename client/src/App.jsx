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

import PAGES from "./data/pages";
import LOCAL_STORAGE_KEYS from "./data/localStorageKeys";
import Icon from "./components/shared/Icon";
import PinnedBoards from "./components/board/PinnedBoards";
import Public from "./components/auth/Public";

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
    const [backgroundTheme, setBackgroundTheme] = useLocalStorage(
        LOCAL_STORAGE_KEYS.APP_BACKGROUND_THEME,
        { theme: "offwhite", hex: "#f1f1f1" },
    );

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.ctrlKey && event.key === "e") {
                event.preventDefault();
                setOpenPinnedBoards((prev) => !prev);
            }

            if (event.key === "Escape") {
                setOpenPinnedBoards(false);
            }
        };
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    useEffect(() => {
        document.querySelector("#root").style.backgroundColor =
            backgroundTheme?.hex || "#f1f1f1";
        document.documentElement.setAttribute(
            "data-theme",
            backgroundTheme.theme,
        );
    }, [backgroundTheme]);

    useEffect(() => {
        if (pathname.includes("/b/")) return;
        document.title = titleMap[pathname] || "tamago-start";
    }, [location]);

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

            <ThemesDialog
                open={openThemesDialog}
                setOpen={setOpenThemesDialog}
                backgroundTheme={backgroundTheme}
                setBackgroundTheme={setBackgroundTheme}
            />

            <button
                onClick={() => setOpenThemesDialog(true)}
                className="fixed grid place-items-center sm:right-4 sm:bottom-4 text-[13px] sm:text-[1rem] right-2.5 bottom-2.5 sm:w-[35px] sm:h-[35px] w-[30px] h-[30px] rounded-full bg-gray-500 text-transparent hover:bg-gray-500/75"
                style={{ color: backgroundTheme?.hex || "#f1f1f1" }}
                title={backgroundTheme?.theme}
            >
                <Icon className="w-4 h-4" name="pallete" />
            </button>

            {openPinnedBoards && (
                <PinnedBoards
                    open={openPinnedBoards}
                    setOpen={setOpenPinnedBoards}
                />
            )}
        </>
    );
}

export default App;
