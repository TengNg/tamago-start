import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { axiosPrivate } from "../../../api/axios";
import useToast from "../../../hooks/useToast";
import useBoardState from "../../../hooks/useBoardState";

function Uploader({ card }) {
    const queryClient = useQueryClient();
    const [selectedFileName, setSelectedFileName] = useState("");
    const fileInputRef = useRef();
    const abortControllerRef = useRef(null);
    const toast = useToast();
    const { socket } = useBoardState();

    const fileUploadMutation = useMutation({
        mutationFn: async (formData) => {
            abortControllerRef.current = new AbortController();
            const abortSignal = abortControllerRef.current.signal;
            const response = await axiosPrivate.post(
                "/attachments/upload",
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                    signal: abortSignal,
                },
            );
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["card-attachments", card._id], (old) => {
                if (!old) {
                    return old;
                }

                const updated = [...old, data];
                return updated;
            });

            toast.success("Attachment uploaded");
            fileInputRef.current.value = "";
            setSelectedFileName("");
            socket.emit("addCardAttachment", { attachment: data });
        },
        onError: (err, _, _context) => {
            if (err.name === "CanceledError" || err.name === "AbortError") {
                return;
            }

            const errMsg =
                err.response?.data?.message || "Failed to upload attachment";
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

    if (!card) {
        return null;
    }

    return (
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
                    formData.append("docModel", "Card");
                    formData.append("doc", card._id);
                    fileUploadMutation.mutate(formData);
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
