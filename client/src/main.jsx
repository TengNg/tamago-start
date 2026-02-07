import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CurrentUserContextProvider } from "./context/CurrentUserContext.jsx";
import { ToastContextProvider } from "./context/ToastContext.jsx";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
            refetchOnMount: false,
            refetchOnWindowFocus: false,
        },
    },
});

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <ToastContextProvider>
                <CurrentUserContextProvider>
                    <BrowserRouter>
                        <App />
                    </BrowserRouter>
                </CurrentUserContextProvider>
            </ToastContextProvider>
        </QueryClientProvider>
    </React.StrictMode>,
);
