import Avatar from "../avatar/Avatar";
import { useNavigate } from "react-router-dom";
import dateFormatter from "../../utils/dateFormatter";
import {
    acceptJoinRequest,
    fetchJoinRequests,
    rejectJoinRequest,
    removeJoinRequest,
} from "../../api/joinRequest";
import {
    useInfiniteQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { useMemo } from "react";
import useToast from "../../hooks/useToast";
import { joinRequestKeys } from "../../queries/joinRequestKeys";
import { getErrorMessage } from "../../utils/getErrorMessage";

/**
 * @typedef {Object} JoinRequestsProps
 * @property {boolean} show
 */

/**
 * @param {JoinRequestsProps} props
 */
export default function JoinRequests({ show }) {
    const navigate = useNavigate();

    const queryClient = useQueryClient();

    const toast = useToast();

    const {
        data,
        refetch,
        fetchNextPage,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        isRefetching,
        isError,
    } = useInfiniteQuery({
        staleTime: Infinity,
        queryKey: ["boardRequests"],
        queryFn: ({ pageParam }) => fetchJoinRequests({ page: pageParam }),
        initialPageParam: 1,
        getNextPageParam: (lastPage, _pages) => {
            return lastPage.nextPage;
        },
    });

    const acceptMutation = useMutation({
        /**
         * @param {{
         *   id: string;
         *   boardId: string;
         *   requesterId: string;
         * }} params
         */
        mutationFn: ({ id, boardId, requesterId }) =>
            acceptJoinRequest({ id, boardId, requesterId }),
        onSuccess: (_data, variables, _context) => {
            const { id: requestId } = variables;
            queryClient.setQueryData(
                joinRequestKeys.all(),
                /**
                 * @param {import("@tanstack/react-query").InfiniteData<GetJoinRequestsResponse> | undefined} old
                 */
                (old) => {
                    if (!old) {
                        return;
                    }

                    return {
                        ...old,
                        pages: [...old.pages].map((page) => {
                            return {
                                ...page,
                                joinRequests: [...page.joinRequests].map(
                                    (item) => {
                                        return item._id === requestId
                                            ? { ...item, status: "accepted" }
                                            : item;
                                    },
                                ),
                            };
                        }),
                    };
                },
            );
        },
        onError: (err, _, _context) => {
            const errMsg = getErrorMessage(
                err,
                "Failed to accept this request",
            );
            toast.error(errMsg);
        },
    });

    const rejectMutation = useMutation({
        /**
         * @param {{
         *   id: string;
         *   boardId: string;
         *   requesterId: string;
         * }} params
         */
        mutationFn: ({ id, boardId, requesterId }) =>
            rejectJoinRequest({ id, boardId, requesterId }),
        onSuccess: (_data, variables, _context) => {
            const { id: requestId } = variables;
            queryClient.setQueryData(
                joinRequestKeys.all(),
                /**
                 * @param {import("@tanstack/react-query").InfiniteData<GetJoinRequestsResponse> | undefined} old
                 */
                (old) => {
                    if (!old) {
                        return old;
                    }

                    return {
                        ...old,
                        pages: [...old.pages].map((page) => {
                            return {
                                ...page,
                                joinRequests: [...page.joinRequests].map(
                                    (item) => {
                                        return item._id === requestId
                                            ? { ...item, status: "rejected" }
                                            : item;
                                    },
                                ),
                            };
                        }),
                    };
                },
            );
        },
        onError: (err, _, _context) => {
            const errMsg = getErrorMessage(
                err,
                "Failed to accept this request",
            );
            toast.error(errMsg);
        },
    });

    const removeMutation = useMutation({
        mutationFn: (/** @type {string} */ id) => removeJoinRequest(id),
        onSuccess: (_data, variables, _context) => {
            const requestId = variables;
            queryClient.setQueryData(
                joinRequestKeys.all(),
                /**
                 * @param {import("@tanstack/react-query").InfiniteData<GetJoinRequestsResponse> | undefined} old
                 */
                (old) => {
                    if (!old) {
                        return old;
                    }

                    return {
                        ...old,
                        pages: [...old.pages].map((page) => {
                            return {
                                ...page,
                                joinRequests: [...page.joinRequests].filter(
                                    (item) => {
                                        return item._id !== requestId;
                                    },
                                ),
                            };
                        }),
                    };
                },
            );
        },
        onError: (err, _, _context) => {
            const errMsg = getErrorMessage(
                err,
                "Failed to accept this request",
            );
            toast.error(errMsg);
        },
    });

    const requests = useMemo(() => {
        return data ? data.pages.flatMap((page) => page.joinRequests) : [];
    }, [data]);

    if (isError) {
        return (
            <div
                className={`mx-auto lg:w-1/2 md:w-3/4 w-[90%] ${show ? "" : "hidden"}`}
            >
                <div className="relative box--style border-2 border-gray-600 shadow-gray-600 mx-auto overflow-auto p-4 md:p-8 bg-gray-100/30 flex flex-col gap-4">
                    <div className="text-gray-500 text-center text-[0.85rem]">
                        failed to load requests, please try again.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div
                className={`mx-auto lg:w-1/2 md:w-3/4 w-[90%] ${show ? "" : "hidden"}`}
            >
                <div className="flex justify-between items-center">
                    <p className="text-[0.75rem] text-gray-700 m-0 p-0">
                        received requests [{requests.length}]
                    </p>
                    <button
                        disabled={isLoading || isRefetching}
                        className="underline text-[0.75rem] text-gray-700 me-1"
                        onClick={() => {
                            refetch();
                        }}
                    >
                        {isLoading || isRefetching
                            ? "refreshing..."
                            : "refresh"}
                    </button>
                </div>

                <div className="relative box--style border-2 border-gray-600 shadow-gray-600 h-87.5 mx-auto overflow-auto p-4 md:p-8 bg-gray-100/30 flex flex-col gap-4">
                    {requests.length === 0 && (
                        <div className="text-gray-500 text-center text-[0.85rem] mt-30">
                            no requests found.
                        </div>
                    )}

                    {requests.map((item) => {
                        const {
                            _id,
                            boardId: board,
                            requester,
                            status,
                            createdAt,
                            updatedAt,
                        } = item;
                        const {
                            _id: requesterId,
                            username: requesterName,
                            createdAt: requesterCreatedAt,
                        } = requester;

                        return (
                            <div
                                key={_id}
                                className={`button--style--rounded rounded-none border-gray-700 shadow-gray-700 flex justify-between flex-wrap sm:flex-nowrap items-center p-4
                                        ${status === "accepted" ? "bg-blue-100" : status === "rejected" ? "bg-red-200" : "bg-gray-100/30"}`}
                            >
                                <div className="flex gap-2 mb-4 sm:mb-0">
                                    <div className="sm:mt-1 sm:block hidden">
                                        <Avatar
                                            username={requesterName}
                                            noShowRole={true}
                                            createdAt={requesterCreatedAt}
                                        />
                                    </div>
                                    <div className="flex flex-col justify-start text-gray-800">
                                        <div className="text-[0.75rem] md:text-[0.9rem] text-gray-700">
                                            <span className="max-w-50 font-medium underline overflow-hidden whitespace-nowrap text-ellipsis">
                                                {requesterName}
                                            </span>
                                            <span> </span>
                                            <span>
                                                requested to join this board
                                            </span>
                                        </div>

                                        <div className="mt-1 flex flex-col gap-1">
                                            <p className="text-[0.65rem]">
                                                board code:{" "}
                                                <span
                                                    onClick={() =>
                                                        navigate(
                                                            `/b/${board._id}`,
                                                        )
                                                    }
                                                    className="cursor-pointer underline"
                                                >
                                                    {board._id || "not found"}
                                                </span>
                                            </p>
                                            <p className="text-[0.65rem]">
                                                sent at:{" "}
                                                {dateFormatter(createdAt)}
                                            </p>

                                            {status === "pending" && (
                                                <p className="text-[0.65rem] text-gray-400">
                                                    waiting for response...
                                                </p>
                                            )}

                                            {status === "accepted" && (
                                                <p className="text-[0.65rem] text-blue-700">
                                                    accepted at:{" "}
                                                    {dateFormatter(updatedAt)}
                                                </p>
                                            )}

                                            {status === "rejected" && (
                                                <p className="text-[0.65rem] text-red-700">
                                                    rejected at:{" "}
                                                    {dateFormatter(updatedAt)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {status === "pending" ? (
                                    <div className="ms-auto flex gap-2">
                                        <button
                                            disabled={
                                                acceptMutation.isPending &&
                                                acceptMutation.variables?.id ===
                                                    _id
                                            }
                                            onClick={() =>
                                                acceptMutation.mutate({
                                                    id: _id,
                                                    boardId: board._id,
                                                    requesterId,
                                                })
                                            }
                                            className="button--style--rounded rounded-none px-3 py-2 text-[0.65rem] sm:text-[0.75rem] text-blue-700 border-blue-700 bg-gray-100"
                                        >
                                            {acceptMutation.isPending &&
                                            acceptMutation.variables?.id === _id
                                                ? "Accepting..."
                                                : "Accept"}
                                        </button>
                                        <button
                                            disabled={
                                                rejectMutation.isPending &&
                                                rejectMutation.variables.id ===
                                                    _id
                                            }
                                            onClick={() =>
                                                rejectMutation.mutate({
                                                    id: _id,
                                                    boardId: board._id,
                                                    requesterId,
                                                })
                                            }
                                            className="button--style--rounded rounded-none px-3 py-2 bg-white text-[0.65rem] sm:text-[0.75rem] text-red-700 border-red-700"
                                        >
                                            {rejectMutation.isPending &&
                                            rejectMutation.variables.id === _id
                                                ? "Rejecting..."
                                                : "Reject"}
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        disabled={
                                            removeMutation.isPending &&
                                            removeMutation.variables === _id
                                        }
                                        onClick={() =>
                                            removeMutation.mutate(_id)
                                        }
                                        className="ms-auto button--style--rounded rounded-none px-3 py-2 border-gray-600 text-[0.65rem] sm:text-[0.75rem] text-gray-600 bg-gray-100"
                                    >
                                        {rejectMutation.isPending &&
                                        rejectMutation.variables?.id === _id
                                            ? "Removing..."
                                            : "Remove"}
                                    </button>
                                )}
                            </div>
                        );
                    })}

                    {hasNextPage && (
                        <button
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                            className="button--style--rounded rounded-none text-gray-700 border-gray-700 text-sm p-1"
                        >
                            {isFetchingNextPage
                                ? "Loading more..."
                                : hasNextPage
                                  ? "Load More"
                                  : "Nothing more to load"}
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
