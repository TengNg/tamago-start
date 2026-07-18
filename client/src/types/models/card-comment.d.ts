declare type CardComment = {
    _id: string;
    content: string;
    createdAt: string;
    userId: { _id: string; username: string, profileImage?: string };
    deleted?: boolean;
};

declare type FocusedComment = CardComment & {
    onFirstPage?: boolean;
    collapsed?: boolean;
};
