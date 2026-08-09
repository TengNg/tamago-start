import {
    useEffect,
    useState,
    useRef,
    useMemo,
    useCallback,
    useContext,
} from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { attachmentApi } from "../../services/api";
import useBoardState from "../../hooks/useBoardState";
import useToast from "../../hooks/useToast";
import Loading from "../ui/Loading";
import TitleBar from "./modal/TitleBar";
import ListSelectOptions from "./modal/ListSelectOptions";
import Actions from "./modal/Actions";
import Extra from "./modal/Extra";
import Comments from "./modal/Comments";
import { getErrorMessage } from "../../utils/getErrorMessage";
import CardModalContext from "../../context/CardModalContext";
import ModalStackContext from "../../context/ModalStackContext";

/**
 * @typedef {Object} CardModalProps
 * @property {(card: Card) => void} handleDeleteCard
 * @property {(card: Card) => void} handleCopyCard
 * @property {(card: Card, newListId: string) => void} handleMoveCardToList
 * @property {(card: Card, insertedIndex: number) => void} handleMoveCardByIndex
 * @property {boolean} isProcessing
 */

/**
 * @param {CardModalProps} props
 * @returns {JSX.Element | null}
 */
const CardModal = ({
    handleDeleteCard,
    handleCopyCard,
    handleMoveCardToList,
    handleMoveCardByIndex,
    isProcessing,
}) => {
    const [searchParams, setSearchParams] = useSearchParams();

    const { boardState } = useBoardState();
    const { isAnyModalOpen } = useContext(ModalStackContext);
    const { card, cardMutation } = useContext(CardModalContext);

    const toast = useToast();

    /** @type {React.MutableRefObject<HTMLDivElement | null>} */
    const modalRef = useRef(null);

    /** @type {React.MutableRefObject<HTMLTextAreaElement | null>} */
    const cardTitleInput = useRef(null);

    /** @type {React.MutableRefObject<HTMLTextAreaElement | null>} */
    const cardDescriptionInput = useRef(null);

    /** @type {React.MutableRefObject<AbortController | null>} */
    const abortControllerRef = useRef(null);

    /** @type {React.MutableRefObject<HTMLTextAreaElement | null>} */
    const textareaRef = cardDescriptionInput;

    const [title, setTitle] = useState(() => card?.title || "");
    const [description, setDescription] = useState(
        () => card?.description || "",
    );
    const [cardCount, setCardCount] = useState(() => {
        if (!card) return 0;
        const cards = boardState.cards[card.listId] ?? [];
        return cards.length || 0;
    });
    const [position, setPosition] = useState(() => {
        if (!card) return 0;
        const cards = boardState.cards[card.listId] ?? [];
        return cards.findIndex((el) => el._id === card._id);
    });
    const [isScrolledDown, setIsScrolledDown] = useState(false);

    /** @type {{ value: string; title: string }[]} */
    const listSelectOptions = useMemo(() => {
        return (
            boardState?.lists?.map((list) => {
                return { value: list._id, title: list.title };
            }) || []
        );
    }, [boardState.lists]);

    const handleCancel = useCallback(() => {
        const next = new URLSearchParams(searchParams);
        next.delete("card");
        next.delete("comment");
        setSearchParams(next, { replace: true });
        document.title = boardState.board.title || "tamago-start";
    }, [searchParams, setSearchParams, boardState.board.title]);

    useEffect(() => {
        if (card && cardTitleInput.current && title) {
            cardTitleInput.current.style.height = "auto";
            cardTitleInput.current.style.height = `${cardTitleInput.current.scrollHeight}px`;
        }
    }, [card, title]);

    useEffect(() => {
        if (!card) {
            return;
        }

        document.title = `[card] ${card.title}`;

        const handleKeyDown = (/** @type {KeyboardEvent} */ e) => {
            if (e.ctrlKey && e.key === "/") {
                e.preventDefault();
                textareaRef.current?.focus();
            } else if (e.key === "Escape") {
                if (!isAnyModalOpen) {
                    handleCancel();
                }
            }
        };

        const handleScroll = () => {
            if (modalRef.current) {
                setIsScrolledDown(modalRef.current.scrollTop > 0);
            }
        };

        const modalEl = modalRef.current;

        document.addEventListener("keydown", handleKeyDown);
        modalEl?.addEventListener("scroll", handleScroll);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            modalEl?.removeEventListener("scroll", handleScroll);
        };
    }, [card, handleCancel, isAnyModalOpen, textareaRef]);

    const fileUploadMutation = useMutation({
        mutationFn: async (/** @type {FormData} */ formData) => {
            abortControllerRef.current = new AbortController();
            return await attachmentApi.uploadAttachment(formData, {
                signal: abortControllerRef.current.signal,
            });
        },
        onSuccess: (_data) => {
            toast.success("Attachment uploaded successfully");
        },
        onError: (err) => {
            if (err.name === "CanceledError" || err.name === "AbortError") {
                return;
            }

            toast.error(getErrorMessage(err, "Failed to upload attachment"));
        },
    });

    const handleConfirmTitle = useCallback(
        (/** @type {React.FocusEvent<HTMLTextAreaElement>} */ e) => {
            const newTitle = e.target.value.trim();
            if (card?.title === newTitle || !newTitle) return;
            cardMutation.mutate({ field: "title", value: newTitle });
        },
        [card, cardMutation],
    );

    const handleConfirmDescription = useCallback(() => {
        if (card.description === description) {
            return;
        }

        if (description.length > 2_000) {
            toast.error(
                `Too long to save. Description is ${description.length} characters - maximum 2000 characters`,
            );
            return;
        }

        cardMutation.mutate({ field: "description", value: description });
    }, [card, description, cardMutation, toast]);

    const handleMoveCardOnListOptionChanged = useCallback(
        (/** @type {React.ChangeEvent<HTMLSelectElement>} */ e) => {
            const newListId = e.target.value;
            handleMoveCardToList(card, newListId);

            const cards = boardState.cards[newListId] || [];
            setCardCount(cards?.length + 1 || 0);
            setPosition(cards?.length);
        },
        [card, handleMoveCardToList, boardState.cards],
    );

    const handleMoveByIndex = useCallback(
        (/** @type {React.ChangeEvent<HTMLSelectElement>} */ e) => {
            const insertedIndex = Number(e.target.value);

            if (isNaN(insertedIndex)) return;

            handleMoveCardByIndex(card, insertedIndex);
            setPosition(insertedIndex);
        },
        [card, handleMoveCardByIndex],
    );

    const handleDeleteCardLocal = useCallback(() => {
        handleDeleteCard(card);
        handleCancel();
    }, [card, handleDeleteCard, handleCancel]);

    const handleCopyCardLocal = useCallback(() => {
        handleCopyCard(card);
    }, [card, handleCopyCard]);

    const handlePaste = useCallback(
        (/** @type {React.ClipboardEvent<HTMLTextAreaElement>} */ e) => {
            const items = e.clipboardData?.items || [];
            let attachmentFile = null;
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.kind === "file" && item.type.startsWith("image/")) {
                    const file = item.getAsFile();
                    if (file) {
                        attachmentFile = file;
                        break;
                    }
                }
            }

            if (!attachmentFile) return;

            e.preventDefault();

            const pastedFile = new File(
                [attachmentFile],
                `pasted-${Date.now()}.${attachmentFile.type.split("/")[1] || "png"}`,
                { type: attachmentFile.type },
            );

            const formData = new FormData();
            formData.append("attachment", pastedFile);
            formData.append("docModel", "Card");
            formData.append("doc", card._id);

            fileUploadMutation.mutate(formData);
        },
        [card, fileUploadMutation],
    );

    return (
        <div
            className="fixed inset-0 z-40 bg-black/15 flex items-center justify-center overflow-hidden"
            onClick={handleCancel}
        >
            <div
                ref={modalRef}
                className="full-in-small-screen bg-[rgb(var(--card-item-bg))] border-3 border-gray-700 shadow-[6px_8px_0_0] shadow-gray-700 p-0 overflow-y-auto overflow-x-hidden gap-3 min-w-87.5 w-[90%] xl:w-200 md:w-[80%] h-fit max-h-[90%]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-[rgb(var(--card-item-bg))] relative w-full h-fit flex flex-col min-h-152 md:min-h-176">
                    <Loading
                        position={"absolute"}
                        fontSize={"1rem"}
                        loading={isProcessing}
                        displayText={"processing"}
                        displayTextClassName={
                            "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-41"
                        }
                        withLoader={true}
                    />

                    <TitleBar
                        title={title}
                        setTitle={setTitle}
                        card={card}
                        cardTitleInput={cardTitleInput}
                        confirmTitle={handleConfirmTitle}
                        cancel={handleCancel}
                        isScrolledDown={isScrolledDown}
                    />

                    <div className="p-3 pt-0 flex flex-col gap-3">
                        <ListSelectOptions
                            card={card}
                            listSelectOptions={listSelectOptions}
                            handleMoveCardOnListOptionChanged={
                                handleMoveCardOnListOptionChanged
                            }
                            moveByIndex={handleMoveByIndex}
                            cardCount={cardCount}
                            position={position}
                        />

                        <div className="w-full flex flex-wrap gap-3 border-black z-20">
                            <div className="relative w-full">
                                <textarea
                                    ref={cardDescriptionInput}
                                    className="overflow-y-auto border-2 shadow-[0_2px_0_0] border-gray-600 shadow-gray-600 min-h-55 wrap-break-word box-border text-sm py-2 px-3 w-full text-gray-600 bg-gray-100 leading-normal font-medium placeholder-gray-400 focus:outline-hidden"
                                    placeholder={"add description..."}
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
                                    onPaste={handlePaste}
                                />
                            </div>

                            <Actions
                                card={card}
                                description={description}
                                isSavingDescription={
                                    cardMutation.isPending &&
                                    cardMutation.variables.field ===
                                        "description"
                                }
                                confirmDescription={handleConfirmDescription}
                                copyCard={handleCopyCardLocal}
                                isVerifying={
                                    cardMutation.isPending &&
                                    cardMutation.variables.field === "verified"
                                }
                                handleToggleVerified={() =>
                                    cardMutation.mutate({
                                        field: "verified",
                                        value: !card.verified,
                                    })
                                }
                                deleteCard={handleDeleteCardLocal}
                                onHighlightChange={(
                                    /** @type {string | null} */ value,
                                ) =>
                                    cardMutation.mutate({
                                        field: "highlight",
                                        value,
                                    })
                                }
                            />
                        </div>

                        <Extra />

                        <Comments card={card} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CardModal;
