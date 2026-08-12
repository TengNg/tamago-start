import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import Loading from "../ui/Loading";
import dateFormatter from "../../utils/dateFormatter";
import useWritedownMutations from "../../hooks/useWritedownMutations";
import { writedownApi } from "../../services/api";
import { writedownKeys } from "../../queries/writedownKeys";

/**
 * @param {{ writedownId: string | null, open: boolean, onClose: () => void }} props
 */
const Editor = ({ writedownId, open, onClose }) => {
    const dialog = useRef(/** @type {HTMLDialogElement | null} */ (null));
    const setTitleDialog = useRef(
        /** @type {HTMLDialogElement | null} */ (null),
    );
    const setTitleInput = useRef(/** @type {HTMLInputElement | null} */ (null));
    const textarea = useRef(/** @type {HTMLTextAreaElement | null} */ (null));

    const { saveWritedown, updateWritedownTitle, isSaving } =
        useWritedownMutations();

    const { data, isLoading } = useQuery({
        queryKey: writedownKeys.detail(writedownId ?? ""),
        queryFn: () => writedownApi.fetchWritedown(writedownId ?? ""),
        enabled: !!writedownId && open,
    });

    const writedown = data?.writedown;
    const [writedownTitle, setWritedownTitle] = useState(
        writedown?.title ?? "",
    );

    useEffect(() => {
        if (writedown?.title !== undefined) {
            setWritedownTitle(writedown.title);
        }
    }, [writedown?.title]);

    useEffect(() => {
        const dialogEl = dialog.current;
        if (!dialogEl) return;

        if (open && !isLoading && writedown) {
            dialogEl.showModal();
            if (textarea.current) {
                textarea.current.value = writedown.content || "";
                textarea.current.style.height = `${textarea.current.scrollHeight}px`;
                textarea.current.focus();
            }

            const handleOnClose = () => {
                onClose();
            };

            dialogEl.addEventListener("close", handleOnClose);

            return () => {
                dialogEl.removeEventListener("close", handleOnClose);
            };
        } else if (open && isLoading) {
            dialogEl.showModal();
        } else {
            dialogEl.close();
        }
    }, [open, isLoading, writedown, onClose]);

    /**
     * @param {React.MouseEvent<HTMLDialogElement>} e
     */
    const handleCloseOnOutsideClick = (e) => {
        if (e.target === dialog.current) {
            handleClose();
            return;
        }

        textarea.current?.focus();
    };

    const handleClose = async () => {
        if (!writedownId) return;
        try {
            await saveWritedown(writedownId, textarea.current?.value ?? "");
        } finally {
            onClose();
        }
    };

    /**
     * @param {React.FormEvent<HTMLFormElement>} e
     */
    const handleUpdateTitle = (e) => {
        e.preventDefault();
        /** @type {HTMLFormElement} */
        const form = /** @type {HTMLFormElement} */ (e.target);
        const elements = form.elements;
        /** @type {HTMLInputElement} */
        const input = /** @type {HTMLInputElement} */ (elements[0]);
        const title = input.value.trim();
        if (writedownId) {
            updateWritedownTitle(writedownId, title);
        }
        setTitleDialog.current?.close();
    };

    return (
        <>
            <dialog
                ref={setTitleDialog}
                className="z-40 backdrop:bg-black/15 box--style gap-4 items-start p-3 h-fit min-w-87.5 max-h-125 border-black border-2 bg-gray-200"
                style={{
                    backgroundColor: "rgba(235, 235, 235, 0.9)",
                }}
            >
                <form onSubmit={handleUpdateTitle}>
                    <input
                        autoFocus={true}
                        className="w-full border-2 border-gray-400 text-gray-600 text-[10px] sm:text-[0.85rem] font-semibold p-3"
                        type="text"
                        autoComplete="off"
                        placeholder="Set a title for this writedown..."
                        ref={setTitleInput}
                        value={writedownTitle}
                        onChange={(e) => {
                            setWritedownTitle(e.target.value);
                        }}
                    />

                    <div className="h-px bg-black my-4"></div>

                    <div className="flex flex-col gap-2">
                        <button
                            className="bg-gray-600 w-100 text-white text-[10px] sm:text-[0.85rem] font-semibold p-2 hover:bg-gray-500"
                            type="submit"
                        >
                            save
                        </button>
                        <button className="bg-gray-600 w-100 text-white text-[10px] sm:text-[0.85rem] font-semibold p-2 hover:bg-gray-500">
                            close
                        </button>
                    </div>
                </form>
            </dialog>

            <dialog
                ref={dialog}
                className="z-40 backdrop:bg-black/15 min-w-87.5 overflow-y-hidden w-[90%] lg:w-[65%] h-[90vh] border-gray-500 border-[2.5px] border-dashed"
                style={{
                    backgroundColor: "rgba(235, 235, 235, 0.9)",
                }}
                onClick={(e) => {
                    handleCloseOnOutsideClick(e);
                }}
                onKeyDown={(e) => {
                    if (e.key === "Escape") {
                        e.preventDefault();
                        handleClose();
                    }
                    if (e.key === "Tab") {
                        e.preventDefault();
                    }
                }}
                onCancel={(e) => {
                    e.preventDefault();
                }}
            >
                <Loading
                    position={"absolute"}
                    loading={isLoading || isSaving}
                    displayText={isSaving ? "saving..." : "loading..."}
                    fontSize="1rem"
                />

                <div className="font-medium text-sm absolute top-2 left-2 max-w-75 max-h-25 overflow-hidden text-slate-500 whitespace-nowrap text-ellipsis">
                    <span>&#128205; title:</span>
                    <span> </span>
                    <span>{writedownTitle ? writedownTitle : "..."}</span>
                </div>

                <button
                    title="set title for this writedown"
                    className="absolute bg-teal-600 w-3 h-3 rounded-full right-9 top-3 z-20 opacity-65"
                    onClick={() => {
                        setTitleDialog.current?.showModal();
                    }}
                ></button>

                <button
                    title="save & close"
                    className="absolute bg-rose-600 w-3 h-3 rounded-full right-3 top-3 z-20 opacity-65"
                    onClick={handleClose}
                ></button>

                <div className="w-full h-[97%] pt-10 pb-4 px-6">
                    <textarea
                        ref={textarea}
                        className="font-medium w-full max-h-full overflow-y-scroll bg-transparent focus:bg-transparent px-2 text-gray-600 leading-6 resize-none focus:outline-hidden"
                        placeholder="writedown something..."
                        onChange={(e) => {
                            e.target.style.height = "auto";
                            e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                    />
                </div>

                <div className="flex flex-wrap gap-3 w-full justify-end pe-2 pb-2">
                    <p className="text-gray-600 text-[9px] sm:text-[0.85rem]">
                        created:{" "}
                        {dateFormatter(writedown?.createdAt, {
                            weekdayFormat: true,
                        })}{" "}
                        | updated:{" "}
                        {dateFormatter(writedown?.updatedAt, {
                            weekdayFormat: true,
                        })}
                    </p>
                </div>
            </dialog>
        </>
    );
};

export default Editor;
