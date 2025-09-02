require('dotenv').config();

const express = require("express");
const mongoose = require("mongoose");

const errorHandler = require('./middlewares/errorHandler');
const credentials = require('./middlewares/credentials');
const rateLimiter = require('./middlewares/rateLimiter');

const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const app = express();

mongoose.set("strictQuery", true);
mongoose
    .connect(process.env.DB_CONNECTION)
    .catch((err) => console.log(err));

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

// (discord)
app.use(require('./routes/api/discord'));

// (auth)
app.use("/api/register", rateLimiter, require("./routes/api/register"));
app.use("/api/login", rateLimiter, require("./routes/api/login"));
app.use("/api/logout", require("./routes/api/logout"));

// (require-auth)
app.use(require("./middlewares/authenticateToken"));
app.use("/api/me", require("./routes/api/me"));
app.use("/api/boards", require("./routes/api/boards"));
app.use("/api/lists", require("./routes/api/lists"));
app.use("/api/cards", require("./routes/api/cards"));
app.use("/api/invitations", require("./routes/api/invitations"));
app.use("/api/chats", require("./routes/api/chats"));
app.use("/api/join_board_requests", require("./routes/api/joinBoardRequests"));
app.use("/api/account", require("./routes/api/account"));
app.use("/api/personal_writedowns", require("./routes/api/writedowns"));
app.use("/api/board_activities", require("./routes/api/boardActivities"));

// (prod-setup)
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

app.use(errorHandler);

// Init socket =================================================================

const { initSocket } = require('./socket.js');
const { createServer } = require('http');
const server = createServer(app);
initSocket(server);

const PORT = process.env.PORT || 3001;
if (process.env.MODE !== 'test') {
    server.listen(PORT, () => console.log(`app is listening on PORT ${PORT}`));
}
