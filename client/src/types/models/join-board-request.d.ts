declare type JoinBoardRequest = {
    _id: string;
    boardId: string;
    requester: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
    updatedAt: string;
};
