import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { lexorank } from "../lib/lexorank";
import useBoardState from "../hooks/useBoardState";
import useCardActions from "../hooks/useCardActions";
import useFetchCardDetail from "../hooks/useFetchCardDetail";
import ListContainer from "../components/list/ListContainer";
import InvitationForm from "../components/invitation/InvitationForm";
import BoardOptions from "../components/board/BoardOptions";
import CopyBoardForm from "../components/board/CopyBoardForm";
import MoveListForm from "../components/list/MoveListForm";
import CardModal from "../components/card/CardModal";
import CardQuickEditor from "../components/card/CardQuickEditor";
import Members from "../components/board/Members";
import Configuration from "../components/board/Configuration";
import Filter from "../components/action-menu/Filter";
import VisibilityConfig from "../components/board/VisibilityConfig";
import KeyBindings from "../components/ui/KeyBindings";
import BoardActivities from "../components/activity-history/BoardActivities";
import useCurrentUserContext from "../hooks/useCurrentUserContext";
import { axiosPrivate } from "../api/axios";
import useToast from "../hooks/useToast";
import { fetchBoard } from "../api/boardApi";
import { useQuery } from "@tanstack/react-query";
import ChatBox from "../components/chat/ChatBox";
import { BOARD_ACTIONS } from "../state/boardActionTypes";
import { SOCKET_EVENTS } from "@shared/socket-events.js";

const Board = () => {
    const { currentUser, currentUserQuery } = useCurrentUserContext();

    const {
        boardState,
        dispatch,

        updateBoardField,

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

        openMembers,
        setOpenMembers,
        openFilter,
        setOpenFilter,
        openChatBox,
        setOpenChatBox,
        openInvitationForm,
        setOpenInvitationForm,
        setOpenKeyBindings,
        setOpenConfiguration: setOpenBoardConfiguration,
        setOpenBoardActivities,
        openVisibilityConfig,
        setOpenVisibilityConfig,

        socket,
    } = useBoardState();

    const [openBoardOptions, setOpenBoardOptions] = useState(false);
    const [openCopyBoardForm, setOpenCopyBoardForm] = useState(false);

    const [cardDetailAbortController, setCardDetailAbortController] =
        useState(null);

    const [initialTitle, setInitialTitle] = useState("");

    const [processingCard, setProcessingCard] = useState({
        msg: "loading...",
        processing: false,
    });

    const { boardId } = useParams();
    const navigate = useNavigate();

    const toast = useToast();
    const boardQuery = useQuery({
        queryKey: ["boards", boardId],
        queryFn: () => fetchBoard(boardId),
    });

    useEffect(() => {
        if (boardQuery.isSuccess && boardQuery.data) {
            socket.connect();
            dispatch({
                type: BOARD_ACTIONS.SET_STATE,
                payload: {
                    data: boardQuery.data,
                },
            });
        }

        return () => socket.disconnect();
    }, [boardQuery.isSuccess, boardQuery.data]);

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
                const errMsg = err?.response?.data?.message || "Process failed";
                toast.error(errMsg);
                setProcessingCard({
                    msg: "",
                    processing: false,
                });
            }
        };
    };

    const handleConfirmBoardTitle = async (value) => {
        if (value === "") {
            updateBoardField({ field: "title", value: initialTitle });
            return;
        }

        try {
            const response = await axiosPrivate.patch(
                `/boards/${boardState.board._id}/new-title`,
                JSON.stringify({ title: value }),
            );
            setInitialTitle(response.data.newBoard.title);
            updateBoardField({
                field: "title",
                value: response.data.newBoard.title,
            });

            socket.emit(SOCKET_EVENTS.BOARD_UPDATE_TITLE, value);
        } catch (err) {
            const errMsg =
                err.response?.data?.message || "Failed to update board title";
            toast.error(errMsg);
            updateBoardField({ field: "title", value: initialTitle });
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
            await axiosPrivate.patch(
                `/me/pinned-boards/${boardState.board._id}`,
            );
            await currentUserQuery.refetch();
        } catch (err) {
            const errMsg =
                err?.response?.data?.message || "Failed to pin board";
            toast.error(errMsg);
        }
    };

    const handleDeleteCard = withCardProcessWrapper(async (card) => {
        try {
            await axiosPrivate.delete(`/cards/${card._id}`);
            deleteCard(card.listId, card._id);
            socket.emit(SOCKET_EVENTS.CARD_DELETE, {
                listId: card.listId,
                cardId: card._id,
            });
        } catch (err) {
            const errMsg =
                err?.response?.data?.message || "Failed to delete card";
            toast.error(errMsg);
        }
    });

    const handleMoveCardToList = withCardProcessWrapper(
        async (card, newListId) => {
            try {
                const { _id: cardId, listId: oldListId } = card;

                const currentIndex = boardState.cards[oldListId].findIndex(
                    (el) => el._id == card._id,
                );

                const newList = boardState.lists.find(
                    (list) => list._id === newListId,
                );

                const cardsFromNewList = boardState.cards[newList._id];
                const [rank, ok] = lexorank.insert(
                    cardsFromNewList[cardsFromNewList.length - 1]?.order,
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
                        destinationIndex: cardsFromNewList.length - 1,
                    }),
                );

                const { newCard } = response.data;

                // delete card from old list, and add the current card to the new list
                deleteCard(oldListId, cardId);
                addCardToList(newListId, newCard);

                // [card details is opened] => update list id
                setCardDetailListId(newListId);

                socket.emit(SOCKET_EVENTS.CARD_MOVE, {
                    oldListId,
                    newListId,
                    cardId,
                    newCard,
                });
            } catch (err) {
                const errMsg =
                    err?.response?.data?.message || "Failed to move card";
                toast.error(errMsg);
            }
        },
    );

    const handleCopyCard = withCardProcessWrapper(async (card) => {
        try {
            const cards = boardState.cards[card.listId];
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

            socket.emit(SOCKET_EVENTS.CARD_COPY, {
                card: newCard,
                index: currentIndex,
            });
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
                const cards = boardState.cards[card.listId];
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

                dispatch({
                    type: BOARD_ACTIONS.SET_LIST_CARDS,
                    payload: {
                        listId: card.listId,
                        cards,
                    },
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
                socket.emit(SOCKET_EVENTS.CARD_MOVE_BY_INDEX, {
                    cards,
                    listId: card.listId,
                });
            } catch (err) {
                const errMsg =
                    err?.response?.data?.message || "Failed to move this card";
                toast.error(errMsg);
            }
        },
    );

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

    if (boardQuery.isError) {
        return (
            <section className="w-full flex flex-col justify-center items-center gap-4">
                <p className="font-medium mx-auto text-center mt-20 text-gray-600">
                    {boardQuery.error?.response?.data?.message ||
                        "Failed to load Board"}
                </p>
            </section>
        );
    }

    if (boardQuery.isFetching) {
        return (
            <>
                <div className="font-medium mx-auto text-center mt-20 text-gray-600">
                    getting board data
                </div>
                <div className="loader mx-auto my-8"></div>
            </>
        );
    }

    if (Object.keys(boardState).length === 0) {
        return (
            <>
                <div className="font-medium mx-auto text-center mt-20 text-gray-600">
                    no data found
                </div>
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

            <BoardActivities />
            <KeyBindings />
            <MoveListForm />
            <Filter />
            <VisibilityConfig />
            <Members />
            <InvitationForm />
            <ChatBox />
            <Configuration
                theme={theme}
                debugModeEnabled={debugModeEnabled}
                handleChangeTheme={handleChangeTheme}
                handleToggleEnableDebugMode={handleToggleEnableDebugMode}
            />

            <div className="w-full h-[calc(100vh-8rem)] flex flex-col justify-start gap-3 items-start bg-transparent">
                <div className="flex flex-wrap justify-between w-full z-20 px-4">
                    <div>
                        <input
                            maxLength={80}
                            className={`flex-1 bg-transparent overflow-hidden text-gray-700 whitespace-nowrap text-ellipsis border-b-2 border-gray-700 py-1 font-medium sm:font-bold select-none mb-2 focus:outline-hidden`}
                            id="board-title-input"
                            style={{
                                width: `${boardState.board.title.length}ch`,
                                minWidth: "1ch",
                                maxWidth: "400px",
                            }}
                            onKeyDown={(e) => handleBoardTitleInputOnKeyDown(e)}
                            onChange={(e) =>
                                updateBoardField({
                                    field: "title",
                                    value: e.target.value,
                                })
                            }
                            onBlur={(e) => handleBoardTitleInputOnBlur(e)}
                            value={boardState.board.title}
                        />
                    </div>

                    <div
                        className="flex h-9 gap-2 z-20"
                        id="board-options-wrapper"
                    >
                        <div>
                            <div
                                onClick={() => setOpenChatBox((prev) => !prev)}
                                className={`bg-[rgb(var(--card-item-bg))] h-full flex--center cursor-pointer select-none border-gray-600 shadow-gray-600 w-20 px-4 border-2 text-[0.75rem] text-gray-600 font-medium
                                        ${openChatBox ? "shadow-[0_1px_0_0] mt-0.5" : "shadow-[0_3px_0_0]"}`}
                            >
                                chat
                            </div>
                        </div>

                        <div>
                            <div
                                onClick={() => setOpenFilter((prev) => !prev)}
                                className={`bg-[rgb(var(--card-item-bg))] h-full flex--center cursor-pointer select-none border-gray-600 shadow-gray-600 w-20 px-4 border-2 text-[0.75rem] text-gray-600 font-medium
                                        ${openFilter ? "shadow-[0_1px_0_0] mt-0.5" : "shadow-[0_3px_0_0]"} ${hasFilter ? "text-white bg-teal-600" : ""}`}
                            >
                                filter
                            </div>
                        </div>

                        <div>
                            <div
                                onClick={() => setOpenInvitationForm(true)}
                                className={`bg-[rgb(var(--card-item-bg))] h-full flex--center cursor-pointer select-none border-gray-600 shadow-gray-600 w-20 px-4 border-2 text-[0.75rem] text-gray-600 font-medium
                                        ${openInvitationForm ? "shadow-[0_1px_0_0] mt-0.5" : "shadow-[0_3px_0_0]"}`}
                            >
                                invite
                            </div>
                        </div>

                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    if (e.target === e.currentTarget) {
                                        setOpenBoardOptions((prev) => !prev);
                                    }
                                }}
                                className={`bg-[rgb(var(--card-item-bg))] h-full flex--center cursor-pointer select-none border-gray-600 shadow-gray-600 w-20 px-4 border-2 text-[0.75rem] text-gray-600 font-medium
                                    ${openBoardOptions ? "shadow-[0_1px_0_0] mt-0.5" : "shadow-[0_3px_0_0]"}`}
                            >
                                options
                            </button>

                            {openBoardOptions && (
                                <BoardOptions
                                    open={setOpenBoardOptions}
                                    setOpen={setOpenBoardOptions}
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

                <div className="w-screen">
                    <ListContainer />
                </div>
            </div>

            <div
                id="bottom-buttons"
                className="flex items-center h-12.5 px-4 gap-2"
            >
                <button
                    className={`
                        w-25 ${openMembers ? "mt-1 text-gray-100 shadow-[0_1px_0_0]" : "shadow-gray-600 shadow-[0_3px_0_0]"}
                        bg-[rgb(var(--card-item-bg))] border-2 border-gray-600 text-gray-600 px-3 py-2 text-[0.65rem] sm:text-[0.65rem] font-medium
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
                        w-25 ${currentUser.pinnedBoardIdCollection?.hasOwnProperty(boardId) ? "mt-1 text-gray-100 shadow-[0_1px_0_0]" : "shadow-gray-600 shadow-[0_3px_0_0]"}
                        bg-[rgb(var(--card-item-bg))] border-2 border-gray-600 text-gray-600 px-3 py-2 text-[0.65rem] sm:text-[0.65rem] font-medium
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
                        bg-[rgb(var(--card-item-bg))] border-2 border-gray-600 text-gray-600 px-3 py-2 text-[0.65rem] sm:text-[0.65rem] font-medium
                    `}
                >
                    <span>{boardState.board?.visibility}</span>
                </button>

                <div className="flex gap-3 ms-3 text-[0.75rem] items-center justify-center text-gray-700">
                    <p className="md:block hidden select-none m-0 p-0">
                        lists: {boardState?.lists?.length || 0} / 20
                    </p>

                    <button
                        className="sm:grid place-items-center hidden w-6 h-6 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-full"
                        onClick={() => {
                            setOpenKeyBindings((prev) => !prev);
                        }}
                        title="open help"
                    >
                        ?
                    </button>
                </div>
            </div>
        </>
    );
};

export default Board;
