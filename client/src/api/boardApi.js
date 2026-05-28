import { axiosPrivate } from "./axios";

export async function fetchBoards(opts = { filter: "" }) {
    const response = await axiosPrivate.get(`/boards?filter=${opts.filter}`);
    return response.data;
}

export async function fetchBoard(boardId) {
    const response = await axiosPrivate.get(`/boards/${boardId}`);
    return response.data;
}

export async function fetchBoardActivities({ boardId, page }) {
    const response = await axiosPrivate.get(
        `/boards/${boardId}/activities?page=${page}`,
    );
    return response.data;
}

export async function cleanBoardActivities(boardId) {
    const response = await axiosPrivate.delete(`/boards/${boardId}/activities`);
    return response.data;
}
