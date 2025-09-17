import { useEffect, useState, useRef, useMemo } from "react";
import useBoardState from "../../hooks/useBoardState";
import HighlightPicker from "./HighlightPicker";
import CardDetailInfo from "./CardDetailInfo";
import Loading from "../ui/Loading";

import { useSearchParams } from "react-router-dom";
import Icon from "../shared/Icon";
import CardComments from "./CardComments";
import { axiosPrivate } from "../../api/axios";

const CardDetail = ({
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
        setCardDescription,
        setCardPriorityLevel,
        setCardTitle,
        setCardOwner,
        setCardVerifiedStatus,
        setCardDueDate,
        socket,
    } = useBoardState();

    const [openHighlightPicker, setOpenHighlightPicker] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState(card?.description);
    const [cardCount, setCardCount] = useState(0);
    const [position, setPosition] = useState(0);
    const [isVerifying, setIsVerifying] = useState(false);
    const [openCardDeleteConfirm, setOpenCardDeleteConfirm] = useState(false);
    const [isSavingDescription, setIsSavingDescription] = useState(false);

    const dialog = useRef();
    const cardDescriptionInput = useRef();

    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        if (open && card && cardDescriptionInput.current) {
            cardDescriptionInput.current.value = card?.description;
        }

        if (open) {
            dialog.current.showModal();
            dialog.current.focus();

            // const textarea = dialog.current.querySelector('#card__title__textarea')
            // if (textarea) {
            //     textarea.blur();
            // }

            setOpenCardDeleteConfirm(false);

            setTitle(card?.title);
            setDescription(card?.description);

            const cards = boardState?.lists?.find(
                (list) => list._id === card?.listId,
            )?.cards;
            const cardCount = cards?.length || 0;
            const position = cards?.findIndex((el) => el._id === card._id) || 0;
            setCardCount(cardCount);
            setPosition(position);
            setCardDescription(card?.description);

            const handleKeyDown = (e) => {
                if (e.ctrlKey && e.key === "/") {
                    let descTextArea = dialog.current.querySelector(
                        "#card__detail__description__textarea",
                    );
                    if (descTextArea) {
                        descTextArea.focus();
                    }
                }
            };

            const handleOnClose = () => {
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

            dialog.current.addEventListener("close", handleOnClose);
            dialog.current.addEventListener("keydown", handleKeyDown);

            () => {
                dialog.current.removeEventListener("close", handleOnClose);
                dialog.current.removeEventListener("keydown", handleKeyDown);
            };
        }
    }, [open, card]);

    const listSelectOptions = useMemo(() => {
        return (
            boardState?.lists?.map((list) => {
                return { value: list._id, title: list.title };
            }) || []
        );
    }, [boardState?.lists]);

    const handleClick = (e) => {
        const hlPicker = dialog.current.querySelector(
            "#card__detail__highlight__picker",
        );
        if (hlPicker && e.target != hlPicker) {
            setOpenHighlightPicker(false);
        }

        const deleteConfirm = dialog.current.querySelector(
            "#card__detail__delete__confirm",
        );
        if (deleteConfirm && e.target != deleteConfirm) {
            setOpenCardDeleteConfirm(false);
        }

        if (e.target === dialog.current) {
            dialog.current.close();
        }
    };

    const handleCancel = (e) => {
        e.preventDefault();

        if (card?.description !== description) {
            alert("You have unsaved changes");
        }

        dialog.current.close();
    };

    const handleCardOwnerChange = async (memberName) => {
        try {
            const response = await axiosPrivate.patch(
                `/cards/${card._id}/member/update`,
                JSON.stringify({ ownerName: memberName }),
            );
            const cardOwner = response?.data?.newCard?.owner || "";
            setCardOwner(card._id, card.listId, cardOwner);

            setOpenedCard((prev) => {
                return { ...prev, owner: cardOwner };
            });

            socket.emit("updateCardOwner", {
                cardId: card._id,
                listId: card.listId,
                username: cardOwner,
            });
        } catch (err) {
            console.log(err);
        }
    };

    const handleCardPriorityLevelChange = async (value) => {
        try {
            const response = await axiosPrivate.patch(
                `/cards/${card._id}/priority/update`,
                JSON.stringify({ priorityLevel: value }),
            );
            const priorityLevel =
                response?.data?.newCard?.priorityLevel || "none";
            setCardPriorityLevel(card._id, card.listId, priorityLevel);

            setOpenedCard((prev) => {
                return { ...prev, priorityLevel };
            });

            socket.emit("updateCardPriorityLevel", {
                cardId: card._id,
                listId: card.listId,
                priorityLevel,
            });
        } catch (err) {
            console.log(err);
        }
    };

    const handleMoveCardOnListOptionChanged = (e) => {
        const newListId = e.target.value;
        handleMoveCardToList(card, newListId);

        const cards = boardState?.lists?.find(
            (list) => list._id === newListId,
        )?.cards;
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
            card.verified = verified;
            setCardVerifiedStatus(card._id, card.listId, verified);
            socket.emit("updateCardVerifiedStatus", {
                id: card._id,
                listId: card.listId,
                verified,
            });
        } catch (err) {
            console.log(err);
            alert("Failed to toggle verified");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleChangeDueDate = async (value) => {
        try {
            const response = await axiosPrivate.patch(
                `/cards/${card._id}/due-date/update`,
                JSON.stringify({ dueDate: value }),
            );
            const { dueDate } = response.data;

            setOpenedCard((prev) => {
                return { ...prev, dueDate };
            });

            card.dueDate = dueDate;

            setCardDueDate(card._id, card.listId, dueDate);
            socket.emit("updateCardDueDate", {
                id: card._id,
                listId: card.listId,
                dueDate,
            });
        } catch (err) {
            console.log(err);
            alert("Failed to toggle verified");
        } finally {
            setIsVerifying(false);
        }
    };

    const confirmDescription = async () => {
        if (card?.description == description) {
            return;
        }

        setIsSavingDescription(true);
        try {
            await axiosPrivate.patch(
                `/cards/${card._id}/new-description`,
                JSON.stringify({ description }),
            );
            setCardDescription(card._id, card.listId, description);
            socket.emit("updateCardDescription", {
                id: card._id,
                listId: card.listId,
                description,
            });

            setOpenedCard((prev) => {
                return { ...prev, description };
            });
        } catch (err) {
            console.log(err);
            alert("Failed to save description");
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
            setCardTitle(card._id, card.listId, e.target.value.trim());

            socket.emit("updateCardTitle", {
                id: card._id,
                listId: card.listId,
                title: e.target.value.trim(),
            });
        } catch (err) {
            console.log(err);
        }
    };

    const deleteCard = () => {
        handleDeleteCard(card);
        dialog.current.close();
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

    if (card === undefined) {
        return (
            <dialog
                ref={dialog}
                className="z-40 backdrop:bg-black/15 overflow-y-auto overflow-x-hidden box--style text-gray-600 p-3 gap-3 pb-4 w-[350px] h-[350px] border-gray-600 border-[2px] bg-gray-200"
                onClick={handleClick}
            >
                <div className="w-100 h-[300px] text-center flex flex-col items-center justify-center">
                    <span>getting card data</span>
                    <div className="loader mx-auto mt-8"></div>
                </div>
            </dialog>
        );
    }

    if (card?.failedToLoad && card?.errMsg) {
        return (
            <dialog
                ref={dialog}
                className="z-40 backdrop:bg-black/15 overflow-y-auto overflow-x-hidden box--style text-gray-600 p-3 gap-3 pb-4 w-[350px] h-[350px] border-gray-600 border-[2px] bg-gray-200"
                onClick={handleClick}
            >
                <div className="w-100 h-[300px] text-center grid items-center">
                    <span>{card?.errMsg}</span>
                </div>
            </dialog>
        );
    }

    return (
        <>
            <dialog
                ref={dialog}
                className="full-in-small-screen backdrop:bg-black/15 overflow-y-auto overflow-x-hidden box--style p-3 gap-3 pb-4 min-w-[350px] w-[90%] xl:w-[800px] md:w-[80%] h-fit max-h-[90%]"
                style={{
                    background: "rgb(235, 235, 235)",
                    boxShadow:
                        card.highlight == null
                            ? "6px 8px 0 0 #4b5563"
                            : `6px 8px 0 0 ${card.highlight}`,
                    border:
                        card.highlight == null
                            ? "3px solid #4b5563"
                            : `3px solid ${card.highlight}`,
                }}
                onClick={handleClick}
                onCancel={handleCancel}
            >
                <div className="relative w-full h-full flex flex-col gap-3 min-h-[38rem] md:min-h-[44rem]">
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

                    <div className="flex justify-start items start">
                        <div className="flex flex-col flex-1">
                            <textarea
                                rows="1"
                                className="card__title__textarea font-medium p-1 w-[90%] md:w-[95%] text-gray-600 bg-transparent leading-normal resize-none focus:bg-gray-100"
                                value={title}
                                onKeyDown={(e) => {
                                    if (e.key == "Enter") {
                                        confirmTitle(e);
                                        e.target.blur();
                                    }
                                }}
                                onFocus={(e) => {
                                    e.target.style.height = "auto";
                                    e.target.style.height = `${e.target.scrollHeight}px`;
                                }}
                                onChange={(e) => {
                                    setTitle(e.target.value);
                                    //e.target.style.height = 'auto';
                                    //e.target.style.height = `${e.target.scrollHeight}px`;
                                }}
                                maxLength={200}
                            />
                        </div>

                        <button
                            onClick={handleCancel}
                            style={{
                                color:
                                    card.highlight == null
                                        ? "#4b5563"
                                        : `${card.highlight}`,
                                opacity: card.highlight == null ? 1 : 0.75,
                            }}
                            className="text-[0.75rem] grid place-items-center rounded-sm absolute top-0 right-0 p-1 hover:bg-gray-400/20"
                        >
                            <Icon className="w-5 h-5" name="xmark" />
                        </button>
                    </div>

                    <div className="flex gap-2 md:w-[60%] w-full justify-between items-center">
                        <div className="flex flex-1 gap-2">
                            <select
                                className={`shadow-[0_2px_0_0] shadow-gray-600 bg-gray-100 appearance-none cursor-pointer hover:bg-gray-200 truncate border-[2px] border-gray-600 text-[0.75rem] font-medium w-3/4 py-2 px-4 text-gray-600 ${listSelectOptions.length === 0 ? "bg-gray-400" : ""}`}
                                value={card.listId}
                                onChange={(e) => {
                                    handleMoveCardOnListOptionChanged(e);
                                }}
                            >
                                {listSelectOptions.map((option, index) => {
                                    const { value, title } = option;
                                    return (
                                        <option key={index} value={value}>
                                            {title}
                                        </option>
                                    );
                                })}
                            </select>

                            <select
                                className={`shadow-[0_2px_0_0] shadow-gray-600 bg-gray-100 appearance-none cursor-pointer hover:bg-gray-200 truncate border-[2px] border-gray-600 text-[0.75rem] font-medium w-fit py-2 px-4 text-gray-600 ${listSelectOptions.length === 0 ? "bg-gray-400" : ""}`}
                                value={position}
                                onChange={(e) => {
                                    moveByIndex(e);
                                }}
                            >
                                {Array.from(Array(cardCount).keys()).map(
                                    (count) => {
                                        return (
                                            <option key={count} value={count}>
                                                {count + 1}
                                            </option>
                                        );
                                    },
                                )}
                            </select>
                        </div>
                    </div>

                    <div className="w-full flex flex-wrap border-b-[1px] border-t-[1px] py-4 gap-3 border-black z-20">
                        <div className="relative w-full">
                            <Loading
                                position={"absolute"}
                                fontSize={"0.85rem"}
                                loading={!card && !cardDescriptionInput.current}
                                displayText={"loading..."}
                            />

                            <textarea
                                ref={cardDescriptionInput}
                                id="card__detail__description__textarea"
                                className="overflow-y-auto border-[2px] shadow-[0_2px_0_0] border-gray-600 shadow-gray-600 min-h-[250px] break-words box-border text-sm py-2 px-3 w-full text-gray-600 bg-gray-100 leading-normal font-medium placeholder-gray-400 focus:outline-none"
                                autoFocus={true}
                                placeholder={"add description..."}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="relative flex flex-row justify-between w-full gap-3">
                            <div className="flex items-center gap-2">
                                <div className="h-[40px]">
                                    <button
                                        disabled={isSavingDescription}
                                        title={`${card?.description == description ? "nothing to save" : "save description"}`}
                                        onClick={confirmDescription}
                                        className={`card--details--button border-gray-600 text-gray-600 px-2 w-[6rem] sm:w-[7.5rem] ${card?.description == description ? "opacity-60" : ""}`}
                                    >
                                        {isSavingDescription
                                            ? "saving..."
                                            : "save"}
                                    </button>
                                </div>
                                {card?.description != description && (
                                    <p className="text-[0.75rem] text-gray-400">
                                        unsaved
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3">
                                {/* change highlight button */}
                                <div className="relative h-[40px]">
                                    <button
                                        title="change highlight color"
                                        onClick={() =>
                                            setOpenHighlightPicker(
                                                (prev) => !prev,
                                            )
                                        }
                                        className={`card--details--button border-gray-600 text-gray-600 ${openHighlightPicker && "bg-slate-500 shadow-black text-white"}`}
                                    >
                                        <Icon
                                            className="w-3 h-3"
                                            name="droplet"
                                        />
                                        <span className="hidden sm:inline-block">
                                            highlight
                                        </span>
                                    </button>

                                    {openHighlightPicker && (
                                        <HighlightPicker
                                            setOpen={setOpenHighlightPicker}
                                            card={card}
                                        />
                                    )}
                                </div>

                                <div className="h-[40px]">
                                    <button
                                        title="create a copy of this card"
                                        onClick={copyCard}
                                        className={`card--details--button border-gray-600 text-gray-600`}
                                    >
                                        <Icon className="w-3 h-3" name="copy" />
                                        <span className="hidden sm:inline-block">
                                            duplicate
                                        </span>
                                    </button>
                                </div>

                                <div className="h-[40px]">
                                    <button
                                        className={`card--details--button border-green-700 w-fit text-green-700 ${card.verified ? "bg-teal-100" : ""}`}
                                        onClick={handleToggleVerified}
                                        title={
                                            card.verified
                                                ? "click to unverify"
                                                : "click to verify"
                                        }
                                    >
                                        <Icon
                                            className="w-3 h-3"
                                            name="complete"
                                        />
                                        <span className="hidden sm:inline-block">
                                            {isVerifying
                                                ? "..."
                                                : card.verified
                                                  ? "verified"
                                                  : "verify"}
                                        </span>
                                    </button>
                                </div>

                                <div className="relative h-[40px]">
                                    <button
                                        title="delete this card"
                                        onClick={() =>
                                            setOpenCardDeleteConfirm(
                                                (prev) => !prev,
                                            )
                                        }
                                        className={`card--details--button border-rose-700 text-rose-700 ${openCardDeleteConfirm && "bg-rose-100"}`}
                                    >
                                        <Icon
                                            className="w-2.5 h-2.5"
                                            name="minus"
                                        />
                                        <span className="hidden sm:inline-block">
                                            delete
                                        </span>
                                    </button>

                                    {openCardDeleteConfirm && (
                                        <div
                                            id="card__detail__delete__confirm"
                                            className="bg-gray-100 border-[2px] shadow-[0_3px_0_0] border-gray-600 shadow-gray-600 absolute text-sm w-[200px] right-0 top-[120%] p-2"
                                        >
                                            This action cannot be undone. Are
                                            you sure you want to delete this
                                            card?
                                            <button
                                                className="bg-rose-800 text-white font-medium p-2 w-full mt-1 hover:bg-rose-700"
                                                onClick={deleteCard}
                                            >
                                                confirm delete
                                            </button>
                                            <button
                                                className="bg-gray-600 text-white font-medium p-2 w-full mt-1 hover:bg-gray-500"
                                                onClick={() =>
                                                    setOpenCardDeleteConfirm(
                                                        false,
                                                    )
                                                }
                                            >
                                                cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <CardDetailInfo
                        card={card}
                        listSelectOptions={listSelectOptions}
                        handleCardOwnerChange={handleCardOwnerChange}
                        handleCardPriorityLevelChange={
                            handleCardPriorityLevelChange
                        }
                        handleChangeDueDate={handleChangeDueDate}
                    />

                    {card && <CardComments card={card} />}
                </div>
            </dialog>
        </>
    );
};

export default CardDetail;
