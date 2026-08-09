import { createContext, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cardApi } from "../services/api";
import { cardKeys } from "../queries/cardKeys";
import { useSearchParams } from "react-router-dom";
import { getErrorMessage } from "../utils/getErrorMessage";
import useBoardState from "../hooks/useBoardState";
import useToast from "../hooks/useToast";

const CardModalContext = createContext(
    /** @type {CardModalContextValue} */ ({}),
);

/** @param {{ children: React.ReactNode }} props */
export const CardModalContextProvider = ({ children }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const cardId = searchParams.get("card");

    const { updateCardField } = useBoardState();
    const queryClient = useQueryClient();
    const toast = useToast();

    const cardQuery = useQuery({
        queryKey: cardKeys.detail(/** @type {string} */ (cardId)),
        queryFn: ({ signal }) =>
            cardApi.fetchCard(/** @type {string} */ (cardId), { signal }),
        enabled: !!cardId,
    });

    const card = cardQuery.data;

    const cardMutation = useMutation({
        mutationFn: (
            /** @type {{ field: CardUpdateField, value: any }} */ {
                field,
                value,
            },
        ) =>
            cardApi.updateCard(/** @type {string} */ (card?._id), field, value),
        onMutate: (
            /** @type {{ field: CardUpdateField, value: any }} */ {
                field,
                value,
            },
        ) => {
            if (!card) {
                return;
            }

            queryClient.setQueryData(
                cardKeys.detail(card._id),
                (/** @type {Card | undefined} */ old) => {
                    if (!old) return old;
                    return { ...old, [field]: value };
                },
            );

            updateCardField({
                id: card._id,
                listId: card.listId,
                field,
                value,
            });

            return { previousCard: card };
        },
        onSuccess: (
            data,
            /** @type {{ field: CardUpdateField, value: any }} */ {
                field,
                value,
            },
            /** @type {{ previousCard: Card } | undefined} */ context,
        ) => {
            const target = context?.previousCard ?? card;
            if (!target) {
                return;
            }

            const resolvedValue = data[field] ?? value;

            updateCardField({
                id: target._id,
                listId: target.listId,
                field,
                value: resolvedValue,
            });

            queryClient.setQueryData(
                cardKeys.detail(target._id),
                (/** @type {Card | undefined} */ old) => {
                    if (!old) return old;
                    return { ...old, [field]: resolvedValue };
                },
            );
        },
        onError: (
            _error,
            /** @type {{ field: CardUpdateField, value: any }} */ { field },
            /** @type {{ previousCard: Card } | undefined} */ context,
        ) => {
            if (context) {
                const previous = context.previousCard;

                updateCardField({
                    id: previous._id,
                    listId: previous.listId,
                    field,
                    value: previous[field],
                });

                queryClient.setQueryData(
                    cardKeys.detail(previous._id),
                    (/** @type {Card | undefined} */ old) => {
                        if (!old) return old;
                        return { ...old, [field]: previous[field] };
                    },
                );
            }

            toast.error("Failed to update card");
        },
    });

    const handleCancel = useCallback(() => {
        const next = new URLSearchParams(searchParams);
        next.delete("card");
        next.delete("comment");
        setSearchParams(next, { replace: true });
    }, [searchParams, setSearchParams]);

    if (cardQuery.isLoading) {
        return (
            <div
                className="fixed inset-0 z-40 bg-black/15 flex items-center justify-center"
                onClick={handleCancel}
            >
                <div
                    className="overflow-y-auto overflow-x-hidden box--style text-gray-600 p-3 gap-3 pb-4 w-87.5 h-87.5 border-gray-600 border-2 bg-gray-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="w-full h-75 text-center flex flex-col items-center justify-center">
                        <span>getting card data</span>
                        <div className="loader mx-auto mt-8"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (cardQuery.isError) {
        return (
            <div
                className="fixed inset-0 z-40 bg-black/15 flex items-center justify-center"
                onClick={handleCancel}
            >
                <div
                    className="overflow-y-auto overflow-x-hidden box--style text-gray-600 p-3 gap-3 pb-4 w-87.5 h-87.5 border-gray-600 border-2 bg-gray-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="w-full h-75 text-center flex flex-col items-center justify-center">
                        <span>
                            {getErrorMessage(
                                cardQuery.error,
                                "Failed to get card data",
                            )}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    if (!card) {
        return null;
    }

    return (
        <CardModalContext.Provider value={{ cardQuery, card, cardMutation }}>
            {children}
        </CardModalContext.Provider>
    );
};

export default CardModalContext;
