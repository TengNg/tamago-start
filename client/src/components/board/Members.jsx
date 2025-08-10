import { useRef, useEffect } from "react";
import Avatar from "../avatar/Avatar";
import useBoardState from "../../hooks/useBoardState";
import dateFormatter from "../../utils/dateFormatter";
import Icon from "../shared/Icon";
import useCurrentUserContext from "../../hooks/useCurrentUserContext";

const Members = ({ open, setOpen }) => {
    const dialog = useRef();

    const { currentUser } = useCurrentUserContext();

    const { boardState } = useBoardState();

    useEffect(() => {
        if (open) {
            dialog.current.showModal();

            const handleOnClose = () => {
                setOpen(false);
            };

            dialog.current.addEventListener("close", handleOnClose);

            () => {
                dialog.current.removeEventListener("close", handleOnClose);
            };
        } else {
            dialog.current.close();
        }
    }, [open]);

    const handleClose = () => {
        dialog.current.close();
    };

    const handleCloseOnOutsideClick = (e) => {
        if (e.target === dialog.current) {
            dialog.current.close();
        }
    };

    return (
        <>
            <dialog
                ref={dialog}
                className="z-40 backdrop:bg-black/15 box--style gap-4 items-start p-3 h-fit min-w-[300px] border-black border-[2px] bg-gray-200"
                onClick={handleCloseOnOutsideClick}
            >
                <div className="flex w-full justify-between items-center border-b-[1px] border-black pb-3">
                    <p className="font-normal text-[1rem] text-gray-700">
                        members
                    </p>
                    <button
                        className="text-gray-600 flex justify-center items-center focus:outline-none"
                        onClick={handleClose}
                    >
                        <Icon className="w-4 h-4" name="xmark" />
                    </button>
                </div>

                <div className="flex flex-col justify-start items-start gap-4 mt-4 pb-3 overflow-auto max-h-[600px] w-[90%] sm:w-[400px]">
                    <div className="flex gap-2 items-center">
                        <Avatar
                            username={boardState.board.createdBy.username}
                            profileImage={
                                boardState.board.createdBy.profileImage
                            }
                            size="lg"
                            withBorder={
                                boardState.board.createdBy.username ===
                                currentUser.username
                            }
                            isAdmin={true}
                            clickable={false}
                        />
                        <div className="d-flex flex-col items-center">
                            <div className="text-gray-600 font-medium text-[0.85rem]">
                                {boardState.board.createdBy.username}
                            </div>
                            <div className="text-gray-500 text-[10px] sm:text-[0.65rem] font-medium">
                                (owner)
                            </div>
                            <div className="text-gray-500 text-[10px] sm:text-[0.65rem] font-medium">
                                joined:{" "}
                                {dateFormatter(boardState.board.createdAt)}
                            </div>
                        </div>
                    </div>

                    {boardState.board.members.map((user, index) => {
                        const joinedAt = boardState.memberships.find(
                            (membership) => membership.userId === user._id,
                        )?.createdAt;

                        return (
                            <div
                                key={index}
                                className="flex gap-2 items-center"
                            >
                                <Avatar
                                    key={index}
                                    username={user.username}
                                    profileImage={user.profileImage}
                                    withBorder={
                                        user.username === currentUser.username
                                    }
                                    size="lg"
                                    clickable={false}
                                />
                                <div className="d-flex flex-col items-center">
                                    <div className="text-gray-600 font-medium text-[0.85rem]">
                                        {user.username}
                                    </div>
                                    <div className="text-gray-500 text-[10px] sm:text-[0.65rem] font-medium">
                                        (member)
                                    </div>
                                    <div className="text-gray-500 text-[10px] sm:text-[0.65rem] font-medium">
                                        joined:{" "}
                                        {joinedAt !== undefined
                                            ? dateFormatter(joinedAt)
                                            : "(not found)"}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </dialog>
        </>
    );
};

export default Members;
