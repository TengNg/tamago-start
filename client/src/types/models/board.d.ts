declare type Board = {
    _id: string;
    title: string;
    description: string;
    visibility: 'private' | 'public';
    createdBy: { _id: string; username: string; createdAt?: string };
    createdAt: string;
};
