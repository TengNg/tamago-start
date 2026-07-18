import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCard, deleteCard, copyCard, reorderCard } from "../api/cardApi";
import useBoardState from "./useBoardState";
import useToast from "./useToast";
import { SOCKET_EVENTS } from "@shared/socket-events.js";
import { BOARD_ACTIONS } from "../state/boardActionTypes";
import { lexorank } from "../lib/lexorank";
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
            deleteCard(card._id),
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
            const [rank, ok] = lexorank.insert(
                cards[currentIndex]?.order,
                cards[currentIndex + 1]?.order,
            );

            if (!ok) {
                throw new Error(
                    "Failed to create a copy of this card, rank is not valid",
                );
            }

            const data = await copyCard(card._id, rank);
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
            const [rank, ok] = lexorank.insert(
                currentCards[currentCards.length - 1]?.order,
                "",
            );
            if (!ok) {
                throw new Error("Invalid rank for new card position");
            }

            return createCard({
                boardId: boardState.board._id,
                listId,
                order: rank,
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

            const cardsFromNewList = boardState.cards[newList._id];
            const [rank, ok] = lexorank.insert(
                cardsFromNewList[cardsFromNewList.length - 1]?.order,
                "",
            );

            if (!ok) {
                throw new Error("Failed to reorder card");
            }

            const currentIndex = boardState.cards[card.listId].findIndex(
                (/** @type {{ _id: string }} */ el) => el._id == card._id,
            );

            const data = await reorderCard(card._id, {
                rank,
                listId: newListId,
                oldPos: currentIndex,
                newPos: cardsFromNewList.length - 1,
            });

            return { newCard: data.newCard, oldListId: card.listId, newListId };
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
            const [rank, ok] = lexorank.insert(
                cards[prev]?.order,
                cards[next]?.order,
            );

            if (!ok) return;

            const newCards = [...cards];
            const [moved] = newCards.splice(currentIndex, 1);
            moved.order = rank;
            newCards.splice(insertedIndex, 0, moved);

            dispatch({
                type: BOARD_ACTIONS.SET_LIST_CARDS,
                payload: {
                    listId: card.listId,
                    cards: newCards,
                },
            });

            return reorderCard(card._id, {
                rank,
                listId: card.listId,
                oldPos: currentIndex,
                newPos: insertedIndex,
            }).then(() => ({
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
        processingCard: {
            msg: "processing...",
            processing: isProcessing,
        },
    };
};

export default useBoardMutations;
