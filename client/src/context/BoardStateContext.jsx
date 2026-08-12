import socket from "../services/socket";
import {
    createContext,
    useCallback,
    useMemo,
    useReducer,
    useState,
} from "react";
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
import useCurrentUser from "../hooks/useCurrentUser";

/** @type {React.Context<BoardContextValue>} */
const BoardStateContext = createContext(/** @type {BoardContextValue} */ ({}));

/** @param {{ children: React.ReactNode }} props */
export const BoardStateContextProvider = ({ children }) => {
    const queryClient = useQueryClient();

    const { boardId } = useParams();

    const toast = useToast();

    const { width: windowWidth } = useWindowSize();
    const isLargeScreen = windowWidth >= 769;

    const [listToMove, setListToMove] = useState();
    const [hasFilter, setHasFilter] = useState(false);
    const [isAtBottomOfChatBox, setIsAtBottomOfChatBox] = useState(true);

    const [pendingReorder, setPendingReorder] = useState(() => new Set());

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
    });

    // // TODO: band-aid
    // // keep the board snapshot cache in sync with the live reducer state so a
    // // remount never re-seeds the board with stale data
    // useEffect(() => {
    //     if (!boardId || Object.keys(boardState).length === 0) {
    //         return;
    //     }
    //     queryClient.setQueryData(boardKeys.detail(boardId), boardState);
    // }, [boardId, boardState, queryClient]);

    const boardUIState = useBoardUIState();

    const setCardQuickEditorHighlight = useCallback(
        /** @param {string | null} highlight */
        (highlight) => {
            setOpenedCardQuickEditor((prev) => {
                if (!prev) return prev;
                return { ...prev, card: { ...prev.card, highlight } };
            });
        },
        [],
    );

    // board actions ==========================================================

    const updateBoardField = useCallback(
        /**
         * @param {{ field: string, value: string }} params
         */
        ({ field, value }) => {
            dispatch({
                type: BOARD_ACTIONS.UPDATE_BOARD_FIELD,
                payload: { field, value },
            });
        },
        [],
    );

    // list actions ===========================================================

    const updateListField = useCallback(
        /**
         * @param {{ id: string, field: string, value: string | boolean | null }} params
         */
        ({ id, field, value }) => {
            dispatch({
                type: BOARD_ACTIONS.UPDATE_LIST_FIELD,
                payload: { listId: id, field, value },
            });
        },
        [],
    );

    const deleteList = useCallback(
        /** @param {string} id */
        (id) => {
            dispatch({
                type: BOARD_ACTIONS.DELETE_LIST,
                payload: { listId: id },
            });
        },
        [],
    );

    // card actions ===========================================================

    const updateCardField = useCallback(
        /**
         * @param {{ id: string, listId: string, field: string, value: string | boolean | null }} params
         */
        ({ id, listId, field, value }) => {
            dispatch({
                type: BOARD_ACTIONS.UPDATE_CARD_FIELD,
                payload: { id, listId, field, value },
            });
        },
        [],
    );

    const addCardToList = useCallback(
        /**
         * @param {string} listId
         * @param {Card} card
         */
        (listId, card) => {
            dispatch({
                type: BOARD_ACTIONS.ADD_CARD,
                payload: {
                    listId,
                    card,
                },
            });
        },
        [],
    );

    const deleteCard = useCallback(
        /**
         * @param {string} listId
         * @param {string} cardId
         */
        (listId, cardId) => {
            dispatch({
                type: BOARD_ACTIONS.DELETE_CARD,
                payload: { listId, cardId },
            });
        },
        [],
    );

    const addListToBoard = useCallback(
        /** @param {List} list */
        (list) => {
            dispatch({
                type: BOARD_ACTIONS.ADD_LIST_TO_BOARD,
                payload: {
                    list,
                },
            });
        },
        [],
    );

    // member actions =========================================================

    const removeMemberFromBoard = useCallback(
        /** @param {string} memberId */
        (memberId) => {
            dispatch({
                type: BOARD_ACTIONS.REMOVE_MEMBER,
                payload: {
                    memberId,
                },
            });
        },
        [],
    );

    const addMemberToBoard = useCallback(
        /** @param {BoardMember} member */
        (member) => {
            dispatch({
                type: BOARD_ACTIONS.ADD_MEMBER,
                payload: {
                    member,
                },
            });
        },
        [],
    );

    const currentUser = useCurrentUser();
    const isOwner =
        (boardState.members ?? []).findIndex(
            /** @param {BoardMember} m */
            (m) => m.role === "owner" && m.userId === currentUser._id,
        ) !== -1;

    const contextValue = useMemo(
        () => ({
            boardState,
            dispatch,

            isOwner,

            pendingReorder,
            setPendingReorder,

            socket,
            isConnected,

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
            removeMemberFromBoard,
            addMemberToBoard,

            ...boardUIState,
        }),
        [
            boardState,
            isOwner,
            pendingReorder,
            isConnected,
            openedCardQuickEditor,
            setCardQuickEditorHighlight,
            listToMove,
            focusedCard,
            theme,
            setTheme,
            debugModeEnabled,
            setDebugModeEnabled,
            hasFilter,
            isAtBottomOfChatBox,
            windowWidth,
            isLargeScreen,
            updateBoardField,
            updateListField,
            updateCardField,
            deleteList,
            deleteCard,
            addListToBoard,
            addCardToList,
            removeMemberFromBoard,
            addMemberToBoard,
            boardUIState,
        ],
    );

    return (
        <BoardStateContext.Provider value={contextValue}>
            {children}
        </BoardStateContext.Provider>
    );
};

export default BoardStateContext;
