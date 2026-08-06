import { useNavigate } from "react-router-dom";
import Loading from "../ui/Loading";
import dateFormatter from "../../utils/dateFormatter";
import PRIORITY_LEVELS from "../../constants/priorityLevels";
import useToast from "../../hooks/useToast";
import { useQuery } from "@tanstack/react-query";
import { boardApi } from "../../services/api";
import { boardKeys } from "../../queries/boardKeys";
import Modal from "../ui/Modal";
import Icon from "../shared/Icon";

/**
 * @param {{
 *   boardId: string;
 *   open: boolean;
 *   setOpen: React.Dispatch<React.SetStateAction<boolean>>;
 * }} props
 */
const BoardStatsModal = ({ boardId, open, setOpen }) => {
    const toast = useToast();
    const navigate = useNavigate();

    const statsQuery = useQuery({
        queryKey: boardKeys.stats(boardId),
        queryFn: () => boardApi.fetchBoardStats(boardId),
        enabled: open && !!boardId,
    });

    const { board, members, priorityLevelStats } = statsQuery.data ?? {};

    const stats = priorityLevelStats
        ? [...priorityLevelStats].sort((a, b) => {
              const priorityOrder = [
                  "none",
                  "low",
                  "medium",
                  "high",
                  "critical",
              ];
              return (
                  priorityOrder.indexOf(a._id) - priorityOrder.indexOf(b._id)
              );
          })
        : [];

    return (
        <Modal
            title={board ? `${board.title} .inf` : "board stats"}
            open={open}
            setOpen={setOpen}
        >
            <Loading
                loading={statsQuery.isLoading}
                position="absolute"
                displayText="loading board stats..."
                fontSize="1rem"
            />

            <div className="w-full relative flex flex-col items-start gap-3">
                <div className="h-12.5 w-full flex justify-between items-center gap-2 text-gray-700 text-[0.65rem] sm:text-[0.75rem] border border-dashed border-gray-700 p-4">
                    <p>
                        code:{" "}
                        <span
                            className="font-medium hover:underline cursor-pointer"
                            onClick={() => {
                                if (board?._id) {
                                    navigator.clipboard.writeText(board._id);
                                    toast.success("code copied to clipboard");
                                }
                            }}
                        >
                            {board?._id}
                        </span>
                    </p>

                    <button
                        className="p-3 bg-gray-200 hover:bg-indigo-200 group"
                        onClick={() => navigate(`/b/${board?._id}`)}
                        title="visit board"
                    >
                        <Icon
                            name="arrow"
                            className="rotate-180 group-hover:text-indigo-800 text-gray-400 w-3 h-3"
                        />
                    </button>
                </div>

                <div className="w-full flex flex-col gap-2 text-gray-700 text-[0.65rem] sm:text-[0.75rem] border border-dashed border-gray-700 p-4">
                    <p>
                        created by{" "}
                        <span className="font-medium">
                            {board?.createdBy?.username}
                        </span>
                    </p>

                    <p>
                        created at{" "}
                        <span className="font-medium">
                            {dateFormatter(board?.createdAt)}
                        </span>
                    </p>

                    <div className="flex gap-2">
                        members:
                        <span className="font-medium">
                            {members && members.length > 0
                                ? members.map((m) => m.username).join(", ")
                                : "<none>"}
                        </span>
                    </div>
                </div>

                <div className="w-full flex flex-col gap-2 text-gray-700 text-[0.65rem] sm:text-[0.75rem] border border-dashed border-gray-700 p-4">
                    <p>
                        lists:{" "}
                        <span className="font-medium">
                            {board?.stats?.listCount || "unknown"} /{" "}
                            {board?.limits?.maxLists || "unknown"}
                        </span>
                    </p>

                    <p>
                        cards:{" "}
                        <span className="font-medium">
                            {board?.stats?.cardCount || "unknown"} /{" "}
                            {board?.limits?.maxCards || "unknown"}
                        </span>
                    </p>

                    <div className="flex flex-col gap-1">
                        {stats.map((item) => {
                            const { _id, count } = item;
                            return (
                                <div
                                    key={_id}
                                    className="w-full p-1 px-3 text-gray-50 font-semibold cursor-pointer hover:opacity-80"
                                    style={{
                                        backgroundColor:
                                            PRIORITY_LEVELS[`${_id}`]?.color ||
                                            "rgba(133, 149, 173, 0.8)",
                                    }}
                                    onClick={() => {
                                        navigate({
                                            pathname: `/b/${board?._id}`,
                                            search: `?priorities=${_id}`,
                                        });
                                    }}
                                >
                                    {_id.toUpperCase()}: {count}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default BoardStatsModal;
