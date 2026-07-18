import { useEffect, useState } from "react";
import BoardItem from "../components/board/BoardItem";
import BoardForm from "../components/board/BoardForm";
import Title from "../components/ui/Title";
import JoinBoardRequestForm from "../components/board/JoinBoardRequestForm";
import BoardsHelp from "../components/ui/BoardsHelp";
import Modal from "../components/ui/Modal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { boardApi } from "../services/api";
import { boardKeys } from "../queries/boardKeys";
import { useKeybind } from "../hooks/useKeybind";

const FILTERS = Object.freeze({
    ALL: "all",
    OWNED: "owned",
    JOINED: "joined",
});

const Boards = () => {
    const queryClient = useQueryClient();

    const [boardFilter, setBoardFilter] = useState(
        /** @type {"all" | "owned" | "joined"} */ (FILTERS.ALL),
    );
    const [openHelp, setOpenHelp] = useState(false);

    const [openBoardForm, setOpenBoardForm] = useState(false);
    const [openJoinBoardRequestForm, setOpenJoinBoardRequestForm] =
        useState(false);

    const boardsQuery = useQuery({
        queryKey: boardKeys.all(boardFilter),
        queryFn: () => boardApi.fetchBoards({ filter: boardFilter }),
    });

    useEffect(() => {
        boardsQuery.refetch();
    }, []);

    /**
     * @param {"all" | "owned" | "joined"} status
     */
    function handleFilter(status) {
        setBoardFilter(status);
    }

    function handleRefreshData() {
        queryClient.invalidateQueries({
            queryKey: ["boards", boardFilter],
            exact: true,
        });
    }

    useKeybind(["?"], () => setOpenHelp((prev) => !prev), {
        ignoreInInputs: true,
    });
    useKeybind(["ctrl+j"], () => setOpenJoinBoardRequestForm((prev) => !prev), {
        ignoreInInputs: false,
    });
    useKeybind(["ctrl+b"], () => setOpenBoardForm((prev) => !prev), {
        ignoreInInputs: false,
    });

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

    if (!boardsQuery.data) {
        return (
            <section id="boards" className="w-full h-full overflow-auto pb-4">
                <div className="mx-auto sm:w-3/4 w-[90%]">
                    <Title titleName="boards" />
                </div>
                <div className="font-medium mx-auto text-center mt-20 text-gray-600"></div>
            </section>
        );
    }

    return (
        <>
            <Modal
                open={openJoinBoardRequestForm}
                setOpen={setOpenJoinBoardRequestForm}
                title="send join request"
            >
                <JoinBoardRequestForm />
            </Modal>

            <Modal open={openHelp} setOpen={setOpenHelp} title="help">
                <BoardsHelp />
            </Modal>

            <Modal
                open={openBoardForm}
                setOpen={setOpenBoardForm}
                title="+ new board"
            >
                <BoardForm />
            </Modal>

            <section id="boards" className="w-full h-full overflow-auto pb-8">
                <div className="mx-auto sm:w-3/4 w-[90%]">
                    <Title titleName="boards" />

                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-0 mb-1 sm:mb-0 justify-between items-center">
                        <div className="flex gap-3 text-[0.75rem] text-gray-700 mb-1 sm:mb-0">
                            <div>
                                <span
                                    className={`cursor-pointer ${boardFilter === FILTERS.ALL ? "underline" : ""}`}
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

                    <div className="relative flex flex-col items-center mx-auto sm:m-0 sm:justify-start sm:items-start sm:flex-row sm:flex-wrap gap-4 p-6 sm:p-8 border-2 box--style shadow-gray-600 border-gray-600 w-70 sm:w-full">
                        {boardsQuery.data.boards.map((item) => {
                            return <BoardItem key={item._id} item={item} />;
                        })}

                        <div className="relative ms-2 sm:ms-0 w-52.5 sm:w-62.5 h-30 sm:h-33.75">
                            <div
                                onClick={() =>
                                    setOpenBoardForm((open) => !open)
                                }
                                className="board--style board--hover h-full w-full border-2 border-gray-500 shadow-gray-500 py-3 px-4 select-none bg-transparent"
                            >
                                <div className="flex items-center gap-2 text-gray-500 font-medium">
                                    <span>+ new board</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {boardsQuery.data.recentlyViewedBoard && (
                        <div className="w-full sm:w-fit sm:block flex flex-col items-center mt-8">
                            <p className="text-gray-700 text-[0.75rem]">
                                recently viewed board
                            </p>
                            <div className="w-70 sm:w-fit flex flex-col flex-wrap gap-1 px-8 pt-6 pb-8 box--style justify-start items-start border-2 shadow-gray-600 border-gray-600">
                                <BoardItem
                                    item={boardsQuery.data.recentlyViewedBoard}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <button
                    className="fixed hidden sm:block bottom-4 left-4 w-5 h-5 text-[12px] bg-gray-500 hover:bg-gray-600 text-white rounded-full"
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
