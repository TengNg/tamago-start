import { useEffect, useRef, useState } from "react";
import useBoardState from "../../hooks/useBoardState";
import { lexorank } from "../../utils/class/Lexorank";
import { axiosPrivate } from "../../api/axios";

const CardComposer = ({ list, open, setOpen }) => {
    const [text, setText] = useState("");
    const {
        socket,
        addCardToList: _,
        setBoardState,
        boardState,
    } = useBoardState();

    const textAreaRef = useRef();
    const composerRef = useRef();

    const [isAddingCard, setIsAddingCard] = useState(false);

    const boardId = boardState?.board?._id;

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
        if (textAreaRef.current && open === true) {
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

        const currentList = [...boardState.lists].find(
            (el) => el._id === list._id,
        );

        const [rank, _] = lexorank.insert(
            currentList.cards[currentList.cards.length - 1]?.order,
        );

        const cardData = {
            _id: crypto.randomUUID(),
            trackedId: crypto.randomUUID(),
            boardId: boardId,
            listId: list._id,
            order: rank,
            title: textAreaRef.current.value.trim(),
            createdAt: Date.now(),
        };

        let tempLists = undefined;

        try {
            // deep copy, need this when failed to add new card
            tempLists = JSON.parse(JSON.stringify([...boardState.lists]));

            // create temp card (with loading state)
            const tmpCard = { ...cardData, onLoading: true };

            // add temp card to list
            setBoardState((prev) => {
                return {
                    ...prev,
                    lists: prev.lists.map((el) =>
                        el._id === list._id
                            ? { ...el, cards: [...el.cards, tmpCard] }
                            : el,
                    ),
                };
            });

            // reset card composer block
            setText("");
            setOpen(false);

            // send post request
            const response = await axiosPrivate.post(
                "/cards",
                JSON.stringify(cardData),
            );
            const { newCard } = response.data;

            setBoardState((prev) => {
                return {
                    ...prev,
                    lists: prev.lists.map((el) => {
                        if (el._id === newCard.listId) {
                            const cards = el.cards;
                            const newCards = [...cards].map((c) =>
                                c.trackedId === newCard.trackedId ? newCard : c,
                            );
                            return { ...el, cards: newCards };
                        } else {
                            return el;
                        }
                    }),
                };
            });

            setOpen(true);
            socket.emit("addCard", newCard);
        } catch (err) {
            console.log(err);
            const errMsg = err?.response?.data?.msg || "Failed to add new card";
            alert(errMsg);
            setBoardState((prev) => {
                return { ...prev, lists: tempLists };
            });
        }

        setIsAddingCard(false);
    };

    return (
        <div
            ref={composerRef}
            className={`flex flex-col gap-2 items-start justify-start mb-2`}
        >
            <textarea
                disabled={isAddingCard}
                ref={textAreaRef}
                className="sm:text-sm h-fit bg-gray-50 border-[2px] py-4 px-4 text-gray-600 border-gray-500 shadow-[0_3px_0_0] shadow-gray-500 leading-normal overflow-y-hidden resize-none w-full font-medium placeholder-gray-400 focus:outline-none focus:bg-gray-50"
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
