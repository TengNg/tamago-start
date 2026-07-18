import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { attachmentApi } from "../../../services/api";
import useToast from "../../../hooks/useToast";
import useBoardState from "../../../hooks/useBoardState";
import { SOCKET_EVENTS } from "@shared/socket-events.js";
import { cardKeys } from "../../../queries/cardKeys";
import { getErrorMessage } from "../../../utils/getErrorMessage";

/**
 * @typedef {Object} UploaderProps
 * @property {Card} card
 */

/**
 * @param {UploaderProps} props
 */
function Uploader({ card }) {
    const queryClient = useQueryClient();
    const [selectedFileName, setSelectedFileName] = useState("");
    const toast = useToast();
    const { socket } = useBoardState();

    /** @type {React.MutableRefObject<HTMLInputElement | null>} */
    const fileInputRef = useRef(null);

    /** @type {React.MutableRefObject<AbortController | null>} */
    const abortControllerRef = useRef(null);

    const fileUploadMutation = useMutation({
        mutationFn: async (/** @type {FormData} */ formData) => {
            abortControllerRef.current = new AbortController();
            return await attachmentApi.uploadAttachment(formData, {
                signal: abortControllerRef.current.signal,
            });
        },
        onSuccess: (data) => {
            queryClient.setQueryData(
                cardKeys.attachments(card._id),
                /**
                 * @param {Attachment[]} old
                 */
                (old) => {
                    if (!old) {
                        return old;
                    }

                    const updated = [...old, data];
                    return updated;
                },
            );

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

            toast.success("Attachment uploaded");
            setSelectedFileName("");
            socket.emit(SOCKET_EVENTS.ATTACHMENT_CREATE, { attachment: data });
        },
        onError: (err, _, _context) => {
            if (err.name === "CanceledError" || err.name === "AbortError") {
                return;
            }

            const errMsg = getErrorMessage(err, "Failed to upload attachment");
            toast.error(errMsg);
            cleanupAfterUpload();
        },
    });

    const isUploadingFile = fileUploadMutation.isPending || !selectedFileName;

    const cleanupAfterUpload = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        setSelectedFileName("");
        abortControllerRef.current = null;
    };

    const handleRemoveFile = () => {
        if (fileUploadMutation.isPending && abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        cleanupAfterUpload();
    };

    /** @param {React.ChangeEvent<HTMLInputElement>} e */
    const handleInputFile = (e) => {
        const file = e.target.files?.[0];
        setSelectedFileName(file ? file.name : "");
    };

    /** @param {React.FormEvent<HTMLFormElement>} e */
    const handleSubmit = (e) => {
        e.preventDefault();

        const input = fileInputRef.current;
        if (!input) {
            return;
        }

        const file = input.files?.[0];
        if (!file) {
            toast.error("No file selected");
            return;
        }

        const formData = new FormData();
        formData.append("attachment", file);
        formData.append("docModel", "Card");
        formData.append("doc", card._id);

        fileUploadMutation.mutate(formData);
    };

    if (!card) {
        return null;
    }

    return (
        <div className="flex flex-col gap-2">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <label
                    htmlFor="attachment-upload"
                    className="m-0! cursor-pointer text-sm text-gray-600 font-medium underline"
                >
                    Browse
                    <input
                        id="attachment-upload"
                        type="file"
                        name="attachment"
                        accept="*"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleInputFile}
                    />
                </label>
                {selectedFileName ? (
                    <span
                        className="text-gray-600 truncate"
                        title={selectedFileName}
                    >
                        :: {selectedFileName}
                    </span>
                ) : (
                    <span className="text-gray-400 truncate">
                        (maximum 5MB)
                    </span>
                )}

                {selectedFileName && (
                    <div className="flex gap-2">
                        <span>::</span>
                        <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="text-red-800 underline text-sm font-medium"
                        >
                            remove
                        </button>
                        <button
                            type="submit"
                            disabled={isUploadingFile}
                            className={`${isUploadingFile ? "select-none text-gray-400" : "underline text-gray-600"} text-sm font-medium`}
                        >
                            {fileUploadMutation.isPending
                                ? "uploading..."
                                : "upload"}
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}

export default Uploader;
