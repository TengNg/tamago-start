declare type CurrentUser = {
    _id: string;
    username: string;
    discordId: string;
    createdAt: string;
    recentBoards: { board: string; viewedAt: string }[];
    pinnedBoards: { board: { _id: string; title: string }; pinnedAt: string; order: string }[];
};
