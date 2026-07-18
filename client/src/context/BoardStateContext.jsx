import socket from "../services/socket";
import { createContext, useReducer, useState } from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import LOCAL_STORAGE_KEYS from "../constants/localStorageKeys";
import useWindowSize from "../hooks/useWindowSize";
import { useQueryClient } from "@tanstack/react-query";
import useToast from "../hooks/useToast";
import { useBoardUIState } from "../hooks/useBoardUIState";
import { useBoardSocket } from "../hooks/useBoardSocket";
import { boardStateReducer } from "../state/boardStateReducer";
import { BOARD_ACTIONS } from "../state/boardActionTypes";
import { useParams } from "react-router-dom";

/** @type {React.Context<BoardContextValue>} */
const BoardStateContext = createContext(/** @type {BoardContextValue} */ ({}));

/** @param {{ children: React.ReactNode }} props */
export const BoardStateContextProvider = ({ children }) => {
    const queryClient = useQueryClient();

    const { boardId } = useParams();

    const toast = useToast();

    const { width: windowWidth } = useWindowSize();
    const isLargeScreen = windowWidth >= 769;

    const [isRemoved, setIsRemoved] = useState(false);
    const [listToMove, setListToMove] = useState();
    const [hasFilter, setHasFilter] = useState(false);
    const [isAtBottomOfChatBox, setIsAtBottomOfChatBox] = useState(true);

    const [openedCardQuickEditor, setOpenedCardQuickEditor] = useState(
        /** @type {CardQuickEditorData | undefined} */ (undefined),
    );

    const [focusedCard, setFocusedCard] = useState(
        /** @type {FocusedCard | undefined} */ (undefined),
    );

    const [theme, setTheme] = useLocalStorage(
        LOCAL_STORAGE_KEYS.BOARD_ITEM_THEME,
        { itemTheme: "squared" },
    );

    const [debugModeEnabled, setDebugModeEnabled] = useLocalStorage(
        LOCAL_STORAGE_KEYS.DEBUG_MODE_ENABLED,
        { enabled: false },
    );

    /** @type {[BoardState, React.Dispatch<BoardAction>]} */
    const [boardState, dispatch] = useReducer(
        boardStateReducer,
        /** @type {BoardState} */ ({}),
    );

    const { isConnected } = useBoardSocket({
        queryClient,
        dispatch,
        boardId,
        toast,
        isAtBottomOfChatBox,
        setIsRemoved,
    });

    const boardUIState = useBoardUIState();

    /** @param {string} highlight */
    const setCardQuickEditorHighlight = (highlight) => {
        setOpenedCardQuickEditor((prev) => {
            if (!prev) return prev;
            return { ...prev, card: { ...prev.card, highlight } };
        });
    };

    // board actions ==========================================================

    /**
     * @param {{ field: string, value: string }} params
     */
    const updateBoardField = ({ field, value }) => {
        dispatch({
            type: BOARD_ACTIONS.UPDATE_BOARD_FIELD,
            payload: { field, value },
        });
    };

    // list actions ===========================================================

    /**
     * @param {{ id: string, field: string, value: string | boolean | null }} params
     */
    const updateListField = ({ id, field, value }) => {
        dispatch({
            type: BOARD_ACTIONS.UPDATE_LIST_FIELD,
            payload: { listId: id, field, value },
        });
    };

    /** @param {string} id */
    const deleteList = (id) => {
        dispatch({ type: BOARD_ACTIONS.DELETE_LIST, payload: { listId: id } });
    };

    // card actions ===========================================================

    /**
     * @param {{ id: string, listId: string, field: string, value: string | boolean | null }} params
     */
    const updateCardField = ({ id, listId, field, value }) => {
        dispatch({
            type: BOARD_ACTIONS.UPDATE_CARD_FIELD,
            payload: { id, listId, field, value },
        });
    };

    /**
     * @param {string} listId
     * @param {Card} card
     */
    const addCardToList = (listId, card) => {
        dispatch({
            type: BOARD_ACTIONS.ADD_CARD_TO_LIST,
            payload: {
                listId,
                card,
            },
        });
    };

    /**
     * @param {Card} card
     * @param {number} index
     */
    const addCopiedCard = (card, index) => {
        dispatch({
            type: BOARD_ACTIONS.COPY_CARD,
            payload: {
                index,
                card,
            },
        });
    };

    /**
     * @param {string} listId
     * @param {string} cardId
     */
    const deleteCard = (listId, cardId) => {
        dispatch({
            type: BOARD_ACTIONS.DELETE_CARD,
            payload: { listId, cardId },
        });
    };

    /** @param {List} list */
    const addListToBoard = (list) => {
        dispatch({
            type: BOARD_ACTIONS.ADD_LIST_TO_BOARD,
            payload: {
                list,
            },
        });
    };

    // member actions =========================================================

    /** @param {string} memberId */
    const removeMemberFromBoard = (memberId) => {
        dispatch({
            type: BOARD_ACTIONS.REMOVE_MEMBER,
            payload: {
                memberId,
            },
        });
    };

    /** @param {BoardMember} member */
    const addMemberToBoard = (member) => {
        dispatch({
            type: BOARD_ACTIONS.ADD_MEMBER,
            payload: {
                member,
            },
        });
    };

    return (
        <BoardStateContext.Provider
            value={{
                boardState,
                dispatch,

                socket,
                isConnected,

                isRemoved,
                setIsRemoved,

                openedCardQuickEditor,
                setOpenedCardQuickEditor,

                setCardQuickEditorHighlight,

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

                isAtBottomOfChatBox,
                setIsAtBottomOfChatBox,

                windowWidth,
                isLargeScreen,

                updateBoardField,
                updateListField,
                updateCardField,
                deleteList,
                deleteCard,
                addListToBoard,
                addCardToList,
                addCopiedCard,
                removeMemberFromBoard,
                addMemberToBoard,

                ...boardUIState,
            }}
        >
            {children}
        </BoardStateContext.Provider>
    );
};

export default BoardStateContext;
