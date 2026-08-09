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
                lists: (state.lists ?? []).map((list) =>
                    list._id === listId ? { ...list, [field]: value } : list,
                ),
            };
        }

        case BOARD_ACTIONS.ADD_LIST_TO_BOARD: {
            const { list } = action.payload;
            return {
                ...state,
                lists: [...(state.lists ?? []), list],
                cards: {
                    ...state.cards,
                    [list._id]: [],
                },
            };
        }

        case BOARD_ACTIONS.ADD_LIST_TO_BOARD_BY_INDEX: {
            const { list, cards, index } = action.payload;
            const newLists = [...(state.lists ?? [])];
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
            const { listId, order } = action.payload;

            const lists = [...(state.lists ?? [])]
                .map((l) => (l._id === listId ? { ...l, order } : l))
                .sort((a, b) => {
                    const aOrder = a.order || "";
                    const bOrder = b.order || "";
                    if (aOrder === bOrder) return 0;
                    if (aOrder === "") return 1;
                    if (bOrder === "") return -1;
                    return aOrder.localeCompare(bOrder);
                });

            return {
                ...state,
                lists,
            };
        }

        case BOARD_ACTIONS.COPY_LIST: {
            const { list, cards } = action.payload;

            const lists = [...(state.lists ?? []), list].sort((a, b) => {
                const aOrder = a.order || "";
                const bOrder = b.order || "";
                if (aOrder === bOrder) return 0;
                if (aOrder === "") return 1;
                if (bOrder === "") return -1;
                return aOrder.localeCompare(bOrder);
            });

            return {
                ...state,
                lists,
                cards: {
                    ...state.cards,
                    [list._id]: cards,
                },
            };
        }

        case BOARD_ACTIONS.DELETE_LIST: {
            const { listId } = action.payload;
            const lists = [...(state.lists ?? [])].filter(
                (l) => l._id !== listId,
            );
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

        case BOARD_ACTIONS.ADD_CARD: {
            const { listId, card } = action.payload;
            const cards = [...(state.cards[listId] ?? [])];
            const exists = cards.some((c) => c._id === card._id);

            return {
                ...state,
                cards: {
                    ...state.cards,
                    [listId]: (exists
                        ? cards.map((c) =>
                              c._id === card._id ? { ...card, listId } : c,
                          )
                        : [...cards, { ...card, listId }]
                    ).sort((a, b) => {
                        const aOrder = a.order || "";
                        const bOrder = b.order || "";
                        if (aOrder === bOrder) return 0;
                        if (aOrder === "") return 1;
                        if (bOrder === "") return -1;
                        return aOrder.localeCompare(bOrder);
                    }),
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
                members: [...(state.members ?? [])].filter(
                    (member) => member.userId !== memberId,
                ),
            };
        }

        case BOARD_ACTIONS.ADD_MEMBER: {
            const { member } = action.payload;
            return {
                ...state,
                members: [...(state.members ?? []), member],
            };
        }

        default:
            return state;
    }
}
