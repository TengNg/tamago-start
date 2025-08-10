import { useEffect, useRef, useState } from "react";
import useBoardState from "../../hooks/useBoardState";
import { lexorank } from "../../utils/class/Lexorank";
import Loading from "../ui/Loading";
import Icon from "../shared/Icon";
import { axiosPrivate } from "../../api/axios";

const MoveListForm = () => {
    const [boards, setBoards] = useState([]);
    const [selectedBoardId, setSelectedBoardId] = useState();
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [listCount, setListCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const {
        socket,
        boardState,
        setBoardState,
        listToMove,
        setListToMove,
        openMoveListForm: open,
        setOpenMoveListForm: setOpen,
    } = useBoardState();

    const dialog = useRef();

    const getBoardListCount = async (boardId) => {
        if (!boardId) {
            alert("Please select a board");
            return;
        }

        const response = await axiosPrivate.get(`/lists/b/${boardId}/count`);
        const listCount = response.data.count;

        setListCount(listCount);
        setSelectedBoardId(boardId);
    };

    useEffect(() => {
        if (open) {
            dialog.current.showModal();

            const handleOnClose = () => {
                setOpen(false);
                setListToMove(undefined);
            };

            const getBoards = async () => {
                const response = await axiosPrivate.get(`/boards`);
                const { boards } = response.data;
                setBoards(boards);
                getBoardListCount(listToMove?.boardId);
            };

            getBoards().catch((err) => {
                console.log(err);
                alert(`Failed to get board options`);
            });

            dialog.current.addEventListener("close", handleOnClose);

            () => {
                dialog.current.removeEventListener("close", handleOnClose);
            };
        } else {
            dialog.current.close();
        }
    }, [open]);

    const handleCloseOnOutsideClick = (e) => {
        if (e.target === dialog.current) {
            dialog.current.close();
        }
    };

    const handleClose = () => {
        dialog.current.close();
    };

    const handleSelectBoardId = async (e) => {
        const boardId = e.target.value;

        if (!boardId) {
            return;
        }

        try {
            setSelectedBoardId(boardId);
            getBoardListCount(boardId);
        } catch (err) {
            console.log(err);
            alert("Failed to select board, please try again");
        }
    };

    const handleMoveList = async () => {
        if (!selectedBoardId) return;

        setLoading(true);

        const list = listToMove;

        // move list to another board ==================================================================================
        if (list.boardId !== selectedBoardId) {
            try {
                const response = await axiosPrivate.put(
                    `/lists/move/${listToMove._id}/b/${selectedBoardId}/i/${selectedIndex}`,
                );
                const { list, cards } = response.data;

                setBoardState((prev) => {
                    return {
                        ...prev,
                        lists: prev.lists.filter(
                            (list) => list._id != listToMove._id,
                        ),
                    };
                });

                socket.emit("deleteList", list._id);
                socket.emit("addMovedListToBoard", {
                    boardId: selectedBoardId,
                    list,
                    cards,
                    index: selectedIndex,
                });

                setOpen(false);
                setListToMove(undefined);
            } catch (err) {
                console.log(err);
                setOpen(false);
                setListToMove(undefined);
                alert("Failed to move list");
            }

            setLoading(false);
            return;
        }

        // move list in current board ==================================================================================
        try {
            const newLists = [...boardState.lists];
            let removed = undefined;
            let currentIndex = undefined;

            for (let i = 0; i < newLists.length; i++) {
                const l = newLists[i];
                if (l._id === listToMove._id) {
                    removed = newLists.splice(i, 1)[0];
                    currentIndex = i;
                    break;
                }
            }

            if (
                currentIndex &&
                selectedIndex &&
                removed &&
                +selectedIndex === +currentIndex
            ) {
                return;
            }

            newLists.splice(selectedIndex, 0, removed);

            let prevRank = newLists[+selectedIndex - 1]?.order;
            let nextRank = newLists[+selectedIndex + 1]?.order;

            let [rank, ok] = lexorank.insert(prevRank, nextRank);

            // failed to reorder
            if (!ok) {
                alert(
                    "Cannot move this list in current board, try again or enable #debug_mode to see what happened",
                );
                return;
            }

            removed.order = rank;

            setBoardState((prev) => {
                return { ...prev, lists: newLists };
            });

            const removedId = removed._id;
            await axiosPrivate.put(
                `/lists/${removedId}/reorder`,
                JSON.stringify({
                    rank,
                    sourceIndex: currentIndex,
                    destinationIndex: selectedIndex,
                }),
            );
            socket.emit("moveList", {
                listId: removedId,
                fromIndex: +currentIndex,
                toIndex: +selectedIndex,
            });
        } catch (err) {
            console.log(err);
            alert(
                "Cannot move this list in current board, try again or enable #debug_mode to see what happened",
            );
        }

        setLoading(false);
    };

    return (
        <>
            <dialog
                ref={dialog}
                className="z-40 backdrop:bg-black/15 fixed top-0 right-0 box--style gap-4 items-start p-3 pb-5 h-fit w-[90%] sm:w-1/2 lg:w-1/4 border-black border-[2px] bg-gray-200"
                onClick={handleCloseOnOutsideClick}
            >
                <Loading
                    loading={loading}
                    position={"absolute"}
                    fontSize={"0.8rem"}
                    displayText={"moving list..."}
                />

                <div className="flex w-full justify-between items-center border-b-[1px] border-black pb-3 mb-4">
                    <p className="font-normal text-[1rem] text-gray-700">
                        move this list to
                    </p>
                    <button
                        className="text-gray-600 flex justify-center items-center"
                        onClick={handleClose}
                    >
                        <Icon className="w-4 h-4" name="xmark" />
                    </button>
                </div>

                <div className="flex w-full justify-between items-center border-b-[1px] border-black pb-4 mb-4">
                    <div className="text-[0.85rem] text-gray-700">
                        <span>list title:</span>
                        <span> </span>
                        <span className="font-medium">{listToMove?.title}</span>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-3 min-w-[200px]">
                        <select
                            disabled={boards.length == 0}
                            onChange={(e) => {
                                handleSelectBoardId(e);
                            }}
                            value={selectedBoardId}
                            className={`appearance-none cursor-pointer border-gray-300 text-sm w-full py-2 px-4 text-gray-100 ${boards.length === 0 ? "bg-gray-500" : "bg-gray-600"}`}
                        >
                            {boards.map((board, index) => {
                                const { _id, title } = board;
                                return (
                                    <option key={index} value={_id}>
                                        board: {title}
                                    </option>
                                );
                            })}
                        </select>

                        <select
                            disabled={listCount === 0}
                            onChange={(e) => {
                                setSelectedIndex(+e.target.value);
                            }}
                            className={`appearance-none cursor-pointer border-gray-300 text-sm w-full py-2 px-4 ${listCount === 0 ? "bg-gray-500" : "bg-gray-600"} text-gray-100`}
                        >
                            {listCount === 0 ? (
                                <option value={0}>position: 1</option>
                            ) : (
                                Array.from(Array(listCount + 1).keys()).map(
                                    (count) => {
                                        return (
                                            <option key={count} value={count}>
                                                position: {count + 1}
                                            </option>
                                        );
                                    },
                                )
                            )}
                        </select>
                    </div>

                    <div className="h-[1px] w-full my-2 bg-black"></div>

                    <button
                        onClick={handleMoveList}
                        className="button--style border-[2px] py-2 text-[0.8rem] hover:bg-gray-600 hover:text-white transition-all"
                    >
                        move
                    </button>
                </div>
            </dialog>
        </>
    );
};

export default MoveListForm;
