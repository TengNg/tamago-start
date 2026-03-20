import { useEffect, useState } from "react";
import { axiosPrivate } from "../../../api/axios";
import Icon from "../../shared/Icon";

function ViewerDialog({ viewedAttachment, setViewedAttachment }) {
    const [imageDataUrl, setImageDataUrl] = useState(null);
    const [loadingImage, setLoadingImage] = useState(false);
    const [imageError, setImageError] = useState(null);

    useEffect(() => {
        if (
            viewedAttachment &&
            viewedAttachment.mimetype.startsWith("image/")
        ) {
            setLoadingImage(true);
            setImageError(null);
            setImageDataUrl(null);
            axiosPrivate
                .get(`/attachments/${viewedAttachment.id}`, {
                    responseType: "blob",
                })
                .then((res) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setImageDataUrl(reader.result);
                        setLoadingImage(false);
                    };
                    reader.onerror = () => {
                        setImageError("Failed to load image");
                        setLoadingImage(false);
                    };
                    reader.readAsDataURL(res.data);
                })
                .catch(() => {
                    setImageError("Failed to load image");
                    setLoadingImage(false);
                });
        } else {
            setImageDataUrl(null);
            setLoadingImage(false);
            setImageError(null);
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
                {viewedAttachment.mimetype.startsWith("image/") ? (
                    loadingImage ? (
                        <div className="p-8">Loading image...</div>
                    ) : imageError ? (
                        <div className="text-red-600 p-8">{imageError}</div>
                    ) : imageDataUrl ? (
                        <img
                            src={imageDataUrl}
                            alt={viewedAttachment.originalname}
                            className="max-w-[80vw] max-h-[70vh] border"
                        />
                    ) : null
                ) : (
                    <div className="flex flex-col items-center mt-4 text-gray-400">
                        <span className="mb-2">No preview available</span>
                        <a
                            href={`/api/attachments/${viewedAttachment.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-800 underline border px-2 py-1"
                            download={viewedAttachment.originalname}
                        >
                            Download
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ViewerDialog;
