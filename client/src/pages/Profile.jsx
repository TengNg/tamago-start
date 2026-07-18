import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

import Title from "../components/ui/Title";
import BoardStatsModal from "../components/board/BoardStatsModal";

import dateFormatter from "../utils/dateFormatter";
import useAuth from "../hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { boardApi, meApi } from "../services/api";
import useToast from "../hooks/useToast";
import useCurrentUser from "../hooks/useCurrentUser";
import { getErrorMessage } from "../utils/getErrorMessage";

const Profile = () => {
    const queryClient = useQueryClient();

    const { logout } = useAuth();
    const currentUser = useCurrentUser();

    const [changePassword, setChangePassword] = useState(false);
    const [password, setPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmedPassword, setConfirmedPassword] = useState("");

    const toast = useToast();

    const [boardStatsOpen, setBoardStatsOpen] = useState(false);
    const [boardStatsBoardId, setBoardStatsBoardId] = useState(
        /** @type {string | null} */ (null),
    );

    const [msg, setMsg] = useState({
        error: false,
        content: "",
    });

    const navigate = useNavigate();

    const usernameInputRef = useRef(
        /** @type {HTMLInputElement | null} */ (null),
    );

    useEffect(() => {
        /** @type {ReturnType<typeof setTimeout> | null} */
        let id = null;
        if (msg.content != "") {
            id = setTimeout(() => {
                setMsg({ error: false, content: "" });
            }, 3000);
        }
        return () => {
            if (id) clearTimeout(id);
        };
    }, [msg]);

    const ownedBoardsQuery = useQuery({
        queryKey: ["boards", "owned"],
        queryFn: () => boardApi.fetchBoards({ filter: "owned" }),
    });

    const updateUsernameMutation = useMutation({
        mutationFn: /** @param {string} newUsername */ (newUsername) =>
            meApi.updateUsername({ username: newUsername }),
        onSuccess: (_data, _variables, _context) => {
            queryClient.invalidateQueries({ queryKey: ["me"], exact: true });
            /** @type {HTMLInputElement} */ (usernameInputRef.current).value =
                "";
            toast.success("Username updated");
        },
        onError: (err) => {
            const errMsg = getErrorMessage(err, "Failed to update username");
            setMsg({
                error: true,
                content: errMsg,
            });
        },
    });

    const updatePasswordMutation = useMutation({
        mutationFn:
            /** @param {{ currentPassword: string, newPassword: string }} params */ ({
                currentPassword,
                newPassword,
            }) => {
                return meApi.updatePassword({ currentPassword, newPassword });
            },
        onSuccess: (data, _variables, _context) => {
            if (data?.notice === "PLEASE_PROVIDE_NEW_PASSWORD") {
                setMsg({ error: true, content: "Please provide new password" });
                return;
            }

            if (data?.notice === "PASSWORD_NOT_CHANGED") {
                setMsg({
                    error: true,
                    content: "New password is the same as current password",
                });
                return;
            }

            queryClient.invalidateQueries({ queryKey: ["me"], exact: true });

            setPassword("");
            setNewPassword("");
            setConfirmedPassword("");
            toast.success("Password updated successfully");
        },
        onError: (err) => {
            const errMsg = getErrorMessage(err, "Can't change password");
            setMsg({ error: true, content: errMsg });
        },
    });

    const closeChangePasswordOption = () => {
        setPassword("");
        setNewPassword("");
        setConfirmedPassword("");
        setChangePassword(false);
    };

    /**
     * @param {React.MouseEvent<HTMLButtonElement>} e
     */
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        const newUsername = /** @type {HTMLInputElement} */ (
            usernameInputRef.current
        ).value.trim();

        if (newUsername === "" || newUsername === currentUser.username) {
            return;
        }

        updateUsernameMutation.mutate(newUsername);
    };

    /**
     * @param {React.MouseEvent<HTMLButtonElement>} e
     */
    const handleUpdatePassword = (e) => {
        e.preventDefault();

        if (confirmedPassword === "" || newPassword === "" || password === "") {
            setMsg({ error: true, content: "Please fill all required fields" });
            return;
        }

        if (!newPassword) {
            setMsg({ error: true, content: "Please provide new password" });
            return;
        }

        if (newPassword === password) {
            setMsg({
                error: true,
                content: "New password is the same as current password",
            });
            return;
        }

        if (confirmedPassword !== newPassword) {
            setMsg({
                error: true,
                content: "Confirmed password is not matched",
            });
            return;
        }

        setMsg({ error: false, content: "" });
        updatePasswordMutation.mutate({
            currentPassword: password,
            newPassword,
        });
    };

    /**
     * @param {React.MouseEvent<HTMLButtonElement>} e
     */
    const handleLogout = async (e) => {
        e.preventDefault();
        try {
            await logout();
            navigate("/login");
        } catch (err) {
            toast.error("Failed to logout. Please try again.");
        }
    };

    /**
     * @param {React.MouseEvent<HTMLButtonElement>} e
     */
    const handleLogoutOfAllDevices = async (e) => {
        e.preventDefault();

        if (!confirm("This will log you out of all devices. Are you sure ?"))
            return;

        try {
            await logout({ allDevices: true });
            navigate("/login");
        } catch (err) {
            toast.error("Failed to logout. Please try again.");
        }
    };

    return (
        <>
            <BoardStatsModal
                boardId={/** @type {string} */ (boardStatsBoardId)}
                open={boardStatsOpen}
                setOpen={setBoardStatsOpen}
            />

            <section id="profile" className="w-full h-full overflow-auto pb-8">
                <Title titleName={"profile"} />

                <div className="mx-auto sm:w-3/4 w-[90%] flex flex-col items-center">
                    <span className="text-gray-600">information</span>

                    <div className="box--style border-2 border-gray-700 shadow-gray-700 sm:p-4 p-3 lg:w-112.5 sm:w-100 w-full bg-gray-100/20">
                        <div className="font-medium text-gray-700">
                            {currentUser.username}
                        </div>

                        <div className="text-[0.75rem] text-gray-600">
                            joined at {dateFormatter(currentUser.createdAt)}
                        </div>

                        <div className="h-px my-3 bg-gray-800"></div>

                        <form
                            id="userInfoForm"
                            className="relative w-full flex flex-col h-fit gap-2 text-gray-700"
                        >
                            <p
                                className={`absolute top-0 right-1 text-[0.75rem] font-medium ${msg.error ? "text-red-600" : "text-green-500"}`}
                            >
                                {msg.content}
                            </p>
                            <div className="flex flex-col">
                                <input
                                    ref={usernameInputRef}
                                    className="border border-gray-500 px-2 py-1 font-medium bg-transparent"
                                    type="text"
                                    id="username"
                                    autoComplete="off"
                                    placeholder={currentUser.username}
                                />
                            </div>

                            <button
                                type="submit"
                                form="userInfoForm"
                                onClick={handleSaveProfile}
                                className="text-white p-2 text-[0.75rem] bg-sky-800 font-medium hover:bg-sky-700 w-full"
                                disabled={updateUsernameMutation.isPending}
                            >
                                {updateUsernameMutation.isPending
                                    ? "updating..."
                                    : "update username"}
                            </button>

                            {changePassword && (
                                <div className="flex flex-col div--style w-full relative py-8 border-2 border-gray-700 px-4">
                                    <button
                                        className="absolute top-2 right-2 text-[11px] border border-gray-700 px-2 py-1 hover:underline"
                                        onClick={closeChangePasswordOption}
                                    >
                                        close
                                    </button>

                                    <label
                                        htmlFor="password"
                                        className="label--style"
                                    >
                                        current password
                                    </label>
                                    <input
                                        className="border-2 border-black p-1 font-bold"
                                        type="password"
                                        id="password"
                                        autoComplete="off"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        required
                                    />

                                    <label
                                        htmlFor="newPassword"
                                        className="label--style"
                                    >
                                        new password
                                    </label>
                                    <input
                                        className="border-2 border-black p-1 font-bold"
                                        type="password"
                                        id="newPassword"
                                        autoComplete="off"
                                        value={newPassword}
                                        onChange={(e) =>
                                            setNewPassword(e.target.value)
                                        }
                                        required
                                    />

                                    <label
                                        htmlFor="confirmedPassword"
                                        className="label--style"
                                    >
                                        confirm new password
                                    </label>
                                    <input
                                        className="border-2 border-black p-1 font-bold"
                                        type="password"
                                        id="confirmedPassword"
                                        autoComplete="off"
                                        value={confirmedPassword}
                                        onChange={(e) =>
                                            setConfirmedPassword(e.target.value)
                                        }
                                        required
                                    />
                                </div>
                            )}
                            {!currentUser.loginWithDiscord && (
                                <div className="flex flex-col gap-4">
                                    {!changePassword ? (
                                        <button
                                            onClick={() =>
                                                setChangePassword(true)
                                            }
                                            className="text-white p-2 text-[0.75rem] bg-sky-800 font-medium hover:bg-sky-700 w-full"
                                        >
                                            change password
                                        </button>
                                    ) : (
                                        <button
                                            disabled={
                                                updatePasswordMutation.isPending
                                            }
                                            onClick={(e) =>
                                                handleUpdatePassword(e)
                                            }
                                            className="text-white p-2 text-[0.75rem] bg-sky-800 font-medium hover:bg-sky-700 w-full"
                                        >
                                            {updatePasswordMutation.isPending
                                                ? "updating..."
                                                : "update password"}
                                        </button>
                                    )}
                                </div>
                            )}

                            <div className="h-px my-1 bg-gray-800"></div>

                            <button
                                onClick={handleLogout}
                                className="text-white p-2 text-[0.75rem] bg-gray-600 font-medium hover:bg-gray-500 w-full"
                            >
                                log out
                            </button>

                            <button
                                onClick={handleLogoutOfAllDevices}
                                className="text-white p-2 text-[0.75rem] bg-rose-800 font-medium hover:bg-rose-700 w-full"
                            >
                                log out of all devices
                            </button>
                        </form>
                    </div>
                </div>

                {/* Owned Boards section */}
                <div className="mx-auto sm:w-3/4 w-[90%] flex flex-col items-center mt-6">
                    <span className="text-gray-600">owned boards</span>

                    <div className="box--style relative border-2 border-gray-700 shadow-gray-700 sm:p-4 p-3 lg:w-[450px] sm:w-[400px] w-full bg-gray-100/20!">
                        <div className="flex flex-col items-center mt-3 gap-4 pb-4 px-4 lg:px-2 max-h-[450px] overflow-auto">
                            {ownedBoardsQuery.isPending ||
                            ownedBoardsQuery.isError ? (
                                <div className="loader mx-auto"></div>
                            ) : ownedBoardsQuery.data.boards.length === 0 ? (
                                <p className="text-[0.75rem] text-gray-600 mt-2">
                                    you currently have no owned boards.
                                </p>
                            ) : (
                                ownedBoardsQuery.data.boards.map((item) => {
                                    const {
                                        _id,
                                        title,
                                        description: _description,
                                        memberCount,
                                        createdBy: _createdBy,
                                        createdAt,
                                    } = item;
                                    return (
                                        <div
                                            key={_id}
                                            onClick={() => {
                                                setBoardStatsBoardId(_id);
                                                setBoardStatsOpen(true);
                                            }}
                                            className="w-full h-[125px] sm:h-[150px] bg-transparent"
                                        >
                                            <div className="w-full h-[125px] sm:h-[150px] board--style board--hover border-2 md:border-[2.5px] border-gray-600 text-gray-700 py-3 px-3 shadow-gray-600 select-none bg-transparent relative">
                                                <p className="text-[12px] sm:text-[1rem] font-medium sm:font-medium text-gray-600 overflow-hidden whitespace-nowrap text-ellipsis">
                                                    {title}
                                                </p>

                                                <div className="h-px w-full bg-black my-2"></div>

                                                <p className="text-[11px] sm:text-[0.85rem] mt-3">
                                                    lists:{" "}
                                                    {
                                                        /** @type {BoardListItem & { listCount: number }} */ (
                                                            item
                                                        ).listCount
                                                    }
                                                </p>

                                                <p className="text-[11px] sm:text-[0.85rem] mt-1">
                                                    members: {memberCount}
                                                </p>

                                                <p className="text-[11px] sm:text-[0.85rem] mt-1">
                                                    created:{" "}
                                                    {dateFormatter(createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default Profile;
