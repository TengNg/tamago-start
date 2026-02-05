import { createContext, useMemo, useState } from "react";

const DURATION = 3000;

export const ToastContext = createContext({});

export const ToastContextProvider = ({ children }) => {
    const [state, setState] = useState({
        show: false,
        title: "",
        message: "",
        type: "success",
    });

    const close = () => {
        setState((prev) => {
            return {
                ...prev,
                show: false,
                title: "",
                message: "",
            };
        });
    };

    const show = ({
        type,
        title = type === "success" ? "Success" : "Error",
        message,
    }) => {
        setState({
            show: true,
            title,
            message,
            type,
        });
    };

    const success = (msg) => {
        show({
            type: "success",
            title: "Success",
            message: msg,
        });
    };

    const error = (msg) => {
        show({
            type: "error",
            title: "Error",
            message: msg,
        });
    };

    useEffect(() => {
        let id = null;
        if (show) {
            id = setTimeout(() => {
                close();
            }, DURATION);
        }

        return () => {
            if (id) {
                clearTimeout(id);
            }
        };
    }, [show]);

    const toast = useMemo(() => {
        return { success, error };
    }, [state]);

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
        </ToastContext.Provider>
    );
};
