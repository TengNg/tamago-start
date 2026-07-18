import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import useBoardState from "../hooks/useBoardState";
import useCardActions from "../hooks/useCardActions";
import useBoardMutations from "../hooks/useBoardMutations";
import ListContainer from "../components/list/ListContainer";
import InvitationModal from "../components/invitation/InvitationModal";
import CopyBoardForm from "../components/board/CopyBoardForm";
import Modal from "../components/ui/Modal";
import MoveListModal from "../components/list/MoveListModal";
import CardModal from "../components/card/CardModal";
import CardQuickEditor from "../components/card/CardQuickEditor";
import MembersModal from "../components/board/MembersModal";
import ConfigurationModal from "../components/board/ConfigurationModal";
import FilterModal from "../components/action-menu/FilterModal";
import VisibilityConfigModal from "../components/board/VisibilityConfigModal";
import KeyBindingsModal from "../components/ui/KeyBindingsModal";
import BoardActivitiesModal from "../components/activity-history/BoardActivitiesModal";
import BoardHeader from "../components/board/BoardHeader";
import BoardBottomBar from "../components/board/BoardBottomBar";
import { boardApi } from "../services/api";
import { useQuery } from "@tanstack/react-query";
import ChatBox from "../components/chat/ChatBox";
import { BOARD_ACTIONS } from "../state/boardActionTypes";
import { boardKeys } from "../queries/boardKeys";
import { getErrorMessage } from "../utils/getErrorMessage";
import { CardModalContextProvider } from "../context/CardModalContext";

const Board = () => {
    const {
        boardState,
        dispatch,

        isRemoved,
        setIsRemoved,

        focusedCard,
        setFocusedCard,

        openedCardQuickEditor,
        setOpenedCardQuickEditor,

        isConnected,

        socket,
    } = useBoardState();

    const [openCopyBoardForm, setOpenCopyBoardForm] = useState(false);

    const { boardId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const cardId = searchParams.get("card");

    const boardQuery = useQuery({
        queryKey: boardKeys.detail(/** @type {string} */ (boardId)),
        queryFn: () => boardApi.fetchBoard(/** @type {string} */ (boardId)),
        enabled: !!boardId,
        staleTime: Infinity,
    });

    useEffect(() => {
        if (boardQuery.data) {
            socket.connect();
            dispatch({
                type: BOARD_ACTIONS.SET_STATE,
                payload: {
                    data: boardQuery.data,
                },
            });
        }

        return () => {
            socket.disconnect();
        };
    }, [boardQuery.data]);

    useEffect(() => {
        if (isRemoved) {
            navigate("/notfound");
            setIsRemoved(false);
        }
    }, [isRemoved]);

    useCardActions({
        boardState,
        focusedCard,
        setFocusedCard,
        setOpenedCardQuickEditor,
    });

    const {
        deleteCard,
        copyCard,
        moveCardToList,
        moveCardByIndex,
        processingCard,
    } = useBoardMutations();

    if (boardQuery.isLoading) {
        return (
            <>
                <div className="font-medium mx-auto text-center mt-20 text-gray-600">
                    getting board data
                </div>
                <div className="loader mx-auto my-8"></div>
            </>
        );
    }

    if (boardQuery.isError) {
        return (
            <section className="w-full flex flex-col justify-center items-center gap-4">
                <p className="font-medium mx-auto text-center mt-20 text-gray-600">
                    {getErrorMessage(boardQuery.error, "Failed to load Board")}
                </p>
            </section>
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

    if (Object.keys(boardState).length === 0) {
        return (
            <>
                <div className="font-medium mx-auto text-center mt-20 text-gray-600">
                    no data found
                </div>
            </>
        );
    }

    return (
        <>
            <CardModalContextProvider>
                <CardModal
                    key={cardId}
                    processingCard={processingCard}
                    handleDeleteCard={deleteCard}
                    handleCopyCard={copyCard}
                    handleMoveCardToList={moveCardToList}
                    handleMoveCardByIndex={moveCardByIndex}
                />
            </CardModalContextProvider>

            <Modal
                open={openCopyBoardForm}
                setOpen={setOpenCopyBoardForm}
                title="create a copy of this board"
            >
                <CopyBoardForm />
            </Modal>

            {openedCardQuickEditor && (
                <CardQuickEditor
                    card={openedCardQuickEditor.card}
                    attribute={openedCardQuickEditor.attribute}
                    handleDeleteCard={deleteCard}
                    handleCopyCard={copyCard}
                />
            )}

            <BoardActivitiesModal />
            <KeyBindingsModal />
            <MoveListModal />
            <FilterModal />
            <VisibilityConfigModal />
            <MembersModal />
            <InvitationModal />
            <ConfigurationModal />
            <ChatBox />

            <div className="w-full h-[calc(100vh-8rem)] flex flex-col justify-start gap-3 items-start bg-transparent">
                <BoardHeader setOpenCopyBoardForm={setOpenCopyBoardForm} />

                <div className="w-screen">
                    <ListContainer />
                </div>
            </div>

            <BoardBottomBar />
        </>
    );
};

export default Board;
