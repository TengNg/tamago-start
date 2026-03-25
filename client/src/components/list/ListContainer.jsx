import { useMemo, useState } from "react";
import List from "./List";
import useBoardState from "../../hooks/useBoardState";
import AddList from "./AddList";
import { lexorank } from "../../utils/class/Lexorank";
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    pointerWithin,
} from "@dnd-kit/core";
import {
    SortableContext,
    horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import Card from "../card/Card";
import { useMouseDragScroll } from "../../hooks/useMouseDragScroll";
import useCurrentUserContext from "../../hooks/useCurrentUserContext";
import { axiosPrivate } from "../../api/axios";
import useToast from "../../hooks/useToast";

const ListContainer = ({ openAddList, setOpenAddList }) => {
    const { currentUser } = useCurrentUserContext();

    const { boardState, setBoardState, socket } = useBoardState();
    const [clonedBoardState, setClonedBoardState] = useState(null);

    const [activeList, setActiveList] = useState(undefined);
    const [activeCard, setActiveCard] = useState(undefined);

    const toast = useToast();

    const listContainerRef = useMouseDragScroll();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
    );

    async function handleOnDragEnd(e) {
        setActiveCard(null);
        setActiveList(null);

        const { active, over } = e;
        if (!over) {
            return;
        }

        const activeData = active.data.current;
        const overData = over.data.current;
        const activeType = activeData.type;
        const overType = overData.type;

        if (activeType === "list" && overType === "card") {
            return;
        }

        if (activeType === "list") {
            let overId = "";
            if (overType === "list") {
                overId = over.id;
            } else if (overType === "card") {
                overId = over.data.current.card.listId;
            }

            const srcIndex = lists.findIndex((l) => l._id == active.id);
            const destIndex = lists.findIndex((l) => l._id == overId);
            if (destIndex === srcIndex) {
                return;
            }

            // deep copy, need this when failed to reorder
            const initialLists = structuredClone(boardState.lists);

            const newLists = [...boardState.lists];
            const [removed] = newLists.splice(srcIndex, 1);

            newLists.splice(destIndex, 0, removed);
            let prevRank = newLists[destIndex - 1]?.order;
            let nextRank = newLists[destIndex + 1]?.order;

            let [rank, ok] = lexorank.insert(prevRank, nextRank);

            // failed to reorder
            if (!ok) {
                console.error("failed to reorder item");
                return;
            }

            try {
                setBoardState((prev) => {
                    removed.order = rank;
                    return { ...prev, lists: newLists };
                });

                await axiosPrivate.patch(
                    `/lists/${removed._id}/reorder`,
                    JSON.stringify({
                        rank,
                        sourceIndex: srcIndex,
                        destinationIndex: destIndex,
                    }),
                );

                socket.emit("moveList", {
                    listId: removed._id,
                    fromIndex: srcIndex,
                    toIndex: destIndex,
                });
            } catch (err) {
                const errMsg = err.response.data.message || "Failed to reorder list"
                toast.error(errMsg);
                setBoardState((prev) => {
                    return { ...prev, lists: initialLists };
                });
            }

            return;
        }

        // type card

        // Note: for when user keep moving the card around containers fast
        if (Object.keys(active).length === 0) {
            setBoardState(clonedBoardState);
            return;
        }

        const activeId = active.id;
        const activeListId = activeData.card.listId;

        const activeList = boardState.lists.find((l) => l._id === activeListId);
        const cards = activeList.cards;

        const activeIndex = cards.findIndex((c) => c._id == activeId);

        const prevOrder = cards[activeIndex - 1]?.order;
        const nextOrder = cards[activeIndex + 1]?.order;

        const [rank, ok] = lexorank.insert(prevOrder, nextOrder);
        if (!ok) {
            toast.error("Failed to reorder card. Error: invalid order");
            setBoardState(clonedBoardState);
            return;
        }

        // drag to the same list, and same position
        if (
            activeCard.listId === activeListId &&
            activeCard.srcIndex === activeIndex
        ) {
            return;
        }

        try {
            const response = await axiosPrivate.patch(
                `/cards/${activeId}/reorder`,
                JSON.stringify({
                    rank,
                    listId: activeListId,
                    timestamp: new Date(),
                    oldPos: activeCard.srcIndex
                        ? activeCard.srcIndex + 1
                        : "...",
                    newPos: activeIndex + 1,
                }),
            );

            const newCard = response.data.newCard;
            setBoardState((prev) => {
                const lists = [...prev.lists];
                return {
                    ...prev,
                    lists: lists.map((l) => {
                        if (l._id === activeListId) {
                            return {
                                ...l,
                                cards: l.cards.map((c) => {
                                    return c._id == newCard._id ? newCard : c;
                                }),
                            };
                        }
                        return l;
                    }),
                };
            });

            socket.emit("moveCardToList", {
                oldListId: response.data.oldListId,
                newListId: newCard.listId,
                insertedIndex: activeIndex,
                card: newCard,
            });
        } catch (err) {
            const errMsg = err.response.data.message || "Failed to reorder card"
            toast.error(errMsg);
            setBoardState(clonedBoardState);
        }
    }

    function handleOnDragOver(e) {
        const { active, over } = e;

        const activeId = active.id;
        const overId = over?.id;

        if (overId == null || activeId == overId) {
            return;
        }

        const isActiveTypeCard = active.data.current?.type === "card";
        const isOverACard = over.data.current?.type === "card";

        if (!isActiveTypeCard) {
            return;
        }

        if (isActiveTypeCard && isOverACard) {
            const newLists = [...boardState.lists];

            const activeListId = active.data.current.card.listId;
            const overListId = over.data.current.card.listId;

            if (activeListId === overListId) {
                const currentList = newLists.find(
                    (l) => l._id === activeListId,
                );
                const newCards = [...currentList.cards];

                const activeIndex = newCards.findIndex(
                    (c) => c._id === activeId,
                );
                const overIndex = newCards.findIndex((c) => c._id === overId);

                const [removed] = newCards.splice(activeIndex, 1);
                newCards.splice(overIndex, 0, removed);

                setBoardState((prev) => {
                    return {
                        ...prev,
                        lists: prev.lists.map((l) => {
                            if (l._id === activeListId) {
                                l.cards = newCards;
                            }
                            return l;
                        }),
                    };
                });
            } else {
                const activeList = newLists.find((l) => l._id === activeListId);
                const overList = newLists.find((l) => l._id === overListId);
                if (!activeList || !overList) {
                    return;
                }

                const newActiveCards = [...activeList.cards];
                const newOverCards = [...overList.cards];

                const activeIndex = newActiveCards.findIndex(
                    (c) => c._id === activeId,
                );

                const [removed] = newActiveCards.splice(activeIndex, 1);
                const newCard = { ...removed, listId: overList._id };

                if (newOverCards.length === 0) {
                    newOverCards.push(newCard);
                } else {
                    // NOTE:
                    // this cause the card jumps when using collisionDetection=[closestCorners|closestCenter]
                    // resolved with collisionDetection=pointerWithin
                    const overIndex = newOverCards.findIndex(
                        (c) => c._id === overId,
                    );
                    if (overIndex !== -1) {
                        newOverCards.splice(overIndex, 0, newCard);
                    }
                }

                setBoardState((prev) => {
                    return {
                        ...prev,
                        lists: prev.lists.map((l) => {
                            if (l._id === activeList._id) {
                                l.cards = newActiveCards;
                            } else if (l._id === overList._id) {
                                l.cards = newOverCards;
                            }
                            return l;
                        }),
                    };
                });
            }
            return;
        }

        const isOverAList = over.data.current?.type === "list";
        if (isActiveTypeCard && isOverAList) {
            const newLists = [...boardState.lists];

            const overList = newLists.find((l) => l._id === over.id);
            if (!overList) {
                return;
            }

            const activeListId = active.data.current.card.listId;
            if (activeListId === over.id) {
                return;
            }

            const activeList = [...newLists].find(
                (l) => l._id === activeListId,
            );
            const newActiveCards = [...activeList.cards];
            const newOverCards = [...overList.cards];

            const activeIndex = newActiveCards.findIndex(
                (c) => c._id === active.id,
            );
            const [removed] = newActiveCards.splice(activeIndex, 1);

            removed.listId = overList._id;
            newOverCards.push(removed);

            setBoardState((prev) => {
                return {
                    ...prev,
                    lists: prev.lists.map((l) => {
                        if (l._id === activeListId) {
                            l.cards = newActiveCards;
                        } else if (l._id === overList._id) {
                            l.cards = newOverCards;
                        }
                        return l;
                    }),
                };
            });
        }
    }

    function handleOnDragStart(e) {
        setActiveCard(null);
        setActiveList(null);
        setClonedBoardState(structuredClone(boardState));

        if (e.active.data.current?.type === "list") {
            setActiveList(e.active.data.current.list);
            return;
        }
        if (e.active.data.current?.type === "card") {
            const srcList = boardState.lists.find((list) => {
                return list._id === e.active.data.current.card.listId;
            });
            const srcIndex =
                srcList?.cards.findIndex((c) => {
                    return c._id === e.active.id;
                }) ?? -1;
            setActiveCard({
                ...e.active.data.current.card,
                srcIndex,
            });
            return;
        }
    }

    function handleOnDragCancel() {
        if (clonedBoardState) {
            setClonedBoardState(clonedBoardState);
            return;
        }

        setActiveCard(null);
        setActiveList(null);
        setClonedBoardState(null);
    }

    const lists = useMemo(() => {
        return boardState.lists || [];
    }, [boardState.lists]);

    const listIds = useMemo(() => {
        return lists.map((list) => list._id);
    }, [lists]);

    return (
        <DndContext
            collisionDetection={pointerWithin}
            onDragEnd={handleOnDragEnd}
            onDragStart={handleOnDragStart}
            onDragOver={handleOnDragOver}
            onDragCancel={handleOnDragCancel}
            sensors={sensors}
        >
            <div
                id="list-container"
                ref={listContainerRef}
                className="flex justify-start items-start gap-4 px-4 pb-4 overflow-y-auto"
            >
                <SortableContext
                    items={listIds}
                    strategy={horizontalListSortingStrategy}
                >
                    {lists.map((list, index) => (
                        <List
                            key={list._id}
                            index={index}
                            list={list}
                            cards={list.cards || []}
                        />
                    ))}
                </SortableContext>
                <AddList open={openAddList} setOpen={setOpenAddList} />
            </div>

            {createPortal(
                <DragOverlay>
                    {activeList && (
                        <List list={activeList} cards={activeList.cards} />
                    )}
                    {activeCard && <Card card={activeCard} />}
                </DragOverlay>,
                document.getElementById("root"),
            )}
        </DndContext>
    );
};

export default ListContainer;
