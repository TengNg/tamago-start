import dateFormatter from "../../utils/dateFormatter";
import { useLocation, Link, useParams } from "react-router-dom";
import Icon from "../shared/Icon";
import validUrl from "../../utils/validUrl";
import useCurrentUserContext from "../../hooks/useCurrentUserContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useToast from "../../hooks/useToast";
import { deleteMessage } from "../../api/chatApi";
import useBoardState from "../../hooks/useBoardState";

const ChatMessage = ({
    chatMessage,
    withUserIcon = false,
}) => {
    const location = useLocation();
    const { pathname } = location;

    const { currentUser } = useCurrentUserContext();
    const queryClient = useQueryClient();
    const toast = useToast();
    const { boardId } = useParams();
    const { socket } = useBoardState();

    const { _id, content, sentBy, createdAt, error, type } = chatMessage;
    const chatContent = type !== "MESSAGE" ? content.split(" ")[1] : content;
    const isMe = currentUser._id === sentBy._id;

    const deleteMessageMutation = useMutation({
        mutationFn: () => deleteMessage({ boardId, id: _id }),
        onSuccess: (_data, _variables, _context) => {
            queryClient.invalidateQueries({
                queryKey: ["chat", "board", boardId, "messages", _id],
            });
            socket.emit("deleteMessage", { id: _id });
        },
        onError: (err) => {
            const errMsg = err.response?.data?.message || "Failed to send message";
            toast.error(errMsg);
        },
    });

    const openLink = (chatContent) => {
        if (!validUrl(chatContent)) {
            return;
        }

        window.open(chatContent, "_blank");
    };

    return (
        <div
            className={`group relative w-full h-fit flex justify-start items-start px-1 gap-2 border-b-[1px] border-gray-300 pb-2`}
        >
            <div className="flex flex-col w-full">
                <div className="flex w-full justify-start items-start">
                    <div className="flex w-full gap-2 justify-between flex-wrap">
                        <div
                            className={`flex items-center gap-1 text-[0.75rem] font-bold ${chatMessage.sentBy?.username === currentUser.username ? "text-teal-700" : "text-gray-700"}`}
                        >
                            {withUserIcon &&
                                chatMessage.sentBy?.username ===
                                currentUser.username && (
                                    <Icon className="w-3 h-3" name="profile" />
                                )}
                            <p>{sentBy?.username}</p>
                        </div>
                        {!error ? (
                            <p className="text-[0.65rem] text-gray-600">
                                {createdAt
                                    ? dateFormatter(createdAt)
                                    : "sending..."}
                            </p>
                        ) : (
                            <p className="text-[0.65rem] text-red-600">
                                Failed to send this message
                            </p>
                        )}
                    </div>
                </div>

                {type === "CARD_CODE" ? (
                    <div
                        className={`max-w-[95%] px-1 py-2 w-fit flex justify-center items-center bg-pink-50 text-pink-600 border-[1px] border-dashed border-pink-600`}
                    >
                        <div className="w-full break-words whitespace-pre-line text-[0.75rem] p-[0.1rem] font-semibold">
                            <Link
                                replace={true}
                                to={`${pathname}?card=${chatContent}`}
                                className="px-2 py-1 bg-pink-400 text-gray-50 cursor-pointer"
                            >
                                CARD
                            </Link>
                            <span> </span>
                            <span>{chatContent}</span>
                        </div>
                    </div>
                ) : type === "BOARD_CODE" ? (
                    <div
                        className={`max-w-[95%] px-1 py-2 w-fit flex justify-center items-center bg-violet-50 text-violet-700 border-[1px] border-dashed border-violet-600`}
                    >
                        <div className="w-full break-words whitespace-pre-line text-[0.75rem] p-[0.1rem] font-medium">
                            <Link
                                to={`/b/${chatContent}`}
                                className="px-2 py-1 bg-violet-400 text-gray-50 cursor-pointer"
                            >
                                BOARD
                            </Link>
                            <span> </span>
                            <span>{chatContent}</span>
                        </div>
                    </div>
                ) : (
                    <div
                        className="max-w-[95%] w-fit flex justify-center items-center"
                    >
                        <div
                            className={`${validUrl(chatContent) ? "cursor-pointer hover:underline" : ""} w-full break-words whitespace-pre-line text-[0.75rem] text-gray-600 font-medium`}
                            onClick={() => {
                                openLink(chatContent);
                            }}
                        >
                            {chatContent}
                        </div>
                    </div>
                )}

                {isMe && (
                    <button
                        onClick={deleteMessageMutation.mutate}
                        className="absolute top-[1.25rem] right-[0.2rem] text-transparent group-hover:text-gray-400"
                    >
                        <Icon className="w-3 h-3" name="xmark" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default ChatMessage;
