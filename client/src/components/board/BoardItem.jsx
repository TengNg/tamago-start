import dateFormatter from "../../utils/dateFormatter";
import { Link } from "react-router-dom";
import useCurrentUser from "../../hooks/useCurrentUser";
import Icon from "../shared/Icon";

/** @param {{ item: BoardListItem }} props */
const BoardItem = ({ item }) => {
    const currentUser = useCurrentUser();

    const { _id, title, description, createdBy, createdAt, memberCount } = item;

    return (
        <Link
            to={`/b/${_id}`}
            className="w-full sm:w-65 text-gray-600! shadow-[0px_6px_0_0] cursor-pointer hover:translate-y-1.5 hover:shadow-none hover:brightness-110 transition-all md:border-2 border-2 border-gray-600 py-3 px-3 md:px-5 shadow-gray-600 select-none relative bg-gray-100/30"
        >
            <p className="text-[12px] sm:text-[1rem] font-medium sm:font-semibold overflow-hidden whitespace-nowrap text-ellipsis">
                {title}
            </p>

            <p className="text-[10px] sm:text-[0.75rem] mt-1">
                {dateFormatter(createdAt)}
            </p>

            <div className="h-px w-full bg-gray-400 my-2"></div>

            <div className="max-w-100 overflow-hidden whitespace-nowrap text-ellipsis text-[10px] sm:text-[12px] font-normal mb-1">
                {description ? description : "(no description)"}
            </div>

            <div className="h-px w-full bg-gray-400 my-2"></div>

            <div className="flex flex-row items-center justify-between">
                <div className="flex flex-row items-center gap-0.5">
                    <Icon className="w-3.5 h-3.5" name="profile2" />
                    <div className="text-[10px] sm:text-[12px]">
                        {memberCount}
                    </div>
                </div>
                {currentUser._id === createdBy && (
                    <div className="text-[10px] sm:text-[12px] bg-gray-600 text-gray-50 px-1.5">
                        owner
                    </div>
                )}
            </div>
        </Link>
    );
};

export default BoardItem;
