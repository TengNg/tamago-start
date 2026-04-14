import { useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useKeybind } from "./useKeybind";

const useCardActions = ({ stateHooks, effectDeps }) => {
    const { setFocusedCard, setOpenedCardQuickEditor } = stateHooks;
    const { boardState, focusedCard } = effectDeps;

    const [searchParams, setSearchParams] = useSearchParams();

    const getVisibleLists = useCallback(() => {
        return boardState.lists.filter((list) => {
            const hasVisibleCards =
                list.cards?.filter((card) => !card.hiddenByFilter).length > 0;
            return !list.collapsed && hasVisibleCards;
        });
    }, [boardState.lists]);

    const getVisibleCards = useCallback((list) => {
        return list.cards?.filter((card) => !card.hiddenByFilter) ?? [];
    }, []);

    const getCardPosition = useCallback(
        (cardId, listId) => {
            const list = getVisibleLists().find((l) => l._id === listId);
            if (!list) return null;
            const cards = getVisibleCards(list);
            const index = cards.findIndex((c) => c._id === cardId);
            return { list, cards, index };
        },
        [getVisibleLists, getVisibleCards],
    );

    const moveFocus = useCallback(
        (direction) => {
            const visibleLists = getVisibleLists();
            if (
                !boardState?.lists ||
                visibleLists.length === 0 ||
                visibleLists[0].cards.length === 0
            ) {
                return;
            }

            const isFocusedListCollapsed =
                focusedCard &&
                !visibleLists.find((list) => list._id === focusedCard.listId);

            if (isFocusedListCollapsed) {
                setFocusedCard(undefined);
                return;
            }

            if (!focusedCard) {
                const firstCard = getVisibleCards(visibleLists[0])[0];
                setFocusedCard({
                    id: firstCard._id,
                    listId: firstCard.listId,
                    focused: true,
                });
                return;
            }

            const pos = getCardPosition(focusedCard.id, focusedCard.listId);
            if (!pos) return;

            const { list: currList, cards: currCards, index: currIndex } = pos;
            const currListIndex = visibleLists.indexOf(currList);

            let nextCard = null;

            if (direction === "right") {
                const nextList = visibleLists[currListIndex + 1];
                if (!nextList || nextList.cards.length === 0) return;
                const nextCards = getVisibleCards(nextList);
                nextCard =
                    nextCards[currIndex] ?? nextCards[nextCards.length - 1];
            } else if (direction === "left") {
                const prevList = visibleLists[currListIndex - 1];
                if (!prevList || prevList.cards.length === 0) return;
                const prevCards = getVisibleCards(prevList);
                nextCard =
                    prevCards[currIndex] ?? prevCards[prevCards.length - 1];
            } else if (direction === "down") {
                nextCard = currCards[currIndex + 1];
            } else if (direction === "up") {
                nextCard = currCards[currIndex - 1];
            }

            if (nextCard) {
                setFocusedCard({
                    id: nextCard._id,
                    listId: nextCard.listId,
                    focused: true,
                });

                const cardEl = document.querySelector(
                    `[data-card-item="${nextCard._id}-${nextCard.listId}"]`,
                );
                if (!cardEl) {
                    return;
                }
                cardEl.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        },
        [
            boardState?.lists,
            focusedCard,
            getVisibleLists,
            getVisibleCards,
            getCardPosition,
            setFocusedCard,
        ],
    );

    const handleOpenCardDetail = useCallback(
        (card) => {
            if (card?.focused) {
                searchParams.set("card", card.id);
                setSearchParams(searchParams, { replace: true });
            }
        },
        [searchParams, setSearchParams],
    );

    const handleOpenCardQuickEditor = useCallback(
        (card) => {
            if (!card?.focused) return;

            const cardEl = document.querySelector(
                `[data-card-item="${card.id}-${card.listId}"]`,
            );
            if (!cardEl) return;

            const rect = cardEl.getBoundingClientRect();
            setOpenedCardQuickEditor({
                open: true,
                card,
                attribute: {
                    top: rect.bottom + window.scrollY,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                    height: rect.height,
                },
            });
        },
        [setOpenedCardQuickEditor],
    );

    const handleMouseDown = useCallback(
        (e) => {
            const el = e.target;
            if (el?.hasAttribute("data-card-item")) {
                const [id, listId] = el
                    .getAttribute("data-card-item")
                    .split("-");
                setFocusedCard({ id, listId, focused: true });
            } else {
                setFocusedCard((prev) => ({ ...prev, focused: false }));
            }
        },
        [setFocusedCard],
    );

    useKeybind(["ctrl+j", "ctrl+down"], () => moveFocus("down"));
    useKeybind(["ctrl+k", "ctrl+up"], () => moveFocus("up"));
    useKeybind(["ctrl+h", "ctrl+left"], () => moveFocus("left"));
    useKeybind(["ctrl+l", "ctrl+right"], () => moveFocus("right"));
    useKeybind("Enter", () => handleOpenCardDetail(focusedCard), {
        ignoreInInputs: true,
    });

    useKeybind("q", () => {
        if (!focusedCard) {
            return;
        }

        const pos = getCardPosition(focusedCard.id, focusedCard.listId);
        if (pos) {
            const foundCard = pos.cards[pos.index];
            console.log(focusedCard);
            handleOpenCardQuickEditor({
                ...focusedCard,
                title: foundCard.title,
            });
        }
    });

    useEffect(() => {
        document.addEventListener("mousedown", handleMouseDown);
        return () => document.removeEventListener("mousedown", handleMouseDown);
    }, [handleMouseDown]);

    // useEffect(() => {
    //     handleScrollToFocusedCard(focusedCard);
    // }, [focusedCard, handleScrollToFocusedCard]);
};

export default useCardActions;
