import Icon from "../../shared/Icon";
import HighlightPicker from "../HighlightPicker";

export default function Actions({
    card,
    description,
    isSavingDescription,
    confirmDescription,
    openHighlightPicker,
    setOpenHighlightPicker,
    copyCard,
    isVerifying,
    handleToggleVerified,
    openCardDeleteConfirm,
    setOpenCardDeleteConfirm,
    deleteCard,
}) {
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
                {/* change highlight button */}
                <div className="relative h-10">
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
                            id="card__detail__highlight__picker"
                            setOpen={setOpenHighlightPicker}
                            card={card}
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

                <div className="relative h-10">
                    <button
                        title="delete this card"
                        onClick={() =>
                            setOpenCardDeleteConfirm((prev) => !prev)
                        }
                        className={`card--details--button border-rose-700 text-rose-700 ${openCardDeleteConfirm && "bg-rose-100"}`}
                    >
                        <Icon className="w-2.5 h-2.5" name="minus" />
                        <span className="hidden sm:inline-block">delete</span>
                    </button>

                    {openCardDeleteConfirm && (
                        <div
                            id="card__detail__delete__confirm"
                            className="bg-gray-100 border-2 shadow-[0_3px_0_0] border-gray-600 shadow-gray-600 absolute text-sm w-50 right-0 top-[120%] p-2"
                        >
                            This action cannot be undone. Are you sure you want
                            to delete this card?
                            <button
                                className="bg-rose-800 text-white font-medium p-2 w-full mt-1 hover:bg-rose-700"
                                onClick={deleteCard}
                            >
                                confirm delete
                            </button>
                            <button
                                className="bg-gray-600 text-white font-medium p-2 w-full mt-1 hover:bg-gray-500"
                                onClick={() => setOpenCardDeleteConfirm(false)}
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
