import { useMutation, useMutationState, useQuery } from "@tanstack/react-query";
import { attachmentApi } from "../../../services/api";
import Icon from "../../shared/Icon";
import useToast from "../../../hooks/useToast";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import { cardKeys } from "../../../queries/cardKeys";

/**
 * @typedef {Object} AttachmentsProps
 * @property {Card} card
 * @property {React.Dispatch<React.SetStateAction<Attachment | null>>} setViewedAttachment
 */

/**
 * @param {AttachmentsProps} props
 */
function Attachments({ card, setViewedAttachment }) {
    const toast = useToast();

    const {
        data: attachments = [],
        isLoading: isAttachmentsLoading,
        isError: isAttachmentsError,
    } = useQuery({
        queryKey: cardKeys.attachments(card._id),
        queryFn: async () => {
            return await attachmentApi.fetchAttachments(card._id, "Card");
        },
    });

    const deleteAttachmentMutation = useMutation({
        mutationKey: ["delete-card-attachment"],
        mutationFn: async (/** @type {string} */ attachmentId) => {
            return await attachmentApi.deleteAttachment(attachmentId);
        },
        onError: (err) => {
            const errMsg = getErrorMessage(err, "Failed to delete attachment");
            toast.error(errMsg);
        },
    });

    const pendingDeleteIds = useMutationState({
        filters: {
            mutationKey: ["delete-card-attachment"],
            status: "pending",
        },
        select: (mutation) => mutation.state.variables,
    });

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
                <ul className="space-y-1 w-full">
                    {attachments.map((att) => {
                        const deleting = pendingDeleteIds.includes(att._id);
                        return (
                            <li
                                key={att._id}
                                className="flex items-center gap-2"
                            >
                                <div
                                    className={`${deleting ? "text-red-400 line-through" : ""} cursor-pointer hover:underline truncate max-w-full text-ellipsis overflow-hidden whitespace-nowrap`}
                                    onClick={() => setViewedAttachment(att)}
                                    title={att.originalname}
                                >
                                    {att.originalname}
                                </div>
                                <button
                                    title="delete"
                                    className="text-red-700 text-xs ms-1 disabled:opacity-50"
                                    onClick={() =>
                                        deleteAttachmentMutation.mutate(att._id)
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
