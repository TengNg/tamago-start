declare type JoinRequestItem = {
    _id: string;
    boardId: {
        _id: string;
        title: string;
        description: string;
        visibility: string;
        listCount: number;
        createdBy: { username: string };
    };
    requester: { _id: string; username: string; profileImage?: string; createdAt: string };
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
    updatedAt: string;
};

declare type GetJoinRequestsResponse = {
    joinRequests: JoinRequestItem[];
    nextPage: number | null;
};
