import { useMemo } from "react";
import ActivityItem from "./ActivityItem";
import Loading from "../ui/Loading";

import useBoardState from "../../hooks/useBoardState";
import Icon from "../shared/Icon";
import useToast from "../../hooks/useToast";
import { useKeybind } from "../../hooks/useKeybind";
import { kb } from "../../constants/keybinds";
import {
    useInfiniteQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { boardKeys } from "../../queries/boardKeys";
import { boardApi } from "../../services/api";
import Modal from "../ui/Modal";
import { getErrorMessage } from "../../utils/getErrorMessage";
import useCurrentUser from "../../hooks/useCurrentUser";

const BoardActivitiesModal = () => {
    const queryClient = useQueryClient();
    const currentUser = useCurrentUser();
    const {
        boardState,
        openBoardActivities: open,
        setOpenBoardActivities: setOpen,
    } = useBoardState();

    const toast = useToast();

    const {
        data,
        fetchNextPage,
        isFetchingNextPage,
        hasNextPage,
        isLoading,
        isError,
    } = useInfiniteQuery({
        queryKey: boardKeys.activities(boardState.board._id),
        initialPageParam: 1,
        queryFn: ({ pageParam }) => {
            return boardApi.fetchBoardActivities({
                boardId: boardState.board._id,
                page: pageParam,
            });
        },
        getNextPageParam: (lastPage, _pages) => {
            return lastPage.nextPage;
        },
        enabled: open,
    });

    const cleanMutation = useMutation({
        mutationFn: () => boardApi.cleanBoardActivities(boardState.board._id),
        onSuccess: async (_data, _variables, _context) => {
            queryClient.invalidateQueries({
                queryKey: boardKeys.activities(boardState.board._id),
            });
        },
        onError: (err) => {
            const errMsg = getErrorMessage(err, "Failed to clean activities");
            toast.error(errMsg);
        },
    });

    useKeybind(kb.openBoardActivities, () => {
        setOpen((prev) => !prev);
    });

    const activities = useMemo(() => {
        return data ? data.pages.flatMap((page) => page.activities) : [];
    }, [data]);

    return (
        <Modal
            showCloseButton={false}
            open={open}
            setOpen={setOpen}
            className="p-0!"
            bodyClassName="p-0!"
        >
            <div className="p-3 pb-0">
                <div className="flex w-full justify-between items-center border-b border-black gap-2 pb-1">
                    <div className="flex justify-center gap-3">
                        <div className="font-normal text-[1rem] text-gray-700">
                            board activities
                        </div>

                        <div className="badge text-teal-600 bg-blue-100">
                            {activities.length}
                        </div>

                        {boardState?.board?.createdBy?._id ===
                            currentUser._id && (
                            <div
                                className="badge text-red-500 bg-rose-100 cursor-pointer"
                                onClick={() => {
                                    cleanMutation.mutate();
                                }}
                                title="remove all activities"
                            >
                                clear
                            </div>
                        )}
                    </div>
                    <button
                        className="text-gray-600 flex justify-center items-center"
                        onClick={() => setOpen(false)}
                    >
                        <Icon className="w-4 h-4" name="xmark" />
                    </button>
                </div>
            </div>

            <div className="relative flex flex-col gap-3 p-3 text-gray-600 text-[0.65rem] sm:text-[0.75rem] max-h-150 overflow-auto">
                <Loading
                    loading={isLoading}
                    position={"absolute"}
                    displayText="loading..."
                />

                {isError ? (
                    <div>failed to load activities</div>
                ) : activities.length > 0 ? (
                    activities.map((activity) => {
                        return (
                            <ActivityItem
                                key={activity._id}
                                activity={activity}
                            />
                        );
                    })
                ) : (
                    <div>no activities found in this board.</div>
                )}

                {hasNextPage && (
                    <button
                        className="button--style--dark"
                        onClick={() => {
                            if (!isFetchingNextPage) {
                                fetchNextPage();
                            }
                        }}
                    >
                        {isFetchingNextPage ? "loading..." : "load more"}
                    </button>
                )}
            </div>
        </Modal>
    );
};

export default BoardActivitiesModal;
