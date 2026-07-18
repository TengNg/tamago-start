import { useRef, useState } from "react";
import useBoardState from "../../hooks/useBoardState";
import { copyBoard } from "../../api/boardApi";
import useToast from "../../hooks/useToast";
import { getErrorMessage } from "../../utils/getErrorMessage";
import { useMutation } from "@tanstack/react-query";

const CopyBoardForm = () => {
    const { boardState } = useBoardState();

    /** @type {React.MutableRefObject<HTMLInputElement | null>} */
    const nameInputEl = useRef(null);

    const [title, setTitle] = useState(boardState.board.title + " (copy)");
    const [desciption, setDescription] = useState(boardState.board.description);

    const toast = useToast();

    const { isPending, mutate } = useMutation({
        mutationFn: () =>
            copyBoard(boardState.board._id, { title, desciption }),
        onSuccess: (_data, _variables, _context) => {
            setTitle("");
            setDescription("");
            toast.success("Board copied successfully");
        },
        onError: (err) => {
            setTitle("");
            setDescription("");
            const errMsg = getErrorMessage(err, "Failed to copy this board");
            toast.error(errMsg);
        },
    });

    const handleCreate = async () => {
        if (!title) {
            toast.error("Title is required");
            return;
        }

        if (confirm("Do you want to Copy this board with its data ?")) {
            mutate();
        }
    };

    return (
        <div className="w-full h-full relative">
            <div className="w-full flex flex-col items-start justify-start gap-3">
                <input
                    ref={nameInputEl}
                    className={`p-3 w-full shadow-[0_3px_0_0] overflow-hidden whitespace-nowrap text-ellipsis border-2 bg-gray-100 border-gray-600 text-gray-600 font-semibold select-none focus:outline-hidden`}
                    placeholder="new title..."
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    value={title}
                />

                <textarea
                    className="p-3 border-gray-600 resize-none shadow-[0_3px_0_0] h-20 overflow-auto border-2 shadow-gray-600 bg-gray-100 w-full focus:outline-hidden font-semibold text-gray-600 leading-normal"
                    placeholder="description..."
                    onChange={(e) => setDescription(e.target.value)}
                    value={desciption}
                />

                <button
                    disabled={isPending}
                    onClick={() => handleCreate()}
                    className="button--style--dark w-full"
                >
                    {isPending ? "creating..." : "create"}
                </button>
            </div>
        </div>
    );
};

export default CopyBoardForm;
