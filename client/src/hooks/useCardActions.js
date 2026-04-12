import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const useCardActions = ({ stateHooks, effectDeps }) => {
    const { setFocusedCard, setOpenedCardQuickEditor } = stateHooks;
    const { boardState, focusedCard, hasFilter } = effectDeps;

    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        document.addEventListener("keydown", handleKeydown);
        document.addEventListener("mousedown", handleMouseDown);

        handleScrollToFocusedCard(focusedCard);

        return () => {
            document.removeEventListener("keydown", handleKeydown);
            document.removeEventListener("mousedown", handleMouseDown);
        };
    }, [boardState?.lists, focusedCard, hasFilter]);

    function handleOpenCardDetail(card) {
        if (card && card.focused) {
            searchParams.set("card", card.id);
            setSearchParams(searchParams, { replace: true });
        }
    }

    function handleOpenCardQuickEditor(card) {
        if (card && card.focused) {
            const cardEl = document.querySelector(
                `[data-card-item="${card.id}-${card.listId}"]`,
            );
            if (cardEl) {
                const rect = cardEl.getBoundingClientRect();
                const top = rect.bottom + window.scrollY;
                const left = rect.left + window.scrollX;
                const width = rect.width;
                const height = rect.height;

                setOpenedCardQuickEditor({
                    open: true,
                    card: card,
                    attribute: { top, left, width, height },
                });
            }
        }
    }

    function handleScrollToFocusedCard(card) {
        if (!card) {
            return;
        }

        const cardEl = document.querySelector(
            `[data-card-item="${card.id}-${card.listId}"]`,
        );
        if (!cardEl) {
            return;
        }

        cardEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function handleMouseDown(e) {
        const el = e.target;
        if (el && el.hasAttribute("data-card-item")) {
            const [id, listId] = el.getAttribute("data-card-item").split("-");
            setFocusedCard({ id, listId, focused: true });
        }

        setFocusedCard((prev) => {
            return { ...prev, focused: false };
        });
    }

    function handleKeydown(e) {
        const key = e.key;

        const isTextFieldFocused = document.querySelector("input:focus");
        const isTextAreaFocused = document.querySelector("textarea:focus");

        if (e.key === "Enter") {
            handleOpenCardDetail(focusedCard);
            return;
        }

        if (e.key === "q") {
            e.preventDefault();

            let foundCard;
            if (focusedCard) {
                const foundList = boardState.lists.find(
                    (l) => l._id == focusedCard.listId,
                );
                if (foundList) {
                    foundCard = foundList.cards.find(
                        (c) => c._id == focusedCard.id,
                    );
                }
            }

            handleOpenCardQuickEditor({
                ...focusedCard,
                title: foundCard.title,
            });
            return;
        }

        if (!e.ctrlKey || isTextAreaFocused || isTextFieldFocused) {
            return;
        }

        // check if board has opened(or not-collapsed) lists or visible(or not-hidden-by-filter) cards
        const currentLists = boardState.lists.filter((list) => {
            const isListHasCards =
                list.cards &&
                list.cards.filter((card) => !card.hiddenByFilter).length > 0;
            return !list.collapsed && isListHasCards;
        });

        // check if board has any lists or cards
        if (
            !boardState?.lists ||
            currentLists.length === 0 ||
            currentLists[0].cards.length === 0
        ) {
            return;
        }

        // check if list of focusedCard is collapsed or not
        if (
            focusedCard &&
            currentLists.find((list) => list._id === focusedCard.listId) ===
                undefined
        ) {
            setFocusedCard(undefined);
            return;
        }

        // move right -> set focusedCard by increment list-index
        if (key === "l" || key === "ArrowRight") {
            if (focusedCard) {
                const currList = currentLists.find(
                    (list) => list._id === focusedCard.listId,
                );
                const currListIndex = currentLists.indexOf(currList);

                const currtListCards = currList.cards.filter(
                    (card) => !card.hiddenByFilter,
                );
                const currCardIndex = currtListCards.findIndex(
                    (card) => card._id === focusedCard.id,
                );

                const nextList = currentLists[currListIndex + 1];
                if (!nextList || nextList.cards.length === 0) {
                    return;
                }

                const nextListCards = nextList.cards.filter(
                    (card) => !card.hiddenByFilter,
                );
                const nextCard =
                    nextListCards[currCardIndex] ||
                    nextListCards[nextListCards.length - 1];
                setFocusedCard({
                    id: nextCard._id,
                    listId: nextCard.listId,
                    focused: true,
                });
            } else {
                const currList = currentLists[0];
                const currListCards = currList.cards.filter(
                    (card) => !card.hiddenByFilter,
                );
                const currCard = currListCards[0];
                setFocusedCard({
                    id: currCard._id,
                    listId: currCard.listId,
                    focused: true,
                });
            }
        }

        // move left -> set focusedCard by decrement list-index
        if (key === "h" || key === "ArrowLeft") {
            if (focusedCard) {
                const currList = currentLists.find(
                    (list) => list._id === focusedCard.listId,
                );
                const currListIndex = currentLists.indexOf(currList);

                const currListCards = currList.cards.filter(
                    (card) => !card.hiddenByFilter,
                );
                const currCardIndex = currListCards.findIndex(
                    (card) => card._id === focusedCard.id,
                );

                const prevList = currentLists[currListIndex - 1];
                if (!prevList || prevList.cards.length === 0) {
                    return;
                }

                const prevListCards = prevList.cards.filter(
                    (card) => !card.hiddenByFilter,
                );
                const prevCard =
                    prevListCards[currCardIndex] ||
                    prevListCards[prevListCards.length - 1];
                setFocusedCard({
                    id: prevCard._id,
                    listId: prevCard.listId,
                    focused: true,
                });
            }
            return;
        }

        // move down -> set focusedCard by increment card-index
        if (key === "j" || key === "ArrowDown") {
            if (focusedCard) {
                const currList = currentLists.find(
                    (list) => list._id === focusedCard.listId,
                );

                const currListCards = currList.cards.filter(
                    (card) => !card.hiddenByFilter,
                );
                const currCardIndex = currListCards.findIndex(
                    (card) => card._id === focusedCard.id,
                );

                const nextCard = currListCards[currCardIndex + 1];
                if (!nextCard) {
                    return;
                }

                setFocusedCard({
                    id: nextCard._id,
                    listId: nextCard.listId,
                    focused: true,
                });
            } else {
                const currList = currentLists[0];
                const currListCards = currList.cards.filter(
                    (card) => !card.hiddenByFilter,
                );
                const currCard = currListCards[0];
                setFocusedCard({
                    id: currCard._id,
                    listId: currCard.listId,
                    focused: true,
                });
            }
            return;
        }

        // move up -> set focusedCard by decrement card-index
        if (key === "k" || key === "ArrowUp") {
            if (focusedCard) {
                const currList = currentLists.find(
                    (list) => list._id === focusedCard.listId,
                );

                const currListCards = currList.cards.filter(
                    (card) => !card.hiddenByFilter,
                );
                const currCardIndex = currListCards.findIndex(
                    (card) => card._id === focusedCard.id,
                );

                const prevCard = currListCards[currCardIndex - 1];
                if (!prevCard) {
                    return;
                }

                setFocusedCard({
                    id: prevCard._id,
                    listId: prevCard.listId,
                    focused: true,
                });
            }
            return;
        }
    }
};

export default useCardActions;
