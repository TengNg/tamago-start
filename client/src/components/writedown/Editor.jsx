import { useState, useEffect, useRef } from "react";
import Loading from "../ui/Loading";

import dateFormatter from "../../utils/dateFormatter";
import useToast from "../../hooks/useToast";

const Editor = ({ writedown, setWritedown, saveWritedown, updateTitle }) => {
    const dialog = useRef();
    const setTitleDialog = useRef();
    const setTitleInput = useRef();
    const textarea = useRef();

    const { title, content, createdAt, updatedAt } = writedown?.data;
    const [writedownTitle, setWritedownTitle] = useState(title);

    const toast = useToast();

    useEffect(() => {
        if (writedown.open) {
            dialog.current.showModal();
            textarea.current.value = content || "";
            textarea.current.style.height = `${textarea.current.scrollHeight}px`;
            textarea.current.focus();

            setWritedownTitle(title);

            const handleOnClose = () => {
                setWritedown((prev) => {
                    return {
                        ...prev,
                        data: {},
                        open: false,
                        pinned: false,
                        processingMsg: "",
                    };
                });
            };

            dialog.current.addEventListener("close", handleOnClose);

            () => {
                dialog.current.removeEventListener("close", handleOnClose);
            };
        } else {
            dialog.current.close();
        }
    }, [writedown.open, writedown.data]);

    const handleCloseOnOutsideClick = (e) => {
        if (e.target === dialog.current) {
            handleClose();
            return;
        }

        textarea.current.focus();
    };

    const handleClose = () => {
        const { _id } = writedown.data;
        try {
            saveWritedown(_id, textarea.current.value);
        } catch (err) {
            const errMsg =
                err?.response?.data?.message || "Failed to save writedown";
            toast.error(errMsg);
        }
    };

    const handleUpdateTitle = (e) => {
        e.preventDefault();
        const elements = e.target.elements;
        const input = elements[0];
        const title = input.value.trim();
        updateTitle(writedown.data._id, title);
        setTitleDialog.current.close();
    };

    return (
        <>
            <dialog
                ref={setTitleDialog}
                className="z-40 backdrop:bg-black/15 box--style gap-4 items-start p-3 h-fit min-w-[350px] max-h-[500px] border-black border-[2px] bg-gray-200"
                style={{
                    backgroundColor: "rgba(235, 235, 235, 0.9)",
                }}
            >
                <form onSubmit={handleUpdateTitle}>
                    <input
                        autoFocus={true}
                        className="w-full border-[2px] border-gray-400 text-gray-600 text-[10px] sm:text-[0.85rem] font-semibold p-3"
                        type="text"
                        autoComplete="off"
                        placeholder="Set a title for this writedown..."
                        ref={setTitleInput}
                        value={writedownTitle}
                        onChange={(e) => {
                            setWritedownTitle(e.target.value);
                        }}
                    />

                    <div className="h-[1px] bg-black my-4"></div>

                    <div className="flex flex-col gap-2">
                        <button
                            className="bg-gray-600 w-100 text-white text-[10px] sm:text-[0.85rem] font-semibold p-2 w-full hover:bg-gray-500"
                            type="submit"
                        >
                            save
                        </button>
                        <button className="bg-gray-600 w-100 text-white text-[10px] sm:text-[0.85rem] font-semibold p-2 w-full hover:bg-gray-500">
                            close
                        </button>
                    </div>
                </form>
            </dialog>

            <dialog
                ref={dialog}
                className="z-40 backdrop:bg-black/15 min-w-[350px] overflow-y-hidden w-[90%] lg:w-[65%] h-[90vh] border-gray-500 border-[2.5px] border-dashed"
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
                    loading={writedown.loading}
                    displayText={writedown.processingMsg || "loading..."}
                    fontSize="1rem"
                />

                <div className="font-medium text-sm absolute top-2 left-2 max-w-[300px] max-h-[100px] overflow-hidden text-slate-500 whitespace-nowrap text-ellipsis">
                    <span>&#128205; title:</span>
                    <span> </span>
                    <span>{writedownTitle ? writedownTitle : "..."}</span>
                </div>

                <button
                    title="set title for this writedown"
                    className="absolute bg-teal-600 w-[12px] h-[12px] rounded-full right-[36px] top-3 z-20 opacity-[65%]"
                    onClick={() => {
                        setTitleDialog.current.showModal();
                    }}
                ></button>

                <button
                    title="save & close"
                    className="absolute bg-rose-600 w-[12px] h-[12px] rounded-full right-3 top-3 z-20 opacity-[65%]"
                    onClick={handleClose}
                ></button>

                <div className="w-full h-[97%] pt-10 pb-4 px-6">
                    <textarea
                        ref={textarea}
                        className="font-medium w-full max-h-full overflow-y-scroll bg-transparent focus:bg-transparent px-2 text-gray-600 leading-6 resize-none focus:outline-none"
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
                        {dateFormatter(createdAt, { weekdayFormat: true })} |
                        updated:{" "}
                        {dateFormatter(updatedAt, { weekdayFormat: true })}
                    </p>
                </div>
            </dialog>
        </>
    );
};

export default Editor;
