import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useState, useRef } from "react";
import Card from "../card/Card";
import useBoardState from "../../hooks/useBoardState";
import CardComposer from "../card/CardComposer";
import ListMenu from "./ListMenu";
import { lexorank } from "../../utils/class/Lexorank";
import { axiosPrivate } from "../../api/axios";
import Icon from "../shared/Icon";
import useToast from "../../hooks/useToast";

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
        setBoardState,
        setListTitle,
        deleteList,
        collapseList,
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

    const toast = useToast();

    const onInputConfirm = async () => {
        if (textAreaRef.current.value.trim() === initialListTitle) {
            return;
        }

        if (textAreaRef.current.value.trim() === "") {
            setListTitle(list._id, initialListTitle);
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
            socket.emit("updateListTitle", {
                listId: list._id,
                title: textAreaRef.current.value,
            });
        } catch (err) {
            setListTitle(list._id, initialListTitle);
            const errMsg = err.response?.data?.message || "Failed to update title";
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
        setListTitle(list._id, textAreaRef.current.value);
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
                socket.emit("deleteList", list._id);
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
                toast.error("Failed to create a copy of this list");
                return;
            }

            const response = await axiosPrivate.post(
                `/lists/copy/${id}`,
                JSON.stringify({ rank }),
            );
            const newList = response.data.list;
            const newCards = response.data.cards;
            newList.cards = newCards;

            lists.splice(index + 1, 0, newList);

            setBoardState((prev) => {
                return { ...prev, lists };
            });

            setProcessingList({ msg: "", processing: false });

            socket.emit("updateLists", lists);
        } catch (err) {
            toast.error(
                "Failed to create a copy of this list, action cannot be performed at this time, please try again",
            );

            setProcessingList({ msg: "", processing: false });

            setBoardState((prev) => {
                return { ...prev, lists: tempLists };
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
                className="select-none w-[4rem] h-[20rem] bg-transparent touch-none"
            >
                <div
                    className={`list__item ${theme.itemTheme == "rounded" ? "rounded shadow-[0_3px_0_0]" : "shadow-[3px_4px_0_0]"} border-[2px] border-gray-700 shadow-gray-700 p-2 relative`}
                >
                    <div
                        className="text-center bg-gray-400 p-2 text-[10px] hover:bg-gray-400/75 grid place-items-center rounded-sm cursor-pointer"
                        onClick={() => {
                            collapseList(list._id, false);
                        }}
                    >
                        <div className="w-[10px] h-[10px] rounded-full bg-gray-200"></div>
                    </div>
                    <div
                        className="font-medium sm:font-semibold text-gray-700 whitespace-nowrap px-3 h-[250px]"
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
            className="list__item__wrapper relative select-none w-[300px] min-w-[300px]"
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
                    ${theme.itemTheme == "rounded" ? "rounded-md shadow-[0_4px_0_0]" : "shadow-[4px_6px_0_0]"}
                    list__item relative flex flex-col justify-start w-[300px] max-h-[100%] overflow-auto border-[2px] select-none pt-2 border-gray-700 shadow-gray-700
                `}
            >
                <div
                    {...listeners}
                    className="w-full bg-transparent flex justify-between items-center px-3 cursor-pointer touch-none"
                >
                    <div
                        ref={titleRef}
                        className="w-[240px] font-medium sm:font-semibold text-gray-700 break-words whitespace-pre-line"
                        onMouseUp={handleMouseUp}
                    >
                        <p>{list.title}</p>
                    </div>

                    <textarea
                        className="hidden bg-transparent h-fit w-[240px] focus:outline-none font-medium sm:font-semibold text-gray-700 leading-normal overflow-y-hidden resize-none"
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

                <div className="h-[1px] mt-1 mb-2 mx-3 bg-gray-600"></div>

                <div className="max-h-full overflow-y-auto flex flex-col">
                    <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-1">
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

                    {openCardComposer === false && (
                        <div className="mx-3 mt-2 mb-3 group">
                            <button
                                className="w-full py-2 px-4 flex text-gray-400 text-sm group-hover:bg-gray-600/10 font-medium rounded-sm text-start"
                                onClick={() => setOpenCardComposer(true)}
                            >
                                <span>+ new card</span>
                            </button>
                        </div>
                    )}
                </div>

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
                                        list.cards.filter((card) => {
                                            return !card.hiddenByFilter;
                                        }).length
                                    }
                                    /{list.cards.length}
                                </span>
                            )}
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default List;
