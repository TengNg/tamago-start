import { useSortable } from "@dnd-kit/sortable";
import useBoardState from "../../hooks/useBoardState";
import dateFormatter, { dateToCompare } from "../../utils/dateFormatter";
import PRIORITY_LEVELS from "../../data/priorityLevels";
import { useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Icon from "../shared/Icon";
import Loading from "../ui/Loading";

export default function Card({ card }) {
    const cardRef = useRef();
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
        boxShadow: `${card.highlight == null ? "0 3px 0 0 #4b5563" : `0 3px 0 0 ${card.highlight}`}`,
        borderColor: `${card.highlight == null ? "#4b5563" : `${card.highlight}`}`,
        opacity: isDragging ? 0.25 : 1,
    };

    const handleOpenQuickEditor = (e) => {
        e.stopPropagation();
        if (cardRef) {
            const rect = cardRef.current.getBoundingClientRect();
            const top = rect.bottom + window.scrollY;
            const left = rect.left + window.scrollX;
            const width = rect.width;
            const height = rect.height;

            setOpenedCardQuickEditor({
                open: true,
                card: card,
                attribute: { top, left, width, height },
            });

            setFocusedCard({
                id: card._id,
                listId: card.listId,
                focused: false,
            });
        }
    };

    const handleOpenCardDetail = () => {
        searchParams.set("card", card._id);
        setSearchParams(searchParams, { replace: true });
        setFocusedCard({ id: card._id, listId: card.listId, focused: true });
    };

    if (card.onLoading === true) {
        return (
            <div
                className={`card__item ${card.hiddenByFilter && "hidden"} relative d-flex justify-center items-center text-[0.75rem] text-gray-500 w-full h-[110px] border-[2px] border-b-[4px] border-gray-600 px-2 py-4 flex flex-col shadow-gray-600 cursor-not-allowed`}
            >
                <p className="w-full h-full bg-inherit font-medium text-gray-600 py-1 px-2 focus:outline-none text-sm break-words whitespace-pre-line">
                    {card.title}
                </p>

                <Loading
                    loading={true}
                    position={"absolute"}
                    displayText={"creating new card..."}
                    fontSize={"0.75rem"}
                    zIndex={10}
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
            className={`card__item
                ${focusedCard?.id === card._id && focusedCard?.focused ? "focused" : ""}
                ${card.hiddenByFilter ? "hidden" : ""}
                ${theme.itemTheme == "rounded" ? "rounded" : ""}
                ${isLargeScreen ? "touch-none" : ""}
                ${dateToCompare(card?.dueDate) ? "past__due__card" : ""}
                relative select-none w-full group border-[2px] border-gray-600 p-4 flex flex-col gap-2
                shadow-[0_2px_0_0] shadow-gray-600 hover:shadow-[0_4px_0_0]
            `}
            onKeyDown={(e) => {
                if (e.key == "Enter") {
                    e.preventDefault();
                    handleOpenCardDetail();
                    return;
                }
                if (e.key == "q") {
                    e.preventDefault();
                    handleOpenQuickEditor(e);
                    return;
                }
            }}
            onContextMenu={(e) => {
                e.preventDefault();
                handleOpenQuickEditor(e);
            }}
            onClick={handleOpenCardDetail}
        >
            <p className="w-full h-full bg-transparent font-medium text-gray-700 focus:outline-none text-sm break-words whitespace-pre-line">
                {card.title}
            </p>

            {card?.priorityLevel && card?.priorityLevel != "none" && (
                <div className="h-1 flex gap-[2px] items-center">
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
                <div className="h-1 flex gap-[2px] items-center">
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

            <div className="flex flex-col gap-1">
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
                        <span className="text-red-600">error</span>
                    )}
                </div>

                {card?.dueDate && (
                    <div className="text-[12px] text-gray-700 font-medium">
                        due date:{" "}
                        {dateFormatter(card?.dueDate, {
                            weekdayFormat: true,
                        })}
                    </div>
                )}

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
