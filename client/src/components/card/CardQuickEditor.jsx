import { useRef, useState, useEffect } from "react";
import useBoardState from "../../hooks/useBoardState";
import QuickEditorHighlightPicker from "./QuickEditorHighlightPicker";
import { axiosPrivate } from "../../api/axios";
import { useSearchParams } from "react-router-dom";
import useToast from "../../hooks/useToast";

const CardQuickEditor = ({
    open,
    card,
    attribute,
    handleCopyCard,
    handleDeleteCard,
}) => {
    const {
        setOpenedCardQuickEditor,
        setCardTitle,
        setCardVerifiedStatus,
        theme,
        socket,
    } = useBoardState();

    const [initialTitle, setInitialTitle] = useState(card.title);
    const [openHighlightPicker, setOpenHighlightPicker] = useState(true);
    const [isVerifying, setIsVerifying] = useState(false);

    const textAreaRef = useRef();
    const quickEditorRef = useRef();

    const [searchParams, setSearchParams] = useSearchParams();

    const toast = useToast();

    useEffect(() => {
        if (quickEditorRef.current && textAreaRef.current && open === true) {
            textAreaRef.current.focus();
            textAreaRef.current.selectionStart =
                textAreaRef.current.value.length;

            const handleCloseOnKeydown = (e) => {
                if (e.key == "Escape") {
                    e.preventDefault();
                    close();
                }
            };

            quickEditorRef.current.addEventListener(
                "keydown",
                handleCloseOnKeydown,
            );

            return () => {
                quickEditorRef.current?.removeEventListener(
                    "keydown",
                    handleCloseOnKeydown,
                );
            };
        }
    }, [open]);

    const close = () => {
        setOpenedCardQuickEditor((prev) => {
            return { ...prev, open: false };
        });
    };

    const handleClose = (e) => {
        if (e.target === e.currentTarget) {
            setInitialTitle(textAreaRef.current.value);
            close();
        }
    };

    const handleSetCardTitle = async () => {
        if (textAreaRef.current.value === "") {
            setInitialTitle(card.title);
            return;
        }

        try {
            const newTitle = textAreaRef.current.value;
            setCardTitle(card.id, card.listId, newTitle);
            setInitialTitle(newTitle);
            await axiosPrivate.patch(
                `/cards/${card.id}/new-title`,
                JSON.stringify({ title: newTitle }),
            );
            socket.emit("updateCardTitle", {
                id: card.id,
                listId: card.listId,
                title: newTitle,
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
            const response = await axiosPrivate.patch(
                `/cards/${card.id}/toggle-verified`,
            );
            const { verified } = response.data;
            card.verified = verified;
            setCardVerifiedStatus(card.id, card.listId, verified);
            socket.emit("updateCardVerifiedStatus", {
                id: card.id,
                listId: card.listId,
                verified,
            });
        } catch (err) {
            toast.error("Failed to toggle verified");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleTextAreaChanged = () => {
        const textarea = textAreaRef.current;
        setInitialTitle(textarea.value);
        textarea.style.height = "auto";

        const littleOffset = 4; // prevent resizing when start typing
        textarea.style.height = `${textarea.scrollHeight + littleOffset}px`;
    };

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
        searchParams.set("card", card.id);
        setSearchParams(searchParams, { replace: true });
        close();
    };

    const handleOpenCardInNewTab = () => {
        window.open(`/b/${card.boardId}?card=${card.id}`, "_blank");
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
                className="fixed bg-gray-600 opacity-20 w-full h-full z-9"
            ></div>
            <div
                ref={quickEditorRef}
                className="absolute z-10"
                style={{
                    top: `${attribute.top}px`,
                    left: `${attribute.left}px`,
                    width: `${attribute.width}px`,
                    height: `${attribute.height}px`,
                    transform: `translateY(${-attribute.height - 1}px)`,
                }}
            >
                <div className="flex h-full relative mb-2">
                    <textarea
                        ref={textAreaRef}
                        className={`${theme.itemTheme == "rounded-sm" ? "rounded-sm" : ""} text-sm h-full bg-gray-50 border-2 py-4 px-4 text-gray-600 border-black shadow-[0_3px_0_0] shadow-black leading-normal overflow-y-hidden resize-none w-full font-medium placeholder-gray-400 focus:outline-hidden focus:bg-gray-50`}
                        style={{
                            boxShadow: `${card.highlight == null ? "0 3px 0 0 #4b5563" : `0 3px 0 0 ${card.highlight}`}`,
                            borderColor: `${card.highlight == null ? "#4b5563" : `${card.highlight}`}`,
                        }}
                        placeholder="Title for this card"
                        onChange={handleTextAreaChanged}
                        onKeyDown={handleTextAreaOnEnter}
                        value={initialTitle}
                        maxLength={200}
                    />
                    <div className="flex flex-col gap-2 absolute top-0 -right-1 translate-x-full justify-start items-start w-50">
                        {openHighlightPicker && (
                            <QuickEditorHighlightPicker card={card} />
                        )}

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
