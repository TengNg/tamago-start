import { useEffect } from "react";
import dateFormatter from "../../utils/dateFormatter";

const Toast = ({
    toast,
    setToast,
    isChatOpen,
    setOpenChatBox,
    setOpenFloatingChat,
}) => {
    //useEffect(() => {
    //    let id = null;
    //
    //    if (toast.open) {
    //        id = setTimeout(() => {
    //            setToast({ message: '...', open: false });
    //        }, toast.duration || 8000);
    //    }
    //
    //    return () => {
    //        if (id) clearTimeout(id);
    //    }
    //}, [toast.open]);

    useEffect(() => {
        if (isChatOpen) {
            setToast({ ...toast, open: false });
        }
    }, [isChatOpen]);

    return (
        <div
            className={`${toast.open && !isChatOpen ? "flex" : "hidden"} fixed flex-col border-[3px] border-rose-400 right-3 top-3 bg-gray-800 text-gray-50 w-[300px] overflow-auto z-30 opacity-80`}
        >
            <div className="flex w-full justify-between items-center border-b-[1px] border-gray-600 p-3">
                <div
                    className="text-sm cursor-pointer"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!isChatOpen) {
                            setOpenChatBox(true);
                        }
                        setToast({ ...toast, open: false });
                    }}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isChatOpen) {
                            setOpenFloatingChat(true);
                        }
                        setToast({ ...toast, open: false });
                    }}
                >
                    📮 message
                    {toast.from && (
                        <>
                            <span> </span>
                            <span>from</span>
                            <span> </span>
                            <span className="font-medium">
                                {toast.from.username}
                            </span>
                        </>
                    )}
                </div>
                <button
                    className="flex justify-center items-center text-sm"
                    onClick={() => setToast({ ...toast, open: false })}
                >
                    ❌
                </button>
            </div>
            <div className="text-sm text-wrap break-words flex flex-col gap-1 px-3 pt-2">
                <div
                    className="font-medium max-h-[120px] overflow-auto"
                    onClick={() => {
                        setToast({ ...toast, open: false });
                    }}
                >
                    -&gt; {toast.message}
                </div>

                {toast.timeSent && (
                    <div className="ms-auto text-[0.65rem]">
                        {dateFormatter(toast.timeSent)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Toast;
