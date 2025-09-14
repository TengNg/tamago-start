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

    const userProfileImageRef = useRef();
    const userInfoRef = useRef();

    useEffect(() => {
        const closeUserInfoBox = (event) => {
            if (
                userInfoRef.current &&
                !userProfileImageRef.current.contains(event.target) &&
                !userInfoRef.current.contains(event.target)
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
                className={`relative ${AVATAR_BG_COLORS[bgColor]} hover:opacity-[0.8] text-white flex--center text-[0.8rem] border-box ${withBorder && "border-[4px] border-teal-600"} rounded-full bg-center bg-cover overflow-hidden ${clickable && "cursor-pointer"} ${SIZE[size]}`}
            >
                {!profileImage ? (
                    <div
                        className={`font-bold flex--center select-none`}
                    >
                        {username?.charAt(0)?.toUpperCase()}
                    </div>
                ) : (
                    <img className="flex--center h-[100%] w-[100%]" />
                )}
            </div>

            {isAdmin && (
                <div className="rounded-full border-white bg-blue-700 border-[2px] w-[12px] h-[12px] absolute right-0 bottom-0"></div>
            )}

            {collapse === false && (
                <div
                    ref={userInfoRef}
                    className="box--style--sm absolute flex flex-col border-[2px] border-black p-3 pe-8 select-none gap-4 bg-gray-100 left-1 -bottom-1 translate-y-[100%] z-30"
                    onBlur={() => setCollapse(true)}
                >
                    <div className="flex gap-2 items-center">
                        <div
                            className={`bg-blue-500 text-white flex--center w-[45px] h-[45px] rounded-full bg-center bg-cover overflow-hidden cursor-pointer`}
                        >
                            {!profileImage ? (
                                <div className="font-bold flex--center select-none">
                                    {username?.charAt(0)?.toUpperCase()}
                                </div>
                            ) : (
                                <img className="flex--center h-[100%] w-[100%]" />
                            )}
                        </div>

                        <div className="select-none text-gray-700 max-w-[200px] overflow-hidden whitespace-nowrap text-ellipsis">
                            <p className="text-[0.85rem] font-medium">
                                @{username}
                            </p>
                            {noShowRole === false && (
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
