declare type CardQuickEditorData = {
    card: Card;
    attribute: {
        top: number;
        left: number;
        width: number;
        height: number;
    };
};

declare type FocusedCard = Pick<Card, "_id" | "listId"> & {
    focused: boolean;
};

declare type BoardContextValue = {
    boardState: BoardState;
    dispatch: React.Dispatch<BoardAction>;

    socket: any;
    isConnected: boolean;

    isRemoved: boolean;
    setIsRemoved: React.Dispatch<React.SetStateAction<boolean>>;

    openedCardQuickEditor: CardQuickEditorData | undefined;
    setOpenedCardQuickEditor: React.Dispatch<React.SetStateAction<CardQuickEditorData | undefined>>;

    setCardQuickEditorHighlight: (highlight: string) => void;

    listToMove: any;
    setListToMove: React.Dispatch<React.SetStateAction<any>>;

    focusedCard: FocusedCard | undefined;
    setFocusedCard: React.Dispatch<React.SetStateAction<FocusedCard | undefined>>;

    theme: { itemTheme: string };
    setTheme: React.Dispatch<React.SetStateAction<{ itemTheme: string }>>;

    debugModeEnabled: { enabled: boolean };
    setDebugModeEnabled: React.Dispatch<React.SetStateAction<{ enabled: boolean }>>;

    hasFilter: boolean;
    setHasFilter: React.Dispatch<React.SetStateAction<boolean>>;

    isAtBottomOfChatBox: boolean;
    setIsAtBottomOfChatBox: React.Dispatch<React.SetStateAction<boolean>>;

    windowWidth: number;
    isLargeScreen: boolean;

    updateBoardField: (params: { field: string; value: string }) => void;
    updateListField: (params: { id: string; field: string; value: string | boolean | null }) => void;
    updateCardField: (params: { id: string; listId: string; field: string; value: string | boolean | null }) => void;
    deleteList: (id: string) => void;
    deleteCard: (listId: string, cardId: string) => void;
    addListToBoard: (list: List) => void;
    addCardToList: (listId: string, card: Card) => void;
    addCopiedCard: (card: Card, index: number) => void;
    removeMemberFromBoard: (memberId: string) => void;
    addMemberToBoard: (member: BoardMember) => void;

    openMoveListForm: boolean;
    setOpenMoveListForm: React.Dispatch<React.SetStateAction<boolean>>;
    openMembers: boolean;
    setOpenMembers: React.Dispatch<React.SetStateAction<boolean>>;
    openFilter: boolean;
    setOpenFilter: React.Dispatch<React.SetStateAction<boolean>>;
    openChatBox: boolean;
    setOpenChatBox: React.Dispatch<React.SetStateAction<boolean>>;
    openInvitationForm: boolean;
    setOpenInvitationForm: React.Dispatch<React.SetStateAction<boolean>>;
    openAddList: boolean;
    setOpenAddList: React.Dispatch<React.SetStateAction<boolean>>;
    openKeyBindings: boolean;
    setOpenKeyBindings: React.Dispatch<React.SetStateAction<boolean>>;
    openConfiguration: boolean;
    setOpenConfiguration: React.Dispatch<React.SetStateAction<boolean>>;
    openBoardActivities: boolean;
    setOpenBoardActivities: React.Dispatch<React.SetStateAction<boolean>>;
    openVisibilityConfig: boolean;
    setOpenVisibilityConfig: React.Dispatch<React.SetStateAction<boolean>>;
};
