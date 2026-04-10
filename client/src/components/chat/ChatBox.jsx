import { useEffect, useRef } from "react";
import useBoardState from "../../hooks/useBoardState";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import Loading from "../ui/Loading";
import Icon from "../shared/Icon";
import useCurrentUserContext from "../../hooks/useCurrentUserContext";

const ChatBox = ({
    error,

    open,
    setOpen,
    setOpenFloat,
    sendMessage,
    deleteMessage,
    clearMessages,

    fetchMessages,
    isFetchingMore,
    allMessagesFetched,

    hasReceivedNewMessage,
    setHasReceivedNewMessage,
}) => {
    const { currentUser } = useCurrentUserContext();

    const { boardState, isAtBottomOfChat, setIsAtBottomOfChat } =
        useBoardState();

    const messageEndRef = useRef();
    const chatContainer = useRef();

    useEffect(() => {
        if (open && messageEndRef.current) {
            messageEndRef.current.scrollIntoView({ block: "end" });
            if (chatContainer.current) {
                const chatInput =
                    chatContainer.current.querySelector("#chat-input");
                chatInput.focus();
            }
        }
    }, [open]);

    useEffect(() => {
        if (
            hasReceivedNewMessage &&
            isAtBottomOfChat &&
            messageEndRef.current
        ) {
            messageEndRef.current.scrollIntoView({ block: "end" });
        }
    }, [hasReceivedNewMessage, chats.length]);

    const handleOpenFloat = () => {
        setOpen(false);
        setOpenFloat(true);
    };

    const handleClearMessages = () => {
        clearMessages();
    };

    const handleLoadMoreOnScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

        const offset = 15;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - offset;

        setIsAtBottomOfChat(isAtBottom);

        if (scrollTop === 0 && !allMessagesFetched) {
            fetchMessages();
        }
    };

    if (error.message) {
        return (
            <div
                id="chat-box"
                ref={chatContainer}
                className={`${open ? "flex" : "hidden"} fixed flex-col border-[2px] border-black right-0 bottom-0 sm:right-1 sm:bottom-1 bg-slate-100 w-[325px] h-[400px] overflow-auto z-30`}
            >
                <div className="relative flex items-center gap-3 border-b-2 border-black px-3 py-2">
                    <p className="flex-1 font-semibold text-gray-600">Chat</p>

                    <button onClick={handleOpenFloat} className="text-gray-600">
                        <Icon className="w-4 h-4" name="expand" />
                    </button>

                    <button
                        onClick={() => setOpen(false)}
                        className="text-gray-600"
                    >
                        <Icon className="w-4 h-4" name="xmark" />
                    </button>
                </div>

                <div className="relative flex-1 w-full border-red-100 flex flex-col gap-3 overflow-y-auto p-1 justify-center items-center">
                    <div className="text-gray-400 text-sm">
                        {error.message || "something went wrong :("}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            id="chat-box"
            ref={chatContainer}
            className={`${open ? "flex" : "hidden"} fixed flex-col border-[2px] border-black right-0 bottom-0 sm:right-1 sm:bottom-1 bg-slate-100 w-[325px] h-[400px] overflow-auto z-30`}
        >
            <div className="relative flex items-center justify-center gap-3 border-b-2 border-black px-3 py-2">
                <p className="flex-1 font-semibold text-gray-600">chat</p>

                <div className="flex items-center gap-2">
                    {currentUser.username ===
                        boardState.board.createdBy.username && (
                        <button
                            onClick={handleClearMessages}
                            className="text-[0.65rem] border-[2px] border-rose-400 text-rose-400 px-2 me-2 font-semibold"
                        >
                            clear
                        </button>
                    )}

                    <button onClick={handleOpenFloat} className="text-gray-600">
                        <Icon className="w-4 h-4" name="expand" />
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
                className="relative flex-1 w-full border-red-100 flex flex-col gap-3 overflow-y-auto p-1"
                onScroll={handleLoadMoreOnScroll}
            >
                <Loading
                    loading={isFetchingMore}
                    position={"sticky"}
                    fontSize={"0.75rem"}
                    displayText={"getting messages..."}
                />

                {chats.map((item, index) => {
                    return (
                        <ChatMessage
                            key={index}
                            chatMessage={item}
                            deleteMessage={deleteMessage}
                            highlightOwnMessages={true}
                            inMiniChat={true}
                        />
                    );
                })}
                <div
                    style={{ float: "left", clear: "both" }}
                    ref={messageEndRef}
                ></div>
            </div>

            <div className="bg-gray-100 px-2 border-t-[2px] border-black">
                <ChatInput
                    withSentButton={true}
                    sendMessage={sendMessage}
                    setHasReceivedNewMessage={setHasReceivedNewMessage}
                    setIsAtBottomOfChat={setIsAtBottomOfChat}
                />
            </div>
        </div>
    );
};

export default ChatBox;
