import { useMemo, useState } from "react";
import List from "./List";
import useBoardState from "../../hooks/useBoardState";
import AddList from "./AddList";
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
    const { boardState, dispatch, setOpenAddList, socket, setPendingReorder } =
        useBoardState();

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

    /** @param {string} id */
    const addPendingReorder = (id) => {
        setPendingReorder((prev) => new Set(prev).add(id));
    };

    /** @param {string} id */
    const removePendingReorder = (id) => {
        setPendingReorder((prev) => {
            if (!prev.has(id)) return prev;
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    };

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

            const prevListId = newLists[destIndex - 1]?._id;
            const nextListId = newLists[destIndex + 1]?._id;

            try {
                dispatch({
                    type: BOARD_ACTIONS.SET_LISTS,
                    payload: { lists: newLists },
                });

                addPendingReorder(removed._id);

                await listApi.reorderList(removed._id, {
                    boardId: boardState.board._id,
                    prevListId,
                    nextListId,
                    oldPos: srcIndex,
                    newPos: destIndex,
                });

                setClonedBoardState(null);

                socket.emit(SOCKET_EVENTS.LIST_MOVE, {
                    id: removed._id,
                    fromIndex: srcIndex,
                    toIndex: destIndex,
                });
            } catch (err) {
                const errMsg = getErrorMessage(err, "Failed to reorder list");
                toast.error(errMsg);
                if (clonedBoardState) {
                    dispatch({
                        type: BOARD_ACTIONS.SET_STATE,
                        payload: { data: clonedBoardState },
                    });
                    setClonedBoardState(null);
                }
            } finally {
                removePendingReorder(removed._id);
            }

            return;
        }

        // type card

        const activeId = /** @type {string} */ (active.id);
        const activeListId = activeData.card.listId;

        const cards = [...boardState.cards[activeListId]];
        const activeIndex = cards.findIndex((c) => c._id == activeId);

        const prevId = cards[activeIndex - 1]?._id;
        const nextId = cards[activeIndex + 1]?._id;

        // no active card or drag to the same list, and same position
        if (
            !activeCard ||
            (activeCard &&
                activeCard.listId === activeListId &&
                activeCard.srcIndex === activeIndex)
        ) {
            return;
        }

        try {
            addPendingReorder(activeId);

            const newCard = await cardApi.reorderCard(activeId, {
                listId: activeListId,
                prevCardId: prevId,
                nextCardId: nextId,
                oldPos: activeCard.srcIndex,
                newPos: activeIndex + 1,
            });

            setClonedBoardState(null);

            dispatch({
                type: BOARD_ACTIONS.SET_CARD,
                payload: {
                    card: {
                        ...newCard,
                        listId: activeListId,
                    },
                },
            });

            if (activeCard) {
                socket.emit(SOCKET_EVENTS.CARD_MOVE_TO_LIST, {
                    oldListId: activeCard?.listId,
                    newListId: newCard.listId,
                    insertedIndex: activeIndex,
                    card: newCard,
                });
            }
        } catch (err) {
            const errMsg = getErrorMessage(err, "Failed to reorder card");
            toast.error(errMsg);
            if (clonedBoardState) {
                dispatch({
                    type: BOARD_ACTIONS.SET_STATE,
                    payload: { data: clonedBoardState },
                });
                setClonedBoardState(null);
            }
        } finally {
            removePendingReorder(activeId);
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
