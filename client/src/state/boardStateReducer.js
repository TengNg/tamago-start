import { BOARD_ACTIONS } from "./boardActionTypes";

/**
 * @param {BoardState} state
 * @param {BoardAction} action
 * @returns {BoardState}
 */
export function boardStateReducer(state, action) {
    switch (action.type) {
        // board ==============================================================

        case BOARD_ACTIONS.SET_STATE: {
            return action.payload.data;
        }

        case BOARD_ACTIONS.SET_CARD: {
            const { card } = action.payload;
            const cards = [...(state.cards[card.listId] ?? [])];
            return {
                ...state,
                cards: {
                    ...state.cards,
                    [card.listId]: cards.map((c) => {
                        return c._id == card._id ? card : c;
                    }),
                },
            };
        }

        case BOARD_ACTIONS.UPDATE_BOARD_FIELD: {
            const { field, value } = action.payload;
            return {
                ...state,
                board: { ...state.board, [field]: value },
            };
        }

        case BOARD_ACTIONS.SET_LISTS: {
            const { lists } = action.payload;
            return {
                ...state,
                lists,
            };
        }

        case BOARD_ACTIONS.SET_CARDS: {
            const { cards } = action.payload;
            return {
                ...state,
                cards,
            };
        }

        // list ===============================================================

        case BOARD_ACTIONS.UPDATE_LIST_FIELD: {
            const { listId, field, value } = action.payload;
            return {
                ...state,
                lists: state.lists.map((list) =>
                    list._id === listId ? { ...list, [field]: value } : list,
                ),
            };
        }

        case BOARD_ACTIONS.ADD_LIST_TO_BOARD: {
            const { list } = action.payload;
            return {
                ...state,
                lists: [...state.lists, list],
                cards: {
                    ...state.cards,
                    [list._id]: [],
                },
            };
        }

        case BOARD_ACTIONS.ADD_LIST_TO_BOARD_BY_INDEX: {
            const { list, cards, index } = action.payload;
            const newLists = [...state.lists];
            newLists.splice(index, 0, list);
            return {
                ...state,
                lists: newLists,
                cards: {
                    ...state.cards,
                    [list._id]: cards,
                },
            };
        }

        case BOARD_ACTIONS.MOVE_LIST: {
            const { listId, fromIndex, toIndex } = action.payload;

            const foundListIndex = state.lists.findIndex(
                (l) => l._id === listId,
            );

            if (foundListIndex !== fromIndex) {
                return state;
            }

            const newLists = [...state.lists];
            const [movedList] = newLists.splice(fromIndex, 1);

            newLists.splice(toIndex, 0, movedList);
            return {
                ...state,
                lists: newLists,
            };
        }

        case BOARD_ACTIONS.DELETE_LIST: {
            const { listId } = action.payload;
            const lists = [...state.lists].filter((l) => l._id !== listId);
            const cards = { ...state.cards };
            delete cards[listId];
            return { ...state, lists, cards };
        }

        // card ===============================================================

        case BOARD_ACTIONS.SET_LIST_CARDS: {
            const { listId, cards } = action.payload;
            return {
                ...state,
                cards: {
                    ...state.cards,
                    [listId]: cards,
                },
            };
        }

        case BOARD_ACTIONS.UPDATE_CARD_FIELD: {
            const { id, listId, field, value } = action.payload;
            const cards = [...(state.cards[listId] ?? [])];
            return {
                ...state,
                cards: {
                    ...state.cards,
                    [listId]: cards.map((c) => {
                        return c._id === id ? { ...c, [field]: value } : c;
                    }),
                },
            };
        }

        case BOARD_ACTIONS.ADD_CARD_TO_LIST: {
            const { listId, card } = action.payload;
            const cards = [...(state.cards[listId] ?? [])];
            return {
                ...state,
                cards: {
                    ...state.cards,
                    [listId]: [...cards, { ...card, listId }],
                },
            };
        }

        case BOARD_ACTIONS.ADD_CARD_TO_LIST_BY_INDEX: {
            const { listId, index, card } = action.payload;
            const cards = [...(state.cards[listId] ?? [])];
            cards.splice(index, 0, { ...card, listId });
            return {
                ...state,
                cards: {
                    ...state.cards,
                    [listId]: cards,
                },
            };
        }

        case BOARD_ACTIONS.COPY_CARD: {
            const { index, card } = action.payload;
            const cards = [...(state.cards[card.listId] ?? [])];
            cards.splice(index + 1, 0, card);
            return {
                ...state,
                cards: {
                    ...state.cards,
                    [card.listId]: cards,
                },
            };
        }

        case BOARD_ACTIONS.DELETE_CARD: {
            const { listId, cardId } = action.payload;
            const cards = [...(state.cards[listId] ?? [])];
            return {
                ...state,
                cards: {
                    ...state.cards,
                    [listId]: cards.filter((c) => {
                        return c._id !== cardId;
                    }),
                },
            };
        }

        // member =============================================================

        case BOARD_ACTIONS.REMOVE_MEMBER: {
            const { memberId } = action.payload;
            return {
                ...state,
                members: [...state.members].filter(
                    (member) => member.userId !== memberId,
                ),
            };
        }

        case BOARD_ACTIONS.ADD_MEMBER: {
            const { member } = action.payload;
            return {
                ...state,
                members: [...state.members, member],
            };
        }

        default:
            return state;
    }
}
