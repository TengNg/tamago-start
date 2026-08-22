import { useState } from "react";
import BoardItem from "../components/board/BoardItem";
import BoardForm from "../components/board/BoardForm";
import Title from "../components/ui/Title";
import JoinBoardRequestForm from "../components/board/JoinBoardRequestForm";
import BoardsHelp from "../components/ui/BoardsHelp";
import Modal from "../components/ui/Modal";
import { useQuery } from "@tanstack/react-query";
import { boardApi } from "../services/api";
import { boardKeys } from "../queries/boardKeys";
import { useKeybind } from "../hooks/useKeybind";

const FILTERS = Object.freeze({
    ALL: "all",
    OWNED: "owned",
    JOINED: "joined",
});

const Boards = () => {
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

    /**
     * @param {"all" | "owned" | "joined"} status
     */
    function handleFilter(status) {
        setBoardFilter(status);
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
                title="send request"
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

                    <div className="p-6 flex flex-col gap-4 items-start justify-start border shadow-gray-600 border-gray-600 shadow-[3px_5px_0_0]">
                        <div className="w-full flex flex-row justify-between flex-wrap">
                            <div className="flex flex-col gap-2">
                                <p className="text-gray-700 font-semibold">
                                    YOUR BOARDS
                                </p>
                                <div className="flex flex-col sm:flex-row gap-1 sm:gap-0 mb-1 sm:mb-0 justify-between items-center">
                                    <div className="flex flex-row mb-1 text-gray-700 text-sm divide-x divide-gray-400">
                                        <div className="pr-2">
                                            <span
                                                className={`cursor-pointer ${boardFilter === FILTERS.ALL ? "underline" : ""}`}
                                                onClick={() =>
                                                    handleFilter(FILTERS.ALL)
                                                }
                                            >
                                                total:{boardsQuery.data.total}
                                            </span>
                                        </div>
                                        {boardsQuery.data.totalOwned > 0 && (
                                            <div className="px-2">
                                                <span
                                                    className={`cursor-pointer ${boardFilter === FILTERS.OWNED ? "underline" : ""}`}
                                                    onClick={() =>
                                                        handleFilter(
                                                            FILTERS.OWNED,
                                                        )
                                                    }
                                                >
                                                    owned:
                                                    {
                                                        boardsQuery.data
                                                            .totalOwned
                                                    }
                                                    /10
                                                </span>
                                            </div>
                                        )}
                                        {boardsQuery.data.totalJoined > 0 && (
                                            <div className="px-2">
                                                <span
                                                    className={`cursor-pointer ${boardFilter === FILTERS.JOINED ? "underline" : ""}`}
                                                    onClick={() =>
                                                        handleFilter(
                                                            FILTERS.JOINED,
                                                        )
                                                    }
                                                >
                                                    joined:
                                                    {
                                                        boardsQuery.data
                                                            .totalJoined
                                                    }
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex sm:w-auto mt-1 sm:mt-0 w-full gap-3 font-semibold">
                                <button
                                    className="text-[12px] sm:text-sm text-gray-700 cursor-pointer border border-gray-800 hover:underline h-10 w-1/2 sm:w-35"
                                    onClick={() =>
                                        setOpenBoardForm((open) => !open)
                                    }
                                >
                                    + new board
                                </button>
                                <button
                                    className="text-[12px] sm:text-sm cursor-pointer p-2 bg-gray-600 text-gray-50 hover:bg-gray-500 h-10 w-1/2 sm:w-35"
                                    onClick={() =>
                                        setOpenJoinBoardRequestForm(
                                            (open) => !open,
                                        )
                                    }
                                >
                                    join board
                                </button>
                            </div>
                        </div>
                        <div className="h-px bg-gray-400 w-full"></div>
                        <div className="w-full my-1.5 relative flex flex-col items-center sm:justify-start sm:items-start sm:flex-row sm:flex-wrap gap-4">
                            {boardsQuery.data.boards.map((item) => {
                                return <BoardItem key={item._id} item={item} />;
                            })}
                        </div>
                    </div>

                    {boardsQuery.data.recentBoards.length > 0 && (
                        <div className="mt-8 p-6 flex flex-col gap-4 items-start justify-start border shadow-gray-600 border-gray-600 shadow-[3px_5px_0_0]">
                            <p className="text-gray-700 font-semibold">
                                RECENTLY VIEWED
                            </p>
                            <div className="h-px bg-gray-400 w-full"></div>
                            <div className="w-full my-1.5 relative flex flex-col items-center sm:justify-start sm:items-start sm:flex-row sm:flex-wrap gap-4">
                                {boardsQuery.data.recentBoards.map((item) => (
                                    <BoardItem key={item._id} item={item} />
                                ))}
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
