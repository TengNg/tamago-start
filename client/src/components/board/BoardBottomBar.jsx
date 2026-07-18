import useBoardState from "../../hooks/useBoardState";
import useAuth from "../../hooks/useAuth";
import useCurrentUser from "../../hooks/useCurrentUser";
import useToast from "../../hooks/useToast";
import { pinBoard } from "../../api/meApi";
import { getErrorMessage } from "../../utils/getErrorMessage";

const BoardBottomBar = () => {
    const {
        boardState,
        openMembers,
        setOpenMembers,
        openVisibilityConfig,
        setOpenVisibilityConfig,
        setOpenKeyBindings,
    } = useBoardState();

    const { currentUserQuery } = useAuth();
    const currentUser = useCurrentUser();
    const toast = useToast();
    const boardId = boardState.board._id;

    const handlePinBoard = async (/** @type {React.MouseEvent} */ e) => {
        if (e.button !== 0) return;

        try {
            await pinBoard(boardState.board._id);
            await currentUserQuery.refetch();
        } catch (err) {
            const errMsg = getErrorMessage(err, "Failed to pin board");
            toast.error(errMsg);
        }
    };

    return (
        <div
            id="bottom-buttons"
            className="flex items-center h-12.5 px-4 gap-2"
        >
            <button
                className={`
                    w-25 ${openMembers ? "mt-1 text-gray-100 shadow-[0_1px_0_0]" : "shadow-gray-600 shadow-[0_3px_0_0]"}
                    bg-[rgb(var(--card-item-bg))] border-2 border-gray-600 text-gray-600 px-3 py-2 text-[0.65rem] sm:text-[0.65rem] font-medium
                `}
                onClick={() => {
                    setOpenMembers((prev) => !prev);
                }}
            >
                members
            </button>

            <button
                onClick={handlePinBoard}
                className={`
                    w-25 ${Object.hasOwn(currentUser.pinnedBoardIdCollection, boardId) ? "mt-1 text-gray-100 shadow-[0_1px_0_0]" : "shadow-gray-600 shadow-[0_3px_0_0]"}
                    bg-[rgb(var(--card-item-bg))] border-2 border-gray-600 text-gray-600 px-3 py-2 text-[0.65rem] sm:text-[0.65rem] font-medium
                `}
            >
                {Object.hasOwn(currentUser.pinnedBoardIdCollection, boardId) ? (
                    <div className="flex justify-center items-center gap-2">
                        <span>*pinned</span>
                    </div>
                ) : (
                    <div className="flex justify-center items-center gap-1">
                        <span>pin</span>
                    </div>
                )}
            </button>

            <button
                onClick={() => setOpenVisibilityConfig((prev) => !prev)}
                className={`
                    w-fit ${openVisibilityConfig ? "mt-1 text-gray-100 shadow-[0_1px_0_0]" : "shadow-gray-600 shadow-[0_3px_0_0]"}
                    bg-[rgb(var(--card-item-bg))] border-2 border-gray-600 text-gray-600 px-3 py-2 text-[0.65rem] sm:text-[0.65rem] font-medium
                `}
            >
                <span>{boardState.board?.visibility}</span>
            </button>

            <div className="flex gap-3 ms-3 text-[0.75rem] items-center justify-center text-gray-700">
                <p className="md:block hidden select-none m-0 p-0">
                    lists: {boardState?.lists?.length || 0} / 20
                </p>

                <button
                    className="sm:grid place-items-center hidden w-6 h-6 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-full"
                    onClick={() => {
                        setOpenKeyBindings((prev) => !prev);
                    }}
                    title="open help"
                >
                    ?
                </button>
            </div>
        </div>
    );
};

export default BoardBottomBar;
