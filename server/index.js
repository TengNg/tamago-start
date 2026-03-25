require('dotenv').config();

const mongoose = require("mongoose");
mongoose.set("strictQuery", true);
mongoose
    .connect(process.env.DB_CONNECTION)
    .catch((err) => console.log(err));

const express = require("express");
const errorHandler = require('./middlewares/errorHandler');
const notFoundHandler = require('./middlewares/notFoundHandler');
const credentials = require('./middlewares/credentials');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const app = express();

app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

app.use(credentials);
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json())
if (process.env.MODE !== "production") {
    const cors = require("cors");
    app.use(cors({
        origin: true,
        credentials: true,
        optionsSuccessStatus: 200
    }));
}

// api-router
const apiRouter = require("./routes/api/index");
app.use("/api", apiRouter);

// prod-setup
if (process.env.MODE === "production") {
    const path = require('path');
    const buildPath = path.join(__dirname, "../client/dist");
    app.use(express.static(buildPath));
    app.get("/*splat", (req, res) => {
        if (req.originalUrl.startsWith("/api")) {
            res.status(404).json({ message: "API route not found" });
        } else {
            res.sendFile(`${buildPath}/index.html`);
        }
    });
}

app.use(notFoundHandler);
app.use(errorHandler);

// init socket =================================================================

const { initSocket } = require('./socket');
const { createServer } = require('http');
const server = createServer(app);
initSocket(server);

const PORT = process.env.PORT || 3001;
if (process.env.MODE !== 'test') {
    server.listen(PORT, () => console.log(`app is listening on PORT ${PORT}`));
}
