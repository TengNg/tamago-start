import { useSortable } from "@dnd-kit/sortable";
import useBoardState from "../../hooks/useBoardState";
import dateFormatter, { dateToCompare } from "../../utils/dateFormatter";
import PRIORITY_LEVELS from "../../constants/priorityLevels";
import { useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Icon from "../shared/Icon";
import Loading from "../ui/Loading";

/**
 * @param {{ card: Card }} props
 */
export default function Card({ card }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const {
        setOpenedCardQuickEditor,
        focusedCard,
        setFocusedCard,
        theme,
        debugModeEnabled,
        isLargeScreen,
    } = useBoardState();

    const { attributes, listeners, isDragging, setNodeRef } = useSortable({
        id: card._id,
        data: {
            type: "card",
            card,
        },
    });

    const style = {
        borderColor: `${card.highlight == null ? "#4b5563" : `${card.highlight}`}`,
        boxShadow: `0 2px 0 ${card.highlight ?? "#4b5563"}`,
        opacity: isDragging ? 0.25 : 1,
    };

    /** @type {React.MutableRefObject<HTMLDivElement | null>} */
    const cardRef = useRef(null);

    /**
     * @param {React.MouseEvent<HTMLDivElement | HTMLButtonElement>} e
     */
    const handleOpenQuickEditor = (e) => {
        e.stopPropagation();

        if (cardRef.current) {
            const rect = cardRef.current.getBoundingClientRect();
            const top = rect.bottom + window.scrollY;
            const left = rect.left + window.scrollX;
            const width = rect.width;
            const height = rect.height;

            setOpenedCardQuickEditor({
                card,
                attribute: { top, left, width, height },
            });

            setFocusedCard({
                _id: card._id,
                listId: card.listId,
                focused: false,
            });
        }
    };

    const handleOpenCardDetail = () => {
        searchParams.set("card", card._id);
        setSearchParams(searchParams, { replace: true });
        setFocusedCard({ _id: card._id, listId: card.listId, focused: true });
    };

    if (card._id.includes("temp-")) {
        return (
            <div
                className={`card__item relative d-flex justify-center items-center text-[0.75rem] text-gray-500 w-full h-27.5 border-2 border-b-4 border-gray-600 px-2 py-4 flex flex-col shadow-gray-600 cursor-not-allowed`}
            >
                <p className="w-full h-full bg-inherit font-medium text-gray-600 py-1 px-2 focus:outline-hidden text-sm wrap-break-word whitespace-pre-line">
                    {card.title}
                </p>

                <Loading
                    loading={true}
                    position={"absolute"}
                    displayText={"creating new card..."}
                    fontSize={"0.75rem"}
                    zIndex={"10"}
                />
            </div>
        );
    }

    return (
        <div
            ref={(element) => {
                setNodeRef(element);
                cardRef.current = element;
            }}
            style={style}
            {...attributes}
            {...(isLargeScreen ? listeners : {})}
            data-card-item={`${card._id}-${card.listId}`}
            className={`card__item
                ${focusedCard?._id === card._id && focusedCard?.focused ? "focused" : ""}
                ${card.hiddenByFilter ? "hidden" : ""}
                ${theme.itemTheme == "rounded-sm" ? "rounded-sm" : ""}
                ${isLargeScreen ? "touch-none" : ""}
                ${dateToCompare(card?.dueDate) ? "past__due__card" : ""}
                relative select-none w-full group border-2 border-b-3 border-gray-600 p-4 flex flex-col gap-2 cursor-pointer scroll-mx-7
                translate-y-0 hover:translate-y-0.5 hover:shadow-none!
            `}
            onKeyDown={(e) => {
                if (e.key == "Enter") {
                    e.preventDefault();
                    handleOpenCardDetail();
                    return;
                }
            }}
            onContextMenu={(e) => {
                e.preventDefault();
                handleOpenQuickEditor(e);
            }}
            onClick={handleOpenCardDetail}
        >
            <p className="w-full h-full bg-transparent font-medium text-gray-700 focus:outline-hidden text-sm wrap-break-word whitespace-pre-line">
                {card.title}
            </p>

            {card?.priorityLevel && card?.priorityLevel != "none" && (
                <div className="h-1 flex gap-0.5 items-center">
                    <div
                        style={{
                            backgroundColor:
                                PRIORITY_LEVELS[card.priorityLevel].color,
                        }}
                        className="w-1 h-1"
                    ></div>
                    <div
                        style={{
                            backgroundColor:
                                PRIORITY_LEVELS[card.priorityLevel].color,
                        }}
                        className="w-8 h-1"
                    ></div>
                    <div
                        style={{
                            backgroundColor:
                                PRIORITY_LEVELS[card.priorityLevel].color,
                        }}
                        className="w-8 h-1"
                    ></div>
                    {card.priorityLevel === "critical" && (
                        <div
                            style={{
                                backgroundColor:
                                    PRIORITY_LEVELS[card.priorityLevel].color,
                            }}
                            className="w-8 h-1"
                        ></div>
                    )}
                </div>
            )}

            {card.priorityLevel === "critical" && (
                <div className="absolute bottom-0.5 right-1.5 text-lg font-bold text-red-800">
                    !
                </div>
            )}

            {card.verified && (
                <div className="h-1 flex gap-0.5 items-center">
                    <div className="bg-green-800/60 w-1 h-1"></div>
                    <div className="bg-green-800/60 w-8 h-1"></div>
                    <div className="bg-green-800/60 w-8 h-1"></div>
                </div>
            )}

            {card.owner && (
                <div className="flex items-center gap-1 text-[12px] w-fit max-w-full font-medium text-gray-700 overflow-hidden whitespace-nowrap text-ellipsis">
                    <Icon
                        name="profile"
                        className="text-gray-600 w-3.5 h-3.5"
                    />
                    {card.owner}
                </div>
            )}

            {card.description && (
                <div className="flex flex-col gap-0.5 w-fit max-w-full">
                    <div className="h-0.5 w-4 bg-gray-500"></div>
                    <div className="h-0.5 w-4 bg-gray-500"></div>
                    <div className="h-0.5 w-3 bg-gray-500"></div>
                </div>
            )}

            <div className="flex flex-col gap-1">
                {card?.dueDate && (
                    <div className="text-[12px] text-gray-700 font-medium">
                        due:{" "}
                        {dateFormatter(card.dueDate, {
                            weekdayFormat: true,
                            withTime: false,
                        })}
                    </div>
                )}

                <div className="text-[12px] text-gray-700 font-medium">
                    {card.createdAt ? (
                        <span>
                            created:{" "}
                            {dateFormatter(card.createdAt, {
                                weekdayFormat: true,
                                withTime: false,
                            })}
                        </span>
                    ) : (
                        <span className="text-[12px] text-red-600">error</span>
                    )}
                </div>

                {debugModeEnabled.enabled && (
                    <div className="text-[12px] text-gray-700 font-medium">
                        rank: {card.order}
                    </div>
                )}
            </div>

            {isLargeScreen && (
                <button
                    onClick={(e) => {
                        handleOpenQuickEditor(e);
                    }}
                    className="absolute right-1 top-1 font-bold text-[12px] text-transparent hover:bg-gray-500/10 group-hover:text-gray-600 flex justify-center items-center py-0.5 px-1.5"
                >
                    <Icon name="three-dots" width="16" height="16" />
                </button>
            )}

            {!isLargeScreen && (
                <button
                    {...listeners}
                    className="touch-none absolute right-2 top-1 font-bold opacity-90"
                    style={{
                        color: `${card.highlight == null ? "#4b5563" : `${card.highlight}`}`,
                    }}
                >
                    <Icon name="grip-lines" className="w-5 h-5" />
                </button>
            )}
        </div>
    );
}
