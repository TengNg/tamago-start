declare type CurrentUser = {
    _id: string;
    username: string;
    createdAt: string;
    recentlyViewedBoardId: string | null;
    pinnedBoardIdCollection: Record<string, { title: string }>;
    loginWithDiscord: boolean;
};
