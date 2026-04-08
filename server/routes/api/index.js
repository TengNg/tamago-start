import { Router } from "express";
const apiRouter = Router();

import authenticateToken from '../../middlewares/authenticateToken.js';
import rateLimiter from '../../middlewares/rateLimiter.js';

// routes
import discordRoutes from '../../routes/api/discord.js';
import registerRoutes from '../../routes/api/register.js';
import loginRoutes from '../../routes/api/login.js';
import logoutRoutes from '../../routes/api/logout.js';
import meRoutes from '../../routes/api/me.js';
import boardsRoutes from '../../routes/api/boards.js';
import listsRoutes from '../../routes/api/lists.js';
import cardsRoutes from '../../routes/api/cards.js';
import invitationsRoutes from '../../routes/api/invitations.js';
import chatsRoutes from '../../routes/api/chats.js';
import joinBoardRequestsRoutes from '../../routes/api/joinBoardRequests.js';
import writedownsRoutes from '../../routes/api/writedowns.js';
import boardActivitiesRoutes from '../../routes/api/boardActivities.js';
import attachmentsRoutes from '../../routes/api/attachments.js';

// discord
apiRouter.use(discordRoutes);

// auth
apiRouter.use("/register", rateLimiter, registerRoutes);
apiRouter.use("/login", rateLimiter, loginRoutes);
apiRouter.use("/logout", logoutRoutes);

// require-auth
apiRouter.use(authenticateToken);
apiRouter.use("/me", meRoutes);
apiRouter.use("/boards", boardsRoutes);
apiRouter.use("/lists", listsRoutes);
apiRouter.use("/cards", cardsRoutes);
apiRouter.use("/invitations", invitationsRoutes);
apiRouter.use("/chats", chatsRoutes);
apiRouter.use("/join_board_requests", joinBoardRequestsRoutes);
apiRouter.use("/personal_writedowns", writedownsRoutes);
apiRouter.use("/board_activities", boardActivitiesRoutes);
apiRouter.use("/attachments", attachmentsRoutes);

export default apiRouter;
