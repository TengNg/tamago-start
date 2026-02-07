import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

import Title from "../components/ui/Title";
import BoardStats from "../components/board/BoardStats";
import { axiosPrivate } from "../api/axios";

import dateFormatter from "../utils/dateFormatter";
import useCurrentUserContext from "../hooks/useCurrentUserContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getOwnedBoards } from "../api/boardApi";
import { updatePassword, updateUsername } from "../api/accountApi";
import useToast from "../hooks/useToast";

const Profile = () => {
    const queryClient = useQueryClient();

    const { currentUser, logout } = useCurrentUserContext();

    const [changePassword, setChangePassword] = useState(false);
    const [password, setPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmedPassword, setConfirmedPassword] = useState("");

    const toast = useToast();

    const [boardStatsModal, setBoardStatsModal] = useState({
        stats: [],
        board: {},
        open: false,
        loadingData: false,
    });

    const [msg, setMsg] = useState({
        error: false,
        content: "",
    });

    const navigate = useNavigate();

    const usernameInputRef = useRef(null);

    useEffect(() => {
        let id = null;
        if (msg.content != "") {
            id = setTimeout(() => {
                setMsg({ error: false, content: "" });
            }, 3000);
        }
        return () => clearTimeout(id);
    }, [msg]);

    const ownedBoardsQuery = useQuery({
        queryKey: ["boards", "owned"],
        queryFn: () => getOwnedBoards(),
    });

    const updateUsernameMutation = useMutation({
        mutationFn: (newUsername) => updateUsername({ username: newUsername }),
        onSuccess: (_data, _variables, _context) => {
            queryClient.invalidateQueries({ queryKey: ["me"], exact: true });
            usernameInputRef.current.value = "";
            toast.success("Username updated");
        },
        onError: (err) => {
            const { status } = err?.response;
            if (status === 409 || status === 400) {
                setMsg({
                    error: true,
                    content: err?.response?.data?.msg,
                });
            } else {
                setMsg({
                    error: true,
                    content: "Failed to update username",
                });
            }
        },
    });

    const updatePasswordMutation = useMutation({
        mutationFn: (currentPwd, newPwd) => {
            return updatePassword({
                currentPassword: currentPwd,
                newPassword: newPwd,
            });
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
        },
        onError: (err) => {
            console.log(err);
            const errMsg =
                err?.response?.status === 400
                    ? "Current password is incorrect"
                    : "Can't change password";
            setMsg({ error: true, content: errMsg });
        },
    });

    const closeChangePasswordOption = () => {
        setPassword("");
        setNewPassword("");
        setConfirmedPassword("");
        setChangePassword(false);
    };

    const checkPassword = () => {
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

        setMsg({
            error: true,
            content: "Failed to update password",
        });
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        const newUsername = usernameInputRef.current.value.trim();

        if (newUsername === "" || newUsername === currentUser.username) {
            return;
        }

        updateUsernameMutation.mutate(newUsername);
    };

    const handleCheckPassword = async (e) => {
        e.preventDefault();
        checkPassword();
        updatePasswordMutation.mutate(password, newPassword);
    };

    const handleLogout = async (e) => {
        e.preventDefault();
        try {
            await logout();
            navigate("/login");
        } catch (err) {
            toast.error("Failed to logout. Please try again.");
        }
    };

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

    const fetchBoardStats = async (boardId) => {
        try {
            const response = await axiosPrivate.get(`/boards/${boardId}/stats`);
            return response;
        } catch (err) {
            throw err;
        }
    };

    const handleOpenBoardStats = async (boardId) => {
        try {
            setBoardStatsModal({
                board: {},
                stats: [],
                open: true,
                loadingData: true,
            });

            const response = await fetchBoardStats(boardId);
            const { board, priorityLevelStats, staleCardCount } = response.data;

            const priorityOrder = ["none", "low", "medium", "high", "critical"];
            priorityLevelStats.sort((a, b) => {
                const indexA = priorityOrder.indexOf(a._id);
                const indexB = priorityOrder.indexOf(b._id);
                return indexA - indexB;
            });

            setBoardStatsModal((prev) => {
                return {
                    ...prev,
                    board,
                    stats: priorityLevelStats,
                    staleCardCount,
                    loadingData: false,
                };
            });
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <>
            <BoardStats
                boardStatsModal={boardStatsModal}
                setBoardStatsModal={setBoardStatsModal}
            />

            <section id="profile" className="w-full h-full overflow-auto pb-8">
                <Title titleName={"profile"} />

                <div className="mx-auto sm:w-3/4 w-[90%] flex flex-col items-center">
                    <span className="text-gray-600">information</span>

                    <div className="box--style border-[2px] border-gray-700 shadow-gray-700 sm:p-4 p-3 lg:w-[450px] sm:w-[400px] w-full bg-gray-100/20">
                        <div className="font-medium text-gray-700">
                            {currentUser.username}
                        </div>

                        <div className="text-[0.75rem] text-gray-600">
                            joined at {dateFormatter(currentUser.createdAt)}
                        </div>

                        <div className="h-[1px] my-3 bg-gray-800"></div>

                        <form
                            id="userInfoForm"
                            className="relative w-[100%] flex flex-col h-fit gap-2 text-gray-700"
                        >
                            <p
                                className={`absolute top-0 right-1 text-[0.75rem] font-medium ${msg.error ? "text-red-600" : "text-green-500"}`}
                            >
                                {msg.content}
                            </p>
                            <div className="flex flex-col">
                                <input
                                    ref={usernameInputRef}
                                    className="border-[1px] border-gray-500 px-2 py-1 font-medium bg-transparent"
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
                                className="text-white p-2 text-[0.75rem] bg-sky-800 font-medium hover:bg-sky-700 w-[100%]"
                                disabled={updateUsernameMutation.isPending}
                            >
                                {updateUsernameMutation.isPending
                                    ? "updating..."
                                    : "update username"}
                            </button>

                            {changePassword && (
                                <div className="flex flex-col div--style w-[100%] relative py-8 border-[2px] border-gray-700 px-4">
                                    <button
                                        className="absolute top-2 right-2 text-[11px] border-[1px] border-gray-700 px-2 py-1 hover:underline"
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
                                        className="border-[2px] border-black p-1 font-bold"
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
                                        className="border-[2px] border-black p-1 font-bold"
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
                                        className="border-[2px] border-black p-1 font-bold"
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
                            {currentUser.loginWithDiscord == false && (
                                <div className="flex flex-col gap-4">
                                    {!changePassword ? (
                                        <button
                                            onClick={() =>
                                                setChangePassword(true)
                                            }
                                            className="text-white p-2 text-[0.75rem] bg-sky-800 font-medium hover:bg-sky-700 w-[100%]"
                                        >
                                            change password
                                        </button>
                                    ) : (
                                        <button
                                            disabled={
                                                updatePasswordMutation.isPending
                                            }
                                            onClick={(e) =>
                                                handleCheckPassword(e)
                                            }
                                            className="text-white p-2 text-[0.75rem] bg-sky-800 font-medium hover:bg-sky-700 w-[100%]"
                                        >
                                            {updatePasswordMutation.isPending
                                                ? "updating..."
                                                : "update password"}
                                        </button>
                                    )}
                                </div>
                            )}

                            <div className="h-[1px] my-1 bg-gray-800"></div>

                            <button
                                onClick={handleLogout}
                                className="text-white p-2 text-[0.75rem] bg-gray-600 font-medium hover:bg-gray-500 w-[100%]"
                            >
                                log out
                            </button>

                            <button
                                onClick={handleLogoutOfAllDevices}
                                className="text-white p-2 text-[0.75rem] bg-rose-800 font-medium hover:bg-rose-700 w-[100%]"
                            >
                                log out of all devices
                            </button>
                        </form>
                    </div>
                </div>

                {/* Owned Boards section */}
                <div className="mx-auto sm:w-3/4 w-[90%] flex flex-col items-center mt-6">
                    <span className="text-gray-600">owned boards</span>

                    <div className="box--style relative border-[2px] border-gray-700 shadow-gray-700 sm:p-4 p-3 lg:w-[450px] sm:w-[400px] w-full !bg-gray-100/20">
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
                                        members,
                                        createdBy: _createdBy,
                                        createdAt,
                                    } = item;
                                    return (
                                        <div
                                            key={_id}
                                            onClick={() =>
                                                handleOpenBoardStats(_id)
                                            }
                                            className="w-full h-[125px] sm:h-[150px] bg-transparent"
                                        >
                                            <div className="w-full h-[125px] sm:h-[150px] board--style board--hover border-[2px] md:border-[2.5px] border-gray-600 text-gray-700 py-3 px-3 shadow-gray-600 select-none bg-transparent relative">
                                                <p className="text-[12px] sm:text-[1rem] font-medium sm:font-medium text-gray-600 overflow-hidden whitespace-nowrap text-ellipsis">
                                                    {title}
                                                </p>

                                                <div className="h-[1px] w-full bg-black my-2"></div>

                                                <p className="text-[11px] sm:text-[0.85rem] mt-3">
                                                    lists: {item.listCount}
                                                </p>

                                                <p className="text-[11px] sm:text-[0.85rem] mt-1">
                                                    members:{" "}
                                                    {members.length + 1}
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
