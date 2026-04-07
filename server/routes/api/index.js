import { Router } from "express";
const apiRouter = Router();

import authenticateToken from '../../middlewares/authenticateToken.js';
import rateLimiter from '../../middlewares/rateLimiter.js';

// discord
apiRouter.use(require('../../routes/api/discord'));

// auth
apiRouter.use("/register", rateLimiter, require("../../routes/api/register"));
apiRouter.use("/login", rateLimiter, require("../../routes/api/login"));
apiRouter.use("/logout", require("../../routes/api/logout"));

// require-auth
apiRouter.use(authenticateToken);
apiRouter.use("/me", require("../../routes/api/me"));
apiRouter.use("/boards", require("../../routes/api/boards"));
apiRouter.use("/lists", require("../../routes/api/lists"));
apiRouter.use("/cards", require("../../routes/api/cards"));
apiRouter.use("/invitations", require("../../routes/api/invitations"));
apiRouter.use("/chats", require("../../routes/api/chats"));
apiRouter.use("/join_board_requests", require("../../routes/api/joinBoardRequests"));
apiRouter.use("/account", require("../../routes/api/account"));
apiRouter.use("/personal_writedowns", require("../../routes/api/writedowns"));
apiRouter.use("/board_activities", require("../../routes/api/boardActivities"));
apiRouter.use("/attachments", require("../../routes/api/attachments"));

export default apiRouter;
