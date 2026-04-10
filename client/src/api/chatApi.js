import { axiosPrivate } from "./axios";

export async function fetchChat({ boardId, limit = 10, before }) {
    const beforeParam = before ? `&before=${encodeURIComponent(before)}` : '';
    const url = `/chat/b/${boardId}?limit=${limit}${beforeParam}`;
    const response = await axiosPrivate.get(url);
    return response.data;
}
