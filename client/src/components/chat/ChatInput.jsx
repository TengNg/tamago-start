import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, useEffect } from "react";
import { chatKeys } from "../../queries/chatKeys";
import { sendMessage } from "../../api/chatApi";
import { useParams } from "react-router-dom";
import useBoardState from "../../hooks/useBoardState";

const ChatInput = () => {
    const { boardId } = useParams();
    const queryClient = useQueryClient();
    const { socket } = useBoardState();
    const [message, setMessage] = useState("");
    const textAreaRef = useRef();

    const sendMessageMutation = useMutation({
        mutationFn: (content) => sendMessage({ boardId, content }),
        onSuccess: (data, _variables, _context) => {
            queryClient.invalidateQueries({
                queryKey: chatKeys.messages(boardId)
            });
            socket.emit("sendMessage", { chatMessage: data.chatMessage });
        },
        onError: (err) => {
            const errMsg = err.response?.data?.message || "Failed to send message";
            toast.error(errMsg);
        },
    });


    useEffect(() => {
        const textarea = textAreaRef.current;
        textarea.style.height = "2.5rem";
        textarea.style.height = `${textarea.scrollHeight}px`;
    }, []);

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
        <div className="flex w-full py-2 gap-1 bg-slate-100 justify-start items-start">
            <textarea
                id="chat-input"
                className="text-[1rem] sm:text-[0.75rem] text-gray-700 bg-gray-100 sm:min-h-[2.5rem] min-h-[2.75rem] max-h-[100px] border border-gray-600 leading-normal overflow-y-auto resize-none w-full py-2 px-3 font-medium placeholder-gray-500 focus:outline-none focus:bg-white"
                placeholder="Write something..."
                ref={textAreaRef}
                value={message}
                onChange={handleTextAreaChanged}
                onKeyDown={handleKeyDown}
            ></textarea>

            <button
                className="h-[2.75rem] sm:h-[2.5rem] d-flex justify-center items-center text-[12px] text-gray-600 border-[1px] border-gray-600 px-3 hover:text-white hover:bg-gray-500"
                onClick={handleSentButtonOnClick}
            >
                send
            </button>
        </div>
    );
};

export default ChatInput;
