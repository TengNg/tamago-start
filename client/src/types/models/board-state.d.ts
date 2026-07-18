declare type BoardState = {
    board: Board;
    lists: List[];
    cards: Record<string, Card[]>;
    members: BoardMember[];
};
