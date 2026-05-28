import { useEffect, useRef, useMemo } from "react";
import ActivityItem from "./ActivityItem";
import Loading from "../ui/Loading";

import useBoardState from "../../hooks/useBoardState";
import Icon from "../shared/Icon";
import useCurrentUserContext from "../../hooks/useCurrentUserContext";
import useToast from "../../hooks/useToast";
import { useKeybind } from "../../hooks/useKeybind";
import { kb } from "../../constants/keybinds";
import {
    useInfiniteQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { boardKeys } from "../../queries/boardKeys";
import { cleanBoardActivities, fetchBoardActivities } from "../../api/boardApi";

const BoardActivities = () => {
    const queryClient = useQueryClient();
    const { currentUser } = useCurrentUserContext();
    const {
        boardState,
        openBoardActivities: open,
        setOpenBoardActivities: setOpen,
    } = useBoardState();

    const dialog = useRef();

    const toast = useToast();

    const {
        data,
        refetch,
        fetchNextPage,
        isFetchingNextPage,
        hasNextPage,
        isLoading,
        isError,
    } = useInfiniteQuery({
        staleTime: Infinity,
        queryKey: boardKeys.activities(boardState.board._id),
        queryFn: ({ pageParam = 1 }) => {
            return fetchBoardActivities({
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
        mutationFn: () => cleanBoardActivities(boardState.board._id),
        onSuccess: async (_data, _variables, _context) => {
            queryClient.invalidateQueries(
                boardKeys.activities(boardState.board._id),
            );
        },
        onError: (err) => {
            const errMsg =
                err.response?.data?.message || "Failed to clean activities";
            toast.error(errMsg);
        },
    });

    useKeybind(kb.openBoardActivities, () => {
        setOpen((prev) => !prev);
    });

    useEffect(() => {
        if (open) {
            refetch();

            dialog.current.showModal();

            const handleKeyDown = (e) => {
                if (e.ctrlKey && e.key === "/") {
                    e.preventDefault();
                }
            };

            const handleOnClose = () => {
                setOpen(false);
            };

            dialog.current.addEventListener("close", handleOnClose);
            dialog.current.addEventListener("keydown", handleKeyDown);

            return () => {
                dialog.current.removeEventListener("close", handleOnClose);
                dialog.current.removeEventListener("keydown", handleKeyDown);
            };
        } else {
            dialog.current.close();
        }
    }, [open]);

    const activities = useMemo(() => {
        return data ? data.pages.flatMap((page) => page.activities) : [];
    }, [data]);

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
            className="z-40 backdrop:bg-black/15 box--style gap-4 items-start h-fit min-w-87.5 w-125 border-black border-2 bg-gray-50"
            onClick={handleCloseOnOutsideClick}
        >
            <div className="flex w-full justify-between items-center border-black p-3">
                <div className="flex justify-center gap-3">
                    <div className="font-normal text-[1rem] text-gray-700">
                        board activities
                    </div>

                    <div className="badge text-teal-600 bg-blue-100">
                        {activities.length}
                    </div>

                    {boardState?.board?.createdBy?._id === currentUser._id && (
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
                    onClick={handleClose}
                >
                    <Icon className="w-4 h-4" name="xmark" />
                </button>
            </div>

            <div className="border-b border-gray-300"></div>

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
                        className="text-gray-50 flex justify-center items-center bg-gray-400 font-medium hover:bg-gray-400/80 p-2"
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
        </dialog>
    );
};

export default BoardActivities;
