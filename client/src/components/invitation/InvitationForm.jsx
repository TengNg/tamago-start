import { useEffect, useRef, useState } from "react";
import useBoardState from "../../hooks/useBoardState";
import Avatar from "../avatar/Avatar";
import Loading from "../ui/Loading";
import Member from "./Member";
import Icon from "../shared/Icon";
import useCurrentUserContext from "../../hooks/useCurrentUserContext";
import { axiosPrivate } from "../../api/axios";

const InvitationForm = ({ open, setOpen }) => {
    const { currentUser } = useCurrentUserContext();
    const { boardState, removeMemberFromBoard, socket } = useBoardState();

    const [username, setUsername] = useState("");
    const [errMsg, setErrMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [loading, setLoading] = useState(false);

    const usernameInputRef = useRef();
    const dialog = useRef();

    useEffect(() => {
        if (open) {
            dialog.current.showModal();
            usernameInputRef.current.focus();

            const handleKeyDown = (e) => {
                if (e.ctrlKey && e.key === "/") {
                    e.preventDefault();
                    usernameInputRef.current.focus();
                }
            };

            const handleOnClose = () => {
                setOpen(false);
            };

            dialog.current.addEventListener("close", handleOnClose);
            dialog.current.addEventListener("keydown", handleKeyDown);

            () => {
                dialog.current.removeEventListener("close", handleOnClose);
                dialog.current.removeEventListener("keydown", handleKeyDown);
            };
        } else {
            dialog.current.close();
        }
    }, [open]);

    useEffect(() => {
        let id1 = null;
        let id2 = null;
        if (errMsg !== "") {
            id1 = setTimeout(() => {
                setErrMsg("");
            }, 2000);
        } else if (successMsg !== "") {
            id2 = setTimeout(() => {
                setSuccessMsg("");
            }, 2000);
        }

        return () => {
            if (id1) clearTimeout(id1);
            if (id2) clearTimeout(id2);
        };
    }, [errMsg, successMsg]);

    const handleCloseOnOutsideClick = (e) => {
        if (e.target === dialog.current) {
            dialog.current.close();
        }
    };

    const handleClose = () => {
        dialog.current.close();
    };

    const handleSendInvitation = async () => {
        if (usernameInputRef.current.value.trim() === "") {
            return;
        }

        if (
            usernameInputRef.current.value.trim() === currentUser.username ||
            usernameInputRef.current.value.trim() ===
                boardState.board.createdBy.username
        ) {
            setErrMsg("Can't sent invitation");
            return;
        }

        try {
            setLoading(true);
            const receiverName = usernameInputRef.current.value.trim();
            await axiosPrivate.post(
                `/invitations`,
                JSON.stringify({ boardId: boardState.board._id, receiverName }),
            );
            setUsername("");
            setLoading(false);
            setSuccessMsg(`invitation sent to ${receiverName}`);
        } catch (err) {
            setLoading(false);
            setErrMsg(
                err?.response?.data?.message || "Failed to send invitation",
            );
        }
    };

    const handleRemoveMemberFromBoard = async (memberName) => {
        try {
            setLoading(true);
            await axiosPrivate.patch(
                `/boards/${boardState.board._id}/members/${memberName}`,
            );
            removeMemberFromBoard(memberName);
            socket.emit("kickMember", memberName);
            setLoading(false);
        } catch (err) {
            setLoading(false);
            setErrMsg(err?.response?.data?.error || "Failed to remove member");
        }
    };

    const handleInputOnEnter = (e) => {
        if (!e.target.value) {
            return;
        }

        if (e.key == "Enter") {
            handleSendInvitation();
        }
    };

    return (
        <>
            <dialog
                ref={dialog}
                className="z-40 backdrop:bg-black/15 box--style gap-4 items-start p-3 h-fit min-w-[350px] border-black border-[2px] bg-gray-200 overflow-hidden"
                onClick={handleCloseOnOutsideClick}
            >
                <Loading
                    loading={loading}
                    position={"absolute"}
                    fontSize={"0.75rem"}
                    displayText={"loading..."}
                />

                <div className="flex w-full justify-between items-center border-b-[1px] border-black pb-3">
                    <p className="font-normal text-[1rem] text-gray-700">
                        Invite people this board
                    </p>
                    <button
                        className="text-gray-600 flex justify-center items-center"
                        onClick={handleClose}
                    >
                        <Icon className="w-4 h-4" name="xmark" />
                    </button>
                </div>

                <div className="w-full relative flex flex-col justify-center gap-3 py-2 my-3">
                    <input
                        ref={usernameInputRef}
                        className={`p-3 w-full overflow-hidden shadow-[0_3px_0_0] shadow-gray-600 sm:text-[0.75rem] whitespace-nowrap text-ellipsis border-[2px] bg-gray-100 border-gray-600 text-gray-600 font-bold select-none font-mono focus:outline-none`}
                        placeholder="Enter username..."
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyDown={handleInputOnEnter}
                        value={username}
                    />
                    <button
                        onClick={() => handleSendInvitation()}
                        className="button--style border-[2px] py-2 text-[0.75rem] hover:bg-gray-600 hover:text-white"
                    >
                        + invite
                    </button>

                    {successMsg && (
                        <p className="absolute -top-2 left-0 text-center h-3 text-blue-700 text-[0.65rem] font-semibold">
                            {successMsg}
                        </p>
                    )}
                    {errMsg && (
                        <p className="absolute -top-2 left-1 text-center h-3 text-red-700 text-[0.65rem] font-semibold">
                            {errMsg}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-3 w-full max-w-[400px] max-h-[250px] overflow-auto border-[1px] border-t-gray-600 p-0 py-3">
                    <div className="flex gap-1">
                        <Avatar
                            username={boardState.board.createdBy.username}
                            size="md"
                            clickable={false}
                        />

                        <div className="flex flex-col justify-center">
                            <p className="text-[0.75rem] text-gray-800 font-medium">
                                {boardState.board.createdBy.username}{" "}
                                {currentUser.username ===
                                    boardState.board.createdBy.username &&
                                    "(you)"}
                            </p>
                            <p className="text-[0.75rem] text-gray-800">
                                owner
                            </p>
                        </div>
                    </div>

                    {boardState.members.map((user, index) => {
                        return (
                            <Member
                                key={index}
                                handleRemoveMemberFromBoard={
                                    handleRemoveMemberFromBoard
                                }
                                boardState={boardState}
                                user={user}
                            />
                        );
                    })}
                </div>
            </dialog>
        </>
    );
};

export default InvitationForm;
