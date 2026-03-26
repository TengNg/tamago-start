import { useState, useEffect, useRef } from "react";
import Loading from "../ui/Loading";
import VISIBILITY_MAP from "../../data/visibility";
import useBoardState from "../../hooks/useBoardState";
import Icon from "../shared/Icon";
import { axiosPrivate } from "../../api/axios";
import useToast from "../../hooks/useToast";

const VisibilityConfig = ({ open, setOpen }) => {
    const { boardState, setBoardVisibility } = useBoardState();

    const [updating, setUpdating] = useState(false);

    const visibility = boardState?.board?.visibility || "private";

    const dialog = useRef();
    const visiblityOptions = Object.keys(VISIBILITY_MAP);

    const toast = useToast();

    useEffect(() => {
        if (open) {
            dialog.current.showModal();

            const handleOnClose = () => {
                setOpen(false);
            };

            dialog.current.addEventListener("close", handleOnClose);

            () => {
                dialog.current.removeEventListener("close", handleOnClose);
            };
        } else {
            dialog.current.close();
        }
    }, [open]);

    const handleSetBoardVisibility = async (visibility) => {
        if (boardState?.board?.visibility === visibility) return;

        try {
            setUpdating(true);
            const response = await axiosPrivate.patch(
                `/boards/${boardState.board._id}/new-visibility`,
                JSON.stringify({ visibility }),
            );
            const { newBoard } = response.data;
            setBoardVisibility(newBoard?.visibility);
            setUpdating(false);
        } catch (err) {
            setUpdating(false);
            const errMsg =
                err?.response?.data?.message ||
                "Failed to update board visibility";
            toast.error(errMsg);
        }
    };

    const handleCloseOnOutsideClick = (e) => {
        if (e.target === dialog.current) {
            dialog.current.close();
        }
    };

    const handleClose = () => {
        dialog.current.close();
    };

    return (
        <dialog
            ref={dialog}
            className="z-40 relative backdrop:bg-black/15 box--style gap-4 items-start p-3 pb-4 h-fit min-w-[300px] max-h-[500px] border-black border-[2px] bg-gray-200"
            onClick={handleCloseOnOutsideClick}
        >
            <Loading
                loading={updating}
                position={"absolute"}
                displayText={"updating visibility..."}
                fontSize={"0.9rem"}
            />

            <div className="flex w-full justify-between items-center border-b-[1px] border-black pb-3">
                <p className="font-normal text-[1rem] text-gray-700">
                    board visibility
                </p>
                <button
                    className="text-gray-600 flex justify-center items-center"
                    onClick={handleClose}
                >
                    <Icon className="w-4 h-4" name="xmark" />
                </button>
            </div>

            <div className="w-full relative flex flex-col items-start gap-4 py-2 mt-2">
                {visiblityOptions.map((option, index) => {
                    return (
                        <button
                            key={index}
                            className={`button--style shadow-[0_2px_0_0] shadow-gray-700 text-sm flex justify-between w-full ${visibility == option ? "bg-gray-500 text-gray-50" : ""}`}
                            onClick={() => {
                                handleSetBoardVisibility(option);
                            }}
                        >
                            <div>{option}</div>
                            <div>{VISIBILITY_MAP[option]}</div>
                        </button>
                    );
                })}
            </div>
        </dialog>
    );
};

export default VisibilityConfig;
