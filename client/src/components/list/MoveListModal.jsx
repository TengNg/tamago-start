import { useMemo, useState } from "react";
import useBoardState from "../../hooks/useBoardState";
import Loading from "../ui/Loading";
import useToast from "../../hooks/useToast";
import { SOCKET_EVENTS } from "@shared/socket-events.js";
import { BOARD_ACTIONS } from "../../state/boardActionTypes";
import { useQuery, useMutation } from "@tanstack/react-query";
import { boardApi } from "../../services/api";
import { boardKeys } from "../../queries/boardKeys";
import Modal from "../ui/Modal";
import { listApi } from "../../services/api";
import { getErrorMessage } from "../../utils/getErrorMessage";

const MoveListModal = () => {
    const [selectedBoardId, setSelectedBoardId] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);

    const {
        socket,
        boardState,
        dispatch,
        listToMove,
        setListToMove,
        openMoveListForm: open,
        setOpenMoveListForm: setOpen,
    } = useBoardState();

    const toast = useToast();

    const boardsQuery = useQuery({
        queryKey: boardKeys.all(),
        queryFn: () => boardApi.fetchBoards({ filter: "" }),
        enabled: open,
    });

    const boards = useMemo(
        () => boardsQuery.data?.boards ?? [],
        [boardsQuery.data],
    );

    const effectiveBoardId =
        selectedBoardId || (open && boards.length > 0 ? boards[0]._id : "");

    const listCountQuery = useQuery({
        queryKey: boardKeys.listCount(effectiveBoardId),
        queryFn: () => boardApi.fetchBoardListCount(effectiveBoardId),
        enabled: !!effectiveBoardId,
    });

    const listCount = listCountQuery.data?.count ?? 0;

    const moveToBoardMutation = useMutation({
        mutationFn: () =>
            listApi.moveList(listToMove._id, effectiveBoardId, selectedIndex),
        onSuccess: (data) => {
            const { list, cards } = data;

            dispatch({
                type: BOARD_ACTIONS.DELETE_LIST,
                payload: { listId: list._id },
            });

            socket.emit(SOCKET_EVENTS.LIST_DELETE, { id: list._id });
            socket.emit(SOCKET_EVENTS.LIST_MOVE_TO_BOARD, {
                boardId: effectiveBoardId,
                list,
                cards,
                index: selectedIndex,
            });

            handleClose();
        },
        onError: (err) => {
            handleClose();
            const errMsg = getErrorMessage(err, "Failed to move list");
            toast.error(errMsg);
        },
    });

    const reorderMutation = useMutation({
        /**
         * @param {{ prevListId: string | null | undefined; nextListId: string | null | undefined; currentIndex: number }} params
         */
        mutationFn: ({ prevListId, nextListId, currentIndex }) =>
            listApi.reorderList(listToMove._id, {
                boardId: boardState.board._id,
                prevListId,
                nextListId,
                oldPos: currentIndex,
                newPos: selectedIndex,
            }),
        onSuccess: (_data, { currentIndex }) => {
            socket.emit(SOCKET_EVENTS.LIST_MOVE, {
                id: listToMove._id,
                fromIndex: +currentIndex,
                toIndex: +selectedIndex,
            });
        },
        onError: (err) => {
            toast.error(
                getErrorMessage(
                    err,
                    "Cannot move this list in current board, try again or enable #debug_mode to see what happened",
                ),
            );
        },
    });

    const isPending =
        moveToBoardMutation.isPending || reorderMutation.isPending;

    const handleClose = () => {
        setOpen(false);
        setListToMove(undefined);
        setSelectedBoardId("");
        setSelectedIndex(0);
    };

    /**
     * @param {React.ChangeEvent<HTMLSelectElement>} e
     */
    const handleSelectBoardId = (e) => {
        const boardId = e.target.value;
        if (!boardId) {
            return;
        }

        setSelectedBoardId(boardId);
        setSelectedIndex(0);
    };

    const handleMoveList = () => {
        if (!effectiveBoardId) return;

        const list = listToMove;

        // move list to another board
        if (list.boardId !== effectiveBoardId) {
            moveToBoardMutation.mutate();
            return;
        }

        // move list in current board
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

        if (removed === undefined || currentIndex === undefined) {
            return;
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

        const prevListId = newLists[+selectedIndex - 1]?._id;
        const nextListId = newLists[+selectedIndex + 1]?._id;

        dispatch({
            type: BOARD_ACTIONS.SET_LISTS,
            payload: { lists: newLists },
        });

        reorderMutation.mutate({ prevListId, nextListId, currentIndex });
    };

    return (
        <Modal
            title={`move list ${listToMove?.title}`}
            open={open}
            setOpen={handleClose}
        >
            <Loading
                loading={isPending}
                position={"absolute"}
                fontSize={"0.8rem"}
                displayText={"moving list..."}
            />

            <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-3 min-w-50">
                    <select
                        disabled={boards.length === 0}
                        onChange={handleSelectBoardId}
                        value={effectiveBoardId}
                        className={`appearance-none cursor-pointer border-gray-700 border-2 border-b-5 text-sm w-full p-3 ${boards.length === 0 ? "bg-gray-500" : "bg-gray-200"} text-gray-700`}
                    >
                        {boards.map((board) => {
                            const { _id, title } = board;
                            return (
                                <option key={_id} value={_id}>
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
                        className={`appearance-none cursor-pointer border-gray-700 border-2 border-b-5 text-sm w-full p-3 ${listCount === 0 ? "bg-gray-500" : "bg-gray-200"} text-gray-700`}
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

                <button
                    onClick={handleMoveList}
                    disabled={isPending}
                    className="button--style--dark"
                >
                    move
                </button>
            </div>
        </Modal>
    );
};

export default MoveListModal;
