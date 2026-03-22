import {
    useMutation,
    useMutationState,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { axiosPrivate } from "../../../api/axios";
import Icon from "../../shared/Icon";
import useToast from "../../../hooks/useToast";

function Attachments({ card, setViewedAttachment }) {
    const queryClient = useQueryClient();
    const toast = useToast();

    const {
        data: attachments = [],
        isLoading: isAttachmentsLoading,
        isError: isAttachmentsError,
    } = useQuery({
        queryKey: ["attachments", card._id],
        queryFn: async () => {
            const res = await axiosPrivate.get(`/attachments/${card._id}/card`);
            return res.data;
        },
    });

    const deleteAttachmentMutation = useMutation({
        mutationKey: ["delete-attachment"],
        mutationFn: async (attachmentId) => {
            return await axiosPrivate.delete(`/attachments/${attachmentId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["attachments", card._id]);
            toast.success("Attachment deleted");
        },
        onError: (err) => {
            const errMsg =
                err.response?.data?.message || "Failed to delete attachment";
            toast.error(errMsg);
        },
    });

    const pendingDeleteIds = useMutationState({
        filters: {
            mutationKey: ["delete-attachment"],
            status: "pending",
        },
        select: (mutation) => mutation.state.variables,
    });

    const isDeleting = (attachmentId) =>
        pendingDeleteIds.includes(attachmentId);

    if (!card) {
        return null;
    }

    return (
        <div>
            <div className="font-semibold mb-2 text-gray-600">Attachments</div>
            {isAttachmentsLoading ? (
                <div className="text-gray-400">Loading attachments...</div>
            ) : isAttachmentsError ? (
                <div className="text-red-600">Failed to load attachments</div>
            ) : attachments.length === 0 ? (
                <div className="text-gray-400">No attachments</div>
            ) : (
                <ul className="space-y-1">
                    {attachments.map((att) => {
                        const deleting = isDeleting(att.id);
                        return (
                            <li
                                key={att.id}
                                className="flex items-center gap-2"
                            >
                                <span
                                    className={`${deleting ? "text-red-400 line-through" : ""} cursor-pointer hover:underline`}
                                    onClick={() => setViewedAttachment(att)}
                                    title={att.originalname}
                                >
                                    {att.originalname}
                                </span>
                                <button
                                    title="delete"
                                    className="text-red-700 text-xs ms-1 disabled:opacity-50"
                                    onClick={() =>
                                        deleteAttachmentMutation.mutate(att.id)
                                    }
                                    disabled={deleting}
                                >
                                    <Icon name="xmark" className="w-3 h-3" />
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

export default Attachments;
