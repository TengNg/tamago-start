import { useLayoutEffect, useMemo, useRef } from "react";
import ChatMessage2 from "./ChatMessage2";
import ChatInput from "./ChatInput";
import Icon from "../shared/Icon";
import { useParams } from "react-router-dom";
import { fetchChat } from "../../api/chatApi";
import { useInfiniteQuery } from "@tanstack/react-query";

const ChatBox2 = ({ open, setOpen }) => {
    const { boardId } = useParams();
    const containerRef = useRef(null);
    const messagesRef = useRef(null);
    const previousScrollHeightRef = useRef(0);

    const chatQuery = useInfiniteQuery({
        queryKey: ["chat", "board", boardId, "messages"],
        queryFn: ({ pageParam = null }) => fetchChat({ boardId, before: pageParam }),
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    });

    const chatMessages = useMemo(() => {
        return chatQuery.data
            ? chatQuery.data.pages.flatMap((page) => page.messages).reverse()
            : [];
    }, [chatQuery.data]);

    useLayoutEffect(() => {
        const container = messagesRef.current;
        if (!container || !chatQuery.data) {
            return;
        }

        if (chatQuery.data.pages.length === 1) {
            container.scrollTop = container.scrollHeight;
            previousScrollHeightRef.current = container.scrollHeight;
            return;
        }

        const newHeight = container.scrollHeight;
        const heightDiff = newHeight - previousScrollHeightRef.current;
        container.scrollTop = heightDiff;
        previousScrollHeightRef.current = newHeight;
    }, [chatQuery.data, open]);

    function handleScroll() {
        const container = messagesRef.current;
        if (!container || chatQuery.isFetchingNextPage || !chatQuery.hasNextPage) {
            return;
        }

        if (container.scrollTop === 0) {
            previousScrollHeightRef.current = container.scrollHeight;
            chatQuery.fetchNextPage();
        }
    }

    if (chatQuery.isLoading) {
        return (
            <div
                ref={containerRef}
                className={`${open ? "flex" : "hidden"} fixed flex-col border-[2px] border-black right-0 bottom-0 sm:right-1 sm:bottom-1 bg-slate-100 w-[325px] h-[400px] overflow-hidden z-30`}
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
                className={`${open ? "flex" : "hidden"} fixed flex-col border-[2px] border-black right-0 bottom-0 sm:right-1 sm:bottom-1 bg-slate-100 w-[325px] h-[400px] overflow-hidden z-30`}
            >
                <div className="flex items-center gap-3 border-b-2 border-black px-3 py-2">
                    <p className="flex-1 font-semibold text-gray-600">chat</p>
                    <button onClick={() => setOpen(false)}>
                        <Icon className="w-4 h-4" name="xmark" />
                    </button>
                </div>

                <div className="flex-1 flex items-center justify-center">
                    <div className="text-gray-400 text-sm">
                        {chatQuery.error.response?.data?.message || "Failed to load chat"}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`${open ? "flex" : "hidden"} fixed flex-col border-[2px] border-black right-0 bottom-0 sm:right-1 sm:bottom-1 bg-slate-100 w-[325px] h-[400px] overflow-hidden z-30`}
        >
            <div className="flex items-center justify-center border-b-2 border-black px-3 py-2">
                <p className="flex-1 font-semibold text-gray-600">chat</p>
                <button onClick={() => setOpen(false)}>
                    <Icon className="w-4 h-4" name="xmark" />
                </button>
            </div>

            <div
                ref={messagesRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto flex flex-col gap-3 p-2"
            >
                {chatQuery.isFetchingNextPage && (
                    <div className="text-center text-xs text-gray-500">
                        loading older messages...
                    </div>
                )}

                {chatMessages.map((item) => (
                    <ChatMessage2
                        key={item._id}
                        chatMessage={item}
                    />
                ))}
            </div>

            <div className="bg-gray-100 px-2 border-t-[2px] border-black">
                <ChatInput />
            </div>
        </div>
    );
};

export default ChatBox2;
