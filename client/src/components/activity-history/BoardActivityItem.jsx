import dateFormatter from "../../utils/dateFormatter";
import Avatar from "../avatar/Avatar";

const BoardActivityItem = ({ activity }) => {
    const { action, user, description, createdAt } = activity;

    return (
        <div className="flex flex-col gap-2 text-[12px] sm:text-sm shadow-[0_3px_0_0] border-2 border-yellow-600 shadow-yellow-600 bg-yellow-50 p-4">
            <div>
                <span className="font-medium text-yellow-800">{action}:</span>
            </div>
            <div>
                <span>information:</span>
                <span> </span>
                <span className="font-medium">{description || "<empty>"}</span>
            </div>
            <div>
                <span>by</span>
                <span> </span>
                <div className="inline-block">
                    <div className="w-fit inline-block">
                        <Avatar
                            size="xsm"
                            noShowRole={true}
                            username={user?.username}
                            createdAt={user?.createdAt}
                        />
                    </div>
                    <span> </span>
                    <span className="font-medium">{user?.username}</span>
                </div>
                <span> </span>
                on {dateFormatter(createdAt)}
            </div>
        </div>
    );
};

export default BoardActivityItem;
