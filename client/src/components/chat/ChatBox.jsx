import { useMemo, useRef, useState } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import Icon from "../shared/Icon";
import { chatApi } from "../../services/api";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import useBoardState from "../../hooks/useBoardState";
import useCurrentUser from "../../hooks/useCurrentUser";
import { chatKeys } from "../../queries/chatKeys";
import useToast from "../../hooks/useToast";
import { useKeybind } from "../../hooks/useKeybind";
import { kb } from "../../constants/keybinds";
import { getErrorMessage } from "../../utils/getErrorMessage";

/** @returns {JSX.Element} */
const ChatBox = () => {
    const currentUser = useCurrentUser();
    const {
        boardState,
        openChatBox: open,
        setOpenChatBox: setOpen,
        isAtBottomOfChatBox: isAtBottom,
        setIsAtBottomOfChatBox: setIsAtBottom,
    } = useBoardState();
    const toast = useToast();

    /** @type {React.MutableRefObject<HTMLDivElement | null>} */
    const containerRef = useRef(null);

    /** @type {React.MutableRefObject<HTMLDivElement | null>} */
    const messagesRef = useRef(null);

    /** @type {React.MutableRefObject<number>} */
    const previousScrollHeightRef = useRef(0);

    const [expanded, setExpanded] = useState(false);

    const isOwner =
        boardState.members.findIndex(
            /** @param {BoardMember} m */
            (m) => m.role === "owner" && m.userId === currentUser._id,
        ) !== -1;

    useKeybind(kb.openChatBox, () => {
        setOpen((prev) => !prev);
    });

    const chatQuery = useInfiniteQuery({
        queryKey: chatKeys.messages(boardState.board._id),
        queryFn: /** @param {{ pageParam: string | null }} param */ ({
            pageParam,
        }) =>
            chatApi.fetchChat({
                boardId: boardState.board._id,
                before: pageParam ?? undefined,
            }),
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    });

    const clearMessagesMutation = useMutation({
        mutationFn: () => chatApi.clearMessages(boardState.board._id),
        onSuccess: (_data, _variables, _context) => {
            toast.success("Chat cleared");
        },
        onError: (err) => {
            const errMsg = getErrorMessage(
                err,
                "Failed to clear chat messages",
            );
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

    /** @type {React.CSSProperties} */
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
                className={`${open ? "flex" : "hidden"} fixed flex-col border-2 border-black right-1 bottom-1 bg-gray-100 overflow-hidden z-30`}
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
                className={`${open ? "flex" : "hidden"} fixed flex-col border-2 border-black right-1 bottom-1 bg-gray-100 overflow-hidden z-30`}
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
                        {getErrorMessage(
                            chatQuery.error,
                            "Failed to load chat",
                        )}
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
                <div className="sticky bottom-3 h-0 overflow-visible flex justify-center z-10">
                    <button
                        onClick={scrollToBottom}
                        className={`-translate-y-full ${isAtBottom ? "opacity-0 pointer-events-none" : ""} h-fit w-fit p-3 -rotate-90 text-xs rounded-full shadow-sm bg-gray-400 text-white transition-all`}
                    >
                        <Icon name="arrow" className="w-3 h-3" />
                    </button>
                </div>

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
