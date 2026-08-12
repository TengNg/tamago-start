import dateFormatter from "../../utils/dateFormatter";
import { Link } from "react-router-dom";
import useCurrentUser from "../../hooks/useCurrentUser";

/** @param {{ item: BoardListItem }} props */
const BoardItem = ({ item }) => {
    const currentUser = useCurrentUser();

    const { _id, title, description, createdBy, createdAt } = item;

    return (
        <Link
            to={`/b/${_id}`}
            className="w-50 sm:w-62.5 text-gray-600! shadow-[0px_6px_0_0] cursor-pointer board--hover md:border-2 border-2 border-gray-600 py-3 px-3 md:px-5 shadow-gray-600 select-none relative bg-gray-100/30"
        >
            {currentUser._id === createdBy && (
                <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-gray-600 z-20"></div>
            )}

            <p className="text-[12px] sm:text-[1rem] font-medium sm:font-semibold overflow-hidden whitespace-nowrap text-ellipsis">
                {title}
            </p>

            <p className="text-[10px] sm:text-[0.75rem] mt-1">
                {dateFormatter(createdAt)}
            </p>

            <div className="h-px w-full bg-gray-400 my-2"></div>

            <p
                className={`overflow-hidden whitespace-nowrap text-ellipsis text-[10px] sm:text-[11px] font-normal mb-1`}
            >
                {description ? description : "(no description)"}
            </p>
        </Link>
    );
};

export default BoardItem;
