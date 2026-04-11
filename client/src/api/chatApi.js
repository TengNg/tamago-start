import { axiosPrivate } from "./axios";

export async function fetchChat({ boardId, limit = 20, before }) {
    const beforeParam = before ? `&before=${encodeURIComponent(before)}` : "";
    const url = `/chat/messages/b/${boardId}?limit=${limit}${beforeParam}`;
    const response = await axiosPrivate.get(url);
    return response.data;
}

export async function sendMessage({ boardId, content }) {
    const url = `/chat/messages/b/${boardId}`;
    const payload = JSON.stringify({ content });
    const response = await axiosPrivate.post(url, payload);
    return response.data;
}

export async function deleteMessage({ id }) {
    const url = `/chat/messages/${id}`;
    const response = await axiosPrivate.delete(url);
    return response.data;
}

export async function clearMessages({ boardId }) {
    const url = `/chat/messages/b/${boardId}`;
    const response = await axiosPrivate.delete(url);
    return response.data;
}
