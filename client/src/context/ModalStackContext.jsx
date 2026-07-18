import { createContext, useCallback, useEffect, useState } from "react";
import { MODAL_STACK_ESCAPE } from "../constants/modalStackEvents.js";

const ModalStackContext = createContext(
    /** @type {ModalStackContextValue} */ ({}),
);

/** @param {{ children: React.ReactNode }} props */
export const ModalStackProvider = ({ children }) => {
    const [stack, setStack] = useState(/** @type {string[]} */ ([]));

    const pushModal = useCallback(
        /** @param {string} id */
        (id) => {
            setStack((prev) => [...prev, id]);
        },
        [],
    );

    const popModal = useCallback(
        /** @param {string} id */
        (id) => {
            setStack((prev) => prev.filter((mid) => mid !== id));
        },
        [],
    );

    const isTopModal = useCallback(
        /** @param {string} id */
        (id) => {
            return stack.length > 0 && stack[stack.length - 1] === id;
        },
        [stack],
    );

    const getModalZIndex = useCallback(
        /** @param {string} id */
        (id) => {
            const index = stack.indexOf(id);
            return index === -1 ? 40 : 40 + index;
        },
        [stack],
    );

    const isAnyModalOpen = stack.length > 0;

    useEffect(() => {
        /** @param {KeyboardEvent} e */
        const handleKeyDown = (e) => {
            if (e.key !== "Escape") {
                return;
            }

            if (stack.length === 0) {
                return;
            }

            const topId = stack[stack.length - 1];
            const customEvent = new CustomEvent(MODAL_STACK_ESCAPE, {
                detail: { id: topId },
            });
            window.dispatchEvent(customEvent);
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [stack]);

    return (
        <ModalStackContext.Provider
            value={{
                pushModal,
                popModal,
                isTopModal,
                getModalZIndex,
                isAnyModalOpen,
            }}
        >
            {children}
        </ModalStackContext.Provider>
    );
};

export default ModalStackContext;
