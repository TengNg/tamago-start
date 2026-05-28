import { useState, useRef, useEffect } from "react";
import useBoardState from "../../hooks/useBoardState";
import { useNavigate } from "react-router-dom";
import { formatDateToYYYYMMDD } from "../../utils/dateFormatter";
import Icon from "../shared/Icon";
import useCurrentUserContext from "../../hooks/useCurrentUserContext";
import { axiosPrivate } from "../../api/axios";
import useToast from "../../hooks/useToast";
import { SOCKET_EVENTS } from "@shared/socket-events.js";

const BoardOptions = ({
    setOpen,
    setOpenCopyBoardForm,
    setOpenBoardConfiguration,
    setOpenBoardActivities,
}) => {
    const { currentUser } = useCurrentUserContext();
    const { boardState, removeMemberFromBoard, socket } = useBoardState();

    const [showDescription, setShowDescription] = useState(false);

    const navigate = useNavigate();

    const containerRef = useRef();

    const toast = useToast();

    useEffect(() => {
        containerRef.current.focus();
    }, []);

    const handleLeaveBoard = async () => {
        try {
            await axiosPrivate.delete(
                `/boards/${boardState.board._id}/members/leave`,
            );
            removeMemberFromBoard(currentUser.username);
            socket.emit(SOCKET_EVENTS.BOARD_LEAVE);
            navigate("/boards");
        } catch (err) {
            const errMsg =
                err?.response?.data?.message || "Failed to leave this board";
            toast.error(errMsg);
            navigate("/boards");
        }
    };

    const handleCloseBoard = async () => {
        if (
            confirm("This will delete this board permanently. Are you sure ?")
        ) {
            try {
                await axiosPrivate.delete(`/boards/${boardState.board._id}`);
                socket.emit(SOCKET_EVENTS.BOARD_CLOSE);
                navigate("/boards");
            } catch (err) {
                const errMsg =
                    err?.response?.data?.message ||
                    "Failed to close this board, something went wrong";
                toast.error(errMsg);
            }
        }
    };

    const handleUpdateDescription = async (e) => {
        if (e.target.value.trim() === boardState.board.description) return;
        try {
            await axiosPrivate.patch(
                `/boards/${boardState.board._id}/new-description`,
                JSON.stringify({ description: e.target.value.trim() }),
            );
            socket.emit(
                SOCKET_EVENTS.BOARD_UPDATE_DESCRIPTION,
                e.target.value.trim(),
            );
        } catch (err) {
            const errMsg =
                err.response?.data?.message || "Failed to update board title";
            toast.error(errMsg);
        }
    };

    const handleCloseMenuOnBlur = (e) => {
        if (
            !containerRef.current.contains(e.relatedTarget) &&
            e.relatedTarget !=
                containerRef.current.parentElement.querySelector("button")
        ) {
            setOpen(false);
        }
    };

    return (
        <>
            <div
                ref={containerRef}
                id="board-menu"
                tabIndex={-1}
                onBlur={handleCloseMenuOnBlur}
                className="bg-[rgb(var(--card-item-bg))] cursor-auto absolute outline-hidden bottom-0 right-0 overflow-x-hidden flex flex-col min-w-[300px] min-h-[200px] box--style shadow-gray-600 border-2 border-gray-600 p-3 select-none gap-2 translate-y-[105%]"
            >
                <div className="font-medium text-gray-600 flex-1 flex--center border-b border-black pb-1 mb-1">
                    options
                </div>

                <div className="flex justify-start">
                    <button
                        onClick={() => setShowDescription(true)}
                        className="button--style--dark flex items-center gap-2 ps-20 text-[0.75rem] font-medium text-start text-gray-200 w-full"
                    >
                        <Icon className="w-4 h-4" name="lightbulb" />
                        information
                    </button>
                </div>

                <div className="flex justify-start">
                    <button
                        onClick={() => setOpenCopyBoardForm(true)}
                        className="button--style--dark flex items-center gap-2 ps-20 text-[0.75rem] font-medium text-start text-gray-200 w-full"
                    >
                        <Icon className="w-4 h-4" name="copy" />
                        create a copy
                    </button>
                </div>

                <div className="flex justify-start">
                    <button
                        onClick={() => setOpenBoardConfiguration(true)}
                        className="button--style--dark flex items-center gap-2 ps-20 text-[0.75rem] font-medium text-start text-gray-200 w-full"
                    >
                        <Icon className="w-4 h-4" name="gear" />
                        configuration
                    </button>
                </div>

                <div className="flex justify-start">
                    <button
                        onClick={() => setOpenBoardActivities(true)}
                        className="button--style--dark flex items-center gap-2 ps-20 text-[0.75rem] font-medium text-start text-gray-200 w-full"
                    >
                        <Icon className="w-4 h-4" name="clock-rotate-left" />
                        activities
                    </button>
                </div>

                {boardState.board.createdBy.username ===
                currentUser.username ? (
                    <div className="flex justify-start">
                        <button
                            onClick={() => handleCloseBoard()}
                            className="button--style--dark bg-rose-800 hover:bg-rose-700 flex gap-2 ps-20 text-[0.75rem] font-medium text-start text-gray-200 w-full"
                        >
                            <Icon className="w-4 h-4" name="circle-xmark" />
                            delete board
                        </button>
                    </div>
                ) : (
                    <div className="flex justify-start">
                        <button
                            onClick={() => handleLeaveBoard()}
                            className="button--style--dark flex gap-2 ps-20 text-[0.75rem] font-medium text-start text-gray-200 w-full"
                        >
                            <Icon className="w-4 h-4" name="circle-xmark" />
                            leave board
                        </button>
                    </div>
                )}

                <div
                    className={`bg-[rgb(var(--card-item-bg))] absolute w-full h-fit min-h-full pb-4 top-0 right-0 flex flex-col px-5 transition-all ${showDescription ? "translate-x-0" : "-translate-x-full"}`}
                >
                    <button
                        onClick={() => setShowDescription(false)}
                        className="absolute top-4 left-5 text-gray-600"
                    >
                        <Icon className="w-4 h-4" name="arrow" />
                    </button>

                    <div className="font-medium text-gray-600 my-3 border-b-gray-400 flex--center">
                        information
                    </div>

                    <p className="font-normal text-start text-[0.75rem]">
                        created by:{" "}
                        <span className="font-medium underline">
                            {currentUser.username}
                        </span>
                    </p>
                    <p className="font-normal text-[0.75rem] text-start mt-2">
                        created at:{" "}
                        {formatDateToYYYYMMDD(boardState.board.createdAt, {
                            withTime: true,
                        })}
                    </p>
                    <p
                        className="font-normal text-[0.75rem] text-start mt-2 cursor-pointer hover:opacity-75"
                        onClick={() => {
                            navigator.clipboard
                                .writeText(boardState?.board?._id)
                                .then(() => {
                                    toast.success(
                                        "board code copied to clipboard",
                                    );
                                });
                        }}
                    >
                        code: {boardState.board._id}
                    </p>

                    <textarea
                        className="border-gray-600 mt-4 shadow-[0_3px_0_0] h-[80px] overflow-auto border-2 px-3 py-2 shadow-gray-600 bg-gray-100 w-full focus:outline-hidden font-medum sm:text-[0.75rem] text-gray-600 leading-normal"
                        placeholder="Write a short description..."
                        onBlur={handleUpdateDescription}
                        defaultValue={boardState.board.description}
                    />
                </div>
            </div>
        </>
    );
};

export default BoardOptions;
