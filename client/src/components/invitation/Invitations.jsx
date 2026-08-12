import Avatar from "../avatar/Avatar";
import { useNavigate } from "react-router-dom";
import dateFormatter from "../../utils/dateFormatter";
import { invitationApi } from "../../services/api";
import {
    useInfiniteQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { useMemo } from "react";
import useToast from "../../hooks/useToast";
import { getErrorMessage } from "../../utils/getErrorMessage";
import { invitationKeys } from "../../queries/invitationKeys";

/**
 * @typedef {Object} InvitationsProps
 * @property {boolean} show
 */

/**
 * @param {InvitationsProps} props
 */
export default function Invitations({ show }) {
    const navigate = useNavigate();

    const queryClient = useQueryClient();

    const toast = useToast();

    const {
        data,
        fetchNextPage,
        isFetchingNextPage,
        hasNextPage,
        isError,
    } = useInfiniteQuery({
        queryKey: invitationKeys.all(),
        initialPageParam: 1,
        queryFn: ({ pageParam }) =>
            invitationApi.fetchInvitations({ page: pageParam }),
        getNextPageParam: (lastPage, _pages) => {
            return lastPage.nextPage;
        },
    });

    const acceptMutation = useMutation({
        mutationFn: (/** @type {string} */ invitationId) =>
            invitationApi.acceptInvitation(invitationId),
        onSuccess: (_data, invitationId, _context) => {
            queryClient.setQueryData(
                invitationKeys.all(),
                /**
                 * @param {import("@tanstack/react-query").InfiniteData<GetInvitationsResponse> | undefined} old
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
                                invitations: [...page.invitations].map(
                                    (item) => {
                                        return item._id === invitationId
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
                "Failed to accept this invitation",
            );
            toast.error(errMsg);
        },
    });

    const rejectMutation = useMutation({
        mutationFn: (/** @type {string} */ invitationId) =>
            invitationApi.rejectInvitation(invitationId),
        onSuccess: (_data, invitationId, _context) => {
            queryClient.setQueryData(
                invitationKeys.all(),
                /**
                 * @param {import("@tanstack/react-query").InfiniteData<GetInvitationsResponse> | undefined} old
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
                                invitations: [...page.invitations].map(
                                    (item) => {
                                        return item._id === invitationId
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
                "Failed to accept this invitation",
            );
            toast.error(errMsg);
        },
    });

    const removeMutation = useMutation({
        mutationFn: (/** @type {string} */ invitationId) =>
            invitationApi.removeInvitation(invitationId),
        onSuccess: (_data, invitationId, _context) => {
            queryClient.setQueryData(
                invitationKeys.all(),
                /**
                 * @param {import("@tanstack/react-query").InfiniteData<GetInvitationsResponse> | undefined} old
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
                                invitations: [...page.invitations].filter(
                                    (item) => {
                                        return item._id !== invitationId;
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
                "Failed to remove this invitation",
            );
            toast.error(errMsg);
        },
    });

    const invitations = useMemo(() => {
        return data ? data.pages.flatMap((page) => page.invitations) : [];
    }, [data]);

    if (isError) {
        return (
            <div
                className={`mx-auto lg:w-1/2 md:w-3/4 w-[90%] ${show ? "" : "hidden"}`}
            >
                <div className="relative box--style border-2 border-gray-600 shadow-gray-600 mx-auto overflow-auto p-4 md:p-8 bg-gray-100/30 flex flex-col gap-4">
                    <div className="text-gray-500 text-center text-[0.85rem]">
                        failed to load invitations, please try again.
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
                <div className="flex gap-1 sm:gap-0 justify-between items-center">
                    <p className="text-[0.75rem] text-gray-700 m-0 p-0">
                        received invitations: {invitations.length}
                    </p>
                </div>

                <div className="relative box--style border-2 border-gray-600 shadow-gray-600 h-87.5 mx-auto overflow-auto p-4 md:p-8 bg-gray-100/30 flex flex-col gap-4">
                    {invitations.length === 0 && (
                        <div className="text-gray-500 text-center text-[0.85rem] mt-30">
                            no invitations found.
                        </div>
                    )}

                    {invitations.map((item) => {
                        const {
                            _id,
                            invitedByUserId: sender,
                            createdAt,
                            status,
                            boardId,
                        } = item;
                        return (
                            <div
                                key={_id}
                                className={`button--style--rounded rounded-none border-gray-700 shadow-gray-700 flex justify-between flex-wrap sm:flex-nowrap items-center p-4
                                           ${status === "accepted" ? "bg-blue-100 cursor-pointer" : status === "rejected" ? "bg-red-200" : "bg-gray-100/30"}`}
                                onClick={() =>
                                    status === "accepted" &&
                                    navigate(`/b/${boardId}`)
                                }
                            >
                                <div className="flex gap-2 mb-4 sm:mb-0">
                                    <div className="sm:mt-1 sm:block hidden">
                                        <Avatar
                                            profileImage={sender.profileImage}
                                            username={sender.username}
                                            noShowRole={true}
                                            createdAt={sender.createdAt}
                                        />
                                    </div>
                                    <div className="flex flex-col justify-start text-gray-700">
                                        <div className="text-[0.75rem] md:text-[0.9rem] text-gray-700">
                                            <span className="max-w-50 font-medium underline overflow-hidden whitespace-nowrap text-ellipsis">
                                                {sender.username}
                                            </span>
                                            <span> </span>
                                            <span>sent a board invitation</span>
                                        </div>

                                        <div className="mt-1 flex flex-col gap-1">
                                            <p className="text-[0.65rem]">
                                                board code:{" "}
                                                {boardId || "not found"}
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
                                        </div>
                                    </div>
                                </div>

                                {status === "pending" ? (
                                    <div className="ms-auto flex gap-2">
                                        <button
                                            disabled={
                                                acceptMutation.isPending &&
                                                acceptMutation.variables === _id
                                            }
                                            onClick={() =>
                                                acceptMutation.mutate(_id)
                                            }
                                            className="button--style--rounded rounded-none w-18 py-2 bg-gray-100 text-[0.65rem] sm:text-[0.75rem] text-blue-700 border-blue-700"
                                        >
                                            {acceptMutation.isPending &&
                                            acceptMutation.variables === _id ? (
                                                <span className="loader-circle w-3 h-3 inline-block align-middle"></span>
                                            ) : (
                                                "Accept"
                                            )}
                                        </button>
                                        <button
                                            disabled={
                                                rejectMutation.isPending &&
                                                rejectMutation.variables === _id
                                            }
                                            onClick={() =>
                                                rejectMutation.mutate(_id)
                                            }
                                            className="button--style--rounded rounded-none w-18 py-2 bg-gray-100 text-[0.65rem] sm:text-[0.75rem] text-red-700 border-red-700"
                                        >
                                            {rejectMutation.isPending &&
                                            rejectMutation.variables === _id ? (
                                                <span className="loader-circle w-3 h-3 inline-block align-middle"></span>
                                            ) : (
                                                "Reject"
                                            )}
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        disabled={
                                            removeMutation.isPending &&
                                            removeMutation.variables === _id
                                        }
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeMutation.mutate(_id);
                                        }}
                                        className="ms-auto button--style--rounded rounded-none w-18 py-2 border-gray-600 text-[0.65rem] sm:text-[0.75rem] text-gray-600 bg-gray-100"
                                    >
                                        {removeMutation.isPending &&
                                        removeMutation.variables === _id ? (
                                            <span className="loader-circle w-3 h-3 inline-block align-middle"></span>
                                        ) : (
                                            "Remove"
                                        )}
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
