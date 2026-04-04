import { axiosPrivate } from "./axios";

export async function fetchCurrentUser() {
    const response = await axiosPrivate.get(`/me`);
    if (response.status !== 200) {
        throw new Error("Failed to fetch current user data");
    }

    return response.data.user;
}

export async function updateUsername({ username }) {
    const response = await axiosPrivate.patch(
        `/me/username`,
        JSON.stringify({ newUsername: username }),
    );

    return response.data;
}

export async function updatePassword({ currentPassword, newPassword }) {
    const response = await axiosPrivate.patch(
        `/me/password`,
        JSON.stringify({ currentPassword, newPassword }),
    );

    return response.data;
}
