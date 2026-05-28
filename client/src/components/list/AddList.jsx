import { useState, useRef, useEffect } from "react";
import useBoardState from "../../hooks/useBoardState";
import { lexorank } from "../../lib/lexorank";
import { axiosPrivate } from "../../api/axios";
import useToast from "../../hooks/useToast";
import { SOCKET_EVENTS } from "@shared/socket-events.js";

const AddList = () => {
    const [title, setTitle] = useState("");
    const [addingList, setAddingList] = useState(false);
    const titleInputRef = useRef();
    const containerRef = useRef();

    const {
        openAddList: open,
        setOpenAddList: setOpen,
        theme,
        boardState,
        addListToBoard,
        socket,
    } = useBoardState();

    const toast = useToast();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target)
            ) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (titleInputRef.current && open) {
            titleInputRef.current.focus();
            containerRef.current.scrollIntoView({ block: "end" });
        }
    }, [open]);

    const handleAddList = async () => {
        if (title.trim() === "" || addingList) {
            return;
        }

        let prevOrder = "";
        if (boardState.lists.length > 0) {
            prevOrder = boardState.lists[boardState.lists.length - 1].order;
        }

        const [rank, _] = lexorank.insert(prevOrder);

        const newList = {
            title: title,
            order: rank,
            boardId: boardState.board._id,
        };

        try {
            setAddingList(true);

            const response = await axiosPrivate.post(
                "/lists",
                JSON.stringify(newList),
            );
            socket.emit(SOCKET_EVENTS.LIST_CREATE, response.data.newList);
            addListToBoard(response.data.newList);
            setTitle("");
            titleInputRef.current.focus();
        } catch (err) {
            const errMsg =
                err?.response?.data?.message || "Failed to add new list";
            toast.error(errMsg);
        } finally {
            setAddingList(false);
        }
    };

    const handleOpenAddListForm = () => {
        if (titleInputRef.current) {
            setOpen(true);
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === "Enter") {
            handleAddList();
        }
    };

    const handleInputChange = (e) => {
        setTitle(e.target.value);
    };

    return (
        <div
            ref={containerRef}
            className={`${theme.itemTheme == "rounded-sm" ? "rounded-md" : ""} group board--style--sm overflow-hidden bg-gray-100 w-75 min-w-75 border-2 min-h-12 select-none cursor-pointer border-gray-500 shadow-gray-500 text-gray-500 font-medium`}
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

            <div
                className={`flex-col flex h-27.75 py-2 px-2 gap-3 -mt-[100%] ${open && "mt-0"}`}
            >
                <input
                    className="border text-sm border-gray-500 text-gray-700 font-medium p-2 focus:outline-hidden"
                    type="text"
                    autoComplete="off"
                    placeholder="list title goes here..."
                    value={title}
                    ref={titleInputRef}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                />

                <div className="flex gap-1 w-full">
                    <button
                        onClick={handleAddList}
                        className="button--style--dark grid place-items-center w-1/2 font-medium text-sm"
                    >
                        {!addingList ? "+ add" : "adding..."}
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
