import { useState, useRef } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Title from "../components/ui/Title";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login } from "../api/authApi";

export default function Login() {
    const queryClient = useQueryClient();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errMsg, setErrMsg] = useState("");

    const [searchParams, _] = useSearchParams();

    const usernameInputEl = useRef();
    const passwordInputEl = useRef();

    const navigate = useNavigate();

    const location = useLocation();
    const from = location.state?.from?.pathname || "/boards";

    const loginMutation = useMutation({
        mutationFn: () => login({ username, password }),
        onSuccess: (_data, _variables, _context) => {
            queryClient.resetQueries({ queryKey: ["me"], exact: true });
            navigate(from, { replace: true });
        },
        onMutate: () => {
            usernameInputEl.current.readOnly = true;
            passwordInputEl.current.readOnly = true;
        },
        onError: (err) => {
            const errMsg =
                err?.response?.data?.message || "Something went wrong";
            usernameInputEl.current.readOnly = false;
            passwordInputEl.current.readOnly = false;
            setErrMsg(errMsg);
        },
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        loginMutation.mutate();
    };

    return (
        <>
            <section className="relative w-full h-screen bg-transparent flex items-center flex-col gap-2">
                <Title titleName={"login"} />

                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col form--style p-6 pt-2 w-[325px]"
                    style={{ backgroundColor: "rgba(241, 241, 241, 0.75)" }}
                >
                    <label className="text-gray-700" htmlFor="username">
                        Username
                    </label>
                    <input
                        className="border-2 border-gray-700 text-gray-700 p-1 font-medium"
                        type="text"
                        id="username"
                        autoComplete="off"
                        ref={usernameInputEl}
                        onChange={(e) => setUsername(e.target.value)}
                        value={username}
                        required
                    />

                    <label className="text-gray-700" htmlFor="password">
                        Password
                    </label>
                    <input
                        ref={passwordInputEl}
                        className="border-2 border-gray-700 text-gray-700 p-1 font-medium select-none"
                        type="password"
                        id="password"
                        onChange={(e) => setPassword(e.target.value)}
                        value={password}
                        autoComplete="on"
                        required
                    />

                    {errMsg && (
                        <p className="text-[0.75rem] text-red-800 ms-1 mt-1 font-medium select-none">
                            {errMsg}
                        </p>
                    )}
                    {searchParams.get("authorize_failed") && (
                        <div className="flex flex-col">
                            <p className="text-[0.65rem] text-red-700 ms-0.5 mt-1 font-medium select-none">
                                Failed to Log in
                            </p>
                            {searchParams.get("message") && (
                                <p className="text-[0.65rem] text-red-700 ms-0.5 mt-1 font-medium select-none">
                                    {searchParams.get("message")}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex flex-col gap-3 mt-4">
                        <button
                            className="button--style--dark flex--center"
                            disabled={loginMutation.isPending}
                        >
                            {loginMutation.isPending
                                ? "Logging in..."
                                : "Log in"}
                        </button>
                        <a
                            className="button--style border-none text-gray-50 bg-indigo-700 hover:bg-indigo-500 flex--center"
                            href={`${import.meta.env.VITE_SERVER_URL || "http://localhost:3001"}/auth/discord`}
                        >
                            Log in with Discord
                        </a>
                    </div>
                </form>

                <div className="flex flex-col font-normal select-none mt-4 text-gray-700">
                    Don&apos;t have an account?
                    <Link className="text-gray-700" to="/register">
                        <button className="button--style mt-1">Sign up</button>
                    </Link>
                </div>
            </section>
        </>
    );
}
