import { useContext, useRef, useState, useEffect } from "react";
import useBoardState from "../../hooks/useBoardState";
import HighlightPicker from "./quick-editor/HighlightPicker";
import { updateCard } from "../../api/cardApi";
import { useSearchParams } from "react-router-dom";
import useToast from "../../hooks/useToast";
import { SOCKET_EVENTS } from "@shared/socket-events.js";
import { useKeybind } from "../../hooks/useKeybind";
import ModalStackContext from "../../context/ModalStackContext";

/**
 * @typedef {Object} CardQuickEditorProps
 * @property {Card} card
 * @property {{ top: number; left: number; width: number; height: number }} attribute
 * @property {(card: Card) => void} handleCopyCard
 * @property {(card: Card) => void} handleDeleteCard
 */

/**
 * @param {CardQuickEditorProps} props
 */
const CardQuickEditor = ({
    card,
    attribute,
    handleCopyCard,
    handleDeleteCard,
}) => {
    const { setOpenedCardQuickEditor, updateCardField, theme, socket } =
        useBoardState();

    const [initialTitle, setInitialTitle] = useState(card.title);
    const [openHighlightPicker, setOpenHighlightPicker] = useState(true);
    const [isVerifying, setIsVerifying] = useState(false);

    const { isAnyModalOpen } = useContext(ModalStackContext);

    const [searchParams, setSearchParams] = useSearchParams();

    const toast = useToast();

    /** @type {React.MutableRefObject<HTMLTextAreaElement | null>} */
    const textAreaRef = useRef(null);

    useKeybind("esc", () => {
        if (!isAnyModalOpen) close();
    });

    useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.focus();
            textAreaRef.current.selectionStart =
                textAreaRef.current.value.length;
        }
    }, []);

    const close = () => {
        setOpenedCardQuickEditor(undefined);
    };

    const handleSetCardTitle = async () => {
        if (!textAreaRef.current) {
            return;
        }

        if (textAreaRef.current.value.trim() === "") {
            setInitialTitle(card.title);
            return;
        }

        try {
            const newTitle = textAreaRef.current?.value || "";

            updateCardField({
                id: card._id,
                listId: card.listId,
                field: "title",
                value: newTitle,
            });

            setInitialTitle(newTitle);
            await updateCard(card._id, "title", newTitle);
            socket.emit(SOCKET_EVENTS.CARD_UPDATE, {
                id: card._id,
                listId: card.listId,
                field: "title",
                value: newTitle,
            });
        } catch (err) {
            toast.error("Failed to update title");
        }
    };

    const handleToggleVerified = async () => {
        if (isVerifying) {
            return;
        }

        try {
            setIsVerifying(true);
            const data = await updateCard(card._id, "verified", !card.verified);
            const { verified } = data;

            updateCardField({
                id: card._id,
                listId: card.listId,
                field: "verified",
                value: verified,
            });

            socket.emit(SOCKET_EVENTS.CARD_UPDATE, {
                id: card._id,
                listId: card.listId,
                field: "verified",
                value: verified,
            });
        } catch (err) {
            toast.error("Failed to toggle verified");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleTextAreaChange = () => {
        const textarea = textAreaRef.current;
        if (textarea) {
            setInitialTitle(textarea.value);
            const littleOffset = 4; // prevent resizing when start typing
            textarea.style.height = `${textarea.scrollHeight + littleOffset}px`;
        }
    };

    /**
     * @param {React.KeyboardEvent} e
     */
    const handleTextAreaOnEnter = (e) => {
        if (e.key == "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSetCardTitle();
            close();
        }
    };

    const handleSaveButtonOnClick = () => {
        handleSetCardTitle();
        close();
    };

    const handleVerifyButtonOnClick = () => {
        handleToggleVerified();
        close();
    };

    const handleOpenCardModal = () => {
        searchParams.set("card", card._id);
        setSearchParams(searchParams, { replace: true });
        close();
    };

    const handleOpenCardInNewTab = () => {
        window.open(`/b/${card.boardId}?card=${card._id}`, "_blank");
    };

    const handleToggleHighlightPicker = () => {
        setOpenHighlightPicker((prev) => !prev);
    };

    const deleteCard = () => {
        if (confirm("Delete this card, are you sure?")) {
            handleDeleteCard(card);
            close();
        }
    };

    const copyCard = () => {
        handleCopyCard(card);
        close();
    };

    return (
        <>
            <div
                onClick={close}
                className="fixed bg-gray-600 opacity-20 w-full h-full z-21"
            ></div>
            <div
                className="absolute z-21"
                style={{
                    top: `${attribute.top}px`,
                    left: `${attribute.left}px`,
                    width: `${attribute.width}px`,
                    height: `${attribute.height}px`,
                    transform: `translateY(${-attribute.height - 2}px)`,
                }}
            >
                <div className="flex h-full relative mb-2">
                    <textarea
                        ref={textAreaRef}
                        className={`${theme.itemTheme == "rounded-sm" ? "rounded-sm" : ""} text-sm h-full bg-gray-50 border-2 border-b-3 py-4 px-4 text-gray-600 leading-normal overflow-y-hidden resize-none w-full font-medium placeholder-gray-400`}
                        style={{
                            borderColor: `${card.highlight == null ? "#4b5563" : `${card.highlight}`}`,
                        }}
                        placeholder="Title for this card"
                        onChange={handleTextAreaChange}
                        onKeyDown={handleTextAreaOnEnter}
                        value={initialTitle}
                        maxLength={200}
                    />
                    <div className="flex flex-col gap-2 absolute top-0 -right-1 translate-x-full justify-start items-start w-50">
                        {openHighlightPicker && <HighlightPicker card={card} />}

                        <button
                            onClick={handleOpenCardModal}
                            className="hover:bg-gray-700 text-[0.75rem] text-white bg-gray-800 px-3 py-1 flex--center opacity-80"
                        >
                            open
                        </button>

                        <button
                            onClick={handleOpenCardInNewTab}
                            className="hover:bg-gray-700 text-[0.75rem] text-white bg-gray-800 px-3 py-1 flex--center opacity-80"
                        >
                            open in new tab
                        </button>

                        <button
                            onClick={handleToggleHighlightPicker}
                            className={`${openHighlightPicker ? "bg-gray-700" : "bg-gray-800"} hover:bg-gray-700 text-[0.75rem] text-white px-3 py-1 flex--center opacity-80 z-30`}
                        >
                            highlight
                        </button>

                        <button
                            onClick={copyCard}
                            className="hover:bg-gray-700 text-[0.75rem] text-white bg-gray-800 px-3 py-1 flex--center opacity-80"
                        >
                            duplicate
                        </button>

                        <button
                            onClick={deleteCard}
                            className="hover:bg-rose-700 text-[0.75rem] relative text-white bg-rose-800 px-3 py-1 flex--center opacity-80 z-30"
                        >
                            delete
                        </button>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleSaveButtonOnClick}
                        className="w-27.5 text-[0.75rem] text-white hover:bg-gray-700 bg-gray-800 px-4 py-2 flex--center opacity-80 z-0"
                    >
                        save
                    </button>

                    <button
                        onClick={handleVerifyButtonOnClick}
                        className={`${card.verified ? "bg-rose-800" : "bg-teal-800"} w-27.5 text-[0.75rem] text-white px-4 py-2 flex--center opacity-90 hover:opacity-80 z-0`}
                    >
                        {isVerifying
                            ? "..."
                            : card.verified
                              ? "unverify"
                              : "verify"}
                    </button>
                </div>
            </div>
        </>
    );
};

export default CardQuickEditor;
