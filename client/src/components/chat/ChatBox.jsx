import { useMemo, useRef, useState } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import Icon from "../shared/Icon";
import { useParams } from "react-router-dom";
import { clearMessages, fetchChat } from "../../api/chatApi";
import {
    useInfiniteQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import useBoardState from "../../hooks/useBoardState";
import useCurrentUserContext from "../../hooks/useCurrentUserContext";
import { chatKeys } from "../../queries/chatKeys";
import useToast from "../../hooks/useToast";

const ChatBox = ({ open, setOpen }) => {
    const queryClient = useQueryClient();
    const { currentUser } = useCurrentUserContext();
    const {
        boardState,
        socket,
        isAtBottomOfChatBox: isAtBottom,
        setIsAtBottomOfChatBox: setIsAtBottom,
    } = useBoardState();
    const { boardId } = useParams();
    const toast = useToast();
    const containerRef = useRef(null);
    const messagesRef = useRef(null);
    const previousScrollHeightRef = useRef(0);
    const [expanded, setExpanded] = useState(false);

    const isOwner = useMemo(() => {
        return boardState.members.indexOf((m) => {
            return m.role === "owner" && m.userId === currentUser._id;
        });
    }, [boardState.members]);

    const chatQuery = useInfiniteQuery({
        queryKey: chatKeys.messages(boardId),
        queryFn: ({ pageParam = null }) =>
            fetchChat({ boardId, before: pageParam }),
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    });

    const clearMessagesMutation = useMutation({
        mutationFn: () => clearMessages({ boardId }),
        onSuccess: (_data, _variables, _context) => {
            queryClient.invalidateQueries({
                queryKey: chatKeys.messages(boardId),
            });
            socket.emit("clearMessages");
            toast.success("Chat cleared");
        },
        onError: (err) => {
            const errMsg =
                err?.response?.data?.message || "Failed to clear chat messages";
            toast.error(errMsg);
        },
    });

    const chatMessages = useMemo(() => {
        return chatQuery.data
            ? chatQuery.data.pages.flatMap((page) => page.messages)
            : [];
    }, [chatQuery.data]);

    function handleScroll() {
        const container = messagesRef.current;
        if (
            !container ||
            chatQuery.isFetchingNextPage ||
            !chatQuery.hasNextPage
        ) {
            return;
        }

        const atBottom = container.scrollTop > -100;
        setIsAtBottom(atBottom);

        if (
            container.scrollHeight + container.scrollTop ===
            container.clientHeight
        ) {
            previousScrollHeightRef.current = container.scrollHeight;
            chatQuery.fetchNextPage();
        }
    }

    function handleClearMessages() {
        if (
            !confirm(
                "Are you sure you want to clear all messages from this chat?",
            )
        ) {
            return;
        }

        clearMessagesMutation.mutate();
    }

    function scrollToBottom() {
        const container = messagesRef.current;
        if (!container) {
            return;
        }

        container.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }

    function toggleExpand() {
        setExpanded((prev) => !prev);
    }

    const style = {
        width: expanded ? "800px" : "350px",
        height: expanded ? "800px" : "450px",
        maxWidth: "calc(100% - 0.5rem)",
        maxHeight: "calc(100% - 0.5rem)",
    };

    if (chatQuery.isLoading) {
        return (
            <div
                ref={containerRef}
                className={`${open ? "flex" : "hidden"} fixed flex-col border-[2px] border-black right-1 bottom-1 bg-gray-100 overflow-hidden z-30`}
                style={style}
            >
                <div className="flex items-center gap-3 border-b-2 border-black px-3 py-2">
                    <p className="flex-1 font-semibold text-gray-600">chat</p>
                    <button onClick={() => setOpen(false)}>
                        <Icon className="w-4 h-4" name="xmark" />
                    </button>
                </div>

                <div className="flex-1 flex items-center justify-center">
                    <div className="text-gray-400 text-sm">loading...</div>
                </div>
            </div>
        );
    }

    if (chatQuery.isError) {
        return (
            <div
                className={`${open ? "flex" : "hidden"} fixed flex-col border-[2px] border-black right-1 bottom-1 bg-gray-100 overflow-hidden z-30`}
                style={style}
            >
                <div className="flex items-center gap-3 border-b-2 border-black px-3 py-2">
                    <p className="flex-1 font-semibold text-gray-600">chat</p>
                    <button onClick={() => setOpen(false)}>
                        <Icon className="w-4 h-4" name="xmark" />
                    </button>
                </div>

                <div className="flex-1 flex items-center justify-center">
                    <div className="text-gray-400 text-sm">
                        {chatQuery.error.response?.data?.message ||
                            "Failed to load chat"}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`${open ? "flex" : "hidden"} fixed flex-col border-2 border-gray-600 right-1 bottom-1 bg-[rgb(var(--card-item-bg))] overflow-hidden z-30`}
            style={style}
        >
            <div className="flex items-center justify-center border-b-2 border-gray-600 px-3 py-2">
                <div className="flex-1 flex items-center gap-3">
                    <p className="font-semibold text-gray-600">chat</p>
                    {isOwner && chatMessages.length > 0 && (
                        <button
                            onClick={handleClearMessages}
                            className="me-auto text-[0.65rem] badge text-red-600 bg-red-100 cursor-pointer"
                        >
                            clear
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={toggleExpand} className="text-gray-600">
                        <Icon
                            className="w-4 h-4"
                            name={expanded ? "compress" : "expand"}
                        />
                    </button>

                    <button
                        onClick={() => setOpen(false)}
                        className="text-gray-600"
                    >
                        <Icon className="w-4 h-4" name="xmark" />
                    </button>
                </div>
            </div>

            <div
                ref={messagesRef}
                onScroll={handleScroll}
                className="relative flex-1 overflow-y-auto flex flex-col-reverse gap-0"
            >
                {!isAtBottom && (
                    <div className="sticky bottom-3 flex justify-center pr-3 z-10">
                        <button
                            onClick={scrollToBottom}
                            className="p-3 -rotate-90 text-xs rounded-full shadow-md bg-gray-400 text-white"
                        >
                            <Icon name="arrow" className="w-2.5 h-2.5" />
                        </button>
                    </div>
                )}

                {chatMessages.map((item) => (
                    <ChatMessage key={item._id} chatMessage={item} />
                ))}

                {chatQuery.isFetchingNextPage && (
                    <div className="text-center text-xs text-gray-50 bg-gray-400 p-0.5">
                        loading more messages...
                    </div>
                )}
            </div>

            <ChatInput />
        </div>
    );
};

export default ChatBox;
