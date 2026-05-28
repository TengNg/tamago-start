import { useEffect, useRef, useState } from "react";
import useBoardState from "../../hooks/useBoardState";
import { lexorank } from "../../lib/lexorank";
import { axiosPrivate } from "../../api/axios";
import useToast from "../../hooks/useToast";
import { SOCKET_EVENTS } from "@shared/socket-events.js";

const CardComposer = ({ list, open, setOpen }) => {
    const [text, setText] = useState("");
    const { socket, addCardToList, deleteCard, boardState } = useBoardState();

    const textAreaRef = useRef();
    const composerRef = useRef();

    const [isAddingCard, setIsAddingCard] = useState(false);

    const boardId = boardState?.board?._id;

    const toast = useToast();

    useEffect(() => {
        const closeOnEscape = (e) => {
            if (e.key === "Escape") {
                setOpen(false);
            }
        };

        const handleClickOutside = (event) => {
            if (
                composerRef.current &&
                !composerRef.current.contains(event.target)
            ) {
                setOpen(false);
            }
        };

        window.addEventListener("keydown", closeOnEscape);
        window.addEventListener("mousedown", handleClickOutside);

        return () => {
            window.removeEventListener("keydown", closeOnEscape);
            window.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (textAreaRef.current && open) {
            textAreaRef.current.focus();
            composerRef.current.scrollIntoView({ block: "end" });
        }
    }, [open]);

    const handleTextAreaChanged = () => {
        const textarea = textAreaRef.current;
        setText(textarea.value);
        textarea.style.height = "auto";

        const littleOffset = 4; // prevent resizing when start typing
        textarea.style.height = `${textarea.scrollHeight + littleOffset}px`;
        composerRef.current.scrollIntoView({ block: "end" });
    };

    const handleTextAreaOnEnter = (e) => {
        if (!isAddingCard && e.key == "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleAddCard();
        }
    };

    const handleAddCard = async () => {
        setIsAddingCard(true);

        if (!text || text.trim() === "") {
            setOpen(false);
            return;
        }

        const currentCards = boardState.cards[list._id];
        const [rank, ok] = lexorank.insert(
            currentCards[currentCards.length - 1]?.order,
        );
        if (!ok) {
            toast.error("Failed to add new card - invalid rank");
            return;
        }

        const cardData = {
            boardId: boardId,
            listId: list._id,
            order: rank,
            title: textAreaRef.current.value,
        };

        const tempCard = {
            ...cardData,
            _id: "temp-" + Date.now(),
            onLoading: true,
        };

        try {
            // add temp card to list
            addCardToList(list._id, tempCard);

            // reset card composer block
            setText("");
            setOpen(false);

            // send post request
            const response = await axiosPrivate.post(
                "/cards",
                JSON.stringify(cardData),
            );

            const newCard = response.data.newCard;
            deleteCard(list._id, tempCard._id);
            addCardToList(list._id, newCard);

            socket.emit(SOCKET_EVENTS.CARD_CREATE, newCard);
            setOpen(true);
        } catch (err) {
            const errMsg =
                err?.response?.data?.message || "Failed to add new card";
            deleteCard(list._id, tempCard._id);
            toast.error(errMsg);
        }

        setIsAddingCard(false);
    };

    return (
        <div
            ref={composerRef}
            className={`flex flex-col gap-2 items-start justify-start mb-2 scroll-mb-4`}
        >
            <textarea
                disabled={isAddingCard}
                ref={textAreaRef}
                className="sm:text-sm h-fit bg-gray-50 border-2 py-4 px-4 text-gray-600 border-gray-500 shadow-[0_3px_0_0] shadow-gray-500 leading-normal overflow-y-hidden resize-none w-full font-medium placeholder-gray-400 focus:outline-hidden focus:bg-gray-50"
                placeholder="card title goes here..."
                onChange={handleTextAreaChanged}
                onKeyDown={handleTextAreaOnEnter}
                value={text}
                maxLength={200}
            ></textarea>
            <div className="flex gap-1 w-full">
                <button
                    onClick={handleAddCard}
                    className="button--style--dark grid place-items-center w-1/2 font-medium text-sm"
                >
                    + add
                </button>
                <button
                    onClick={() => setOpen(false)}
                    className="button--style grid place-items-center text-sm w-1/2 font-medium text-gray-600 border-gray-600 hover:underline"
                >
                    cancel
                </button>
            </div>
        </div>
    );
};

export default CardComposer;
