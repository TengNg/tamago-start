import { useRef, useEffect } from "react";
import useBoardState from "../../hooks/useBoardState";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import Loading from "../ui/Loading";
import Icon from "../shared/Icon";
import useCurrentUserContext from "../../hooks/useCurrentUserContext";

const FloatingChat = ({
    open,
    setOpen,
    setOpenChatBox,

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

    const { chats, boardState, isAtBottomOfChat, setIsAtBottomOfChat } =
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

    const handleClose = () => {
        setOpen(false);
    };

    const handleCloseFloatAndOpenChatBox = () => {
        setOpen(false);
        setOpenChatBox(true);
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

    return (
        <>
            <div
                onClick={handleClose}
                className={`fixed ${!open ? "hidden" : "block"} box-border top-0 left-0 text-gray-600 font-bold h-screen text-[1.25rem] w-full bg-gray-500 opacity-40 z-50 cursor-auto`}
            ></div>

            <div
                ref={chatContainer}
                className={`fixed ${!open ? "hidden" : "block"} box--style flex pt-2 flex-col top-20 right-0 left-[50%] overflow-auto -translate-x-[50%] w-[90%] md:w-[80%] lg:w-[80%] xl:w-[50%] 2xl:w-[50%] h-[75%] border-2 border-black z-50 cursor-auto bg-slate-100`}
            >
                <div className="flex justify-between items-center pb-2 mx-3">
                    <div>chat</div>

                    <div className="flex justify-center items-center">
                        {currentUser.username ===
                            boardState.board.createdBy.username && (
                            <button
                                onClick={handleClearMessages}
                                className="me-6 text-[0.75rem] border-2 border-rose-400 text-rose-400 px-2 font-medium"
                            >
                                Clear
                            </button>
                        )}
                        <button
                            onClick={handleCloseFloatAndOpenChatBox}
                            className="text-[0.75rem] text-gray-500"
                        >
                            <Icon className="w-4 h-4" name="compress" />
                        </button>

                        <button
                            onClick={handleClose}
                            className="text-[0.75rem] ms-5 text-gray-500"
                        >
                            <Icon className="w-4 h-4" name="xmark" />
                        </button>
                    </div>
                </div>

                <div className="h-px bg-gray-300 w-full"></div>

                <div
                    onScroll={handleLoadMoreOnScroll}
                    className="relative flex-1 w-full border-red-100 flex flex-col gap-3 overflow-auto py-3 px-3"
                >
                    <Loading
                        loading={isFetchingMore}
                        position={"sticky"}
                        fontSize={"0.75rem"}
                        displayText={"getting messages..."}
                    />

                    {chats.map((item, index) => {
                        const isCard =
                            item?.content.startsWith("!") &&
                            item?.content.length >= 20 &&
                            item?.content.length <= 30;
                        return (
                            <ChatMessage
                                isCard={isCard}
                                padding={{ x: "none", y: "none" }}
                                withUserIcon={true}
                                withSeparator={true}
                                key={index}
                                chatMessage={item}
                                deleteMessage={deleteMessage}
                            />
                        );
                    })}
                    <div
                        style={{ float: "left", clear: "both" }}
                        ref={messageEndRef}
                    ></div>
                </div>

                <div className="px-3">
                    <ChatInput
                        withSentButton={true}
                        setHasReceivedNewMessage={setHasReceivedNewMessage}
                        sendMessage={sendMessage}
                    />
                </div>
            </div>
        </>
    );
};

export default FloatingChat;
