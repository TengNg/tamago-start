import { axiosPrivate } from "./axios";

export async function fetchChat({ boardId, limit = 10, before }) {
    const beforeParam = before ? `&before=${encodeURIComponent(before)}` : '';
    const url = `/chat/b/${boardId}/messages?limit=${limit}${beforeParam}`;
    const response = await axiosPrivate.get(url);
    return response.data;
}

export async function sendMessage({ boardId, content }) {
    const url = `/chat/b/${boardId}/messages`;
    console.log("api sendMessage boardId", boardId);
    console.log("api sendMessage content", content);
    const payload = JSON.stringify({ content });
    const response = await axiosPrivate.post(url, payload);
    return response.data;
}

export async function deleteMessage({ boardId, id }) {
    const url = `/chat/b/${boardId}/messages/${id}`;
    const response = await axiosPrivate.delete(url);
    return response.data;
}

export async function clearMessages({ boardId }) {
    const url = `/chat/b/${boardId}/messages`;
    const response = await axiosPrivate.delete(url);
    return response.data;
}
