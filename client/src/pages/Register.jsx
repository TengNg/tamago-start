import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Title from "../components/ui/Title";
import { register } from "../api/authApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useToast from "../hooks/useToast";
import { getErrorMessage } from "../utils/getErrorMessage";

// const USER_REGEX = /^[A-z][A-z0-9-_]{3,23}$/;
// const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/;

const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,20}$/;
const PWD_REGEX = /^.{8,24}$/;

export default function Register() {
    const queryClient = useQueryClient();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmedPassword, setConfirmedPassword] = useState("");

    /** @type {React.MutableRefObject<HTMLInputElement | null>} */
    const passwordInputEl = useRef(null);

    /** @type {React.MutableRefObject<HTMLInputElement | null>} */
    const usernameInputEl = useRef(null);

    /** @type {React.MutableRefObject<HTMLInputElement | null>} */
    const confirmedPasswordInputEl = useRef(null);

    const [errMsg, setErrMsg] = useState("");
    const [success, setSuccess] = useState(false);

    const navigate = useNavigate();

    const toast = useToast();

    const registerMutation = useMutation({
        mutationFn: () => register({ username, password, confirmedPassword }),
        onSuccess: (_data, _variables, _context) => {
            queryClient.resetQueries({ queryKey: ["me"], exact: true });
            navigate("/login");
            toast.success("account successfully registered", 5000);
        },
        onMutate: () => {
            const username = usernameInputEl.current;
            const password = passwordInputEl.current;
            const confirmedPassword = confirmedPasswordInputEl.current;

            if (!username || !password || !confirmedPassword) {
                return;
            }

            username.readOnly = true;
            password.readOnly = true;
            confirmedPassword.readOnly = true;
        },
        onError: (err) => {
            const username = usernameInputEl.current;
            const password = passwordInputEl.current;
            const confirmedPassword = confirmedPasswordInputEl.current;

            if (username) {
                username.readOnly = false;
            }

            if (password) {
                password.readOnly = false;
            }

            if (confirmedPassword) {
                confirmedPassword.readOnly = false;
            }

            const errMsg = getErrorMessage(err, "Something went wrong");
            setErrMsg(errMsg);
        },
    });

    /**
     * @param {React.FormEvent<HTMLFormElement>} e
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        const passwordMatched = PWD_REGEX.test(password);
        const usernameMatched = USERNAME_REGEX.test(username);

        if (!usernameMatched) {
            setErrMsg(
                "Username must be between 3 and 20 characters (no spaces)",
            );
            if (usernameInputEl.current) {
                usernameInputEl.current.focus();
            }
            return;
        }

        if (!passwordMatched) {
            setErrMsg("Password must be at least 8 characters");
            if (passwordInputEl.current) {
                passwordInputEl.current.focus();
            }
            return;
        }

        if (confirmedPassword !== password) {
            setErrMsg("Confirmed password do not match");
            setSuccess(false);
            if (confirmedPasswordInputEl.current) {
                confirmedPasswordInputEl.current.focus();
            }
            return;
        }

        registerMutation.mutate();
    };

    return (
        <>
            <section className="relative w-full h-screen bg-transparent flex flex-col items-center gap-2">
                <Title titleName={"register"} />

                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col form--style p-6 pt-2 bg-gray-200 w-81.25"
                    style={{ backgroundColor: "rgba(241, 241, 241, 0.75)" }}
                >
                    <label className="text-gray-700" htmlFor="username">
                        Username
                    </label>
                    <input
                        className="border-2 border-gray-700 text-gray-700 p-1 font-medium select-none"
                        type="text"
                        id="username"
                        autoComplete="off"
                        ref={usernameInputEl}
                        onChange={(e) => setUsername(e.target.value)}
                        value={username}
                        maxLength={25}
                        required
                    />

                    <label className="text-gray-700" htmlFor="password">
                        Password
                    </label>
                    <input
                        className="border-2 border-gray-700 text-gray-700 p-1 font-medium select-none"
                        type="password"
                        id="password"
                        autoComplete="off"
                        ref={passwordInputEl}
                        onChange={(e) => setPassword(e.target.value)}
                        value={password}
                        required
                    />

                    <label
                        className="text-gray-700"
                        htmlFor="confirmed-password"
                    >
                        Confirm Password
                    </label>
                    <input
                        className="border-2 border-gray-700 text-gray-700 p-1 font-medium select-none"
                        type="password"
                        id="confirmed-password"
                        autoComplete="off"
                        ref={confirmedPasswordInputEl}
                        onChange={(e) => setConfirmedPassword(e.target.value)}
                        value={confirmedPassword}
                        required
                    />

                    {!success && (
                        <p className="text-[0.65rem] text-red-700 ms-1 mt-1 font-medium select-none">
                            {errMsg}
                        </p>
                    )}

                    <div className="flex flex-col gap-3 mt-4">
                        <button
                            className="button--style--dark flex--center"
                            disabled={registerMutation.isPending}
                        >
                            {registerMutation.isPending
                                ? "Signing up..."
                                : "Sign up"}
                        </button>
                        <a
                            className="button--style border-0 text-gray-50! bg-indigo-700 hover:bg-indigo-500 flex--center"
                            href={`${import.meta.env.VITE_SERVER_URL || "http://localhost:3001"}/auth/discord`}
                        >
                            Log in with Discord
                        </a>
                    </div>
                </form>

                <div className="flex flex-col p-4 select-none text-gray-700">
                    <p> Already have an account? </p>
                    <Link
                        className="text-gray-700 hover:text-gray-700"
                        to="/login"
                    >
                        <button className="button--style mt-1">Log in</button>
                    </Link>
                </div>
            </section>
        </>
    );
}
