import useCurrentUserContext from "../../hooks/useCurrentUserContext";
import Avatar from "../avatar/Avatar";
import Icon from "../shared/Icon";

const Member = ({ member, handleRemoveMemberFromBoard }) => {
    const { currentUser } = useCurrentUserContext();

    return (
        <>
            <div className="flex gap-1">
                <div className="flex gap-1 flex-1">
                    <Avatar
                        username={member.username}
                        size="md"
                        clickable={false}
                    />
                    <div className="flex flex-col justify-center">
                        <p className="text-[0.75rem] text-gray-800 font-medium">
                            {member.username}{" "}
                            {currentUser.username === member.username &&
                                "(you)"}
                        </p>
                        <p className="text-[0.75rem] text-gray-800">member</p>
                    </div>
                </div>
                {member.role !== "owner" && (
                    <button
                        onClick={() =>
                            handleRemoveMemberFromBoard(member.username)
                        }
                        className="text-gray-400 me-2"
                        title="remove member"
                    >
                        <Icon className="w-4 h-4" name="xmark" />
                    </button>
                )}
            </div>
        </>
    );
};

export default Member;
