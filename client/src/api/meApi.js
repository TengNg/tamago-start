import { axiosPrivate } from "./axios";

export async function fetchCurrentUser() {
    const response = await axiosPrivate.get(`/me`);
    if (response.status !== 200) {
        throw new Error("Failed to fetch current user data");
    }

    return response.data.user;
}
