declare type CardUpdateField =
    | "title"
    | "description"
    | "highlight"
    | "priorityLevel"
    | "owner"
    | "dueDate"
    | "verified";

declare type Card = {
    _id: string;
    boardId: string;
    listId: string;
    title: string;
    description: string;
    order: string;
    highlight: string;
    priorityLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
    verified: boolean;
    owner: string;
    dueDate: string;
    updatedAt: string;
    createdAt: string;

    hiddenByFilter?: boolean;
};
