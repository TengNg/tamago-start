import {
    useInfiniteQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import useBoardState from "../../../hooks/useBoardState";
import dateFormatter from "../../../utils/dateFormatter";
import { useState, useRef, useMemo, useEffect } from "react";
import Icon from "../../shared/Icon";
import { useSearchParams } from "react-router-dom";
import useCurrentUserContext from "../../../hooks/useCurrentUserContext";
import { axiosPrivate } from "../../../api/axios";
import useToast from "../../../hooks/useToast";
import { SOCKET_EVENTS } from "@shared/socket-events.js";

const Comments = ({ card }) => {
    const queryClient = useQueryClient();
    const { socket } = useBoardState();
    const { currentUser } = useCurrentUserContext();

    const commentTextareaRef = useRef();
    const focusedCommentRef = useRef();

    const [content, setContent] = useState("");
    const [focusedComment, setFocusedComment] = useState(null);
    const [searchParams, _setSearchParams] = useSearchParams();

    const toast = useToast();

    useEffect(() => {
        const fetchFocusedComment = async (id) => {
            try {
                const response = await axiosPrivate.get(
                    `/cards/${card._id}/comments/${id}`,
                );
                setFocusedComment({
                    ...response.data.comment,
                    collapsed: false,
                });
            } catch (err) {
                const errMsg =
                    err?.response?.data?.message ||
                    "Failed to load focused comment";
                toast.error(errMsg);
            }
        };

        if (searchParams.get("focusedComment")) {
            fetchFocusedComment(searchParams.get("focusedComment"));
        }
    }, [searchParams]);

    useEffect(() => {
        if (focusedComment && focusedCommentRef && focusedCommentRef.current) {
            focusedCommentRef.current.scrollIntoView({
                block: "center",
            });
        }
    }, [focusedComment, focusedCommentRef]);

    const fetchComments = async ({ page = 1 }) => {
        const response = await axiosPrivate.get(
            `/cards/${card._id}/comments?page=${page}`,
        );
        return response?.data || [];
    };

    const addComment = async (content) => {
        const response = await axiosPrivate.post(
            `/cards/${card._id}/comments`,
            JSON.stringify({ content }),
        );
        return response?.data?.comment;
    };

    const deleteComment = async (commentId) => {
        const response = await axiosPrivate.delete(
            `/cards/${card._id}/comments/${commentId}`,
        );
        return response?.data?.comment;
    };

    const copyCommentLink = (id) => {
        const url = `${window.location.origin}/b/${card.boardId}?card=${card._id}&focusedComment=${id}`;
        navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
    };

    const copyCommentContent = (content) => {
        navigator.clipboard.writeText(content).then(() => {
            toast.success("Content copied to clipboard");
        });
    };

    const commentsQuery = useInfiniteQuery({
        queryKey: ["card-comments", card?._id],
        queryFn: ({ pageParam = 1 }) => fetchComments({ page: pageParam }),
        getNextPageParam: (lastPage, _pages) => {
            return lastPage.nextPage;
        },
    });

    const addCommentQuery = useMutation({
        mutationFn: (content) => addComment(content),
        onSuccess: (data, _variables, _context) => {
            queryClient.invalidateQueries({
                queryKey: ["card-comments", card._id],
            });
            socket.emit(SOCKET_EVENTS.COMMENT_CREATE, { comment: data });
        },
        onError: (err) => {
            const errMsg =
                err.response?.data?.message || "Failed to add new comment";
            toast.error(errMsg);
        },
    });

    const deleteCommentQuery = useMutation({
        mutationFn: (id) => deleteComment(id),
        onSuccess: (_data, commentId, _context) => {
            queryClient.invalidateQueries({
                queryKey: ["card-comments", card._id],
            });
            socket.emit(SOCKET_EVENTS.COMMENT_DELETE, {
                commentId,
                cardId: card._id,
            });
        },
        onError: (err) => {
            const errMsg =
                err.response?.data?.message ||
                err.message ||
                "Failed to delete comment";
            toast.error(errMsg);
        },
    });

    function handleLoadMoreComments() {
        commentsQuery.fetchNextPage();
    }

    function handleAddNewComment() {
        if (!commentTextareaRef.current?.value) {
            return;
        }

        if (addCommentQuery.isPending) {
            return;
        }

        const content = commentTextareaRef.current.value;
        addCommentQuery.mutate(content);
        commentTextareaRef.current.value = "";
    }

    function handleDeleteComment(id) {
        if (!confirm("Are you sure you want to delete this comment?")) {
            return;
        }

        deleteCommentQuery.mutate(id);
    }

    function handleTextAreaOnKeydown(e) {
        if (e.shiftKey && e.key === "Enter") {
            e.preventDefault();
            return;
        }

        if (e.key === "Enter") {
            e.preventDefault();
            handleAddNewComment();
        }
    }

    function handleSetTextAreaContent(e) {
        if (content.length >= 1000) {
            e.preventDefault();
            return;
        }

        setContent(e.target.value);
    }

    const comments = useMemo(() => {
        return (
            commentsQuery.data?.pages?.flatMap((page) => {
                return page.comments;
            }) || []
        );
    }, [commentsQuery.data]);

    if (commentsQuery.isLoading) {
        return (
            <div className="relative flex flex-col gap-4 text-[0.65rem] sm:text-[0.8rem] text-gray-700 p-4 border border-gray-700">
                <div>loading comments...</div>
            </div>
        );
    }

    if (commentsQuery.isError) {
        return (
            <div className="relative flex flex-col gap-4 text-[0.65rem] sm:text-[0.8rem] text-gray-700 p-4 border border-gray-700">
                <div>failed to load comments :( please try again.</div>
            </div>
        );
    }

    return (
        <div className="relative flex flex-col gap-4 text-sm text-gray-700 px-4 pt-4 pb-6 mb-4 border border-gray-700">
            <div className="w-full flex justify-start items-start gap-1">
                <textarea
                    maxLength={1000}
                    ref={commentTextareaRef}
                    readOnly={addCommentQuery.isPending}
                    onKeyDown={handleTextAreaOnKeydown}
                    onChange={handleSetTextAreaContent}
                    className="overflow-y-auto border shadow-[0_2px_0_0] border-gray-400 shadow-gray-400 focus:border-gray-600 focus:shadow-gray-600 wrap-break-word py-2 px-3 w-full text-gray-700 focus:bg-gray-100 bg-transparent font-medium placeholder-gray-400 focus:outline-hidden"
                    placeholder="add a comment..."
                />
                <div className="flex flex-col gap-2 min-w-[60px] w-[60px]">
                    <button
                        disabled={addCommentQuery.isPending}
                        onClick={handleAddNewComment}
                        className="bg-gray-500 hover:bg-gray-400 py-2 text-[12px] text-gray-50 w-[60px] select-none font-medium"
                    >
                        {addCommentQuery.isPending ? "..." : "send"}
                    </button>
                    <p className="text-gray-400 text-center text-[10px]">
                        {content.length}/1000
                    </p>
                </div>
            </div>

            {addCommentQuery.isPending && (
                <div className="px-1 pt-2 opacity-50">
                    <div className="flex gap-1">
                        <div className="flex items-center gap-1">
                            <div className="font-medium mx-auto">
                                <Icon className="w-3.5 h-3.5" name="profile" />
                            </div>
                            <div className="font-medium">
                                {currentUser.username}:
                            </div>
                        </div>
                        <div>...</div>
                    </div>
                </div>
            )}

            {comments.length === 0 && !addCommentQuery.isPending ? (
                <div className="text-sm text-gray-400 px-1">No comments</div>
            ) : (
                <div className="flex flex-col gap-1">
                    {focusedComment && !focusedComment.onFirstPage && (
                        <div ref={focusedCommentRef}>
                            <div className="bg-indigo-200/50 border border-b-4 border-indigo-500 px-2 py-1 pb-2">
                                <div className="flex flex-col">
                                    <div className="h-6 flex items-center justify-between">
                                        <div className="text-[12px] text-gray-500">
                                            {dateFormatter(
                                                focusedComment.createdAt,
                                            )}{" "}
                                        </div>
                                        <div>
                                            <button
                                                onClick={() =>
                                                    copyCommentContent(
                                                        focusedComment.content,
                                                    )
                                                }
                                                className="text-gray-400 hover:bg-violet-800 p-1 hover:text-violet-50 rounded-xs"
                                                title="Copy content"
                                            >
                                                <Icon
                                                    className="w-4 h-4"
                                                    name="copy"
                                                />
                                            </button>
                                            {focusedComment.content.length >
                                                50 && (
                                                <button
                                                    className="text-gray-400 hover:bg-violet-800 p-1 hover:text-violet-50 rounded-xs"
                                                    title="Collapse this comment"
                                                    onClick={() => {
                                                        setFocusedComment(
                                                            (prev) => {
                                                                return {
                                                                    ...prev,
                                                                    collapsed:
                                                                        !prev.collapsed,
                                                                };
                                                            },
                                                        );
                                                    }}
                                                >
                                                    <Icon
                                                        className="w-4 h-4"
                                                        name="caret"
                                                    />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-700 flex flex-row justify-start items-start gap-1">
                                        <div className="flex items-center gap-1">
                                            {focusedComment.userId._id ===
                                                currentUser._id && (
                                                <div className="font-medium mx-auto">
                                                    <Icon
                                                        className="w-3.5 h-3.5"
                                                        name="profile"
                                                    />
                                                </div>
                                            )}
                                            <div className="font-medium">
                                                {focusedComment.userId.username}
                                                :
                                            </div>
                                        </div>

                                        {focusedComment.collapsed &&
                                        focusedComment.content.length > 50 ? (
                                            <p>
                                                {focusedComment.content.substring(
                                                    0,
                                                    50,
                                                ) + "..."}
                                            </p>
                                        ) : (
                                            <pre className="overflow-x-auto wrap-break-word whitespace-pre-wrap pt-px">
                                                {focusedComment.content}
                                            </pre>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="h-px my-4 bg-gray-800"></div>
                        </div>
                    )}

                    {comments.map((comment) => {
                        return (
                            <div
                                ref={
                                    comment._id === focusedComment?._id
                                        ? focusedCommentRef
                                        : null
                                }
                                key={comment._id}
                                className={`${focusedComment?._id === comment._id ? "bg-indigo-200/50 border-l-[3px] border-indigo-500" : "hover:bg-gray-400/20"} group px-1 py-1 pb-2`}
                            >
                                <div className="flex flex-col">
                                    <div className="h-6 flex items-center justify-between">
                                        <div className="text-[12px] text-gray-500">
                                            {dateFormatter(comment.createdAt)}
                                        </div>

                                        <div>
                                            <button
                                                onClick={() => {
                                                    copyCommentLink(
                                                        comment._id,
                                                    );
                                                }}
                                                className="group-hover:opacity-100 opacity-0 font-medium border-red-800 text-gray-400 hover:bg-blue-800 p-1 hover:text-blue-50"
                                                title="Copy link to comment"
                                            >
                                                <Icon
                                                    className="w-4 h-4"
                                                    name="link"
                                                />
                                            </button>

                                            <button
                                                onClick={() =>
                                                    copyCommentContent(
                                                        comment.content,
                                                    )
                                                }
                                                className="group-hover:opacity-100 opacity-0 font-medium border-red-800 text-gray-400 hover:bg-violet-800 p-1 hover:text-violet-50"
                                                title="Copy content"
                                            >
                                                <Icon
                                                    className="w-4 h-4"
                                                    name="copy"
                                                />
                                            </button>

                                            {comment.userId._id ===
                                                currentUser._id && (
                                                <button
                                                    onClick={() =>
                                                        handleDeleteComment(
                                                            comment._id,
                                                        )
                                                    }
                                                    className="group-hover:opacity-100 opacity-0 font-medium border-red-800 text-gray-400 hover:bg-red-800 p-1 hover:text-gray-50"
                                                    title="Delete this comment"
                                                >
                                                    <Icon
                                                        className="w-4 h-4"
                                                        name="xmark"
                                                    />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-700 flex sm:flex-row flex-col justify-start items-start gap-1">
                                        <div className="flex items-center gap-1">
                                            {comment.userId._id ===
                                                currentUser._id && (
                                                <div className="font-medium mx-auto">
                                                    <Icon
                                                        className="w-3.5 h-3.5"
                                                        name="profile"
                                                    />
                                                </div>
                                            )}
                                            <div className="font-medium">
                                                {comment.userId.username}:
                                            </div>
                                        </div>
                                        <pre
                                            className={`${comment.deleted ? "text-red-800" : ""} overflow-x-auto wrap-break-word whitespace-pre-wrap pt-px`}
                                        >
                                            {comment.deleted
                                                ? "[deleted]"
                                                : comment.content}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {commentsQuery.hasNextPage && (
                        <button
                            disabled={commentsQuery.isFetchingNextPage}
                            onClick={handleLoadMoreComments}
                            className={`${commentsQuery.isFetchingNextPage ? "bg-gray-400" : "bg-gray-500"} mt-2 h-8 w-40 min-w-40 hover:bg-gray-400 p-2 text-gray-50 grid place-items-center`}
                        >
                            {commentsQuery.isFetchingNextPage ? (
                                <Icon name="three-dots" className="w-4 h-4" />
                            ) : (
                                <Icon name="angles-down" className="w-4 h-4" />
                            )}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default Comments;
