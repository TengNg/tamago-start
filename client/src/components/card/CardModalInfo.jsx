import { useState, useMemo } from "react";
import useBoardState from "../../hooks/useBoardState";
import dateFormatter from "../../utils/dateFormatter";
import PRIORITY_LEVELS from "../../data/priorityLevels";

import { formatDateToYYYYMMDD } from "../../utils/dateFormatter";

import { dateToCompare } from "../../utils/dateFormatter";
import Icon from "../shared/Icon";
import useToast from "../../hooks/useToast";
import Attachments from "./attachment/Attachments";
import Uploader from "./attachment/Uploader";
import ViewerDialog from "./attachment/ViewerDialog";

const CardModalInfo = ({
    card,
    handleCardOwnerChange,
    handleCardPriorityLevelChange,
    handleChangeDueDate,
}) => {
    const { boardState } = useBoardState();

    const [viewedAttachment, setViewedAttachment] = useState(null);

    const toast = useToast();

    const priorityLevel = card?.priorityLevel || "";
    const dueDate = card?.dueDate ? formatDateToYYYYMMDD(card.dueDate) : "";

    const memberNames = useMemo(() => {
        const ownerName = boardState.board.createdBy.username;
        const memberNames = boardState.board.members.map((m) => m.username);
        return [ownerName, ...memberNames];
    }, [boardState?.board]);

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
        <div className="relative flex flex-col gap-5 text-sm text-gray-700 p-4 border-[1px] border-gray-700">
            <button
                className="absolute top-2 right-2 border-[1px] border-slate-600 border-dashed py-1 px-2 text-slate-500 text-[9px] sm:text-[12px] hover:underline"
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
                        handleCardPriorityLevelChange(e.target.value)
                    }
                    className="font-medium max-w-[10rem] px-1 cursor-pointer appearance-none bg-transparent"
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

            <div className="flex flex-start items-center w-fit max-w-[30rem]">
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
                    onChange={(e) => handleCardOwnerChange(e.target.value)}
                    className="max-w-[10rem] cursor-pointer appearance-none bg-transparent text-gray-800 font-medium"
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

            <div className={`${dateToCompare(dueDate) && "text-red-700"}`}>
                <span>due: </span>
                <input
                    className="bg-transparent"
                    type="date"
                    id="due-date"
                    value={dueDate}
                    onChange={(e) => {
                        handleChangeDueDate(e.target.value);
                    }}
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
            <ViewerDialog
                viewedAttachment={viewedAttachment}
                setViewedAttachment={setViewedAttachment}
            />
        </div>
    );
};

export default CardModalInfo;
