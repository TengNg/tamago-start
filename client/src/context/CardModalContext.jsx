import { createContext, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCard } from "../api/cardApi";
import { cardKeys } from "../queries/cardKeys";
import { useSearchParams } from "react-router-dom";
import { getErrorMessage } from "../utils/getErrorMessage";

const CardModalContext = createContext(
    /** @type {CardModalContextValue} */ ({}),
);

/** @param {{ children: React.ReactNode }} props */
export const CardModalContextProvider = ({ children }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const cardId = searchParams.get("card");

    const cardQuery = useQuery({
        queryKey: cardKeys.detail(/** @type {string} */ (cardId)),
        queryFn: ({ signal }) =>
            fetchCard(/** @type {string} */ (cardId), { signal }),
        enabled: !!cardId,
    });

    const card = cardQuery.data;

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
        <CardModalContext.Provider value={{ cardQuery, card }}>
            {children}
        </CardModalContext.Provider>
    );
};

export default CardModalContext;
