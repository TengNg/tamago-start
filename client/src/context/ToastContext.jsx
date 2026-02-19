import { createContext, useCallback, useState } from "react";
import Toast from "../components/shared/Toast";

const DURATION = 3000;
const AUTOCLOSE = true;

export const ToastContext = createContext({});
export default ToastContext;

export const ToastContextProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => {
            const toast = prev.find((t) => t.id === id);
            if (toast?.timeoutId) {
                clearTimeout(toast.timeoutId);
            }
            return prev.filter((t) => t.id !== id);
        });
    }, []);

    const addToast = useCallback(
        ({ type, message, duration }) => {
            const id = crypto.randomUUID();
            const toastDuration =
                duration ?? (AUTOCLOSE ? DURATION : undefined);

            let timeoutId = null;
            if (toastDuration && toastDuration > 0) {
                timeoutId = setTimeout(() => {
                    removeToast(id);
                }, toastDuration);
            }

            setToasts((prev) => [...prev, { id, type, message, timeoutId }]);
        },
        [removeToast],
    );

    const success = useCallback(
        (message, duration) => {
            addToast({ type: "success", message, duration });
        },
        [addToast],
    );

    const error = useCallback(
        (message, duration) => {
            addToast({ type: "error", message, duration });
        },
        [addToast],
    );

    return (
        <ToastContext.Provider value={{ success, error }}>
            {children}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col justify-end items-end gap-1">
                {toasts.map((toastItem) => (
                    <Toast
                        key={toastItem.id}
                        message={toastItem.message}
                        type={toastItem.type}
                        onClose={() => removeToast(toastItem.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
};
