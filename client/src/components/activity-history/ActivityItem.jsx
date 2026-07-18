import { BOARD_ACTIVITY_LABELS } from "../../constants/boardActivityLabels";
import dateFormatter from "../../utils/dateFormatter";
import Avatar from "../avatar/Avatar";
import useBoardState from "../../hooks/useBoardState";
import { useSearchParams } from "react-router-dom";

const DOC_COLORS = {
    Board: {
        border: "border-yellow-600",
        shadow: "shadow-yellow-600",
        bg: "bg-yellow-50",
        text: "text-yellow-800",
    },
    List: {
        border: "border-blue-700",
        shadow: "shadow-blue-700",
        bg: "bg-blue-50",
        text: "text-blue-800",
    },
    Card: {
        border: "border-teal-600",
        shadow: "shadow-teal-600",
        bg: "bg-teal-50",
        text: "text-teal-800",
    },
};

/** @param {{ activity: ActivityItem }} props */
const ActivityItem = ({ activity }) => {
    const { action, user, docModel, doc, docTitle, description, createdAt } =
        activity;
    const colors = DOC_COLORS[docModel] || DOC_COLORS.Board;

    const label =
        BOARD_ACTIVITY_LABELS[
            /** @type {keyof typeof BOARD_ACTIVITY_LABELS} */ (action)
        ] ?? action;
    const docName = doc?.title || docTitle || null;

    return (
        <div
            className={`flex flex-col gap-2 text-[12px] sm:text-sm shadow-[0_3px_0_0] border-2 ${colors.border} ${colors.shadow} ${colors.bg} p-3`}
        >
            <div>
                <span className={`font-medium ${colors.text}`}>{label}</span>
                {docName && (
                    <DocTitle
                        docModel={docModel}
                        doc={doc}
                        title={docName}
                        colors={colors}
                    />
                )}
            </div>
            {description && (
                <div>
                    <span>details:</span>
                    <span> </span>
                    <span className="font-medium wrap-break-word whitespace-pre-line">
                        {description}
                    </span>
                </div>
            )}
            <div>
                <div className="inline-block">
                    <div className="w-fit inline-block">
                        <Avatar
                            size="xsm"
                            noShowRole={true}
                            username={user?.username}
                            createdAt={user?.createdAt}
                        />
                    </div>
                    <span className="font-medium ms-1.25">
                        {user?.username}
                    </span>
                </div>
                <span> </span>
                on {dateFormatter(createdAt)}
            </div>
        </div>
    );
};

/** @param {{
 *   docModel: string;
 *   doc?: { _id: string; title: string };
 *   title: string;
 *   colors: typeof DOC_COLORS[keyof typeof DOC_COLORS];
 * }} props */
const DocTitle = ({ docModel, doc, title, colors }) => {
    const { setOpenBoardActivities } = useBoardState();
    const [searchParams, setSearchParams] = useSearchParams();

    if (docModel === "Card" && doc?._id) {
        return (
            <>
                <span> </span>
                <span
                    className={`font-medium underline cursor-pointer wrap-break-word whitespace-pre-line ${colors.text}`}
                    onClick={() => {
                        setOpenBoardActivities(false);
                        searchParams.set("card", doc._id);
                        setSearchParams(searchParams, { replace: true });
                    }}
                >
                    {title}
                </span>
            </>
        );
    }

    return (
        <>
            <span> </span>
            <span
                className={`font-medium wrap-break-word whitespace-pre-line ${colors.text} border px-1 ${colors.border}`}
            >
                {title}
            </span>
        </>
    );
};

export default ActivityItem;
