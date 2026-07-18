import { useState, useRef, useContext } from "react";
import Icon from "../../shared/Icon";
import HighlightPicker from "./HighlightPicker";
import useClickOutside from "../../../hooks/useClickOutside";
import ModalStackContext from "../../../context/ModalStackContext";

/**
 * @param {object} props
 * @param {Card} props.card
 * @param {string} props.description
 * @param {boolean} props.isSavingDescription
 * @param {() => void} props.confirmDescription
 * @param {() => void} props.copyCard
 * @param {boolean} props.isVerifying
 * @param {() => void} props.handleToggleVerified
 * @param {() => void} props.deleteCard
 * @param {(value: string | null) => void} props.onHighlightChange
 */
export default function Actions({
    card,
    description,
    isSavingDescription,
    confirmDescription,
    copyCard,
    isVerifying,
    handleToggleVerified,
    deleteCard,
    onHighlightChange,
}) {
    const { isAnyModalOpen } = useContext(ModalStackContext);

    const [openHighlightPicker, setOpenHighlightPicker] = useState(false);
    const [openDeleteConfirmation, setOpenDeleteConfirmation] = useState(false);

    const hlPickerRef = useRef(null);
    const deleteConfirmRef = useRef(null);

    useClickOutside(hlPickerRef, () => {
        if (!isAnyModalOpen && openHighlightPicker) {
            setOpenHighlightPicker(false);
        }
    });

    useClickOutside(deleteConfirmRef, () => {
        if (!isAnyModalOpen && openDeleteConfirmation) {
            setOpenDeleteConfirmation(false);
        }
    });

    return (
        <div className="relative flex flex-row justify-between w-full gap-3">
            <div className="flex items-center gap-2">
                <div className="h-10">
                    <button
                        disabled={isSavingDescription}
                        title="save description"
                        onClick={confirmDescription}
                        className={`card--details--button justify-between border-gray-600 text-gray-600 px-3 sm:w-20 sm:min-w-20 ${card?.description == description ? "opacity-60" : ""}`}
                    >
                        <Icon name="save" className="w-5 h-5" />
                        <div className="hidden sm:inline-block">
                            {isSavingDescription ? "..." : "save"}
                        </div>
                    </button>
                </div>
                {card?.description != description && (
                    <p className="text-[0.75rem] text-gray-400">unsaved</p>
                )}
            </div>

            <div className="flex gap-3">
                <div className="relative h-10" ref={hlPickerRef}>
                    <button
                        title="change highlight color"
                        onClick={() => setOpenHighlightPicker((prev) => !prev)}
                        className={`card--details--button border-gray-600 text-gray-600 ${openHighlightPicker && "bg-slate-500 shadow-black text-white"}`}
                    >
                        <Icon className="w-3 h-3" name="droplet" />
                        <span className="hidden sm:inline-block">
                            highlight
                        </span>
                    </button>

                    {openHighlightPicker && (
                        <HighlightPicker
                            setOpen={setOpenHighlightPicker}
                            card={card}
                            onHighlightChange={onHighlightChange}
                        />
                    )}
                </div>

                <div className="h-10">
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

                <div className="h-10">
                    <button
                        className={`card--details--button border-green-700 w-fit text-green-700 ${card.verified ? "bg-teal-100" : ""}`}
                        onClick={handleToggleVerified}
                        title={
                            card.verified
                                ? "click to unverify"
                                : "click to verify"
                        }
                    >
                        <Icon className="w-3 h-3" name="complete" />
                        <span className="hidden sm:inline-block">
                            {isVerifying
                                ? "..."
                                : card.verified
                                  ? "verified"
                                  : "verify"}
                        </span>
                    </button>
                </div>

                <div className="relative h-10" ref={deleteConfirmRef}>
                    <button
                        title="delete this card"
                        onClick={() =>
                            setOpenDeleteConfirmation((prev) => !prev)
                        }
                        className={`card--details--button border-rose-700 text-rose-700 ${openDeleteConfirmation && "bg-rose-100"}`}
                    >
                        <Icon className="w-2.5 h-2.5" name="minus" />
                        <span className="hidden sm:inline-block">delete</span>
                    </button>

                    {openDeleteConfirmation && (
                        <div className="bg-gray-100 border-2 shadow-[0_3px_0_0] border-gray-600 shadow-gray-600 absolute text-sm w-50 -bottom-1 right-0 translate-y-full translate-x-0 p-2">
                            This action cannot be undone. Are you sure you want
                            to delete this card?
                            <button
                                className="bg-rose-800 text-white font-medium p-2 w-full mt-2 hover:bg-rose-700"
                                onClick={deleteCard}
                            >
                                confirm delete
                            </button>
                            <button
                                className="bg-gray-600 text-white font-medium p-2 w-full mt-1 hover:bg-gray-500"
                                onClick={() => setOpenDeleteConfirmation(false)}
                            >
                                cancel
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
