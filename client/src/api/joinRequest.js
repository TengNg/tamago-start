import { axiosPrivate } from "./axios";

export async function fetchJoinRequests({ page }) {
    const res = await axiosPrivate.get(`/join_board_requests?page=${page}`);
    return res.data;
}

export async function acceptJoinRequest({ id, boardId, requesterId }) {
    return await axiosPrivate.patch(
        `/join_board_requests/${id}/accept`,
        JSON.stringify({ boardId, requesterId }),
    );
}

export async function rejectJoinRequest({ id, boardId, requesterId }) {
    return await axiosPrivate.patch(
        `/join_board_requests/${id}/reject`,
        JSON.stringify({ boardId, requesterId }),
    );
}

export async function removeJoinRequest({ id, boardId, requesterId }) {
    return await axiosPrivate.delete(
        `/join_board_requests/${id}`,
        JSON.stringify({ boardId, requesterId }),
    );
}
