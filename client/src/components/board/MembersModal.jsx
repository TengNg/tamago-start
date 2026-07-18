import Avatar from "../avatar/Avatar";
import useBoardState from "../../hooks/useBoardState";
import dateFormatter from "../../utils/dateFormatter";
import useCurrentUser from "../../hooks/useCurrentUser";
import { useKeybind } from "../../hooks/useKeybind";
import { kb } from "../../constants/keybinds";
import Modal from "../ui/Modal";

const MembersModal = () => {
    const currentUser = useCurrentUser();

    const {
        boardState,
        openMembers: open,
        setOpenMembers: setOpen,
    } = useBoardState();

    useKeybind(kb.openMembers, () => {
        setOpen((prev) => !prev);
    });

    return (
        <Modal title="members" open={open} setOpen={setOpen}>
            <div className="flex flex-col justify-start items-start gap-3 overflow-auto max-h-150 w-[90%] sm:w-100">
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
                                withBorder={m.username === currentUser.username}
                                size="lg"
                                clickable={false}
                                createdAt={m.createdAt}
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
        </Modal>
    );
};

export default MembersModal;
