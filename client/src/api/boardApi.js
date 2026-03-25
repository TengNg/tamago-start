import { axiosPrivate } from "./axios";

export async function getBoards(opts = { filter: "" }) {
    const response = await axiosPrivate.get(`/boards?filter=${opts.filter}`);
    return response.data;
}
