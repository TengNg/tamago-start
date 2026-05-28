import { useState, useEffect, useRef } from "react";
import Icon from "../shared/Icon";
import { axiosPrivate } from "../../api/axios";
import useToast from "../../hooks/useToast";

const JoinBoardRequestForm = ({ open, setOpen }) => {
    const dialog = useRef();
    const boardCodeInput = useRef();

    const [success, setSuccess] = useState(false);

    const toast = useToast();

    useEffect(() => {
        if (open) {
            dialog.current.showModal();
            boardCodeInput.current.focus();

            const handleOnClose = () => {
                setOpen(false);
                setSuccess(false);
                boardCodeInput.current.value = "";
            };

            dialog.current.addEventListener("close", handleOnClose);

            return () => {
                dialog.current.removeEventListener("close", handleOnClose);
            };
        } else {
            dialog.current.close();
        }
    }, [open]);

    useEffect(() => {
        let id = null;
        if (success) {
            id = setTimeout(() => {
                setSuccess(false);
            }, 2000);
        }
        return () => clearTimeout(id);
    }, [success]);

    const handleCloseOnOutsideClick = (e) => {
        if (e.target === dialog.current) {
            dialog.current.close();
        }
    };

    const handleClose = () => {
        dialog.current.close();
    };

    const handleSendJoinRequest = async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
        const boardCode = formData.get("boardCode");

        if (!boardCode) return;

        try {
            await axiosPrivate.post(
                `/join_board_requests/`,
                JSON.stringify({ boardId: boardCode.trim() }),
            );
            boardCodeInput.current.value = "";
            setSuccess(true);
        } catch (err) {
            const errMsg =
                err?.response?.data?.message || "Failed to send join request";
            toast.error(errMsg);
            setSuccess(false);
        }
    };

    return (
        <dialog
            ref={dialog}
            className="relative z-40 backdrop:bg-black/15 box--style gap-4 items-start p-3 pb-4 h-fit min-w-[350px] max-h-[500px] border-black border-2 bg-gray-200"
            onClick={handleCloseOnOutsideClick}
        >
            <div className="flex w-full justify-between items-center border-b border-black pb-3">
                <p className="font-normal text-[1rem] text-gray-700">
                    send join request
                </p>
                <button
                    className="text-gray-600 flex justify-center items-center"
                    onClick={handleClose}
                >
                    <Icon className="w-4 h-4" name="xmark" />
                </button>
            </div>

            <form onSubmit={handleSendJoinRequest}>
                <div className="w-full relative flex flex-col items-start gap-4 py-2 mt-2">
                    <div className="w-full flex gap-2">
                        <input
                            type="text"
                            name="boardCode"
                            ref={boardCodeInput}
                            className={`p-3 w-full overflow-hidden shadow-[0_3px_0_0] shadow-gray-600 whitespace-nowrap text-ellipsis border-2 bg-gray-100 border-gray-600 text-gray-600 select-none font-mono focus:outline-hidden`}
                            placeholder="enter board code..."
                        />
                    </div>
                </div>
            </form>

            {success && (
                <>
                    <p className="text-[0.75rem] text-blue-600 text-center mt-2">
                        request sent
                    </p>
                </>
            )}
        </dialog>
    );
};

export default JoinBoardRequestForm;
