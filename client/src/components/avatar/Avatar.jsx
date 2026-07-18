import { useState, useRef, useEffect } from "react";
import dateFormatter from "../../utils/dateFormatter";

const SIZE = {
    xsm: "w-[20px] h-[20px]",
    sm: "w-[30px] h-[30px]",
    md: "w-[40px] h-[40px]",
    lg: "w-[50px] h-[50px]",
    xl: "w-[60px] h-[60px]",
    xxl: "w-[70px] h-[70px]",
};

const AVATAR_BG_COLORS = {
    blue: "bg-teal-500",
    gray: "bg-gray-400",
};

/**
 * @typedef {Object} AvatarProps
 * @property {string} username
 * @property {string} [profileImage]
 * @property {"xsm" | "sm" | "md" | "lg" | "xl" | "xxl"} [size="sm"]
 * @property {"blue" | "gray"} [bgColor="blue"]
 * @property {boolean} [isAdmin=false]
 * @property {boolean} [clickable=true]
 * @property {boolean} [withBorder=false]
 * @property {boolean} [noShowRole=false]
 * @property {string | Date | number} createdAt
 */

/**
 * @param {AvatarProps} props
 * @returns {JSX.Element}
 */
const Avatar = ({
    username,
    profileImage,
    size = "sm",
    bgColor = "blue",
    isAdmin = false,
    clickable = true,
    withBorder = false,
    noShowRole = false,
    createdAt,
}) => {
    const [collapse, setCollapse] = useState(true);

    /** @type {React.MutableRefObject<HTMLDivElement | null>} */
    const userProfileImageRef = useRef(null);

    /** @type {React.MutableRefObject<HTMLDivElement | null>} */
    const userInfoRef = useRef(null);

    useEffect(() => {
        /**
         * @param {MouseEvent} event
         */
        const closeUserInfoBox = (event) => {
            const profile = userProfileImageRef.current;
            const info = userInfoRef.current;
            const target = /** @type {Node} */ (event.target);
            if (
                profile &&
                info &&
                !profile.contains(target) &&
                !info.contains(target)
            ) {
                setCollapse(true);
            }
        };

        if (!collapse) {
            document.addEventListener("click", closeUserInfoBox);
        } else {
            document.removeEventListener("click", closeUserInfoBox);
        }

        return () => {
            document.removeEventListener("click", closeUserInfoBox);
        };
    }, [collapse]);

    return (
        <div className="flex--center h-fit flex-col justify-start gap-2 relative">
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    clickable && setCollapse((collapse) => !collapse);
                }}
                ref={userProfileImageRef}
                className={`relative ${AVATAR_BG_COLORS[bgColor]} hover:opacity-[0.8] text-white flex--center text-[0.8rem] border-box ${withBorder && "border-4 border-teal-600"} rounded-full bg-center bg-cover overflow-hidden ${clickable && "cursor-pointer"} ${SIZE[size]}`}
            >
                {!profileImage ? (
                    <div className={`font-bold flex--center select-none`}>
                        {username?.charAt(0)?.toUpperCase()}
                    </div>
                ) : (
                    <img className="flex--center h-full w-full" />
                )}
            </div>

            {isAdmin && (
                <div className="rounded-full border-white bg-blue-700 border-2 w-3 h-3 absolute right-0 bottom-0"></div>
            )}

            {!collapse && (
                <div
                    ref={userInfoRef}
                    className="box--style absolute flex flex-col border-2 border-black p-3 pe-8 select-none gap-4 bg-gray-100 left-1 -bottom-1 translate-y-full z-30"
                    onBlur={() => setCollapse(true)}
                >
                    <div className="flex gap-2 items-center">
                        <div
                            className={`bg-sky-700 text-white flex--center w-11.25 h-11.25 rounded-full bg-center bg-cover overflow-hidden cursor-pointer`}
                        >
                            {!profileImage ? (
                                <div className="font-bold flex--center select-none">
                                    {username?.charAt(0)?.toUpperCase()}
                                </div>
                            ) : (
                                <img className="flex--center h-full w-full" />
                            )}
                        </div>

                        <div className="select-none text-gray-700 max-w-50 overflow-hidden whitespace-nowrap text-ellipsis">
                            <p className="text-[0.85rem] font-medium">
                                @{username}
                            </p>
                            {!noShowRole && (
                                <p className="text-[0.65rem]">
                                    {!isAdmin ? "member" : "owner"}
                                </p>
                            )}
                            <p className="text-[0.65rem]">
                                {dateFormatter(createdAt, {
                                    weekdayFormat: true,
                                })}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Avatar;
