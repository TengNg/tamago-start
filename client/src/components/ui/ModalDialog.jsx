import { useEffect, useRef } from "react";
import Icon from "../shared/Icon";

const ModalDialog = ({ children, ...props }) => {
    const dialog = useRef();

    const { open, setOpen, title, bodyClassName } = props;

    useEffect(() => {
        if (open) {
            dialog.current.showModal();

            const handleKeyDown = (e) => {
                if (e.ctrlKey && e.key === "/") {
                    e.preventDefault();
                }
            };

            const handleOnClose = () => {
                setOpen(false);
            };

            dialog.current.addEventListener("close", handleOnClose);
            dialog.current.addEventListener("keydown", handleKeyDown);

            () => {
                dialog.current.removeEventListener("close", handleOnClose);
                dialog.current.removeEventListener("keydown", handleKeyDown);
            };
        } else {
            dialog.current.close();
        }
    }, [open]);

    const handleCloseOnOutsideClick = (e) => {
        if (e.target === dialog.current) {
            dialog.current.close();
        }
    };

    const handleClose = () => {
        dialog.current.close();
    };

    return (
        <dialog
            ref={dialog}
            className="z-40 backdrop:bg-black/15 box--style gap-4 items-start p-3 h-fit min-w-[350px] w-[425px] border-black border-[2px] bg-gray-200"
            onClick={handleCloseOnOutsideClick}
        >
            <div className="flex w-full justify-between items-center border-b-[1px] border-black pb-3">
                <p className="font-normal text-[1rem] text-gray-700">{title}</p>
                <button
                    className="text-gray-600 flex justify-center items-center"
                    onClick={handleClose}
                >
                    <Icon className="w-4 h-4" name="xmark" />
                </button>
            </div>

            <div
                className={`flex flex-col py-3 px-4 text-gray-600 text-[10px] sm:text-[0.75rem] font-medium ${bodyClassName}`}
            >
                {children}
            </div>
        </dialog>
    );
};

export default ModalDialog;
