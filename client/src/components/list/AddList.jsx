import { useState, useRef, useEffect } from "react";
import useBoardState from "../../hooks/useBoardState";
import { listApi } from "../../services/api";
import useToast from "../../hooks/useToast";
import { getErrorMessage } from "../../utils/getErrorMessage";
import { useMutation } from "@tanstack/react-query";

const AddList = () => {
    const [title, setTitle] = useState("");

    /** @type {React.MutableRefObject<HTMLInputElement | null>} */
    const titleInputRef = useRef(null);

    /** @type {React.MutableRefObject<HTMLDivElement | null>} */
    const containerRef = useRef(null);

    const {
        openAddList: open,
        setOpenAddList: setOpen,
        theme,
        boardState,
        addListToBoard,
        deleteList,
    } = useBoardState();

    const toast = useToast();

    useEffect(() => {
        if (open) {
            if (titleInputRef.current) {
                titleInputRef.current.focus();
            }

            if (containerRef.current) {
                containerRef.current.scrollIntoView({ block: "end" });
            }
        }
    }, [open]);

    const addListMutation = useMutation({
        mutationFn: async () => {
            if (title.trim() === "") {
                return;
            }

            const realLists = boardState.lists.filter(
                (list) => !list._id.includes("temp-"),
            );
            const prevListId =
                realLists.length > 0
                    ? realLists[realLists.length - 1]._id
                    : undefined;

            const newList = {
                title: title,
                boardId: boardState.board._id,
                prevListId,
            };

            const data = await listApi.createList(newList);
            return data;
        },
        onMutate: () => {
            /** @type {List} */
            const tempList = {
                _id: "temp-" + Date.now(),
                boardId: boardState.board._id,
                title: title,
                order: "",
                createdAt: Date.now().toString(),
            };

            addListToBoard(tempList);
            return { tempId: tempList._id };
        },
        onSuccess: (
            data,
            _,
            /** @type {{ tempId: string } | undefined} */ context,
        ) => {
            if (!data) {
                if (context?.tempId) {
                    deleteList(context.tempId);
                }
                return;
            }

            if (context?.tempId) {
                deleteList(context.tempId);
            }

            setTitle("");
            setOpen(false);
        },
        onError: (
            err,
            _,
            /** @type {{ tempId: string } | undefined} */ context,
        ) => {
            if (context?.tempId) {
                deleteList(context.tempId);
            }

            const errMsg = getErrorMessage(err, "Failed to add new list");
            toast.error(errMsg);
        },
    });

    const handleOpenAddListForm = () => {
        if (titleInputRef.current) {
            setOpen(true);
        }
    };

    const handleAddList = async () => {
        if (title.trim() === "") {
            setOpen(false);
            return;
        }

        await addListMutation.mutateAsync();
    };

    /**
     * @param {React.KeyboardEvent<HTMLInputElement>} e
     */
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleAddList();
        }
    };

    /**
     * @param {React.ChangeEvent<HTMLInputElement>} e
     */
    const handleInputChange = (e) => {
        setTitle(e.target.value);
    };

    if (addListMutation.isPending) {
        return null;
    }

    return (
        <div
            ref={containerRef}
            className={`${theme.itemTheme == "rounded-sm" ? "rounded-md" : ""} group shadow-[0px_4px_0_0] overflow-hidden bg-gray-100 w-75 min-w-75 border-2 min-h-12 select-none cursor-pointer border-gray-500 shadow-gray-500 text-gray-500 font-medium`}
            style={{ backgroundColor: "rgba(241, 241, 241, 0.75)" }}
        >
            {!open && (
                <button
                    className="w-full h-full text-start p-3 flex gap-2 text-sm hover:bg-gray-500/10"
                    onClick={handleOpenAddListForm}
                >
                    + new list
                </button>
            )}

            <div className={`flex-col flex gap-3 -mt-[100%] ${open && "mt-0"}`}>
                <input
                    className="border-gray-500 text-gray-700 font-medium pt-2 px-3 focus:outline-hidden"
                    type="text"
                    autoComplete="off"
                    placeholder="list title goes here..."
                    value={title}
                    ref={titleInputRef}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                />

                <div className="flex gap-1 w-full pt-1 pb-2 px-3">
                    <button
                        onClick={handleAddList}
                        className="button--style--dark grid place-items-center w-1/2 font-medium text-sm"
                    >
                        + add
                    </button>
                    <button
                        onClick={() => setOpen(false)}
                        className="button--style grid place-items-center text-sm w-1/2 font-medium text-gray-600 border-gray-600 hover:underline"
                    >
                        cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddList;
