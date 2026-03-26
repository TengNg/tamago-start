import { useEffect, useState } from "react";
import { axiosPrivate } from "../../../api/axios";
import Icon from "../../shared/Icon";

function ViewerDialog({ viewedAttachment, setViewedAttachment }) {
    const [attachmentDataUrl, setAttachmentDataUrl] = useState(null);
    const [loadingAttachment, setLoadingAttachment] = useState(false);
    const [attachmentError, setAttachmentError] = useState(null);

    useEffect(() => {
        if (viewedAttachment) {
            setLoadingAttachment(true);
            setAttachmentError(null);
            setAttachmentDataUrl(null);
            axiosPrivate
                .get(`/attachments/${viewedAttachment._id}`, {
                    responseType: "blob",
                })
                .then((res) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setAttachmentDataUrl(reader.result);
                        setLoadingAttachment(false);
                    };
                    reader.onerror = () => {
                        setAttachmentError("Failed to load image");
                        setLoadingAttachment(false);
                    };
                    reader.readAsDataURL(res.data);
                })
                .catch(() => {
                    setAttachmentError("Failed to load image");
                    setLoadingAttachment(false);
                });
        } else {
            setAttachmentDataUrl(null);
            setLoadingAttachment(false);
            setAttachmentError(null);
        }
    }, [viewedAttachment]);

    if (!viewedAttachment) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
            onClick={() => setViewedAttachment(null)}
        >
            <div
                className="bg-gray-200 p-4 max-w-[90vw] max-h-[90vh] flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex w-full justify-between items-center mb-2">
                    <span
                        className="font-semibold text-gray-600 truncate max-w-[60vw]"
                        title={viewedAttachment.originalname}
                    >
                        {viewedAttachment.originalname}
                    </span>
                    <button
                        className="ml-4 p-1 text-gray-600"
                        onClick={() => setViewedAttachment(null)}
                    >
                        <Icon name="xmark" className="w-5 h-5" />
                    </button>
                </div>
                {
                    loadingAttachment ? (
                        <div className="p-8">Loading image...</div>
                    ) : attachmentError ? (
                        <div className="text-red-600 p-8">{attachmentError}</div>
                    ) : attachmentDataUrl ? (
                        <img
                            src={attachmentDataUrl}
                            alt={viewedAttachment.originalname}
                            className="max-w-[80vw] max-h-[70vh] border"
                        />
                    ) : null
                }
            </div>
        </div>
    );
}

export default ViewerDialog;
