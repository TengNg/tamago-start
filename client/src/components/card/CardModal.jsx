import { useEffect, useState, useRef, useMemo } from "react";
import useBoardState from "../../hooks/useBoardState";
import Loading from "../ui/Loading";
import { useSearchParams } from "react-router-dom";
import { axiosPrivate } from "../../api/axios";
import useToast from "../../hooks/useToast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SOCKET_EVENTS } from "@shared/socket-events.js";
import TitleBar from "./modal/TitleBar";
import ListSelectOptions from "./modal/ListSelectOptions";
import Actions from "./modal/Actions";
import Extra from "./modal/Extra";
import Comments from "./modal/Comments";

const CardModal = ({
    open,
    setOpen,
    processingCard,
    handleDeleteCard,
    handleCopyCard,
    handleMoveCardToList,
    handleMoveCardByIndex,
    abortController,
}) => {
    const {
        openedCard: card,
        boardState,
        setOpenedCard,
        updateCardField,
        socket,
    } = useBoardState();

    const queryClient = useQueryClient();

    const [openHighlightPicker, setOpenHighlightPicker] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState(card?.description);
    const [cardCount, setCardCount] = useState(0);
    const [position, setPosition] = useState(0);
    const [isVerifying, setIsVerifying] = useState(false);
    const [openCardDeleteConfirm, setOpenCardDeleteConfirm] = useState(false);
    const [isSavingDescription, setIsSavingDescription] = useState(false);
    const [isScrolledDown, setIsScrolledDown] = useState(false);

    const modalRef = useRef();
    const cardTitleInput = useRef();
    const cardDescriptionInput = useRef();
    const abortControllerRef = useRef(null);

    const [searchParams, setSearchParams] = useSearchParams();

    const toast = useToast();

    const fileUploadMutation = useMutation({
        mutationFn: async (formData) => {
            abortControllerRef.current = new AbortController();
            const response = await axiosPrivate.post(
                "/attachments/upload",
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                    signal: abortControllerRef.current.signal,
                },
            );
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["card-attachments", card._id], (old) => {
                if (!old) return old;
                return [...old, data];
            });

            toast.success("Attachment uploaded successfully");
            socket.emit(SOCKET_EVENTS.ATTACHMENT_CREATE, { attachment: data });
        },
        onError: (err) => {
            if (err.name === "CanceledError" || err.name === "AbortError") {
                return;
            }

            const errMsg =
                err.response?.data?.message || "Failed to upload attachment";
            toast.error(errMsg);
        },
    });

    useEffect(() => {
        if (open && card && cardDescriptionInput.current) {
            cardDescriptionInput.current.value = card?.description;
        }

        if (open && card) {
            setIsScrolledDown(false);
            setOpenCardDeleteConfirm(false);

            setTitle(card.title);
            setDescription(card.description);

            const cards = boardState.cards[card.listId];
            const cardCount = cards?.length || 0;
            const position = cards?.findIndex((el) => el._id === card._id) || 0;
            setCardCount(cardCount);
            setPosition(position);

            const handleKeyDown = (e) => {
                if (e.ctrlKey && e.key === "/") {
                    let descTextArea = modalRef.current?.querySelector(
                        "#card__detail__description__textarea",
                    );
                    if (descTextArea) {
                        descTextArea.focus();
                    }
                } else if (e.key === "Escape") {
                    const openNativeDialogs =
                        document.querySelectorAll("dialog[open]");
                    if (openNativeDialogs.length === 0) {
                        handleCancel(e);
                    }
                    return;
                }
            };

            const handleScroll = () => {
                if (modalRef.current) {
                    setIsScrolledDown(modalRef.current.scrollTop > 0);
                }
            };

            document.addEventListener("keydown", handleKeyDown);
            modalRef.current?.addEventListener("scroll", handleScroll);

            return () => {
                document.removeEventListener("keydown", handleKeyDown);
                modalRef.current?.removeEventListener("scroll", handleScroll);
                if (abortController) {
                    abortController.abort();
                }
            };
        }
    }, [open, card]);

    useEffect(() => {
        if (open && cardTitleInput.current && card?.title) {
            cardTitleInput.current.style.height = "auto";
            cardTitleInput.current.style.height = `${cardTitleInput.current.scrollHeight}px`;
        }
    }, [open, title, card?.title]);

    const listSelectOptions = useMemo(() => {
        return (
            boardState?.lists?.map((list) => {
                return { value: list._id, title: list.title };
            }) || []
        );
    }, [boardState?.lists]);

    const handleClick = (e) => {
        const hlPicker = modalRef.current?.querySelector(
            "#card__detail__highlight__picker",
        );
        if (hlPicker && e.target != hlPicker) {
            setOpenHighlightPicker(false);
        }

        const deleteConfirm = modalRef.current?.querySelector(
            "#card__detail__delete__confirm",
        );
        if (deleteConfirm && e.target != deleteConfirm) {
            setOpenCardDeleteConfirm(false);
        }
    };

    const handleCancel = (e) => {
        e.preventDefault();

        setOpen(false);
        setOpenedCard(undefined);

        if (abortController) {
            abortController.abort();
        }

        searchParams.delete("card");
        searchParams.delete("comment");
        setSearchParams(searchParams, { replace: true });

        document.title = boardState?.board?.title || "tamago-start";
    };

    const handleCardOwnerChange = async (memberName) => {
        try {
            const response = await axiosPrivate.patch(
                `/cards/${card._id}/new-owner`,
                JSON.stringify({ ownerName: memberName }),
            );
            const cardOwner = response?.data?.newCard?.owner || "";

            updateCardField({
                id: card._id,
                listId: card.listId,
                field: "owner",
                value: cardOwner,
            });

            setOpenedCard((prev) => {
                return { ...prev, owner: cardOwner };
            });

            socket.emit(SOCKET_EVENTS.CARD_UPDATE_OWNER, {
                cardId: card._id,
                listId: card.listId,
                username: cardOwner,
            });
        } catch (err) {
            toast.error("Failed to update owner");
        }
    };

    const handleCardPriorityLevelChange = async (value) => {
        try {
            const response = await axiosPrivate.patch(
                `/cards/${card._id}/new-priority`,
                JSON.stringify({ priorityLevel: value }),
            );
            const priorityLevel =
                response?.data?.newCard?.priorityLevel || "none";

            updateCardField({
                id: card._id,
                listId: card.listId,
                field: "priorityLevel",
                value: priorityLevel,
            });

            setOpenedCard((prev) => {
                return { ...prev, priorityLevel };
            });

            socket.emit(SOCKET_EVENTS.CARD_UPDATE_PRIORITY, {
                cardId: card._id,
                listId: card.listId,
                priorityLevel,
            });
        } catch (err) {
            toast.error("Failed to update priority-level");
        }
    };

    const handleMoveCardOnListOptionChanged = (e) => {
        const newListId = e.target.value;
        handleMoveCardToList(card, newListId);

        const cards = boardState.cards[newListId] || [];
        setCardCount(cards?.length + 1 || 0);
        setPosition(cards?.length);
    };

    const handleToggleVerified = async () => {
        if (isVerifying) {
            return;
        }

        try {
            setIsVerifying(true);
            const response = await axiosPrivate.patch(
                `/cards/${card._id}/toggle-verified`,
            );
            const { verified } = response.data;

            updateCardField({
                id: card._id,
                listId: card.listId,
                field: "verified",
                value: verified,
            });

            socket.emit(SOCKET_EVENTS.CARD_UPDATE_VERIFIED, {
                id: card._id,
                listId: card.listId,
                verified,
            });
        } catch (err) {
            toast.error("Failed to toggle verified");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleChangeDueDate = async (value) => {
        try {
            const response = await axiosPrivate.patch(
                `/cards/${card._id}/new-due-date`,
                JSON.stringify({ dueDate: value }),
            );
            const { dueDate } = response.data;

            setOpenedCard((prev) => {
                return { ...prev, dueDate };
            });

            updateCardField({
                id: card._id,
                listId: card.listId,
                field: "dueDate",
                value: dueDate,
            });

            socket.emit(SOCKET_EVENTS.CARD_UPDATE_DUE_DATE, {
                id: card._id,
                listId: card.listId,
                dueDate,
            });
        } catch (err) {
            toast.error("Failed to update due date");
        }
    };

    const confirmDescription = async () => {
        if (card?.description == description) {
            return;
        }

        if (description.length > 2_000) {
            toast.error(
                `Too long to save. Description is ${description.length} characters - maximum 2000 characters`,
            );
            return;
        }

        setIsSavingDescription(true);
        try {
            await axiosPrivate.patch(
                `/cards/${card._id}/new-description`,
                JSON.stringify({ description }),
            );

            updateCardField({
                id: card._id,
                listId: card.listId,
                field: "description",
                value: description,
            });

            socket.emit(SOCKET_EVENTS.CARD_UPDATE_DESCRIPTION, {
                id: card._id,
                listId: card.listId,
                description,
            });

            setOpenedCard((prev) => {
                return { ...prev, description };
            });
        } catch (err) {
            toast.error("Failed to save description");
        } finally {
            setIsSavingDescription(false);
        }
    };

    const confirmTitle = async (e) => {
        if (card.title === e.target.value.trim()) {
            return;
        }

        if (!e.target.value) {
            return;
        }

        try {
            await axiosPrivate.patch(
                `/cards/${card._id}/new-title`,
                JSON.stringify({ title: e.target.value.trim() }),
            );

            updateCardField({
                id: card._id,
                listId: card.listId,
                field: "title",
                value: e.target.value,
            });

            socket.emit(SOCKET_EVENTS.CARD_UPDATE_TITLE, {
                id: card._id,
                listId: card.listId,
                title: e.target.value.trim(),
            });
        } catch (err) {
            toast.error("Failed to update title");
        }
    };

    const deleteCard = () => {
        handleDeleteCard(card);
        setOpen(false);
    };

    const copyCard = () => {
        handleCopyCard(card);
    };

    const moveByIndex = (e) => {
        const insertedIndex = e.target.value;

        if (!insertedIndex) {
            return;
        }

        handleMoveCardByIndex(card, insertedIndex);
        setPosition(insertedIndex);
    };

    const paste = (e) => {
        const items = e.clipboardData?.items || [];
        let attachmentFile = null;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === "file" && item.type.startsWith("image/")) {
                const file = item.getAsFile();
                if (file) {
                    attachmentFile = item.getAsFile();
                    break;
                }
            }
        }

        if (!attachmentFile) {
            return;
        }

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
    };

    if (!open) {
        return null;
    }

    if (!card) {
        return (
            <div
                className="fixed inset-0 z-40 bg-black/15 flex items-center justify-center"
                onClick={handleCancel}
            >
                <div
                    className="overflow-y-auto overflow-x-hidden box--style text-gray-600 p-3 gap-3 pb-4 w-87.5 h-87.5 border-gray-600 border-2 bg-gray-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="w-full h-75 text-center flex flex-col items-center justify-center">
                        <span>getting card data</span>
                        <div className="loader mx-auto mt-8"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (card?.failedToLoad && card?.errMsg) {
        return (
            <div
                className="fixed inset-0 z-40 bg-black/15 flex items-center justify-center"
                onClick={handleCancel}
            >
                <div
                    className="overflow-y-auto overflow-x-hidden box--style text-gray-600 p-3 gap-3 pb-4 w-87.5 h-87.5 border-gray-600 border-2 bg-gray-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="w-full h-75 text-center flex flex-col items-center justify-center">
                        <span>{card?.errMsg}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 z-40 bg-black/15 flex items-center justify-center overflow-hidden"
            onClick={handleCancel}
        >
            <div
                ref={modalRef}
                className="full-in-small-screen bg-[rgb(var(--card-item-bg))] p-0 overflow-y-auto overflow-x-hidden box--style gap-3 min-w-87.5 w-[90%] xl:w-200 md:w-[80%] h-fit max-h-[90%]"
                style={{
                    boxShadow: "6px 8px 0 0 #4b5563",
                    border: "3px solid #4b5563",
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    handleClick(e);
                }}
            >
                <div className="bg-[rgb(var(--card-item-bg))] relative w-full h-fit flex flex-col min-h-152 md:min-h-176">
                    <Loading
                        position={"absolute"}
                        fontSize={"1rem"}
                        loading={processingCard.processing}
                        displayText={"action is in process, please wait"}
                        displayTextClassName={
                            "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                        }
                        withLoader={true}
                    />

                    <TitleBar
                        title={title}
                        setTitle={setTitle}
                        card={card}
                        cardTitleInput={cardTitleInput}
                        confirmTitle={confirmTitle}
                        handleCancel={handleCancel}
                        isScrolledDown={isScrolledDown}
                    />

                    <div className="p-3 pt-0 flex flex-col gap-3">
                        <ListSelectOptions
                            card={card}
                            listSelectOptions={listSelectOptions}
                            handleMoveCardOnListOptionChanged={
                                handleMoveCardOnListOptionChanged
                            }
                            moveByIndex={moveByIndex}
                            cardCount={cardCount}
                            position={position}
                        />

                        <div className="w-full flex flex-wrap border-b border-t py-4 gap-3 border-black z-20">
                            <div className="relative w-full">
                                <textarea
                                    ref={cardDescriptionInput}
                                    id="card__detail__description__textarea"
                                    className="overflow-y-auto border-2 shadow-[0_2px_0_0] border-gray-600 shadow-gray-600 min-h-62.5 wrap-break-word box-border text-sm py-2 px-3 w-full text-gray-600 bg-gray-100 leading-normal font-medium placeholder-gray-400 focus:outline-hidden"
                                    placeholder={"add description..."}
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
                                    onPaste={paste}
                                />
                            </div>

                            <Actions
                                card={card}
                                description={description}
                                isSavingDescription={isSavingDescription}
                                confirmDescription={confirmDescription}
                                openHighlightPicker={openHighlightPicker}
                                setOpenHighlightPicker={setOpenHighlightPicker}
                                copyCard={copyCard}
                                isVerifying={isVerifying}
                                handleToggleVerified={handleToggleVerified}
                                openCardDeleteConfirm={openCardDeleteConfirm}
                                setOpenCardDeleteConfirm={
                                    setOpenCardDeleteConfirm
                                }
                                deleteCard={deleteCard}
                            />
                        </div>

                        <Extra
                            card={card}
                            listSelectOptions={listSelectOptions}
                            handleCardOwnerChange={handleCardOwnerChange}
                            handleCardPriorityLevelChange={
                                handleCardPriorityLevelChange
                            }
                            handleChangeDueDate={handleChangeDueDate}
                        />

                        <Comments card={card} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CardModal;
