import { useState } from "react";
import useBoardState from "../../hooks/useBoardState";
import { updateBoard } from "../../api/boardApi";
import { SOCKET_EVENTS } from "@shared/socket-events.js";
import useToast from "../../hooks/useToast";
import BoardOptions from "./BoardOptions";
import { getErrorMessage } from "../../utils/getErrorMessage";

/**
 * @param {{
 *   setOpenCopyBoardForm: React.Dispatch<React.SetStateAction<boolean>>;
 * }} props
 */
const BoardHeader = ({ setOpenCopyBoardForm }) => {
    const {
        boardState,
        updateBoardField,
        openChatBox,
        setOpenChatBox,
        openFilter,
        setOpenFilter,
        hasFilter,
        openInvitationForm,
        setOpenInvitationForm,
        setOpenConfiguration: setOpenBoardConfiguration,
        setOpenBoardActivities,
        socket,
    } = useBoardState();

    const toast = useToast();

    const [openBoardOptions, setOpenBoardOptions] = useState(false);
    const [initialTitle, setInitialTitle] = useState("");

    /**
     * @param {string} value
     */
    const handleConfirmBoardTitle = async (value) => {
        if (value === "") {
            updateBoardField({ field: "title", value: initialTitle });
            return;
        }

        try {
            const data = await updateBoard(
                boardState.board._id,
                "title",
                value,
            );
            setInitialTitle(data.title);
            updateBoardField({
                field: "title",
                value: data.title,
            });

            socket.emit(SOCKET_EVENTS.BOARD_UPDATE, {
                field: "title",
                value: data.title,
            });
        } catch (err) {
            const errMsg = getErrorMessage(err, "Failed to update board title");
            toast.error(errMsg);
            updateBoardField({ field: "title", value: initialTitle });
        }
    };

    /** @param {React.KeyboardEvent<HTMLInputElement>} e */
    const handleBoardTitleInputOnKeyDown = (e) => {
        if (e.key == "Enter" && !e.shiftKey) {
            e.currentTarget.blur();
        }
    };

    /** @param {React.FocusEvent<HTMLInputElement>} e */
    const handleBoardTitleInputOnBlur = (e) => {
        const title = e.currentTarget.value.trim();

        if (!title) {
            updateBoardField({
                field: "title",
                value: boardState.board.title,
            });
            return;
        }

        handleConfirmBoardTitle(title);
    };

    return (
        <div className="flex flex-wrap justify-between w-full z-20 px-4">
            <div>
                <input
                    maxLength={80}
                    className="flex-1 bg-transparent overflow-hidden text-gray-700 whitespace-nowrap text-ellipsis border-b-2 border-gray-700 py-1 font-medium sm:font-bold select-none mb-2 focus:outline-hidden"
                    id="board-title-input"
                    style={{
                        width: `${boardState.board.title.length}ch`,
                        minWidth: "1ch",
                        maxWidth: "400px",
                    }}
                    onKeyDown={handleBoardTitleInputOnKeyDown}
                    onChange={(e) =>
                        updateBoardField({
                            field: "title",
                            value: e.target.value,
                        })
                    }
                    onBlur={handleBoardTitleInputOnBlur}
                    value={boardState.board.title}
                />
            </div>

            <div className="flex h-9 gap-2 z-20" id="board-options-wrapper">
                <div>
                    <div
                        onClick={() => setOpenChatBox((prev) => !prev)}
                        className={`bg-[rgb(var(--card-item-bg))] h-full flex--center cursor-pointer select-none border-gray-600 shadow-gray-600 w-20 px-4 border-2 text-[0.75rem] text-gray-600 font-medium
                                ${openChatBox ? "shadow-[0_1px_0_0] mt-0.5" : "shadow-[0_3px_0_0]"}`}
                    >
                        chat
                    </div>
                </div>

                <div>
                    <div
                        onClick={() => setOpenFilter((prev) => !prev)}
                        className={`bg-[rgb(var(--card-item-bg))] h-full flex--center cursor-pointer select-none border-gray-600 shadow-gray-600 w-20 px-4 border-2 text-[0.75rem] text-gray-600 font-medium
                                ${openFilter ? "shadow-[0_1px_0_0] mt-0.5" : "shadow-[0_3px_0_0]"} ${hasFilter ? "text-white bg-teal-600" : ""}`}
                    >
                        filter
                    </div>
                </div>

                <div>
                    <div
                        onClick={() => setOpenInvitationForm(true)}
                        className={`bg-[rgb(var(--card-item-bg))] h-full flex--center cursor-pointer select-none border-gray-600 shadow-gray-600 w-20 px-4 border-2 text-[0.75rem] text-gray-600 font-medium
                                ${openInvitationForm ? "shadow-[0_1px_0_0] mt-0.5" : "shadow-[0_3px_0_0]"}`}
                    >
                        invite
                    </div>
                </div>

                <div className="relative">
                    <button
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                setOpenBoardOptions((prev) => !prev);
                            }
                        }}
                        className={`bg-[rgb(var(--card-item-bg))] h-full flex--center cursor-pointer select-none border-gray-600 shadow-gray-600 w-20 px-4 border-2 text-[0.75rem] text-gray-600 font-medium
                            ${openBoardOptions ? "shadow-[0_1px_0_0] mt-0.5" : "shadow-[0_3px_0_0]"}`}
                    >
                        options
                    </button>

                    {openBoardOptions && (
                        <BoardOptions
                            setOpen={setOpenBoardOptions}
                            setOpenCopyBoardForm={setOpenCopyBoardForm}
                            setOpenBoardConfiguration={
                                setOpenBoardConfiguration
                            }
                            setOpenBoardActivities={setOpenBoardActivities}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default BoardHeader;
