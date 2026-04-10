import socket from "../services/socket";

import { createContext, useEffect, useState, useCallback } from "react";

import useLocalStorage from "../hooks/useLocalStorage";
import LOCAL_STORAGE_KEYS from "../data/localStorageKeys";
import dateFormatter from "../utils/dateFormatter";
import { useParams, useSearchParams } from "react-router-dom";
import useWindowSize from "../hooks/useWindowSize";
import { useQueryClient } from "@tanstack/react-query";
import useCurrentUserContext from "../hooks/useCurrentUserContext";

const BoardStateContext = createContext({});

export const BoardStateContextProvider = ({ children }) => {
    const { currentUser } = useCurrentUserContext();
    const queryClient = useQueryClient();

    const { width: windowWidth } = useWindowSize();
    const isLargeScreen = windowWidth >= 769;

    const { boardId } = useParams();
    const [searchParams] = useSearchParams();

    const [boardState, setBoardState] = useState({});
    const [isRemoved, setIsRemoved] = useState(false);
    const [openMoveListForm, setOpenMoveListForm] = useState(false);
    const [focusedCard, setFocusedCard] = useState();
    const [openCardDetail, setOpenCardDetail] = useState(false);
    const [openedCard, setOpenedCard] = useState(undefined);
    const [openedCardQuickEditor, setOpenedCardQuickEditor] =
        useState(undefined);
    const [listToMove, setListToMove] = useState();
    const [hasFilter, setHasFilter] = useState(false);

    const [theme, setTheme] = useLocalStorage(
        LOCAL_STORAGE_KEYS.BOARD_ITEM_THEME,
        {},
    );
    const [debugModeEnabled, setDebugModeEnabled] = useLocalStorage(
        LOCAL_STORAGE_KEYS.DEBUG_MODE_ENABLED,
        {},
    );

    const [isConnected, setIsConnected] = useState(false);

    const searchParamsFn = useCallback(() => {
        const search = searchParams.get("search");
        const priority = searchParams.get("priority");
        const owner = searchParams.get("owner");
        return { search, priority, owner };
    }, [searchParams]);

    useEffect(() => {
        const onConnect = async () => {
            if (currentUser) {
                socket.emit("joinBoard", {
                    boardId,
                });
                setIsConnected(true);
            }
        };

        const onDisconnect = () => {
            socket.emit("disconnectFromBoard");
            setIsConnected(false);
        };

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);

        socket.on("boardClosed", (_) => {
            setIsRemoved(true);
        });

        socket.on("memberKicked", (data) => {
            const { userSocketId } = data;
            if (socket.id === userSocketId) {
                window.location.reload();
            }
        });

        socket.once("memberJoined", (data) => {
            const { username } = data;
            const timestamp = Date.now();
            console.log(
                `${username} joined the board, at ${dateFormatter(timestamp)}`,
            );
        });

        socket.on("memberLeaved", (data) => {
            const { username } = data;
            removeMemberFromBoard(username);
        });

        socket.on("cardOwnerUpdated", (data) => {
            const { cardId, listId, username } = data;
            setCardOwner(cardId, listId, username);
        });

        socket.on("cardPriorityLevelUpdated", (data) => {
            const { cardId, listId, priorityLevel } = data;
            setCardPriorityLevel(cardId, listId, priorityLevel);
        });

        socket.on("invitationAccepted", (data) => {
            const { username, profileImage: _ } = data;
            addMemberToBoard({ username });
        });

        socket.on("getBoardWithMovedListAdded", (data) => {
            const { list, cards, index } = data;

            setBoardState((prev) => {
                const newLists = [...prev.lists];
                newLists.splice(index, 0, { ...list, cards });
                return { ...prev, lists: newLists };
            });
        });

        socket.on("listMoved", (data) => {
            const { listId: _, fromIndex, toIndex } = data;
            setBoardState((prev) => {
                const newLists = [...prev.lists];
                const currentList = newLists.splice(fromIndex, 1)[0];
                newLists.splice(toIndex, 0, currentList);
                return { ...prev, lists: newLists };
            });
        });

        socket.on("getBoardWithUpdatedLists", (data) => {
            setBoardState((prev) => {
                return { ...prev, lists: data };
            });
        });

        socket.on("getBoardWithUpdatedLists", (data) => {
            setBoardState((prev) => {
                return { ...prev, lists: data };
            });
        });

        socket.on("getBoardWithUpdatedTitle", (data) => {
            setBoardState((prev) => {
                return { ...prev, board: { ...prev.board, title: data } };
            });
        });

        socket.on("getBoardWithUpdatedDescription", (data) => {
            setBoardState((prev) => {
                return { ...prev, board: { ...prev.board, description: data } };
            });
        });

        socket.on("newList", (data) => {
            const newList = { ...data, cards: [] };
            addListToBoard(newList);
        });

        socket.on("deletedList", (listId) => {
            deleteList(listId);
        });

        socket.on("newCard", (data) => {
            const { search, priority, owner } = searchParamsFn();

            const card = data;

            if (search) {
                const includesSearch = card.title
                    .toLowerCase()
                    .includes(search.toLowerCase());
                card["hiddenByFilter"] = !includesSearch;
            }

            if (priority) {
                const includesFilter = card.priorityLevel === priority;
                card["hiddenByFilter"] = !includesFilter;
            }

            if (owner) {
                const includesFilter = card.owner === owner;
                card["hiddenByFilter"] = !includesFilter;
            }

            addCardToList(card.listId, card);
        });

        socket.on("copyCard", (data) => {
            const { search, priority } = searchParamsFn();

            const { card, index } = data;

            if (search) {
                const includesSearch = card.title
                    .toLowerCase()
                    .includes(search.toLowerCase());
                card["hiddenByFilter"] = !includesSearch;
            }

            if (priority) {
                const includesFilter = card.priorityLevel === priority;
                card["hiddenByFilter"] = !includesFilter;
            }

            addCopiedCard(card, index);
        });

        socket.on("deletedCard", (data) => {
            deleteCard(data.listId, data.cardId);
        });

        socket.on("cardMoved", (data) => {
            const { search, priority, owner } = searchParamsFn();

            const { oldListId, newListId, cardId, newCard: card } = data;

            if (search) {
                const includesSearch = card.title
                    .toLowerCase()
                    .includes(search.toLowerCase());
                card["hiddenByFilter"] = !includesSearch;
            }

            if (priority) {
                const includesFilter = card.priorityLevel === priority;
                card["hiddenByFilter"] = !includesFilter;
            }

            if (owner) {
                const includesFilter = card.owner === owner;
                card["hiddenByFilter"] = !includesFilter;
            }

            deleteCard(oldListId, cardId);
            addCardToList(newListId, card);
        });

        socket.on("cardMovedByIndex", (data) => {
            const { search, priority, owner } = searchParamsFn();

            let { cards, listId } = data;

            if (search) {
                cards = cards.map((card) => {
                    const includesSearch = card.title
                        .toLowerCase()
                        .includes(search.toLowerCase());
                    card["hiddenByFilter"] = !includesSearch;
                    return card;
                });
            }

            if (priority) {
                cards = cards.map((card) => {
                    const includesFilter = card.priorityLevel === priority;
                    card["hiddenByFilter"] = !includesFilter;
                    return card;
                });
            }

            if (owner) {
                cards = cards.map((card) => {
                    const includesFilter = card.owner === owner;
                    card["hiddenByFilter"] = !includesFilter;
                    return card;
                });
            }

            setBoardState((prev) => {
                return {
                    ...prev,
                    lists: prev.lists.map((list) =>
                        list._id === listId ? { ...list, cards } : list,
                    ),
                };
            });
        });

        socket.on("cardMovedToList", (data) => {
            const { search, priority, owner } = searchParamsFn();

            const { oldListId, newListId, insertedIndex, card } = data;

            if (search) {
                const includesSearch = card.title
                    .toLowerCase()
                    .includes(search.toLowerCase());
                card["hiddenByFilter"] = !includesSearch;
            }

            if (priority) {
                const includesFilter = card.priorityLevel === priority;
                card["hiddenByFilter"] = !includesFilter;
            }

            if (owner) {
                const includesFilter = card.owner === owner;
                card["hiddenByFilter"] = !includesFilter;
            }

            const cardId = card._id;
            deleteCard(oldListId, cardId);
            addCardToListByIndex(newListId, card, insertedIndex);
        });

        socket.on("updatedListTitle", (data) => {
            setListTitle(data.listId, data.title);
        });

        socket.on("updatedCardTitle", (data) => {
            setCardTitle(data.id, data.listId, data.title);
        });

        socket.on("updatedCardDescription", (data) => {
            setCardDescription(data.id, data.listId, data.description);
        });

        socket.on("updatedCardHighlight", (data) => {
            setCardHighlight(data.id, data.listId, data.highlight);
        });

        socket.on("updatedCardVerifiedStatus", (data) => {
            setCardVerifiedStatus(data.id, data.listId, data.verified);
        });

        socket.on("updatedCardDueDate", (data) => {
            setCardDueDate(data.id, data.listId, data.dueDate);
        });

        socket.on("receiveMessage", (data) => {
        });

        socket.on("messageDeleted", (data) => {
        });

        // CARD_COMMENT ========================================================

        socket.on("cardCommentAdded", (data) => {
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

        socket.on("cardCommentDeleted", (data) => {
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
        socket.on("cardAttachmentAdded", (data) => {
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

        socket.on("cardAttachmentDeleted", (data) => {
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
            // socket.off('receiveMessage');
            socket.off();
        };
    }, [boardId]);

    const setBoardVisibility = (value) => {
        setBoardState((prev) => {
            return { ...prev, board: { ...prev.board, visibility: value } };
        });
    };

    const setBoardTitle = (value) => {
        setBoardState((prev) => {
            return { ...prev, board: { ...prev.board, title: value } };
        });
    };

    const setBoardDescription = (value) => {
        setBoardState((prev) => {
            return { ...prev, board: { ...prev.board, description: value } };
        });
    };

    const setListTitle = (listId, value) => {
        setBoardState((prev) => {
            return {
                ...prev,
                lists: prev.lists.map((list) =>
                    list._id === listId ? { ...list, title: value } : list,
                ),
            };
        });
    };

    const setCardTitle = (cardId, listId, value) => {
        setBoardState((prev) => {
            return {
                ...prev,
                lists: prev.lists.map((list) =>
                    list._id === listId
                        ? {
                              ...list,
                              cards: list.cards.map((card) =>
                                  card._id === cardId
                                      ? { ...card, title: value }
                                      : card,
                              ),
                          }
                        : list,
                ),
            };
        });
    };

    const setCardDescription = (cardId, listId, value) => {
        setBoardState((prev) => {
            return {
                ...prev,
                lists: prev.lists.map((list) =>
                    list._id === listId
                        ? {
                              ...list,
                              cards: list.cards.map((card) =>
                                  card._id === cardId
                                      ? { ...card, description: value }
                                      : card,
                              ),
                          }
                        : list,
                ),
            };
        });
    };

    const setCardHighlight = (cardId, listId, value) => {
        setBoardState((prev) => {
            return {
                ...prev,
                lists: prev.lists.map((list) =>
                    list._id === listId
                        ? {
                              ...list,
                              cards: list.cards.map((card) =>
                                  card._id === cardId
                                      ? { ...card, highlight: value }
                                      : card,
                              ),
                          }
                        : list,
                ),
            };
        });
    };

    const setCardDetailHighlight = (highlight) => {
        setOpenedCard((prev) => {
            return { ...prev, highlight };
        });
    };

    const setCardDetailListId = (listId) => {
        setOpenedCard((prev) => {
            return { ...prev, listId };
        });
    };

    const setCardQuickEditorHighlight = (highlight) => {
        setOpenedCardQuickEditor((prev) => {
            return { ...prev, card: { ...prev.card, highlight } };
        });
    };

    const setCardOwner = (cardId, listId, value) => {
        setBoardState((prev) => {
            return {
                ...prev,
                lists: prev.lists.map((list) =>
                    list._id === listId
                        ? {
                              ...list,
                              cards: list.cards.map((card) =>
                                  card._id === cardId
                                      ? { ...card, owner: value }
                                      : card,
                              ),
                          }
                        : list,
                ),
            };
        });
    };

    const setCardPriorityLevel = (cardId, listId, value) => {
        setBoardState((prev) => {
            return {
                ...prev,
                lists: prev.lists.map((list) =>
                    list._id === listId
                        ? {
                              ...list,
                              cards: list.cards.map((card) =>
                                  card._id === cardId
                                      ? { ...card, priorityLevel: value }
                                      : card,
                              ),
                          }
                        : list,
                ),
            };
        });
    };

    const setCardVerifiedStatus = (cardId, listId, value) => {
        setBoardState((prev) => {
            return {
                ...prev,
                lists: prev.lists.map((list) =>
                    list._id === listId
                        ? {
                              ...list,
                              cards: list.cards.map((card) =>
                                  card._id === cardId
                                      ? { ...card, verified: value }
                                      : card,
                              ),
                          }
                        : list,
                ),
            };
        });
    };

    const setCardDueDate = (cardId, listId, value) => {
        setBoardState((prev) => {
            return {
                ...prev,
                lists: prev.lists.map((list) =>
                    list._id === listId
                        ? {
                              ...list,
                              cards: list.cards.map((card) =>
                                  card._id === cardId
                                      ? { ...card, dueDate: value }
                                      : card,
                              ),
                          }
                        : list,
                ),
            };
        });
    };

    const addListToBoard = (list) => {
        setBoardState((prev) => {
            return {
                ...prev,
                lists: [...prev.lists, { ...list, cards: [] }],
            };
        });
    };

    const addCardToList = (listId, card) => {
        setBoardState((prev) => {
            return {
                ...prev,
                lists: prev.lists.map((list) =>
                    list._id === listId
                        ? { ...list, cards: [...list.cards, card] }
                        : list,
                ),
            };
        });
    };

    const addCardToListByIndex = (listId, card, index) => {
        setBoardState((prev) => {
            return {
                ...prev,
                lists: prev.lists.map((list) => {
                    if (list._id === listId) {
                        const cards = [...list.cards];
                        cards.splice(index, 0, card);
                        return { ...list, cards };
                    } else {
                        return list;
                    }
                }),
            };
        });
    };

    const addCopiedCard = (card, index) => {
        setBoardState((prev) => {
            return {
                ...prev,
                lists: prev.lists.map((list) => {
                    if (list._id === card.listId) {
                        const cards = [...list.cards];
                        cards.splice(index + 1, 0, card);
                        return { ...list, cards };
                    } else {
                        return list;
                    }
                }),
            };
        });
    };

    const deleteCard = (listId, cardId) => {
        setBoardState((prev) => {
            return {
                ...prev,
                lists: prev.lists.map((list) =>
                    list._id === listId
                        ? {
                              ...list,
                              cards: list.cards.filter(
                                  (card) => card._id !== cardId,
                              ),
                          }
                        : list,
                ),
            };
        });
    };

    const deleteList = (listId) => {
        setBoardState((prev) => {
            return {
                ...prev,
                lists: prev.lists.filter((list) => list._id != listId),
            };
        });
    };

    const collapseList = (listId, collapsed = true) => {
        setBoardState((prev) => {
            return {
                ...prev,
                lists: prev.lists.map((list) =>
                    list._id === listId ? { ...list, collapsed } : list,
                ),
            };
        });
    };

    const removeMemberFromBoard = (memberName) => {
        setBoardState((prev) => {
            return {
                ...prev,
                members: prev.members.filter(
                    (member) => member.username !== memberName,
                ),
            };
        });
    };

    const addMemberToBoard = (member) => {
        setBoardState((prev) => {
            return {
                ...prev,
                members: [
                    ...prev.members,
                    {
                        username: member.username,
                        profileImage: member.profileImage,
                    },
                ],
            };
        });
    };

    return (
        <BoardStateContext.Provider
            value={{
                boardState,
                setBoardState,

                setBoardVisibility,
                setBoardTitle,
                setBoardDescription,

                setListTitle,
                deleteList,
                collapseList,

                setCardTitle,
                setCardDescription,
                setCardHighlight,
                setCardOwner,
                setCardPriorityLevel,
                setCardVerifiedStatus,
                setCardDueDate,

                deleteCard,

                addListToBoard,
                addCardToList,
                addCopiedCard,

                removeMemberFromBoard,
                addMemberToBoard,

                isRemoved,
                setIsRemoved,

                openedCard,
                setOpenedCard,

                openCardDetail,
                setOpenCardDetail,

                openedCardQuickEditor,
                setOpenedCardQuickEditor,

                setCardDetailHighlight,
                setCardDetailListId,

                setCardQuickEditorHighlight,

                openMoveListForm,
                setOpenMoveListForm,

                listToMove,
                setListToMove,

                focusedCard,
                setFocusedCard,

                theme,
                setTheme,
                debugModeEnabled,
                setDebugModeEnabled,

                hasFilter,
                setHasFilter,

                isConnected,
                setIsConnected,

                // chatMessageToast,
                // setChatMessageToast,
                //
                // hasReceivedNewMessage,
                // setHasReceivedNewMessage,
                // isAtBottomOfChat,
                // setIsAtBottomOfChat,

                windowWidth,
                isLargeScreen,

                socket,
            }}
        >
            {children}
        </BoardStateContext.Provider>
    );
};

export default BoardStateContext;
