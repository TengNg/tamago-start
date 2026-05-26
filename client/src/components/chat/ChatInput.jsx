import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, useEffect } from "react";
import { chatKeys } from "../../queries/chatKeys";
import { sendMessage } from "../../api/chatApi";
import { useParams } from "react-router-dom";
import useBoardState from "../../hooks/useBoardState";
import useToast from "../../hooks/useToast";

const ChatInput = () => {
    const { boardId } = useParams();
    const queryClient = useQueryClient();
    const { openChatBox, socket } = useBoardState();
    const [message, setMessage] = useState("");
    const textAreaRef = useRef();
    const toast = useToast();

    const sendMessageMutation = useMutation({
        mutationFn: (content) => sendMessage({ boardId, content }),
        onSuccess: async (data, _variables, _context) => {
            const chatMessage = data.chatMessage;
            queryClient.setQueryData(chatKeys.messages(boardId), (old) => {
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
            });

            socket.emit("sendMessage", { chatMessage });
        },
        onError: (err) => {
            const errMsg =
                err.response?.data?.message || "Failed to send message";
            toast.error(errMsg);
        },
    });

    useEffect(() => {
        const textarea = textAreaRef.current;
        textarea.style.height = "2.5rem";
        textarea.style.height = `${textarea.scrollHeight}px`;
    }, []);

    useEffect(() => {
        if (textAreaRef.current && openChatBox) {
            textAreaRef.current.focus();
        }
    }, [openChatBox]);

    const send = () => {
        const messageContent = textAreaRef.current.value.trim();
        sendMessageMutation.mutate(messageContent);
        setMessage("");
        textAreaRef.current.style.height = "2.5rem";
    };

    const handleTextAreaChanged = () => {
        const textarea = textAreaRef.current;
        setMessage(textarea.value);
        textarea.style.height = "2.5rem";
        textarea.style.height = `${textarea.scrollHeight}px`;
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey && window.innerWidth >= 768) {
            if (e.target.value.trim() === "") return;
            e.preventDefault();
            send(e);
        }
    };

    const handleSentButtonOnClick = () => {
        if (message) {
            send(message);
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
                    onClick={handleSentButtonOnClick}
                >
                    send
                </button>
            </div>
        </div>
    );
};

export default ChatInput;
