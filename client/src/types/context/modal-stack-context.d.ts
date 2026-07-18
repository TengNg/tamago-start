declare type ModalStackContextValue = {
    pushModal: (id: string) => void;
    popModal: (id: string) => void;
    isTopModal: (id: string) => boolean;
    getModalZIndex: (id: string) => number;
    isAnyModalOpen: boolean
};
