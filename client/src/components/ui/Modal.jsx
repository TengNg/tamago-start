import { useContext, useEffect, useId, useRef } from "react";
import { MODAL_STACK_ESCAPE } from "../../constants/modalStackEvents.js";
import ModalStackContext from "../../context/ModalStackContext";
import Icon from "../shared/Icon";

/**
 * @typedef {Object} ModalProps
 * @property {React.ReactNode} children
 * @property {boolean} open
 * @property {(open: boolean) => void} setOpen
 * @property {string} [title]
 * @property {string} [bodyClassName]
 * @property {string} [className]
 * @property {boolean} [showCloseButton]
 * @property {boolean} [closeOnBackdrop]
 * @property {boolean} [closeOnEscape]
 */

/**
 * @param {ModalProps} props
 * @returns {JSX.Element | null}
 */
const Modal = ({ children, ...props }) => {
    const {
        open,
        setOpen,
        title,
        bodyClassName,
        className,
        showCloseButton = true,
        closeOnBackdrop = true,
        closeOnEscape = true,
    } = props;

    const { pushModal, popModal, isTopModal, getModalZIndex } =
        useContext(ModalStackContext);

    /** @type {string} */
    const id = useId();

    /** @type {React.MutableRefObject<HTMLDivElement | null>} */
    const contentRef = useRef(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        pushModal(id);

        return () => {
            popModal(id);
        };
    }, [open, id, pushModal, popModal]);

    useEffect(() => {
        if (!open || !closeOnEscape) {
            return;
        }

        /** @param {Event} e */
        const handleEscape = (e) => {
            const customEvent = /** @type {CustomEvent<{id: string}>} */ (e);
            if (customEvent.detail.id === id) {
                setOpen(false);
            }
        };

        window.addEventListener(MODAL_STACK_ESCAPE, handleEscape);
        return () => {
            window.removeEventListener(MODAL_STACK_ESCAPE, handleEscape);
        };
    }, [open, closeOnEscape, id, setOpen]);

    /** @param {React.MouseEvent<HTMLDivElement>} e */
    const handleBackdropClick = (e) => {
        if (closeOnBackdrop && e.target === e.currentTarget && isTopModal(id)) {
            setOpen(false);
        }
    };

    const handleClose = () => {
        setOpen(false);
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 bg-black/15 flex items-center justify-center overflow-hidden w-full"
            style={{ zIndex: getModalZIndex(id) }}
            onClick={handleBackdropClick}
        >
            <div
                ref={contentRef}
                className={`relative modal--content gap-3 items-start p-3 h-fit min-w-81.25 w-106.25 ${className ? className : ""}`}
            >
                {title && (
                    <div className="flex w-full justify-between items-center border-b border-black pb-2 gap-2">
                        <p className="font-normal text-[1rem] text-gray-700 min-w-0 wrap-break-word">
                            {title}
                        </p>
                        {showCloseButton && (
                            <button
                                className="text-gray-600 flex justify-center items-center"
                                onClick={handleClose}
                            >
                                <Icon className="w-4 h-4" name="xmark" />
                            </button>
                        )}
                    </div>
                )}

                <div
                    className={`w-full flex flex-col text-gray-600 text-[10px] sm:text-[0.75rem] pb-1.25 font-medium ${bodyClassName ? bodyClassName : ""}`}
                >
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
