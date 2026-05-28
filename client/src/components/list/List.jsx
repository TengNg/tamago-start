import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import Card from "../card/Card";
import useBoardState from "../../hooks/useBoardState";
import CardComposer from "../card/CardComposer";
import ListMenu from "./ListMenu";
import { lexorank } from "../../lib/lexorank";
import { axiosPrivate } from "../../api/axios";
import Icon from "../shared/Icon";
import useToast from "../../hooks/useToast";
import { BOARD_ACTIONS } from "../../state/boardActionTypes";
import { SOCKET_EVENTS } from "@shared/socket-events.js";

const List = ({ index, list, cards }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useSortable({
            id: list._id,
            data: {
                type: "list",
                list,
            },
        });

    const {
        boardState,
        dispatch,
        updateListField,
        deleteList,
        theme,
        debugModeEnabled,
        hasFilter,
        socket,
    } = useBoardState();

    const [initialListTitle, setInitialListTitle] = useState(list.title);
    const [openCardComposer, setOpenCardComposer] = useState(false);
    const [openListMenu, setOpenListMenu] = useState(false);

    const [processingList, setProcessingList] = useState({
        msg: "loading...",
        processing: false,
    });

    const textAreaRef = useRef(null);
    const titleRef = useRef(null);

    const scrollRef = useRef(null);
    const [scrollState, setScrollState] = useState({
        top: true,
        bottom: true,
    });

    const toast = useToast();

    const handleScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const atTop = el.scrollTop <= 0;
        const hasOverflow = el.scrollHeight > el.clientHeight;
        const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
        setScrollState((prev) => {
            const next = {
                top: atTop,
                bottom: !hasOverflow || atBottom,
            };
            return prev.top !== next.top || prev.bottom !== next.bottom
                ? next
                : prev;
        });
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();
        return () => el.removeEventListener("scroll", handleScroll);
    }, [handleScroll]);

    const onInputConfirm = async () => {
        if (textAreaRef.current.value.trim() === initialListTitle) {
            return;
        }

        if (textAreaRef.current.value.trim() === "") {
            updateListField({
                id: list._id,
                field: "title",
                value: initialListTitle,
            });
            return;
        }

        textAreaRef.current.classList.remove("block");
        textAreaRef.current.classList.add("hidden");
        titleRef.current.classList.remove("hidden");

        try {
            await axiosPrivate.patch(
                `/lists/${list._id}/new-title`,
                JSON.stringify({ title: textAreaRef.current.value }),
            );
            setInitialListTitle(textAreaRef.current.value);
            socket.emit(SOCKET_EVENTS.LIST_UPDATE_TITLE, {
                listId: list._id,
                title: textAreaRef.current.value,
            });
        } catch (err) {
            updateListField({
                id: list._id,
                field: "title",
                value: initialListTitle,
            });
            const errMsg =
                err.response?.data?.message || "Failed to update title";
            toast.error(errMsg);
        }
    };

    const handleMouseUp = (e) => {
        if (e.button !== 0) return;

        textAreaRef.current.classList.remove("hidden");
        textAreaRef.current.classList.add("block");
        titleRef.current.classList.add("hidden");
        textAreaRef.current.focus();
        textAreaRef.current.selectionStart = textAreaRef.current.value.length;
    };

    const handleTextAreaChanged = () => {
        const textarea = textAreaRef.current;
        textarea.style.height = "24px";
        textarea.style.height = `${textarea.scrollHeight}px`;
        updateListField({
            id: list._id,
            field: "title",
            value: textAreaRef.current.value,
        });
    };

    const handleTextAreaOnFocus = () => {
        const textarea = textAreaRef.current;
        textarea.style.height = "24px";
        textarea.style.height = `${textarea.scrollHeight}px`;
    };

    const handleTitleInputBlur = () => {
        onInputConfirm();
    };

    const handleTextAreaOnEnter = (e) => {
        if (e.key === "Enter") {
            onInputConfirm();
        }
    };

    const handleDeleteList = async () => {
        if (confirm("Are you want to delete this list ?")) {
            try {
                await axiosPrivate.delete(`/lists/${list._id}`);
                deleteList(list._id);
                socket.emit(SOCKET_EVENTS.LIST_DELETE, list._id);
            } catch (err) {
                toast.error("Failed to delete list");
            }
        }
    };

    const handleCopyList = async (id) => {
        const lists = boardState.lists;
        const tempLists = [...boardState.lists];

        try {
            setProcessingList({
                msg: "copying...",
                processing: true,
            });

            const currentIndex = lists.indexOf(
                lists.find((el) => el._id == id),
            );
            const nextElement =
                index < lists.length - 1 ? lists[index + 1] : null;

            const [rank, ok] = lexorank.insert(
                lists[currentIndex]?.order,
                nextElement?.order,
            );

            if (!ok) {
                toast.error("Failed to duplicate, rank is not valid");
                return;
            }

            const response = await axiosPrivate.post(
                `/lists/copy/${id}`,
                JSON.stringify({ rank }),
            );
            const newList = response.data.list;
            const newCards = response.data.cards;
            newCards.sort((a, b) => (a.order > b.order ? 1 : -1));
            lists.splice(index + 1, 0, newList);

            dispatch({
                type: BOARD_ACTIONS.SET_STATE,
                payload: {
                    data: {
                        ...boardState,
                        lists,
                        cards: {
                            ...boardState.cards,
                            [newList._id]: newCards,
                        },
                    },
                },
            });

            setProcessingList({ msg: "", processing: false });

            socket.emit(SOCKET_EVENTS.LIST_UPDATE_ALL, lists);
        } catch (err) {
            const errMsg = err.response?.data?.message || err.message;
            toast.error(errMsg);

            setProcessingList({ msg: "", processing: false });

            dispatch({
                type: BOARD_ACTIONS.SET_LISTS,
                payload: { lists: tempLists },
            });
        }
    };

    const cardIds = useMemo(() => {
        return cards.map((c) => c._id);
    }, [cards]);

    const style = {
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        transition: null,
        cursor: "auto",
        opacity: isDragging ? 0.25 : 1,
    };

    if (list.collapsed) {
        return (
            <div
                ref={setNodeRef}
                {...attributes}
                {...listeners}
                style={style}
                className="select-none w-16 h-80 bg-transparent touch-none"
            >
                <div
                    className={`list__item ${theme.itemTheme == "rounded-sm" ? "rounded-sm shadow-[0_3px_0_0]" : "shadow-[3px_4px_0_0]"} border-2 border-gray-700 shadow-gray-700 p-2 relative`}
                >
                    <div
                        className="text-center bg-gray-400 p-2 text-[10px] hover:bg-gray-400/75 grid place-items-center cursor-pointer"
                        onClick={() => {
                            updateListField({
                                id: list._id,
                                field: "collapsed",
                                value: false,
                            });
                        }}
                    >
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div>
                    </div>
                    <div
                        className="font-medium sm:font-semibold text-gray-700 whitespace-nowrap px-3 h-62.5"
                        style={{
                            transform: "rotate(-90deg)",
                            transformOrigin: "135px 50%",
                        }}
                    >
                        {list.title.length > 20
                            ? list.title.slice(0, 20) + "..."
                            : list.title}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            style={style}
            className="list__item__wrapper relative select-none w-75 min-w-75"
        >
            {openListMenu && (
                <ListMenu
                    list={list}
                    open={openListMenu}
                    setOpen={setOpenListMenu}
                    handleDelete={handleDeleteList}
                    handleCopy={handleCopyList}
                    processingList={processingList}
                />
            )}

            <div
                className={`
                    ${theme.itemTheme == "rounded-sm" ? "rounded-md shadow-[0_4px_0_0]" : "box--style"}
                    list__item relative flex flex-col justify-start w-75 max-h-full overflow-hidden border-2 select-none pt-2 border-gray-700 shadow-gray-700
                `}
            >
                <div
                    {...listeners}
                    className="w-full bg-transparent flex justify-between items-center px-3 pb-1 cursor-pointer touch-none"
                >
                    <div
                        ref={titleRef}
                        className="w-60 font-medium sm:font-semibold text-gray-700 wrap-break-word whitespace-pre-line"
                        onMouseUp={handleMouseUp}
                    >
                        <p>{list.title}</p>
                    </div>

                    <textarea
                        className="hidden bg-transparent h-fit w-60 focus:outline-hidden font-medium sm:font-semibold text-gray-700 leading-normal overflow-y-hidden resize-none"
                        value={list.title}
                        ref={textAreaRef}
                        onFocus={handleTextAreaOnFocus}
                        onChange={handleTextAreaChanged}
                        onBlur={handleTitleInputBlur}
                        onKeyDown={handleTextAreaOnEnter}
                    />

                    <button
                        className="text-sm text-gray-600 font-bold text-center rotate-180 mb-auto"
                        onClick={() => {
                            setOpenListMenu((prev) => !prev);
                        }}
                    >
                        <Icon name="three-dots" />
                    </button>
                </div>

                <div
                    ref={scrollRef}
                    className="overflow-y-auto min-h-0 flex-1 flex flex-col"
                >
                    {/* scroll shadow top */}
                    <div
                        className={`sticky top-0 left-0 right-0 h-px bg-gray-400 backdrop-blur-[2px] pointer-events-none shrink-0 z-10 transition-opacity duration-150 ${scrollState.top ? "opacity-0" : "opacity-100"}`}
                    />

                    <div className="flex flex-1 flex-col gap-2 px-3">
                        <SortableContext items={cardIds}>
                            {cards.map((card) => {
                                return (
                                    <Card
                                        key={card._id}
                                        id={card._id}
                                        card={card}
                                    />
                                );
                            })}
                        </SortableContext>

                        {openCardComposer && (
                            <CardComposer
                                list={list}
                                open={openCardComposer}
                                setOpen={setOpenCardComposer}
                            />
                        )}
                    </div>

                    {/* scroll shadow bottom */}
                    <div
                        className={`sticky bottom-0 left-0 right-0 h-px bg-gray-400 backdrop-blur-[2px] pointer-events-none shrink-0 z-10 transition-opacity duration-150 ${scrollState.bottom ? "opacity-0" : "opacity-100"}`}
                    />
                </div>

                {!openCardComposer && (
                    <div className="mx-3 mt-2 mb-3 group">
                        <button
                            className="w-full py-2 px-4 flex text-gray-400 text-sm group-hover:bg-gray-600/10 font-medium text-start"
                            onClick={() => setOpenCardComposer(true)}
                        >
                            <span>+ new card</span>
                        </button>
                    </div>
                )}

                {debugModeEnabled.enabled ||
                    (hasFilter && (
                        <div className="flex items-center gap-1 ms-auto me-3 text-gray-500 text-[0.65rem] font-medium sm:font-semibold">
                            {debugModeEnabled.enabled && (
                                <span>[rank: {list.order}]</span>
                            )}

                            {hasFilter && (
                                <span>
                                    found:
                                    {
                                        boardState.cards[list._id].filter(
                                            (card) => {
                                                return !card.hiddenByFilter;
                                            },
                                        ).length
                                    }
                                    /{boardState.cards[list._id].length}
                                </span>
                            )}
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default List;
