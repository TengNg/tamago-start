import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Loading from "../ui/Loading";
import dateFormatter from "../../utils/dateFormatter";
import PRIORITY_LEVELS from "../../data/priorityLevels";
import Icon from "../shared/Icon";
import useToast from "../../hooks/useToast";

const BoardStats = ({ boardStatsModal, setBoardStatsModal }) => {
    const dialog = useRef();

    const close = () => setBoardStatsModal({ ...boardStatsModal, open: false });
    // const open = () => setBoardStatsModal({ ...boardStatsModal, open: true });

    const toast = useToast();

    const navigate = useNavigate();

    useEffect(() => {
        if (boardStatsModal.open) {
            dialog.current.showModal();

            const handleOnClose = () => {
                close();
            };

            dialog.current.addEventListener("close", handleOnClose);

            () => {
                dialog.current.removeEventListener("close", handleOnClose);
            };
        } else {
            dialog.current.close();
        }
    }, [boardStatsModal.open]);

    const handleCloseOnOutsideClick = (e) => {
        if (e.target === dialog.current) {
            dialog.current.close();
        }
    };

    const handleClose = () => {
        dialog.current.close();
    };

    return (
        <dialog
            ref={dialog}
            className="z-40 backdrop:bg-black/15 box--style gap-4 items-start p-3 h-fit min-w-[350px] max-h-[600px] border-black border-[2px] bg-gray-200"
            onClick={handleCloseOnOutsideClick}
        >
            <Loading
                loading={boardStatsModal.loadingData}
                position="absolute"
                displayText="loading board stats..."
                fontSize="1rem"
            />

            <div className="flex w-full justify-between items-center border-b-[1px] border-black pb-3">
                <p className="font-normal text-[1rem] text-gray-700">
                    {boardStatsModal?.board?.title} .inf
                </p>
                <button
                    className="text-gray-600 flex justify-center items-center"
                    onClick={handleClose}
                >
                    <Icon className="w-4 h-4" name="xmark" />
                </button>
            </div>

            <div className="w-full relative flex flex-col items-start gap-3 py-2 mt-2">
                <div className="h-[50px] w-full flex justify-between items-center gap-2 text-gray-700 text-[0.65rem] sm:text-[0.75rem] border-[1px] border-dashed border-gray-700 p-4">
                    <p>
                        code:{" "}
                        <span
                            className="font-medium hover:underline cursor-pointer"
                            onClick={() => {
                                if (boardStatsModal?.board?._id) {
                                    navigator.clipboard.writeText(
                                        boardStatsModal?.board?._id,
                                    );
                                    toast.success("code copied to clipboard");
                                }
                            }}
                        >
                            {boardStatsModal?.board?._id}
                        </span>
                    </p>

                    <button
                        className="p-3 bg-gray-200 hover:bg-indigo-200 rounded group"
                        onClick={() =>
                            navigate(`/b/${boardStatsModal?.board?._id}`)
                        }
                        title="visit board"
                    >
                        <div className="w-[10px] h-[10px] bg-gray-300 group-hover:bg-indigo-400 rounded-full"></div>
                    </button>
                </div>

                <div className="w-full flex flex-col gap-2 text-gray-700 text-[0.65rem] sm:text-[0.75rem] border-[1px] border-dashed border-gray-700 p-4">
                    <div className="flex gap-2">
                        members:
                        <span className="font-medium">
                            {boardStatsModal.board?.members?.length > 0
                                ? boardStatsModal.board?.members
                                      ?.map((member) => member.username)
                                      .join(", ")
                                : "<none>"}
                        </span>
                    </div>
                </div>

                <div className="w-full flex flex-col gap-2 text-gray-700 text-[0.65rem] sm:text-[0.75rem] border-[1px] border-dashed border-gray-700 p-4">
                    <p>
                        list count:{" "}
                        <span className="font-medium">
                            {boardStatsModal.board?.listCount}
                        </span>
                    </p>

                    <p>
                        created by:{" "}
                        <span className="font-medium">
                            {boardStatsModal.board?.createdBy?.username}
                        </span>
                    </p>

                    <p>
                        created at:{" "}
                        <span className="font-medium">
                            {dateFormatter(boardStatsModal.board?.createdAt)}
                        </span>
                    </p>
                </div>

                <div className="relative w-full flex flex-col gap-2 text-gray-700 text-[0.65rem] sm:text-[0.75rem] border-[1px] border-dashed border-gray-700 px-4 pb-4 pt-3">
                    <div className="flex justify-between">
                        <p>cards by status:</p>

                        <div className="flex items-center gap-3">
                            <button
                                className="text-[12px] text-gray-400 font-medium hover:text-yellow-600 hover:underline"
                                onClick={() => {
                                    const json = JSON.stringify(
                                        boardStatsModal.stats,
                                        null,
                                        2,
                                    );
                                    navigator.clipboard
                                        .writeText(json)
                                        .then(() => {
                                            toast.success(
                                                "stats copied to clipboard (as json format)",
                                            );
                                        });
                                }}
                                title="copy board stats (json)"
                            >
                                json
                            </button>
                            <button
                                className="text-[12px] text-gray-400 font-medium hover:text-purple-600 hover:underline"
                                onClick={() => {
                                    let str = "";

                                    boardStatsModal.stats.forEach((item) => {
                                        str += `${item._id}: ${item.count}\n`;
                                    });

                                    navigator.clipboard
                                        .writeText(str)
                                        .then(() => {
                                            toast.success(
                                                "stats copied to clipboard",
                                            );
                                        });
                                }}
                                title="copy board stats (text)"
                            >
                                txt
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        {boardStatsModal.stats.map((item) => {
                            const { _id, count } = item;
                            return (
                                <div
                                    key={_id}
                                    className="w-full p-1 px-3 text-gray-50 font-semibold cursor-pointer rounded-sm hover:opacity-80"
                                    style={{
                                        backgroundColor:
                                            PRIORITY_LEVELS[`${_id}`]?.color ||
                                            "rgba(133, 149, 173, 0.8)",
                                    }}
                                    onClick={() => {
                                        navigate({
                                            pathname: `/b/${boardStatsModal?.board?._id}`,
                                            search: `?priority=${_id}`,
                                        });
                                    }}
                                >
                                    {_id.toUpperCase()}: {count}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div
                    className="w-full gap-2 text-gray-700 text-[0.65rem] sm:text-[0.75rem] border-[1px] border-dashed border-gray-700 py-2 px-4 cursor-pointer"
                    onClick={() => {
                        navigate({
                            pathname: `/b/${boardStatsModal?.board?._id}`,
                            search: "?stale=true",
                        });
                    }}
                >
                    stale cards:{" "}
                    <span className="font-medium">
                        {boardStatsModal?.staleCardCount || "0"}
                    </span>
                </div>
            </div>
        </dialog>
    );
};

export default BoardStats;
