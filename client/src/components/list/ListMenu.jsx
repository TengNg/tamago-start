import { useContext, useRef } from "react";
import dateFormatter from "../../utils/dateFormatter";
import useBoardState from "../../hooks/useBoardState";
import Icon from "../shared/Icon";
import useClickOutside from "../../hooks/useClickOutside";
import { useKeybind } from "../../hooks/useKeybind";
import ModalStackContext from "../../context/ModalStackContext";

/**
 * @typedef {Object} ListMenuProps
 * @property {List} list
 * @property {boolean} open
 * @property {React.Dispatch<React.SetStateAction<boolean>>} setOpen
 * @property {() => Promise<void>} handleDelete
 * @property {(id: string) => void} handleCopy
 * @property {boolean} isCopying
 */

/**
 * @param {ListMenuProps} props
 */
export default function ListMenu({
    list,
    open,
    setOpen,
    handleDelete,
    handleCopy,
    isCopying,
}) {
    const {
        boardState,
        setListToMove,
        setOpenMoveListForm,
        updateListField,
        theme,
    } = useBoardState();

    const { isAnyModalOpen } = useContext(ModalStackContext);

    /** @type {React.MutableRefObject<HTMLDivElement | null>} */
    const containerRef = useRef(null);

    useKeybind("esc", () => {
        if (open && !isAnyModalOpen) setOpen(false);
    });

    useClickOutside(containerRef, () => {
        if (open && !isAnyModalOpen) setOpen(false);
    });

    const del = () => {
        handleDelete();
    };

    const duplicate = () => {
        handleCopy(list._id);
    };

    const close = () => {
        setOpen(false);
    };

    const handleOpenMoveListForm = () => {
        setOpenMoveListForm(true);
        setListToMove(list);
        setOpen(false);
    };

    return (
        <div
            ref={containerRef}
            className={`list__menu absolute top-0 left-0 outline-hidden z-11 border-gray-700 border-2 border-b-5 w-full py-2 px-3 ${theme.itemTheme == "rounded-sm" ? "rounded-md" : ""}`}
        >
            <button
                className="absolute right-3 top-2.5 text-gray-600 flex justify-center items-center"
                onClick={close}
            >
                <Icon className="w-4 h-4" name="xmark" />
            </button>
            <div className="border-b border-b-black pb-2 text-gray-700">
                <div className="text-[12px] sm:text-base font-medium wrap-break-word whitespace-pre-line pe-8">
                    {list.title}
                </div>
                <div className="text-[12px] mt-1 opacity-80">
                    created:{" "}
                    <span className="font-medium">
                        {dateFormatter(list.createdAt, { weekdayFormat: true })}
                    </span>
                </div>

                <div className="text-[12px] mt-1 opacity-80">
                    cards:{" "}
                    <span className="font-medium">
                        {boardState.cards[list._id].length}
                    </span>
                </div>
            </div>

            <div className="flex flex-col gap-2 mt-3 mb-1">
                <button
                    onClick={duplicate}
                    className={`${isCopying ? "cursor-not-allowed" : ""} text-[12px] sm:text-[0.75rem] text-white bg-gray-600 px-1 py-2 hover:bg-gray-500`}
                >
                    {isCopying ? "duplicating..." : "duplicate"}
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
