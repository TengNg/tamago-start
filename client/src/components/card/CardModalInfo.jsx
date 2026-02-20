import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useBoardState from "../../hooks/useBoardState";
import { axiosPrivate } from "../../api/axios";
import dateFormatter from "../../utils/dateFormatter";
import PRIORITY_LEVELS from "../../data/priorityLevels";

import { formatDateToYYYYMMDD } from "../../utils/dateFormatter";

import { dateToCompare } from "../../utils/dateFormatter";
import Icon from "../shared/Icon";
import useToast from "../../hooks/useToast";

const CardModalInfo = ({
    card,
    handleCardOwnerChange,
    handleCardPriorityLevelChange,
    handleChangeDueDate,
}) => {
    const { boardState } = useBoardState();

    const toast = useToast();

    const queryClient = useQueryClient();

    const fileInputRef = useRef();

    const [viewedAttachment, setViewedAttachment] = useState(null);
    const [imageDataUrl, setImageDataUrl] = useState(null);
    const [loadingImage, setLoadingImage] = useState(false);
    const [imageError, setImageError] = useState(null);
    const [deletingAttachmentId, setDeletingAttachmentId] = useState(null);
    const [selectedFileName, setSelectedFileName] = useState("");

    const fileUploadMutation = useMutation({
        mutationFn: async (formData) => {
            return await axiosPrivate.post("/attachments/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["attachments", card._id]);
            toast.success("Attachment uploaded");
            fileInputRef.current.value = "";
        },
        onError: (err, _, _context) => {
            const errMsg =
                err.response?.data?.message || "Failed to upload attachment";
            toast.error(errMsg);
            fileInputRef.current.value = "";
        },
    });

    const deleteAttachmentMutation = useMutation({
        mutationFn: async (attachmentId) => {
            setDeletingAttachmentId(attachmentId);
            return await axiosPrivate.delete(`/attachments/${attachmentId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["attachments", card._id]);
            toast.success("Attachment deleted");
            setDeletingAttachmentId(null);
        },
        onError: () => {
            const errMsg =
                err.response?.data?.message || "Failed to delete attachment";
            toast.error(errMsg);
            setDeletingAttachmentId(null);
        },
    });

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
        enabled: !!card?._id,
    });

    const priorityLevel = card?.priorityLevel || "";
    const dueDate = card?.dueDate ? formatDateToYYYYMMDD(card.dueDate) : "";

    const memberNames = useMemo(() => {
        const ownerName = boardState.board.createdBy.username;
        const memberNames = boardState.board.members.map((m) => m.username);
        return [ownerName, ...memberNames];
    }, [boardState?.board]);

    // When viewedAttachment changes and is an image, fetch as blob and convert to data URL
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

    function handleCopyCardCode(e) {
        const button = e.currentTarget;
        if (button.textContent === "✓ copied") {
            return;
        }

        navigator.clipboard.writeText(card?._id).then(() => {
            button.textContent = "✓ copied";
        });

        toast.success("Code copied to clipboard");
    }

    return (
        <div className="relative flex flex-col gap-5 text-sm text-gray-700 p-4 border-[1px] border-gray-700">
            <button
                className="absolute top-2 right-2 border-[1px] border-slate-600 border-dashed py-1 px-2 text-slate-500 text-[9px] sm:text-[12px] hover:underline"
                onClick={handleCopyCardCode}
                title="copy card code"
            >
                code
            </button>

            <div className="flex flex-start items-center w-fit">
                <span className="me-2">priority:</span>
                {priorityLevel != "none" && (
                    <div
                        className="h-2.5 w-2.5"
                        style={{
                            background:
                                PRIORITY_LEVELS[`${priorityLevel}`]?.color ||
                                "gray",
                            filter: "brightness(0.8)",
                        }}
                    ></div>
                )}
                <select
                    value={priorityLevel}
                    onChange={(e) =>
                        handleCardPriorityLevelChange(e.target.value)
                    }
                    className="font-medium max-w-[10rem] px-1 cursor-pointer appearance-none bg-transparent"
                    style={{
                        color:
                            PRIORITY_LEVELS[`${priorityLevel}`]?.color ||
                            "gray",
                        filter: "brightness(0.8)",
                    }}
                >
                    {Object.values(PRIORITY_LEVELS).map((el, _) => {
                        return (
                            <option value={el.value} key={el.value}>
                                {el.title === "NONE" ? "..." : el.title}
                            </option>
                        );
                    })}
                </select>
            </div>

            <div className="flex flex-start items-center w-fit max-w-[30rem]">
                <span className="me-2">owner:</span>
                {card.owner && (
                    <Icon
                        name="profile2"
                        className="text-gray-700 me-0.5"
                        width={18}
                        height={18}
                    />
                )}
                <select
                    value={card.owner || ""}
                    onChange={(e) => handleCardOwnerChange(e.target.value)}
                    className="max-w-[10rem] cursor-pointer appearance-none bg-transparent text-gray-800 font-medium"
                >
                    <option value={""}>...</option>
                    {memberNames.map((memberName) => {
                        return (
                            <option value={memberName} key={memberName}>
                                {memberName}
                            </option>
                        );
                    })}
                </select>
            </div>

            <div className={`${dateToCompare(dueDate) && "text-red-700"}`}>
                <span>due: </span>
                <input
                    className="bg-transparent"
                    type="date"
                    id="due-date"
                    value={dueDate}
                    onChange={(e) => {
                        handleChangeDueDate(e.target.value);
                    }}
                />
            </div>

            <div>
                <span>created: </span>
                {dateFormatter(card.createdAt)}
            </div>

            <div>
                <span>updated: </span>
                {card.updatedAt ? dateFormatter(card.updatedAt) : "not found"}
            </div>

            <div className="h-px w-full bg-gray-700"></div>

            {/* Attachment List */}
            <div>
                <div className="font-semibold mb-2">Attachments</div>
                {isAttachmentsLoading ? (
                    <div className="text-gray-400">Loading attachments...</div>
                ) : isAttachmentsError ? (
                    <div className="text-red-600">
                        Failed to load attachments
                    </div>
                ) : attachments.length === 0 ? (
                    <div className="text-gray-400">No attachments</div>
                ) : (
                    <ul className="space-y-1">
                        {attachments.map((att) => (
                            <li
                                key={att.id}
                                className="flex items-center gap-2"
                            >
                                <span
                                    className={`${deletingAttachmentId === att.id && deleteAttachmentMutation.isPending ? "text-red-400 line-through" : ""} cursor-pointer hover:underline`}
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
                                    disabled={
                                        deleteAttachmentMutation.isPending
                                    }
                                >
                                    <Icon name="xmark" className="w-3 h-3" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                {deleteAttachmentMutation.isError && (
                    <div className="text-red-600 text-xs mt-2">
                        Failed to delete attachment
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (!fileInputRef.current.files[0]) {
                            toast.error("No file selected");
                            return;
                        }
                        const formData = new FormData();
                        formData.append(
                            "attachment",
                            fileInputRef.current.files[0],
                        );
                        formData.append("type", "card");
                        formData.append("refId", card._id);
                        fileUploadMutation.mutate(formData);
                        setSelectedFileName("");
                    }}
                    className="flex items-center gap-2"
                >
                    <label
                        htmlFor="attachment-upload"
                        className="m-0 cursor-pointer text-sm text-gray-600 font-medium underline"
                    >
                        Browse
                        <input
                            id="attachment-upload"
                            type="file"
                            name="attachment"
                            accept="*"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                setSelectedFileName(file ? file.name : "");
                            }}
                        />
                    </label>
                    {selectedFileName ? (
                        <span
                            className="text-gray-600 truncate max-w-[12rem]"
                            title={selectedFileName}
                        >
                            {selectedFileName}
                        </span>
                    ) : (
                        <span className="text-gray-400 text-sm truncate max-w-[12rem]">
                            (maximum 5MB)
                        </span>
                    )}

                    {selectedFileName && (
                        <div className="flex ms-2 gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedFileName("");
                                    fileInputRef.current.value = "";
                                }}
                                className="text-red-800 underline text-sm font-medium transition-colors"
                            >
                                remove
                            </button>
                            <button
                                type="submit"
                                disabled={
                                    fileUploadMutation.isPending ||
                                    !selectedFileName
                                }
                                className="text-sm font-medium underline text-gray-600"
                            >
                                {fileUploadMutation.isPending
                                    ? "uploading..."
                                    : "upload"}
                            </button>
                        </div>
                    )}
                </form>
            </div>

            {/* Attachment Viewer Dialog */}
            {viewedAttachment && (
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
                                className="font-semibold text-gray-700 truncate max-w-[60vw]"
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
                                <div className="text-red-600 p-8">
                                    {imageError}
                                </div>
                            ) : imageDataUrl ? (
                                <img
                                    src={imageDataUrl}
                                    alt={viewedAttachment.originalname}
                                    className="max-w-[80vw] max-h-[70vh] border"
                                />
                            ) : null
                        ) : (
                            <div className="flex flex-col items-center mt-4">
                                <span className="mb-2">
                                    No preview available.
                                </span>
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
            )}
        </div>
    );
};

export default CardModalInfo;
