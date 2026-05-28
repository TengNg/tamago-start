import { axiosPrivate } from "./axios";

export async function fetchInvitations({ page }) {
    const res = await axiosPrivate.get(`/invitations?page=${page}`);
    return res.data;
}

export async function acceptInvitation(invitationId) {
    return await axiosPrivate.patch(
        `/invitations/${invitationId}/accept`,
        JSON.stringify({ id: invitationId }),
    );
}

export async function rejectInvitation(invitationId) {
    return await axiosPrivate.patch(
        `/invitations/${invitationId}/reject`,
        JSON.stringify({ id: invitationId }),
    );
}

export async function removeInvitation(invitationId) {
    return await axiosPrivate.delete(
        `/invitations/${invitationId}`,
        JSON.stringify({ id: invitationId }),
    );
}
