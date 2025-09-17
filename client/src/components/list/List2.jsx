import { useRef, useState } from "react";
import { Draggable } from "react-beautiful-dnd";
import { StrictModeDroppable as Droppable } from "../../helpers/StrictModeDroppable";
import Card from "../card/Card2";
import useBoardState from "../../hooks/useBoardState";
import CardComposer from "../card/CardComposer";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import ListMenu from "./ListMenu";
import { lexorank } from "../../utils/class/Lexorank";

const List = ({ index, list, cards }) => {
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

    const axiosPrivate = useAxiosPrivate();

    const [initialListData, setInitialListData] = useState(list.title);
    const [openCardComposer, setOpenCardComposer] = useState(false);
    const [openListMenu, setOpenListMenu] = useState(false);

    const [processingList, setProcessingList] = useState({
        msg: "loading...",
        processing: false,
    });

    const textAreaRef = useRef(null);
    const titleRef = useRef(null);

    const onInputConfirm = async () => {
        if (textAreaRef.current.value.trim() === "") {
            setListTitle(list._id, initialListData);
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
            setInitialListData(textAreaRef.current.value);
            socket.emit("updateListTitle", {
                listId: list._id,
                title: textAreaRef.current.value,
            });
        } catch (err) {
            console.log(err);
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
                alert("Failed to delete list");
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
                alert("Failed to create a copy of this list");
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
            alert(
                "Failed to create a copy of this list, action cannot be performed at this time, please try again",
            );

            setProcessingList({ msg: "", processing: false });

            setBoardState((prev) => {
                return { ...prev, lists: tempLists };
            });
        }
    };

    return (
        <Draggable key={list._id} draggableId={list._id} index={index}>
            {(provided, _) => (
                <div
                    {...provided.draggableProps}
                    ref={provided.innerRef}
                    className="me-4 relative h-full"
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

                    {!list.collapsed ? (
                        <div
                            className={`
                                        ${theme.itemTheme == "rounded" ? "rounded-md shadow-[0_4px_0_0]" : "shadow-[4px_6px_0_0]"}
                                        list__item flex flex-col justify-start w-[300px] max-h-[100%] overflow-auto border-[2px] select-none pt-2 cursor-pointer border-gray-700 shadow-gray-700
                                      `}
                        >
                            <div
                                {...provided.dragHandleProps}
                                className="relative w-full bg-transparent"
                            >
                                <div
                                    ref={titleRef}
                                    className="sm:w-[240px] w-[180px] font-medium sm:font-semibold text-gray-700 break-words whitespace-pre-line px-3"
                                    onMouseUp={handleMouseUp}
                                >
                                    <p>{list.title}</p>
                                </div>

                                <textarea
                                    className="hidden bg-transparent h-fit sm:w-[240px] w-[180px] focus:outline-none font-medium sm:font-semibold px-3 text-gray-700 leading-normal overflow-y-hidden resize-none"
                                    value={list.title}
                                    ref={textAreaRef}
                                    onFocus={handleTextAreaOnFocus}
                                    onChange={handleTextAreaChanged}
                                    onBlur={handleTitleInputBlur}
                                    onKeyDown={handleTextAreaOnEnter}
                                />

                                <button
                                    className="absolute h-[30px] -top-1 right-3 text-[0.75rem] text-gray-600 font-bold flex items-start"
                                    onClick={() => {
                                        console.log("clicked");
                                        setOpenListMenu((prev) => !prev);
                                    }}
                                >
                                    ...
                                </button>

                                <div className="h-[1.5px] mt-1 mx-3 bg-gray-600"></div>
                            </div>

                            <div className="max-h-full overflow-y-auto px-3">
                                <Droppable droppableId={list._id} type="CARD">
                                    {(provided) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            ignoreContainerClipping={true}
                                        >
                                            <div className="flex flex-col pb-1 items-start justify-start h-full">
                                                {cards.map((card, idx) => {
                                                    return (
                                                        <Card
                                                            key={idx}
                                                            card={card}
                                                            index={idx}
                                                            listIndex={index}
                                                        />
                                                    );
                                                })}
                                                {provided.placeholder}
                                            </div>
                                        </div>
                                    )}
                                </Droppable>

                                {openCardComposer === true && (
                                    <CardComposer
                                        list={list}
                                        open={openCardComposer}
                                        setOpen={setOpenCardComposer}
                                    />
                                )}
                            </div>

                            {openCardComposer === false && (
                                <button
                                    className="flex gap-2 group text-gray-400 mt-2 mx-3 p-2 text-[0.8rem] hover:bg-gray-200 font-medium sm:font-semibold text-start"
                                    onClick={() => setOpenCardComposer(true)}
                                >
                                    <span>+ new card</span>
                                </button>
                            )}

                            {
                                <div className="flex items-center gap-1 ms-auto me-1 text-gray-500 text-[0.65rem] font-medium sm:font-semibold">
                                    {debugModeEnabled.enabled && (
                                        <span>[rank: {list.order}]</span>
                                    )}

                                    <span>{list.cards.length}</span>
                                    {hasFilter && (
                                        <>
                                            <span> </span>
                                            <span>
                                                (found:{" "}
                                                {
                                                    list.cards.filter(
                                                        (card) =>
                                                            !card.hiddenByFilter,
                                                    ).length
                                                }
                                                )
                                            </span>
                                        </>
                                    )}
                                </div>
                            }
                        </div>
                    ) : (
                        <div
                            className={`${theme.itemTheme == "rounded" ? "rounded shadow-[0_3px_0_0]" : "shadow-[3px_4px_0_0]"} h-[300px] w-[4rem] border-[2px] border-gray-700 shadow-gray-700 bg-gray-200/50`}
                        >
                            <div
                                {...provided.dragHandleProps}
                                className="bg-transparent p-2"
                            >
                                <div
                                    className="text-center bg-gray-400 p-2 text-[10px] hover:bg-gray-400/75 grid place-items-center rounded-sm"
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
                    )}
                </div>
            )}
        </Draggable>
    );
};

export default List;
