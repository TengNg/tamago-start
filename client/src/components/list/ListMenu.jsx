import { useRef, useEffect } from "react";
import dateFormatter from "../../utils/dateFormatter";
import useBoardState from "../../hooks/useBoardState";
import Icon from "../shared/Icon";

export default function ListMenu({
    list,
    open,
    setOpen,
    handleDelete,
    handleCopy,
    processingList,
}) {
    const containerRef = useRef();

    const { setListToMove, setOpenMoveListForm, collapseList, theme } =
        useBoardState();

    useEffect(() => {
        containerRef.current.focus();
        const abortController = new AbortController();

        window.addEventListener(
            "keydown",
            (e) => {
                if (e.key === "Escape" && open) {
                    setOpen(false);
                }
            },
            { signal: abortController.signal },
        );

        window.addEventListener(
            "mousedown",
            (e) => {
                if (
                    containerRef.current &&
                    !containerRef.current.contains(e.target) &&
                    collapse
                ) {
                    setOpen(false);
                }
            },
            { signal: abortController.signal },
        );

        return () => {
            abortController.abort();
        };
    }, []);

    const del = () => {
        handleDelete();
    };

    const copy = () => {
        handleCopy(list._id);
    };

    const close = () => {
        setOpen(false);
    };

    const collapse = () => {
        setOpen(false);
        collapseList(list._id);
    };

    const handleOpenMoveListForm = () => {
        setOpenMoveListForm(true);
        setListToMove(list);
        setOpen(false);
    };

    return (
        <div
            ref={containerRef}
            className={`list__menu absolute top-0 left-0 outline-none z-10 border-gray-700 border-[2px] w-full py-2 px-3 ${theme.itemTheme == "rounded" ? "rounded-md" : ""}`}
        >
            <button
                className="absolute right-3 top-2.5 text-gray-600 flex justify-center items-center"
                onClick={() => setOpen(false)}
            >
                <Icon className="w-4 h-4" name="xmark" />
            </button>
            <div className="border-b-[1px] border-b-black pb-2 text-gray-700">
                <div className="text-[12px] sm:text-base">
                    <span className="font-medium">{list.title}</span>
                </div>
                <div className="text-[12px] mt-1 opacity-80">
                    created:{" "}
                    <span className="font-medium">
                        {dateFormatter(list.createdAt, { weekdayFormat: true })}
                    </span>
                </div>

                <div className="text-[12px] mt-1 opacity-80">
                    cards:{" "}
                    <span className="font-medium">{list.cards.length}</span>
                </div>
            </div>

            <div className="flex flex-col gap-3 mt-3">
                <button
                    onClick={collapse}
                    className="text-[14px] sm:text-[0.75rem] text-white bg-indigo-800 px-1 py-2 hover:bg-indigo-700"
                >
                    collapse
                </button>
                <button
                    onClick={copy}
                    className={`${processingList?.processing ? "cursor-not-allowed" : ""} text-[12px] sm:text-[0.75rem] text-white bg-gray-600 px-1 py-2 hover:bg-gray-500`}
                >
                    {processingList.processing ? "copying..." : "copy"}
                </button>
                <button
                    onClick={handleOpenMoveListForm}
                    className="text-[14px] sm:text-[0.75rem] text-white bg-gray-600 px-1 py-2 hover:bg-gray-500"
                >
                    move
                </button>
                <button
                    onClick={del}
                    className="text-[14px] sm:text-[0.75rem] text-white bg-rose-800 px-1 py-2 hover:bg-rose-700"
                >
                    delete
                </button>
            </div>
        </div>
    );
}
