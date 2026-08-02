import { UseMutationResult, UseQueryResult } from "@tanstack/react-query";

export { };

declare global {
    type CardModalContextValue = {
        cardQuery: UseQueryResult<Card>;
        card: Card;
        cardMutation: UseMutationResult<
            Card,
            Error,
            { field: CardUpdateField; value: any }
        >;
    };
}
