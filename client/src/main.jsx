import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CurrentUserContextProvider } from "./context/CurrentUserContext.jsx";

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
            <CurrentUserContextProvider>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </CurrentUserContextProvider>
        </QueryClientProvider>
    </React.StrictMode>,
);
