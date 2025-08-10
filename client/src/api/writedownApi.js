import { axiosPrivate } from "./axios";

export async function getWritedowns(opts = { filter: "" }) {
    const response = await axiosPrivate.get(`/personal_writedowns?filter=${opts.filter}`);
    return response.data;
}
