import dateFormatter from "../../utils/dateFormatter";
import { Link } from "react-router-dom";
import { pluralizeString } from "../../utils/pluralize";
import useCurrentUserContext from "../../hooks/useCurrentUserContext";

const BoardItem = ({ item }) => {
    const { currentUser } = useCurrentUserContext();

    const { _id, title, description, members, createdBy, createdAt } = item;

    return (
        <Link
            to={`/b/${_id}`}
            className="w-[200px] sm:w-[250px] h-[120px] sm:h-[135px] text-gray-600"
        >
            <div className="w-[210px] sm:w-[250px] h-[120px] sm:h-[135px] board--style board--hover md:border-[2px] border-[2px] border-gray-600 py-3 px-3 md:px-5 shadow-gray-600 select-none relative bg-gray-100/30">
                {currentUser._id === createdBy && (
                    <div className="absolute top-0 right-0 w-[10px] h-[10px] bg-gray-600 z-20"></div>
                )}

                <p className="text-[12px] sm:text-[1rem] font-medium sm:font-semibold overflow-hidden whitespace-nowrap text-ellipsis">
                    {title}
                </p>

                <p className="text-[10px] sm:text-[0.75rem] mt-1">
                    {dateFormatter(createdAt)}
                </p>

                <div className="h-[1px] w-full bg-gray-400 my-2"></div>

                <p
                    className={`overflow-hidden whitespace-nowrap text-ellipsis text-[10px] sm:text-[11px] font-normal mb-1`}
                >
                    {description ? description : "(no description)"}
                </p>

                <div className="text-[9px] sm:text-[10px] font-normal">
                    {pluralizeString(members.length + 1, "member")}
                </div>
            </div>
        </Link>
    );
};

export default BoardItem;
