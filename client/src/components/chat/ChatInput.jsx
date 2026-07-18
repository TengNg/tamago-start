import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, useEffect } from "react";
import { chatKeys } from "../../queries/chatKeys";
import { sendMessage } from "../../api/chatApi";
import useBoardState from "../../hooks/useBoardState";
import useToast from "../../hooks/useToast";
import { SOCKET_EVENTS } from "@shared/socket-events.js";
import { getErrorMessage } from "../../utils/getErrorMessage";

const ChatInput = () => {
    const queryClient = useQueryClient();
    const { boardState, openChatBox, socket } = useBoardState();
    const [message, setMessage] = useState("");
    const toast = useToast();

    /** @type {React.MutableRefObject<HTMLTextAreaElement | null>} */
    const textAreaRef = useRef(null);

    const sendMessageMutation = useMutation({
        mutationFn: (/** @type {string} */ content) =>
            sendMessage({ boardId: boardState.board._id, content }),
        onSuccess: async (data, _variables, _context) => {
            const chatMessage = data.chatMessage;
            queryClient.setQueryData(
                chatKeys.messages(boardState.board._id),
                /**
                 * @param {import('@tanstack/react-query').InfiniteData<GetChatResponse, unknown> | undefined} old
                 */
                (old) => {
                    if (!old) {
                        return old;
                    }

                    const currentPages = [...old.pages];
                    const currentFirstPage = currentPages[0];
                    const newFirstPage = {
                        ...currentFirstPage,
                        messages: [
                            chatMessage,
                            ...currentFirstPage.messages.slice(
                                0,
                                currentFirstPage.messages.length - 1,
                            ),
                        ],
                    };

                    if (old.pages.length === 1) {
                        return {
                            ...old,
                            pages: [newFirstPage],
                        };
                    }

                    currentPages[0] = newFirstPage;
                    return {
                        ...old,
                        pages: currentPages,
                    };
                },
            );

            socket.emit(SOCKET_EVENTS.CHAT_SEND, { chatMessage });
        },
        onError: (err) => {
            const errMsg = getErrorMessage(err, "Failed to send message");
            toast.error(errMsg);
        },
    });

    useEffect(() => {
        const textarea = textAreaRef.current;
        if (!textarea) {
            return;
        }

        textarea.style.height = "2.5rem";
        textarea.style.height = `${textarea.scrollHeight}px`;
    }, []);

    useEffect(() => {
        if (textAreaRef.current && openChatBox) {
            textAreaRef.current.focus();
        }
    }, [openChatBox]);

    const send = () => {
        const textarea = textAreaRef.current;
        if (!textarea) {
            return;
        }

        const messageContent = textarea.value.trim();
        sendMessageMutation.mutate(messageContent);
        setMessage("");
        textarea.style.height = "2.5rem";
    };

    const handleTextAreaChanged = () => {
        const textarea = textAreaRef.current;
        if (!textarea) {
            return;
        }

        setMessage(textarea.value);
        textarea.style.height = "2.5rem";
        textarea.style.height = `${textarea.scrollHeight}px`;
    };

    /**
     * @param {React.KeyboardEvent<HTMLTextAreaElement>} e
     */
    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey && window.innerWidth >= 768) {
            if (e.currentTarget.value.trim() === "") {
                return;
            }

            e.preventDefault();
            send();
        }
    };

    return (
        <div className="px-2 border-t-2 border-gray-600">
            <div className="flex w-full py-2 gap-1 justify-start items-start">
                <textarea
                    id="chat-input"
                    className="text-[1rem] sm:text-[0.75rem] text-gray-700 sm:min-h-10 min-h-11 max-h-25 border border-gray-600 leading-normal overflow-y-auto resize-none w-full py-2 px-3 font-medium placeholder-gray-500 focus:outline-hidden bg-transparent"
                    placeholder="Write something..."
                    ref={textAreaRef}
                    value={message}
                    onChange={handleTextAreaChanged}
                    onKeyDown={handleKeyDown}
                ></textarea>

                <button
                    className="h-11 sm:h-10 d-flex justify-center items-center text-[12px] text-gray-600 border border-gray-600 px-3 hover:text-white hover:bg-gray-500"
                    onClick={send}
                >
                    send
                </button>
            </div>
        </div>
    );
};

export default ChatInput;
