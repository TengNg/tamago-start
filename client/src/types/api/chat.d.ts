declare type GetChatResponse = {
    messages: ChatMessage[];
    nextCursor: string | null;
    hasMore: boolean;
};
