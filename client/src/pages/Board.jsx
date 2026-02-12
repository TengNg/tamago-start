import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { lexorank } from "../utils/class/Lexorank";
import useBoardState from "../hooks/useBoardState";
import useKeyBinds from "../hooks/useKeyBinds";
import useCardActions from "../hooks/useCardActions";
import useFetchCardDetail from "../hooks/useFetchCardDetail";
import ListContainer from "../components/list/ListContainer";
import InvitationForm from "../components/invitation/InvitationForm";
import BoardMenu from "../components/board/BoardMenu";
import ChatBox from "../components/chat/ChatBox";
import CopyBoardForm from "../components/board/CopyBoardForm";
import FloatingChat from "../components/chat/FloatingChat";
import MoveListForm from "../components/list/MoveListForm";
import CardModal from "../components/card/CardModal";
import CardQuickEditor from "../components/card/CardQuickEditor";
import Members from "../components/board/Members";
import Configuration from "../components/board/Configuration";
import Filter from "../components/action-menu/Filter";
import VisibilityConfig from "../components/board/VisibilityConfig";
import KeyBindings from "../components/ui/KeyBindings";
import BoardActivities from "../components/activity-history/BoardActivities";
import ChatMessageToast from "../components/ui/ChatMessageToast";
import VISIBILITY_MAP from "../data/visibility";
import useCurrentUserContext from "../hooks/useCurrentUserContext";
import { axiosPrivate } from "../api/axios";
import useToast from "../hooks/useToast";

const chatsPerPage = 50;

const Board = () => {
    const { currentUser, currentUserQuery } = useCurrentUserContext();

    const {
        boardState,
        setBoardState,

        setBoardTitle,
        setChats,

        // check if board is deleted or not
        isRemoved,
        setIsRemoved,

        focusedCard,
        setFocusedCard,

        setOpenedCard,

        openCardDetail,
        setOpenCardDetail,

        setCardDetailListId,

        addCardToList,
        openedCardQuickEditor,
        setOpenedCardQuickEditor,
        openedCard: _openedCard,

        addCopiedCard,
        deleteCard,

        // for configuration
        theme,
        setTheme,
        debugModeEnabled,
        setDebugModeEnabled,

        // for filter indicator
        hasFilter,

        // socket connection state
        isConnected,

        chatMessageToast,
        setChatMessageToast,

        setIsAtBottomOfChat,

        hasReceivedNewMessage,
        setHasReceivedNewMessage,

        socket,
    } = useBoardState();

    const {
        openMembers,
        setOpenMembers,
        openFilter,
        setOpenFilter,
        openChatBox,
        setOpenChatBox,
        openFloatingChat,
        setOpenFloatingChat,
        openInvitationForm,
        setOpenInvitationForm,
        openAddList,
        setOpenAddList,
        openKeyBindings,
        setOpenKeyBindings,
        openConfiguration: openBoardConfiguration,
        setOpenConfiguration: setOpenBoardConfiguration,
        openBoardActivities,
        setOpenBoardActivities,
    } = useKeyBinds();

    const [openBoardMenu, setOpenBoardMenu] = useState(false);
    const [openCopyBoardForm, setOpenCopyBoardForm] = useState(false);

    const [cardDetailAbortController, setCardDetailAbortController] =
        useState(null);

    // chat messages ==================================================================================================
    const [chatsPage, setChatsPage] = useState(1);
    const [isFetchingMoreMessages, setIsFetchingMoreMessages] =
        useState(undefined);
    const [allMessagesFetched, setAllMessagesFetched] = useState(false);

    const [title, setTitle] = useState("");
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [error, setError] = useState({ msg: undefined });
    const [chatError, setChatError] = useState({ msg: undefined });

    const [openVisibilityConfig, setOpenVisibilityConfig] = useState(false);
    const [processingCard, setProcessingCard] = useState({
        msg: "loading...",
        processing: false,
    });

    const { boardId } = useParams();
    const navigate = useNavigate();

    const toast = useToast();

    useEffect(() => {
        if (isRemoved) {
            navigate("/notfound");
            setIsRemoved(false);
        }
    }, [isRemoved]);

    useFetchCardDetail({
        stateHooks: {
            setCardDetailAbortController,
            setOpenCardDetail,
            setOpenedCard,
        },
    });

    useCardActions({
        stateHooks: {
            setFocusedCard,
            setOpenedCardQuickEditor,
        },
        effectDeps: {
            boardState,
            focusedCard,
            hasFilter,
        },
    });

    useEffect(() => {
        socket.connect();

        setChats([]);
        setIsDataLoaded(false);

        const fetchBoardData = async () => {
            const boardResponse = await axiosPrivate.get(`/boards/${boardId}`);
            setBoardState(boardResponse.data);
            setTitle(boardResponse.data.board.title);
            setIsDataLoaded(true);
            document.title = boardResponse.data.board.title;
        };

        const fetchChat = async () => {
            const chatsResponse = await axiosPrivate.get(
                `/chats/b/${boardId}?perPage=10&page=1`,
            );
            const newMessages = chatsResponse.data.messages.reverse();
            setChats(newMessages);
            setChatsPage(2);
            setOpenChatBox(false);
            setOpenFloatingChat(false);
        };

        fetchBoardData().catch((err) => {
            const errMsg = err?.response?.data?.msg || "Failed to load Board";
            setError({ msg: errMsg });
            socket.emit("disconnectFromBoard");
        });

        fetchChat().catch((err) => {
            const errMsg = err?.response?.data?.msg || "Failed to load Chat";
            setChatError(errMsg);
        });

        setIsDataLoaded(true);

        return () => {
            socket.disconnect();
        };
    }, [boardId]);

    // fetching chat messages from current board =======================================================================
    const fetchMessages = async () => {
        setHasReceivedNewMessage(false);
        setIsFetchingMoreMessages(true);

        try {
            const chatsResponse = await axiosPrivate.get(
                `/chats/b/${boardId}?perPage=${chatsPerPage}&page=${chatsPage}`,
            );
            const newMessages = chatsResponse.data.messages.reverse();

            if (newMessages.length === 0) {
                setAllMessagesFetched(true);
            } else {
                setChats((prevMessages) => [...newMessages, ...prevMessages]);
                setChatsPage((prevPage) => prevPage + 1);
            }
        } catch (err) {
            toast.error("Failed to load messages");
            setIsFetchingMoreMessages(false);
        }

        setIsFetchingMoreMessages(false);
    };

    // card process wrapper => set loading state =======================================================================
    const withCardProcessWrapper = (handleFunction) => {
        return async (...args) => {
            try {
                setProcessingCard({
                    msg: "processing...",
                    processing: true,
                });

                await handleFunction(...args);

                setProcessingCard((prev) => {
                    return { ...prev, processing: false };
                });
            } catch (err) {
                toast.error("Process failed");
                setProcessingCard({
                    msg: "",
                    processing: false,
                });
            }
        };
    };

    const handleConfirmBoardTitle = async (value) => {
        if (value === "") {
            setBoardTitle(title);
            return;
        }

        try {
            const response = await axiosPrivate.patch(
                `/boards/${boardState.board._id}/new-title`,
                JSON.stringify({ title: value }),
            );
            setTitle(response.data.newBoard.title);
            setBoardTitle(response.data.newBoard.title);

            socket.emit("updateBoardTitle", value);
        } catch (err) {
            toast.error("Failed to update board title");
        }
    };

    const handleBoardTitleInputOnKeyDown = (e) => {
        if (e.key == "Enter" && !e.shiftKey) {
            e.target.blur();
        }
    };

    const handleBoardTitleInputOnBlur = async (e) => {
        handleConfirmBoardTitle(e.target.value.trim());
    };

    const handlePinBoard = async (e) => {
        if (e.button !== 0) return;

        try {
            await axiosPrivate.patch(`/boards/${boardState.board._id}/pinned/`);
            await currentUserQuery.refetch();
        } catch (err) {
            toast.error("Failed to pin board");
        }
    };

    const handleDeleteCard = withCardProcessWrapper(async (card) => {
        try {
            await axiosPrivate.delete(`/cards/${card._id}`);
            deleteCard(card.listId, card._id);
            socket.emit("deleteCard", {
                listId: card.listId,
                cardId: card._id,
            });
        } catch (err) {
            toast.error("Failed to delete card");
        }
    });

    const handleMoveCardToList = withCardProcessWrapper(
        async (card, newListId) => {
            try {
                const { _id: cardId, listId: oldListId } = card;

                const oldList = boardState.lists.find(
                    (list) => list._id === oldListId,
                );
                const currentIndex = oldList.cards.findIndex(
                    (el) => el._id == card._id,
                );

                const currentList = boardState.lists.find(
                    (list) => list._id === newListId,
                );
                const cards = currentList.cards;
                const [rank, ok] = lexorank.insert(
                    cards[cards.length - 1]?.order,
                    undefined,
                );

                if (!ok) {
                    throw new Error("Failed to reorder card");
                }

                const response = await axiosPrivate.patch(
                    `/cards/${cardId}/reorder`,
                    JSON.stringify({
                        rank,
                        listId: newListId,
                        sourceIndex: currentIndex,
                        destinationIndex: cards.length - 1,
                    }),
                );
                const { newCard } = response.data;

                // delete card from old list, and add the current card to the new list
                deleteCard(oldListId, cardId);
                addCardToList(newListId, newCard);

                // [card details is opened] => update list id
                setCardDetailListId(newListId);

                socket.emit("moveCard", {
                    oldListId,
                    newListId,
                    cardId,
                    newCard,
                });
            } catch (err) {
                toast.error("Failed to move card");
            }
        },
    );

    const handleCopyCard = withCardProcessWrapper(async (card) => {
        try {
            const currentList = [...boardState.lists].find(
                (list) => list._id == card.listId,
            );
            const cards = currentList.cards;

            const currentIndex = cards.findIndex((el) => el._id == card._id);
            const [rank, ok] = lexorank.insert(
                cards[currentIndex]?.order,
                cards[currentIndex + 1]?.order,
            );

            if (!ok) {
                toast.error(
                    "Failed to create a copy of this card, rank is not valid",
                );
                return;
            }

            const response = await axiosPrivate.post(
                `/cards/${card._id}/copy`,
                JSON.stringify({ rank }),
            );
            const { newCard } = response.data;

            addCopiedCard(newCard, currentIndex);

            socket.emit("copyCard", { card: newCard, index: currentIndex });
        } catch (err) {
            if (err.response?.status === 503) {
                toast.error(
                    "Action is processing, this maybe done by other user, please try again later",
                );
                return;
            }

            toast.error(err.response?.data?.message || "Failed to copy card");
        }
    });

    const handleMoveCardByIndex = withCardProcessWrapper(
        async (card, insertedIndex) => {
            try {
                const currentList = boardState.lists.find(
                    (list) => list._id == card.listId,
                );
                const cards = currentList.cards;
                const currentIndex = cards.findIndex(
                    (el) => el._id == card._id,
                );
                const prev = insertedIndex - 1;
                const next = insertedIndex;

                const [rank, ok] = lexorank.insert(
                    cards[prev]?.order,
                    cards[next]?.order,
                );
                if (!ok) return;

                const [moved] = cards.splice(currentIndex, 1);
                moved.order = rank;

                cards.splice(insertedIndex, 0, moved);
                setBoardState((prev) => {
                    return {
                        ...prev,
                        lists: prev.lists.map((list) =>
                            list._id === card.listId
                                ? { ...list, cards }
                                : list,
                        ),
                    };
                });

                await axiosPrivate.patch(
                    `/cards/${card._id}/reorder`,
                    JSON.stringify({
                        rank,
                        listId: card.listId,
                        sourceIndex: currentIndex,
                        destinationIndex: insertedIndex,
                    }),
                );
                socket.emit("moveCardByIndex", { cards, listId: card.listId });
            } catch (err) {
                toast.error("Failed to move this card");
            }
        },
    );

    const handleSendMessage = async (value) => {
        setIsAtBottomOfChat(true);

        const msgTrackedId = crypto.randomUUID();

        const newMessage = {
            trackedId: msgTrackedId,
            content: value,
            type: "MESSAGE",
            sentBy: { username: currentUser.username },
        };

        setChats((prev) => {
            return [...prev, { ...newMessage }];
        });

        try {
            const response = await axiosPrivate.post(
                `/chats/b/${boardState.board._id}`,
                JSON.stringify({
                    content: value,
                    trackedId: newMessage.trackedId,
                }),
            );
            const chatMsg = response.data.chat;
            const { type, trackedId, createdAt } = chatMsg;
            setChats((prev) => {
                return prev.map((chat) =>
                    chat.trackedId === trackedId
                        ? { ...chat, type, createdAt: createdAt }
                        : chat,
                );
            });
            socket.emit("sendMessage", {
                ...newMessage,
                type,
                createdAt: chatMsg.createdAt,
                sentBy: {
                    ...newMessage.sentBy,
                    username: currentUser.username,
                },
            });
            setHasReceivedNewMessage(true);
        } catch (err) {
            console.log(err);

            setChats((prev) => {
                return prev.map((chat) =>
                    chat.trackedId === msgTrackedId
                        ? { ...chat, error: true }
                        : chat,
                );
            });
        }
    };

    const handleDeleteMessage = async (trackedId) => {
        try {
            if (confirm("Remove this message, are you sure?")) {
                const response = await axiosPrivate.delete(
                    `/chats/b/${boardState.board._id}/chats/${trackedId}`,
                );
                const deletedMessage = response.data?.deletedMessage;

                if (!deletedMessage) {
                    toast.error("Failed to delete this message");
                    return;
                }

                setChats((prev) => {
                    return prev.filter(
                        (chat) => chat.trackedId !== deletedMessage.trackedId,
                    );
                });

                socket.emit("deleteMessage", {
                    trackedId: deletedMessage.trackedId,
                });
            }
        } catch (err) {
            toast.error("Failed to delete this message");
        }
    };

    const handleClearChatMessages = async () => {
        try {
            if (confirm("All chat messages will be clear, are you sure ?")) {
                await axiosPrivate.delete(`/chats/b/${boardState.board._id}`);
                socket.emit("clearMessages");
                setChats([]);
            }
        } catch (err) {
            toast.error("Failed to clear chat messages");
        }
    };

    const handleChangeTheme = (value) => {
        setTheme((prev) => {
            return { ...prev, itemTheme: value };
        });
    };

    const handleToggleEnableDebugMode = () => {
        setDebugModeEnabled((prev) => {
            return { ...prev, enabled: !prev.enabled };
        });
    };

    if (!socket) {
        return (
            <section className="w-full flex flex-col justify-center items-center gap-4">
                <p className="font-medium mx-auto text-center mt-20 text-gray-600">
                    failed to connect, please try again
                </p>
            </section>
        );
    }

    if (error?.msg) {
        return (
            <section className="w-full flex flex-col justify-center items-center gap-4">
                <p className="font-medium mx-auto text-center mt-20 text-gray-600">
                    {error.msg}
                </p>
            </section>
        );
    }

    if (isDataLoaded === false || boardState?.board === undefined) {
        return (
            <>
                <div className="font-medium mx-auto text-center mt-20 text-gray-600">
                    getting board data
                </div>
                <div className="loader mx-auto my-8"></div>
            </>
        );
    }

    if (!isConnected) {
        return (
            <section className="w-full flex flex-col justify-center items-center gap-4">
                <p className="font-medium mx-auto text-center mt-20 text-gray-600">
                    connecting to board
                </p>

                <div className="loader mx-auto my-8"></div>

                <button
                    className="button--style text-sm hover:bg-gray-600 hover:text-gray-100"
                    onClick={() => navigate("/boards")}
                >
                    Back to Boards
                </button>

                <br />
                <p className="text-[11px] text-center text-gray-500">
                    (initialize connection, it might take sometimes)
                </p>
                <p className="text-[11px] text-center text-gray-500">
                    If this is taking longer than expected. <br />
                    Please check your internet connection or try again in a
                    moment.
                </p>
            </section>
        );
    }

    return (
        <>
            <CardModal
                abortController={cardDetailAbortController}
                open={openCardDetail}
                setOpen={setOpenCardDetail}
                processingCard={processingCard}
                handleDeleteCard={handleDeleteCard}
                handleCopyCard={handleCopyCard}
                handleMoveCardToList={handleMoveCardToList}
                handleMoveCardByIndex={handleMoveCardByIndex}
            />

            {openCopyBoardForm && (
                <CopyBoardForm
                    open={openCopyBoardForm}
                    setOpen={setOpenCopyBoardForm}
                />
            )}

            {openedCardQuickEditor?.open && (
                <CardQuickEditor
                    card={openedCardQuickEditor.card}
                    attribute={openedCardQuickEditor.attribute}
                    open={openedCardQuickEditor.open}
                    handleDeleteCard={handleDeleteCard}
                    handleCopyCard={handleCopyCard}
                />
            )}

            <BoardActivities
                open={openBoardActivities}
                setOpen={setOpenBoardActivities}
            />

            <KeyBindings open={openKeyBindings} setOpen={setOpenKeyBindings} />

            <MoveListForm />

            <Configuration
                open={openBoardConfiguration}
                setOpen={setOpenBoardConfiguration}
                theme={theme}
                debugModeEnabled={debugModeEnabled}
                handleChangeTheme={handleChangeTheme}
                handleToggleEnableDebugMode={handleToggleEnableDebugMode}
            />

            <Filter open={openFilter} setOpen={setOpenFilter} />

            <VisibilityConfig
                open={openVisibilityConfig}
                setOpen={setOpenVisibilityConfig}
            />

            <Members open={openMembers} setOpen={setOpenMembers} />

            <InvitationForm
                open={openInvitationForm}
                setOpen={setOpenInvitationForm}
            />

            <ChatBox
                error={chatError}
                open={openChatBox}
                setOpen={setOpenChatBox}
                setOpenFloat={setOpenFloatingChat}
                sendMessage={handleSendMessage}
                deleteMessage={handleDeleteMessage}
                clearMessages={handleClearChatMessages}
                isFetchingMore={isFetchingMoreMessages}
                allMessagesFetched={allMessagesFetched}
                isFetching={isDataLoaded}
                fetchMessages={fetchMessages}
                hasReceivedNewMessage={hasReceivedNewMessage}
                setHasReceivedNewMessage={setHasReceivedNewMessage}
            />

            {!chatError.msg && (
                <FloatingChat
                    error={chatError}
                    open={openFloatingChat}
                    setOpen={setOpenFloatingChat}
                    setOpenChatBox={setOpenChatBox}
                    sendMessage={handleSendMessage}
                    deleteMessage={handleDeleteMessage}
                    clearMessages={handleClearChatMessages}
                    isFetchingMore={isFetchingMoreMessages}
                    allMessagesFetched={allMessagesFetched}
                    isFetching={isDataLoaded}
                    fetchMessages={fetchMessages}
                    hasReceivedNewMessage={hasReceivedNewMessage}
                    setHasReceivedNewMessage={setHasReceivedNewMessage}
                />
            )}

            <div className="w-full h-[calc(100vh-8rem)] flex flex-col justify-start gap-3 items-start bg-transparent">
                <div className="flex flex-wrap justify-between w-full z-20 px-4">
                    <div>
                        <input
                            maxLength={80}
                            className={`flex-1 bg-transparent overflow-hidden text-gray-700 whitespace-nowrap text-ellipsis border-b-[2px] bg-gray-100 border-gray-700 py-1 font-medium sm:font-bold select-none mb-2 focus:outline-none`}
                            id="board-title-input"
                            style={{
                                width: `${boardState.board.title.length}ch`,
                                minWidth: "1ch",
                                maxWidth: "400px",
                            }}
                            onKeyDown={(e) => handleBoardTitleInputOnKeyDown(e)}
                            onChange={(e) => setBoardTitle(e.target.value)}
                            onBlur={(e) => handleBoardTitleInputOnBlur(e)}
                            value={boardState.board.title}
                        />
                    </div>

                    <div
                        className="flex h-[2.25rem] gap-2 z-20"
                        id="board-options-wrapper"
                    >
                        <div>
                            <div
                                onClick={() => setOpenChatBox((prev) => !prev)}
                                className={`bg-[rgb(var(--card-item-bg))] h-full flex--center cursor-pointer select-none border-gray-600 shadow-gray-600 w-[80px] px-4 border-[2px] text-[0.75rem] text-gray-600 font-medium
                                        ${openChatBox || openFloatingChat ? "shadow-[0_1px_0_0] mt-[2px]" : "shadow-[0_3px_0_0]"}`}
                            >
                                chat
                            </div>
                        </div>

                        <div>
                            <div
                                onClick={() => setOpenFilter((prev) => !prev)}
                                className={`bg-[rgb(var(--card-item-bg))] h-full flex--center cursor-pointer select-none border-gray-600 shadow-gray-600 w-[80px] px-4 border-[2px] text-[0.75rem] text-gray-600 font-medium
                                        ${openFilter ? "shadow-[0_1px_0_0] mt-[2px]" : "shadow-[0_3px_0_0]"} ${hasFilter ? "text-white bg-teal-600" : ""}`}
                            >
                                filter
                            </div>
                        </div>

                        <div>
                            <div
                                onClick={() => setOpenInvitationForm(true)}
                                className={`bg-[rgb(var(--card-item-bg))] h-full flex--center cursor-pointer select-none border-gray-600 shadow-gray-600 w-[80px] px-4 border-[2px] text-[0.75rem] text-gray-600 font-medium
                                        ${openInvitationForm ? "shadow-[0_1px_0_0] mt-[2px]" : "shadow-[0_3px_0_0]"}`}
                            >
                                invite
                            </div>
                        </div>

                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    if (e.target === e.currentTarget) {
                                        setOpenBoardMenu((prev) => !prev);
                                    }
                                }}
                                className={`bg-[rgb(var(--card-item-bg))] h-full flex--center cursor-pointer select-none border-gray-600 shadow-gray-600 w-[80px] px-4 border-[2px] text-[0.75rem] text-gray-600 font-medium
                                    ${openBoardMenu ? "shadow-[0_1px_0_0] mt-[2px]" : "shadow-[0_3px_0_0]"}`}
                            >
                                options
                            </button>

                            {openBoardMenu && (
                                <BoardMenu
                                    open={setOpenBoardMenu}
                                    setOpen={setOpenBoardMenu}
                                    board={boardState.board}
                                    setOpenCopyBoardForm={setOpenCopyBoardForm}
                                    setOpenBoardConfiguration={
                                        setOpenBoardConfiguration
                                    }
                                    setOpenBoardActivities={
                                        setOpenBoardActivities
                                    }
                                />
                            )}
                        </div>
                    </div>
                </div>

                <div className="w-[100vw]">
                    <ListContainer
                        openAddList={openAddList}
                        setOpenAddList={setOpenAddList}
                    />
                </div>
            </div>

            <div
                id="bottom-buttons"
                className="flex items-center h-[50px] px-4 gap-2"
            >
                <button
                    className={`
                        w-[100px] ${openMembers ? "mt-1 text-gray-100 shadow-[0_1px_0_0]" : "shadow-gray-600 shadow-[0_3px_0_0]"}
                        bg-[rgb(var(--card-item-bg))] border-[2px] border-gray-600 text-gray-600 px-3 py-2 text-[0.65rem] sm:text-[0.65rem] font-medium
                    `}
                    onClick={() => {
                        setOpenMembers((prev) => !prev);
                    }}
                >
                    members
                </button>

                <button
                    onClick={handlePinBoard}
                    className={`
                        w-[100px] ${currentUser.pinnedBoardIdCollection?.hasOwnProperty(boardId) ? "mt-1 text-gray-100 shadow-[0_1px_0_0]" : "shadow-gray-600 shadow-[0_3px_0_0]"}
                        bg-[rgb(var(--card-item-bg))] border-[2px] border-gray-600 text-gray-600 px-3 py-2 text-[0.65rem] sm:text-[0.65rem] font-medium
                    `}
                >
                    {currentUser.pinnedBoardIdCollection?.hasOwnProperty(
                        boardId,
                    ) ? (
                        <div className="flex justify-center items-center gap-2">
                            <span>*pinned</span>
                        </div>
                    ) : (
                        <div className="flex justify-center items-center gap-1">
                            <span>pin</span>
                        </div>
                    )}
                </button>

                <button
                    onClick={() => setOpenVisibilityConfig((prev) => !prev)}
                    className={`
                        w-fit ${openVisibilityConfig ? "mt-1 text-gray-100 shadow-[0_1px_0_0]" : "shadow-gray-600 shadow-[0_3px_0_0]"}
                        bg-[rgb(var(--card-item-bg))] border-[2px] border-gray-600 text-gray-600 px-3 py-2 text-[0.65rem] sm:text-[0.65rem] font-medium
                    `}
                >
                    visibility:
                    <span>{VISIBILITY_MAP[boardState.board?.visibility]}</span>
                </button>

                <div className="flex gap-3 ms-3 text-[0.75rem] items-center justify-center text-gray-700">
                    <p className="md:block hidden select-none m-0 p-0">
                        lists: {boardState?.lists?.length || 0} / 20
                    </p>

                    <button
                        className="sm:grid place-items-center hidden w-[1.5rem] h-[1.5rem] bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-full"
                        onClick={() => {
                            setOpenKeyBindings((prev) => !prev);
                        }}
                        title="open help"
                    >
                        ?
                    </button>
                </div>
            </div>

            <ChatMessageToast
                toast={chatMessageToast}
                setToast={setChatMessageToast}
                isChatOpen={openFloatingChat}
                setOpenChatBox={setOpenChatBox}
                setOpenFloatingChat={setOpenFloatingChat}
                hasReceivedNewMessage={hasReceivedNewMessage}
            />
        </>
    );
};

export default Board;
