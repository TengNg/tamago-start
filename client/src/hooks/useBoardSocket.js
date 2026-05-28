import socket from "../services/socket";
import { useCallback, useEffect, useRef, useState } from "react";
import { chatKeys } from "../queries/chatKeys";
import { BOARD_ACTIONS } from "../state/boardActionTypes";
import { useSearchParams } from "react-router-dom";
import dateFormatter from "../utils/dateFormatter";
import { SOCKET_EVENTS } from "@shared/socket-events.js";

function applyFilter(card, filters) {
    const { search, priority, owner } = filters;

    let hidden = false;

    if (search) {
        hidden =
            hidden || !card.title.toLowerCase().includes(search.toLowerCase());
    }

    if (priority) {
        hidden = hidden || card.priorityLevel !== priority;
    }

    if (owner) {
        hidden = hidden || card.owner !== owner;
    }

    return { ...card, hiddenByFilter: hidden };
}

export function useBoardSocket({
    queryClient,
    dispatch,
    boardId,
    toast,
    isAtBottomOfChatBox,
    setIsRemoved,
}) {
    const [isConnected, setIsConnected] = useState(false);

    const [searchParams] = useSearchParams();

    const getFilters = useCallback(
        () => ({
            search: searchParams.get("search"),
            priority: searchParams.get("priority"),
            owner: searchParams.get("owner"),
        }),
        [searchParams],
    );

    const getFiltersRef = useRef(getFilters);
    const toastRef = useRef(toast);
    const isAtBottomOfChatBoxRef = useRef(isAtBottomOfChatBox);

    getFiltersRef.current = getFilters;
    toastRef.current = toast;
    isAtBottomOfChatBoxRef.current = isAtBottomOfChatBox;

    useEffect(() => {
        const onConnect = async () => {
            socket.emit(SOCKET_EVENTS.BOARD_JOIN, { boardId });
            setIsConnected(true);
        };

        const onDisconnect = () => {
            socket.emit(SOCKET_EVENTS.BOARD_DISCONNECT);
            setIsConnected(false);
        };

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);

        socket.on(SOCKET_EVENTS.BOARD_CLOSED, (_) => {
            toastRef.current.error("board not found");
            setIsRemoved(true);
        });

        socket.on(SOCKET_EVENTS.BOARD_UNAUTHORIZED, (data) => {
            toastRef.current.error(data.message || "Unauthorized");
            setIsRemoved(true);
        });

        socket.on(SOCKET_EVENTS.BOARD_MEMBER_KICKED, (data) => {
            const { userSocketId } = data;
            if (socket.id === userSocketId) {
                window.location.reload();
            }
        });

        socket.once(SOCKET_EVENTS.BOARD_MEMBER_JOINED, (data) => {
            const { username } = data;
            const timestamp = Date.now();
            console.log(
                `${username} joined the board, at ${dateFormatter(timestamp)}`,
            );
        });

        socket.on(SOCKET_EVENTS.BOARD_MEMBER_LEFT, (data) => {
            const { memberId } = data;
            dispatch({
                type: BOARD_ACTIONS.REMOVE_MEMBER,
                payload: {
                    memberId,
                },
            });
        });

        socket.on(SOCKET_EVENTS.CARD_OWNER_UPDATED, (data) => {
            const { cardId, listId, username } = data;
            dispatch({
                type: BOARD_ACTIONS.UPDATE_CARD_FIELD,
                payload: {
                    listId,
                    cardId,
                    field: "owner",
                    value: username,
                },
            });
        });

        socket.on(SOCKET_EVENTS.CARD_PRIORITY_UPDATED, (data) => {
            const { cardId, listId, priorityLevel } = data;
            dispatch({
                type: BOARD_ACTIONS.UPDATE_CARD_FIELD,
                payload: {
                    listId,
                    cardId,
                    field: "priorityLevel",
                    value: priorityLevel,
                },
            });
        });

        socket.on(SOCKET_EVENTS.BOARD_INVITE_ACCEPTED, (data) => {
            const { username, profileImage: _ } = data;
            dispatch({
                type: BOARD_ACTIONS.ADD_MEMBER,
                payload: {
                    member: {
                        username,
                    },
                },
            });
        });

        socket.on(SOCKET_EVENTS.LIST_MOVED_TO_BOARD, (data) => {
            const { list, cards, index } = data;
            dispatch({
                type: BOARD_ACTIONS.ADD_LIST_TO_BOARD_BY_INDEX,
                payload: {
                    list,
                    cards,
                    index,
                },
            });
        });

        socket.on(SOCKET_EVENTS.LIST_MOVED, (data) => {
            const { listId, fromIndex, toIndex } = data;
            dispatch({
                type: BOARD_ACTIONS.MOVE_LIST,
                payload: {
                    listId,
                    fromIndex,
                    toIndex,
                },
            });
        });

        socket.on(SOCKET_EVENTS.LIST_UPDATED_ALL, (data) => {
            dispatch({
                type: BOARD_ACTIONS.SET_LISTS,
                payload: { lists: data },
            });
        });

        socket.on(SOCKET_EVENTS.BOARD_TITLE_UPDATED, (data) => {
            dispatch({
                type: BOARD_ACTIONS.UPDATE_BOARD_FIELD,
                payload: {
                    field: "title",
                    value: data,
                },
            });
        });

        socket.on(SOCKET_EVENTS.BOARD_DESCRIPTION_UPDATED, (data) => {
            dispatch({
                type: BOARD_ACTIONS.UPDATE_BOARD_FIELD,
                payload: {
                    field: "description",
                    value: data,
                },
            });
        });

        socket.on(SOCKET_EVENTS.LIST_CREATED, (data) => {
            dispatch({
                type: BOARD_ACTIONS.ADD_LIST_TO_BOARD,
                payload: {
                    list: data,
                },
            });
        });

        socket.on(SOCKET_EVENTS.LIST_DELETED, (listId) => {
            dispatch({
                type: BOARD_ACTIONS.DELETE_LIST,
                payload: { listId },
            });
        });

        socket.on(SOCKET_EVENTS.CARD_CREATED, (data) => {
            const filters = getFiltersRef.current();
            const card = applyFilter(data, filters);

            dispatch({
                type: BOARD_ACTIONS.ADD_CARD_TO_LIST,
                payload: { listId: card.listId, card },
            });
        });

        socket.on(SOCKET_EVENTS.CARD_COPIED, (data) => {
            const filters = getFiltersRef.current();
            const { card, index } = data;
            applyFilter(card, filters);

            dispatch({
                type: BOARD_ACTIONS.COPY_CARD,
                payload: { index, card },
            });
        });

        socket.on(SOCKET_EVENTS.CARD_DELETED, (data) => {
            const { listId, cardId } = data;
            dispatch({
                type: BOARD_ACTIONS.DELETE_CARD,
                payload: { listId, cardId },
            });
        });

        socket.on(SOCKET_EVENTS.CARD_MOVED, (data) => {
            const filters = getFiltersRef.current();
            const { oldListId, newListId, cardId, newCard: card } = data;
            applyFilter(card, filters);

            dispatch({
                type: BOARD_ACTIONS.DELETE_CARD,
                payload: {
                    listId: oldListId,
                    cardId,
                },
            });

            const newCard = { ...card, listId: newListId };
            dispatch({
                type: BOARD_ACTIONS.ADD_CARD_TO_LIST,
                payload: { listId: newListId, card: newCard },
            });
        });

        socket.on(SOCKET_EVENTS.CARD_MOVED_BY_INDEX, (data) => {
            const filters = getFiltersRef.current();
            let { cards, listId } = data;
            cards = cards.map((card) => applyFilter(card, filters));

            dispatch({
                type: BOARD_ACTIONS.SET_LIST_CARDS,
                payload: { listId, cards },
            });
        });

        socket.on(SOCKET_EVENTS.CARD_MOVED_TO_LIST, (data) => {
            const filters = getFiltersRef.current();
            const { oldListId, newListId, insertedIndex, card } = data;
            applyFilter(card, filters);

            dispatch({
                type: BOARD_ACTIONS.DELETE_CARD,
                payload: {
                    listId: oldListId,
                    cardId: card._id,
                },
            });

            dispatch({
                type: BOARD_ACTIONS.ADD_CARD_TO_LIST_BY_INDEX,
                payload: {
                    index: insertedIndex,
                    listId: newListId,
                    card,
                },
            });
        });

        socket.on(SOCKET_EVENTS.LIST_TITLE_UPDATED, (data) => {
            dispatch({
                type: BOARD_ACTIONS.UPDATE_LIST_FIELD,
                payload: {
                    field: "title",
                    listId: data.listId,
                    value: data.title,
                },
            });
        });

        socket.on(SOCKET_EVENTS.CARD_TITLE_UPDATED, (data) => {
            dispatch({
                type: BOARD_ACTIONS.UPDATE_CARD_FIELD,
                payload: {
                    field: "title",
                    listId: data.listId,
                    id: data.id,
                    value: data.title,
                },
            });
        });

        socket.on(SOCKET_EVENTS.CARD_DESCRIPTION_UPDATED, (data) => {
            dispatch({
                type: BOARD_ACTIONS.UPDATE_CARD_FIELD,
                payload: {
                    field: "description",
                    listId: data.listId,
                    cardId: data.id,
                    value: data.description,
                },
            });
        });

        socket.on(SOCKET_EVENTS.CARD_HIGHLIGHT_UPDATED, (data) => {
            dispatch({
                type: BOARD_ACTIONS.UPDATE_CARD_FIELD,
                payload: {
                    field: "highlight",
                    listId: data.listId,
                    cardId: data.id,
                    value: data.highlight,
                },
            });
        });

        socket.on(SOCKET_EVENTS.CARD_VERIFIED_UPDATED, (data) => {
            dispatch({
                type: BOARD_ACTIONS.UPDATE_CARD_FIELD,
                payload: {
                    field: "verified",
                    listId: data.listId,
                    cardId: data.id,
                    value: data.verified,
                },
            });
        });

        socket.on(SOCKET_EVENTS.CARD_DUE_DATE_UPDATED, (data) => {
            dispatch({
                type: BOARD_ACTIONS.UPDATE_CARD_FIELD,
                payload: {
                    field: "dueDate",
                    listId: data.listId,
                    cardId: data.id,
                    value: data.dueDate,
                },
            });
        });

        // CHAT_MESSGAGE =======================================================

        socket.on(SOCKET_EVENTS.CHAT_RECEIVED, (data) => {
            const { chatMessage } = data;
            queryClient.setQueryData(chatKeys.messages(boardId), (old) => {
                if (!old) {
                    return old;
                }

                const currentPages = [...old.pages];
                const currentFirstPage = currentPages[0];
                const newFirstPage = {
                    ...currentFirstPage,
                    messages: [
                        chatMessage,
                        ...currentFirstPage.messages.slice(
                            0,
                            currentFirstPage.messages.length - 1,
                        ),
                    ],
                };

                if (old.pages.length === 1) {
                    return {
                        ...old,
                        pages: [newFirstPage],
                    };
                }

                currentPages[0] = newFirstPage;
                return {
                    ...old,
                    pages: currentPages,
                };
            });

            if (!isAtBottomOfChatBoxRef.current) {
                toastRef.current.success(
                    `new message from ${chatMessage.sentBy.username}`,
                    3000,
                );
            }
        });

        socket.on(SOCKET_EVENTS.CHAT_DELETED, (data) => {
            const { id } = data;
            queryClient.setQueryData(chatKeys.messages(boardId), (old) => {
                if (!old) {
                    return old;
                }

                const newPages = old.pages.map((page) => {
                    return {
                        ...page,
                        messages: [...page.messages].filter((message) => {
                            return message._id !== id;
                        }),
                    };
                });

                return {
                    ...old,
                    pages: newPages,
                };
            });
        });

        socket.on(SOCKET_EVENTS.CHAT_CLEARED, (_data) => {
            queryClient.setQueryData(chatKeys.messages(boardId), (old) => {
                if (!old) {
                    return old;
                }

                return {
                    pages: [],
                    pageParams: [],
                };
            });

            toastRef.current.success("Chat cleared");
        });

        // CARD_COMMENT ========================================================

        socket.on(SOCKET_EVENTS.COMMENT_CREATED, (data) => {
            const { comment } = data;
            queryClient.setQueryData(
                ["card-comments", comment.cardId],
                (old) => {
                    if (!old) {
                        return old;
                    }

                    const currentPages = [...old.pages];
                    const currentFirstPage = currentPages[0];

                    const newFirstPage = {
                        ...currentFirstPage,
                        comments: [
                            comment,
                            ...currentFirstPage.comments.slice(
                                0,
                                currentFirstPage.comments.length - 1,
                            ),
                        ],
                    };

                    if (old.pages.length === 1) {
                        return {
                            ...old,
                            pages: [newFirstPage],
                        };
                    }

                    currentPages[0] = newFirstPage;
                    return {
                        ...old,
                        pages: currentPages,
                    };
                },
            );
        });

        socket.on(SOCKET_EVENTS.COMMENT_DELETED, (data) => {
            const { commentId, cardId } = data;
            queryClient.setQueryData(["card-comments", cardId], (old) => {
                if (!old) {
                    return old;
                }

                const currentPages = [...old.pages];
                const newPages = currentPages.map((page) => {
                    return {
                        ...page,
                        comments: page.comments.map((comment) => {
                            if (comment._id === commentId) {
                                return {
                                    ...comment,
                                    deleted: true,
                                };
                            }
                            return comment;
                        }),
                    };
                });

                return {
                    ...old,
                    pages: newPages,
                };
            });
        });

        // CARD_ATTACHMENT =====================================================

        socket.on(SOCKET_EVENTS.ATTACHMENT_CREATED, (data) => {
            const { attachment } = data;
            queryClient.setQueryData(
                ["card-attachments", attachment.refId],
                (old) => {
                    if (!old) {
                        return old;
                    }

                    const updated = [...old, attachment];
                    return updated;
                },
            );
        });

        socket.on(SOCKET_EVENTS.ATTACHMENT_DELETED, (data) => {
            const { id, cardId } = data;
            queryClient.setQueryData(["card-attachments", cardId], (old) => {
                if (!old) {
                    return old;
                }

                const updated = [...old].filter((a) => a._id != id);
                return updated;
            });
        });

        return () => {
            socket.off();
        };
    }, [boardId]);

    return { isConnected };
}
