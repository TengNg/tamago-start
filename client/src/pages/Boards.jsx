import { useEffect, useRef } from "react";
import { useState } from "react";
import BoardItem from "../components/board/BoardItem";
import BoardForm from "../components/board/BoardForm";
import Title from "../components/ui/Title";
import JoinBoardRequestForm from "../components/board/JoinBoardRequestForm";
import BoardsHelp from "../components/ui/BoardsHelp";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getBoards } from "../api/boardApi";

const FILTERS = Object.freeze({
    ALL: "all",
    OWNED: "owned",
    JOINED: "joined",
    //PUBLIC: 'public',
    //PRIVATE: 'private',
    //PINNED: 'pinned',
});

const Boards = () => {
    const queryClient = useQueryClient();

    const [boardFilter, setBoardFilter] = useState(FILTERS.ALL);
    const [openHelp, setOpenHelp] = useState(false);

    const [openBoardForm, setOpenBoardForm] = useState(false);
    const [openJoinBoardRequestForm, setOpenJoinBoardRequestForm] =
        useState(false);

    const boardFormRef = useRef();
    const createBoardButtonRef = useRef();

    const boardsQuery = useQuery({
        queryKey: ["boards", boardFilter],
        queryFn: () => getBoards({ filter: boardFilter }),
    });

    useEffect(() => {
        boardsQuery.refetch();
        document.addEventListener("keydown", handleKeyDown);
        () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    function handleFilter(status) {
        setBoardFilter(status);
    }

    function handleRefreshData() {
        queryClient.invalidateQueries({
            queryKey: ["boards", boardFilter],
            exact: true,
        });
    }

    function handleCloseBoxOnClickOutside(event) {
        if (
            boardFormRef.current &&
            !boardFormRef.current.contains(event.target) &&
            !createBoardButtonRef.current.contains(event.target)
        ) {
            setOpenBoardForm(false);
        }
    }

    function handleKeyDown(e) {
        const key = e.key;

        if (key === "Escape") {
            setOpenBoardForm(false);
            setOpenJoinBoardRequestForm(false);
            return;
        }

        if (key === "?") {
            setOpenHelp((prev) => !prev);
            return;
        }

        if (e.ctrlKey) {
            if (key === "j" || key === ";") {
                e.preventDefault();
            }

            switch (key) {
                case "j":
                    setOpenJoinBoardRequestForm((prev) => !prev);
                    break;
                case ";":
                    setOpenBoardForm((prev) => !prev);
                    break;
                default:
                    break;
            }
        }
    }

    if (boardsQuery.isLoading) {
        return (
            <section id="boards" className="w-full h-full overflow-auto pb-4">
                <div className="mx-auto sm:w-3/4 w-[90%]">
                    <Title titleName="boards" />
                </div>
                <div className="font-medium mx-auto text-center mt-20 text-gray-600">
                    getting boards
                </div>
                <div className="loader mx-auto my-8"></div>
            </section>
        );
    }

    if (boardsQuery.isError) {
        return (
            <section id="boards" className="w-full h-full overflow-auto pb-4">
                <div className="mx-auto sm:w-3/4 w-[90%]">
                    <Title titleName="boards" />
                </div>
                <div className="font-medium mx-auto text-center mt-20 text-gray-600">
                    something went wrong :(
                </div>
            </section>
        );
    }

    return (
        <>
            <JoinBoardRequestForm
                open={openJoinBoardRequestForm}
                setOpen={setOpenJoinBoardRequestForm}
            />

            <BoardsHelp open={openHelp} setOpen={setOpenHelp} />

            <section
                onClick={handleCloseBoxOnClickOutside}
                id="boards"
                className="w-full h-full overflow-auto pb-8"
            >
                <div className="mx-auto sm:w-3/4 w-[90%]">
                    <Title titleName="boards" />

                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-0 mb-1 sm:mb-0 justify-between items-center">
                        <div className="flex gap-3 text-[0.75rem] text-gray-700 mb-1 sm:mb-0">
                            <div>
                                <span
                                    className={`cursor-pointer ${boardFilter === FILTERS.ALL || boardFilter === "" ? "underline" : ""}`}
                                    onClick={() => handleFilter(FILTERS.ALL)}
                                >
                                    total:{boardsQuery.data.total}
                                </span>
                            </div>

                            {boardsQuery.data.totalOwned > 0 && (
                                <div>
                                    <span
                                        className={`cursor-pointer ${boardFilter === FILTERS.OWNED ? "underline" : ""}`}
                                        onClick={() =>
                                            handleFilter(FILTERS.OWNED)
                                        }
                                    >
                                        owned:{boardsQuery.data.totalOwned}/10
                                    </span>
                                </div>
                            )}

                            {boardsQuery.data.totalJoined > 0 && (
                                <div>
                                    <span
                                        className={`cursor-pointer ${boardFilter === FILTERS.JOINED ? "underline" : ""}`}
                                        onClick={() =>
                                            handleFilter(FILTERS.JOINED)
                                        }
                                    >
                                        joined:{boardsQuery.data.totalJoined}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                className="text-[0.75rem] text-gray-700 pe-1 text-end underline cursor-pointer sm:mb-0 mb-2"
                                onClick={() =>
                                    setOpenJoinBoardRequestForm((open) => !open)
                                }
                            >
                                join board
                            </button>

                            <button
                                className="text-[0.75rem] text-gray-700 pe-1 text-end underline cursor-pointer sm:mb-0 mb-2"
                                onClick={handleRefreshData}
                            >
                                refresh
                            </button>
                        </div>
                    </div>

                    <div className="relative flex flex-col items-center mx-auto sm:m-0 sm:justify-start sm:items-start sm:flex-row sm:flex-wrap gap-4 p-6 sm:p-8 border-[2px] box--style shadow-gray-600 border-gray-600 w-[280px] sm:w-full">
                        {boardsQuery.data.boards.map((item) => {
                            return <BoardItem key={item._id} item={item} />;
                        })}

                        <div className="relative ms-2 sm:ms-0 w-[210px] sm:w-[250px] h-[120px] sm:h-[135px]">
                            <div
                                onClick={() =>
                                    setOpenBoardForm((open) => !open)
                                }
                                ref={createBoardButtonRef}
                                className="board--style board--hover h-full w-full border-[2px] border-gray-500 shadow-gray-500 py-3 px-4 select-none bg-transparent"
                            >
                                <div className="flex items-center gap-2 text-gray-500 font-medium">
                                    <span>+ new board</span>
                                </div>
                            </div>

                            {openBoardForm && <BoardForm ref={boardFormRef} />}
                        </div>
                    </div>

                    {boardsQuery.data.recentlyViewedBoard && (
                        <div className="w-full sm:w-fit sm:block flex justify-center">
                            <div className="w-[280px] sm:w-fit flex flex-col flex-wrap gap-1 px-8 pt-3 pb-8 mt-8 box--style justify-start items-start box--style border-[2px] shadow-gray-600 border-gray-600">
                                <p className="text-gray-600 text-[0.75rem] font-medium ms-1 my-1">
                                    recently viewed board
                                </p>
                                <BoardItem
                                    item={boardsQuery.data.recentlyViewedBoard}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <button
                    className="fixed hidden sm:block bottom-4 left-4 w-[20px] h-[20px] text-[12px] bg-gray-500 hover:bg-gray-600 text-white rounded-full"
                    onClick={() => {
                        setOpenHelp((prev) => !prev);
                    }}
                    title="open help"
                >
                    ?
                </button>
            </section>
        </>
    );
};

export default Boards;
