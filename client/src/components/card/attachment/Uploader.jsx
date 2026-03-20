import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { axiosPrivate } from "../../../api/axios";
import useToast from "../../../hooks/useToast";

function Uploader({ card }) {
    const queryClient = useQueryClient();

    const [selectedFileName, setSelectedFileName] = useState("");

    const fileInputRef = useRef();

    const toast = useToast();

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
            setSelectedFileName("");
        },
        onError: (err, _, _context) => {
            const errMsg =
                err.response?.data?.message || "Failed to upload attachment";
            toast.error(errMsg);
            fileInputRef.current.value = "";
        },
    });

    const isUploadingFile = fileUploadMutation.isPending || !selectedFileName;

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
                    formData.append("type", "card");
                    formData.append("refId", card._id);
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
