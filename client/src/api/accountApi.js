import { axiosPrivate } from "./axios";

export async function updateUsername({ username }) {
    const response = await axiosPrivate.patch(
        `/account/new-username`,
        JSON.stringify({ newUsername: username }),
    );

    return response.data;
}

export async function updatePassword({ currentPassword, newPassword }) {
    const response = await axiosPrivate.patch(
        `/account/new-password`,
        JSON.stringify({ currentPassword, newPassword }),
    );

    return response.data;
}
