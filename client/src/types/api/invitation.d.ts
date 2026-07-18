declare type InvitationItem = {
    _id: string;
    boardId: string;
    invitedUserId: { username: string; profileImage?: string; createdAt: string };
    invitedByUserId: { username: string; profileImage?: string; createdAt: string };
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
};

declare type GetInvitationsResponse = {
    invitations: InvitationItem[];
    nextPage: number | null;
};
