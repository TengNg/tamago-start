import dateFormatter from "../../utils/dateFormatter";
import Avatar from "../avatar/Avatar";

const ListActivityItem = ({ activity }) => {
    const { action, user, list, description, createdAt } = activity;

    return (
        <div className="flex flex-col gap-2 text-[12px] sm:text-sm shadow-[0_3px_0_0] border-2 border-blue-700 shadow-blue-700 bg-blue-50 p-4">
            <div>
                <span className="font-medium text-blue-800">{action}:</span>
                <span> </span>
                <span className="font-medium">{list?.title}</span>
                <span> </span>
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

export default ListActivityItem;
