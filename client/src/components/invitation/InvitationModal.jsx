import { useState } from "react";
import useBoardState from "../../hooks/useBoardState";
import Member from "./Member";
import { sendInvitation, removeBoardMember } from "../../api/invitation";
import { useKeybind } from "../../hooks/useKeybind";
import { kb } from "../../constants/keybinds";
import { SOCKET_EVENTS } from "@shared/socket-events.js";
import { useMutation } from "@tanstack/react-query";
import useToast from "../../hooks/useToast";
import Modal from "../ui/Modal";
import useCurrentUser from "../../hooks/useCurrentUser";
import { getErrorMessage } from "../../utils/getErrorMessage";

const InvitationModal = () => {
    const currentUser = useCurrentUser();

    const {
        boardState,
        removeMemberFromBoard,
        openInvitationForm: open,
        setOpenInvitationForm: setOpen,
        socket,
    } = useBoardState();

    const [username, setUsername] = useState("");

    const toast = useToast();

    const inviteMutation = useMutation({
        mutationFn: (/** @type {string} */ receiverName) =>
            sendInvitation(boardState.board._id, receiverName),
        onSuccess: (_data, receiverName) => {
            setUsername("");
            toast.success(`invitation sent to ${receiverName}`);
        },
        onError: (err) => {
            toast.error(getErrorMessage(err, "Failed to send invitation"));
        },
    });

    const removeMemberMutation = useMutation({
        mutationFn: (/** @type {string} */ memberId) =>
            removeBoardMember(boardState.board._id, memberId),
        onSuccess: (_data, memberId) => {
            removeMemberFromBoard(memberId);
            socket.emit(SOCKET_EVENTS.BOARD_KICK, { memberId });
            toast.success("member removed");
        },
        onError: (err) => {
            toast.error(getErrorMessage(err, "Failed to remove member"));
        },
    });

    useKeybind(kb.openInvitationForm, () => {
        setOpen((prev) => !prev);
    });

    const handleClose = () => {
        setOpen(false);
        setUsername("");
    };

    const handleSendInvitation = () => {
        const trimmed = username.trim();
        if (!trimmed) return;

        if (
            trimmed === currentUser.username ||
            trimmed === boardState.board.createdBy.username
        ) {
            toast.error("Can't send invitation");
            return;
        }

        inviteMutation.mutate(trimmed);
    };

    /**
     * @param {React.KeyboardEvent<HTMLInputElement>} e
     */
    const handleInputOnEnter = (e) => {
        if (!e.currentTarget.value) {
            return;
        }

        if (e.key === "Enter") {
            handleSendInvitation();
        }
    };

    /**
     * @param {string} memberId
     */
    const handleRemoveMember = (memberId) => {
        removeMemberMutation.mutate(memberId);
    };

    return (
        <Modal
            title="invite people this board"
            open={open}
            setOpen={handleClose}
            className="min-w-87.5"
        >
            <div className="w-full relative flex flex-col justify-center gap-3 mb-3">
                <input
                    autoFocus
                    className="p-3 w-full overflow-hidden shadow-[0_3px_0_0] shadow-gray-600 text-sm whitespace-nowrap text-ellipsis border-2 bg-gray-100 border-gray-600 text-gray-600 font-bold select-none font-mono focus:outline-hidden"
                    placeholder="Enter username..."
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={handleInputOnEnter}
                    value={username}
                />
                <button
                    onClick={handleSendInvitation}
                    disabled={inviteMutation.isPending}
                    className="button--style--dark"
                >
                    send
                </button>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-100 max-h-62.5 overflow-auto border border-t-gray-600 p-0 py-3">
                {boardState.members.map((member) => {
                    return (
                        <Member
                            key={member._id}
                            remove={handleRemoveMember}
                            member={member}
                        />
                    );
                })}
            </div>
        </Modal>
    );
};

export default InvitationModal;
