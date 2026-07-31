import { useEffect, useRef, useState } from "react";
import useBoardMutations from "../../hooks/useBoardMutations";
import useToast from "../../hooks/useToast";

/**
 * @param {{
 *   list: List;
 *   open: boolean;
 *   setOpen: React.Dispatch<React.SetStateAction<boolean>>;
 * }} props
 */
const CardComposer = ({ list, open, setOpen }) => {
    const { createCard, isCreatingCard } = useBoardMutations();

    /** @type {React.MutableRefObject<HTMLTextAreaElement | null>} */
    const textAreaRef = useRef(null);

    /** @type {React.MutableRefObject<HTMLDivElement | null>} */
    const composerRef = useRef(null);

    const [text, setText] = useState("");

    const toast = useToast();

    useEffect(() => {
        const handleClickOutside = (/** @type {MouseEvent} */ event) => {
            if (
                composerRef.current &&
                !composerRef.current.contains(
                    /** @type {Node} */ (event.target),
                )
            ) {
                setOpen(false);
            }
        };

        window.addEventListener("mousedown", handleClickOutside);

        return () => {
            window.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (textAreaRef.current && open) {
            textAreaRef.current.focus();
        }

        if (composerRef.current) {
            composerRef.current.scrollIntoView({ block: "end" });
        }
    }, [open]);

    const handleTextAreaChanged = () => {
        const textarea = textAreaRef.current;
        if (textarea) {
            setText(textarea.value);
        }
    };

    /** @param {React.KeyboardEvent<HTMLTextAreaElement>} e */
    const handleTextAreaOnEnter = (e) => {
        if (!isCreatingCard && e.key == "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleAddCard();
        }
    };

    const handleAddCard = async () => {
        if (!text || text.trim() === "") {
            setOpen(false);
            return;
        }

        setText("");
        setOpen(false);

        try {
            await createCard({ listId: list._id, title: text });
            setOpen(true);
        } catch {
            toast.error("Failed to add card");
        }
    };

    return (
        <div
            ref={composerRef}
            className={`flex flex-col gap-2 items-start justify-start mb-2 scroll-mb-4`}
        >
            <textarea
                disabled={isCreatingCard}
                ref={textAreaRef}
                className="sm:text-sm h-auto bg-gray-50 border-2 py-4 px-4 text-gray-600 border-gray-500 shadow-[0_3px_0_0] shadow-gray-500 leading-normal overflow-y-hidden resize-none w-full font-medium placeholder-gray-400 focus:outline-hidden focus:bg-gray-50"
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
