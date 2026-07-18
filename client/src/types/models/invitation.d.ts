declare type Invitation = {
    _id: string;
    boardId: string;
    invitedUserId: string;
    invitedByUserId: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
};
