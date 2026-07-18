import { useRef } from "react";
import useToast from "../../hooks/useToast";
import { useMutation } from "@tanstack/react-query";
import { sendJoinRequest } from "../../api/joinRequest";
import { getErrorMessage } from "../../utils/getErrorMessage";

const JoinBoardRequestForm = () => {
    /** @type {React.MutableRefObject<HTMLInputElement | null>} */
    const boardCodeInput = useRef(null);
    const toast = useToast();

    const joinRequestMutation = useMutation({
        mutationFn: /** @param {string} boardId */ (boardId) =>
            sendJoinRequest(boardId),
        onSuccess: () => {
            if (boardCodeInput.current) boardCodeInput.current.value = "";
            toast.success("request sent");
        },
        onError: (err) => {
            const errMsg = getErrorMessage(err, "Failed to send join request");
            toast.error(errMsg);
        },
    });

    /**
     * @param {React.FormEvent<HTMLFormElement>} e
     */
    const handleSendJoinRequest = (e) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        const boardCode = /** @type {string} */ (formData.get("boardCode"));
        if (!boardCode) {
            return;
        }

        joinRequestMutation.mutate(boardCode.trim());
    };

    return (
        <form onSubmit={handleSendJoinRequest} className="w-full">
            <div className="w-full relative flex flex-col items-start gap-4">
                <div className="w-full flex gap-2">
                    <input
                        autoFocus
                        type="text"
                        name="boardCode"
                        ref={boardCodeInput}
                        className={`p-3 w-full overflow-hidden shadow-gray-600 whitespace-nowrap text-ellipsis border-2 border-b-4 bg-gray-100 border-gray-600 text-gray-600 select-none font-mono focus:outline-hidden`}
                        placeholder="enter board code..."
                    />
                </div>
            </div>
        </form>
    );
};

export default JoinBoardRequestForm;
