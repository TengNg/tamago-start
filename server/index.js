require('dotenv').config();

const express = require("express");
const mongoose = require("mongoose");

const errorHandler = require('./middlewares/errorHandler');
const credentials = require('./middlewares/credentials');
const rateLimiter = require('./middlewares/rateLimiter');

const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const app = express();
const apiRouter = express.Router();

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
apiRouter.use(require('./routes/api/discord'));

// (auth)
apiRouter.use("/register", rateLimiter, require("./routes/api/register"));
apiRouter.use("/login", rateLimiter, require("./routes/api/login"));
apiRouter.use("/logout", require("./routes/api/logout"));

// (require-auth)
apiRouter.use(require("./middlewares/authenticateToken"));
apiRouter.use("/me", require("./routes/api/me"));
apiRouter.use("/boards", require("./routes/api/boards"));
apiRouter.use("/lists", require("./routes/api/lists"));
apiRouter.use("/cards", require("./routes/api/cards"));
apiRouter.use("/invitations", require("./routes/api/invitations"));
apiRouter.use("/chats", require("./routes/api/chats"));
apiRouter.use("/join_board_requests", require("./routes/api/joinBoardRequests"));
apiRouter.use("/account", require("./routes/api/account"));
apiRouter.use("/personal_writedowns", require("./routes/api/writedowns"));
apiRouter.use("/board_activities", require("./routes/api/boardActivities"));

// (mount api-routers)
app.use("/api", apiRouter);

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
