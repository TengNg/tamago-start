import socket from "../services/socket";
import { useCallback, useEffect, useState } from "react";
import { chatKeys } from "../queries/chatKeys";
import { BOARD_ACTIONS } from "../state/boardActionTypes";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SOCKET_EVENTS } from "@shared/socket-events.js";
import { cardKeys } from "../queries/cardKeys";
import useCurrentUser from "./useCurrentUser";

/**
 * @param {Card} card
 * @param {{ search: string | null, priority: string | null, owner: string | null }} filters
 * @returns {Card}
 */
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

/**
 * @typedef {Object} UseBoardSocketParams
 * @property {import("@tanstack/react-query").QueryClient} queryClient
 * @property {BoardContextValue["dispatch"]} dispatch
 * @property {string | undefined} boardId
 * @property {ToastContextValue} toast
 * @property {boolean} isAtBottomOfChatBox
 */

/**
 * @param {UseBoardSocketParams} params
 * @returns {{ isConnected: boolean }}
 */
export function useBoardSocket({
    queryClient,
    dispatch,
    boardId,
    toast,
    isAtBottomOfChatBox,
}) {
    const [isConnected, setIsConnected] = useState(false);

    const navigate = useNavigate();

    const [searchParams] = useSearchParams();

    const currentUser = useCurrentUser();

    const getFilters = useCallback(
        () => ({
            search: searchParams.get("search"),
            priority: searchParams.get("priority"),
            owner: searchParams.get("owner"),
        }),
        [searchParams],
    );

    useEffect(() => {
        if (!boardId) {
            return;
        }

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
            navigate("/boards");
        });

        socket.on(
            SOCKET_EVENTS.BOARD_UNAUTHORIZED,
            /** @param {{ message?: string }} _data */ (_data) => {
                navigate("/boards");
            },
        );

        socket.on(
            SOCKET_EVENTS.BOARD_MEMBER_KICKED,
            /** @param {{ userSocketId: string }} data */ (data) => {
                const { userSocketId } = data;
                if (socket.id === userSocketId) {
                    navigate("/boards");
                }
            },
        );

        socket.on(
            SOCKET_EVENTS.BOARD_MEMBER_LEFT,
            /** @param {{ memberId: string }} data */ (data) => {
                const { memberId } = data;

                if (memberId === currentUser._id) {
                    navigate("/boards");
                    return;
                }

                dispatch({
                    type: BOARD_ACTIONS.REMOVE_MEMBER,
                    payload: {
                        memberId,
                    },
                });
            },
        );

        socket.on(
            SOCKET_EVENTS.BOARD_UPDATED,
            (/** @type {{ field: string, value: string }} */ data) => {
                dispatch({
                    type: BOARD_ACTIONS.UPDATE_BOARD_FIELD,
                    payload: {
                        field: data.field,
                        value: data.value,
                    },
                });
            },
        );

        socket.on(
            SOCKET_EVENTS.LIST_MOVED_TO_BOARD,
            /** @param {{ list: List, cards: Card[], index: number }} data */ (
                data,
            ) => {
                const { list, cards, index } = data;
                dispatch({
                    type: BOARD_ACTIONS.ADD_LIST_TO_BOARD_BY_INDEX,
                    payload: {
                        list,
                        cards,
                        index,
                    },
                });
            },
        );

        socket.on(
            SOCKET_EVENTS.LIST_MOVED,
            (/** @type {{ id: string, order: string }} */ data) => {
                const { id, order } = data;
                dispatch({
                    type: BOARD_ACTIONS.MOVE_LIST,
                    payload: {
                        listId: id,
                        order,
                    },
                });
            },
        );

        socket.on(
            SOCKET_EVENTS.LIST_CREATED,
            /** @param {List} data */ (data) => {
                dispatch({
                    type: BOARD_ACTIONS.ADD_LIST_TO_BOARD,
                    payload: {
                        list: data,
                    },
                });
            },
        );

        socket.on(
            SOCKET_EVENTS.LIST_COPIED,
            /** @param {{ list: List, cards: Card[] }} data */ (data) => {
                dispatch({
                    type: BOARD_ACTIONS.COPY_LIST,
                    payload: data,
                });
            },
        );

        socket.on(
            SOCKET_EVENTS.LIST_DELETED,
            (/** @type {{ id: string }} */ data) => {
                dispatch({
                    type: BOARD_ACTIONS.DELETE_LIST,
                    payload: { listId: data.id },
                });
            },
        );

        socket.on(
            SOCKET_EVENTS.CARD_CREATED,
            /** @param {Card} data */ (data) => {
                const filters = getFilters();
                const card = applyFilter(data, filters);

                dispatch({
                    type: BOARD_ACTIONS.ADD_CARD,
                    payload: { listId: card.listId, card },
                });
            },
        );

        socket.on(
            SOCKET_EVENTS.CARD_COPIED,
            /** @param {{ card: Card }} data */ (data) => {
                const filters = getFilters();
                const { card } = data;
                applyFilter(card, filters);

                dispatch({
                    type: BOARD_ACTIONS.ADD_CARD,
                    payload: { listId: card.listId, card },
                });
            },
        );

        socket.on(
            SOCKET_EVENTS.CARD_DELETED,
            (/** @type {{ listId: string, id: string }} */ data) => {
                const { listId, id } = data;
                dispatch({
                    type: BOARD_ACTIONS.DELETE_CARD,
                    payload: { listId, cardId: id },
                });
            },
        );

        socket.on(
            SOCKET_EVENTS.CARD_MOVED,
            (
                /** @type {{ oldListId: string, newListId: string, id: string, newCard: Card }} */ data,
            ) => {
                const filters = getFilters();
                const { oldListId, newListId, id, newCard: card } = data;
                applyFilter(card, filters);

                dispatch({
                    type: BOARD_ACTIONS.DELETE_CARD,
                    payload: {
                        listId: oldListId,
                        cardId: id,
                    },
                });

                const newCard = { ...card, listId: newListId };
                dispatch({
                    type: BOARD_ACTIONS.ADD_CARD,
                    payload: { listId: newListId, card: newCard },
                });

                queryClient.setQueryData(
                    cardKeys.detail(id),
                    (/** @type {Card | undefined} */ old) => {
                        if (!old) return old;
                        return { ...old, listId: newListId };
                    },
                );
            },
        );

        socket.on(
            SOCKET_EVENTS.LIST_UPDATED,
            (
                /** @type {{ id: string, field: string, value: string }} */ data,
            ) => {
                dispatch({
                    type: BOARD_ACTIONS.UPDATE_LIST_FIELD,
                    payload: {
                        listId: data.id,
                        field: data.field,
                        value: data.value,
                    },
                });
            },
        );

        socket.on(
            SOCKET_EVENTS.CARD_UPDATED,
            (
                /** @type {{ id: string, listId: string, field: string, value: string | boolean }} */ data,
            ) => {
                dispatch({
                    type: BOARD_ACTIONS.UPDATE_CARD_FIELD,
                    payload: {
                        id: data.id,
                        listId: data.listId,
                        field: data.field,
                        value: data.value,
                    },
                });
            },
        );

        // CHAT_MESSGAGE =======================================================

        socket.on(
            SOCKET_EVENTS.CHAT_RECEIVED,
            /** @param {{ chatMessage: ChatMessage }} data */ (data) => {
                const { chatMessage } = data;
                queryClient.setQueryData(
                    chatKeys.messages(boardId),
                    /**
                     * @param {import("@tanstack/react-query").InfiniteData<GetChatResponse> | undefined} old
                     */ (old) => {
                        if (!old) {
                            return old;
                        }

                        const currentPages = [...old.pages];
                        const currentFirstPage = currentPages[0];
                        const isFirstPageFull =
                            currentFirstPage.nextCursor != null;
                        const newFirstPage = {
                            ...currentFirstPage,
                            messages: [
                                chatMessage,
                                ...currentFirstPage.messages.slice(
                                    0,
                                    isFirstPageFull
                                        ? currentFirstPage.messages.length - 1
                                        : currentFirstPage.messages.length,
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

                if (!isAtBottomOfChatBox) {
                    toast.success(
                        `new message from ${chatMessage.sentBy.username}`,
                        3000,
                    );
                }
            },
        );

        socket.on(
            SOCKET_EVENTS.CHAT_DELETED,
            /** @param {{ id: string }} data */ (data) => {
                const { id } = data;
                queryClient.setQueryData(
                    chatKeys.messages(boardId),
                    /**
                     * @param {import("@tanstack/react-query").InfiniteData<GetChatResponse> | undefined} old
                     */ (old) => {
                        if (!old) {
                            return old;
                        }

                        const newPages = old.pages.map((page) => {
                            return {
                                ...page,
                                messages: [...page.messages].filter(
                                    (message) => {
                                        return message._id !== id;
                                    },
                                ),
                            };
                        });

                        return {
                            ...old,
                            pages: newPages,
                        };
                    },
                );
            },
        );

        socket.on(SOCKET_EVENTS.CHAT_CLEARED, (_data) => {
            queryClient.setQueryData(
                chatKeys.messages(boardId),
                /**
                 * @param {import("@tanstack/react-query").InfiniteData<GetChatResponse> | undefined} old
                 */ (old) => {
                    if (!old) {
                        return old;
                    }

                    return /** @type {import("@tanstack/react-query").InfiniteData<GetChatResponse>} */ ({
                        pages: [],
                        pageParams: [],
                    });
                },
            );

            toast.success("Chat cleared");
        });

        // CARD_COMMENT ========================================================

        socket.on(
            SOCKET_EVENTS.COMMENT_CREATED,
            /** @param {{ comment: CardComment & { cardId: string } }} data */ (
                data,
            ) => {
                const { comment } = data;
                queryClient.setQueryData(
                    cardKeys.comments(comment.cardId),
                    /**
                     * @param {import("@tanstack/react-query").InfiniteData<{ comments: CardComment[]; nextPage: number | null }> | undefined} old
                     */ (old) => {
                        if (!old) {
                            return old;
                        }

                        const currentPages = [...old.pages];
                        const currentFirstPage = currentPages[0];
                        const isFirstPageFull =
                            currentFirstPage.nextPage != null;

                        const newFirstPage = {
                            ...currentFirstPage,
                            comments: [
                                comment,
                                ...currentFirstPage.comments.slice(
                                    0,
                                    isFirstPageFull
                                        ? currentFirstPage.comments.length - 1
                                        : currentFirstPage.comments.length,
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
            },
        );

        socket.on(
            SOCKET_EVENTS.COMMENT_DELETED,
            /** @param {{ commentId: string, cardId: string }} data */ (
                data,
            ) => {
                const { commentId, cardId } = data;
                queryClient.setQueryData(
                    cardKeys.comments(cardId),
                    /**
                     * @param {import("@tanstack/react-query").InfiniteData<{ comments: CardComment[] }> | undefined} old
                     */
                    (old) => {
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
                    },
                );
            },
        );

        // CARD_ATTACHMENT =====================================================

        socket.on(
            SOCKET_EVENTS.ATTACHMENT_CREATED,
            /** @param {{ attachment: Attachment & { doc: string } }} data */ (
                data,
            ) => {
                const { attachment } = data;
                queryClient.setQueryData(
                    cardKeys.attachments(attachment.doc),
                    /** @param {Attachment[] | undefined} old */
                    (old) => {
                        if (!old) {
                            return old;
                        }

                        const updated = [...old, attachment];
                        return updated;
                    },
                );
            },
        );

        socket.on(
            SOCKET_EVENTS.ATTACHMENT_DELETED,
            /** @param {{ id: string, cardId: string }} data */ (data) => {
                const { id, cardId } = data;
                queryClient.setQueryData(
                    cardKeys.attachments(cardId),
                    /** @param {Attachment[] | undefined} old */ (old) => {
                        if (!old) {
                            return old;
                        }

                        const updated = [...old].filter((a) => a._id != id);
                        return updated;
                    },
                );
            },
        );

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off(SOCKET_EVENTS.BOARD_CLOSED);
            socket.off(SOCKET_EVENTS.BOARD_UNAUTHORIZED);
            socket.off(SOCKET_EVENTS.BOARD_MEMBER_KICKED);
            socket.off(SOCKET_EVENTS.BOARD_MEMBER_LEFT);
            socket.off(SOCKET_EVENTS.BOARD_UPDATED);
            socket.off(SOCKET_EVENTS.LIST_MOVED_TO_BOARD);
            socket.off(SOCKET_EVENTS.LIST_MOVED);
            socket.off(SOCKET_EVENTS.LIST_CREATED);
            socket.off(SOCKET_EVENTS.LIST_COPIED);
            socket.off(SOCKET_EVENTS.LIST_DELETED);
            socket.off(SOCKET_EVENTS.LIST_UPDATED);
            socket.off(SOCKET_EVENTS.CARD_CREATED);
            socket.off(SOCKET_EVENTS.CARD_COPIED);
            socket.off(SOCKET_EVENTS.CARD_DELETED);
            socket.off(SOCKET_EVENTS.CARD_MOVED);
            socket.off(SOCKET_EVENTS.CARD_UPDATED);
            socket.off(SOCKET_EVENTS.CHAT_RECEIVED);
            socket.off(SOCKET_EVENTS.CHAT_DELETED);
            socket.off(SOCKET_EVENTS.CHAT_CLEARED);
            socket.off(SOCKET_EVENTS.COMMENT_CREATED);
            socket.off(SOCKET_EVENTS.COMMENT_DELETED);
            socket.off(SOCKET_EVENTS.ATTACHMENT_CREATED);
            socket.off(SOCKET_EVENTS.ATTACHMENT_DELETED);
        };
    }, [
        boardId,
        currentUser._id,
        dispatch,
        getFilters,
        isAtBottomOfChatBox,
        navigate,
        queryClient,
        toast,
    ]);

    return { isConnected };
}
