declare type ToastItem = {
    id: string;
    type: "success" | "error";
    message: string;
    timeoutId: ReturnType<typeof setTimeout> | null;
};

declare type ToastContextValue = {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
};
