import "dotenv/config";

import express from "express";
import errorHandler from './middlewares/errorHandler.js';
import notFoundHandler from './middlewares/notFoundHandler.js';
import cookieParser from 'cookie-parser';
import path from 'path';
import cors from 'cors';

import mongoose from "mongoose";
import { initSocket } from './socket/index.js';
import { createServer } from 'http';

import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const app = express();

app.disable('x-powered-by');

app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
});

if (process.env.NODE_ENV !== "production") {
    app.use(cors({
        origin: true,
        credentials: true,
        optionsSuccessStatus: 200
    }));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// api-router
import apiRouter from "./routes/api/index.js";
app.use("/api", apiRouter);

// prod-setup
if (process.env.NODE_ENV === "production") {
    const filename = fileURLToPath(import.meta.url);
    const buildPath = path.join(dirname(filename), "../client/dist");
    app.use(express.static(buildPath));
    app.get("/*splat", (req, res) => {
        if (req.originalUrl.startsWith("/api")) {
            res.status(404).json({ message: "API route not found" });
        } else {
            res.sendFile(path.join(buildPath, 'index.html'));
        }
    });
}

app.use(notFoundHandler);
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
    mongoose.set("strictQuery", true);
    mongoose.connect(process.env.DB_CONNECTION).catch(e => console.log(e));

    const server = createServer(app);
    initSocket(server);

    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => console.log(`app is listening on PORT ${PORT}`));
}

export default app;
