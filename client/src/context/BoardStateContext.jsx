import socket from "../services/socket";
import { createContext, useReducer, useState } from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import LOCAL_STORAGE_KEYS from "../data/localStorageKeys";
import { useParams } from "react-router-dom";
import useWindowSize from "../hooks/useWindowSize";
import { useQueryClient } from "@tanstack/react-query";
import useToast from "../hooks/useToast";
import { useBoardUIState } from "../hooks/useBoardUIState";
import { useBoardSocket } from "../hooks/useBoardSocket";
import { boardStateReducer } from "../state/boardStateReducer";
import { BOARD_ACTIONS } from "../state/boardActionTypes";

const BoardStateContext = createContext({});

export const BoardStateContextProvider = ({ children }) => {
    const queryClient = useQueryClient();

    const toast = useToast();

    const { width: windowWidth } = useWindowSize();
    const isLargeScreen = windowWidth >= 769;

    const { boardId } = useParams();

    const [isRemoved, setIsRemoved] = useState(false);
    const [focusedCard, setFocusedCard] = useState();
    const [openedCard, setOpenedCard] = useState();
    const [openedCardQuickEditor, setOpenedCardQuickEditor] = useState();
    const [listToMove, setListToMove] = useState();
    const [hasFilter, setHasFilter] = useState(false);
    const [isAtBottomOfChatBox, setIsAtBottomOfChatBox] = useState(true);

    const [theme, setTheme] = useLocalStorage(
        LOCAL_STORAGE_KEYS.BOARD_ITEM_THEME,
        {},
    );
    const [debugModeEnabled, setDebugModeEnabled] = useLocalStorage(
        LOCAL_STORAGE_KEYS.DEBUG_MODE_ENABLED,
        {},
    );

    const [boardState, dispatch] = useReducer(boardStateReducer, {});

    const { isConnected } = useBoardSocket({
        queryClient,
        dispatch,
        boardId,
        toast,
        isAtBottomOfChatBox,
        setIsRemoved,
    });

    const boardUIState = useBoardUIState();

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

    // board actions ==========================================================

    const updateBoardField = ({ field, value }) => {
        dispatch({
            type: BOARD_ACTIONS.UPDATE_BOARD_FIELD,
            payload: { field, value },
        });
    };

    // list actions ===========================================================

    const updateListField = ({ id, field, value }) => {
        dispatch({
            type: BOARD_ACTIONS.UPDATE_LIST_FIELD,
            payload: { listId: id, field, value },
        });
    };

    const deleteList = (id) => {
        dispatch({ type: BOARD_ACTIONS.DELETE_LIST, payload: { listId: id } });
    };

    // card actions ===========================================================

    const updateCardField = ({ id, listId, field, value }) => {
        dispatch({
            type: BOARD_ACTIONS.UPDATE_CARD_FIELD,
            payload: { id, listId, field, value },
        });
    };

    const addCardToList = (listId, card) => {
        dispatch({
            type: BOARD_ACTIONS.ADD_CARD_TO_LIST,
            payload: {
                listId,
                card,
            },
        });
    };

    const addCopiedCard = (card, index) => {
        dispatch({
            type: BOARD_ACTIONS.COPY_CARD,
            payload: {
                index,
                card,
            },
        });
    };

    const deleteCard = (listId, cardId) => {
        dispatch({
            type: BOARD_ACTIONS.DELETE_CARD,
            payload: { listId, cardId },
        });
    };

    const addListToBoard = (list) => {
        dispatch({
            type: BOARD_ACTIONS.ADD_LIST_TO_BOARD,
            payload: {
                list,
            },
        });
    };

    // member actions =========================================================

    const removeMemberFromBoard = (memberName) => {
        dispatch({
            type: BOARD_ACTIONS.REMOVE_MEMBER,
            payload: {
                memberName,
            },
        });
    };

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

                openedCard,
                setOpenedCard,

                openedCardQuickEditor,
                setOpenedCardQuickEditor,

                setCardDetailHighlight,
                setCardDetailListId,

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
