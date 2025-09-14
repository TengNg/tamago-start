import { useState, forwardRef } from "react";
import { axiosPrivate } from "../../api/axios";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

const BoardForm = forwardRef(({}, ref) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    const navigate = useNavigate();

    const { mutate, isLoading } = useMutation({
        mutationFn: () => createBoard(),
        onSuccess: (data, _variables, _context) => {
            navigate(`/b/${data.newBoard._id}`);
        },
        onError: (err, _, _context) => {
            const errMsg =
                err?.response?.data?.msg || "Failed to create new board";
            alert(errMsg);
        },
    });

    const handleCreateBoard = async (e) => {
        e.preventDefault();

        if (!title || isLoading) {
            return;
        }

        mutate();
    };

    const createBoard = async () => {
        const response = await axiosPrivate.post(
            "/boards",
            JSON.stringify({ title, description }),
        );

        return response.data;
    };

    return (
        <>
            <form
                ref={ref}
                onSubmit={handleCreateBoard}
                className="absolute board--style border-[2px] border-gray-600 shadow-gray-600 px-4 py-3 w-[250px] sm:w-[300px] flex flex-col gap-3 bg-gray-100 z-20 top-0 sm:left-0 left-1/2 sm:translate-x-0 -translate-x-1/2"
            >
                <p className="text-gray-600 font-medium">+ new board</p>

                <input
                    autoFocus={true}
                    className="border-[2px] border-gray-400 text-gray-600 p-2"
                    type="text"
                    autoComplete="off"
                    placeholder="title *"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />

                <input
                    className="border-[2px] border-gray-400 text-gray-600 p-2"
                    type="text"
                    autoComplete="off"
                    placeholder="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                <button
                    disabled={isLoading}
                    type="submit"
                    className="button--style--dark"
                >
                    {isLoading ? "creating..." : "create"}
                </button>
            </form>
        </>
    );
});

export default BoardForm;
