import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthContextProvider } from "./context/AuthContext.jsx";
import { ToastContextProvider } from "./context/ToastContext.jsx";
import { KeybindProvider } from "./context/KeybindContext.jsx";
import { ModalStackProvider } from "./context/ModalStackContext.jsx";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
            refetchOnWindowFocus: false,
        },
    },
});

ReactDOM.createRoot(
    /** @type {HTMLElement} */ (document.getElementById("root")),
).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <ToastContextProvider>
                <KeybindProvider>
                    <ModalStackProvider>
                        <AuthContextProvider>
                            <BrowserRouter>
                                <App />
                            </BrowserRouter>
                        </AuthContextProvider>
                    </ModalStackProvider>
                </KeybindProvider>
            </ToastContextProvider>
        </QueryClientProvider>
    </React.StrictMode>,
);
