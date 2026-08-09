import dateFormatter from "../../utils/dateFormatter";
import { useLocation, Link } from "react-router-dom";
import Icon from "../shared/Icon";
import validUrl from "../../utils/validUrl";
import useCurrentUser from "../../hooks/useCurrentUser";
import { useMutation } from "@tanstack/react-query";
import useToast from "../../hooks/useToast";
import { chatApi } from "../../services/api";
import { getErrorMessage } from "../../utils/getErrorMessage";

/**
 * @typedef {Object} ChatMessageProps
 * @property {ChatMessage} chatMessage
 */

/**
 * @param {ChatMessageProps} props
 */
const ChatMessage = ({ chatMessage }) => {
    const location = useLocation();
    const { pathname } = location;

    const currentUser = useCurrentUser();
    const toast = useToast();

    const { _id, content, sentBy, createdAt, error, type } = chatMessage;
    const chatContent = type !== "MESSAGE" ? content.split(" ")[1] : content;
    const isMe = currentUser._id === sentBy._id;

    const deleteMessageMutation = useMutation({
        mutationFn: () => chatApi.deleteMessage(_id),
        onError: (err) => {
            const errMsg = getErrorMessage(err, "Failed to send message");
            toast.error(errMsg);
        },
    });

    /**
     * @param {string} chatContent
     */
    const openLink = (chatContent) => {
        if (!validUrl(chatContent)) {
            return;
        }

        window.open(chatContent, "_blank");
    };

    return (
        <div className="group relative w-full h-fit flex justify-start items-start p-2 gap-2 border-b border-gray-400/30 bg-inherit hover:bg-gray-400/20">
            <div className="flex flex-col w-full">
                <div className="flex w-full justify-start items-start">
                    <div className="flex w-full gap-2 justify-between flex-wrap">
                        <div
                            className={`flex items-center gap-0.5 text-[0.75rem] font-bold ${isMe ? "text-teal-700" : "text-gray-700"}`}
                        >
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

                <div className="flex gap-1 justify-start items-start">
                    {type === "CARD_CODE" ? (
                        <div className="flex-1 w-fit justify-center items-center">
                            <div className="p-2 w-fit wrap-break-word whitespace-pre-line text-[0.75rem] font-semibold bg-pink-100 text-pink-600 border border-dashed border-pink-600">
                                <Link
                                    replace
                                    to={`${pathname}?card=${chatContent}`}
                                    className="px-2 py-1 bg-pink-400 text-gray-50! cursor-pointer"
                                >
                                    CARD
                                </Link>
                                <span> </span>
                                <span>{chatContent}</span>
                            </div>
                            <div
                                className={`${validUrl(content.split(" ").slice(2).join(" ")) ? "cursor-pointer hover:underline" : ""} flex-1 wrap-break-word break-all whitespace-pre-line text-[0.75rem] text-gray-600 font-medium`}
                                onClick={() => {
                                    openLink(content.split(" ")[2]);
                                }}
                            >
                                {content.split(" ").slice(2).join(" ")}
                            </div>
                        </div>
                    ) : type === "BOARD_CODE" ? (
                        <div className="flex-1 w-fit justify-center items-center">
                            <div className="p-2 w-fit wrap-break-word whitespace-pre-line text-[0.75rem] font-medium bg-violet-100 text-violet-700 border border-dashed border-violet-600">
                                <Link
                                    to={`/b/${chatContent}`}
                                    className="px-2 py-1 bg-violet-400 text-gray-50! cursor-pointer"
                                >
                                    BOARD
                                </Link>
                                <span> </span>
                                <span>{chatContent}</span>
                            </div>
                            <div
                                className={`${validUrl(content.split(" ").slice(2).join(" ")) ? "cursor-pointer hover:underline" : ""} flex-1 wrap-break-word break-all whitespace-pre-line text-[0.75rem] text-gray-600 font-medium`}
                                onClick={() => {
                                    openLink(content.split(" ")[2]);
                                }}
                            >
                                {content.split(" ").slice(2).join(" ")}
                            </div>
                        </div>
                    ) : (
                        <div
                            className={`${validUrl(chatContent) ? "cursor-pointer hover:underline" : ""} flex-1 wrap-break-word break-all whitespace-pre-line text-[0.75rem] text-gray-600 font-medium`}
                            onClick={() => {
                                openLink(chatContent);
                            }}
                        >
                            {chatContent}
                        </div>
                    )}

                    {isMe && (
                        <button
                            onClick={() => deleteMessageMutation.mutate()}
                            className="text-transparent group-hover:text-gray-400 mt-0.5 hover:text-red-600!"
                        >
                            <Icon className="w-3 h-3" name="xmark" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatMessage;
