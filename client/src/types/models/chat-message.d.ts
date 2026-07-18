declare type ChatMessage = {
    _id: string;
    type: 'MESSAGE' | 'CARD_CODE' | 'BOARD_CODE';
    content: string;
    boardId: string;
    sentBy: { _id: string; username: string };
    createdAt: string;

    error?: boolean
};
