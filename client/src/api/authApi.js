import { axiosPrivate } from "./axios";

export async function login({ username, password }) {
    await axiosPrivate.post(
        "/login",
        JSON.stringify({ username: username.trim(), password }),
    );
}

export async function register({ username, password, confirmedPassword }) {
    await axiosPrivate.post(
        "/register",
        JSON.stringify({
            username: username.trim(),
            password,
            confirmedPassword,
        }),
    );
}

export async function logout(opts = { allDevices: false }) {
    const endpoint = opts.allDevices ? "/logout/all-devices" : "/logout";
    await axiosPrivate.get(endpoint);
}
