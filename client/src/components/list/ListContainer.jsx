import { useMemo, useState } from "react";
import List from "./List";
import useBoardState from "../../hooks/useBoardState";
import AddList from "./AddList";
import { lexorank } from "../../lib/lexorank";
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
import { listApi, cardApi } from "../../services/api";
import useToast from "../../hooks/useToast";
import { useKeybind } from "../../hooks/useKeybind";
import { kb } from "../../constants/keybinds";
import { BOARD_ACTIONS } from "../../state/boardActionTypes";
import { SOCKET_EVENTS } from "@shared/socket-events.js";
import { getErrorMessage } from "../../utils/getErrorMessage";

const ListContainer = () => {
    const { boardState, dispatch, setOpenAddList, socket } = useBoardState();

    const [clonedBoardState, setClonedBoardState] = useState(
        /** @type {BoardState | null} */ (null),
    );

    const [activeList, setActiveList] = useState(
        /** @type {List | null} */ (null),
    );

    const [activeCard, setActiveCard] = useState(
        /** @type {(Card & { srcIndex: number }) | null} */ (null),
    );

    const toast = useToast();

    const { ref: listContainerRef, scrollEl } = useMouseDragScroll();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
    );

    useKeybind(
        kb.scrollLeft,
        () => {
            scrollEl.current?.scrollBy({
                left: -400,
                behavior: "smooth",
            });
        },
        { ignoreInInputs: true, preventDefault: false },
    );

    useKeybind(
        kb.scrollRight,
        () => {
            scrollEl.current?.scrollBy({
                left: 400,
                behavior: "smooth",
            });
        },
        { ignoreInInputs: true, preventDefault: false },
    );

    useKeybind(kb.openAddList, () => {
        setOpenAddList((prev) => !prev);
    });

    /** @param {import("@dnd-kit/core").DragEndEvent} e */
    async function handleOnDragEnd(e) {
        setActiveCard(null);
        setActiveList(null);

        const { active, over } = e;
        if (!over) {
            return;
        }

        const activeData = active.data.current;
        const overData = over.data.current;
        if (!activeData || !overData) return;
        const activeType = activeData.type;
        const overType = overData.type;

        if (activeType === "list") {
            let overId = "";
            if (overType === "list") {
                overId = /** @type {string} */ (over.id);
            } else if (overType === "card") {
                overId = /** @type {string} */ (over.data.current?.card.listId);
            }

            const srcIndex = boardState.lists.findIndex(
                (l) => l._id == active.id,
            );
            const destIndex = boardState.lists.findIndex(
                (l) => l._id == overId,
            );

            if (destIndex === srcIndex) {
                return;
            }

            const newLists = [...boardState.lists];
            const [removed] = newLists.splice(srcIndex, 1);
            newLists.splice(destIndex, 0, removed);

            let prevRank = newLists[destIndex - 1]?.order;
            let nextRank = newLists[destIndex + 1]?.order;

            let [rank, ok] = lexorank.insert(prevRank, nextRank);
            if (!ok) {
                toast.error("Failed to reorder list, rank is invalid");
                return;
            }

            removed.order = rank;

            try {
                dispatch({
                    type: BOARD_ACTIONS.SET_LISTS,
                    payload: { lists: newLists },
                });

                await listApi.reorderList(removed._id, {
                    rank,
                    sourceIndex: srcIndex,
                    destinationIndex: destIndex,
                });

                socket.emit(SOCKET_EVENTS.LIST_MOVE, {
                    id: removed._id,
                    fromIndex: srcIndex,
                    toIndex: destIndex,
                });
            } catch (err) {
                const errMsg = getErrorMessage(err, "Failed to reorder list");
                toast.error(errMsg);
                dispatch({
                    type: BOARD_ACTIONS.SET_STATE,
                    payload: { data: clonedBoardState },
                });
            }

            return;
        }

        // type card

        // Note: for when user keep moving the card around containers fast
        if (Object.keys(active).length === 0) {
            dispatch({
                type: BOARD_ACTIONS.SET_STATE,
                payload: { data: clonedBoardState },
            });
            return;
        }

        const activeId = /** @type {string} */ (active.id);
        const activeListId = activeData.card.listId;

        const cards = [...boardState.cards[activeListId]];
        const activeIndex = cards.findIndex((c) => c._id == activeId);

        const prevOrder = cards[activeIndex - 1]?.order;
        const nextOrder = cards[activeIndex + 1]?.order;

        const [rank, ok] = lexorank.insert(prevOrder, nextOrder);
        if (!ok) {
            toast.error("Failed to reorder card. Error: invalid order");
            dispatch({
                type: BOARD_ACTIONS.SET_STATE,
                payload: { data: clonedBoardState },
            });
            return;
        }

        // drag to the same list, and same position
        if (
            activeCard &&
            activeCard.listId === activeListId &&
            activeCard.srcIndex === activeIndex
        ) {
            return;
        }

        try {
            const data = await cardApi.reorderCard(activeId, {
                rank,
                listId: activeListId,
                oldPos: activeCard ? activeCard.srcIndex + 1 : 0,
                newPos: activeIndex + 1,
            });

            const newCard = data.newCard;
            dispatch({
                type: BOARD_ACTIONS.SET_CARD,
                payload: {
                    card: {
                        ...newCard,
                        listId: activeListId,
                    },
                },
            });

            socket.emit(SOCKET_EVENTS.CARD_MOVE_TO_LIST, {
                oldListId: data.oldListId,
                newListId: newCard.listId,
                insertedIndex: activeIndex,
                card: newCard,
            });
        } catch (err) {
            const errMsg = getErrorMessage(err, "Failed to reorder card");
            toast.error(errMsg);
            dispatch({
                type: BOARD_ACTIONS.SET_STATE,
                payload: { data: clonedBoardState },
            });
        }
    }

    /** @param {import("@dnd-kit/core").DragOverEvent} e */
    function handleOnDragOver(e) {
        const { active, over } = e;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (overId == null || activeId == overId) {
            return;
        }

        const isActiveTypeCard = active.data.current?.type === "card";
        const isOverACard = over.data.current?.type === "card";

        if (!isActiveTypeCard) {
            return;
        }

        if (isActiveTypeCard && isOverACard) {
            const activeListId = active.data.current?.card.listId;
            const overListId = over.data.current?.card.listId;

            if (!activeListId || !overListId) return;

            if (activeListId === overListId) {
                if (!boardState.cards[activeListId]) {
                    return;
                }

                const newCards = [...boardState.cards[activeListId]];
                const activeIndex = newCards.findIndex(
                    (c) => c._id === activeId,
                );
                if (activeIndex === -1) {
                    return;
                }

                const overIndex = newCards.findIndex((c) => c._id === overId);
                if (overIndex === -1) {
                    return;
                }

                const [removed] = newCards.splice(activeIndex, 1);
                newCards.splice(overIndex, 0, removed);
                dispatch({
                    type: BOARD_ACTIONS.SET_LIST_CARDS,
                    payload: {
                        listId: activeListId,
                        cards: newCards,
                    },
                });
            } else {
                if (
                    !boardState.cards[activeListId] ||
                    !boardState.cards[overListId]
                ) {
                    return;
                }

                const newActiveCards = [...boardState.cards[activeListId]];
                const newOverCards = [...boardState.cards[overListId]];

                const activeIndex = newActiveCards.findIndex(
                    (c) => c._id === activeId,
                );
                if (activeIndex === -1) {
                    return;
                }

                const [removed] = newActiveCards.splice(activeIndex, 1);
                const newCard = { ...removed, listId: overListId };

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

                dispatch({
                    type: BOARD_ACTIONS.SET_CARDS,
                    payload: {
                        cards: {
                            ...boardState.cards,
                            [activeListId]: newActiveCards,
                            [overListId]: newOverCards,
                        },
                    },
                });
            }
            return;
        }

        const isOverAList = over.data.current?.type === "list";
        if (isActiveTypeCard && isOverAList) {
            const newLists = [...boardState.lists];

            const overList = newLists.find(
                (l) => l._id === /** @type {string} */ (over.id),
            );
            if (!overList) {
                return;
            }

            const activeListId = active.data.current?.card.listId;
            if (!activeListId) {
                return;
            }

            const overId = /** @type {string} */ (over.id);

            if (!boardState.cards[overId] || !boardState.cards[activeListId]) {
                return;
            }

            if (activeListId === overId) {
                return;
            }

            const newActiveCards = [...boardState.cards[activeListId]];
            const newOverCards = [...boardState.cards[overId]];

            const activeIndex = newActiveCards.findIndex(
                (c) => c._id === active.id,
            );

            const [removed] = newActiveCards.splice(activeIndex, 1);
            removed.listId = overList._id;
            newOverCards.push(removed);

            dispatch({
                type: BOARD_ACTIONS.SET_CARDS,
                payload: {
                    cards: {
                        ...boardState.cards,
                        [activeListId]: newActiveCards,
                        [overId]: newOverCards,
                    },
                },
            });
        }
    }

    /** @param {import("@dnd-kit/core").DragStartEvent} e */
    function handleOnDragStart(e) {
        setActiveCard(null);
        setActiveList(null);
        setClonedBoardState(structuredClone(boardState));

        if (e.active.data.current?.type === "list") {
            setActiveList(e.active.data.current.list);
            return;
        }
        if (e.active.data.current?.type === "card") {
            const srcIndex =
                boardState.cards[e.active.data.current.card.listId].findIndex(
                    (c) => {
                        return c._id === e.active.id;
                    },
                ) ?? -1;
            setActiveCard({ ...e.active.data.current.card, srcIndex });
            return;
        }
    }

    function handleOnDragCancel() {
        if (clonedBoardState) {
            dispatch({
                type: BOARD_ACTIONS.SET_STATE,
                payload: { data: clonedBoardState },
            });
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
                            cards={boardState.cards[list._id] || []}
                        />
                    ))}
                </SortableContext>
                <AddList />
            </div>

            {createPortal(
                <DragOverlay>
                    {activeList && (
                        <List
                            index={-1}
                            list={activeList}
                            cards={boardState.cards[activeList._id]}
                        />
                    )}
                    {activeCard && <Card card={activeCard} />}
                </DragOverlay>,
                /** @type {Element} */ (document.getElementById("root")),
            )}
        </DndContext>
    );
};

export default ListContainer;
