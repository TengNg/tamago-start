import dateFormatter from "../../utils/dateFormatter";
import Avatar from "../avatar/Avatar";

import { useSearchParams } from "react-router-dom";

const CardActivityItem = ({ activity }) => {
    const { action, user, card, description, createdAt } = activity;
    const [searchParams, setSearchParams] = useSearchParams();

    return (
        <div className="flex flex-col gap-2 text-[12px] sm:text-sm shadow-[0_3px_0_0] border-2 border-teal-600 shadow-teal-600 bg-teal-50 p-3">
            <div>
                <span className="font-medium text-teal-700">{action}:</span>
                <span> </span>
                <span
                    className="font-medium underline cursor-pointer"
                    onClick={() => {
                        searchParams.set("card", card?._id);
                        setSearchParams(searchParams, { replace: true });
                    }}
                >
                    {card?.title}
                </span>
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

export default CardActivityItem;
