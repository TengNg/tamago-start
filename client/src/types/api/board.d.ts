declare type BoardListItem = Board & {
    createdBy: string;
    owned: boolean;
    memberCount: number;
};

declare type GetBoardsResponse = {
    boards: BoardListItem[];
    total: number;
    totalOwned: number;
    totalJoined: number;
    recentlyViewedBoard: BoardListItem | null;
};

declare type BoardStatsResponse = {
    board: Board;
    members: BoardMember[];
    priorityLevelStats: { _id: Card["priorityLevel"]; count: number }[];
};

declare type ActivityItem = {
    _id: string;
    board: string;
    user: { username: string; createdAt: string };
    docModel: 'Board' | 'Card' | 'List';
    doc: { _id: string; title: string };
    docTitle: string;
    action: string;
    description: string;
    createdAt: string;
};

declare type GetBoardActivitiesResponse = {
    activities: ActivityItem[];
    nextPage: number | null;
};
