import { useState } from "react";
import { boardApi } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import useToast from "../../hooks/useToast";
import { getErrorMessage } from "../../utils/getErrorMessage";

const BoardForm = () => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    const navigate = useNavigate();

    const toast = useToast();

    const { mutate, isPending } = useMutation({
        mutationFn: () => boardApi.createBoard({ title, description }),
        onSuccess: (data, _variables, _context) => {
            navigate(`/b/${data._id}`);
        },
        onError: (err, _, _context) => {
            const errMsg = getErrorMessage(err, "Failed to create new board");
            toast.error(errMsg);
        },
    });

    /** @param {React.FormEvent} e */
    const handleCreateBoard = async (e) => {
        e.preventDefault();

        if (!title || isPending) {
            return;
        }

        mutate();
    };

    return (
        <form onSubmit={handleCreateBoard} className="flex flex-col gap-3">
            <input
                autoFocus={true}
                className="p-3 w-full overflow-hidden shadow-gray-600 whitespace-nowrap text-ellipsis border-2 border-b-4 bg-gray-100 border-gray-600 text-gray-600 select-none font-mono focus:outline-hidden"
                type="text"
                autoComplete="off"
                placeholder="title *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
            />

            <input
                className="p-3 w-full overflow-hidden shadow-gray-600 whitespace-nowrap text-ellipsis border-2 border-b-4 bg-gray-100 border-gray-600 text-gray-600 select-none font-mono focus:outline-hidden"
                type="text"
                autoComplete="off"
                placeholder="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />

            <button
                disabled={isPending}
                type="submit"
                className="button--style--dark p-3"
            >
                {isPending ? "creating..." : "create"}
            </button>
        </form>
    );
};

export default BoardForm;
