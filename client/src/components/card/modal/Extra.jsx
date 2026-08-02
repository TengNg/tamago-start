import { useState, useMemo, useContext } from "react";
import useBoardState from "../../../hooks/useBoardState";
import CardModalContext from "../../../context/CardModalContext";
import dateFormatter from "../../../utils/dateFormatter";
import PRIORITY_LEVELS from "../../../constants/priorityLevels";

import { isPastDue } from "../../../utils/dateFormatter";
import Icon from "../../shared/Icon";
import useToast from "../../../hooks/useToast";
import Attachments from "../attachment/Attachments";
import Uploader from "../attachment/Uploader";
import ViewerDialog from "../attachment/ViewerDialog";
import Modal from "../../ui/Modal";
import DatePicker from "./DatePicker";

const Extra = () => {
    const { boardState } = useBoardState();
    const { card, cardMutation } = useContext(CardModalContext);

    const [viewedAttachment, setViewedAttachment] = useState(
        /** @type {Attachment | null} */ (null),
    );

    const toast = useToast();

    const priorityLevel = card?.priorityLevel || "";

    const isSavingDueDate =
        cardMutation.isPending && cardMutation.variables?.field === "dueDate";

    const memberNames = useMemo(() => {
        return boardState.members.map((m) => m.username);
    }, [boardState.members]);

    /**
     * @param {React.MouseEvent<HTMLButtonElement>} e
     */
    function handleCopyCardCode(e) {
        const button = e.currentTarget;
        if (button.textContent === "✓ copied") {
            return;
        }

        navigator.clipboard.writeText(card?._id).then(() => {
            button.textContent = "✓ copied";
        });

        toast.success("Code copied to clipboard");
    }

    return (
        <div className="relative flex flex-col gap-5 text-sm text-gray-700 p-4 border border-gray-700">
            <button
                className="absolute top-2 right-2 border border-slate-600 border-dashed py-1 px-2 text-slate-500 text-[9px] sm:text-[12px] hover:underline"
                onClick={handleCopyCardCode}
                title="copy card code"
            >
                code
            </button>

            <div className="flex flex-start items-center w-fit">
                <span className="me-2">priority:</span>
                {priorityLevel != "none" && (
                    <div
                        className="h-2.5 w-2.5"
                        style={{
                            background:
                                PRIORITY_LEVELS[`${priorityLevel}`]?.color ||
                                "gray",
                            filter: "brightness(0.8)",
                        }}
                    ></div>
                )}
                <select
                    value={priorityLevel}
                    onChange={(e) =>
                        cardMutation.mutate({
                            field: "priorityLevel",
                            value: e.target.value,
                        })
                    }
                    className="font-medium max-w-40 px-1 cursor-pointer appearance-none bg-transparent"
                    style={{
                        color:
                            PRIORITY_LEVELS[`${priorityLevel}`]?.color ||
                            "gray",
                        filter: "brightness(0.8)",
                    }}
                >
                    {Object.values(PRIORITY_LEVELS).map((el, _) => {
                        return (
                            <option value={el.value} key={el.value}>
                                {el.title === "NONE" ? "..." : el.title}
                            </option>
                        );
                    })}
                </select>
            </div>

            <div className="flex flex-start items-center w-fit max-w-120">
                <span className="me-2">owner:</span>
                {card.owner && (
                    <Icon
                        name="profile2"
                        className="text-gray-700 me-0.5"
                        width={18}
                        height={18}
                    />
                )}
                <select
                    value={card.owner || ""}
                    onChange={(e) =>
                        cardMutation.mutate({
                            field: "owner",
                            value: e.target.value,
                        })
                    }
                    className="max-w-40 cursor-pointer appearance-none bg-transparent text-gray-800 font-medium"
                >
                    <option value={""}>...</option>
                    {memberNames.map((memberName) => {
                        return (
                            <option value={memberName} key={memberName}>
                                {memberName}
                            </option>
                        );
                    })}
                </select>
            </div>

            <div
                className={`flex flex-start items-center w-fit max-w-40 ${isPastDue(card?.dueDate) && "text-red-700"}`}
            >
                <span className="me-2">due:</span>
                <DatePicker
                    value={card?.dueDate}
                    onChange={(value) =>
                        cardMutation.mutate({ field: "dueDate", value })
                    }
                    isPastDue={isPastDue(card?.dueDate)}
                    isLoading={isSavingDueDate}
                />
            </div>

            <div>
                <span>created: </span>
                {dateFormatter(card.createdAt)}
            </div>

            <div>
                <span>updated: </span>
                {card.updatedAt ? dateFormatter(card.updatedAt) : "not found"}
            </div>

            <div className="h-px w-full bg-gray-700"></div>

            <Attachments
                card={card}
                setViewedAttachment={setViewedAttachment}
            />
            <Uploader card={card} />
            <Modal
                open={!!viewedAttachment}
                setOpen={() => setViewedAttachment(null)}
                title={viewedAttachment?.originalname}
                showCloseButton={true}
                className="w-auto min-w-81.25"
            >
                <ViewerDialog
                    viewedAttachment={
                        /** @type {Attachment} */ (viewedAttachment)
                    }
                />
            </Modal>
        </div>
    );
};

export default Extra;
