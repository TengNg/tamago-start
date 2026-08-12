import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { memo, useMemo, useState, useRef, useCallback, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import Card from "../card/Card";
import useBoardState from "../../hooks/useBoardState";
import CardComposer from "../card/CardComposer";
import ListMenu from "./ListMenu";
import { listApi } from "../../services/api";
import Icon from "../shared/Icon";
import useToast from "../../hooks/useToast";
import { getErrorMessage } from "../../utils/getErrorMessage";

/**
 * @typedef {Object} ListProps
 * @property {number} index
 * @property {List} list
 * @property {Card[]} cards
 */

/**
 * @param {ListProps} props
 */
function List({ index, list, cards }) {
    const {
        boardState,
        updateListField,
        theme,
        debugModeEnabled,
        hasFilter,
        pendingReorder,
    } = useBoardState();

    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useSortable({
            id: list._id,
            disabled:
                pendingReorder.has(list._id) || list._id.includes("temp-"),
            data: {
                type: "list",
                list,
            },
        });

    const [initialListTitle, setInitialListTitle] = useState(list.title);
    const [openCardComposer, setOpenCardComposer] = useState(false);
    const [openListMenu, setOpenListMenu] = useState(false);

    /** @type {React.MutableRefObject<HTMLTextAreaElement | null>} */
    const textAreaRef = useRef(null);

    /** @type {React.MutableRefObject<HTMLDivElement | null>} */
    const titleRef = useRef(null);

    /** @type {React.MutableRefObject<HTMLDivElement | null>} */
    const scrollRef = useRef(null);

    const [scrollState, setScrollState] = useState({
        top: true,
        bottom: true,
    });

    const toast = useToast();

    const copyListMutation = useMutation({
        mutationFn: (/** @type {string} */ id) => {
            const lists = boardState.lists;
            const currentIndex = lists.findIndex((el) => el._id == id);
            if (currentIndex === -1) {
                throw new Error(`couldn't find list with id ${id}`);
            }

            const nextElement =
                index < lists.length - 1 ? lists[index + 1] : null;

            return listApi.copyList(
                id,
                lists[currentIndex]?._id,
                nextElement?._id,
            );
        },
        onError: (err) => {
            const errMsg = getErrorMessage(err);
            toast.error(errMsg);
        },
    });

    /**
     * @param {string} id
     */
    const handleCopyList = async (id) => {
        await copyListMutation.mutateAsync(id);
    };

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
        if (!textAreaRef.current || !titleRef.current) {
            return;
        }

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
            await listApi.updateList(
                list._id,
                "title",
                textAreaRef.current.value,
            );
            setInitialListTitle(textAreaRef.current.value);
        } catch (err) {
            updateListField({
                id: list._id,
                field: "title",
                value: initialListTitle,
            });
            const errMsg = getErrorMessage(err, "Failed to update title");
            toast.error(errMsg);
        }
    };

    /**
     * @param {React.MouseEvent<HTMLDivElement, MouseEvent>} e
     */
    const handleMouseUp = (e) => {
        if (e.button !== 0) return;

        if (textAreaRef.current) {
            textAreaRef.current.classList.remove("hidden");
            textAreaRef.current.classList.add("block");
            textAreaRef.current.focus();
            textAreaRef.current.selectionStart =
                textAreaRef.current.value.length;
        }

        if (titleRef.current) {
            titleRef.current.classList.add("hidden");
        }
    };

    const handleTextAreaChanged = () => {
        const textarea = textAreaRef.current;
        if (textarea) {
            textarea.style.height = "24px";
            textarea.style.height = `${textarea.scrollHeight}px`;
            updateListField({
                id: list._id,
                field: "title",
                value: textarea.value,
            });
        }
    };

    const handleTextAreaOnFocus = () => {
        const textarea = textAreaRef.current;
        if (textarea) {
            textarea.style.height = "24px";
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    };

    const handleTitleInputBlur = () => {
        onInputConfirm();
    };

    /**
     * @param {React.KeyboardEvent<HTMLTextAreaElement>} e
     */
    const handleTextAreaOnEnter = (e) => {
        if (e.key === "Enter") {
            onInputConfirm();
        }
    };

    const handleDeleteList = async () => {
        if (confirm("Are you want to delete this list ?")) {
            try {
                await listApi.deleteList(list._id);
            } catch (err) {
                toast.error("Failed to delete list");
            }
        }
    };

    const cardIds = useMemo(() => {
        return cards.map((c) => c._id);
    }, [cards]);

    /** @type {React.CSSProperties} */
    const style = {
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        cursor: "auto",
        opacity: isDragging ? 0.25 : 1,
    };

    if (list._id.includes("temp-")) {
        return (
            <div className="list__item__wrapper relative select-none w-75 min-w-75 cursor-not-allowed">
                <div
                    className={`${theme.itemTheme == "rounded-sm" ? "rounded-md shadow-[0_4px_0_0]" : "box--style"} list__item relative flex flex-col justify-start w-75 h-25.5 overflow-hidden border-2 select-none border-gray-700 shadow-gray-700`}
                >
                    <div className="w-full flex justify-between items-center px-3 pb-1 pt-2">
                        <p className="w-60 font-medium sm:font-semibold text-gray-700 wrap-break-word whitespace-pre-line">
                            {list.title}
                        </p>
                    </div>

                    <div className="w-full h-full grid place-items-center">
                        <div className="loader-circle mx-auto w-5! h-5!"></div>
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
                    isCopying={copyListMutation.isPending}
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

                {pendingReorder.has(list._id) && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                        <div className="loader-circle w-5! h-5!"></div>
                    </div>
                )}

                <div
                    ref={scrollRef}
                    className="overflow-y-auto min-h-0 flex-1 flex flex-col"
                >
                    {/* scroll shadow top */}
                    <div
                        className={`sticky top-0 left-0 right-0 h-px bg-gray-400 backdrop-blur-[2px] pointer-events-none shrink-0 z-10 transition-opacity duration-150 ${scrollState.top ? "opacity-0" : "opacity-100"}`}
                    />

                    <div className="flex flex-1 flex-col gap-2.5 px-3 pb-1">
                        <SortableContext items={cardIds}>
                            {cards.map((card) => {
                                return <Card key={card._id} card={card} />;
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
                            className="w-full p-2 flex text-gray-400 text-sm group-hover:bg-gray-600/10 font-medium text-start"
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
}

export default memo(List);
