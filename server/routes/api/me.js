import express from 'express';
const router = express.Router();
const pinnedBoardRouter = express.Router();

import {
    getCurrentUser,
    updateUsername,
    updatePassword,
    addPinnedBoard,
    deletePinnedBoard,
    reorderPinnedBoard,
    cleanPinnedBoards,
} from "../../controllers/userController.js";

router.route("/")
    .get(getCurrentUser);

router.route("/username")
    .patch(updateUsername);

router.route("/password")
    .patch(updatePassword);

// pinned-boards router

router.use("/pinned-boards", pinnedBoardRouter);

pinnedBoardRouter.route("/:id")
    .patch(addPinnedBoard)
    .delete(deletePinnedBoard)

pinnedBoardRouter.route("/:id/reorder")
    .patch(reorderPinnedBoard)

pinnedBoardRouter.route("/")
    .delete(cleanPinnedBoards)

export default router;
