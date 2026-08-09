import useBoardState from "../../hooks/useBoardState";
import useToast from "../../hooks/useToast";
import { useKeybind } from "../../hooks/useKeybind";
import { kb } from "../../constants/keybinds";
import { useMutation } from "@tanstack/react-query";
import { boardApi } from "../../services/api";
import Modal from "../ui/Modal";
import Loading from "../ui/Loading";
import { getErrorMessage } from "../../utils/getErrorMessage";

const AVAILABLE_VISIBILITIES = ["private", "public"];

const VisibilityConfigModal = () => {
    const {
        boardState,
        openVisibilityConfig: open,
        setOpenVisibilityConfig: setOpen,
    } = useBoardState();

    const toast = useToast();

    const visibility = boardState.board.visibility || "private";

    useKeybind(
        kb.openVisibilityConfig,
        () => {
            setOpen((prev) => !prev);
        },
        { ignoreInInputs: true },
    );

    const visibilityMutation = useMutation({
        mutationFn: (/** @type {string} */ newVisibility) =>
            boardApi.updateBoard(
                boardState.board._id,
                "visibility",
                newVisibility,
            ),
        onError: (err) => {
            const errMsg = getErrorMessage(
                err,
                "Failed to update board visibility",
            );
            toast.error(errMsg);
        },
    });

    /** @param {string} visibility */
    const handleSetBoardVisibility = (visibility) => {
        if (boardState.board.visibility === visibility) return;
        visibilityMutation.mutate(visibility);
    };

    return (
        <Modal title="board visibility" open={open} setOpen={setOpen}>
            <Loading
                loading={visibilityMutation.isPending}
                position={"absolute"}
                displayText={"updating visibility..."}
                fontSize={"0.9rem"}
            />

            <div className="w-full relative flex flex-col items-start gap-3">
                {AVAILABLE_VISIBILITIES.map((option) => {
                    return (
                        <button
                            key={option}
                            className={`button--style shadow-[0_2px_0_0] shadow-gray-700 text-sm flex justify-between w-full ${visibility == option ? "bg-gray-500 text-gray-50" : ""}`}
                            onClick={() => {
                                handleSetBoardVisibility(option);
                            }}
                        >
                            <div>{option}</div>
                        </button>
                    );
                })}
            </div>
        </Modal>
    );
};

export default VisibilityConfigModal;
