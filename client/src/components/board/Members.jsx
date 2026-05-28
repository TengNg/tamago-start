import { useRef, useEffect } from "react";
import Avatar from "../avatar/Avatar";
import useBoardState from "../../hooks/useBoardState";
import dateFormatter from "../../utils/dateFormatter";
import Icon from "../shared/Icon";
import useCurrentUserContext from "../../hooks/useCurrentUserContext";
import { useKeybind } from "../../hooks/useKeybind";
import { kb } from "../../constants/keybinds";

const Members = () => {
    const dialog = useRef();

    const { currentUser } = useCurrentUserContext();

    const {
        boardState,
        openMembers: open,
        setOpenMembers: setOpen,
    } = useBoardState();

    useKeybind(kb.openMembers, () => {
        setOpen((prev) => !prev);
    });

    useEffect(() => {
        if (open) {
            dialog.current.showModal();

            const handleOnClose = () => {
                setOpen(false);
            };

            dialog.current.addEventListener("close", handleOnClose);

            return () => {
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
                className="z-40 backdrop:bg-black/15 box--style gap-4 items-start p-3 h-fit min-w-75 border-black border-2 bg-gray-200"
                onClick={handleCloseOnOutsideClick}
            >
                <div className="flex w-full justify-between items-center border-b border-black pb-3">
                    <p className="font-normal text-[1rem] text-gray-700">
                        members
                    </p>
                    <button
                        className="text-gray-600 flex justify-center items-center focus:outline-hidden"
                        onClick={handleClose}
                    >
                        <Icon className="w-4 h-4" name="xmark" />
                    </button>
                </div>

                <div className="flex flex-col justify-start items-start gap-4 mt-4 pb-3 overflow-auto max-h-150 w-[90%] sm:w-100">
                    {boardState.members.map((m) => {
                        return (
                            <div
                                key={m.username}
                                className="flex gap-2 items-center"
                            >
                                <Avatar
                                    key={m.username}
                                    username={m.username}
                                    profileImage={m.profileImage}
                                    withBorder={
                                        m.username === currentUser.username
                                    }
                                    size="lg"
                                    clickable={false}
                                />
                                <div className="d-flex flex-col items-center">
                                    <div className="text-gray-600 font-medium text-[0.85rem]">
                                        {m.username}
                                    </div>
                                    <div className="text-gray-500 text-[10px] sm:text-[0.65rem] font-medium">
                                        {m.role}
                                    </div>
                                    <div className="text-gray-500 text-[10px] sm:text-[0.65rem] font-medium">
                                        joined:{" "}
                                        {m.createdAt !== undefined
                                            ? dateFormatter(m.createdAt)
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
