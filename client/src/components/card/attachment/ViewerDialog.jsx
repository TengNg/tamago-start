import { useQuery } from "@tanstack/react-query";
import { viewAttachment } from "../../../api/attachmentApi";
import { attachmentKeys } from "../../../queries/attachmentKeys";

/**
 * @typedef {Object} ViewerDialogProps
 * @property {Attachment} viewedAttachment
 */

/**
 * @param {ViewerDialogProps} viewwedAttachment
 */
function ViewerDialog({ viewedAttachment }) {
    const {
        data: attachmentDataUrl,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: attachmentKeys.detail(viewedAttachment._id),
        queryFn: async () => {
            const blob = await viewAttachment(viewedAttachment._id);
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = () =>
                    reject(new Error("Failed to load image"));
                reader.readAsDataURL(blob);
            });
        },
        staleTime: 5 * 60 * 1000,
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center">
                <div className="p-8">
                    <div className="loader"></div>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center">
                <div className="text-red-600 p-8">
                    {error?.message || "Failed to load image"}
                </div>
            </div>
        );
    }

    if (!attachmentDataUrl) {
        return null;
    }

    return (
        <div className="flex flex-col items-center">
            {viewedAttachment.mimetype.startsWith("image/") ? (
                <img
                    src={attachmentDataUrl}
                    alt={viewedAttachment.originalname}
                    className="max-w-[80vw] max-h-[80vh] object-contain border"
                />
            ) : (
                <div className="flex flex-col items-center mt-4">
                    <span className="mb-2">No preview available.</span>
                    <a
                        href={`/api/attachments/${viewedAttachment._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-800! underline! border px-2 py-1"
                        download={viewedAttachment.originalname}
                    >
                        Download
                    </a>
                </div>
            )}
        </div>
    );
}

export default ViewerDialog;
