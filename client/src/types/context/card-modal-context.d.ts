import { UseQueryResult } from "@tanstack/react-query";

export {};

declare global {
    type CardModalContextValue = {
        cardQuery: UseQueryResult<Card>;
        card: Card
    }
}
