import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cardApi } from "../services/api";
import useBoardState from "./useBoardState";
import useToast from "./useToast";
import { SOCKET_EVENTS } from "@shared/socket-events.js";
import { BOARD_ACTIONS } from "../state/boardActionTypes";
import { getErrorMessage } from "../utils/getErrorMessage";
import { cardKeys } from "../queries/cardKeys";

const useBoardMutations = () => {
    const {
        boardState,
        dispatch,
        socket,
        addCopiedCard,
        addCardToList,
        deleteCard: removeCardFromBoard,
    } = useBoardState();

    const queryClient = useQueryClient();

    const toast = useToast();

    const deleteCardMutation = useMutation({
        mutationFn: (/** @type {{ _id: string, listId: string }} */ card) =>
            cardApi.deleteCard(card._id),
        onSuccess: (_, /** @type {{ _id: string, listId: string }} */ card) => {
            removeCardFromBoard(card.listId, card._id);
            socket.emit(SOCKET_EVENTS.CARD_DELETE, {
                listId: card.listId,
                id: card._id,
            });
        },
        onError: (err) => {
            const errMsg = getErrorMessage(err, "Failed to delete card");
            toast.error(errMsg);
        },
    });

    const copyCardMutation = useMutation({
        mutationFn: async (
            /** @type {{ _id: string, listId: string }} */ card,
        ) => {
            const cards = boardState.cards[card.listId];
            const currentIndex = cards.findIndex(
                (/** @type {{ _id: string }} */ el) => el._id == card._id,
            );
            const prevId = cards[currentIndex]?._id;
            const nextId = cards[currentIndex + 1]?._id;
            const data = await cardApi.copyCard(card._id, prevId, nextId);
            return {
                card: data,
                currentIndex,
            };
        },
        onSuccess: (data) => {
            const { card, currentIndex } = data;
            addCopiedCard(card, currentIndex);

            socket.emit(SOCKET_EVENTS.CARD_COPY, {
                card,
                index: currentIndex,
            });
        },
        onError: (err) => {
            toast.error(getErrorMessage(err, "Failed to copy card"));
        },
    });

    const createCardMutation = useMutation({
        mutationFn: async (
            /** @type {{ listId: string, title: string }} */
            { listId, title },
        ) => {
            const currentCards = boardState.cards[listId];
            const prevId = currentCards[currentCards.length - 1]?._id;
            return cardApi.createCard({
                boardId: boardState.board._id,
                listId,
                prevCardId: prevId,
                title,
            });
        },
        onMutate: async (
            /** @type {{ listId: string, title: string }} */
            { listId, title },
        ) => {
            /** @type {Card} */
            const tempCard = {
                _id: "temp-" + Date.now(),
                boardId: boardState.board._id,
                listId,
                title,
                order: "",
                description: "",
                highlight: "",
                priorityLevel: "none",
                verified: false,
                owner: "",
                dueDate: "",
                updatedAt: "",
                createdAt: "",
            };
            addCardToList(listId, tempCard);
            return { listId, tempId: tempCard._id };
        },
        onSuccess: (
            data,
            _,
            /** @type {{ listId: string, tempId: string } | undefined} */ context,
        ) => {
            if (!context) return;
            removeCardFromBoard(context.listId, context.tempId);
            addCardToList(context.listId, data);
            socket.emit(SOCKET_EVENTS.CARD_CREATE, data);
        },
        onError: (
            err,
            _,
            /** @type {{ listId: string, tempId: string } | undefined} */ context,
        ) => {
            if (!context) return;
            removeCardFromBoard(context.listId, context.tempId);
            toast.error(getErrorMessage(err, "Failed to add new card"));
        },
    });

    const moveCardToListMutation = useMutation({
        mutationFn: async (
            /** @type {{ card: { _id: string, listId: string }, newListId: string }} */
            { card, newListId },
        ) => {
            const newList = boardState.lists.find(
                (/** @type {{ _id: string }} */ list) => list._id === newListId,
            );

            if (!newList) {
                throw new Error("List not found");
            }

            const cards = boardState.cards[newList._id];
            const prevId = cards[cards.length - 1]?._id;
            const currentIndex = boardState.cards[card.listId].findIndex(
                (el) => el._id == card._id,
            );

            const newCard = await cardApi.reorderCard(card._id, {
                listId: newListId,
                prevCardId: prevId,
                nextCardId: null,
                oldPos: currentIndex,
                newPos: cards.length - 1,
            });

            return { newCard, oldListId: card.listId, newListId };
        },
        onSuccess: (
            /** @type {{ newCard: Card, oldListId: string, newListId: string }} */ data,
        ) => {
            const { newCard, oldListId, newListId } = data;
            removeCardFromBoard(oldListId, newCard._id);
            addCardToList(newListId, newCard);
            queryClient.setQueryData(
                cardKeys.detail(newCard._id),
                (/** @type {{ card: Card } | undefined} */ old) => {
                    if (!old) return old;
                    return { ...old, card: { ...old.card, listId: newListId } };
                },
            );

            socket.emit(SOCKET_EVENTS.CARD_MOVE, {
                oldListId,
                newListId,
                id: newCard._id,
                newCard,
            });
        },
        onError: (err) => {
            const errMsg = getErrorMessage(err, "Failed to move card");
            toast.error(errMsg);
        },
    });

    const moveCardByIndexMutation = useMutation({
        mutationFn: async (
            /** @type {{ card: { _id: string, listId: string }, insertedIndex: number }} */
            { card, insertedIndex },
        ) => {
            const cards = boardState.cards[card.listId];
            const currentIndex = cards.findIndex(
                (/** @type {{ _id: string }} */ el) => el._id == card._id,
            );
            const prev = insertedIndex - 1;
            const next = insertedIndex;
            const prevId = cards[prev]?._id;
            const nextId = cards[next]?._id;

            const newCards = [...cards];
            const [moved] = newCards.splice(currentIndex, 1);
            newCards.splice(insertedIndex, 0, moved);

            dispatch({
                type: BOARD_ACTIONS.SET_LIST_CARDS,
                payload: {
                    listId: card.listId,
                    cards: newCards,
                },
            });

            return cardApi
                .reorderCard(card._id, {
                    listId: card.listId,
                    prevCardId: prevId,
                    nextCardId: nextId,
                    oldPos: currentIndex,
                    newPos: insertedIndex,
                })
                .then(() => ({
                    cards: newCards,
                    listId: card.listId,
                }));
        },
        onSuccess: (data) => {
            if (!data) return;
            const { cards, listId } = data;
            socket.emit(SOCKET_EVENTS.CARD_MOVE_BY_INDEX, {
                cards,
                listId,
            });
        },
        onError: (err) => {
            const errMsg = getErrorMessage(err, "Failed to move this card");
            toast.error(errMsg);
        },
    });

    const isProcessing =
        deleteCardMutation.isPending ||
        copyCardMutation.isPending ||
        moveCardToListMutation.isPending ||
        moveCardByIndexMutation.isPending;

    return {
        deleteCard: (/** @type {Card} */ card) =>
            deleteCardMutation.mutateAsync(card),
        copyCard: (/** @type {Card} */ card) =>
            copyCardMutation.mutateAsync(card),
        moveCardToList: (
            /** @type {Card} */ card,
            /** @type {string} */ newListId,
        ) => moveCardToListMutation.mutateAsync({ card, newListId }),
        moveCardByIndex: (
            /** @type {Card} */ card,
            /** @type {number} */ insertedIndex,
        ) => moveCardByIndexMutation.mutateAsync({ card, insertedIndex }),
        createCard: (
            /** @type {{ listId: string, title: string }} */
            opts,
        ) => createCardMutation.mutateAsync(opts),
        isCreatingCard: createCardMutation.isPending,
        isDeletingCard: deleteCardMutation.isPending,
        isCopyingCard: copyCardMutation.isPending,
        isMovingCardToList: moveCardToListMutation.isPending,
        isMovingCardByIndex: moveCardByIndexMutation.isPending,
        isProcessing,
    };
};

export default useBoardMutations;
