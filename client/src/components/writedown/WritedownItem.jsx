import dateFormatter from "../../utils/dateFormatter";
import Loading from "../ui/Loading";
import Icon from "../shared/Icon";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useSearchParams } from "react-router-dom";
import { useMemo } from "react";

/**
 * @param {{
 *   writedown: Writedown & { isPinning?: boolean },
 *   open: (id: string) => void,
 *   remove: (id: string, isEmpty: boolean) => void,
 *   pin: (id: string) => void,
 * }} props
 */
const WritedownItem = ({ writedown, open, remove, pin }) => {
    const { _id: id, title, content, isPinning, pinned, createdAt } = writedown;

    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useSortable({
            id: writedown._id,
            data: {
                type: "writedown",
                writedown,
            },
        });

    const [searchParams, _] = useSearchParams();

    /** @type {React.CSSProperties} */
    const style = {
        transition: undefined,
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.2 : 1,
        cursor: "auto",
    };

    const hasPinnedFilter = useMemo(() => {
        return searchParams.get("filter") === "pinned";
    }, [searchParams]);

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            style={style}
            className={`${(hasPinnedFilter && pinned) || !hasPinnedFilter ? "flex" : "hidden"} relative flex flex-col w-62.5 h-55 border-2 px-3 pb-3 pt-2 border-gray-700 border-dashed text-gray-700 text-[0.85rem] bg-gray-100/20`}
        >
            <Loading
                loading={isPinning ?? false}
                position={"absolute"}
                displayText="saving..."
                fontSize="0.75rem"
            />

            <div className="flex w-full justify-between items-center border-b border-black pb-2 mb-2 gap-2">
                <button
                    title="pin"
                    className={`${pinned ? "bg-amber-600/40" : "bg-gray-400"} w-2.5 h-2.5 rounded-full`}
                    onClick={() => pin(id)}
                ></button>

                <button
                    {...listeners}
                    title="drag"
                    className="touch-none w-1/2 grid place-items-center text-gray-500 hover hover:bg-gray-400/20"
                >
                    <Icon className="w-4 h-4" name="grip-lines" />
                </button>

                <button
                    title="delete"
                    className="text-gray-400 flex justify-center items-center hover:text-rose-400"
                    onClick={() =>
                        remove(id, content?.length === 0 && title?.length === 0)
                    }
                >
                    <Icon className="w-4 h-4" name="xmark" />
                </button>
            </div>

            <div
                className="group h-full flex flex-col justify-between cursor-pointer"
                onClick={() => open(id)}
            >
                {title ? (
                    <p className="text-sm max-w-50 max-h-25 overflow-hidden text-gray-700 whitespace-pre-wrap cursor-pointer">
                        &#128205;{" "}
                        <span className="group-hover:underline">{title}</span>
                    </p>
                ) : !title && content ? (
                    <p className="text-sm max-w-50 max-h-25 overflow-hidden text-gray-700 whitespace-pre-wrap group-hover:underline cursor-pointer">
                        {content}
                    </p>
                ) : (
                    <div
                        className="p-2 flex justify-center items-center bg-gray-500/20 opacity-45 cursor-pointer"
                        onClick={() => open(id)}
                    >
                        <span className="text-[0.75rem] text-gray-600 font-medium tracking-wider">
                            empty
                        </span>
                    </div>
                )}

                <div className="mt-auto p-2 flex justify-center items-center bg-gray-400">
                    <span className="text-sm text-gray-50 font-medium tracking-wider">
                        {dateFormatter(createdAt, { weekdayFormat: true })}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default WritedownItem;
