declare type BoardMember = {
    _id: string;
    role: 'owner' | 'member';
    userId: string;
    username: string;
    profileImage?: string;
    createdAt: string;
};
