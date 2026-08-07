import { useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useKeybind } from "./useKeybind";

/**
 * @param {Object} params
 * @param {BoardState} params.boardState
 * @param {FocusedCard | undefined} params.focusedCard
 * @param {React.Dispatch<React.SetStateAction<FocusedCard | undefined>>} params.setFocusedCard
 * @param {React.Dispatch<React.SetStateAction<CardQuickEditorData | undefined>>} params.setOpenedCardQuickEditor
 */
const useCardActions = ({
    boardState,
    focusedCard,
    setFocusedCard,
    setOpenedCardQuickEditor,
}) => {
    const [, setSearchParams] = useSearchParams();

    /**
     * @param {string} cardId
     * @param {string} listId
     */
    const getCardElement = (cardId, listId) => {
        return document.querySelector(`[data-card-item="${cardId}-${listId}"]`);
    };

    const getVisibleLists = useCallback(() => {
        const lists = boardState.lists ?? [];
        return lists.filter((list) => {
            const hasVisibleCards = boardState.cards[list._id]?.some(
                (card) => !card.hiddenByFilter,
            );
            return hasVisibleCards;
        });
    }, [boardState.lists, boardState.cards]);

    const getVisibleCards = useCallback(
        /**
         * @param {string} listId
         */
        (listId) => {
            return (
                boardState.cards[listId]?.filter(
                    (card) => !card.hiddenByFilter,
                ) ?? []
            );
        },
        [boardState.cards],
    );

    const getCardPosition = useCallback(
        /**
         * @param {string} cardId
         * @param {string} listId
         */
        (cardId, listId) => {
            const list = getVisibleLists().find((l) => l._id === listId);
            if (!list) return null;
            const cards = getVisibleCards(listId);
            const index = cards.findIndex((c) => c._id === cardId);
            return { list, cards, index };
        },
        [getVisibleLists, getVisibleCards],
    );

    const moveFocus = useCallback(
        /**
         * @param {"up" | "down" | "left" | "right"} direction
         */
        (direction) => {
            const visibleLists = getVisibleLists();
            if (visibleLists.length === 0) return;

            const isFocusedListCollapsed =
                focusedCard &&
                !visibleLists.find((list) => list._id === focusedCard.listId);

            if (isFocusedListCollapsed) {
                setFocusedCard(undefined);
                return;
            }

            if (!focusedCard) {
                const firstCard = getVisibleCards(visibleLists[0]._id)[0];
                setFocusedCard({
                    _id: firstCard._id,
                    listId: firstCard.listId,
                    focused: true,
                });
                return;
            }

            const pos = getCardPosition(focusedCard._id, focusedCard.listId);
            if (!pos) return;

            const { list: currList, cards: currCards, index: currIndex } = pos;
            const currListIndex = visibleLists.indexOf(currList);

            let nextCard = null;

            if (direction === "right") {
                const nextList = visibleLists[currListIndex + 1];
                const nextCards = nextList ? getVisibleCards(nextList._id) : [];
                if (!nextList || nextCards.length === 0) return;
                nextCard =
                    nextCards[currIndex] ?? nextCards[nextCards.length - 1];
            } else if (direction === "left") {
                const prevList = visibleLists[currListIndex - 1];
                const prevCards = prevList ? getVisibleCards(prevList._id) : [];
                if (!prevList || prevCards.length === 0) return;
                nextCard =
                    prevCards[currIndex] ?? prevCards[prevCards.length - 1];
            } else if (direction === "down") {
                nextCard = currCards[currIndex + 1];
            } else if (direction === "up") {
                nextCard = currCards[currIndex - 1];
            }

            if (nextCard) {
                setFocusedCard({
                    _id: nextCard._id,
                    listId: nextCard.listId,
                    focused: true,
                });

                const cardEl = getCardElement(nextCard._id, nextCard.listId);
                if (!cardEl) return;
                cardEl.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        },
        [
            focusedCard,
            getVisibleLists,
            getVisibleCards,
            getCardPosition,
            setFocusedCard,
        ],
    );

    const handleOpenCardDetail = useCallback(
        /**
         * @param {FocusedCard | undefined} card
         */
        (card) => {
            if (card?.focused) {
                setSearchParams(
                    (prev) => {
                        prev.set("card", card._id);
                        return prev;
                    },
                    { replace: true },
                );
            }
        },
        [setSearchParams],
    );

    const handleOpenCardQuickEditor = useCallback(
        /**
         * @param {Card} card
         */
        (card) => {
            const cardEl = getCardElement(card._id, card.listId);
            if (!cardEl) {
                return;
            }

            const rect = cardEl.getBoundingClientRect();
            setOpenedCardQuickEditor({
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
        /**
         * @param {MouseEvent} e
         */
        (e) => {
            const el = /** @type {HTMLElement} */ (e.target);
            if (el?.hasAttribute("data-card-item")) {
                const elAttr = el.getAttribute("data-card-item");
                if (elAttr) {
                    const [id, listId] = elAttr.split("-");
                    setFocusedCard({ _id: id, listId, focused: true });
                }
            } else {
                setFocusedCard(
                    /** @param {FocusedCard | undefined} prev */
                    (prev) => {
                        return prev ? { ...prev, focused: false } : undefined;
                    },
                );
            }
        },
        [setFocusedCard],
    );

    const moveDown = useCallback(() => moveFocus("down"), [moveFocus]);
    const moveUp = useCallback(() => moveFocus("up"), [moveFocus]);
    const moveLeft = useCallback(() => moveFocus("left"), [moveFocus]);
    const moveRight = useCallback(() => moveFocus("right"), [moveFocus]);

    const handleEnter = useCallback(
        () => handleOpenCardDetail(focusedCard),
        [handleOpenCardDetail, focusedCard],
    );

    const handleQ = useCallback(() => {
        if (!focusedCard) {
            return;
        }

        const pos = getCardPosition(focusedCard._id, focusedCard.listId);
        if (pos) {
            handleOpenCardQuickEditor(pos.cards[pos.index]);
        }
    }, [focusedCard, getCardPosition, handleOpenCardQuickEditor]);

    const vimOpts = useMemo(() => ({ ignoreInInputs: true }), []);
    const ctrlOpts = useMemo(() => ({}), []);

    useKeybind(["j", "down"], moveDown, vimOpts);
    useKeybind(["k", "up"], moveUp, vimOpts);
    useKeybind(["h", "left"], moveLeft, vimOpts);
    useKeybind(["l", "right"], moveRight, vimOpts);

    useKeybind(["ctrl+j", "ctrl+down"], moveDown, ctrlOpts);
    useKeybind(["ctrl+k", "ctrl+up"], moveUp, ctrlOpts);
    useKeybind(["ctrl+h", "ctrl+left"], moveLeft, ctrlOpts);
    useKeybind(["ctrl+l", "ctrl+right"], moveRight, ctrlOpts);

    useKeybind("enter", handleEnter, vimOpts);
    useKeybind("q", handleQ, vimOpts);

    useEffect(() => {
        document.addEventListener("mousedown", handleMouseDown);
        return () => {
            document.removeEventListener("mousedown", handleMouseDown);
        };
    }, [handleMouseDown]);
};

export default useCardActions;
