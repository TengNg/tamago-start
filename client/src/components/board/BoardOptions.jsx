import { useState, useRef, useContext } from "react";
import { useMutation } from "@tanstack/react-query";
import useBoardState from "../../hooks/useBoardState";
import { useNavigate } from "react-router-dom";
import { formatDateToYYYYMMDD } from "../../utils/dateFormatter";
import Icon from "../shared/Icon";
import useCurrentUser from "../../hooks/useCurrentUser";
import { boardApi } from "../../services/api";
import useToast from "../../hooks/useToast";
import { getErrorMessage } from "../../utils/getErrorMessage";
import useClickOutside from "../../hooks/useClickOutside";
import ModalStackContext from "../../context/ModalStackContext";
import { useKeybind } from "../../hooks/useKeybind";

/**
 * @param {{
 *   open: boolean;
 *   setOpen: React.Dispatch<React.SetStateAction<boolean>>;
 *   setOpenCopyBoardForm: React.Dispatch<React.SetStateAction<boolean>>;
 * }} props
 */
const BoardOptions = ({ open, setOpen, setOpenCopyBoardForm }) => {
    const currentUser = useCurrentUser();
    const { boardState, setOpenConfiguration, setOpenBoardActivities } =
        useBoardState();

    const { isAnyModalOpen } = useContext(ModalStackContext);

    const [description, setDescription] = useState(
        boardState.board.description,
    );
    const [showDescription, setShowDescription] = useState(false);

    const navigate = useNavigate();

    /** @type {import("react").MutableRefObject<HTMLDivElement | null>} */
    const containerRef = useRef(null);

    const toast = useToast();

    useKeybind("esc", () => {
        if (open && !isAnyModalOpen) setOpen(false);
    });

    useClickOutside(containerRef, () => {
        if (open && !isAnyModalOpen) setOpen(false);
    });

    const handleLeaveBoard = async () => {
        try {
            await boardApi.leaveBoard(boardState.board._id);
            navigate("/boards");
        } catch (err) {
            const errMsg = getErrorMessage(err, "Failed to leave this board");
            toast.error(errMsg);
            navigate("/boards");
        }
    };

    const handleCloseBoard = async () => {
        if (
            confirm("This will delete this board permanently. Are you sure ?")
        ) {
            try {
                await boardApi.deleteBoard(boardState.board._id);
                navigate("/boards");
            } catch (err) {
                const errMsg = getErrorMessage(
                    err,
                    "Failed to close this board, something went wrong",
                );
                toast.error(errMsg);
            }
        }
    };

    const descriptionMutation = useMutation({
        mutationFn: () =>
            boardApi.updateBoard(
                boardState.board._id,
                "description",
                description.trim(),
            ),
        onError: (err) => {
            const errMsg = getErrorMessage(
                err,
                "Failed to update board description",
            );
            toast.error(errMsg);
        },
    });

    return (
        <>
            <div
                ref={containerRef}
                id="board-menu"
                className="bg-[rgb(var(--card-item-bg))] cursor-auto absolute outline-hidden bottom-0 right-0 overflow-x-hidden flex flex-col min-w-75 min-h-50 box--style shadow-gray-600 border-2 border-gray-600 p-3 gap-2 translate-y-[105%]"
            >
                <div className="font-medium text-gray-600 flex-1 flex--center border-b border-black pb-1 mb-1">
                    options
                </div>

                <div className="flex justify-start">
                    <button
                        onClick={() => {
                            setDescription(boardState.board.description);
                            setShowDescription(true);
                        }}
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
                        onClick={() => setOpenConfiguration(true)}
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
                                .writeText(boardState.board._id)
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
                        className="border-gray-600 mt-4 shadow-[0_3px_0_0] h-25 overflow-auto border-2 px-3 py-2 shadow-gray-600 bg-gray-100 w-full focus:outline-hidden font-medum sm:text-[0.75rem] text-gray-600 leading-normal"
                        placeholder="description for this board..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <button
                        onClick={() => descriptionMutation.mutate()}
                        disabled={
                            descriptionMutation.isPending ||
                            description.trim() === boardState.board.description
                        }
                        className="button--style--dark w-25 mt-2 self-end text-[0.75rem] font-medium text-gray-200 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {descriptionMutation.isPending ? "saving..." : "save"}
                    </button>
                </div>
            </div>
        </>
    );
};

export default BoardOptions;
